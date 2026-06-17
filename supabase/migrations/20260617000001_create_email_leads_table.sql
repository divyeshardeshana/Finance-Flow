-- Email leads captured from marketing pages (pricing, landing page, blog)
create table if not exists public.email_leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source        text not null default 'unknown',   -- e.g. 'pricing_page', 'landing_page', 'blog'
  subscribed    boolean not null default true,
  drip_step     int not null default 0,            -- which email in sequence has been sent (0 = none)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Unique on email so re-submissions just update source/subscribed
create unique index if not exists email_leads_email_idx on public.email_leads (email);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists email_leads_updated_at on public.email_leads;
create trigger email_leads_updated_at
  before update on public.email_leads
  for each row execute procedure public.set_updated_at();

-- RLS: only service role can read/write (edge functions use service key)
alter table public.email_leads enable row level security;

-- Block all anon/authenticated access — edge functions bypass RLS via service key
create policy "deny all" on public.email_leads
  for all using (false);
