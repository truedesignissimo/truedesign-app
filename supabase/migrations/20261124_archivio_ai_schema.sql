-- Archivio AI — passo 1: schema.
-- Solo oggetti NUOVI: non tocca tabelle, funzioni o bucket esistenti.
-- Si può rilanciare senza danni (if not exists / drop policy if exists).
--
-- Invarianti:
-- - chi non è admin (e la chiave pubblica) non legge e non scrive nulla;
-- - le righe le creano solo i flussi server (service role): n8n, Edge Function, script;
-- - un admin può cambiare solo i campi di revisione, mai i valori dati dalla macchina (*_ai);
-- - una stessa immagine Drive (id_drive) esiste una volta sola.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- 1) Prodotti addestrati (vettori DINOv2, 768 dimensioni)
-- ---------------------------------------------------------------------------
create table if not exists public.prodotti_addestrati (
  id bigint generated always as identity primary key,
  member text not null unique,              -- percorso della foto: Collezione/Variante/file
  concept text not null,                    -- prodotto, es. "Abisko-Divano"
  collection text not null,                 -- collezione, es. "Abisko"
  id_drive text,                            -- id del file su Google Drive (vuoto per lo storico)
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prodotti_addestrati_embedding_idx
  on public.prodotti_addestrati
  using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists prodotti_addestrati_concept_idx
  on public.prodotti_addestrati (collection, concept);

drop trigger if exists prodotti_addestrati_set_updated_at on public.prodotti_addestrati;
create trigger prodotti_addestrati_set_updated_at
before update on public.prodotti_addestrati
for each row execute function public.set_updated_at();

alter table public.prodotti_addestrati enable row level security;
revoke all on public.prodotti_addestrati from anon, authenticated;
-- Nessuna policy: la tabella con i vettori è accessibile solo dal server.

-- Elenco prodotti/collezioni per i filtri e per la correzione a mano (senza vettori).
create or replace function public.archivio_ai_prodotti()
returns table (concept text, collection text, immagini bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.concept, p.collection, count(*)::bigint
  from public.prodotti_addestrati p
  where public.is_current_user_admin()
  group by p.concept, p.collection
  order by p.collection, p.concept;
$$;

revoke all on function public.archivio_ai_prodotti() from public, anon;
grant execute on function public.archivio_ai_prodotti() to authenticated, service_role;

-- Ricerca del prodotto più vicino (usata dalla Edge Function `predict`).
create or replace function public.match_prodotti(
  query_embedding extensions.vector,
  match_count integer default 20
)
returns table (member text, concept text, collection text, similarity double precision)
language sql
stable
set search_path = public, extensions
as $$
  select p.member, p.concept, p.collection,
         1 - (p.embedding <=> query_embedding) as similarity
  from public.prodotti_addestrati p
  order by p.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 20), 100));
$$;

revoke all on function public.match_prodotti(extensions.vector, integer) from public, anon, authenticated;
grant execute on function public.match_prodotti(extensions.vector, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 2) Archivio immagini
-- ---------------------------------------------------------------------------
create table if not exists public.archivio_immagini (
  id bigint generated always as identity primary key,

  -- provenienza
  id_drive text not null unique,
  nome_file text not null,
  nome_shooting text not null,
  tipologia_shooting text not null
    check (tipologia_shooting in ('Shooting', 'Progetto', 'Still-life', 'Ambientate')),
  origine text not null default 'n8n' check (origine in ('n8n', 'airtable')),
  airtable_record_id text unique,
  id_immagine_legacy integer,

  -- descrizione (scritta dall'AI)
  pertinente boolean not null default true,   -- false = non è una foto di arredo
  tipologie text[] not null default '{}',
  colori text[] not null default '{}',
  contesto text check (contesto in ('Indoor', 'Outdoor', 'Altro')),
  descrizione_breve text,

  -- riconoscimento: valore della macchina (non si modifica)
  prodotto_principale_ai text,
  collezione_principale_ai text,
  accuratezza_principale_ai numeric(5,4)
    check (accuratezza_principale_ai between 0 and 1),
  prodotto_secondario_ai text,
  collezione_secondaria_ai text,
  accuratezza_secondaria_ai numeric(5,4)
    check (accuratezza_secondaria_ai between 0 and 1),

  -- riconoscimento: valore usato (parte uguale a quello AI, lo corregge l'admin)
  prodotto_principale text,
  collezione_principale text,
  accuratezza_principale numeric(5,4)
    check (accuratezza_principale between 0 and 1),
  prodotto_secondario text,
  collezione_secondaria text,
  accuratezza_secondaria numeric(5,4)
    check (accuratezza_secondaria between 0 and 1),

  -- revisione umana
  stato_revisione text not null default 'auto'
    check (stato_revisione in ('auto', 'approvata', 'nascosta')),
  revisionato_at timestamptz,
  revisionato_da uuid references auth.users(id) on delete set null,
  in_addestramento boolean not null default false,  -- la foto è anche tra quelle di addestramento

  -- file: su Supabase solo versioni leggere, l'originale resta su Drive
  anteprima_path text,
  miniatura_path text,
  larghezza integer check (larghezza > 0),
  altezza integer check (altezza > 0),
  peso_originale_byte bigint check (peso_originale_byte >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- calcolati (soglia 0,70: per cambiarla serve una nuova migrazione)
  sopra_soglia boolean generated always as (
    greatest(coalesce(accuratezza_principale, 0), coalesce(accuratezza_secondaria, 0)) >= 0.70
  ) stored,
  visibile boolean generated always as (
    stato_revisione = 'approvata'
    or (
      stato_revisione = 'auto'
      and greatest(coalesce(accuratezza_principale, 0), coalesce(accuratezza_secondaria, 0)) >= 0.70
    )
  ) stored,
  collezione_top text generated always as (
    case
      when coalesce(accuratezza_secondaria, 0) > coalesce(accuratezza_principale, 0)
        then collezione_secondaria
      else collezione_principale
    end
  ) stored
);

create index if not exists archivio_immagini_visibile_idx
  on public.archivio_immagini (visibile, created_at desc);

create index if not exists archivio_immagini_shooting_idx
  on public.archivio_immagini (nome_shooting);

create index if not exists archivio_immagini_collezione_idx
  on public.archivio_immagini (collezione_top);

drop trigger if exists archivio_immagini_set_updated_at on public.archivio_immagini;
create trigger archivio_immagini_set_updated_at
before update on public.archivio_immagini
for each row execute function public.set_updated_at();

-- Segna chi e quando ha rivisto una riga. Non scatta per i flussi server
-- (service role), così la migrazione e n8n non risultano "revisioni".
create or replace function public.archivio_immagini_traccia_revisione()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if (new.stato_revisione, new.prodotto_principale, new.collezione_principale,
      new.accuratezza_principale, new.prodotto_secondario, new.collezione_secondaria,
      new.accuratezza_secondaria)
     is distinct from
     (old.stato_revisione, old.prodotto_principale, old.collezione_principale,
      old.accuratezza_principale, old.prodotto_secondario, old.collezione_secondaria,
      old.accuratezza_secondaria)
  then
    new.revisionato_at = now();
    new.revisionato_da = auth.uid();
  end if;

  return new;
end;
$$;

revoke all on function public.archivio_immagini_traccia_revisione() from public, anon, authenticated;

drop trigger if exists archivio_immagini_traccia_revisione on public.archivio_immagini;
create trigger archivio_immagini_traccia_revisione
before update on public.archivio_immagini
for each row execute function public.archivio_immagini_traccia_revisione();

alter table public.archivio_immagini enable row level security;

revoke all on public.archivio_immagini from anon, authenticated;
grant select on public.archivio_immagini to authenticated;
grant update (
  stato_revisione,
  prodotto_principale, collezione_principale, accuratezza_principale,
  prodotto_secondario, collezione_secondaria, accuratezza_secondaria
) on public.archivio_immagini to authenticated;

drop policy if exists "archivio immagini: admin read" on public.archivio_immagini;
create policy "archivio immagini: admin read"
  on public.archivio_immagini
  for select
  to authenticated
  using (public.is_current_user_admin());

drop policy if exists "archivio immagini: admin review" on public.archivio_immagini;
create policy "archivio immagini: admin review"
  on public.archivio_immagini
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Vista di ricerca: stesso testo del vecchio `search_index` di Airtable
-- (collezione - tipologie contesto descrizione colori, tutto minuscolo).
-- security_invoker: valgono i permessi di chi interroga, non quelli della vista.
create or replace view public.archivio_immagini_ricerca
with (security_invoker = true)
as
select
  a.*,
  lower(concat_ws(' ',
    coalesce(a.collezione_top, '') || ' -',
    array_to_string(a.tipologie, ' '),
    a.contesto,
    a.descrizione_breve,
    array_to_string(a.colori, ' ')
  )) as search_index
from public.archivio_immagini a;

revoke all on public.archivio_immagini_ricerca from anon, authenticated;
grant select on public.archivio_immagini_ricerca to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Storage: bucket privato con anteprime e miniature
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'archivio-immagini', 'archivio-immagini', false, 2097152,
  array['image/webp', 'image/jpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "archivio immagini: admin read files" on storage.objects;
create policy "archivio immagini: admin read files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'archivio-immagini'
    and public.is_current_user_admin()
  );
-- Caricamento e cancellazione dei file: solo dal server (service role).
