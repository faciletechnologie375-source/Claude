-- A executer dans Supabase > SQL Editor
create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    type text not null default 'Cours' check (type in ('Cours', 'TD', 'Epreuve', 'Corrige', 'Repetition')),
    titre text not null,
    classe text not null,
    matiere text not null,
    fichier text not null,
    storage_path text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists public.td_sessions (
    id uuid primary key default gen_random_uuid(),
    titre text not null,
    classe text not null,
    matiere text not null,
    date_seance date not null,
    heure time not null,
    lieu text not null,
    description text,
    places integer check (places is null or places > 0),
    publie boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.td_inscriptions (
    id uuid primary key default gen_random_uuid(),
    seance_id uuid not null references public.td_sessions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    nom text not null,
    classe text not null,
    telephone text not null,
    email text,
    message text,
    created_at timestamptz not null default now(),
    unique (seance_id, telephone)
);

alter table public.td_inscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.documents enable row level security;
alter table public.td_sessions enable row level security;
alter table public.td_inscriptions enable row level security;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nom text not null default 'Élève',
    classe text,
    telephone text,
    -- Plusieurs comptes peuvent avoir le rôle professeur.
    role text not null default 'eleve' check (role in ('eleve', 'professeur')),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.creer_profil_utilisateur()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    insert into public.profiles (id, nom, classe, telephone)
    values (new.id, coalesce(new.raw_user_meta_data->>'nom', 'Élève'), new.raw_user_meta_data->>'classe', new.raw_user_meta_data->>'telephone');
    return new;
end;
$$;

drop trigger if exists apres_creation_utilisateur on auth.users;
create trigger apres_creation_utilisateur after insert on auth.users
for each row execute procedure public.creer_profil_utilisateur();

insert into public.profiles (id, nom)
select id, coalesce(raw_user_meta_data->>'nom', 'Élève') from auth.users
on conflict (id) do nothing;

create or replace function public.est_professeur()
returns boolean language sql security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'professeur'); $$;

create or replace function public.role_utilisateur_connecte()
returns text language sql security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

-- À exécuter si la table existe déjà avec l'ancien contrôle des types.
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type in ('Cours', 'TD', 'Epreuve', 'Corrige', 'Repetition'));

drop policy if exists "Documents publics visibles" on public.documents;
create policy "Documents publics visibles" on public.documents
    for select using (true);

drop policy if exists "Documents geres par utilisateurs connectes" on public.documents;
drop policy if exists "Documents ajoutes par le professeur" on public.documents;
drop policy if exists "Documents modifies par le professeur" on public.documents;
drop policy if exists "Documents supprimes par le professeur" on public.documents;
create policy "Documents ajoutes par le professeur" on public.documents
    for insert to authenticated with check (public.est_professeur());
create policy "Documents modifies par le professeur" on public.documents
    for update to authenticated using (public.est_professeur()) with check (public.est_professeur());
create policy "Documents supprimes par le professeur" on public.documents
    for delete to authenticated using (public.est_professeur());

drop policy if exists "Séances publiées visibles" on public.td_sessions;
create policy "Séances publiées visibles" on public.td_sessions
    for select using (publie = true);

drop policy if exists "Séances gérées par utilisateurs connectés" on public.td_sessions;
create policy "Séances gérées par utilisateurs connectés" on public.td_sessions
    for all to authenticated using (public.est_professeur()) with check (public.est_professeur());

drop policy if exists "Inscriptions envoyées par les élèves" on public.td_inscriptions;
create policy "Inscriptions envoyées par les élèves" on public.td_inscriptions
    for insert with check (exists (select 1 from public.td_sessions where id = seance_id and publie = true));

drop policy if exists "Inscriptions visibles par le professeur" on public.td_inscriptions;
create policy "Inscriptions visibles par le professeur" on public.td_inscriptions
    for select to authenticated using (public.est_professeur() or auth.uid() = user_id);

drop policy if exists "Profils personnels visibles" on public.profiles;
create policy "Profils personnels visibles" on public.profiles
    for select to authenticated using (auth.uid() = id or public.est_professeur());

drop policy if exists "Profils personnels modifiables" on public.profiles;
create policy "Profils personnels modifiables" on public.profiles
    for update to authenticated using (auth.uid() = id or public.est_professeur())
    with check ((auth.uid() = id and role = public.role_utilisateur_connecte()) or public.est_professeur());

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

drop policy if exists "PDF publics consultables" on storage.objects;
create policy "PDF publics consultables" on storage.objects
    for select using (bucket_id = 'documents');

drop policy if exists "PDF ajoutes par utilisateurs connectes" on storage.objects;
create policy "PDF ajoutes par utilisateurs connectes" on storage.objects
    for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists "PDF geres par utilisateurs connectes" on storage.objects;
create policy "PDF geres par utilisateurs connectes" on storage.objects
    for delete to authenticated using (bucket_id = 'documents');
