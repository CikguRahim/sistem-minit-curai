import { createClient } from '@supabase/supabase-js'

// PENTING: Hanya gunakan SUPABASE_ANON_KEY di frontend.
// Jangan sekali-kali letakkan service_role key di sini atau di mana-mana kod client-side.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditetapkan. Sila semak fail .env anda berdasarkan .env.example.'
  )
}

// Sistem ini beroperasi secara terbuka (tanpa log masuk). Semua permintaan
// menggunakan anon key sahaja, dan akses dikawal oleh polisi RLS "terbuka"
// yang dibenarkan untuk peranan anon (lihat supabase/migrations/0005_*.sql).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STORAGE_BUCKET_DOKUMENTASI = 'dokumentasi'
export const STORAGE_BUCKET_TANDATANGAN = 'tandatangan'
