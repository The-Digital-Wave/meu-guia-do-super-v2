.PHONY: ci ci-frontend ci-backend check-secrets cd-frontend

# ---------------------------------------------------------------------------
# CI — mirrors .github/workflows/ci.yml exactly
# ---------------------------------------------------------------------------

ci: ci-backend ci-frontend

ci-backend:
	cd server && pip install -e ".[dev]" -q
	cd server && ruff check .
	cd server && mypy src/
	cd server && DATABASE_URL="sqlite+aiosqlite:///:memory:" \
	             JWT_SECRET="ci-test-secret-at-least-32-characters-long" \
	             JWT_REFRESH_SECRET="ci-refresh-secret-at-least-32-chars" \
	             python -m pytest tests/ -v --tb=short

ci-frontend:
	cd client && npm ci --legacy-peer-deps --silent
	cd client && npx tsc --noEmit
	cd client && npx eslint . --ext .ts,.tsx --max-warnings 0

# ---------------------------------------------------------------------------
# CD — simulate frontend deploy locally (mirrors deploy-frontend-web.yml)
# ---------------------------------------------------------------------------

cd-frontend:
	cd client && npm ci --legacy-peer-deps --silent
	cd client && EXPO_PUBLIC_API_URL=$$(grep '^EXPO_PUBLIC_API_URL=' ../.env | cut -d= -f2-) \
		npx expo export --platform web
	@echo "Export succeeded — dist/ is ready."
	@echo "Deploy step (Vercel) requires credentials; run 'make check-secrets' first."

# ---------------------------------------------------------------------------
# CD — validate deploy credentials locally before pushing
# Reads KEY=VALUE lines from .env (skips section headers and spaced keys).
# Usage: make check-secrets
# ---------------------------------------------------------------------------

# Load only valid KEY=VALUE lines from .env (uppercase keys, no spaces)
ENV_VARS := $(shell grep -E '^[A-Z_][A-Z0-9_]*=[^[:space:]]' .env 2>/dev/null)

check-secrets:
	@$(foreach pair,$(ENV_VARS),$(eval export $(pair)))
	@echo ""
	@echo "=== Docker Hub ==="
	@echo "$(DOCKERHUB_TOKEN)" | docker login -u "$(DOCKERHUB_USERNAME)" --password-stdin \
		&& echo "  OK" || echo "  FAILED — check DOCKERHUB_USERNAME / DOCKERHUB_TOKEN"
	@docker logout > /dev/null 2>&1
	@echo ""
	@echo "=== Render API ==="
	@curl -fsSL \
		-H "Authorization: Bearer $(RENDER_API_KEY)" \
		"https://api.render.com/v1/services/$(RENDER_SERVICE_ID)" \
		-o /dev/null -w "  HTTP %{http_code}\n" \
		&& echo "  OK" || echo "  FAILED — check RENDER_API_KEY / RENDER_SERVICE_ID"
	@echo ""
	@echo "=== Vercel ==="
	@curl -fsSL \
		-H "Authorization: Bearer $(VERCEL_TOKEN)" \
		"https://api.vercel.com/v2/user" \
		-o /dev/null -w "  HTTP %{http_code}\n" \
		&& echo "  OK" || echo "  FAILED — check VERCEL_TOKEN"
	@echo ""
	@echo "=== Expo ==="
	@curl -fsSL \
		-H "Authorization: Bearer $(EXPO_TOKEN)" \
		"https://api.expo.dev/v2/auth/userInfo" \
		-o /dev/null -w "  HTTP %{http_code}\n" \
		&& echo "  OK" || echo "  FAILED — check EXPO_TOKEN"
	@echo ""
