-- ============================================================
-- TOUVOIR — Schéma Supabase/PostgreSQL indispensable
-- Site vitrine + génération de leads + suivi pannes/interventions
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- Fonctions utilitaires ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.make_ref(prefix text)
returns text language sql as $$
  select prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.set_reference()
returns trigger language plpgsql as $$
begin
  if new.reference is null or btrim(new.reference) = '' then
    new.reference = public.make_ref(TG_ARGV[0]);
  end if;
  return new;
end;
$$;

-- ---------- Profils équipe (liés à Supabase Auth) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role text not null default 'commercial' check (role in ('admin','commercial','technicien','support','lecture')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true and p.role = 'admin'
  );
$$;

-- ---------- Paramètres et référentiels ----------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  long_description text,
  icon_name text,
  image_path text,
  includes jsonb not null default '[]'::jsonb,
  ideal_for text,
  duration_label text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  slug text primary key,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id integer unique,
  reference text not null unique,
  name text not null,
  category_slug text references public.product_categories(slug) on update cascade on delete restrict,
  image_path text,
  badge_label text,
  badge_class text,
  specs jsonb not null default '[]'::jsonb,
  price_fcfa integer check (price_fcfa is null or price_fcfa >= 0),
  stock_status text not null default 'sur_demande' check (stock_status in ('en_stock','stock_faible','rupture','sur_demande')),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  cameras integer not null unique check (cameras > 0),
  name text not null,
  price_fcfa integer not null check (price_fcfa >= 0),
  badge text,
  recorder_label text,
  storage_label text,
  power_label text,
  usage_label text,
  features jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_slug text not null,
  category_label text,
  city text,
  location_label text,
  image_path text,
  description text,
  meta jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  city text,
  quote text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null unique,
  answer_html text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Clients, sites et équipements installés ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  phone text,
  whatsapp_phone text,
  email text,
  customer_type text not null default 'particulier' check (customer_type in ('particulier','entreprise','commerce','institution','autre')),
  city text,
  address_label text,
  source text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_name text,
  city text not null,
  district text,
  address_label text,
  gps_lat numeric(9,6),
  gps_lng numeric(9,6),
  site_type text,
  access_notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installed_equipments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.customer_sites(id) on delete set null,
  equipment_type text not null,
  brand text,
  model text,
  serial_number text,
  quantity integer not null default 1 check (quantity > 0),
  installed_at date,
  warranty_end date,
  status text not null default 'actif' check (status in ('actif','en_panne','remplace','retire')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Demandes entrantes du site ----------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null check (char_length(customer_name) >= 2),
  phone text not null check (char_length(phone) >= 8),
  email text,
  service_slug text,
  service_label text,
  selected_pack text,
  selected_product text,
  city text,
  message text not null,
  status text not null default 'nouveau' check (status in ('nouveau','a_contacter','etude_planifiee','devis_envoye','negociation','gagne','perdu','annule')),
  priority text not null default 'normale' check (priority in ('basse','normale','haute')),
  source text not null default 'site_web',
  source_params jsonb not null default '{}'::jsonb,
  page_url text,
  user_agent text,
  assigned_to uuid references public.profiles(id) on delete set null,
  estimated_amount_fcfa integer check (estimated_amount_fcfa is null or estimated_amount_fcfa >= 0),
  next_action_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null check (char_length(customer_name) >= 2),
  phone text not null check (char_length(phone) >= 8),
  email text,
  product_id uuid references public.products(id) on delete set null,
  product_reference text,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  installation_option text,
  installation_label text,
  message text,
  status text not null default 'nouveau' check (status in ('nouveau','prix_envoye','relance','commande','clos','annule')),
  source text not null default 'site_web',
  source_params jsonb not null default '{}'::jsonb,
  page_url text,
  user_agent text,
  assigned_to uuid references public.profiles(id) on delete set null,
  quoted_price_fcfa integer check (quoted_price_fcfa is null or quoted_price_fcfa >= 0),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fault_reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.customer_sites(id) on delete set null,
  equipment_id uuid references public.installed_equipments(id) on delete set null,
  customer_name text not null check (char_length(customer_name) >= 2),
  phone text not null check (char_length(phone) >= 8),
  email text,
  city text not null,
  district text not null,
  customer_situation text,
  equipment_type text not null,
  cameras_count integer check (cameras_count is null or cameras_count >= 0),
  problem_since_label text,
  urgency_label text not null,
  urgency_level smallint not null default 1 check (urgency_level between 1 and 3),
  availability_label text,
  description text not null,
  status text not null default 'nouveau' check (status in ('nouveau','diagnostic','planifie','en_cours','resolu','clos','annule')),
  source text not null default 'site_web',
  source_params jsonb not null default '{}'::jsonb,
  page_url text,
  user_agent text,
  assigned_to uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Planning et interventions ----------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.customer_sites(id) on delete set null,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  fault_report_id uuid references public.fault_reports(id) on delete set null,
  title text not null,
  appointment_type text not null check (appointment_type in ('etude_site','installation','depannage','maintenance','livraison','suivi')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'planifie' check (status in ('planifie','confirme','effectue','annule','reporte')),
  assigned_to uuid references public.profiles(id) on delete set null,
  address_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.customer_sites(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  fault_report_id uuid references public.fault_reports(id) on delete set null,
  intervention_type text not null,
  title text not null,
  description text,
  status text not null default 'a_faire' check (status in ('a_faire','en_cours','termine','annule')),
  technician_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  materials_used jsonb not null default '[]'::jsonb,
  amount_fcfa integer check (amount_fcfa is null or amount_fcfa >= 0),
  report_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Suivi, pièces jointes et notifications ----------
create table if not exists public.request_followups (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('quote_request','price_request','fault_report','customer','intervention')),
  entity_id uuid not null,
  author_id uuid references public.profiles(id) on delete set null,
  followup_type text not null default 'note' check (followup_type in ('note','appel','whatsapp','email','visite','relance','autre')),
  note text not null,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('quote_request','price_request','fault_report','customer','site','intervention','product','project')),
  entity_id uuid not null,
  bucket_name text not null default 'touvoir-uploads',
  object_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  channel text not null check (channel in ('whatsapp','email','sms','appel')),
  recipient text,
  template_name text,
  status text not null default 'pret' check (status in ('pret','envoye','echoue','annule')),
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Index ----------
create index if not exists idx_services_published_sort on public.services(is_published, sort_order);
create index if not exists idx_products_category_published on public.products(category_slug, is_published, sort_order);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_packs_published_sort on public.packs(is_published, sort_order);
create index if not exists idx_projects_cat_published on public.projects(category_slug, is_published, sort_order);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_sites_customer_city on public.customer_sites(customer_id, city);
create index if not exists idx_equipments_customer_site on public.installed_equipments(customer_id, site_id, status);
create index if not exists idx_quote_status_created on public.quote_requests(status, created_at desc);
create index if not exists idx_quote_phone on public.quote_requests(phone);
create index if not exists idx_price_status_created on public.price_requests(status, created_at desc);
create index if not exists idx_price_phone on public.price_requests(phone);
create index if not exists idx_fault_status_urgency_created on public.fault_reports(status, urgency_level desc, created_at desc);
create index if not exists idx_fault_city_phone on public.fault_reports(city, phone);
create index if not exists idx_appointments_starts_status on public.appointments(starts_at, status);
create index if not exists idx_interventions_status_created on public.interventions(status, created_at desc);
create index if not exists idx_followups_entity on public.request_followups(entity_type, entity_id, created_at desc);
create index if not exists idx_attachments_entity on public.attachments(entity_type, entity_id);
create index if not exists idx_notifications_entity on public.notification_logs(entity_type, entity_id, created_at desc);

-- ---------- Triggers updated_at ----------
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
create trigger trg_cities_updated before update on public.cities for each row execute function public.set_updated_at();
create trigger trg_services_updated before update on public.services for each row execute function public.set_updated_at();
create trigger trg_product_categories_updated before update on public.product_categories for each row execute function public.set_updated_at();
create trigger trg_products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger trg_packs_updated before update on public.packs for each row execute function public.set_updated_at();
create trigger trg_projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();
create trigger trg_faqs_updated before update on public.faqs for each row execute function public.set_updated_at();
create trigger trg_customers_updated before update on public.customers for each row execute function public.set_updated_at();
create trigger trg_customer_sites_updated before update on public.customer_sites for each row execute function public.set_updated_at();
create trigger trg_equipments_updated before update on public.installed_equipments for each row execute function public.set_updated_at();
create trigger trg_quote_requests_updated before update on public.quote_requests for each row execute function public.set_updated_at();
create trigger trg_price_requests_updated before update on public.price_requests for each row execute function public.set_updated_at();
create trigger trg_fault_reports_updated before update on public.fault_reports for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments for each row execute function public.set_updated_at();
create trigger trg_interventions_updated before update on public.interventions for each row execute function public.set_updated_at();
create trigger trg_followups_updated before update on public.request_followups for each row execute function public.set_updated_at();
create trigger trg_attachments_updated before update on public.attachments for each row execute function public.set_updated_at();
create trigger trg_notifications_updated before update on public.notification_logs for each row execute function public.set_updated_at();

-- ---------- Triggers références ----------
create trigger trg_quote_ref before insert on public.quote_requests for each row execute function public.set_reference('TV-DEV');
create trigger trg_price_ref before insert on public.price_requests for each row execute function public.set_reference('TV-PRX');
create trigger trg_fault_ref before insert on public.fault_reports for each row execute function public.set_reference('TV-PAN');

-- ---------- Activation RLS ----------
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.cities enable row level security;
alter table public.services enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.packs enable row level security;
alter table public.projects enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.customers enable row level security;
alter table public.customer_sites enable row level security;
alter table public.installed_equipments enable row level security;
alter table public.quote_requests enable row level security;
alter table public.price_requests enable row level security;
alter table public.fault_reports enable row level security;
alter table public.appointments enable row level security;
alter table public.interventions enable row level security;
alter table public.request_followups enable row level security;
alter table public.attachments enable row level security;
alter table public.notification_logs enable row level security;

-- Profils : chacun peut lire son profil ; création/gestion via dashboard ou service role.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

-- Contenus publics : lecture des éléments publiés + gestion par l'équipe.
create policy settings_public_read on public.site_settings
  for select to anon, authenticated using (is_public = true);
create policy settings_staff_all on public.site_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy cities_public_read on public.cities
  for select to anon, authenticated using (is_active = true);
create policy cities_staff_all on public.cities
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy services_public_read on public.services
  for select to anon, authenticated using (is_published = true);
create policy services_staff_all on public.services
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy product_categories_public_read on public.product_categories
  for select to anon, authenticated using (true);
create policy product_categories_staff_all on public.product_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy products_public_read on public.products
  for select to anon, authenticated using (is_published = true);
create policy products_staff_all on public.products
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy packs_public_read on public.packs
  for select to anon, authenticated using (is_published = true);
create policy packs_staff_all on public.packs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy projects_public_read on public.projects
  for select to anon, authenticated using (is_published = true);
create policy projects_staff_all on public.projects
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated using (is_published = true);
create policy testimonials_staff_all on public.testimonials
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy faqs_public_read on public.faqs
  for select to anon, authenticated using (is_published = true);
create policy faqs_staff_all on public.faqs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Données métier privées : équipe uniquement.
create policy customers_staff_all on public.customers
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy customer_sites_staff_all on public.customer_sites
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy equipments_staff_all on public.installed_equipments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy appointments_staff_all on public.appointments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy interventions_staff_all on public.interventions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy followups_staff_all on public.request_followups
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy attachments_staff_all on public.attachments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy notifications_staff_all on public.notification_logs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Formulaires publics : insertion anonyme autorisée, lecture interdite au public.
create policy quote_requests_public_insert on public.quote_requests
  for insert to anon, authenticated
  with check (
    status = 'nouveau'
    and customer_id is null
    and assigned_to is null
    and estimated_amount_fcfa is null
    and internal_notes is null
  );
create policy quote_requests_staff_all on public.quote_requests
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy price_requests_public_insert on public.price_requests
  for insert to anon, authenticated
  with check (
    status = 'nouveau'
    and customer_id is null
    and assigned_to is null
    and quoted_price_fcfa is null
    and internal_notes is null
  );
create policy price_requests_staff_all on public.price_requests
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy fault_reports_public_insert on public.fault_reports
  for insert to anon, authenticated
  with check (
    status = 'nouveau'
    and customer_id is null
    and site_id is null
    and equipment_id is null
    and assigned_to is null
    and scheduled_at is null
    and resolved_at is null
    and resolution_notes is null
    and internal_notes is null
  );
create policy fault_reports_staff_all on public.fault_reports
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Bucket privé pour futures photos de sites/pannes (accès équipe uniquement).
insert into storage.buckets (id, name, public)
values ('touvoir-uploads', 'touvoir-uploads', false)
on conflict (id) do nothing;

create policy touvoir_uploads_staff_select on storage.objects
  for select to authenticated using (bucket_id = 'touvoir-uploads' and public.is_staff());
create policy touvoir_uploads_staff_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'touvoir-uploads' and public.is_staff());
create policy touvoir_uploads_staff_update on storage.objects
  for update to authenticated using (bucket_id = 'touvoir-uploads' and public.is_staff()) with check (bucket_id = 'touvoir-uploads' and public.is_staff());
create policy touvoir_uploads_staff_delete on storage.objects
  for delete to authenticated using (bucket_id = 'touvoir-uploads' and public.is_staff());
