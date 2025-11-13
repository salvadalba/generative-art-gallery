#!/bin/bash
set -e

NAMESPACE="generative-art-gallery"

echo "Deploying to Kubernetes..."

# Create namespace
kubectl apply -f namespace.yaml

# Create secrets (update with your base64 encoded values)
echo "Creating secrets..."
kubectl apply -f secrets.yaml

# Create persistent volumes
echo "Creating persistent volumes..."
kubectl apply -f persistent-volumes.yaml

# Deploy services
echo "Deploying Redis..."
kubectl apply -f redis-deployment.yaml

echo "Deploying PostgreSQL..."
kubectl apply -f postgres-deployment.yaml

echo "Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s

echo "Deploying GAN service..."
kubectl apply -f gan-service-deployment.yaml

echo "Deploying frontend..."
kubectl apply -f frontend-deployment.yaml

echo "Deploying ingress..."
kubectl apply -f ingress.yaml

echo "Kubernetes deployment completed!"
echo "Check status with: kubectl get pods -n ${NAMESPACE}"
