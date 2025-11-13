from fastapi.testclient import TestClient
from main import app, device

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "device" in data

def test_generate_image():
    """Test image generation endpoint"""
    payload = {
        "seed": 12345,
        "resolution": 256,
        "style": "abstract"
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"
    assert data["seed"] == 12345
    assert "id" in data
    assert "latent" in data

def test_generate_with_latent():
    """Test generation with custom latent vector"""
    latent = [0.1] * 100
    payload = {
        "latent_vector": latent,
        "resolution": 256
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["latent"] == latent

def test_invalid_resolution():
    """Test invalid resolution"""
    payload = {"resolution": 300}
    response = client.post("/generate", json=payload)
    assert response.status_code == 400

def test_invalid_latent_dimension():
    """Test invalid latent vector dimension"""
    payload = {"latent_vector": [0.1] * 50}
    response = client.post("/generate", json=payload)
    assert response.status_code == 400

def test_get_result():
    """Test getting generation result"""
    # First create a job
    payload = {"seed": 12345}
    response = client.post("/generate", json=payload)
    job_id = response.json()["id"]
    
    # Get result
    response = client.get(f"/result/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == job_id
    assert data["seed"] == 12345

def test_get_nonexistent_result():
    """Test getting nonexistent job result"""
    response = client.get("/result/nonexistent")
    assert response.status_code == 404