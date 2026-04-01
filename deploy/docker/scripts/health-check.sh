#!/bin/bash
# Health check script for RBAC Platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
MINIO_CONSOLE_URL="http://localhost:9001"

# Check function
check_service() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo -n "Checking $name... "
    
    if curl -sf "${url}${endpoint}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Main check
echo -e "${YELLOW}=== RBAC Platform Health Check ===${NC}\n"

EXIT_CODE=0

# Check Frontend
if ! check_service "Frontend" "$FRONTEND_URL" "/"; then
    EXIT_CODE=1
fi

# Check Backend
if ! check_service "Backend API" "$BACKEND_URL" "/api/v1/health"; then
    EXIT_CODE=1
fi

# Check Backend Docs
if ! check_service "API Docs" "$BACKEND_URL" "/docs"; then
    EXIT_CODE=1
fi

# Check MinIO Console
if ! check_service "MinIO Console" "$MINIO_CONSOLE_URL" "/"; then
    EXIT_CODE=1
fi

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
else
    echo -e "${RED}✗ Some services are not responding.${NC}"
    echo "  Run 'make logs' to see detailed logs."
fi

exit $EXIT_CODE
