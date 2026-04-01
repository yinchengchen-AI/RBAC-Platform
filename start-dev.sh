#!/bin/bash
# RBAC Platform 本地开发启动脚本

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== RBAC Platform 开发环境启动 ===${NC}\n"

# Check if infrastructure is running
if ! docker ps | grep -q "rbac-platform-postgres"; then
    echo -e "${YELLOW}启动基础设施服务...${NC}"
    docker compose -f deploy/docker/compose.infra.yml up -d
    echo -e "${GREEN}✓ 基础设施已启动${NC}\n"
    
    # Wait for postgres to be ready
    echo -e "${YELLOW}等待 PostgreSQL 就绪...${NC}"
    until docker exec rbac-platform-postgres pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    echo -e "${GREEN}✓ PostgreSQL 已就绪${NC}\n"
else
    echo -e "${GREEN}✓ 基础设施已在运行${NC}\n"
fi

# Check backend virtual environment
if [ ! -d "backend/.venv" ]; then
    echo -e "${YELLOW}创建后端虚拟环境...${NC}"
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ 后端环境准备完成${NC}\n"
fi

# Run migrations
echo -e "${YELLOW}执行数据库迁移...${NC}"
cd backend
source .venv/bin/activate
alembic upgrade head
cd ..
echo -e "${GREEN}✓ 数据库迁移完成${NC}\n"

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}\n"
fi

echo -e "${GREEN}=== 启动完成 ===${NC}\n"
echo -e "服务地址:"
echo -e "  ${BLUE}前端:${NC} http://localhost:5173"
echo -e "  ${BLUE}后端:${NC} http://localhost:8000"
echo -e "  ${BLUE}API文档:${NC} http://localhost:8000/docs"
echo -e "  ${BLUE}MinIO:${NC} http://localhost:9001"
echo ""
echo -e "启动命令:"
echo -e "  ${YELLOW}后端:${NC} cd backend && source .venv/bin/activate && uvicorn main:app --reload"
echo -e "  ${YELLOW}前端:${NC} cd frontend && npm run dev"
echo ""
echo -e "默认账号: ${GREEN}admin / Admin@123456${NC}"
