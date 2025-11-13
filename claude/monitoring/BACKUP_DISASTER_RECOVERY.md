# Generative Art Gallery - Backup & Disaster Recovery Procedures

## Overview
This document outlines comprehensive backup and disaster recovery procedures for the Generative Art Gallery system, ensuring business continuity and data protection across all components.

## Table of Contents
1. [Backup Strategy](#backup-strategy)
2. [Backup Procedures](#backup-procedures)
3. [Disaster Recovery Planning](#disaster-recovery-planning)
4. [Recovery Procedures](#recovery-procedures)
5. [Testing and Validation](#testing-and-validation)
6. [Business Continuity](#business-continuity)

---

## Backup Strategy

### Backup Objectives
- **Recovery Time Objective (RTO)**: 4 hours for critical services
- **Recovery Point Objective (RPO)**: 1 hour for transactional data
- **Data Retention**: 90 days for daily backups, 1 year for monthly backups
- **Geographic Redundancy**: Backups stored in multiple regions

### Backup Classification

#### Critical Data (Tier 1)
- User accounts and authentication data
- Art generation parameters and metadata
- NFT minting records and transaction hashes
- Smart contract state and configurations
- Financial transactions and payment records

**Backup Frequency**: Every 15 minutes
**Retention**: 90 days
**Storage**: Primary + 2 geographic replicas

#### Important Data (Tier 2)
- Generated art files and images
- User preferences and settings
- System configurations and environment variables
- Application logs and audit trails
- API usage analytics

**Backup Frequency**: Every 4 hours
**Retention**: 60 days
**Storage**: Primary + 1 geographic replica

#### Standard Data (Tier 3)
- Static assets and frontend files
- Documentation and knowledge base
- Development artifacts and build outputs
- Temporary files and caches

**Backup Frequency**: Daily
**Retention**: 30 days
**Storage**: Primary location only

---

## Backup Procedures

### 1. Database Backup Procedures

#### PostgreSQL Database
**Frequency**: Every 15 minutes (incremental), Daily (full)
**Method**: pg_basebackup + WAL archiving
**Storage**: Encrypted S3 buckets

```bash
#!/bin/bash
# /scripts/backup-database.sh

set -euo pipefail

# Configuration
DB_NAME="generative_art_gallery"
DB_USER="postgres"
BACKUP_DIR="/backups/database"
S3_BUCKET="s3://generative-art-backups/database"
RETENTION_DAYS=90

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full backup (daily at 2 AM)
if [ "$(date +%H)" -eq "02" ]; then
    echo "Starting full database backup..."
    
    # Create full backup
    pg_basebackup -h localhost -U "$DB_USER" -D "$BACKUP_DIR/full-$(date +%Y%m%d-%H%M%S)" -Ft -z -P
    
    # Upload to S3
    aws s3 cp "$BACKUP_DIR/full-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/full/"
    
    # Verify backup integrity
    aws s3 ls "$S3_BUCKET/full/" | tail -5
    
    echo "Full backup completed successfully"
fi

# Incremental backup (every 15 minutes)
echo "Starting incremental backup..."

# Archive WAL files
find /var/lib/postgresql/wal_archive/ -name "*.wal" -mmin -15 -exec aws s3 cp {} "$S3_BUCKET/wal/" \;

# Backup configuration files
tar -czf "$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).tar.gz" /etc/postgresql/
aws s3 cp "$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/config/"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
aws s3 ls "$S3_BUCKET/full/" | awk '{print $4}' | head -n -90 | xargs -I {} aws s3 rm "$S3_BUCKET/full/{}"

echo "Incremental backup completed successfully"
```

#### Redis Cache Backup
**Frequency**: Every 4 hours
**Method**: RDB snapshots + AOF persistence
**Storage**: Encrypted S3 buckets

```bash
#!/bin/bash
# /scripts/backup-redis.sh

set -euo pipefail

# Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
BACKUP_DIR="/backups/redis"
S3_BUCKET="s3://generative-art-backups/redis"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create Redis snapshot
echo "Creating Redis snapshot..."
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE

# Wait for background save to complete
while [ "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" LASTSAVE)" = "0" ]; do
    sleep 1
done

# Copy dump file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb"

# Backup AOF file if enabled
if [ -f /var/lib/redis/appendonly.aof ]; then
    cp /var/lib/redis/appendonly.aof "$BACKUP_DIR/aof-$(date +%Y%m%d-%H%M%S).aof"
fi

# Upload to S3
aws s3 cp "$BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb" "$S3_BUCKET/snapshots/"
if [ -f "$BACKUP_DIR/aof-$(date +%Y%m%d-%H%M%S).aof" ]; then
    aws s3 cp "$BACKUP_DIR/aof-$(date +%Y%m%d-%H%M%S).aof" "$S3_BUCKET/aof/"
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "*.rdb" -o -name "*.aof" | xargs ls -t | tail -n +31 | xargs rm -f
aws s3 ls "$S3_BUCKET/snapshots/" | awk '{print $4}' | head -n -30 | xargs -I {} aws s3 rm "$S3_BUCKET/snapshots/{}"

echo "Redis backup completed successfully"
```

### 2. File System Backup Procedures

#### Art Files and Images
**Frequency**: Every 4 hours
**Method**: Incremental file sync + checksum verification
**Storage**: Encrypted S3 buckets + CDN edge locations

```bash
#!/bin/bash
# /scripts/backup-art-files.sh

set -euo pipefail

# Configuration
SOURCE_DIR="/app/uploads/art"
BACKUP_DIR="/backups/art-files"
S3_BUCKET="s3://generative-art-backups/art-files"
RETENTION_DAYS=60

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate file manifest
echo "Generating file manifest..."
find "$SOURCE_DIR" -type f -exec sha256sum {} \; > "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).txt"

# Sync files to backup location
rsync -av --delete "$SOURCE_DIR/" "$BACKUP_DIR/current/"

# Create compressed archive
tar -czf "$BACKUP_DIR/art-files-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$BACKUP_DIR/current" .

# Upload to S3
aws s3 cp "$BACKUP_DIR/art-files-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/"
aws s3 cp "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).txt" "$S3_BUCKET/manifests/"

# Verify upload integrity
aws s3 ls "$S3_BUCKET/" | grep "art-files-$(date +%Y%m%d)"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
aws s3 ls "$S3_BUCKET/" | awk '{print $4}' | head -n -90 | xargs -I {} aws s3 rm "$S3_BUCKET/{}"

echo "Art files backup completed successfully"
```

#### Configuration Files
**Frequency**: Daily
**Method**: Version-controlled configuration backup
**Storage**: Git repository + encrypted S3

```bash
#!/bin/bash
# /scripts/backup-configs.sh

set -euo pipefail

# Configuration
CONFIG_DIRS="/app/config /etc/nginx /etc/ssl /app/smart-contracts"
BACKUP_DIR="/backups/configs"
GIT_REPO="git@github.com:company/config-backups.git"
S3_BUCKET="s3://generative-art-backups/configs"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create configuration archive
echo "Creating configuration backup..."
tar -czf "$BACKUP_DIR/configs-$(date +%Y%m%d-%H%M%S).tar.gz" $CONFIG_DIRS

# Encrypt sensitive configurations
gpg --cipher-algo AES256 --compress-algo 2 --symmetric --output "$BACKUP_DIR/configs-$(date +%Y%m%d-%H%M%S).tar.gz.gpg" "$BACKUP_DIR/configs-$(date +%Y%m%d-%H%M%S).tar.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/configs-$(date +%Y%m%d-%H%M%S).tar.gz.gpg" "$S3_BUCKET/"

# Commit to Git (non-sensitive configs only)
cd "$BACKUP_DIR"
git init
git remote add origin "$GIT_REPO" || true
cp -r /app/config/non-sensitive/* . || true
git add .
git commit -m "Config backup $(date +%Y-%m-%d)" || true
git push origin main || true

# Cleanup
rm -f "$BACKUP_DIR/configs-"*.tar.gz*

echo "Configuration backup completed successfully"
```

### 3. Smart Contract Backup Procedures

#### Contract State and ABIs
**Frequency**: Every hour
**Method**: Blockchain state snapshots + metadata backup
**Storage**: IPFS + encrypted S3

```bash
#!/bin/bash
# /scripts/backup-contracts.sh

set -euo pipefail

# Configuration
CONTRACT_ADDRESSES=("0x123..." "0x456..." "0x789...")
RPC_URL="https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
IPFS_NODE="/ip4/127.0.0.1/tcp/5001"
BACKUP_DIR="/backups/contracts"
S3_BUCKET="s3://generative-art-backups/contracts"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup contract ABIs and deployment info
echo "Backing up contract information..."
cp /app/smart-contracts/artifacts/contracts/*.json "$BACKUP_DIR/"
cp /app/smart-contracts/deployments/*.json "$BACKUP_DIR/"

# Get current block number
BLOCK_NUMBER=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
  jq -r '.result')

# Backup contract states
for CONTRACT_ADDRESS in "${CONTRACT_ADDRESSES[@]}"; do
    echo "Backing up contract state: $CONTRACT_ADDRESS"
    
    # Get contract bytecode
    BYTECODE=$(curl -s -X POST "$RPC_URL" \
      -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$CONTRACT_ADDRESS\",\"latest\"],\"id\":1}" | \
      jq -r '.result')
    
    # Get storage root (if available)
    STORAGE_ROOT=$(curl -s -X POST "$RPC_URL" \
      -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getStorageAt\",\"params\":[\"$CONTRACT_ADDRESS\",\"0x0\",\"latest\"],\"id\":1}" | \
      jq -r '.result')
    
    # Create contract state file
    cat > "$BACKUP_DIR/contract-${CONTRACT_ADDRESS}-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "address": "$CONTRACT_ADDRESS",
  "blockNumber": "$BLOCK_NUMBER",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bytecode": "$BYTECODE",
  "storageRoot": "$STORAGE_ROOT",
  "backupType": "state_snapshot"
}
EOF
    
    # Upload to IPFS
    IPFS_HASH=$(ipfs add -q "$BACKUP_DIR/contract-${CONTRACT_ADDRESS}-$(date +%Y%m%d-%H%M%S).json")
    echo "Contract state uploaded to IPFS: $IPFS_HASH"
    
    # Pin to multiple IPFS nodes
    ipfs pin add "$IPFS_HASH"
    
done

# Create backup manifest
cat > "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "backupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "blockNumber": "$BLOCK_NUMBER",
  "contracts": $(printf '%s\n' "${CONTRACT_ADDRESSES[@]}" | jq -R . | jq -s .),
  "ipfsHashes": $(find "$BACKUP_DIR" -name "*.json" -exec ipfs add -q {} \; | jq -R . | jq -s .)
}
EOF

# Upload to S3
tar -czf "$BACKUP_DIR/contracts-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$BACKUP_DIR" .
aws s3 cp "$BACKUP_DIR/contracts-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.json" -mtime +7 -delete
aws s3 ls "$S3_BUCKET/" | awk '{print $4}' | head -n -720 | xargs -I {} aws s3 rm "$S3_BUCKET/{}"

echo "Contract backup completed successfully"
```

### 4. Application State Backup

#### User Sessions and Application State
**Frequency**: Every 15 minutes
**Method**: Incremental state snapshots
**Storage**: Redis + encrypted S3

```bash
#!/bin/bash
# /scripts/backup-app-state.sh

set -euo pipefail

# Configuration
SESSION_DIR="/app/sessions"
STATE_DIR="/app/state"
BACKUP_DIR="/backups/app-state"
S3_BUCKET="s3://generative-art-backups/app-state"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup user sessions
echo "Backing up user sessions..."
if [ -d "$SESSION_DIR" ]; then
    tar -czf "$BACKUP_DIR/sessions-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$SESSION_DIR" .
    aws s3 cp "$BACKUP_DIR/sessions-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/sessions/"
fi

# Backup application state
echo "Backing up application state..."
if [ -d "$STATE_DIR" ]; then
    tar -czf "$BACKUP_DIR/state-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$STATE_DIR" .
    aws s3 cp "$BACKUP_DIR/state-$(date +%Y%m%d-%H%M%S).tar.gz" "$S3_BUCKET/state/"
fi

# Backup job queue state
if command -v redis-cli &> /dev/null; then
    echo "Backing up job queue state..."
    redis-cli --rdb "$BACKUP_DIR/redis-jobs-$(date +%Y%m%d-%H%M%S).rdb"
    aws s3 cp "$BACKUP_DIR/redis-jobs-$(date +%Y%m%d-%H%M%S).rdb" "$S3_BUCKET/jobs/"
fi

# Create state manifest
cat > "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "backupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backupType": "application_state",
  "components": {
    "sessions": $(if [ -d "$SESSION_DIR" ]; then echo "true"; else echo "false"; fi),
    "state": $(if [ -d "$STATE_DIR" ]; then echo "true"; else echo "false"; fi),
    "jobs": $(if command -v redis-cli &> /dev/null; then echo "true"; else echo "false"; fi)
  },
  "files": [
EOF

find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.rdb" | while read file; do
    echo "    \"$(basename "$file")\"," >> "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json"
done

sed -i '$ s/,$//' "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json"

cat >> "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json" << EOF
  ]
}
EOF

aws s3 cp "$BACKUP_DIR/manifest-$(date +%Y%m%d-%H%M%S).json" "$S3_BUCKET/manifests/"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.rdb" -mtime +7 -delete
aws s3 ls "$S3_BUCKET/sessions/" | awk '{print $4}' | head -n -90 | xargs -I {} aws s3 rm "$S3_BUCKET/sessions/{}"

echo "Application state backup completed successfully"
```

---

## Disaster Recovery Planning

### Disaster Recovery Objectives
- **Maximum Tolerable Downtime (MTD)**: 8 hours
- **Recovery Time Objective (RTO)**: 4 hours for critical services
- **Recovery Point Objective (RPO)**: 1 hour for transactional data
- **Service Level Agreement (SLA)**: 99.9% uptime

### Disaster Scenarios

#### Scenario 1: Single Component Failure
**Impact**: One service unavailable
**Examples**: Database crash, GAN service failure, frontend server down
**Recovery Time**: 30 minutes - 2 hours

#### Scenario 2: Infrastructure Failure
**Impact**: Multiple services affected
**Examples**: Data center outage, network failure, storage corruption
**Recovery Time**: 2 - 4 hours

#### Scenario 3: Catastrophic Failure
**Impact**: Complete system loss
**Examples**: Natural disaster, major security breach, complete data loss
**Recovery Time**: 4 - 8 hours

### Recovery Priorities

#### Priority 1 (Critical - 30 minutes)
- Database restoration
- Core API services
- User authentication
- Smart contract interactions

#### Priority 2 (High - 2 hours)
- GAN service restoration
- File storage recovery
- Frontend deployment
- Monitoring systems

#### Priority 3 (Medium - 4 hours)
- Analytics and reporting
- Development tools
- Documentation systems
- Non-critical services

---

## Recovery Procedures

### 1. Database Recovery

#### PostgreSQL Database Recovery
```bash
#!/bin/bash
# /scripts/recover-database.sh

set -euo pipefail

# Configuration
RECOVERY_POINT="${1:-latest}"
DB_NAME="generative_art_gallery"
DB_USER="postgres"
BACKUP_DIR="/backups/database"
S3_BUCKET="s3://generative-art-backups/database"

# Stop application services
echo "Stopping application services..."
docker-compose stop frontend api

# Backup current database (if accessible)
if pg_isready -h localhost -U "$DB_USER"; then
    echo "Creating safety backup of current database..."
    pg_dump -h localhost -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/pre-recovery-$(date +%Y%m%d-%H%M%S).sql"
fi

# Determine backup file to restore
if [ "$RECOVERY_POINT" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls "$S3_BUCKET/full/" | sort -k1,2 | tail -1 | awk '{print $4}')
else
    BACKUP_FILE="full-$RECOVERY_POINT.tar.gz"
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file found"
    exit 1
fi

# Download backup from S3
echo "Downloading backup: $BACKUP_FILE"
aws s3 cp "$S3_BUCKET/full/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"

# Drop and recreate database
echo "Recreating database..."
docker-compose exec -T postgres psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker-compose exec -T postgres psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore database
echo "Restoring database..."
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$BACKUP_DIR/"
docker-compose exec -T postgres pg_restore -U "$DB_USER" -d "$DB_NAME" "$BACKUP_DIR/"*.tar

# Apply WAL files if available
if aws s3 ls "$S3_BUCKET/wal/" > /dev/null 2>&1; then
    echo "Applying WAL files..."
    mkdir -p /var/lib/postgresql/wal_restore/
    aws s3 sync "$S3_BUCKET/wal/" /var/lib/postgresql/wal_restore/
    # Apply WAL files in sequence
    for wal_file in /var/lib/postgresql/wal_restore/*.wal; do
        if [ -f "$wal_file" ]; then
            docker-compose exec -T postgres pg_waldump "$wal_file" > /dev/null 2>&1 || true
        fi
    done
fi

# Verify database integrity
echo "Verifying database integrity..."
if pg_isready -h localhost -U "$DB_USER"; then
    TABLES=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo "Database restored with $TABLES tables"
else
    echo "Error: Database not accessible after restore"
    exit 1
fi

# Restart application services
echo "Restarting application services..."
docker-compose start frontend api

# Verify application functionality
echo "Verifying application functionality..."
sleep 30
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Application restored successfully"
else
    echo "Warning: Application health check failed"
fi

echo "Database recovery completed"
```

### 2. File System Recovery

#### Art Files Recovery
```bash
#!/bin/bash
# /scripts/recover-art-files.sh

set -euo pipefail

# Configuration
RECOVERY_POINT="${1:-latest}"
SOURCE_DIR="/app/uploads/art"
BACKUP_DIR="/backups/art-files"
S3_BUCKET="s3://generative-art-backups/art-files"

# Create recovery directory
mkdir -p "$BACKUP_DIR"

# Determine backup file to restore
if [ "$RECOVERY_POINT" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls "$S3_BUCKET/" | grep "art-files" | sort -k1,2 | tail -1 | awk '{print $4}')
else
    BACKUP_FILE="art-files-$RECOVERY_POINT.tar.gz"
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file found"
    exit 1
fi

# Download backup from S3
echo "Downloading backup: $BACKUP_FILE"
aws s3 cp "$S3_BUCKET/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup integrity
echo "Verifying backup integrity..."
EXPECTED_HASH=$(aws s3 cp "$S3_BUCKET/manifests/manifest-$(echo $BACKUP_FILE | sed 's/art-files-//' | sed 's/.tar.gz//').txt" - | grep "art-files" | awk '{print $1}')
ACTUAL_HASH=$(sha256sum "$BACKUP_DIR/$BACKUP_FILE" | awk '{print $1}')

if [ "$EXPECTED_HASH" != "$ACTUAL_HASH" ]; then
    echo "Error: Backup integrity check failed"
    exit 1
fi

# Stop file processing services
echo "Stopping file processing services..."
docker-compose stop gan-service

# Backup current files (if accessible)
if [ -d "$SOURCE_DIR" ]; then
    echo "Creating safety backup of current files..."
    tar -czf "$BACKUP_DIR/pre-recovery-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$SOURCE_DIR" .
fi

# Restore files
echo "Restoring art files..."
rm -rf "$SOURCE_DIR"
mkdir -p "$SOURCE_DIR"
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$SOURCE_DIR"

# Verify file integrity
echo "Verifying file integrity..."
FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)
echo "Restored $FILE_COUNT files"

# Restore file permissions
chown -R www-data:www-data "$SOURCE_DIR"
find "$SOURCE_DIR" -type d -exec chmod 755 {} \;
find "$SOURCE_DIR" -type f -exec chmod 644 {} \;

# Restart file processing services
echo "Restarting file processing services..."
docker-compose start gan-service

# Verify service functionality
echo "Verifying service functionality..."
sleep 30
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "GAN service restored successfully"
else
    echo "Warning: GAN service health check failed"
fi

echo "Art files recovery completed"
```

### 3. Smart Contract Recovery

#### Contract State Recovery
```bash
#!/bin/bash
# /scripts/recover-contracts.sh

set -euo pipefail

# Configuration
RECOVERY_POINT="${1:-latest}"
CONTRACTS_DIR="/app/smart-contracts"
BACKUP_DIR="/backups/contracts"
S3_BUCKET="s3://generative-art-backups/contracts"
RPC_URL="https://mainnet.infura.io/v3/YOUR_PROJECT_ID"

# Create recovery directory
mkdir -p "$BACKUP_DIR"

# Determine backup file to restore
if [ "$RECOVERY_POINT" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls "$S3_BUCKET/" | grep "contracts" | sort -k1,2 | tail -1 | awk '{print $4}')
else
    BACKUP_FILE="contracts-$RECOVERY_POINT.tar.gz"
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file found"
    exit 1
fi

# Download backup from S3
echo "Downloading backup: $BACKUP_FILE"
aws s3 cp "$S3_BUCKET/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$BACKUP_DIR"

# Verify contract deployment
echo "Verifying contract deployment..."
for contract_file in "$BACKUP_DIR"/contract-*.json; do
    if [ -f "$contract_file" ]; then
        CONTRACT_ADDRESS=$(jq -r '.address' "$contract_file")
        BACKUP_BLOCK=$(jq -r '.blockNumber' "$contract_file")
        
        # Get current contract bytecode
        CURRENT_BYTECODE=$(curl -s -X POST "$RPC_URL" \
          -H "Content-Type: application/json" \
          -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$CONTRACT_ADDRESS\",\"latest\"],\"id\":1}" | \
          jq -r '.result')
        
        # Compare with backup
        BACKUP_BYTECODE=$(jq -r '.bytecode' "$contract_file")
        
        if [ "$CURRENT_BYTECODE" = "$BACKUP_BYTECODE" ]; then
            echo "Contract $CONTRACT_ADDRESS verified successfully"
        else
            echo "Warning: Contract $CONTRACT_ADDRESS bytecode mismatch"
            echo "Current: $CURRENT_BYTECODE"
            echo "Backup: $BACKUP_BYTECODE"
        fi
    fi
done

# Restore contract ABIs and artifacts
echo "Restoring contract artifacts..."
mkdir -p "$CONTRACTS_DIR/artifacts/contracts"
mkdir -p "$CONTRACTS_DIR/deployments"

cp "$BACKUP_DIR"/*.json "$CONTRACTS_DIR/artifacts/contracts/" 2>/dev/null || true
cp "$BACKUP_DIR"/deployments/*.json "$CONTRACTS_DIR/deployments/" 2>/dev/null || true

# Verify IPFS content
echo "Verifying IPFS content..."
IPFS_HASHES=$(find "$BACKUP_DIR" -name "*.json" -exec ipfs add -q {} \; 2>/dev/null || true)
if [ -n "$IPFS_HASHES" ]; then
    for hash in $IPFS_HASHES; do
        if ipfs pin ls | grep -q "$hash"; then
            echo "IPFS content $hash is pinned"
        else
            echo "Warning: IPFS content $hash is not pinned"
        fi
    done
fi

# Restart blockchain services
echo "Restarting blockchain services..."
docker-compose restart api

# Verify blockchain connectivity
echo "Verifying blockchain connectivity..."
sleep 30
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Blockchain services restored successfully"
else
    echo "Warning: Blockchain services health check failed"
fi

echo "Contract recovery completed"
```

### 4. Complete System Recovery

#### Full System Restoration
```bash
#!/bin/bash
# /scripts/recover-full-system.sh

set -euo pipefail

# Configuration
RECOVERY_POINT="${1:-latest}"
LOG_FILE="/var/log/disaster-recovery-$(date +%Y%m%d-%H%M%S).log"

# Initialize logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo "=== Full System Recovery Started at $(date) ==="
echo "Recovery Point: $RECOVERY_POINT"

# Phase 1: Infrastructure Preparation
echo "Phase 1: Preparing infrastructure..."
docker-compose down
mkdir -p /backups/recovery
systemctl stop nginx

# Phase 2: Database Recovery
echo "Phase 2: Recovering database..."
./scripts/recover-database.sh "$RECOVERY_POINT"
if [ $? -ne 0 ]; then
    echo "Error: Database recovery failed"
    exit 1
fi

# Phase 3: File System Recovery
echo "Phase 3: Recovering file systems..."
./scripts/recover-art-files.sh "$RECOVERY_POINT"
if [ $? -ne 0 ]; then
    echo "Error: File system recovery failed"
    exit 1
fi

# Phase 4: Smart Contract Recovery
echo "Phase 4: Recovering smart contracts..."
./scripts/recover-contracts.sh "$RECOVERY_POINT"
if [ $? -ne 0 ]; then
    echo "Error: Contract recovery failed"
    exit 1
fi

# Phase 5: Application State Recovery
echo "Phase 5: Recovering application state..."
./scripts/recover-app-state.sh "$RECOVERY_POINT"
if [ $? -ne 0 ]; then
    echo "Warning: Application state recovery had issues"
fi

# Phase 6: Service Restoration
echo "Phase 6: Restoring services..."
docker-compose up -d
sleep 60

# Phase 7: Verification and Testing
echo "Phase 7: Verifying system functionality..."

# Health checks
SERVICES=("frontend:3000" "api:8080" "gan-service:8000")
for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✓ $name service is healthy"
    else
        echo "✗ $name service failed health check"
    fi
done

# Database connectivity
if pg_isready -h localhost -U postgres; then
    echo "✓ Database is accessible"
else
    echo "✗ Database is not accessible"
fi

# File system access
if [ -d "/app/uploads/art" ] && [ -r "/app/uploads/art" ]; then
    echo "✓ Art file directory is accessible"
else
    echo "✗ Art file directory is not accessible"
fi

# Blockchain connectivity
if curl -f "https://mainnet.infura.io/v3/YOUR_PROJECT_ID" > /dev/null 2>&1; then
    echo "✓ Blockchain connectivity is available"
else
    echo "✗ Blockchain connectivity is not available"
fi

# Phase 8: Finalization
echo "Phase 8: Finalizing recovery..."
systemctl start nginx

# Update monitoring
systemctl restart prometheus
systemctl restart grafana

# Send recovery notification
echo "System recovery completed at $(date)" | mail -s "Disaster Recovery Complete" ops-team@company.com

echo "=== Full System Recovery Completed at $(date) ==="
echo "Recovery log saved to: $LOG_FILE"
```

---

## Testing and Validation

### Backup Validation Procedures

#### Daily Backup Verification
```bash
#!/bin/bash
# /scripts/verify-backups.sh

set -euo pipefail

# Configuration
S3_BUCKETS=("s3://generative-art-backups/database" "s3://generative-art-backups/art-files" "s3://generative-art-backups/contracts")
ALERT_EMAIL="ops-team@company.com"

# Test backup integrity
echo "Testing backup integrity..."
for bucket in "${S3_BUCKETS[@]}"; do
    echo "Checking bucket: $bucket"
    
    # Check for recent backups
    RECENT_BACKUPS=$(aws s3 ls "$bucket/" | grep "$(date +%Y%m%d)" | wc -l)
    if [ "$RECENT_BACKUPS" -eq 0 ]; then
        echo "Error: No recent backups found in $bucket"
        echo "Backup verification failed for $bucket" | mail -s "Backup Alert" "$ALERT_EMAIL"
        continue
    fi
    
    # Test download and integrity
    LATEST_BACKUP=$(aws s3 ls "$bucket/" | sort -k1,2 | tail -1 | awk '{print $4}')
    aws s3 cp "$bucket/$LATEST_BACKUP" /tmp/test-backup.tar.gz
    
    if tar -tzf /tmp/test-backup.tar.gz > /dev/null 2>&1; then
        echo "✓ Backup integrity verified: $LATEST_BACKUP"
    else
        echo "✗ Backup integrity failed: $LATEST_BACKUP"
        echo "Backup integrity check failed for $LATEST_BACKUP" | mail -s "Backup Alert" "$ALERT_EMAIL"
    fi
    
    rm -f /tmp/test-backup.tar.gz
done

# Test restore procedures (on staging)
echo "Testing restore procedures..."
./scripts/test-restore.sh staging

echo "Backup verification completed"
```

#### Monthly Disaster Recovery Test
```bash
#!/bin/bash
# /scripts/test-disaster-recovery.sh

set -euo pipefail

# Configuration
TEST_ENV="staging"
RECOVERY_TIME_LIMIT=240  # 4 hours in minutes
NOTIFICATION_EMAIL="ops-team@company.com"

# Start timer
START_TIME=$(date +%s)

echo "=== Disaster Recovery Test Started at $(date) ==="
echo "Test Environment: $TEST_ENV"
echo "Recovery Time Limit: $RECOVERY_TIME_LIMIT minutes"

# Create test environment
echo "Creating test environment..."
docker-compose -f docker-compose.test.yml up -d
sleep 30

# Simulate disaster
echo "Simulating disaster scenario..."
docker-compose -f docker-compose.test.yml stop database gan-service
docker-compose -f docker-compose.test.yml rm -f database gan-service

# Execute recovery
echo "Executing recovery procedures..."
./scripts/recover-full-system.sh latest

# Verify recovery
END_TIME=$(date +%s)
RECOVERY_TIME=$(( (END_TIME - START_TIME) / 60 ))

echo "Recovery completed in $RECOVERY_TIME minutes"

# Test system functionality
echo "Testing system functionality..."
./scripts/system-health-check.sh $TEST_ENV

# Evaluate results
if [ "$RECOVERY_TIME" -le "$RECOVERY_TIME_LIMIT" ]; then
    echo "✓ Disaster recovery test PASSED"
    echo "Recovery time: $RECOVERY_TIME minutes (limit: $RECOVERY_TIME_LIMIT minutes)"
    echo "Disaster recovery test PASSED" | mail -s "DR Test Results" "$NOTIFICATION_EMAIL"
else
    echo "✗ Disaster recovery test FAILED"
    echo "Recovery time: $RECOVERY_TIME minutes (limit: $RECOVERY_TIME_LIMIT minutes)"
    echo "Disaster recovery test FAILED" | mail -s "DR Test Results" "$NOTIFICATION_EMAIL"
fi

# Cleanup
echo "Cleaning up test environment..."
docker-compose -f docker-compose.test.yml down

echo "=== Disaster Recovery Test Completed at $(date) ==="
```

---

## Business Continuity

### Communication Plan

#### Internal Communication
- **Incident Commander**: Technical Lead
- **Communication Lead**: Operations Manager
- **Technical Lead**: Senior Engineer
- **Business Lead**: Product Manager

#### External Communication
- **Customer Support**: Pre-scripted responses for common issues
- **Status Page**: Real-time system status updates
- **Social Media**: Coordinated messaging across platforms
- **Press Releases**: Official statements for major incidents

### Escalation Procedures

#### Level 1 (0-30 minutes)
- On-call engineer notified
- Initial assessment completed
- Basic troubleshooting attempted
- Incident logged in system

#### Level 2 (30-60 minutes)
- Senior engineer engaged
- Additional resources allocated
- Customer notifications sent
- Status page updated

#### Level 3 (60+ minutes)
- Management team activated
- External vendors contacted
- Public communications prepared
- Regulatory notifications made

### Recovery Validation Checklist

#### Pre-Recovery
- [ ] Incident assessment completed
- [ ] Recovery team assembled
- [ ] Communication plan activated
- [ ] Backup integrity verified
- [ ] Stakeholders notified

#### During Recovery
- [ ] Recovery procedures followed
- [ ] Progress documented
- [ ] Issues escalated promptly
- [ ] Timeline tracked
- [ ] Status updates provided

#### Post-Recovery
- [ ] System functionality verified
- [ ] Performance benchmarks met
- [ ] Security controls validated
- [ ] Monitoring systems active
- [ ] Incident review scheduled

---

## Tools and Resources

### Required Tools
- **AWS CLI**: S3 bucket management
- **Docker**: Container orchestration
- **PostgreSQL**: Database tools
- **Redis**: Cache management
- **IPFS**: Decentralized storage
- **OpenSSL**: Encryption/decryption
- **GnuPG**: File encryption

### Backup Storage Locations
- **Primary**: AWS S3 (us-east-1)
- **Secondary**: AWS S3 (us-west-2)
- **Tertiary**: Google Cloud Storage
- **Archive**: AWS Glacier

### Contact Information
- **Operations Team**: ops-team@company.com
- **Database Team**: db-team@company.com
- **Security Team**: security-team@company.com
- **Management**: management@company.com

### External Vendors
- **Cloud Provider**: AWS Support
- **Database Vendor**: PostgreSQL Support
- **Security Vendor**: Security Team
- **Legal Team**: Legal Department

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-01 | Operations Team | Initial version |
| 1.1 | 2024-02-15 | Database Team | Added PostgreSQL procedures |
| 1.2 | 2024-03-30 | Security Team | Enhanced encryption procedures |

---

**Next Review Date**: 2024-04-30
**Document Owner**: Operations Team
**Approved By**: Technical Leadership Team