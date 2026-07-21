insert into public.apps (
  name,
  description,
  url,
  visibility,
  is_active,
  is_featured,
  display_order
)
select
  'Competitive Intelligence',
  'Analisi editoriale dei competitor di True Design: identità visiva, contenuti, temi ricorrenti e aggiornamenti a confronto.',
  '/apps/analisi-competitor',
  'interno',
  true,
  false,
  40
where not exists (
  select 1 from public.apps
  where url = '/apps/analisi-competitor'
);
