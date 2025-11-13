#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="generative-art-gallery"
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}

echo -e "${GREEN}🚀 Starting deployment for ${PROJECT_NAME} (${ENVIRONMENT})${NC}"

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

# Check prerequisites
check_prerequisites() {
    echo -e "${GREEN}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "All prerequisites met"
}

# Build frontend
build_frontend() {
    echo -e "${GREEN}🏗️  Building frontend...${NC}"
    
    # Install dependencies
    npm ci
    
    # Run tests
    npm run test:unit
    
    # Build for production
    npm run build
    
    print_status "Frontend built successfully"
}

# Build Docker images
build_images() {
    echo -e "${GREEN}🐳 Building Docker images...${NC}"
    
    # Build frontend image
    docker build -f deployment/frontend.Dockerfile -t ${PROJECT_NAME}-frontend:latest .
    
    # Build GAN service image
    docker build -f deployment/gan-service.Dockerfile -t ${PROJECT_NAME}-gan-service:latest .
    
    print_status "Docker images built successfully"
}

# Deploy with Docker Compose
deploy_compose() {
    echo -e "${GREEN}📦 Deploying with Docker Compose...${NC}"
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning "Creating .env file from template"
        cp deployment/.env.template .env
    fi
    
    # Pull latest images
    docker-compose pull
    
    # Deploy services
    docker-compose up -d
    
    # Wait for services to be ready
    echo -e "${GREEN}⏳ Waiting for services to be ready...${NC}"
    sleep 30
    
    # Health check
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "GAN service is healthy"
    else
        print_error "GAN service health check failed"
        exit 1
    fi
    
    print_status "Deployment completed successfully"
}

# Deploy to cloud (AWS example)
deploy_cloud() {
    echo -e "${GREEN}☁️  Deploying to cloud...${NC}"
    
    # This is an example for AWS ECS deployment
    # You would need to configure AWS CLI and have proper IAM permissions
    
    # Build and push images to ECR
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    
    # Tag and push images
    docker tag ${PROJECT_NAME}-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
    docker tag ${PROJECT_NAME}-gan-service:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-gan-service:latest
    
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-gan-service:latest
    
    # Update ECS service (you would need task definitions)
    # aws ecs update-service --cluster ${PROJECT_NAME}-cluster --service ${PROJECT_NAME}-service --force-new-deployment
    
    print_status "Cloud deployment completed"
}

# Deploy smart contracts
deploy_contracts() {
    echo -e "${GREEN}🔐 Deploying smart contracts...${NC}"
    
    cd contracts
    
    # Install dependencies
    npm install
    
    # Run tests
    npm test
    
    # Deploy to network (update with your network)
    if [ "$ENVIRONMENT" == "production" ]; then
        npx hardhat run scripts/deploy.js --network mainnet
    else
        npx hardhat run scripts/deploy.js --network goerli
    fi
    
    cd ..
    
    print_status "Smart contracts deployed"
}

# Run security audit
run_audit() {
    echo -e "${GREEN}🔍 Running security audit...${NC}"
    
    # Run the audit script
    ./scripts/audit.sh
    
    print_status "Security audit completed"
}

# Main deployment flow
main() {
    echo -e "${GREEN}🎯 Starting deployment process for ${ENVIRONMENT} environment${NC}"
    
    check_prerequisites
    build_frontend
    build_images
    
    if [ "$ENVIRONMENT" == "local" ]; then
        deploy_compose
    elif [ "$ENVIRONMENT" == "cloud" ]; then
        deploy_cloud
    else
        deploy_compose
    fi
    
    deploy_contracts
    run_audit
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}📊 Application is running at: http://localhost${NC}"
    echo -e "${GREEN}🔧 API documentation: http://localhost:8000/docs${NC}"
    echo -e "${GREEN}📈 Monitoring: http://localhost:3001${NC}"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"