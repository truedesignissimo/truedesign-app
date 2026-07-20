alter table public.apps
  add column if not exists is_featured boolean not null default false,
  add column if not exists display_order integer not null default 0;

create index if not exists apps_catalog_order_idx
  on public.apps (is_active, is_featured desc, display_order asc, name asc);
