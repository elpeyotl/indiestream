// Generic stale-while-revalidate cache with localStorage persistence
import type { Ref, DeepReadonly } from 'vue'

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: number
}

interface UsePersistedStoreOptions<T> {
  key: string                    // localStorage key
  ttlMs?: number                 // Cache TTL (default 1 hour)
  version?: number               // Schema version (bump to invalidate old cache)
  fetcher: () => Promise<T>      // Function to fetch fresh data
}

interface UsePersistedStoreReturn<T> {
  data: DeepReadonly<Ref<T | null>>
  loading: DeepReadonly<Ref<boolean>>
  isRevalidating: DeepReadonly<Ref<boolean>>
  error: DeepReadonly<Ref<boolean>>
  initialize: () => Promise<void>
  refresh: () => Promise<void>
  invalidate: () => void
}

// Module-level in-memory cache (shared across components)
const memoryCache = new Map<string, CacheEntry<any>>()

export const usePersistedStore = <T>(options: UsePersistedStoreOptions<T>): UsePersistedStoreReturn<T> => {
  const {
    key,
    ttlMs = 60 * 60 * 1000, // 1 hour default
    version = 1,
    fetcher,
  } = options

  const storageKey = `fairstream_cache_${key}`

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const isRevalidating = ref(false)
  const error = ref(false)

  // Check if cache entry is valid
  const isCacheValid = (entry: CacheEntry<T> | null): boolean => {
    if (!entry) return false
    if (entry.version !== version) return false
    return Date.now() - entry.timestamp < ttlMs
  }

  // Read from localStorage
  const readFromStorage = (): CacheEntry<T> | null => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error(`Failed to read cache ${key}:`, e)
    }
    return null
  }

  // Write to localStorage
  const writeToStorage = (entry: CacheEntry<T>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch (e) {
      console.error(`Failed to write cache ${key}:`, e)
    }
  }

  // Fetch fresh data and update caches
  const revalidate = async (): Promise<T | null> => {
    isRevalidating.value = true
    error.value = false
    try {
      const freshData = await fetcher()
      const entry: CacheEntry<T> = {
        data: freshData,
        timestamp: Date.now(),
        version,
      }
      memoryCache.set(key, entry)
      writeToStorage(entry)
      data.value = freshData
      return freshData
    } catch (e) {
      console.error(`Failed to fetch ${key}:`, e)
      error.value = true
      return null
    } finally {
      isRevalidating.value = false
      loading.value = false
    }
  }

  // Initialize: check memory -> localStorage -> fetch
  // Always revalidates in background if we have cached data (stale-while-revalidate)
  const initialize = async () => {
    loading.value = true
    error.value = false

    // 1. Check in-memory cache first (fastest)
    const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined
    if (memEntry) {
      data.value = memEntry.data
      loading.value = false
      // Always revalidate in background (stale-while-revalidate)
      revalidate()
      return
    }

    // 2. Check localStorage (warm cache)
    const storageEntry = readFromStorage()
    if (storageEntry) {
      // Show stale data immediately
      data.value = storageEntry.data
      memoryCache.set(key, storageEntry)
      loading.value = false
      // Always revalidate in background (stale-while-revalidate)
      revalidate()
      return
    }

    // 3. No cache - fetch fresh data (blocking)
    await revalidate()
  }

  // Force refresh (bypass cache)
  const refresh = async () => {
    loading.value = true
    await revalidate()
  }

  // Invalidate cache
  const invalidate = () => {
    memoryCache.delete(key)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    data.value = null
  }

  return {
    data: readonly(data) as DeepReadonly<Ref<T | null>>,
    loading: readonly(loading),
    isRevalidating: readonly(isRevalidating),
    error: readonly(error),
    initialize,
    refresh,
    invalidate,
  }
}
