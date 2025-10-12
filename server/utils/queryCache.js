// Simple in-memory cache for frequently accessed queries
class QueryCache {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map(); // Time to live for each cache entry
        this.defaultTTL = 30000; // 30 seconds default
        
        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    set(key, value, ttlMs = this.defaultTTL) {
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttlMs);
        console.log(`[QueryCache] Cached: ${key} (TTL: ${ttlMs}ms)`);
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const expiry = this.ttl.get(key);
        if (Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            console.log(`[QueryCache] Expired: ${key}`);
            return null;
        }

        console.log(`[QueryCache] Hit: ${key}`);
        return this.cache.get(key);
    }

    invalidate(pattern) {
        const keys = Array.from(this.cache.keys());
        const invalidatedKeys = keys.filter(key => key.includes(pattern));
        
        invalidatedKeys.forEach(key => {
            this.cache.delete(key);
            this.ttl.delete(key);
        });

        if (invalidatedKeys.length > 0) {
            console.log(`[QueryCache] Invalidated ${invalidatedKeys.length} keys matching: ${pattern}`);
        }
    }

    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.cache.delete(key);
                this.ttl.delete(key);
                expiredKeys.push(key);
            }
        }

        if (expiredKeys.length > 0) {
            console.log(`[QueryCache] Cleaned up ${expiredKeys.length} expired entries`);
        }
    }

    getStats() {
        return {
            totalEntries: this.cache.size,
            memoryUsage: JSON.stringify([...this.cache.entries()]).length,
            oldestEntry: Math.min(...this.ttl.values()) - Date.now()
        };
    }

    clear() {
        this.cache.clear();
        this.ttl.clear();
        console.log('[QueryCache] Cache cleared');
    }
}

// Singleton instance
const queryCache = new QueryCache();

module.exports = queryCache;
