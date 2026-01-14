// Money distribution composable for "Where Your Money Went" feature

interface ArtistBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  listeningSeconds: number
  streamCount: number
  percentageOfListening: number
  earningsCents: number
}

interface MoneyDistribution {
  period: 'all-time' | 'last-month'
  periodLabel: string
  subscriptionStatus: 'active' | 'trialing' | 'inactive'
  totalPaidCents: number
  artistPoolCents: number
  cmoFeeCents: number
  platformFeeCents: number
  totalListeningSeconds: number
  totalStreams: number
  monthsSubscribed: number
  artistBreakdown: ArtistBreakdown[]
}

export const useMoneyDistribution = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const distribution = ref<MoneyDistribution | null>(null)

  const fetchDistribution = async (period: 'all-time' | 'last-month') => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<MoneyDistribution>('/api/listener/money-distribution', {
        query: { period },
      })

      // Get presigned URLs for artist avatars
      const { getStreamUrl } = useAlbum()
      for (const artist of data.artistBreakdown) {
        if (artist.avatarKey) {
          try {
            artist.avatarUrl = await getStreamUrl(artist.avatarKey)
          } catch (e) {
            console.error('Failed to load avatar for artist:', artist.bandId, e)
          }
        }
      }

      distribution.value = data
    } catch (e: any) {
      console.error('Failed to fetch money distribution:', e)
      error.value = e.message || 'Failed to load distribution data'
    } finally {
      loading.value = false
    }
  }

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return {
    loading,
    error,
    distribution,
    fetchDistribution,
    formatCurrency,
    formatPercentage,
    formatDuration,
  }
}
