// Shared utilities for artist dashboard components
export const useArtistDashboard = () => {
  const toast = useToast()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Country code to flag emoji
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍'
    // XX is used for unknown locations
    if (countryCode.toUpperCase() === 'XX') return '🌍'
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  // Country code to name (common countries)
  const countryNames: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    CH: 'Switzerland',
    AT: 'Austria',
    CA: 'Canada',
    AU: 'Australia',
    NL: 'Netherlands',
    BE: 'Belgium',
    IT: 'Italy',
    ES: 'Spain',
    JP: 'Japan',
    KR: 'South Korea',
    BR: 'Brazil',
    MX: 'Mexico',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    IE: 'Ireland',
    NZ: 'New Zealand',
    PT: 'Portugal',
    CZ: 'Czech Republic',
    RU: 'Russia',
    IN: 'India',
    CN: 'China',
    ZA: 'South Africa',
    AR: 'Argentina',
    XX: 'Unknown',
  }

  const getCountryName = (countryCode: string): string => {
    return countryNames[countryCode?.toUpperCase()] || countryCode || 'Unknown'
  }

  return {
    toast,
    formatNumber,
    formatListeningTime,
    formatCurrency,
    formatDate,
    getCountryFlag,
    getCountryName,
  }
}
