# Generative Art Gallery - Operator Guide

## Overview

This guide provides comprehensive instructions for operators managing the Generative Art Gallery application, including deployment, monitoring, maintenance, and troubleshooting procedures.

## System Architecture

### Component Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   GAN Service   │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IPFS Storage  │    │   Redis Cache   │    │   Smart Contract│
│   (Pinata)      │    │   (Redis)       │    │   (Ethereum)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Dependencies

1. **Frontend** depends on:
   - GAN Service API
   - Ethereum network (via MetaMask)
   - IPFS gateway

2. **GAN Service** depends on:
   - PostgreSQL database
   - Redis cache
   - IPFS service
   - PyTorch model files

3. **Database** stores:
   - Art generation jobs
   - User metadata
   - System configuration

## Deployment Procedures

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] Docker images built and tested
- [ ] Smart contracts deployed
- [ ] Database migrations completed
- [ ] Monitoring systems configured

### Docker Deployment

#### 1. Environment Setup

```bash
# Copy environment template
cp deployment/.env.template .env

# Edit with your configuration
nano .env
```

#### 2. Build and Deploy

```bash
# Build Docker images
docker build -f deployment/frontend.Dockerfile -t generative-art-gallery-frontend:latest .
docker build -f deployment/gan-service.Dockerfile -t generative-art-gallery-gan-service:latest .

# Deploy with Docker Compose
docker-compose -f deployment/docker-compose.yml up -d
```

#### 3. Health Checks

```bash
# Check service status
curl http://localhost/health
curl http://localhost:8000/health

# Check Docker containers
docker-compose ps

# View logs
docker-compose logs -f frontend
docker-compose logs -f gan-service
```

### Kubernetes Deployment

#### 1. Namespace and Secrets

```bash
# Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# Update secrets with your values
kubectl create secret generic gallery-secrets \
  --from-literal=db-password="your-password" \
  --from-literal=database-url="postgresql://postgres:your-password@postgres-service:5432/artgallery" \
  --from-literal=ipfs-api-key="your-key" \
  --from-literal=ipfs-api-secret="your-secret" \
  --from-literal=contract-address="0x..." \
  --from-literal=infura-project-id="your-id" \
  --namespace=generative-art-gallery
```

#### 2. Deploy Services

```bash
# Deploy all services
kubectl apply -f deployment/kubernetes/

# Check deployment status
kubectl get pods -n generative-art-gallery
kubectl get services -n generative-art-gallery
```

#### 3. Ingress Configuration

```bash
# Update ingress with your domain
kubectl edit ingress gallery-ingress -n generative-art-gallery
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### Application Metrics
- Request response times
- Error rates
- User engagement metrics
- Art generation success rate

#### Infrastructure Metrics
- CPU utilization
- Memory usage
- Disk space
- Network throughput

#### Business Metrics
- Number of art pieces generated
- NFT minting success rate
- User registration count
- Revenue from minting fees

### Monitoring Setup

#### Prometheus + Grafana

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gan-service'
    static_configs:
      - targets: ['gan-service:8000']
    metrics_path: '/metrics'
    
  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
```

#### Log Aggregation

```bash
# Deploy ELK stack for log aggregation
kubectl apply -f deployment/logging/elk-stack.yaml
```

### Alerting Rules

```yaml
# alerting-rules.yaml
groups:
- name: art-gallery-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High error rate detected"
      
  - alert: GANServiceDown
    expr: up{job="gan-service"} == 0
    for: 2m
    annotations:
      summary: "GAN service is down"
      
  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 10m
    annotations:
      summary: "High memory usage detected"
```

## Maintenance Procedures

### Daily Maintenance

1. **Health Checks**
   ```bash
   # Automated health check script
   ./scripts/health-check.sh
   ```

2. **Log Review**
   ```bash
   # Check error logs
   docker-compose logs --tail=100 | grep ERROR
   kubectl logs -l app=gan-service --tail=100 | grep ERROR
   ```

3. **Performance Metrics**
   - Review dashboard for anomalies
   - Check response times
   - Monitor user activity

### Weekly Maintenance

1. **Database Maintenance**
   ```bash
   # Check database size
   docker-compose exec postgres psql -U postgres -d artgallery -c "SELECT pg_size_pretty(pg_database_size('artgallery'));"
   
   # Vacuum and analyze
   docker-compose exec postgres psql -U postgres -d artgallery -c "VACUUM ANALYZE;"
   ```

2. **Storage Cleanup**
   ```bash
   # Clean old generation files
   find gan-service/outputs -type f -mtime +7 -delete
   
   # Check IPFS storage usage
   curl -X POST "https://api.pinata.cloud/data/userPinnedDataTotal" \
     -H "pinata_api_key: YOUR_KEY" \
     -H "pinata_secret_api_key: YOUR_SECRET"
   ```

3. **Security Updates**
   - Check for system updates
   - Review security logs
   - Update dependencies

### Monthly Maintenance

1. **Backup Procedures**
   ```bash
   # Database backup
   docker-compose exec postgres pg_dump -U postgres artgallery > backup_$(date +%Y%m%d).sql
   
   # Configuration backup
   tar -czf config_backup_$(date +%Y%m%d).tar.gz deployment/ .env
   ```

2. **Performance Optimization**
   - Review slow queries
   - Optimize database indexes
   - Check model performance
   - Evaluate resource allocation

3. **Capacity Planning**
   - Analyze growth trends
   - Plan for scaling
   - Review cost optimization

## Troubleshooting Guide

### Common Issues

#### 1. GAN Service Failures

**Symptoms**: Art generation fails, 500 errors
**Causes**: Model loading issues, insufficient memory, GPU problems
**Solutions**:
```bash
# Check service logs
docker-compose logs gan-service

# Restart service
docker-compose restart gan-service

# Check GPU availability (if applicable)
nvidia-smi
```

#### 2. Database Connection Issues

**Symptoms**: Cannot connect to database, timeout errors
**Causes**: Network issues, authentication problems, resource exhaustion
**Solutions**:
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check connection string
# Verify environment variables
# Check network connectivity
```

#### 3. IPFS Upload Failures

**Symptoms**: Images not uploading, metadata errors
**Causes**: API key issues, rate limiting, network problems
**Solutions**:
```bash
# Test IPFS connection
curl -X POST "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET"

# Check API limits
# Verify file sizes
# Check network connectivity
```

#### 4. Smart Contract Issues

**Symptoms**: Minting failures, transaction errors
**Causes**: Gas price issues, contract bugs, network congestion
**Solutions**:
```bash
# Check contract status
npx hardhat verify --network mainnet CONTRACT_ADDRESS

# Check gas prices
curl https://ethgasstation.info/api/ethgasAPI.json

# Monitor network status
```

### Performance Issues

#### High Response Times

**Diagnosis**:
```bash
# Check service performance
docker stats

# Monitor database queries
# Check for slow queries in logs

# Review resource usage
htop
```

**Solutions**:
- Scale up service instances
- Optimize database queries
- Add caching layers
- Review model efficiency

#### Memory Leaks

**Detection**:
```bash
# Monitor memory usage
watch -n 5 'free -h'

# Check for memory leaks
docker exec gan-service ps aux --sort=-%mem
```

**Resolution**:
- Restart services periodically
- Optimize code
- Increase memory limits
- Implement health checks

### Security Issues

#### Rate Limiting

**Configuration**:
```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

**Monitoring**:
```bash
# Check rate limit violations
grep "limiting requests" /var/log/nginx/error.log
```

#### Suspicious Activity

**Detection**:
```bash
# Check for unusual patterns
grep -i "error\|fail\|denied" /var/log/nginx/access.log

# Monitor failed authentication attempts
# Check for SQL injection attempts
```

**Response**:
- Block suspicious IP addresses
- Review access logs
- Update security rules
- Notify security team

## Backup and Recovery

### Backup Strategy

#### Database Backups
```bash
# Daily automated backup
0 2 * * * docker-compose exec postgres pg_dump -U postgres artgallery > /backups/artgallery_$(date +\%Y\%m\%d).sql

# Weekly full backup with compression
0 3 * * 0 tar -czf /backups/full_backup_$(date +\%Y\%m\%d).tar.gz /var/lib/postgresql/data
```

#### Configuration Backups
```bash
# Backup deployment configurations
tar -czf /backups/deployment_$(date +%Y%m%d).tar.gz deployment/ .env docker-compose.yml
```

#### Model and Data Backups
```bash
# Backup ML models
tar -czf /backups/models_$(date +%Y%m%d).tar.gz gan-service/models/

# Backup generated content
tar -czf /backups/outputs_$(date +%Y%m%d).tar.gz gan-service/outputs/
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres artgallery < backup_file.sql

# Point-in-time recovery (if configured)
# Follow PostgreSQL PITR procedures
```

#### Service Recovery
```bash
# Restore configuration
tar -xzf deployment_backup.tar.gz

# Restart services
docker-compose down && docker-compose up -d
```

#### Complete System Recovery
1. Restore infrastructure
2. Recover databases
3. Restore configurations
4. Deploy services
5. Verify functionality

## Security Management

### Access Control

#### SSH Access
```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no

# Use key-based authentication only
# Manage authorized_keys file
```

#### Service Authentication
- Use strong API keys
- Implement JWT tokens
- Enable 2FA where possible
- Regular key rotation

### Security Monitoring

#### Log Analysis
```bash
# Monitor authentication logs
tail -f /var/log/auth.log

# Check for failed login attempts
grep "Failed password" /var/log/auth.log

# Monitor system logs
tail -f /var/log/syslog
```

#### Vulnerability Scanning
```bash
# Regular security scans
nmap -sV your-server-ip

# Check for open ports
netstat -tulpn

# Review running services
ps aux
```

### Incident Response

#### Security Incident Procedure
1. **Detection**: Monitor alerts and logs
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the incident
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Update procedures

#### Communication Plan
- Notify stakeholders
- Document the incident
- Update security measures
- Conduct post-mortem review

## Performance Optimization

### Database Optimization

#### Query Optimization
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM art_pieces WHERE created_at > NOW() - INTERVAL '1 day';

-- Add appropriate indexes
CREATE INDEX idx_art_pieces_created_at ON art_pieces(created_at);
CREATE INDEX idx_art_pieces_creator ON art_pieces(creator_address);
```

#### Connection Pooling
```python
# Configure connection pooling
DATABASE_URL = "postgresql://user:pass@localhost/artgallery?pool_size=20&max_overflow=30"
```

### Caching Strategy

#### Redis Configuration
```bash
# Configure Redis for optimal performance
maxmemory 256mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

#### Application Caching
```python
# Implement caching in FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

FastAPICache.init(RedisBackend(redis), prefix="gan-cache")
```

### Load Balancing

#### Nginx Configuration
```nginx
upstream gan_service {
    least_conn;
    server gan-service-1:8000 weight=3;
    server gan-service-2:8000 weight=2;
    server gan-service-3:8000 weight=1;
}
```

## Cost Management

### Resource Optimization

#### Right-sizing
- Monitor actual usage vs. allocated resources
- Scale down during low usage periods
- Use spot instances where appropriate
- Implement auto-scaling policies

#### Storage Optimization
- Implement data lifecycle policies
- Compress old data
- Archive infrequently accessed data
- Clean up temporary files regularly

### Cost Monitoring

#### Budget Alerts
```bash
# Set up billing alerts
# Monitor cloud spending
# Track resource usage trends
# Implement cost allocation tags
```

## Compliance and Auditing

### Audit Logging
```bash
# Enable comprehensive audit logging
# Log all administrative actions
# Maintain audit trails
# Regular log reviews
```

### Compliance Checks
- Regular security assessments
- Vulnerability management
- Data protection compliance
- Industry standard adherence

---

*This guide should be regularly updated based on operational experience and system changes.*