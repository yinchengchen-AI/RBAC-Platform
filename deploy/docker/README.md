# RBAC Platform Docker Deployment

This directory contains Docker deployment configurations for the RBAC Platform.

## 📁 Directory Structure

```
deploy/docker/
├── compose.yml           # Production Docker Compose
├── compose.dev.yml       # Development infrastructure only
├── .env.docker          # Environment variables template
├── nginx/               # Nginx reverse proxy configuration
│   └── nginx.conf
└── scripts/             # Helper scripts
    ├── health-check.sh
    ├── backup.sh
    └── restore.sh
```

## 🚀 Quick Start

### Production Deployment

1. **Copy environment file:**
   ```bash
   cp deploy/docker/.env.docker .env
   # Edit .env with your settings
   ```

2. **Start all services:**
   ```bash
   make up
   # or
   docker compose -f deploy/docker/compose.yml up -d
   ```

3. **Access services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001

### Development Mode

For local development with hot-reload:

```bash
# Start infrastructure only (postgres, redis, minio)
make dev

# In separate terminals:
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🛠️ Available Commands

### Using Make (Recommended)

```bash
make help              # Show all available commands
make build             # Build all Docker images
make up                # Start production services
make down              # Stop production services
make restart           # Restart all services
make logs              # View all service logs
make logs-backend      # View backend logs only
make logs-frontend     # View frontend logs only
make status            # Check service health
make shell-backend     # Open shell in backend container
make shell-db          # Open psql in postgres container
make clean             # Stop services and remove volumes
make dev-infra         # Start development infrastructure
```

### Direct Docker Commands

```bash
# Production
docker compose -f deploy/docker/compose.yml up -d
docker compose -f deploy/docker/compose.yml down
docker compose -f deploy/docker/compose.yml logs -f

# Development infrastructure only
docker compose -f deploy/docker/compose.dev.yml up -d
docker compose -f deploy/docker/compose.dev.yml down
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_NAME` | rbac-platform | Project name |
| `BACKEND_PORT` | 8000 | Backend API port |
| `FRONTEND_PORT` | 3000 | Frontend port |
| `POSTGRES_DB` | rbac_platform | Database name |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | postgres | Database password |
| `REDIS_PORT` | 6379 | Redis port |
| `MINIO_ROOT_USER` | minioadmin | MinIO access key |
| `MINIO_ROOT_PASSWORD` | minioadmin | MinIO secret key |
| `JWT_SECRET_KEY` | change-me-in-production | JWT signing key |

## 💾 Backup & Restore

### Backup

```bash
# Run backup script
./deploy/docker/scripts/backup.sh

# Or with custom backup directory
BACKUP_DIR=/path/to/backups ./deploy/docker/scripts/backup.sh
```

Backups are saved to `./backups/` by default:
- `postgres_YYYYMMDD_HHMMSS.sql.gz` - Database dump
- `redis_YYYYMMDD_HHMMSS.rdb` - Redis data
- `minio_structure_YYYYMMDD_HHMMSS.txt` - MinIO bucket structure

### Restore

```bash
# List available backups
./deploy/docker/scripts/restore.sh -l

# Restore from backup
./deploy/docker/scripts/restore.sh backups/postgres_20240101_120000.sql.gz

# Skip confirmation
./deploy/docker/scripts/restore.sh -y backups/postgres_20240101_120000.sql.gz
```

## 🏥 Health Checks

```bash
# Check all services
./deploy/docker/scripts/health-check.sh

# Check individual services
curl http://localhost:3000/                    # Frontend
curl http://localhost:8000/api/v1/health       # Backend
curl http://localhost:8000/docs                # API Docs
curl http://localhost:9001/                    # MinIO Console
```

## 🔒 Security Best Practices

1. **Change default passwords** in `.env` before production use
2. **Use strong JWT_SECRET_KEY** (generate with `openssl rand -hex 32`)
3. **Enable HTTPS** in production (configure nginx with SSL certificates)
4. **Limit exposed ports** - only expose necessary ports
5. **Run containers as non-root** - all services run with dedicated users
6. **Regular updates** - keep base images updated

## 📝 Dockerfile Targets

### Backend
- `production` (default) - Optimized for production
- `development` - Includes hot-reload with watchfiles

### Frontend
- `production` (default) - Nginx serving built files
- `development` - Vite dev server with hot-reload

Build specific target:
```bash
docker build --target development -t rbac-backend:dev ./backend
```

## 🔍 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs rbac-platform-backend
docker logs rbac-platform-frontend

# Check container status
docker ps -a
make status
```

### Database connection issues
```bash
# Check postgres is running
docker compose -f deploy/docker/compose.yml ps

# Connect to postgres
make shell-db
```

### Clean restart
```bash
make clean
make up
```

## 📊 Resource Limits

Production compose includes resource limits:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| postgres | 1.0 | 512MB |
| redis | 0.5 | 256MB |
| minio | 0.5 | 512MB |
| backend | 1.0 | 512MB |
| frontend | 0.5 | 128MB |

Adjust in `compose.yml` as needed.
