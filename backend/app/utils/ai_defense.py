import json
import hashlib
import logging
import asyncio
from pathlib import Path
from typing import Any, Dict, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception

logger = logging.getLogger("uvicorn.error")

APP_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = APP_DIR.parent
CACHE_DIR = APP_DIR / "cache"
CACHE_FILE = CACHE_DIR / "response_bakery.json"
RAW_DATA_FILE = BACKEND_DIR / "scripts" / "mythology_raw.json"
CACHE_WRITE_LOCK = asyncio.Lock()


def _normalize_for_cache(value: Any) -> Any:
    if isinstance(value, str):
        return " ".join(value.strip().split()).lower()
    if isinstance(value, dict):
        return {str(key): _normalize_for_cache(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [_normalize_for_cache(item) for item in value]
    return value


def generate_cache_key(payload: Dict[str, Any]) -> str:
    """Computes a deterministic SHA-256 hash for payload-based lookups."""
    normalized_payload = _normalize_for_cache(payload)
    serialized = json.dumps(
        normalized_payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(serialized.encode()).hexdigest()


def is_cacheable_response(data: Dict[str, Any]) -> bool:
    if not isinstance(data, dict):
        return False

    serialized = json.dumps(data, ensure_ascii=False).lower()
    poison_markers = (
        "pipeline exception details",
        "503 unavailable",
        "429",
        "resource_exhausted",
        "service_unavailable",
        '"error"',
    )
    return not any(marker in serialized for marker in poison_markers)


async def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    """Reads a cached response from the persistent JSON layer."""
    if not CACHE_FILE.exists():
        return None
    try:
        def _read():
            with CACHE_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
        cache = await asyncio.to_thread(_read)
        return cache.get(key)
    except Exception as e:
        logger.debug(f"Cache lookup failed for {key}: {e}")
        return None

async def set_cached_response(key: str, data: Dict[str, Any]):
    """Persists a successful generation result into the local bakery."""
    if not is_cacheable_response(data):
        logger.info(f"Skipping non-cacheable response for {key}")
        return

    try:
        async with CACHE_WRITE_LOCK:
            def _write():
                CACHE_DIR.mkdir(parents=True, exist_ok=True)
                cache = {}
                if CACHE_FILE.exists():
                    try:
                        with CACHE_FILE.open("r", encoding="utf-8") as f:
                            loaded = json.load(f)
                            if isinstance(loaded, dict):
                                cache = loaded
                    except Exception:
                        cache = {}
                cache[key] = data
                with CACHE_FILE.open("w", encoding="utf-8") as f:
                    json.dump(cache, f, indent=2, ensure_ascii=False)
            await asyncio.to_thread(_write)
    except Exception as e:
        logger.error(f"Failed to bake response to disk: {e}")

async def get_local_fallback_context(query: str) -> List[Dict[str, Any]]:
    """
    Searches the local raw JSON file when Elastic is unreachable.
    Acts as the ultimate safety net for expired plans.
    """
    if not RAW_DATA_FILE.exists():
        return []
    try:
        def _search():
            with RAW_DATA_FILE.open("r", encoding="utf-8") as f:
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
    code = getattr(e, "code", None) or getattr(e, "status_code", None)
    if code in {429, 503}:
        return True

    response = getattr(e, "response", None)
    response_code = getattr(response, "status_code", None)
    if response_code in {429, 503}:
        return True

    msg = str(e).lower()
    transient_markers = (
        "429",
        "503",
        "rate limit",
        "rate_limit",
        "resource_exhausted",
        "service_unavailable",
        "unavailable",
        "overloaded",
        "high demand",
    )
    return any(marker in msg for marker in transient_markers)

gemini_retry_strategy = retry(
    retry=retry_if_exception(is_gemini_transient_error),
    wait=wait_exponential_jitter(initial=1, max=8, jitter=0.75),
    stop=stop_after_attempt(5),
    reraise=True
)
