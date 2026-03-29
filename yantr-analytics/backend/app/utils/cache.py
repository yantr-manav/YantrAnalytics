# -*- coding: utf-8 -*-
"""
TTL In-memory Cache Utility
Results cached per handle for 1 hour.
Reduces Gemini calls and makes repeated lookups instant.
"""

import time
from typing import Any
import os

_cache: dict = {}
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "3600"))


def cache_get(key: str) -> Any:
    """Returns cached value if it exists and hasn't expired."""
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def cache_set(key: str, data: Any) -> None:
    """Stores value in cache with current timestamp."""
    _cache[key] = {"data": data, "ts": time.time()}


def cache_delete(key: str) -> None:
    """Removes a specific key from cache."""
    _cache.pop(key, None)


def cache_clear() -> None:
    """Clears all cached entries."""
    _cache.clear()


def cache_stats() -> dict:
    """Returns cache statistics."""
    now = time.time()
    active = sum(1 for v in _cache.values() if now - v["ts"] < CACHE_TTL)
    return {
        "total_entries": len(_cache),
        "active_entries": active,
        "ttl_seconds": CACHE_TTL
    }
