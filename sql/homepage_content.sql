create extension if not exists pgcrypto;

-- Homepage gallery images
create table if not exists public.homepage_gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  display_order smallint not null,
  created_at timestamptz not null default now(),
  constraint homepage_gallery_images_display_order_check check (display_order between 1 and 5),
  constraint homepage_gallery_images_display_order_unique unique (display_order)
);

-- Homepage about content (single row: id = 1)
create table if not exists public.homepage_about (
  id smallint primary key,
  title text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  constraint homepage_about_single_row_check check (id = 1)
);

insert into public.homepage_about (id, title, content)
values (
  1,
  'About BrightSmile Dental Clinic',
  'At BrightSmile Dental Clinic, we focus on preventive and restorative care with a calm, patient-first experience. Our team combines modern techniques with a friendly approach so every visit feels clear, comfortable, and personalized.'
)
on conflict (id) do nothing;

-- Optional bucket create (or create manually in Storage UI)
insert into storage.buckets (id, name, public)
values ('homepage-gallery', 'homepage-gallery', true)
on conflict (id) do nothing;

alter table public.homepage_gallery_images enable row level security;
alter table public.homepage_about enable row level security;

-- public read for homepage content
drop policy if exists "homepage_gallery_public_read" on public.homepage_gallery_images;
create policy "homepage_gallery_public_read"
on public.homepage_gallery_images
for select
to public
using (true);

drop policy if exists "homepage_about_public_read" on public.homepage_about;
create policy "homepage_about_public_read"
on public.homepage_about
for select
to public
using (true);

-- admin write for homepage content
drop policy if exists "homepage_gallery_admin_insert" on public.homepage_gallery_images;
create policy "homepage_gallery_admin_insert"
on public.homepage_gallery_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

drop policy if exists "homepage_gallery_admin_delete" on public.homepage_gallery_images;
create policy "homepage_gallery_admin_delete"
on public.homepage_gallery_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

drop policy if exists "homepage_about_admin_update" on public.homepage_about;
create policy "homepage_about_admin_update"
on public.homepage_about
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

drop policy if exists "homepage_about_admin_insert" on public.homepage_about;
create policy "homepage_about_admin_insert"
on public.homepage_about
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

-- storage policies for homepage-gallery bucket
drop policy if exists "homepage_gallery_storage_public_read" on storage.objects;
create policy "homepage_gallery_storage_public_read"
on storage.objects
for select
to public
using (bucket_id = 'homepage-gallery');

drop policy if exists "homepage_gallery_storage_admin_insert" on storage.objects;
create policy "homepage_gallery_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'homepage-gallery'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

drop policy if exists "homepage_gallery_storage_admin_delete" on storage.objects;
create policy "homepage_gallery_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'homepage-gallery'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);
