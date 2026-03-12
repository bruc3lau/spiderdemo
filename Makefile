.PHONY: help build-frontend build-backend run-backend run-frontend clean docker-up docker-down

help: ## Show this help
	@echo "Usage: make [target]"
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build-frontend: ## Build frontend assets
	cd frontend && npm install && npm run build

build-backend: ## Build backend binary
	cd backend && go build -o spider-backend main.go

run-frontend: ## Run frontend dev server
	cd frontend && npm run dev

run-backend: ## Run backend server
	cd backend && go run main.go

clean: ## Clean up builds and dependencies
	rm -rf frontend/node_modules frontend/dist
	rm -f backend/spider-backend backend/spider.db
	rm -rf backend/downloads/*

docker-up: ## Start the application stack using docker-compose
	docker-compose up -d --build

docker-down: ## Stop the application stack
	docker-compose down
