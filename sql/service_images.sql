-- Add service image URL column
alter table public.services
add column if not exists image_url text;

-- Create storage bucket (run once in Supabase SQL editor)
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

-- Optional but recommended: storage policies
-- Allow anyone to read service images
drop policy if exists "service_images_public_read" on storage.objects;
create policy "service_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'service-images');

-- Allow only admins to upload service images
drop policy if exists "service_images_admin_insert" on storage.objects;
create policy "service_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-images'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

-- Allow only admins to update service images
drop policy if exists "service_images_admin_update" on storage.objects;
create policy "service_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-images'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
)
with check (
  bucket_id = 'service-images'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

-- Allow only admins to delete service images
drop policy if exists "service_images_admin_delete" on storage.objects;
create policy "service_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-images'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);
