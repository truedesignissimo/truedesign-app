-- Scheda dell'app "Archivio AI" nel catalogo di truedesign.app.
-- Da lanciare una volta nell'editor SQL di Supabase (si può rilanciare senza danni).
-- Crea (o aggiorna) la scheda e assegna l'app a tutti gli utenti approvati di oggi.
-- Gli utenti interni creati in seguito la ricevono da soli; a un cliente va assegnata dal pannello admin.
-- Dentro l'app tutti cercano e scaricano le foto; la revisione compare solo agli amministratori.
do $$
begin
  update public.apps
  set
    name = 'Archivio AI',
    description = 'Archivio delle immagini degli shooting True Design: ricerca per collezione, prodotto, colore e ambiente, revisione dei riconoscimenti e download.',
    url = '/apps/archivio-ai',
    visibility = 'interno',
    is_active = true
  where url = '/apps/archivio-ai';

  if not found then
    insert into public.apps (name, description, url, visibility, is_active)
    values (
      'Archivio AI',
      'Archivio delle immagini degli shooting True Design: ricerca per collezione, prodotto, colore e ambiente, revisione dei riconoscimenti e download.',
      '/apps/archivio-ai',
      'interno',
      true
    );
  end if;

  insert into public.user_apps (user_id, app_id)
  select p.id, a.id
  from public.profiles p
  cross join public.apps a
  where a.url = '/apps/archivio-ai'
    and p.approval_status = 'approved'
  on conflict (user_id, app_id) do nothing;
end $$;
