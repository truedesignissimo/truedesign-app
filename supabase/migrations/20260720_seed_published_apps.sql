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
  'True Tetris Pallet',
  'Importa un ordine, verifica gli imballi e costruisci il pallet in 3D.',
  'https://dariobreggie.it/apps/true-tetris-pallet/',
  'interno',
  true,
  true,
  10
where not exists (
  select 1 from public.apps
  where url = 'https://dariobreggie.it/apps/true-tetris-pallet/'
);

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
  'Sondaggio Prodotti Iconici',
  'Seleziona le collezioni che rappresentano meglio l’identità di True Design.',
  'https://dariobreggie.it/apps/true-sondaggio-iconici/',
  'interno',
  true,
  false,
  20
where not exists (
  select 1 from public.apps
  where url = 'https://dariobreggie.it/apps/true-sondaggio-iconici/'
);

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
  'Prenotazione Sale Riunioni',
  'Consulta gli spazi True Design e organizza le prenotazioni delle sale riunioni.',
  '/apps/prenotazione-sale-riunioni',
  'interno',
  true,
  false,
  30
where not exists (
  select 1 from public.apps
  where url = '/apps/prenotazione-sale-riunioni'
);
