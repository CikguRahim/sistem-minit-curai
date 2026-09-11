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
