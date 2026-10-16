import time
import threading
from typing import Any, Optional, Dict

class SimpleTTLCache:
    def __init__(self, default_ttl: int = 60, max_entries: int = 500):
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl
        self.max_entries = max_entries

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            expire_at, val = entry
            if time.time() > expire_at:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        with self._lock:
            if len(self._cache) >= self.max_entries:
                # Evict expired keys or oldest entries
                now = time.time()
                keys_to_del = [k for k, (exp, _) in self._cache.items() if now > exp]
                if keys_to_del:
                    for k in keys_to_del:
                        del self._cache[k]
                else:
                    # remove first 20%
                    evict_count = max(1, len(self._cache) // 5)
                    for k in list(self._cache.keys())[:evict_count]:
                        del self._cache[k]
            
            exp_time = time.time() + (ttl if ttl is not None else self.default_ttl)
            self._cache[key] = (exp_time, value)

    def invalidate_all(self):
        with self._lock:
            self._cache.clear()

    def invalidate_prefix(self, prefix: str):
        with self._lock:
            keys_to_del = [k for k in self._cache.keys() if k.startswith(prefix)]
            for k in keys_to_del:
                del self._cache[k]

cache = SimpleTTLCache(default_ttl=60, max_entries=500)
