-- PASSO 1 di 2 — Scheda dell'app "Archivio immagini" nel catalogo di truedesign.app.
-- Da lanciare nell'editor SQL di Supabase (si può rilanciare senza danni).
--
-- Dopo questo passo la scheda esiste ma non è assegnata a nessuno: la vedono e la aprono
-- solo gli amministratori. Serve per provarla dal vivo prima di darla a tutti.
-- Per assegnarla a tutti gli utenti: dashboard-assegna-a-tutti.sql (passo 2).
do $$
begin
  update public.apps
  set
    name = 'Archivio immagini',
    description = 'Le foto degli shooting True Design: ricerca per collezione, prodotto, colore e ambiente, e download anche di più foto insieme.',
    url = '/apps/archivio-ai',
    visibility = 'interno',
    is_active = true
  where url = '/apps/archivio-ai';

  if not found then
    insert into public.apps (name, description, url, visibility, is_active)
    values (
      'Archivio immagini',
      'Le foto degli shooting True Design: ricerca per collezione, prodotto, colore e ambiente, e download anche di più foto insieme.',
      '/apps/archivio-ai',
      'interno',
      true
    );
  end if;
end $$;
