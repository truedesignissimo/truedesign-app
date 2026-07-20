do $$
begin
  update public.apps
  set
    name = 'TRUE Generatore Offerte',
    description = 'Generatore di offerte commerciali TRUE Design con configurazione prodotti, listini, finiture, tessuti, immagini personalizzate e PDF.',
    url = '/apps/true-generatore-offerte',
    visibility = 'interno',
    is_active = true
  where url = '/apps/true-generatore-offerte';

  if not found then
    insert into public.apps (name, description, url, visibility, is_active)
    values (
      'TRUE Generatore Offerte',
      'Generatore di offerte commerciali TRUE Design con configurazione prodotti, listini, finiture, tessuti, immagini personalizzate e PDF.',
      '/apps/true-generatore-offerte',
      'interno',
      true
    );
  end if;
end $$;
