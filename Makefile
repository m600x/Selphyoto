.PHONY: help dev install install-playwright lint lint-fix unit-tests integration-tests e2e-tests tests tests-coverage build run stop clean

DOCKER_IMAGE := selphyoto
DOCKER_CONTAINER := selphyoto
COMMIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "dev")

help: ## Show this help
	@echo "SelphYoto — available make targets:"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Install npm dependencies and Playwright browsers
	npm install
	npx playwright install chromium

install-playwright: ## Download Playwright browsers only (after upgrade)
	npx playwright install chromium

lint: ## Lint all TypeScript and JavaScript files (ESLint)
	npx eslint .

lint-fix: ## Lint and auto-fix issues
	npx eslint . --fix

dev: ## Start the Vite dev server (http://localhost:5173)
	npx vite

unit-tests: ## Run unit tests only (Vitest)
	npx vitest run --config vitest.config.ts tests/unit/

integration-tests: ## Run integration tests only (Vitest + jsdom)
	npx vitest run --config vitest.config.ts tests/integration/

e2e-tests: ## Run end-to-end tests (Playwright + Chromium)
	npx playwright test --config tests/e2e/playwright.config.ts

tests: ## Run the full test suite (unit + integration + e2e)
	npx vitest run
	npx playwright test --config tests/e2e/playwright.config.ts

tests-coverage: ## Run unit + integration tests with V8 coverage report
	npx vitest run --coverage

build: ## Build the Docker image (with embedded commit hash)
	docker build -t $(DOCKER_IMAGE) --build-arg COMMIT_HASH=$(COMMIT_HASH) .

run: ## Run the Docker container (http://localhost:8080)
	docker run -d -p 8080:80 --name $(DOCKER_CONTAINER) $(DOCKER_IMAGE)
	@echo "Open http://localhost:8080"

stop: ## Stop and remove the Docker container
	docker stop $(DOCKER_CONTAINER) && docker rm $(DOCKER_CONTAINER)

clean: ## Remove node_modules and dist
	rm -rf node_modules dist
