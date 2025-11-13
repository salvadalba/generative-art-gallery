# GAN Art Generation Service

FastAPI service for generating art using GAN models with deterministic seeding.

## Setup

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

The service will start on http://localhost:8000

## API Endpoints

### Health Check
```http
GET /health
```

### Generate Image
```http
POST /generate
Content-Type: application/json

{
  "seed": 12345,
  "style": "abstract",
  "resolution": 512,
  "latent_vector": [0.1, 0.2, ...] // optional, 100 dimensions
}
```

### Get Result
```http
GET /result/{job_id}
```

## Testing

```bash
pytest test_main.py -v
```

## Notes

- This is a placeholder implementation with a simple MLP generator
- Replace with actual GAN model (StyleGAN2/3) for production
- Supports CPU fallback with optional GPU acceleration
- Deterministic seeding ensures reproducible results