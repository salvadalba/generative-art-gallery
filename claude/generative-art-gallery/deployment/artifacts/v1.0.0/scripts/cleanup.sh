#!/bin/bash

echo "Cleaning up deployment..."

# Stop Docker Compose if running
if [ -f "docker-compose.yml" ]; then
    docker-compose down -v
    echo "Docker Compose stopped and volumes removed"
fi

# Remove Docker images
docker rmi generative-art-gallery-frontend:latest generative-art-gallery-gan-service:latest 2>/dev/null || true

# Clean up Kubernetes if deployed
kubectl delete namespace generative-art-gallery 2>/dev/null || true

echo "Cleanup completed!"
