#!/bin/sh
set -e

echo "▶ Running Alembic migrations..."
alembic upgrade head

echo "▶ Running seed script..."
python scripts/seed.py

echo "▶ Starting server..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000
