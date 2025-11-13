#!/bin/bash
set -e

echo "Deploying with Docker Compose..."

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    cp .env.template .env
    echo "Created .env file from template. Please update it with your configuration."
fi

# Deploy services
docker-compose up -d

echo "Deployment completed! Check status with: docker-compose ps"
