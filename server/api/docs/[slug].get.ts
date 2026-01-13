import { readFile } from 'fs/promises'
import { join } from 'path'

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
  const docsDir = join(process.cwd(), 'docs')
  const filePath = join(docsDir, filename)

  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Failed to read doc file:', error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found',
    })
  }
})
