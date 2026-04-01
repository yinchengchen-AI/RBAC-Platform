# RBAC Platform Docker Management

.PHONY: help build up down restart logs ps clean dev dev-down shell-backend shell-frontend

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
NC := \033[0m # No Color

COMPOSE_FILE := deploy/docker/compose.yml
COMPOSE_DEV_FILE := deploy/docker/compose.dev.yml

##@ 🚀 Quick Start

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)RBAC Platform Docker Commands$(NC)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)

infra: ## Start infrastructure services (postgres, redis, minio)
	@echo "$(BLUE)Starting infrastructure services...$(NC)"
	docker compose -f deploy/docker/compose.infra.yml up -d
	@echo "$(GREEN)Infrastructure started!$(NC)"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo "  MinIO API: localhost:9000"
	@echo "  MinIO Console: http://localhost:9001"

infra-down: ## Stop infrastructure services
	@echo "$(YELLOW)Stopping infrastructure services...$(NC)"
	docker compose -f deploy/docker/compose.infra.yml down

build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose -f $(COMPOSE_FILE) build

up: ## Start all services in production mode (requires built images)
	@echo "$(GREEN)Starting production services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo "  MinIO Console: http://localhost:9001"

down: ## Stop all production services
	@echo "$(YELLOW)Stopping production services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

restart: down up ## Restart all services

##@ 🛠️ Development

dev-infra: ## Start development infrastructure (postgres, redis, minio)
	@echo "$(BLUE)Starting development infrastructure...$(NC)"
	docker compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(GREEN)Development infrastructure started!$(NC)"

dev-infra-down: ## Stop development infrastructure
	@echo "$(YELLOW)Stopping development infrastructure...$(NC)"
	docker compose -f $(COMPOSE_DEV_FILE) down

dev-infra-logs: ## View development infrastructure logs
	docker compose -f $(COMPOSE_DEV_FILE) logs -f

dev: dev-infra ## Start development environment (infrastructure only, run frontend/backend locally)
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "Run backend: cd backend && source .venv/bin/activate && uvicorn main:app --reload"
	@echo "Run frontend: cd frontend && npm run dev"

dev-down: dev-infra-down ## Stop development environment

##@ 📊 Monitoring

logs: ## View all service logs
	docker compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## View backend logs only
	docker compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## View frontend logs only
	docker compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## View database logs only
	docker compose -f $(COMPOSE_FILE) logs -f postgres

ps: ## List running containers
	docker compose -f $(COMPOSE_FILE) ps

status: ## Check service health
	@echo "$(BLUE)Service Health Status:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

##@ 🔧 Utilities

shell-backend: ## Open shell in backend container
	docker compose -f $(COMPOSE_FILE) exec backend /bin/sh

shell-frontend: ## Open shell in frontend container
	docker compose -f $(COMPOSE_FILE) exec frontend /bin/sh

shell-db: ## Open psql in postgres container
	docker compose -f $(COMPOSE_FILE) exec postgres psql -U postgres -d rbac_platform

shell-redis: ## Open redis-cli in redis container
	docker compose -f $(COMPOSE_FILE) exec redis redis-cli

migrate: ## Run database migrations
	docker compose -f $(COMPOSE_FILE) exec backend alembic upgrade head

seed: ## Run database seeding
	docker compose -f $(COMPOSE_FILE) exec backend python -m scripts.seed

##@ 🧹 Cleanup

clean: ## Stop services and remove volumes (WARNING: data will be lost!)
	@echo "$(YELLOW)WARNING: This will remove all data volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f $(COMPOSE_FILE) down -v; \
		docker compose -f $(COMPOSE_DEV_FILE) down -v; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	fi

clean-images: ## Remove all built images
	docker compose -f $(COMPOSE_FILE) down --rmi all

prune: ## Prune unused Docker resources
	docker system prune -f
	docker volume prune -f

##@ 🔒 Security

scan-backend: ## Scan backend image for vulnerabilities
	@docker build -t rbac-backend-scan ./backend
	@docker scan rbac-backend-scan || echo "$(YELLOW)Install docker scan or use trivy for scanning$(NC)"

scan-frontend: ## Scan frontend image for vulnerabilities
	@docker build -t rbac-frontend-scan ./frontend
	@docker scan rbac-frontend-scan || echo "$(YELLOW)Install docker scan or use trivy for scanning$(NC)"
