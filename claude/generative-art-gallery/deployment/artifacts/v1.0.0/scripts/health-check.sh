#!/bin/bash

# Health check script for deployed services
echo "Checking service health..."

# Check frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend health check failed"
fi

# Check GAN service
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ GAN service is healthy"
else
    echo "✗ GAN service health check failed"
fi

# Check Redis (if using Docker Compose)
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✓ Redis is healthy"
else
    echo "✗ Redis health check failed"
fi

# Check PostgreSQL (if using Docker Compose)
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL is healthy"
else
    echo "✗ PostgreSQL health check failed"
fi

echo "Health check completed!"
