-- Zine Albums table for curated staff picks and overlooked albums
-- Used by the /zine page for editorial content

create table public.zine_albums (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  category text not null check (category in ('staff_pick', 'overlooked')),
  description text, -- Editorial blurb for this album
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Each album can only appear once per category
  unique (album_id, category)
);

-- Index for efficient queries
create index idx_zine_albums_category on public.zine_albums(category, position);

-- RLS policies
alter table public.zine_albums enable row level security;

-- Anyone can read zine albums (public page)
create policy "Zine albums are viewable by everyone"
  on public.zine_albums for select
  using (true);

-- Only admins can manage zine albums
create policy "Admins can manage zine albums"
  on public.zine_albums for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create or replace timestamp function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Update timestamp trigger
create trigger set_zine_albums_updated_at
  before update on public.zine_albums
  for each row
  execute function public.set_updated_at();
