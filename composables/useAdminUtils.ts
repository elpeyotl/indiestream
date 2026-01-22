// Shared utilities for admin dashboard components
export const useAdminUtils = () => {
  const toast = useToast()

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCents = (cents: number): string => {
    return (cents / 100).toFixed(2)
  }

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Status color mappings
  const getStatusColor = (status: string) => {
    const colors = {
      // General statuses
      active: 'green' as const,
      pending: 'yellow' as const,
      approved: 'green' as const,
      rejected: 'red' as const,
      suspended: 'orange' as const,
      removed: 'red' as const,
      // Report/DMCA statuses
      investigating: 'blue' as const,
      processing: 'blue' as const,
      resolved: 'gray' as const,
      dismissed: 'gray' as const,
      content_removed: 'green' as const,
      counter_notice: 'orange' as const,
      // Moderation statuses
      revision_requested: 'orange' as const,
      pending_update: 'yellow' as const,
    }
    return (colors as Record<string, 'green' | 'yellow' | 'red' | 'orange' | 'blue' | 'gray'>)[status] || ('gray' as const)
  }

  const getReasonColor = (reason: string) => {
    const colors = {
      copyright: 'red' as const,
      ai_generated: 'violet' as const,
      inappropriate: 'orange' as const,
      other: 'gray' as const,
    }
    return (colors as Record<string, 'red' | 'violet' | 'orange' | 'gray'>)[reason] || ('gray' as const)
  }

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      copyright: 'Copyright Violation',
      ai_generated: 'AI-Generated',
      inappropriate: 'Inappropriate',
      other: 'Other',
    }
    return labels[reason] || reason
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'red' as const,
      high: 'orange' as const,
      normal: 'gray' as const,
    }
    return (colors as Record<string, 'red' | 'orange' | 'gray'>)[priority] || ('gray' as const)
  }

  const getReleaseTypeColor = (type: string) => {
    const colors = {
      album: 'violet' as const,
      ep: 'blue' as const,
      single: 'green' as const,
    }
    return (colors as Record<string, 'violet' | 'blue' | 'green'>)[type] || ('gray' as const)
  }

  // Check if artist has any social links
  const hasAnySocialLink = (artist: {
    instagram?: string | null
    twitter?: string | null
    facebook?: string | null
    youtube?: string | null
    spotify?: string | null
    soundcloud?: string | null
    bandcamp?: string | null
    tiktok?: string | null
  }): boolean => {
    return !!(
      artist.instagram ||
      artist.twitter ||
      artist.facebook ||
      artist.youtube ||
      artist.spotify ||
      artist.soundcloud ||
      artist.bandcamp ||
      artist.tiktok
    )
  }

  // Format social URL (handle both usernames and full URLs)
  const formatSocialUrl = (value: string, platform: string): string => {
    // If it already looks like a URL, return as-is
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }

    // Remove @ if present
    const username = value.replace(/^@/, '')

    // Build URL based on platform
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`
      case 'twitter':
        return `https://x.com/${username}`
      case 'tiktok':
        return `https://tiktok.com/@${username}`
      case 'facebook':
        return `https://facebook.com/${username}`
      case 'youtube':
        return `https://youtube.com/${username}`
      case 'spotify':
        return value // Spotify URLs are complex, assume they passed a full URL
      case 'soundcloud':
        return `https://soundcloud.com/${username}`
      case 'bandcamp':
        return `https://${username}.bandcamp.com`
      default:
        return value
    }
  }

  return {
    toast,
    formatDate,
    formatCents,
    formatCurrency,
    formatNumber,
    getStatusColor,
    getReasonColor,
    getReasonLabel,
    getPriorityColor,
    getReleaseTypeColor,
    hasAnySocialLink,
    formatSocialUrl,
  }
}
