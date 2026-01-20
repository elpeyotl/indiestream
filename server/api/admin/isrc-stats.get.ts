// GET /api/admin/isrc-stats - Get platform ISRC allocation statistics
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  // Get counter stats
  const { data: counters, error: countersError } = await client
    .from('platform_isrc_counters')
    .select('*')
    .order('year', { ascending: true })

  if (countersError) {
    console.error('Failed to fetch ISRC counters:', countersError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch ISRC statistics' })
  }

  // Get allocation stats per year
  const { data: allocations, error: allocError } = await client
    .from('platform_isrc_allocations')
    .select('allocation_year, status')

  if (allocError) {
    console.error('Failed to fetch ISRC allocations:', allocError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch ISRC statistics' })
  }

  // Aggregate allocation stats
  const allocationStats: Record<number, { assigned: number; available: number }> = {}
  for (const alloc of allocations || []) {
    if (!allocationStats[alloc.allocation_year]) {
      allocationStats[alloc.allocation_year] = { assigned: 0, available: 0 }
    }
    if (alloc.status === 'assigned') {
      allocationStats[alloc.allocation_year].assigned++
    } else {
      allocationStats[alloc.allocation_year].available++
    }
  }

  // Build response with year-by-year breakdown
  const yearStats = (counters || []).map(counter => {
    const stats = allocationStats[counter.year] || { assigned: 0, available: 0 }
    const totalAllocated = counter.next_sequence
    const totalAvailable = counter.max_sequence + 1 // 0-49999 = 50000 codes
    const remaining = totalAvailable - totalAllocated + stats.available // Unused + recycled

    return {
      year: counter.year,
      prefix: counter.range_prefix,
      totalAllocated,
      assigned: stats.assigned,
      available: stats.available, // Recycled and available for reuse
      remaining,
      percentUsed: ((totalAllocated - stats.available) / totalAvailable * 100).toFixed(1),
    }
  })

  // Calculate totals
  const totals = yearStats.reduce(
    (acc, year) => ({
      totalAllocated: acc.totalAllocated + year.totalAllocated,
      assigned: acc.assigned + year.assigned,
      available: acc.available + year.available,
      remaining: acc.remaining + year.remaining,
    }),
    { totalAllocated: 0, assigned: 0, available: 0, remaining: 0 }
  )

  return {
    yearStats,
    totals,
    currentYear: new Date().getFullYear(),
  }
})
