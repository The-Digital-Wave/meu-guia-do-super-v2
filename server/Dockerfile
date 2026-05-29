# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Copy dependency manifests first for layer caching
COPY pyproject.toml ./

# Stub out the src package so setuptools can resolve it during dependency install.
# The real source is copied in the runtime stage; this keeps the pip layer cached
# even when source code changes (only pyproject.toml changes bust the cache).
RUN mkdir -p src && touch src/__init__.py

# asyncpg ships pre-built wheels — no gcc or libpq-dev needed
RUN pip install --upgrade pip \
    && pip install --no-cache-dir .


# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Own everything as appuser
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
