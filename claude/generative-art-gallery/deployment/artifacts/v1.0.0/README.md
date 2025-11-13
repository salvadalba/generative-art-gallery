# Generative Art Gallery - Deployment Artifacts vv1.0.0

This package contains all deployment artifacts for the Generative Art Gallery application.

## Contents

### Docker Deployment
- `docker-compose.yml` - Multi-service Docker composition
- `frontend.Dockerfile` - Frontend application container
- `gan-service.Dockerfile` - GAN service container
- `nginx.conf` - Nginx configuration
- `.env.template` - Environment variables template
- `build-images.sh` - Script to build Docker images
- `deploy.sh` - Script to deploy with Docker Compose

### Kubernetes Deployment
- `namespace.yaml` - Kubernetes namespace
- `secrets.yaml` - Kubernetes secrets (update with your values)
- `persistent-volumes.yaml` - Persistent volume claims
- `redis-deployment.yaml` - Redis deployment
- `postgres-deployment.yaml` - PostgreSQL deployment
- `gan-service-deployment.yaml` - GAN service deployment
- `frontend-deployment.yaml` - Frontend deployment
- `ingress.yaml` - Ingress configuration
- `deploy.sh` - Main deployment script
- `update-secrets.sh` - Script to update secrets

### Smart Contracts
- Contract source code and deployment scripts
- `deploy.sh` - Contract deployment script

## Quick Start

### Docker Deployment
```bash
cd docker
cp .env.template .env
# Edit .env with your configuration
./build-images.sh
./deploy.sh
```

### Kubernetes Deployment
```bash
cd kubernetes
./update-secrets.sh  # Enter your secrets when prompted
./deploy.sh
```

### Smart Contract Deployment
```bash
cd contracts
./deploy.sh
```

## Configuration

### Required Environment Variables
- `DB_PASSWORD` - Database password
- `IPFS_API_KEY` - IPFS API key
- `IPFS_API_SECRET` - IPFS API secret
- `CONTRACT_ADDRESS` - Smart contract address
- `INFURA_PROJECT_ID` - Infura project ID

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

Generated on: Thu Nov 13 13:18:22 CET 2025
