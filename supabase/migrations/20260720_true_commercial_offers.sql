create table if not exists public.commercial_offers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_number text not null,
  customer_name text,
  project_reference text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_offers_user_updated_idx
  on public.commercial_offers (user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists commercial_offers_set_updated_at on public.commercial_offers;
create trigger commercial_offers_set_updated_at
before update on public.commercial_offers
for each row execute function public.set_updated_at();

alter table public.commercial_offers enable row level security;

drop policy if exists "users read own commercial offers" on public.commercial_offers;
create policy "users read own commercial offers" on public.commercial_offers
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users create own commercial offers" on public.commercial_offers;
create policy "users create own commercial offers" on public.commercial_offers
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users update own commercial offers" on public.commercial_offers;
create policy "users update own commercial offers" on public.commercial_offers
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own commercial offers" on public.commercial_offers;
create policy "users delete own commercial offers" on public.commercial_offers
for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'commercial-offer-images',
  'commercial-offer-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users read own commercial offer images" on storage.objects;
create policy "users read own commercial offer images" on storage.objects
for select to authenticated using (
  bucket_id = 'commercial-offer-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users upload own commercial offer images" on storage.objects;
create policy "users upload own commercial offer images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'commercial-offer-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own commercial offer images" on storage.objects;
create policy "users update own commercial offer images" on storage.objects
for update to authenticated using (
  bucket_id = 'commercial-offer-images'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'commercial-offer-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own commercial offer images" on storage.objects;
create policy "users delete own commercial offer images" on storage.objects
for delete to authenticated using (
  bucket_id = 'commercial-offer-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
