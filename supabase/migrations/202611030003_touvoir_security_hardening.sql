-- TOUVOIR — durcissement sécurité issu de l'audit du 03/11/2026
-- Objectifs : moindre privilège, extension hors schéma public,
-- validations serveur des formulaires publics, anti-doublon e-mail
-- et limites du bucket privé de fichiers.

-- 1) Extension pg_trgm hors du schéma public.
alter extension pg_trgm set schema extensions;

-- 2) Fonctions : search_path figé et exécution restreinte.
alter function public.is_admin() set search_path = '';
alter function public.is_staff() set search_path = '';
alter function public.make_ref(text) set search_path = '';
alter function public.set_reference() set search_path = '';
alter function public.set_updated_at() set search_path = '';

revoke execute on function public.is_admin(), public.is_staff() from public, anon;
grant execute on function public.is_admin(), public.is_staff() to authenticated, service_role;

revoke execute on function public.make_ref(text), public.set_reference(), public.set_updated_at()
  from public, anon, authenticated;
grant execute on function public.make_ref(text), public.set_reference(), public.set_updated_at()
  to service_role;

-- 3) Politiques d'insertion publique resserrées.
drop policy if exists quote_requests_public_insert on public.quote_requests;
create policy quote_requests_public_insert on public.quote_requests
  for insert to anon
  with check (
    status = 'nouveau'
    and priority = 'normale'
    and source = 'site_web'
    and customer_id is null
    and assigned_to is null
    and estimated_amount_fcfa is null
    and next_action_at is null
    and internal_notes is null
  );

drop policy if exists fault_reports_public_insert on public.fault_reports;
create policy fault_reports_public_insert on public.fault_reports
  for insert to anon
  with check (
    status = 'nouveau'
    and source = 'site_web'
    and customer_id is null
    and site_id is null
    and equipment_id is null
    and assigned_to is null
    and scheduled_at is null
    and resolved_at is null
    and resolution_notes is null
    and internal_notes is null
  );

drop policy if exists price_requests_public_insert on public.price_requests;
create policy price_requests_public_insert on public.price_requests
  for insert to anon
  with check (
    status = 'nouveau'
    and source = 'site_web'
    and customer_id is null
    and product_id is null
    and assigned_to is null
    and quoted_price_fcfa is null
    and internal_notes is null
  );

-- 4) Validations serveur des champs publics.
alter table public.quote_requests
  add constraint quote_requests_reference_format
    check (reference ~ '^TV-DEV-[A-Z0-9-]{4,72}$'),
  add constraint quote_requests_public_lengths
    check (
      char_length(customer_name) between 2 and 160
      and char_length(phone) between 8 and 30
      and (email is null or char_length(email) <= 254)
      and (service_slug is null or char_length(service_slug) <= 80)
      and (service_label is null or char_length(service_label) <= 160)
      and (selected_pack is null or char_length(selected_pack) <= 250)
      and (selected_product is null or char_length(selected_product) <= 250)
      and (city is null or char_length(city) <= 120)
      and char_length(message) between 2 and 6000
      and char_length(source) <= 40
      and (page_url is null or char_length(page_url) <= 1000)
      and (user_agent is null or char_length(user_agent) <= 500)
    ),
  add constraint quote_requests_email_format
    check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  add constraint quote_requests_source_params_limit
    check (jsonb_typeof(source_params) = 'object' and octet_length(source_params::text) <= 8192);

alter table public.fault_reports
  add constraint fault_reports_reference_format
    check (reference ~ '^TV-PAN-[A-Z0-9-]{4,72}$'),
  add constraint fault_reports_public_lengths
    check (
      char_length(customer_name) between 2 and 160
      and char_length(phone) between 8 and 30
      and (email is null or char_length(email) <= 254)
      and char_length(city) between 2 and 120
      and char_length(district) between 2 and 200
      and (customer_situation is null or char_length(customer_situation) <= 120)
      and char_length(equipment_type) between 2 and 160
      and (problem_since_label is null or char_length(problem_since_label) <= 160)
      and char_length(urgency_label) between 2 and 160
      and (availability_label is null or char_length(availability_label) <= 160)
      and char_length(description) between 5 and 6000
      and char_length(source) <= 40
      and (page_url is null or char_length(page_url) <= 1000)
      and (user_agent is null or char_length(user_agent) <= 500)
    ),
  add constraint fault_reports_email_format
    check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  add constraint fault_reports_source_params_limit
    check (jsonb_typeof(source_params) = 'object' and octet_length(source_params::text) <= 8192),
  add constraint fault_reports_cameras_count_max
    check (cameras_count is null or cameras_count <= 10000);

alter table public.price_requests
  add constraint price_requests_reference_format
    check (reference ~ '^TV-PRX-[A-Z0-9-]{4,72}$'),
  add constraint price_requests_public_lengths
    check (
      char_length(customer_name) between 2 and 160
      and char_length(phone) between 8 and 30
      and (email is null or char_length(email) <= 254)
      and (product_reference is null or char_length(product_reference) <= 120)
      and char_length(product_name) between 2 and 200
      and quantity <= 10000
      and (installation_option is null or char_length(installation_option) <= 120)
      and (installation_label is null or char_length(installation_label) <= 120)
      and (message is null or char_length(message) <= 3000)
      and char_length(source) <= 40
      and (page_url is null or char_length(page_url) <= 1000)
      and (user_agent is null or char_length(user_agent) <= 500)
    ),
  add constraint price_requests_email_format
    check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  add constraint price_requests_source_params_limit
    check (jsonb_typeof(source_params) = 'object' and octet_length(source_params::text) <= 8192);

-- 5) Une seule notification e-mail active ou envoyée par demande.
create unique index if not exists idx_notification_logs_site_request_email_unique
  on public.notification_logs(entity_type, entity_id, channel, template_name)
  where entity_type = 'site_request'
    and entity_id is not null
    and channel = 'email'
    and status in ('pret', 'envoye');

-- 6) Bucket privé : taille et formats bornés.
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array[
         'image/jpeg',
         'image/png',
         'image/webp',
         'image/gif',
         'application/pdf'
       ]::text[]
 where id = 'touvoir-uploads';

-- 7) Moindre privilège au niveau PostgreSQL.
revoke all privileges on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke all privileges on all sequences in schema public from anon;

grant select on table
  public.cities,
  public.faqs,
  public.packs,
  public.product_categories,
  public.products,
  public.projects,
  public.services,
  public.site_settings,
  public.testimonials
to anon;

grant insert (
  reference, customer_name, phone, email, service_slug, service_label,
  selected_pack, selected_product, message, status, source, source_params,
  page_url, user_agent
) on table public.quote_requests to anon;

grant insert (
  reference, customer_name, phone, email, city, district, customer_situation,
  equipment_type, cameras_count, problem_since_label, urgency_label,
  urgency_level, availability_label, description, status, source,
  source_params, page_url, user_agent
) on table public.fault_reports to anon;

grant insert (
  reference, customer_name, phone, email, product_reference, product_name,
  quantity, installation_option, installation_label, message, status, source,
  source_params, page_url, user_agent
) on table public.price_requests to anon;

-- Les futures tables/fonctions ne doivent pas redevenir publiques par défaut.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke truncate, references, trigger on sequences from authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
