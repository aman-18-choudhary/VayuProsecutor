import time
from functools import wraps
from typing import Any, Callable, Dict, Optional

# In-memory TTL cache store
_CACHE_STORE: Dict[str, Dict[str, Any]] = {}

def get_cache(key: str, ttl_seconds: int) -> Optional[Any]:
    """Retrieve an item from cache if it hasn't expired."""
    entry = _CACHE_STORE.get(key)
    if entry and (time.time() - entry["timestamp"]) < ttl_seconds:
        return entry["value"]
    return None

def set_cache(key: str, value: Any):
    """Store an item in the cache."""
    _CACHE_STORE[key] = {
        "timestamp": time.time(),
        "value": value
    }

def ttl_cache(ttl_seconds: int = 300):
    """
    Decorator for caching function results based on arguments.
    Works best for functions returning serializable data (dict, list, string, etc.).
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a deterministic string key from func name and args
            # This is simple and meant for primitives
            key_parts = [func.__name__]
            key_parts.extend([str(a) for a in args])
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)

            cached_val = get_cache(cache_key, ttl_seconds)
            if cached_val is not None:
                return cached_val
            
            result = func(*args, **kwargs)
            set_cache(cache_key, result)
            return result
        return wrapper
    return decorator
