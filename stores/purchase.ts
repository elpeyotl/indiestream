// Pinia store for purchase management
// Handles album purchases, ownership checks, and download URLs
import { defineStore } from 'pinia'

export interface PurchasedAlbum {
  id: string
  amount: number
  currency: string
  purchasedAt: string
  album: {
    id: string
    title: string
    slug: string
    coverKey: string | null
    artist: {
      id: string
      name: string
      slug: string
    } | null
  } | null
}

export interface PurchaseStatus {
  owned: boolean
  purchase: {
    id: string
    amount: number
    currency: string
    purchasedAt: string
  } | null
}

export interface DownloadLink {
  trackId: string
  title: string
  trackNumber: number
  url: string | null
  filename?: string
  format?: string
  error?: string
}

export interface DownloadData {
  album: {
    id: string
    title: string
    artist: string
  }
  format: string
  tracks: DownloadLink[]
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export const usePurchaseStore = defineStore('purchase', () => {
  const toast = useToast()

  // State
  const purchasedAlbums = ref<PurchasedAlbum[]>([])
  const purchasedAlbumIds = ref<Set<string>>(new Set())
  const purchaseStatusCache = ref<Map<string, PurchaseStatus>>(new Map())

  // Loading states
  const loadingPurchases = ref(false)
  const purchasingAlbum = ref(false)
  const loadingDownload = ref(false)

  // Cache timestamps
  let purchasesFetchedAt = 0
  let statusCacheFetchedAt: Record<string, number> = {}

  // Check if cache is stale
  const isPurchasesStale = () => Date.now() - purchasesFetchedAt > CACHE_TTL
  const isStatusStale = (albumId: string) => {
    const fetchedAt = statusCacheFetchedAt[albumId] || 0
    return Date.now() - fetchedAt > CACHE_TTL
  }

  // Check if user owns an album (from cache)
  const ownsAlbum = (albumId: string): boolean => {
    return purchasedAlbumIds.value.has(albumId)
  }

  // Fetch purchase status for a specific album
  const fetchPurchaseStatus = async (albumId: string, forceRefresh = false): Promise<PurchaseStatus> => {
    // Return cached if available and fresh
    if (!forceRefresh && !isStatusStale(albumId)) {
      const cached = purchaseStatusCache.value.get(albumId)
      if (cached) return cached
    }

    try {
      const data = await $fetch<PurchaseStatus>(`/api/albums/${albumId}/purchase-status`)

      // Update cache
      purchaseStatusCache.value.set(albumId, data)
      statusCacheFetchedAt[albumId] = Date.now()

      // Update owned set
      if (data.owned) {
        purchasedAlbumIds.value.add(albumId)
      }

      return data
    } catch (error) {
      console.error('Failed to fetch purchase status:', error)
      return { owned: false, purchase: null }
    }
  }

  // Fetch user's purchase history
  const fetchPurchases = async (page = 1, limit = 20, forceRefresh = false) => {
    // Return cached if available and fresh
    if (!forceRefresh && !isPurchasesStale() && purchasedAlbums.value.length > 0) {
      return {
        purchases: purchasedAlbums.value,
        total: purchasedAlbums.value.length,
        page: 1,
        totalPages: 1,
      }
    }

    loadingPurchases.value = true
    try {
      const data = await $fetch<{
        purchases: PurchasedAlbum[]
        total: number
        page: number
        limit: number
        totalPages: number
      }>('/api/user/purchases', {
        query: { page, limit },
      })

      // Update state
      if (page === 1) {
        purchasedAlbums.value = data.purchases
        purchasedAlbumIds.value = new Set(
          data.purchases
            .filter((p) => p.album)
            .map((p) => p.album!.id)
        )
      } else {
        // Append for pagination
        purchasedAlbums.value.push(...data.purchases)
        data.purchases.forEach((p) => {
          if (p.album) purchasedAlbumIds.value.add(p.album.id)
        })
      }

      purchasesFetchedAt = Date.now()
      return data
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
      throw error
    } finally {
      loadingPurchases.value = false
    }
  }

  // Create a purchase (returns Stripe client secret)
  const createPurchase = async (
    albumId: string,
    amountCents?: number
  ): Promise<{ clientSecret: string; amount: number; currency: string }> => {
    purchasingAlbum.value = true
    try {
      const data = await $fetch<{
        clientSecret: string
        amount: number
        currency: string
      }>(`/api/albums/${albumId}/purchase`, {
        method: 'POST',
        body: { amount_cents: amountCents },
      })

      return data
    } catch (error: any) {
      const message = error.data?.message || error.message || 'Failed to create purchase'
      toast.add({
        title: 'Purchase Error',
        description: message,
        color: 'red',
      })
      throw error
    } finally {
      purchasingAlbum.value = false
    }
  }

  // Mark purchase as complete (called after Stripe confirms payment)
  const markPurchaseComplete = (albumId: string) => {
    purchasedAlbumIds.value.add(albumId)

    // Invalidate status cache to force refresh
    purchaseStatusCache.value.delete(albumId)
    delete statusCacheFetchedAt[albumId]

    // Invalidate purchases list
    purchasesFetchedAt = 0

    toast.add({
      title: 'Purchase Complete',
      description: 'Your album is ready for download!',
      color: 'green',
    })
  }

  // Get download URLs for a purchased album
  const getDownloadUrls = async (
    albumId: string,
    format: 'aac' | 'flac' = 'aac'
  ): Promise<DownloadData> => {
    loadingDownload.value = true
    try {
      const data = await $fetch<DownloadData>(`/api/albums/${albumId}/download`, {
        query: { format },
      })

      return data
    } catch (error: any) {
      const message = error.data?.message || error.message || 'Failed to get download links'
      toast.add({
        title: 'Download Error',
        description: message,
        color: 'red',
      })
      throw error
    } finally {
      loadingDownload.value = false
    }
  }

  // Reset store on logout
  const reset = () => {
    purchasedAlbums.value = []
    purchasedAlbumIds.value = new Set()
    purchaseStatusCache.value = new Map()
    purchasesFetchedAt = 0
    statusCacheFetchedAt = {}
  }

  return {
    // State
    purchasedAlbums,
    purchasedAlbumIds,
    loadingPurchases,
    purchasingAlbum,
    loadingDownload,

    // Getters
    ownsAlbum,

    // Actions
    fetchPurchaseStatus,
    fetchPurchases,
    createPurchase,
    markPurchaseComplete,
    getDownloadUrls,
    reset,
  }
})
