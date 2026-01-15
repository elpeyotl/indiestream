#!/usr/bin/env npx tsx
// Script to approve all pending/pending_update tracks in one go
// Usage: npx tsx scripts/approve-all-tracks.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('- SUPABASE_URL or NUXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function approveAllTracks() {
  console.log('Fetching pending tracks...')

  // Get all pending and pending_update tracks
  const { data: tracks, error: fetchError } = await supabase
    .from('tracks')
    .select('id, title, moderation_status, album:albums!album_id(title), band:bands!band_id(name)')
    .in('moderation_status', ['pending', 'pending_update'])

  if (fetchError) {
    console.error('Failed to fetch tracks:', fetchError)
    process.exit(1)
  }

  if (!tracks || tracks.length === 0) {
    console.log('No pending tracks found.')
    return
  }

  console.log(`Found ${tracks.length} pending track(s):\n`)

  for (const track of tracks) {
    const bandName = (track.band as any)?.name || 'Unknown Artist'
    const albumTitle = (track.album as any)?.title || 'Unknown Album'
    console.log(`  - "${track.title}" by ${bandName} (${albumTitle}) [${track.moderation_status}]`)
  }

  console.log('\nApproving all tracks...')

  // Update all tracks to approved
  const { error: updateError, count } = await supabase
    .from('tracks')
    .update({
      moderation_status: 'approved',
      moderation_notes: 'Bulk approved via script',
      moderated_at: new Date().toISOString(),
    })
    .in('moderation_status', ['pending', 'pending_update'])

  if (updateError) {
    console.error('Failed to approve tracks:', updateError)
    process.exit(1)
  }

  // Update moderation queue
  const { error: queueError } = await supabase
    .from('moderation_queue')
    .update({
      status: 'approved',
      notes: 'Bulk approved via script',
      reviewed_at: new Date().toISOString(),
    })
    .in('status', ['pending', 'pending_update'])

  if (queueError) {
    console.error('Warning: Failed to update moderation queue:', queueError)
  }

  console.log(`\n✓ Approved ${tracks.length} track(s) successfully!`)
}

approveAllTracks()
