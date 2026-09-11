-- =========================================================================
-- Sistem Minit Curai Kursus Guru - SK Taman Jasmin
-- Migration 0001: Skema asas pangkalan data
-- =========================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Jadual: profiles
-- Menyimpan maklumat profil pengguna (dihubungkan dengan auth.users)
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'guru' check (role in ('guru', 'admin')),
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

-- -------------------------------------------------------------------------
-- Jadual: minit_curai
-- Rekod utama minit curai kursus guru
-- -------------------------------------------------------------------------
create table if not exists public.minit_curai (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- 1. Maklumat Kursus / Lawatan
  nama_kursus text not null,
  jenis_aktiviti text not null check (
    jenis_aktiviti in ('Kursus','Bengkel','Seminar','Taklimat','Mesyuarat','Lawatan Rasmi','Lain-lain')
  ),
  tarikh_mula date not null,
  tarikh_tamat date not null,
  masa_mula time,
  masa_tamat time,
  tempat text not null,
  anjuran text,
  peringkat text not null check (
    peringkat in ('Sekolah','Daerah','Negeri','Kebangsaan','Antarabangsa')
  ),
  bilangan_jam numeric(5,1),
  nombor_rujukan text,

  -- 2. Maklumat Guru
  nama_guru_dropdown text,
  nama_guru_manual text,
  jawatan text,
  gred text,
  mata_pelajaran text,
  tahun_kelas text,
  emel text,
  telefon text,

  -- 3-7 Kandungan
  objektif text,
  isi_kandungan text,
  perkongsian_kaedah text,
  perkongsian_sasaran text,
  perkongsian_tarikh date,
  perkongsian_isi text,
  perkongsian_cadangan text,
  tindakan_susulan text,
  pilihan_tindakan text[] default '{}',
  rumusan text,

  status text not null default 'Draf' check (status in ('Draf','Lengkap','Dijana PDF')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sekurang-kurangnya satu daripada nama_guru_dropdown / nama_guru_manual mesti diisi,
  -- dan tidak kedua-duanya sekali (ditegaskan juga pada peringkat aplikasi).
  constraint chk_nama_guru_satu_sahaja check (
    (nama_guru_dropdown is not null and nama_guru_manual is null) or
    (nama_guru_dropdown is null and nama_guru_manual is not null)
  ),
  constraint chk_tarikh_wajar check (tarikh_tamat >= tarikh_mula)
);

create index if not exists idx_minit_curai_user_id on public.minit_curai (user_id);
create index if not exists idx_minit_curai_status on public.minit_curai (status);
create index if not exists idx_minit_curai_tarikh_mula on public.minit_curai (tarikh_mula);
create index if not exists idx_minit_curai_nama_kursus on public.minit_curai using gin (to_tsvector('simple', nama_kursus));

-- -------------------------------------------------------------------------
-- Jadual: dokumentasi
-- Gambar dokumentasi berkaitan setiap rekod minit curai
-- -------------------------------------------------------------------------
create table if not exists public.dokumentasi (
  id uuid primary key default gen_random_uuid(),
  minit_curai_id uuid not null references public.minit_curai (id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dokumentasi_minit_curai_id on public.dokumentasi (minit_curai_id);

-- -------------------------------------------------------------------------
-- Jadual: tandatangan
-- Tandatangan digital penyedia dan pengesah
-- -------------------------------------------------------------------------
create table if not exists public.tandatangan (
  id uuid primary key default gen_random_uuid(),
  minit_curai_id uuid not null references public.minit_curai (id) on delete cascade,
  jenis text not null check (jenis in ('penyedia', 'pengesah')),
  nama text,
  jawatan text,
  tarikh date,
  signature_url text,
  signature_data text,
  created_at timestamptz not null default now(),
  unique (minit_curai_id, jenis)
);

create index if not exists idx_tandatangan_minit_curai_id on public.tandatangan (minit_curai_id);

-- -------------------------------------------------------------------------
-- Fungsi & Trigger: auto-update updated_at
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_minit_curai_updated_at on public.minit_curai;
create trigger trg_minit_curai_updated_at
  before update on public.minit_curai
  for each row execute function public.set_updated_at();
-- =========================================================================
-- Sistem Minit Curai Kursus Guru - SK Taman Jasmin
-- Migration 0002: Row Level Security (RLS)
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.minit_curai enable row level security;
alter table public.dokumentasi enable row level security;
alter table public.tandatangan enable row level security;

-- -------------------------------------------------------------------------
-- Fungsi bantuan: semak sama ada pengguna semasa ialah admin
-- (SECURITY DEFINER supaya boleh dibaca walaupun RLS profiles ketat)
-- -------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- -------------------------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Admin sahaja boleh memadam profil (contoh: nyahaktif akaun)
drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_admin());

-- -------------------------------------------------------------------------
-- MINIT_CURAI
-- Guru: hanya boleh mengurus rekod sendiri.
-- Admin: boleh melihat dan mengurus semua rekod.
-- -------------------------------------------------------------------------
drop policy if exists "minit_curai_select_own_or_admin" on public.minit_curai;
create policy "minit_curai_select_own_or_admin"
  on public.minit_curai for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "minit_curai_insert_own" on public.minit_curai;
create policy "minit_curai_insert_own"
  on public.minit_curai for insert
  with check (user_id = auth.uid());

drop policy if exists "minit_curai_update_own_or_admin" on public.minit_curai;
create policy "minit_curai_update_own_or_admin"
  on public.minit_curai for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "minit_curai_delete_own_or_admin" on public.minit_curai;
create policy "minit_curai_delete_own_or_admin"
  on public.minit_curai for delete
  using (user_id = auth.uid() or public.is_admin());

-- -------------------------------------------------------------------------
-- DOKUMENTASI
-- Akses diwarisi daripada pemilikan rekod minit_curai induk.
-- -------------------------------------------------------------------------
drop policy if exists "dokumentasi_select_own_or_admin" on public.dokumentasi;
create policy "dokumentasi_select_own_or_admin"
  on public.dokumentasi for select
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = dokumentasi.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "dokumentasi_insert_own_or_admin" on public.dokumentasi;
create policy "dokumentasi_insert_own_or_admin"
  on public.dokumentasi for insert
  with check (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = dokumentasi.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "dokumentasi_update_own_or_admin" on public.dokumentasi;
create policy "dokumentasi_update_own_or_admin"
  on public.dokumentasi for update
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = dokumentasi.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "dokumentasi_delete_own_or_admin" on public.dokumentasi;
create policy "dokumentasi_delete_own_or_admin"
  on public.dokumentasi for delete
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = dokumentasi.minit_curai_id and mc.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- TANDATANGAN
-- Akses diwarisi daripada pemilikan rekod minit_curai induk.
-- -------------------------------------------------------------------------
drop policy if exists "tandatangan_select_own_or_admin" on public.tandatangan;
create policy "tandatangan_select_own_or_admin"
  on public.tandatangan for select
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = tandatangan.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "tandatangan_insert_own_or_admin" on public.tandatangan;
create policy "tandatangan_insert_own_or_admin"
  on public.tandatangan for insert
  with check (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = tandatangan.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "tandatangan_update_own_or_admin" on public.tandatangan;
create policy "tandatangan_update_own_or_admin"
  on public.tandatangan for update
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = tandatangan.minit_curai_id and mc.user_id = auth.uid()
    )
  );

drop policy if exists "tandatangan_delete_own_or_admin" on public.tandatangan;
create policy "tandatangan_delete_own_or_admin"
  on public.tandatangan for delete
  using (
    public.is_admin() or exists (
      select 1 from public.minit_curai mc
      where mc.id = tandatangan.minit_curai_id and mc.user_id = auth.uid()
    )
  );
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
-- =========================================================================
-- Sistem Minit Curai Kursus Guru - SK Taman Jasmin
-- Migration 0004: Auto-cipta profil semasa pendaftaran (baiki isu RLS)
-- =========================================================================

-- Fungsi ini berjalan sebagai "security definer" (guna kebenaran pemilik
-- fungsi, bukan pengguna yang mendaftar) supaya ia boleh insert ke jadual
-- profiles walaupun sesi pengguna belum aktif sepenuhnya (contohnya semasa
-- menunggu pengesahan emel).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'guru'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger: setiap kali ada pengguna baharu didaftar dalam auth.users,
-- automatik cipta rekod sepadan dalam public.profiles.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
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
