-- =========================================================================
-- Sistem Minit Curai Kursus Guru - SK Taman Jasmin
-- Migration 0003: Konfigurasi Supabase Storage
-- =========================================================================

-- Cipta bucket untuk gambar dokumentasi (awam untuk paparan/PDF, dihadkan format & saiz)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dokumentasi', 'dokumentasi', true, 5242880,
  array['image/jpeg','image/jpg','image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cipta bucket untuk tandatangan (jika disimpan sebagai fail imej berasingan)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tandatangan', 'tandatangan', true, 2097152,
  array['image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -------------------------------------------------------------------------
-- Polisi Storage: fail disimpan mengikut struktur laluan {user_id}/{minit_curai_id}/...
-- supaya guru hanya boleh memuat naik/memadam fail di dalam folder mereka sendiri.
-- -------------------------------------------------------------------------

drop policy if exists "dokumentasi_read_public" on storage.objects;
create policy "dokumentasi_read_public"
  on storage.objects for select
  using (bucket_id = 'dokumentasi');

drop policy if exists "dokumentasi_insert_own_folder" on storage.objects;
create policy "dokumentasi_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'dokumentasi'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "dokumentasi_update_own_folder" on storage.objects;
create policy "dokumentasi_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'dokumentasi'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "dokumentasi_delete_own_folder_or_admin" on storage.objects;
create policy "dokumentasi_delete_own_folder_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'dokumentasi'
    and (
      (auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

drop policy if exists "tandatangan_read_public" on storage.objects;
create policy "tandatangan_read_public"
  on storage.objects for select
  using (bucket_id = 'tandatangan');

drop policy if exists "tandatangan_insert_own_folder" on storage.objects;
create policy "tandatangan_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'tandatangan'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "tandatangan_delete_own_folder_or_admin" on storage.objects;
create policy "tandatangan_delete_own_folder_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'tandatangan'
    and (
      (auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
