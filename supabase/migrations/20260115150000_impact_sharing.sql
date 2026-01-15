-- Add public impact visibility to profiles
alter table public.profiles
add column show_impact_publicly boolean default false;

-- Create impact_shares table for shareable impact stats
create table public.impact_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  period text not null check (period in ('this-month', 'last-month', 'all-time')),

  -- Stats visibility toggles
  show_total_earned boolean default true,
  show_artists_supported boolean default true,
  show_listening_time boolean default true,
  show_stream_count boolean default true,
  show_artist_breakdown boolean default false,

  -- Metadata
  created_at timestamptz default now() not null,
  expires_at timestamptz,
  view_count integer default 0 not null
);

-- Enable RLS
alter table public.impact_shares enable row level security;

-- Users can manage their own shares
create policy "Users can manage own impact shares"
  on public.impact_shares
  for all
  using (auth.uid() = user_id);

-- Anyone can view shares by token (public)
create policy "Anyone can view shares by token"
  on public.impact_shares
  for select
  using (true);

-- Indexes for performance
create index impact_shares_token_idx on public.impact_shares(token);
create index impact_shares_user_id_idx on public.impact_shares(user_id);
create index impact_shares_created_at_idx on public.impact_shares(created_at desc);
