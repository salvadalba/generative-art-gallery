#!/bin/bash

# Script to update Kubernetes secrets with actual values
echo "Updating Kubernetes secrets..."

# Update these with your actual secrets
echo -n "Enter database password: "
read -s DB_PASSWORD
echo

echo -n "Enter IPFS API key: "
read -s IPFS_API_KEY
echo

echo -n "Enter IPFS API secret: "
read -s IPFS_API_SECRET
echo

echo -n "Enter contract address: "
read CONTRACT_ADDRESS
echo

echo -n "Enter Infura project ID: "
read INFURA_PROJECT_ID
echo

# Create updated secret
kubectl create secret generic gallery-secrets \
  --from-literal=db-password="$DB_PASSWORD" \
  --from-literal=database-url="postgresql://postgres:$DB_PASSWORD@postgres-service:5432/artgallery" \
  --from-literal=ipfs-api-key="$IPFS_API_KEY" \
  --from-literal=ipfs-api-secret="$IPFS_API_SECRET" \
  --from-literal=contract-address="$CONTRACT_ADDRESS" \
  --from-literal=infura-project-id="$INFURA_PROJECT_ID" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=sentry-dsn="" \
  --namespace=generative-art-gallery \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets updated successfully!"
