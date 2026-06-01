.PHONY: ci ci-frontend ci-backend

# Run all CI checks — mirrors .github/workflows/ci.yml exactly
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
