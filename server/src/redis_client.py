"""Async Redis client — optional, non-fatal for MVP."""

import logging

import redis.asyncio as aioredis

from src.config import settings

logger = logging.getLogger(__name__)

redis_client: aioredis.Redis | None = None


async def connect_redis() -> None:
    """Create the async Redis client and verify connectivity with a PING."""
    global redis_client
    client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    await client.ping()
    redis_client = client
    logger.info("Redis connected: %s", settings.REDIS_URL)


async def disconnect_redis() -> None:
    """Close the Redis client if it is open."""
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
        logger.info("Redis disconnected.")


def get_redis() -> aioredis.Redis:
    """Return the active Redis client.

    Raises:
        RuntimeError: if the client has not been initialised (connect_redis was
            not called or failed).
    """
    if redis_client is None:
        raise RuntimeError("Redis client is not initialised.")
    return redis_client
