#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="generative-art-gallery"
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
ARTIFACTS_DIR="deployment/artifacts/${VERSION}"

echo -e "${BLUE}📦 Packaging deployment artifacts for ${PROJECT_NAME} v${VERSION}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Create artifacts directory
setup_artifacts() {
    echo -e "${BLUE}🏗️  Setting up artifacts directory...${NC}"
    
    mkdir -p "${ARTIFACTS_DIR}"
    mkdir -p "${ARTIFACTS_DIR}/docker"
    mkdir -p "${ARTIFACTS_DIR}/kubernetes"
    mkdir -p "${ARTIFACTS_DIR}/contracts"
    mkdir -p "${ARTIFACTS_DIR}/scripts"
    mkdir -p "${ARTIFACTS_DIR}/docs"
    
    print_status "Artifacts directory created: ${ARTIFACTS_DIR}"
}

# Package Docker artifacts
package_docker() {
    echo -e "${BLUE}🐳 Packaging Docker artifacts...${NC}"
    
    # Copy Docker files
    cp deployment/docker-compose.yml "${ARTIFACTS_DIR}/docker/"
    cp deployment/frontend.Dockerfile "${ARTIFACTS_DIR}/docker/"
    cp deployment/gan-service.Dockerfile "${ARTIFACTS_DIR}/docker/"
    cp deployment/nginx.conf "${ARTIFACTS_DIR}/docker/"
    cp deployment/.env.template "${ARTIFACTS_DIR}/docker/"
    
    # Create Docker build script
    cat > "${ARTIFACTS_DIR}/docker/build-images.sh" << 'EOF'
#!/bin/bash
set -e

echo "Building Docker images..."

docker build -f frontend.Dockerfile -t generative-art-gallery-frontend:latest .
docker build -f gan-service.Dockerfile -t generative-art-gallery-gan-service:latest .

echo "Docker images built successfully!"
echo "Frontend: generative-art-gallery-frontend:latest"
echo "GAN Service: generative-art-gallery-gan-service:latest"
EOF
    
    chmod +x "${ARTIFACTS_DIR}/docker/build-images.sh"
    
    # Create Docker deployment script
    cat > "${ARTIFACTS_DIR}/docker/deploy.sh" << 'EOF'
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
EOF
    
    chmod +x "${ARTIFACTS_DIR}/docker/deploy.sh"
    
    print_status "Docker artifacts packaged"
}

# Package Kubernetes artifacts
package_kubernetes() {
    echo -e "${BLUE}☸️  Packaging Kubernetes artifacts...${NC}"
    
    # Copy Kubernetes manifests
    cp deployment/kubernetes/*.yaml "${ARTIFACTS_DIR}/kubernetes/"
    
    # Create deployment script
    cat > "${ARTIFACTS_DIR}/kubernetes/deploy.sh" << 'EOF'
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
EOF
    
    chmod +x "${ARTIFACTS_DIR}/kubernetes/deploy.sh"
    
    # Create update secrets script
    cat > "${ARTIFACTS_DIR}/kubernetes/update-secrets.sh" << 'EOF'
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
EOF
    
    chmod +x "${ARTIFACTS_DIR}/kubernetes/update-secrets.sh"
    
    print_status "Kubernetes artifacts packaged"
}

# Package smart contracts
package_contracts() {
    echo -e "${BLUE}🔐 Packaging smart contracts...${NC}"
    
    # Copy contract files
    cp -r contracts/* "${ARTIFACTS_DIR}/contracts/" 2>/dev/null || print_warning "No contracts directory found"
    
    # Create deployment script
    cat > "${ARTIFACTS_DIR}/contracts/deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "Deploying smart contracts..."

# Install dependencies
npm install

# Run tests
npm test

# Deploy to network
echo "Select network:"
echo "1. Localhost"
echo "2. Goerli testnet"
echo "3. Mainnet"
echo -n "Choice: "
read NETWORK_CHOICE

case $NETWORK_CHOICE in
    1)
        NETWORK="localhost"
        ;;
    2)
        NETWORK="goerli"
        ;;
    3)
        NETWORK="mainnet"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo "Deploying to $NETWORK..."
npx hardhat run scripts/deploy.js --network $NETWORK

echo "Contract deployment completed!"
EOF
    
    chmod +x "${ARTIFACTS_DIR}/contracts/deploy.sh"
    
    print_status "Smart contracts packaged"
}

# Create deployment documentation
create_docs() {
    echo -e "${BLUE}📚 Creating deployment documentation...${NC}"
    
    # Create README
    cat > "${ARTIFACTS_DIR}/README.md" << EOF
# Generative Art Gallery - Deployment Artifacts v${VERSION}

This package contains all deployment artifacts for the Generative Art Gallery application.

## Contents

### Docker Deployment
- \`docker-compose.yml\` - Multi-service Docker composition
- \`frontend.Dockerfile\` - Frontend application container
- \`gan-service.Dockerfile\` - GAN service container
- \`nginx.conf\` - Nginx configuration
- \`.env.template\` - Environment variables template
- \`build-images.sh\` - Script to build Docker images
- \`deploy.sh\` - Script to deploy with Docker Compose

### Kubernetes Deployment
- \`namespace.yaml\` - Kubernetes namespace
- \`secrets.yaml\` - Kubernetes secrets (update with your values)
- \`persistent-volumes.yaml\` - Persistent volume claims
- \`redis-deployment.yaml\` - Redis deployment
- \`postgres-deployment.yaml\` - PostgreSQL deployment
- \`gan-service-deployment.yaml\` - GAN service deployment
- \`frontend-deployment.yaml\` - Frontend deployment
- \`ingress.yaml\` - Ingress configuration
- \`deploy.sh\` - Main deployment script
- \`update-secrets.sh\` - Script to update secrets

### Smart Contracts
- Contract source code and deployment scripts
- \`deploy.sh\` - Contract deployment script

## Quick Start

### Docker Deployment
\`\`\`bash
cd docker
cp .env.template .env
# Edit .env with your configuration
./build-images.sh
./deploy.sh
\`\`\`

### Kubernetes Deployment
\`\`\`bash
cd kubernetes
./update-secrets.sh  # Enter your secrets when prompted
./deploy.sh
\`\`\`

### Smart Contract Deployment
\`\`\`bash
cd contracts
./deploy.sh
\`\`\`

## Configuration

### Required Environment Variables
- \`DB_PASSWORD\` - Database password
- \`IPFS_API_KEY\` - IPFS API key
- \`IPFS_API_SECRET\` - IPFS API secret
- \`CONTRACT_ADDRESS\` - Smart contract address
- \`INFURA_PROJECT_ID\` - Infura project ID

### Optional Configuration
- SSL certificates for HTTPS
- Custom domain names
- Monitoring and logging services

## Security Notes

- Update all default passwords and secrets
- Configure proper firewall rules
- Enable SSL/TLS for production
- Set up monitoring and alerting
- Regular security updates

## Support

For deployment issues, check:
1. Environment variables are correctly set
2. All required services are running
3. Network connectivity between services
4. Logs for error messages

Generated on: $(date)
EOF
    
    # Create deployment checklist
    cat > "${ARTIFACTS_DIR}/DEPLOYMENT_CHECKLIST.md" << 'EOF'
# Deployment Checklist

## Pre-deployment
- [ ] All environment variables configured
- [ ] SSL certificates obtained (for production)
- [ ] Domain names configured
- [ ] Docker images built and tested
- [ ] Smart contracts deployed
- [ ] Database migrations completed

## Security
- [ ] Default passwords changed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] SSL/TLS configured
- [ ] Secrets properly stored
- [ ] Access controls configured

## Monitoring
- [ ] Health checks configured
- [ ] Logging configured
- [ ] Monitoring dashboards set up
- [ ] Alerting configured
- [ ] Backup procedures defined

## Post-deployment
- [ ] Application accessible
- [ ] API endpoints working
- [ ] Art generation functional
- [ ] NFT minting working
- [ ] Gallery displaying correctly
- [ ] Wallet connection working

## Performance
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Resource usage optimized
- [ ] Caching configured
- [ ] CDN configured (if applicable)

## Documentation
- [ ] Deployment documentation updated
- [ ] API documentation current
- [ ] User documentation available
- [ ] Operational runbooks created
- [ ] Troubleshooting guide available
EOF
    
    print_status "Documentation created"
}

# Create deployment scripts
package_scripts() {
    echo -e "${BLUE}📝 Packaging deployment scripts...${NC}"
    
    # Copy main deployment script
    cp deployment/deploy.sh "${ARTIFACTS_DIR}/scripts/"
    chmod +x "${ARTIFACTS_DIR}/scripts/deploy.sh"
    
    # Create health check script
    cat > "${ARTIFACTS_DIR}/scripts/health-check.sh" << 'EOF'
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
EOF
    
    chmod +x "${ARTIFACTS_DIR}/scripts/health-check.sh"
    
    # Create cleanup script
    cat > "${ARTIFACTS_DIR}/scripts/cleanup.sh" << 'EOF'
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
EOF
    
    chmod +x "${ARTIFACTS_DIR}/scripts/cleanup.sh"
    
    print_status "Deployment scripts packaged"
}

# Create artifact manifest
create_manifest() {
    echo -e "${BLUE}📋 Creating artifact manifest...${NC}"
    
    cat > "${ARTIFACTS_DIR}/MANIFEST.md" << EOF
# Deployment Artifacts Manifest

**Version:** ${VERSION}
**Generated:** $(date)
**Project:** Generative Art Gallery

## Package Contents

### Docker Artifacts
$(cd "${ARTIFACTS_DIR}/docker" && find . -type f -name "*.yml" -o -name "*.yaml" -o -name "*.Dockerfile" -o -name "*.conf" -o -name "*.sh" -o -name "*.template" | sort)

### Kubernetes Artifacts
$(cd "${ARTIFACTS_DIR}/kubernetes" && find . -type f -name "*.yaml" -o -name "*.sh" | sort)

### Smart Contract Artifacts
$(cd "${ARTIFACTS_DIR}/contracts" && find . -type f \( -name "*.sol" -o -name "*.js" -o -name "*.json" -o -name "*.md" \) 2>/dev/null | sort || echo "No contract files found")

### Scripts
$(cd "${ARTIFACTS_DIR}/scripts" && find . -type f -name "*.sh" | sort)

### Documentation
$(cd "${ARTIFACTS_DIR}" && find . -maxdepth 1 -type f -name "*.md" | sort)

## File Sizes
$(cd "${ARTIFACTS_DIR}" && find . -type f -exec ls -lh {} \; | awk '{print \$9 " - " \$5}' | sort)

## Checksums
$(cd "${ARTIFACTS_DIR}" && find . -type f -exec sha256sum {} \; | sort)

EOF
    
    print_status "Artifact manifest created"
}

# Main packaging function
main() {
    echo -e "${BLUE}🚀 Starting artifact packaging process...${NC}"
    
    setup_artifacts
    package_docker
    package_kubernetes
    package_contracts
    package_scripts
    create_docs
    create_manifest
    
    # Create compressed archive
    echo -e "${BLUE}📦 Creating compressed archive...${NC}"
    cd deployment/artifacts
    tar -czf "${PROJECT_NAME}-deployment-${VERSION}.tar.gz" "${VERSION}"
    
    print_status "Artifact packaging completed!"
    echo -e "${GREEN}📊 Artifacts saved to: ${ARTIFACTS_DIR}${NC}"
    echo -e "${GREEN}📦 Archive created: deployment/artifacts/${PROJECT_NAME}-deployment-${VERSION}.tar.gz${NC}"
    echo -e "${GREEN}📖 Main documentation: ${ARTIFACTS_DIR}/README.md${NC}"
}

# Handle script interruption
trap 'print_error "Packaging interrupted"; exit 1' INT TERM

# Run main function
main "$@"