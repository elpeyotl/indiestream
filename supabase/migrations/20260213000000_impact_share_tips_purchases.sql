-- Add tips and purchases visibility columns to impact_shares table
alter table public.impact_shares
add column show_tips boolean default true,
add column show_purchases boolean default true;
