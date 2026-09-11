-- =========================================================================
-- Sistem Minit Curai Kursus Guru - SK Taman Jasmin
-- Migration 0005: Buka akses sepenuhnya (tanpa log masuk / tanpa auth)
--
-- Migration ini membuang keperluan Supabase Authentication. Sesiapa sahaja
-- yang mempunyai pautan aplikasi (menggunakan anon key) boleh mencipta,
-- melihat, mengedit dan memadam SEMUA rekod minit curai.
--
-- AMARAN: Jalankan migration ini HANYA jika anda mahu aplikasi ini menjadi
-- sistem terbuka (open access) tanpa sebarang kawalan pengguna/peranan.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Longgarkan lajur user_id: tidak lagi wajib dan tidak lagi terikat
--    kepada akaun auth.users (kerana tiada lagi log masuk).
-- -------------------------------------------------------------------------
alter table public.minit_curai drop constraint if exists minit_curai_user_id_fkey;
alter table public.minit_curai alter column user_id drop not null;

-- -------------------------------------------------------------------------
-- 2. Buang semua polisi RLS lama yang berdasarkan auth.uid() / peranan.
-- -------------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_delete_admin_only" on public.profiles;

drop policy if exists "minit_curai_select_own_or_admin" on public.minit_curai;
drop policy if exists "minit_curai_insert_own" on public.minit_curai;
drop policy if exists "minit_curai_update_own_or_admin" on public.minit_curai;
drop policy if exists "minit_curai_delete_own_or_admin" on public.minit_curai;

drop policy if exists "dokumentasi_select_own_or_admin" on public.dokumentasi;
drop policy if exists "dokumentasi_insert_own_or_admin" on public.dokumentasi;
drop policy if exists "dokumentasi_update_own_or_admin" on public.dokumentasi;
drop policy if exists "dokumentasi_delete_own_or_admin" on public.dokumentasi;

drop policy if exists "tandatangan_select_own_or_admin" on public.tandatangan;
drop policy if exists "tandatangan_insert_own_or_admin" on public.tandatangan;
drop policy if exists "tandatangan_update_own_or_admin" on public.tandatangan;
drop policy if exists "tandatangan_delete_own_or_admin" on public.tandatangan;

-- -------------------------------------------------------------------------
-- 3. Cipta polisi TERBUKA (dibenarkan untuk sesiapa sahaja yang guna anon key)
--    pada jadual utama aplikasi. RLS dikekalkan aktif (bukan dimatikan terus)
--    supaya lebih mudah diketatkan semula pada masa hadapan jika diperlukan.
-- -------------------------------------------------------------------------
drop policy if exists "minit_curai_semua_akses_terbuka" on public.minit_curai;
create policy "minit_curai_semua_akses_terbuka"
  on public.minit_curai for all
  using (true)
  with check (true);

drop policy if exists "dokumentasi_semua_akses_terbuka" on public.dokumentasi;
create policy "dokumentasi_semua_akses_terbuka"
  on public.dokumentasi for all
  using (true)
  with check (true);

drop policy if exists "tandatangan_semua_akses_terbuka" on public.tandatangan;
create policy "tandatangan_semua_akses_terbuka"
  on public.tandatangan for all
  using (true)
  with check (true);

-- Jadual profiles / auth tidak lagi digunakan oleh aplikasi. Kekalkan sahaja
-- (tiada polisi = tiada akses melalui API), atau buang terus jika mahu:
-- drop table if exists public.profiles cascade;
-- drop function if exists public.handle_new_user() cascade;
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.is_admin() cascade;

-- -------------------------------------------------------------------------
-- 4. Kemaskini polisi Storage supaya sesiapa sahaja boleh muat naik/padam
--    gambar dokumentasi dan tandatangan (bukan lagi ikut folder {user_id}/...).
-- -------------------------------------------------------------------------
drop policy if exists "dokumentasi_insert_own_folder" on storage.objects;
drop policy if exists "dokumentasi_update_own_folder" on storage.objects;
drop policy if exists "dokumentasi_delete_own_folder_or_admin" on storage.objects;
drop policy if exists "tandatangan_insert_own_folder" on storage.objects;
drop policy if exists "tandatangan_delete_own_folder_or_admin" on storage.objects;

drop policy if exists "dokumentasi_semua_akses_terbuka" on storage.objects;
create policy "dokumentasi_semua_akses_terbuka"
  on storage.objects for all
  using (bucket_id = 'dokumentasi')
  with check (bucket_id = 'dokumentasi');

drop policy if exists "tandatangan_semua_akses_terbuka" on storage.objects;
create policy "tandatangan_semua_akses_terbuka"
  on storage.objects for all
  using (bucket_id = 'tandatangan')
  with check (bucket_id = 'tandatangan');
