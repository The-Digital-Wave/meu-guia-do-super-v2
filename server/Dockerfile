# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Copy requirements first for layer caching — reinstalls only when deps change
COPY requirements.txt ./

# asyncpg ships pre-built wheels — no gcc or libpq-dev needed
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt


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
COPY scripts/ ./scripts/
COPY entrypoint.sh ./

# Own everything as appuser and make entrypoint executable
RUN chown -R appuser:appgroup /app \
    && chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 8000

# Run migrations + seed before starting the server.
# Alembic is idempotent — already-applied migrations are skipped.
# Seed uses upsert — safe to run on every deploy.
CMD ["/app/entrypoint.sh"]
