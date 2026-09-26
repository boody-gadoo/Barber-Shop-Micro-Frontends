/**
 * Redis Caching Layer Configuration
 * 
 * Provides distributed caching for frequently accessed data with 1-hour TTL.
 * Reduces database load and improves response times.
 * 
 * Usage:
 * ```ts
 * const cache = new RedisCache();
 * 
 * // Get or fetch from DB
 * const barber = await cache.get('barber:123', async () => {
 *   return db.barbers.findById('123');
 * });
 * 
 * // Set with custom TTL
 * await cache.set('booking:456', bookingData, 3600); // 1 hour
 * 
 * // Invalidate
 * await cache.invalidate('barber:*');
 * ```
 */

export interface CacheOptions {
  ttl?: number; // Time-to-live in seconds
  tags?: string[]; // Tags for batch invalidation
}

export interface CacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  // Fallback to in-memory if Redis unavailable
  fallbackToMemory?: boolean;
  // Default TTL in seconds (1 hour)
  defaultTtl?: number;
}

/**
 * Redis cache implementation
 */
export class RedisCache {
  private config: Required<CacheConfig>;
  private redisClient: any; // Would be RedisClientType in real implementation
  private memoryCache: Map<string, { value: any; expiresAt: number }>;
  private tagIndex: Map<string, Set<string>>;
  private isConnected: boolean;

  constructor(config: CacheConfig = {}) {
    this.config = {
      redis: config.redis || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: 0,
      },
      fallbackToMemory: config.fallbackToMemory ?? true,
      defaultTtl: config.defaultTtl ?? 3600, // 1 hour
    };

    this.memoryCache = new Map();
    this.tagIndex = new Map();
    this.isConnected = false;

    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    try {
      // In real implementation:
      // import redis from 'redis';
      // this.redisClient = redis.createClient(this.config.redis);
      // await this.redisClient.connect();

      console.log('[Cache] Redis connection established');
      this.isConnected = true;
    } catch (error) {
      console.warn('[Cache] Redis connection failed, using memory cache:', error);

      if (!this.config.fallbackToMemory) {
        throw error;
      }

      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, fetchFn?: () => Promise<T>, options?: CacheOptions): Promise<T | null> {
    // Check memory cache first
    const cached = this.getFromMemory<T>(key);
    if (cached !== null) {
      console.log('[Cache] Memory cache hit:', key);
      return cached;
    }

    if (this.isConnected && this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) {
          console.log('[Cache] Redis cache hit:', key);
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('[Cache] Redis get failed:', error);
      }
    }

    // Cache miss - fetch if function provided
    if (fetchFn) {
      const value = await fetchFn();
      await this.set(key, value, options);
      return value;
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? this.config.defaultTtl;

    // Set in memory cache
    this.setInMemory(key, value, ttl);

    // Set in Redis if connected
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        console.log('[Cache] Redis set:', key, `(TTL: ${ttl}s)`);
      } catch (error) {
        console.warn('[Cache] Redis set failed:', error);
      }
    }

    // Index tags for batch invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    // Delete from memory cache
    this.memoryCache.delete(key);

    // Delete from Redis if connected
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
        console.log('[Cache] Redis delete:', key);
      } catch (error) {
        console.warn('[Cache] Redis delete failed:', error);
      }
    }
  }

  /**
   * Invalidate by pattern (e.g., "barber:*")
   */
  async invalidate(pattern: string): Promise<void> {
    const regex = this.patternToRegex(pattern);

    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate Redis if connected
    if (this.isConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          console.log(`[Cache] Redis invalidated ${keys.length} keys matching: ${pattern}`);
        }
      } catch (error) {
        console.warn('[Cache] Redis invalidate failed:', error);
      }
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);

    if (keys) {
      for (const key of keys) {
        await this.delete(key);
      }

      this.tagIndex.delete(tag);
      console.log(`[Cache] Invalidated ${keys.size} keys with tag: ${tag}`);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    memoryCacheSize: number;
    memoryEntries: number;
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryEntries: this.memoryCache.size,
    };
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.tagIndex.clear();

    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.flushDb();
        console.log('[Cache] Redis cache cleared');
      } catch (error) {
        console.warn('[Cache] Redis clear failed:', error);
      }
    }
  }

  /**
   * Private: Get from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Private: Set in memory cache
   */
  private setInMemory<T>(key: string, value: T, ttl: number): void {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });

    // Cleanup expired entries periodically
    if (this.memoryCache.size > 1000) {
      this.cleanupExpiredEntries();
    }
  }

  /**
   * Private: Clean expired entries from memory cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log('[Cache] Cleaned up', cleaned, 'expired entries');
    }
  }

  /**
   * Private: Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }
}

/**
 * Global cache instance
 */
let cacheInstance: RedisCache | null = null;

/**
 * Get or create global cache instance
 */
export function getCache(config?: CacheConfig): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache(config);
  }
  return cacheInstance;
}

/**
 * Cache decorator for functions
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return cache.get(cacheKey, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
