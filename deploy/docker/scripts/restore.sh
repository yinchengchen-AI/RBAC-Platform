#!/bin/bash
# Restore script for RBAC Platform data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Help
show_help() {
    echo "Usage: $0 [OPTIONS] <backup_file>"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -l, --list       List available backups"
    echo "  -y, --yes        Skip confirmation"
    echo ""
    echo "Examples:"
    echo "  $0 -l                           # List backups"
    echo "  $0 postgres_20240101_120000.sql.gz  # Restore from backup"
}

# List backups
list_backups() {
    echo -e "${YELLOW}Available Backups:${NC}\n"
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "PostgreSQL backups:"
        ls -1t "${BACKUP_DIR}"/postgres_*.sql.gz 2>/dev/null || echo "  (none)"
        
        echo ""
        echo "Redis backups:"
        ls -1t "${BACKUP_DIR}"/redis_*.rdb 2>/dev/null || echo "  (none)"
    else
        echo "No backup directory found at: $BACKUP_DIR"
    fi
}

# Parse arguments
AUTO_CONFIRM=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

if [ -z "$BACKUP_FILE" ]; then
    show_help
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try in backup directory
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}=== RBAC Platform Restore ===${NC}\n"
echo "Backup file: $BACKUP_FILE"

# Confirm
if [ "$AUTO_CONFIRM" = false ]; then
    echo ""
    read -p "This will overwrite existing data. Are you sure? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
fi

# Determine backup type
if [[ "$BACKUP_FILE" == *"postgres"* ]]; then
    echo -e "\nRestoring PostgreSQL..."
    
    # Check if container is running
    if ! docker ps | grep -q "rbac-platform-postgres"; then
        echo -e "${RED}Error: PostgreSQL container is not running${NC}"
        exit 1
    fi
    
    # Restore
    gunzip < "$BACKUP_FILE" | docker exec -i rbac-platform-postgres psql -U postgres
    
    echo -e "${GREEN}✓ PostgreSQL restore complete!${NC}"
    
elif [[ "$BACKUP_FILE" == *"redis"* ]]; then
    echo -e "\nRestoring Redis..."
    
    # Check if container is running
    if ! docker ps | grep -q "rbac-platform-redis"; then
        echo -e "${RED}Error: Redis container is not running${NC}"
        exit 1
    fi
    
    # Stop Redis, restore file, start Redis
    docker stop rbac-platform-redis
    docker cp "$BACKUP_FILE" rbac-platform-redis:/data/dump.rdb
    docker start rbac-platform-redis
    
    echo -e "${GREEN}✓ Redis restore complete!${NC}"
    
else
    echo -e "${RED}Error: Unknown backup type${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Restore complete!${NC}"
