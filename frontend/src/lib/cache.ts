/**
 * Client-side caching utility
 * Provides in-memory caching with TTL support
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a cache item with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Get a cache item if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const age = now - item.timestamp;

    if (age > item.ttl) {
      // Item has expired, remove it
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific cache item
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  clearExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp;
      if (age > item.ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get or set pattern: fetch if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache key generators
export const CACHE_KEYS = {
  PRODUCTS_LIST: (page: number, limit: number) => `products:list:${page}:${limit}`,
  PRODUCT_BY_ID: (id: string) => `product:${id}`,
  PRODUCT_BY_SKU: (sku: string) => `product:sku:${sku}`,
  LOW_STOCK_PRODUCTS: 'products:low-stock',
  CATEGORIES_LIST: 'categories:list',
  BRANDS_LIST: 'brands:list',
  SUPPLIERS_LIST: 'suppliers:list',
  DASHBOARD_STATS: 'dashboard:stats',
  SALES_ORDERS: (page: number) => `sales:orders:${page}`,
  SALES_REPORTS: (date: string) => `sales:reports:${date}`,
  CUSTOMERS_LIST: (page: number) => `customers:list:${page}`,
  INVENTORY_STATS: 'inventory:stats',
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  STATIC_DATA: 60 * 60 * 1000,      // 1 hour (categories, brands)
  PRODUCT_DATA: 5 * 60 * 1000,      // 5 minutes
  DASHBOARD: 1 * 60 * 1000,         // 1 minute
  REPORTS: 30 * 60 * 1000,          // 30 minutes
  LOW_STOCK: 5 * 60 * 1000,         // 5 minutes
  SEARCH_RESULTS: 2 * 60 * 1000,    // 2 minutes
};

// Auto-cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleared = cache.clearExpired();
    if (cleared > 0) {
      console.log(`[Cache] Cleared ${cleared} expired items`);
    }
  }, 5 * 60 * 1000);
}

export default cache;



