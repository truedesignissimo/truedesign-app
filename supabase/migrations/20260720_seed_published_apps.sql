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
  '/apps/true-tetris-pallet',
  'interno',
  true,
  true,
  10
where not exists (
  select 1 from public.apps
  where url = '/apps/true-tetris-pallet'
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
  '/apps/true-sondaggio-iconici',
  'pubblica',
  true,
  false,
  20
where not exists (
  select 1 from public.apps
  where url = '/apps/true-sondaggio-iconici'
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

update public.apps
set url = '/apps/true-tetris-pallet'
where name = 'True Tetris Pallet';

update public.apps
set
  url = '/apps/true-sondaggio-iconici',
  visibility = 'pubblica'
where name = 'Sondaggio Prodotti Iconici';
