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
