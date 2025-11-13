#!/bin/bash

# GAN Service Deployment Script
echo "🚀 Deploying GAN Service Backend..."

# Build and test the service
echo "📦 Building Docker image..."
docker build -t gan-service:latest .

# Run health check
echo "🏥 Running health check..."
docker run -d -p 8000:8000 --name gan-service gan-service:latest
sleep 10

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
echo "Health check response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs gan-service
    exit 1
fi

# Stop the test container
docker stop gan-service
docker rm gan-service

echo "✅ GAN Service deployment ready!"
echo "📋 Service Configuration:"
echo "   - Port: 8000"
echo "   - Health Check: /health"
echo "   - Generate Endpoint: POST /generate"
echo "   - Status Endpoint: GET /status/{job_id}"
echo ""
echo "🎯 To deploy to production:"
echo "   1. Push to container registry"
echo "   2. Deploy to cloud platform (Railway, Render, etc.)"
echo "   3. Update frontend API_URL environment variable"