// Map slugs to actual filenames
const docFiles: Record<string, string> = {
  'todo': 'TODO.md',
  'artist-payout-system': 'ARTIST_PAYOUT_SYSTEM.md',
  'free-tier-business-logic': 'FREE_TIER_BUSINESS_LOGIC.md',
  'notes': 'NOTES.md',
  'brand': 'BRAND.md',
  'supabase-setup': 'SUPABASE_SETUP.md',
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug || !docFiles[slug]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found',
    })
  }

  const filename = docFiles[slug]

  // Get the base URL from the request
  const requestUrl = getRequestURL(event)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

  try {
    // Fetch from public folder
    const response = await fetch(`${baseUrl}/docs/${filename}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const content = await response.text()
    return content
  } catch (error) {
    console.error('Failed to fetch doc file:', error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found',
    })
  }
})
