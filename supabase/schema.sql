-- Kobo : schéma Supabase pour synchroniser plusieurs téléphones d'une même entreprise.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller ce fichier > Run.
-- Il peut être relancé sans risque (les objets existants sont conservés ou remplacés).

-- Une entreprise (espace partagé) et son code d'invitation.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Qui fait partie de quelle entreprise.
create table if not exists public.members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- Toutes les données de l'application : une ligne par enregistrement.
-- kind : sales, purchases, orders, products, contacts, settings.
create table if not exists public.records (
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null,
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (business_id, kind, id)
);
create index if not exists records_business_updated on public.records (business_id, updated_at);

-- L'heure d'écriture vient toujours du serveur : elle sert de curseur de synchronisation.
create or replace function public.touch_record() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_record();

-- Appartenance (security definer : évite la récursion des règles sur members).
create or replace function public.is_member(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where business_id = b and user_id = auth.uid());
$$;

alter table public.businesses enable row level security;
alter table public.members enable row level security;
alter table public.records enable row level security;

drop policy if exists "membres lisent leur entreprise" on public.businesses;
create policy "membres lisent leur entreprise" on public.businesses
  for select to authenticated using (public.is_member(id));
drop policy if exists "propriétaire renomme" on public.businesses;
create policy "propriétaire renomme" on public.businesses
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "membres voient les membres" on public.members;
create policy "membres voient les membres" on public.members
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "chacun peut quitter" on public.members;
create policy "chacun peut quitter" on public.members
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "membres lisent" on public.records;
create policy "membres lisent" on public.records
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "membres ajoutent" on public.records;
create policy "membres ajoutent" on public.records
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "membres modifient" on public.records;
create policy "membres modifient" on public.records
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));

-- Créer son entreprise : l'utilisateur en devient propriétaire.
create or replace function public.create_business(p_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql security definer set search_path = public as $$
declare b public.businesses;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  insert into public.businesses (name, created_by) values (coalesce(p_name, ''), auth.uid()) returning * into b;
  insert into public.members (business_id, user_id, role) values (b.id, auth.uid(), 'owner');
  return query select b.id, b.name, b.invite_code;
end $$;

-- Rejoindre une entreprise avec son code d'invitation.
create or replace function public.join_business(p_code text)
returns table (id uuid, name text, invite_code text)
language plpgsql security definer set search_path = public as $$
declare b public.businesses;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into b from public.businesses where businesses.invite_code = upper(trim(p_code));
  if not found then raise exception 'Code d''invitation inconnu'; end if;
  insert into public.members (business_id, user_id) values (b.id, auth.uid()) on conflict do nothing;
  return query select b.id, b.name, b.invite_code;
end $$;

-- L'entreprise de l'utilisateur connecté (la plus ancienne s'il en a plusieurs).
create or replace function public.my_business()
returns table (id uuid, name text, invite_code text, role text, members bigint)
language sql stable security definer set search_path = public as $$
  select b.id, b.name, b.invite_code, m.role,
         (select count(*) from public.members x where x.business_id = b.id)
  from public.members m join public.businesses b on b.id = m.business_id
  where m.user_id = auth.uid()
  order by m.joined_at
  limit 1;
$$;

revoke all on function public.create_business(text), public.join_business(text), public.my_business() from public, anon;
grant execute on function public.create_business(text), public.join_business(text), public.my_business() to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
