-- Storage policies for the site-assets bucket (header logo/banner uploads).
-- The bucket itself is public (created via the dashboard/API), so reads
-- bypass RLS already — these policies only govern who can write to it.

create policy "Public can read site-assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

create policy "Admins can upload site-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can update site-assets"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can delete site-assets"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );
