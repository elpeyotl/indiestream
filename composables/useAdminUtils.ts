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
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      // General statuses
      active: 'green',
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      suspended: 'orange',
      removed: 'red',
      // Report/DMCA statuses
      investigating: 'blue',
      processing: 'blue',
      resolved: 'gray',
      dismissed: 'gray',
      content_removed: 'green',
      counter_notice: 'orange',
      // Moderation statuses
      revision_requested: 'orange',
      pending_update: 'yellow',
    }
    return colors[status] || 'gray'
  }

  const getReasonColor = (reason: string): string => {
    const colors: Record<string, string> = {
      copyright: 'red',
      ai_generated: 'violet',
      inappropriate: 'orange',
      other: 'gray',
    }
    return colors[reason] || 'gray'
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

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      urgent: 'red',
      high: 'orange',
      normal: 'gray',
    }
    return colors[priority] || 'gray'
  }

  const getReleaseTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      album: 'violet',
      ep: 'blue',
      single: 'green',
    }
    return colors[type] || 'gray'
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
