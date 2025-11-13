from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
import io
import base64
import uuid
import time
from concurrent.futures import ThreadPoolExecutor
import asyncio

app = FastAPI(title="GAN Art Generator", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Generator Network (placeholder - replace with real GAN)
class SimpleGenerator(nn.Module):
    def __init__(self, latent_dim=100, img_size=256):
        super().__init__()
        self.latent_dim = latent_dim
        self.img_size = img_size
        
        # Simple MLP generator for demonstration
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.Linear(1024, img_size * img_size * 3),
            nn.Tanh()
        )
    
    def forward(self, z):
        img = self.model(z)
        img = img.view(img.size(0), 3, self.img_size, self.img_size)
        return img

# Initialize model (CPU fallback)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
generator = SimpleGenerator(latent_dim=100, img_size=256).to(device)
generator.eval()

# Job queue
jobs = {}
executor = ThreadPoolExecutor(max_workers=2)

class GenerateRequest(BaseModel):
    seed: Optional[int] = None
    style: Optional[str] = "abstract"
    resolution: Optional[int] = 512
    latent_vector: Optional[list[float]] = None

class GenerateResponse(BaseModel):
    id: str
    status: str
    image_url: Optional[str] = None
    seed: int
    latent: list[float]
    checksum: str

@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Generate art image using GAN"""
    job_id = str(uuid.uuid4())
    
    # Validate resolution
    if request.resolution and request.resolution not in [256, 512, 1024]:
        raise HTTPException(status_code=400, detail="Resolution must be 256, 512, or 1024")
    
    # Generate or use provided seed
    seed = request.seed if request.seed is not None else np.random.randint(0, 1000000)
    
    # Create latent vector
    if request.latent_vector:
        if len(request.latent_vector) != 100:
            raise HTTPException(status_code=400, detail="Latent vector must have 100 dimensions")
        latent = torch.tensor(request.latent_vector, dtype=torch.float32).unsqueeze(0)
    else:
        torch.manual_seed(seed)
        latent = torch.randn(1, 100)
    
    # Store job
    jobs[job_id] = {
        "status": "processing",
        "seed": seed,
        "latent": latent.squeeze(0).tolist(),
        "created_at": time.time()
    }
    
    # Process in background
    background_tasks.add_task(process_generation, job_id, latent, request.resolution or 512)
    
    return GenerateResponse(
        id=job_id,
        status="processing",
        seed=seed,
        latent=latent.squeeze(0).tolist(),
        checksum="pending"
    )

@app.get("/result/{job_id}", response_model=GenerateResponse)
async def get_result(job_id: str):
    """Get generation result"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return GenerateResponse(
        id=job_id,
        status=job["status"],
        image_url=job.get("image_url"),
        seed=job["seed"],
        latent=job["latent"],
        checksum=job.get("checksum", "pending")
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "device": str(device), "model_loaded": True}

def process_generation(job_id: str, latent: torch.Tensor, resolution: int):
    """Process image generation"""
    try:
        with torch.no_grad():
            # Generate image (placeholder logic)
            # In real implementation, use actual GAN model
            img_tensor = generator(latent.to(device))
            
            # Convert to PIL Image
            img_array = img_tensor.squeeze(0).cpu().numpy()
            img_array = ((img_array + 1) * 127.5).astype(np.uint8)
            img_array = np.transpose(img_array, (1, 2, 0))
            
            # Resize if needed
            img = Image.fromarray(img_array)
            if resolution != 256:
                img = img.resize((resolution, resolution), Image.LANCZOS)
            
            # Convert to base64
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            # Update job
            jobs[job_id].update({
                "status": "completed",
                "image_url": f"data:image/png;base64,{img_base64}",
                "checksum": str(hash(img_base64))
            })
            
    except Exception as e:
        jobs[job_id].update({
            "status": "failed",
            "error": str(e)
        })

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "service": "gan-art-generator",
        "version": "1.0.0",
        "model_loaded": generator is not None,
        "device": str(device),
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)