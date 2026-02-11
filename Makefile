# =============================================================================
# UrutiBiz Backend - Docker Operations Makefile
# =============================================================================
# Usage: make [target]
# Example: make build-prod
# =============================================================================

# Variables
APP_NAME := urutibiz-backend
VERSION := 1.0.0
REGISTRY := docker.io
NAMESPACE := urutibiz
IMAGE_NAME := $(REGISTRY)/$(NAMESPACE)/$(APP_NAME)
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_PROD := docker-compose -f docker-compose.prod.yml

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Help Target
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  UrutiBiz Backend - Docker Operations$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# -----------------------------------------------------------------------------
# Build Targets
# -----------------------------------------------------------------------------
.PHONY: build-prod
build-prod: ## Build production image
	@echo "$(BLUE)Building production image...$(NC)"
	docker build \
		--target production \
		--build-arg NODE_ENV=production \
		--build-arg APP_VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		--build-arg VCS_REF=$(VCS_REF) \
		-t $(APP_NAME):$(VERSION) \
		-t $(APP_NAME):latest \
		.
	@echo "$(GREEN)✓ Production image built successfully$(NC)"

.PHONY: build-dev
build-dev: ## Build development image
	@echo "$(BLUE)Building development image...$(NC)"
	docker build \
		--target development \
		--build-arg NODE_ENV=development \
		-t $(APP_NAME):dev \
		.
	@echo "$(GREEN)✓ Development image built successfully$(NC)"

.PHONY: build-test
build-test: ## Build testing image
	@echo "$(BLUE)Building testing image...$(NC)"
	docker build \
		--target testing \
		-t $(APP_NAME):test \
		.
	@echo "$(GREEN)✓ Testing image built successfully$(NC)"

.PHONY: build-no-cache
build-no-cache: ## Build production image without cache
	@echo "$(BLUE)Building production image (no cache)...$(NC)"
	docker build \
		--no-cache \
		--target production \
		--build-arg NODE_ENV=production \
		--build-arg APP_VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		--build-arg VCS_REF=$(VCS_REF) \
		-t $(APP_NAME):$(VERSION) \
		-t $(APP_NAME):latest \
		.
	@echo "$(GREEN)✓ Production image built successfully$(NC)"

# -----------------------------------------------------------------------------
# Run Targets
# -----------------------------------------------------------------------------
.PHONY: run-prod
run-prod: ## Run production container
	@echo "$(BLUE)Starting production container...$(NC)"
	docker run -d \
		--name $(APP_NAME)-prod \
		-p 10000:10000 \
		--env-file .env.production \
		--restart unless-stopped \
		$(APP_NAME):latest
	@echo "$(GREEN)✓ Production container started$(NC)"
	@echo "$(YELLOW)Access at: http://localhost:10000$(NC)"

.PHONY: run-dev
run-dev: ## Run development container
	@echo "$(BLUE)Starting development container...$(NC)"
	docker run -it --rm \
		--name $(APP_NAME)-dev \
		-p 3000:3000 \
		-v $(PWD)/src:/app/src \
		--env-file .env \
		$(APP_NAME):dev
	@echo "$(GREEN)✓ Development container started$(NC)"

.PHONY: run-test
run-test: ## Run tests in container
	@echo "$(BLUE)Running tests...$(NC)"
	docker run --rm \
		--name $(APP_NAME)-test \
		$(APP_NAME):test
	@echo "$(GREEN)✓ Tests completed$(NC)"

# -----------------------------------------------------------------------------
# Docker Compose Targets
# -----------------------------------------------------------------------------
.PHONY: up
up: ## Start all services (development)
	@echo "$(BLUE)Starting development services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Services started$(NC)"

.PHONY: up-prod
up-prod: ## Start all services (production)
	@echo "$(BLUE)Starting production services...$(NC)"
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)✓ Production services started$(NC)"

.PHONY: down
down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: down-prod
down-prod: ## Stop production services
	@echo "$(BLUE)Stopping production services...$(NC)"
	$(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)✓ Production services stopped$(NC)"

.PHONY: restart
restart: down up ## Restart all services

.PHONY: restart-prod
restart-prod: down-prod up-prod ## Restart production services

# -----------------------------------------------------------------------------
# Logs & Monitoring
# -----------------------------------------------------------------------------
.PHONY: logs
logs: ## View logs from all services
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## View backend logs only
	$(DOCKER_COMPOSE) logs -f backend

.PHONY: logs-prod
logs-prod: ## View production logs
	$(DOCKER_COMPOSE_PROD) logs -f backend

.PHONY: ps
ps: ## List running containers
	@echo "$(BLUE)Running containers:$(NC)"
	$(DOCKER_COMPOSE) ps

.PHONY: stats
stats: ## Show container resource usage
	docker stats $(APP_NAME)-prod

# -----------------------------------------------------------------------------
# Shell Access
# -----------------------------------------------------------------------------
.PHONY: shell
shell: ## Access container shell
	docker exec -it $(APP_NAME)-prod sh

.PHONY: shell-root
shell-root: ## Access container shell as root
	docker exec -it -u root $(APP_NAME)-prod sh

# -----------------------------------------------------------------------------
# Health & Diagnostics
# -----------------------------------------------------------------------------
.PHONY: health
health: ## Check container health
	@echo "$(BLUE)Checking container health...$(NC)"
	@docker inspect --format='{{.State.Health.Status}}' $(APP_NAME)-prod || echo "$(RED)Container not running$(NC)"

.PHONY: inspect
inspect: ## Inspect container details
	docker inspect $(APP_NAME):latest

.PHONY: test-health
test-health: ## Test health endpoint
	@echo "$(BLUE)Testing health endpoint...$(NC)"
	@curl -f http://localhost:10000/health && echo "$(GREEN)✓ Health check passed$(NC)" || echo "$(RED)✗ Health check failed$(NC)"

# -----------------------------------------------------------------------------
# Database Operations
# -----------------------------------------------------------------------------
.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	docker exec $(APP_NAME)-prod npm run db:migrate
	@echo "$(GREEN)✓ Migrations completed$(NC)"

.PHONY: db-seed
db-seed: ## Seed database
	@echo "$(BLUE)Seeding database...$(NC)"
	docker exec $(APP_NAME)-prod npm run db:seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

.PHONY: db-shell
db-shell: ## Access PostgreSQL shell
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d urutibiz_db

# -----------------------------------------------------------------------------
# Cleanup Targets
# -----------------------------------------------------------------------------
.PHONY: clean
clean: ## Remove stopped containers and dangling images
	@echo "$(BLUE)Cleaning up...$(NC)"
	docker container prune -f
	docker image prune -f
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

.PHONY: clean-all
clean-all: ## Remove all containers, images, and volumes
	@echo "$(RED)WARNING: This will remove all containers, images, and volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker rmi $(APP_NAME):latest $(APP_NAME):$(VERSION) 2>/dev/null || true; \
		docker system prune -af --volumes; \
		echo "$(GREEN)✓ All cleaned up$(NC)"; \
	fi

.PHONY: stop
stop: ## Stop running container
	@echo "$(BLUE)Stopping container...$(NC)"
	docker stop $(APP_NAME)-prod 2>/dev/null || true
	@echo "$(GREEN)✓ Container stopped$(NC)"

.PHONY: rm
rm: stop ## Remove container
	@echo "$(BLUE)Removing container...$(NC)"
	docker rm $(APP_NAME)-prod 2>/dev/null || true
	@echo "$(GREEN)✓ Container removed$(NC)"

# -----------------------------------------------------------------------------
# Security & Quality
# -----------------------------------------------------------------------------
.PHONY: scan
scan: ## Scan image for vulnerabilities
	@echo "$(BLUE)Scanning image for vulnerabilities...$(NC)"
	docker scan $(APP_NAME):latest || echo "$(YELLOW)Install Docker Scan for vulnerability scanning$(NC)"

.PHONY: lint-dockerfile
lint-dockerfile: ## Lint Dockerfile
	@echo "$(BLUE)Linting Dockerfile...$(NC)"
	docker run --rm -i hadolint/hadolint < Dockerfile || echo "$(YELLOW)Install hadolint for Dockerfile linting$(NC)"

.PHONY: size
size: ## Show image size
	@echo "$(BLUE)Image sizes:$(NC)"
	@docker images $(APP_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# -----------------------------------------------------------------------------
# Registry Operations
# -----------------------------------------------------------------------------
.PHONY: tag
tag: ## Tag image for registry
	@echo "$(BLUE)Tagging image...$(NC)"
	docker tag $(APP_NAME):latest $(IMAGE_NAME):$(VERSION)
	docker tag $(APP_NAME):latest $(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image tagged$(NC)"

.PHONY: push
push: tag ## Push image to registry
	@echo "$(BLUE)Pushing image to registry...$(NC)"
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image pushed$(NC)"

.PHONY: pull
pull: ## Pull image from registry
	@echo "$(BLUE)Pulling image from registry...$(NC)"
	docker pull $(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image pulled$(NC)"

# -----------------------------------------------------------------------------
# CI/CD Targets
# -----------------------------------------------------------------------------
.PHONY: ci-build
ci-build: ## CI: Build and test
	@echo "$(BLUE)Running CI build...$(NC)"
	$(MAKE) build-no-cache
	$(MAKE) run-test
	$(MAKE) scan
	@echo "$(GREEN)✓ CI build completed$(NC)"

.PHONY: deploy
deploy: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(NC)"
	$(MAKE) build-prod
	$(MAKE) push
	$(MAKE) up-prod
	$(MAKE) db-migrate
	@echo "$(GREEN)✓ Deployment completed$(NC)"

# -----------------------------------------------------------------------------
# Development Helpers
# -----------------------------------------------------------------------------
.PHONY: install
install: ## Install dependencies locally
	npm ci

.PHONY: dev
dev: ## Run development server locally
	npm run dev

.PHONY: build
build: ## Build TypeScript locally
	npm run build

.PHONY: test
test: ## Run tests locally
	npm test

# -----------------------------------------------------------------------------
# Information
# -----------------------------------------------------------------------------
.PHONY: info
info: ## Show build information
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Build Information$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)App Name:$(NC)     $(APP_NAME)"
	@echo "$(YELLOW)Version:$(NC)      $(VERSION)"
	@echo "$(YELLOW)Build Date:$(NC)   $(BUILD_DATE)"
	@echo "$(YELLOW)VCS Ref:$(NC)      $(VCS_REF)"
	@echo "$(YELLOW)Image:$(NC)        $(IMAGE_NAME):$(VERSION)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"

.PHONY: version
version: ## Show version
	@echo "$(VERSION)"
