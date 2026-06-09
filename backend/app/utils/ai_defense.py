import os
import json
import hashlib
import logging
import asyncio
from typing import Any, Dict, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

logger = logging.getLogger("uvicorn.error")

# Local cache configuration targeting the response bakery layer
CACHE_DIR = os.path.join("backend", "app", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "response_bakery.json")
RAW_DATA_FILE = os.path.join("backend", "scripts", "mythology_raw.json")


def generate_cache_key(payload: Dict[str, Any]) -> str:
    """Computes a deterministic SHA-256 hash for payload-based lookups."""
    serialized = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()

async def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    """Reads a cached response from the persistent JSON layer."""
    if not os.path.exists(CACHE_FILE):
        return None
    try:
        def _read():
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        cache = await asyncio.to_thread(_read)
        return cache.get(key)
    except Exception as e:
        logger.debug(f"Cache lookup failed for {key}: {e}")
        return None

async def set_cached_response(key: str, data: Dict[str, Any]):
    """Persists a successful generation result into the local bakery."""
    try:
        def _write():
            os.makedirs(CACHE_DIR, exist_ok=True)
            cache = {}
            if os.path.exists(CACHE_FILE):
                try:
                    with open(CACHE_FILE, "r", encoding="utf-8") as f:
                        cache = json.load(f)
                except:
                    cache = {}
            cache[key] = data
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, indent=2, ensure_ascii=False)
        await asyncio.to_thread(_write)
    except Exception as e:
        logger.error(f"Failed to bake response to disk: {e}")

async def get_local_fallback_context(query: str) -> List[Dict[str, Any]]:
    """
    Searches the local raw JSON file when Elastic is unreachable.
    Acts as the ultimate safety net for expired plans.
    """
    if not os.path.exists(RAW_DATA_FILE):
        return []
    try:
        def _search():
            with open(RAW_DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            query_lowered = query.lower()
            # Simple keyword match fallback
            results = []
            for item in data:
                if (query_lowered in item.get("DeityName", "").lower() or 
                    query_lowered in item.get("desc", "").lower()):
                    results.append(item)
            return results[:3] # Return top 3 matches
        return await asyncio.to_thread(_search)
    except Exception as e:
        logger.error(f"Local fallback search failed: {e}")
        return []

def is_gemini_transient_error(e: Exception) -> bool:
    """Detects 429 (Rate Limit) and 503 (Overloaded) signals from Gemini SDK."""
    msg = str(e).lower()
    # Checks for common status codes or labels in the error string
    return "429" in msg or "503" in msg or "resource_exhausted" in msg or "service_unavailable" in msg

gemini_retry_strategy = retry(
    retry=retry_if_exception(is_gemini_transient_error),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(5),
    reraise=True
)