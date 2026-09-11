export type Peranan = 'guru' | 'admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Peranan
  position: string | null
  created_at: string
  updated_at: string
}

export type JenisAktiviti =
  | 'Kursus'
  | 'Bengkel'
  | 'Seminar'
  | 'Taklimat'
  | 'Mesyuarat'
  | 'Lawatan Rasmi'
  | 'Lain-lain'

export type Peringkat = 'Sekolah' | 'Daerah' | 'Negeri' | 'Kebangsaan' | 'Antarabangsa'

export type StatusRekod = 'Draf' | 'Lengkap' | 'Dijana PDF'

export type JenisTandatangan = 'penyedia' | 'pengesah'

export interface Dokumentasi {
  id: string
  minit_curai_id: string
  image_url: string
  storage_path: string
  caption: string | null
  created_at: string
}

export interface Tandatangan {
  id: string
  minit_curai_id: string
  jenis: JenisTandatangan
  nama: string
  jawatan: string
  tarikh: string
  signature_url: string | null
  signature_data: string | null
  created_at: string
}

export interface MinitCurai {
  id: string
  user_id: string
  nama_kursus: string
  jenis_aktiviti: JenisAktiviti
  tarikh_mula: string
  tarikh_tamat: string
  masa_mula: string
  masa_tamat: string
  tempat: string
  anjuran: string
  peringkat: Peringkat
  bilangan_jam: number | null
  nombor_rujukan: string | null
  nama_guru_dropdown: string | null
  nama_guru_manual: string | null
  jawatan: string | null
  gred: string | null
  mata_pelajaran: string | null
  tahun_kelas: string | null
  emel: string | null
  telefon: string | null
  objektif: string | null
  isi_kandungan: string | null
  perkongsian_kaedah: string | null
  perkongsian_sasaran: string | null
  perkongsian_tarikh: string | null
  perkongsian_isi: string | null
  perkongsian_cadangan: string | null
  tindakan_susulan: string | null
  pilihan_tindakan: string[] | null
  rumusan: string | null
  status: StatusRekod
  created_at: string
  updated_at: string
  dokumentasi?: Dokumentasi[]
  tandatangan?: Tandatangan[]
}

export interface MinitCuraiFormData
  extends Omit<
    MinitCurai,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'dokumentasi' | 'tandatangan'
  > {}
