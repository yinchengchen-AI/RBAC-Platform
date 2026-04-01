#!/bin/bash
# Backup script for RBAC Platform data

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}=== RBAC Platform Backup ===${NC}\n"

# Backup PostgreSQL
echo -n "Backing up PostgreSQL... "
docker exec rbac-platform-postgres pg_dump -U postgres rbac_platform | gzip > "${BACKUP_DIR}/postgres_${DATE}.sql.gz"
echo -e "${GREEN}✓ Done${NC}"

# Backup Redis (if persistence is enabled, just copy the dump file)
echo -n "Backing up Redis... "
docker exec rbac-platform-redis redis-cli BGSAVE > /dev/null 2>&1 || true
# Wait for BGSAVE to complete
sleep 2
docker cp rbac-platform-redis:/data/dump.rdb "${BACKUP_DIR}/redis_${DATE}.rdb" 2>/dev/null || echo -e "${YELLOW}⚠ No Redis dump found${NC}"
echo -e "${GREEN}✓ Done${NC}"

# Backup MinIO data (bucket structure only)
echo -n "Backing up MinIO metadata... "
docker exec rbac-platform-minio sh -c "cd /data && find . -type d" > "${BACKUP_DIR}/minio_structure_${DATE}.txt" 2>/dev/null || echo -e "${YELLOW}⚠ MinIO backup skipped${NC}"
echo -e "${GREEN}✓ Done${NC}"

# Clean up old backups
echo -n "Cleaning up old backups (>${RETENTION_DAYS} days)... "
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "minio_*.txt" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo -e "${GREEN}✓ Done${NC}"

echo ""
echo -e "${GREEN}✓ Backup complete! Files saved to: ${BACKUP_DIR}${NC}"
ls -lh "${BACKUP_DIR}"/*"${DATE}"*
