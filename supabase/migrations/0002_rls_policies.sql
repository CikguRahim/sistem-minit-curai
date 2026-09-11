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
