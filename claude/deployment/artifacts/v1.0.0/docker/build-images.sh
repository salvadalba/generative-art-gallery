#!/bin/bash
set -e

echo "Building Docker images..."

docker build -f frontend.Dockerfile -t generative-art-gallery-frontend:latest .
docker build -f gan-service.Dockerfile -t generative-art-gallery-gan-service:latest .

echo "Docker images built successfully!"
echo "Frontend: generative-art-gallery-frontend:latest"
echo "GAN Service: generative-art-gallery-gan-service:latest"
