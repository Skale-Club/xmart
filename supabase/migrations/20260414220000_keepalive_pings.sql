-- Dedicated table for the keepalive cron. Each run writes a row via the
-- service role and reads it back via the anon key, generating real public
-- API traffic so Supabase does not flag the project as inactive.

create table if not exists public.keepalive_pings (
    id bigserial primary key,
    source text not null default 'unknown',
    pinged_at timestamptz not null default now()
);

create index if not exists keepalive_pings_pinged_at_idx
    on public.keepalive_pings (pinged_at desc);

alter table public.keepalive_pings enable row level security;

-- Allow the anon key to read rows (needed so the keepalive read-back
-- counts as public API activity). No insert/update/delete for anon.
drop policy if exists "keepalive_pings anon read" on public.keepalive_pings;
create policy "keepalive_pings anon read"
    on public.keepalive_pings
    for select
    to anon, authenticated
    using (true);
