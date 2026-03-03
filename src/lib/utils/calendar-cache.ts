/**
 * Calendar data cache for storing fetched symptom logs by month
 * Implements TTL-based caching to prevent redundant API calls
 */

import { SymptomLog } from '@/types';

interface CacheEntry {
  data: SymptomLog[];
  timestamp: number;
}

export class CalendarDataCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Get cached data for a month key
   * Returns null if not cached or expired
   */
  get(monthKey: string): SymptomLog[] | null {
    const entry = this.cache.get(monthKey);
    
    if (!entry) {
      return null;
    }

    // Check if cache is stale
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(monthKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data for a month key
   */
  set(monthKey: string, data: SymptomLog[]): void {
    this.cache.set(monthKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear specific month from cache
   */
  clearMonth(monthKey: string): void {
    this.cache.delete(monthKey);
  }

  /**
   * Check if a month is cached and valid
   */
  has(monthKey: string): boolean {
    return this.get(monthKey) !== null;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance for global use
let cacheInstance: CalendarDataCache | null = null;

export function getCalendarCache(): CalendarDataCache {
  if (!cacheInstance) {
    cacheInstance = new CalendarDataCache(5); // 5 minute TTL
  }
  return cacheInstance;
}
