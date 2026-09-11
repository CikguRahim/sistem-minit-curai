import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, STORAGE_BUCKET_DOKUMENTASI } from '../lib/supabaseClient'
import HeaderRasmi from '../components/HeaderRasmi'
import ImageUploadField, { GambarItem } from '../components/ImageUploadField'
import TandatanganInput from '../components/SignaturePadInput'
import { SENARAI_NAMA_GURU, PILIHAN_NAMA_TIADA_DALAM_SENARAI } from '../data/namaGuru'
import { validasiMaklumatKursus, validasiNamaGuru, gabungkanRalat, RalatBorang } from '../lib/validation'
import type { JenisAktiviti, Peringkat, MinitCurai } from '../types'
import { janaPdfMinitCurai } from '../lib/generatePdf'

const JENIS_AKTIVITI_PILIHAN: JenisAktiviti[] = [
  'Kursus',
  'Bengkel',
  'Seminar',
  'Taklimat',
  'Mesyuarat',
  'Lawatan Rasmi',
  'Lain-lain'
]

const PERINGKAT_PILIHAN: Peringkat[] = ['Sekolah', 'Daerah', 'Negeri', 'Kebangsaan', 'Antarabangsa']

const PILIHAN_TINDAKAN_SUSULAN = [
  'Perkongsian dalam mesyuarat guru',
  'Perkongsian dalam PLC',
  'Perkongsian kepada panitia',
  'Pelaksanaan dalam bilik darjah',
  'Penyediaan bahan pengajaran',
  'Bimbingan kepada guru lain',
  'Tindakan lain'
]

const KEY_AUTOSAVE = 'minit-curai-draf-sementara'

interface FormState {
  nama_kursus: string
  jenis_aktiviti: JenisAktiviti
  tarikh_mula: string
  tarikh_tamat: string
  masa_mula: string
  masa_tamat: string
  tempat: string
  anjuran: string
  peringkat: Peringkat
  bilangan_jam: string
  nombor_rujukan: string
  catatan: string
  nama_guru_dropdown: string
  namaTiadaDalamSenarai: boolean
  nama_guru_manual: string
  jawatan: string
  gred: string
  mata_pelajaran: string
  tahun_kelas: string
  emel: string
  telefon: string
  objektif: string
  isi_kandungan: string
  perkongsian_kaedah: string
  perkongsian_sasaran: string
  perkongsian_tarikh: string
  perkongsian_isi: string
  perkongsian_cadangan: string
  pilihan_tindakan: string[]
  tindakan_susulan: string
  rumusan: string
}

const STATE_KOSONG: FormState = {
  nama_kursus: '',
  jenis_aktiviti: 'Kursus',
  tarikh_mula: '',
  tarikh_tamat: '',
  masa_mula: '',
  masa_tamat: '',
  tempat: '',
  anjuran: '',
  peringkat: 'Sekolah',
  bilangan_jam: '',
  nombor_rujukan: '',
  catatan: '',
  nama_guru_dropdown: '',
  namaTiadaDalamSenarai: false,
  nama_guru_manual: '',
  jawatan: '',
  gred: '',
  mata_pelajaran: '',
  tahun_kelas: '',
  emel: '',
  telefon: '',
  objektif: '',
  isi_kandungan: '',
  perkongsian_kaedah: '',
  perkongsian_sasaran: '',
  perkongsian_tarikh: '',
  perkongsian_isi: '',
  perkongsian_cadangan: '',
  pilihan_tindakan: [],
  tindakan_susulan: '',
  rumusan: ''
}

const MinitCuraiForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(STATE_KOSONG)
  const [carianGuru, setCarianGuru] = useState('')
  const [tunjukSenaraiGuru, setTunjukSenaraiGuru] = useState(false)
  const [gambarList, setGambarList] = useState<GambarItem[]>([])
  const [tandatanganPenyedia, setTandatanganPenyedia] = useState<string | null>(null)
  const [tandatanganPengesah, setTandatanganPengesah] = useState<string | null>(null)
  const [penyediaNama, setPenyediaNama] = useState('')
  const [penyediaJawatan, setPenyediaJawatan] = useState('')
  const [penyediaTarikh, setPenyediaTarikh] = useState('')
  const [pengesahNama, setPengesahNama] = useState('')
  const [pengesahJawatan, setPengesahJawatan] = useState('')
  const [pengesahTarikh, setPengesahTarikh] = useState('')

  const [ralat, setRalat] = useState<RalatBorang>({})
  const [mesejRalatUmum, setMesejRalatUmum] = useState<string | null>(null)
  const [mesejBerjaya, setMesejBerjaya] = useState<string | null>(null)
  const [sedangSimpan, setSedangSimpan] = useState(false)
  const [sedangMuat, setSedangMuat] = useState(isEdit)
  const [rekodSediaAda, setRekodSediaAda] = useState<MinitCurai | null>(null)

  const guruDropdownRef = useRef<HTMLDivElement | null>(null)

  const namaGuruTertapis = useMemo(() => {
    const q = carianGuru.trim().toLowerCase()
    if (!q) return SENARAI_NAMA_GURU
    return SENARAI_NAMA_GURU.filter((n) => n.toLowerCase().includes(q))
  }, [carianGuru])

  // Tutup dropdown carian guru bila klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (guruDropdownRef.current && !guruDropdownRef.current.contains(e.target as Node)) {
        setTunjukSenaraiGuru(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Muatkan rekod sedia ada jika mod edit
  useEffect(() => {
    if (!isEdit || !id) return
    const muat = async () => {
      setSedangMuat(true)
      const { data, error } = await supabase
        .from('minit_curai')
        .select('*, dokumentasi(*), tandatangan(*)')
        .eq('id', id)
        .single()

      if (!error && data) {
        const rekod = data as MinitCurai
        setRekodSediaAda(rekod)
        setForm({
          nama_kursus: rekod.nama_kursus || '',
          jenis_aktiviti: rekod.jenis_aktiviti,
          tarikh_mula: rekod.tarikh_mula || '',
          tarikh_tamat: rekod.tarikh_tamat || '',
          masa_mula: rekod.masa_mula || '',
          masa_tamat: rekod.masa_tamat || '',
          tempat: rekod.tempat || '',
          anjuran: rekod.anjuran || '',
          peringkat: rekod.peringkat,
          bilangan_jam: rekod.bilangan_jam ? String(rekod.bilangan_jam) : '',
          nombor_rujukan: rekod.nombor_rujukan || '',
          catatan: '',
          nama_guru_dropdown: rekod.nama_guru_dropdown || '',
          namaTiadaDalamSenarai: !!rekod.nama_guru_manual,
          nama_guru_manual: rekod.nama_guru_manual || '',
          jawatan: rekod.jawatan || '',
          gred: rekod.gred || '',
          mata_pelajaran: rekod.mata_pelajaran || '',
          tahun_kelas: rekod.tahun_kelas || '',
          emel: rekod.emel || '',
          telefon: rekod.telefon || '',
          objektif: rekod.objektif || '',
          isi_kandungan: rekod.isi_kandungan || '',
          perkongsian_kaedah: rekod.perkongsian_kaedah || '',
          perkongsian_sasaran: rekod.perkongsian_sasaran || '',
          perkongsian_tarikh: rekod.perkongsian_tarikh || '',
          perkongsian_isi: rekod.perkongsian_isi || '',
          perkongsian_cadangan: rekod.perkongsian_cadangan || '',
          pilihan_tindakan: rekod.pilihan_tindakan || [],
          tindakan_susulan: rekod.tindakan_susulan || '',
          rumusan: rekod.rumusan || ''
        })
        setGambarList(
          (rekod.dokumentasi || []).map((d) => ({
            id: d.id,
            previewUrl: d.image_url,
            existingUrl: d.image_url,
            storagePath: d.storage_path,
            caption: d.caption || ''
          }))
        )
        const penyedia = rekod.tandatangan?.find((t) => t.jenis === 'penyedia')
        const pengesah = rekod.tandatangan?.find((t) => t.jenis === 'pengesah')
        if (penyedia) {
          setTandatanganPenyedia(penyedia.signature_data)
          setPenyediaNama(penyedia.nama)
          setPenyediaJawatan(penyedia.jawatan)
          setPenyediaTarikh(penyedia.tarikh)
        }
        if (pengesah) {
          setTandatanganPengesah(pengesah.signature_data)
          setPengesahNama(pengesah.nama)
          setPengesahJawatan(pengesah.jawatan)
          setPengesahTarikh(pengesah.tarikh)
        }
      } else {
        setMesejRalatUmum('Rekod tidak dijumpai.')
      }
      setSedangMuat(false)
    }
    muat()
  }, [isEdit, id])

  // Auto-save draf ke localStorage sekiranya rangkaian terputus (rekod baharu sahaja)
  useEffect(() => {
    if (isEdit) return
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(KEY_AUTOSAVE, JSON.stringify(form))
      } catch {
        /* abaikan jika storan penuh */
      }
    }, 800)
    return () => clearTimeout(t)
  }, [form, isEdit])

  useEffect(() => {
    if (isEdit) return
    try {
      const simpanan = window.sessionStorage.getItem(KEY_AUTOSAVE)
      if (simpanan) setForm(JSON.parse(simpanan))
    } catch {
      /* abaikan */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kemaskiniMedan = <K extends keyof FormState>(medan: K, nilai: FormState[K]) => {
    setForm((prev) => ({ ...prev, [medan]: nilai }))
  }

  const togglePilihanTindakan = (pilihan: string) => {
    setForm((prev) => ({
      ...prev,
      pilihan_tindakan: prev.pilihan_tindakan.includes(pilihan)
        ? prev.pilihan_tindakan.filter((p) => p !== pilihan)
        : [...prev.pilihan_tindakan, pilihan]
    }))
  }

  const sahkanBorang = (): RalatBorang => {
    const ralatKursus = validasiMaklumatKursus({
      nama_kursus: form.nama_kursus,
      tarikh_mula: form.tarikh_mula,
      tarikh_tamat: form.tarikh_tamat,
      masa_mula: form.masa_mula,
      masa_tamat: form.masa_tamat,
      tempat: form.tempat
    })
    const ralatGuru = validasiNamaGuru(
      form.namaTiadaDalamSenarai ? '' : form.nama_guru_dropdown,
      form.namaTiadaDalamSenarai ? form.nama_guru_manual : ''
    )
    return gabungkanRalat(ralatKursus, ralatGuru)
  }

  const muatNaikGambarBaharu = async (minitCuraiId: string) => {
    for (const item of gambarList) {
      if (item.file) {
        const laluan = `${minitCuraiId}/${item.id}-${item.file.name}`
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_DOKUMENTASI)
          .upload(laluan, item.file, { upsert: true })
        if (uploadError) continue
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET_DOKUMENTASI).getPublicUrl(laluan)
        await supabase.from('dokumentasi').insert({
          minit_curai_id: minitCuraiId,
          image_url: publicUrlData.publicUrl,
          storage_path: laluan,
          caption: item.caption
        })
      } else if (item.existingUrl && item.storagePath) {
        // Kemaskini kapsyen sahaja untuk gambar sedia ada
        await supabase.from('dokumentasi').update({ caption: item.caption }).eq('id', item.id)
      }
    }
  }

  const simpanTandatangan = async (minitCuraiId: string) => {
    // PENTING: simpan rekod tandatangan jika MANA-MANA medan diisi (nama,
    // jawatan, tarikh, ATAU lukisan tandatangan) — bukan hanya bila ada
    // lukisan tandatangan. Sebelum ini, jika pengguna isi nama/jawatan/tarikh
    // tetapi tidak/belum sempat melukis tandatangan, SEMUA maklumat itu turut
    // tidak disimpan.
    const adaDataPenyedia =
      penyediaNama.trim() || penyediaJawatan.trim() || penyediaTarikh || tandatanganPenyedia
    if (adaDataPenyedia) {
      const { error } = await supabase.from('tandatangan').upsert(
        {
          minit_curai_id: minitCuraiId,
          jenis: 'penyedia',
          nama: penyediaNama.trim() || null,
          jawatan: penyediaJawatan.trim() || null,
          tarikh: penyediaTarikh || null,
          signature_data: tandatanganPenyedia
        },
        { onConflict: 'minit_curai_id,jenis' }
      )
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Gagal simpan tandatangan penyedia:', error.message)
      }
    }

    const adaDataPengesah =
      pengesahNama.trim() || pengesahJawatan.trim() || pengesahTarikh || tandatanganPengesah
    if (adaDataPengesah) {
      const { error } = await supabase.from('tandatangan').upsert(
        {
          minit_curai_id: minitCuraiId,
          jenis: 'pengesah',
          nama: pengesahNama.trim() || null,
          jawatan: pengesahJawatan.trim() || null,
          tarikh: pengesahTarikh || null,
          signature_data: tandatanganPengesah
        },
        { onConflict: 'minit_curai_id,jenis' }
      )
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Gagal simpan tandatangan pengesah:', error.message)
      }
    }
  }

  const bentukPayload = () => ({
    nama_kursus: form.nama_kursus.trim(),
    jenis_aktiviti: form.jenis_aktiviti,
    tarikh_mula: form.tarikh_mula,
    tarikh_tamat: form.tarikh_tamat,
    masa_mula: form.masa_mula,
    masa_tamat: form.masa_tamat,
    tempat: form.tempat.trim(),
    anjuran: form.anjuran.trim(),
    peringkat: form.peringkat,
    bilangan_jam: form.bilangan_jam ? Number(form.bilangan_jam) : null,
    nombor_rujukan: form.nombor_rujukan.trim() || null,
    nama_guru_dropdown: form.namaTiadaDalamSenarai ? null : form.nama_guru_dropdown || null,
    nama_guru_manual: form.namaTiadaDalamSenarai ? form.nama_guru_manual.trim() : null,
    jawatan: form.jawatan.trim() || null,
    gred: form.gred.trim() || null,
    mata_pelajaran: form.mata_pelajaran.trim() || null,
    tahun_kelas: form.tahun_kelas.trim() || null,
    emel: form.emel.trim() || null,
    telefon: form.telefon.trim() || null,
    objektif: form.objektif,
    isi_kandungan: form.isi_kandungan,
    perkongsian_kaedah: form.perkongsian_kaedah,
    perkongsian_sasaran: form.perkongsian_sasaran,
    perkongsian_tarikh: form.perkongsian_tarikh || null,
    perkongsian_isi: form.perkongsian_isi,
    perkongsian_cadangan: form.perkongsian_cadangan,
    pilihan_tindakan: form.pilihan_tindakan,
    tindakan_susulan: form.tindakan_susulan,
    rumusan: form.rumusan
  })

  const handleSimpan = async (statusBaharu: 'Draf' | 'Lengkap') => {
    setMesejRalatUmum(null)
    setMesejBerjaya(null)

    if (statusBaharu === 'Lengkap') {
      const semakan = sahkanBorang()
      setRalat(semakan)
      if (Object.keys(semakan).length > 0) {
        setMesejRalatUmum('Sila lengkapkan medan wajib sebelum menandakan rekod sebagai lengkap.')
        return
      }
    }

    setSedangSimpan(true)
    try {
      const payload = { ...bentukPayload(), status: statusBaharu }
      let minitCuraiId = id

      if (isEdit && id) {
        const { error } = await supabase.from('minit_curai').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('minit_curai').insert(payload).select().single()
        if (error) throw error
        minitCuraiId = data.id
      }

      if (minitCuraiId) {
        await muatNaikGambarBaharu(minitCuraiId)
        await simpanTandatangan(minitCuraiId)
      }

      try {
        window.sessionStorage.removeItem(KEY_AUTOSAVE)
      } catch {
        /* abaikan */
      }

      setMesejBerjaya(statusBaharu === 'Draf' ? 'Rekod berjaya disimpan sebagai draf.' : 'Rekod berjaya disimpan sebagai lengkap.')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setMesejRalatUmum('Rekod tidak dapat disimpan kerana masalah rangkaian. Data borang anda dikekalkan, sila cuba semula.')
    } finally {
      setSedangSimpan(false)
    }
  }

  const handleJanaPdf = async () => {
    if (!rekodSediaAda) {
      setMesejRalatUmum('Sila simpan rekod terlebih dahulu sebelum menjana PDF.')
      return
    }
    setSedangSimpan(true)
    try {
      const { blob, namaFail } = await janaPdfMinitCurai(rekodSediaAda)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = namaFail
      a.click()
      URL.revokeObjectURL(url)
      await supabase.from('minit_curai').update({ status: 'Dijana PDF' }).eq('id', rekodSediaAda.id)
    } catch {
      setMesejRalatUmum('Gagal menjana PDF.')
    } finally {
      setSedangSimpan(false)
    }
  }

  if (sedangMuat) {
    return <div className="min-h-screen flex items-center justify-center text-navy-700">Sedang memuatkan rekod...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-4xl mx-auto px-4">
          <HeaderRasmi compact />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-navy-800">
            {isEdit ? 'Kemaskini Minit Curai' : 'Cipta Minit Curai Baharu'}
          </h2>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </button>
        </div>

        {mesejRalatUmum && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {mesejRalatUmum}
          </div>
        )}
        {mesejBerjaya && (
          <div className="rounded-md bg-green-50 border border-green-200 text-green-700 px-4 py-2 text-sm">
            {mesejBerjaya}
          </div>
        )}

        {/* 1. Maklumat Kursus atau Lawatan */}
        <section className="card p-5">
          <h3 className="section-title">1. Maklumat Kursus atau Lawatan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label form-required">Nama Kursus atau Lawatan</label>
              <input
                type="text"
                className="form-input"
                value={form.nama_kursus}
                onChange={(e) => kemaskiniMedan('nama_kursus', e.target.value)}
              />
              {ralat.nama_kursus && <p className="error-text">{ralat.nama_kursus}</p>}
            </div>

            <div>
              <label className="form-label form-required">Jenis Aktiviti</label>
              <select
                className="form-input"
                value={form.jenis_aktiviti}
                onChange={(e) => kemaskiniMedan('jenis_aktiviti', e.target.value as JenisAktiviti)}
              >
                {JENIS_AKTIVITI_PILIHAN.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label form-required">Peringkat</label>
              <select
                className="form-input"
                value={form.peringkat}
                onChange={(e) => kemaskiniMedan('peringkat', e.target.value as Peringkat)}
              >
                {PERINGKAT_PILIHAN.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label form-required">Tarikh Mula</label>
              <input
                type="date"
                className="form-input"
                value={form.tarikh_mula}
                onChange={(e) => kemaskiniMedan('tarikh_mula', e.target.value)}
              />
              {ralat.tarikh_mula && <p className="error-text">{ralat.tarikh_mula}</p>}
            </div>
            <div>
              <label className="form-label form-required">Tarikh Tamat</label>
              <input
                type="date"
                className="form-input"
                value={form.tarikh_tamat}
                onChange={(e) => kemaskiniMedan('tarikh_tamat', e.target.value)}
              />
              {ralat.tarikh_tamat && <p className="error-text">{ralat.tarikh_tamat}</p>}
            </div>

            <div>
              <label className="form-label">Masa Mula</label>
              <input
                type="time"
                className="form-input"
                value={form.masa_mula}
                onChange={(e) => kemaskiniMedan('masa_mula', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Masa Tamat</label>
              <input
                type="time"
                className="form-input"
                value={form.masa_tamat}
                onChange={(e) => kemaskiniMedan('masa_tamat', e.target.value)}
              />
              {ralat.masa_tamat && <p className="error-text">{ralat.masa_tamat}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="form-label form-required">Tempat</label>
              <input
                type="text"
                className="form-input"
                value={form.tempat}
                onChange={(e) => kemaskiniMedan('tempat', e.target.value)}
              />
              {ralat.tempat && <p className="error-text">{ralat.tempat}</p>}
            </div>

            <div>
              <label className="form-label">Anjuran</label>
              <input
                type="text"
                className="form-input"
                value={form.anjuran}
                onChange={(e) => kemaskiniMedan('anjuran', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Bilangan Jam</label>
              <input
                type="number"
                min={0}
                step="0.5"
                className="form-input"
                value={form.bilangan_jam}
                onChange={(e) => kemaskiniMedan('bilangan_jam', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Nombor Surat / Rujukan</label>
              <input
                type="text"
                className="form-input"
                value={form.nombor_rujukan}
                onChange={(e) => kemaskiniMedan('nombor_rujukan', e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Catatan Tambahan</label>
              <textarea
                className="form-textarea"
                value={form.catatan}
                onChange={(e) => kemaskiniMedan('catatan', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 2. Maklumat Guru */}
        <section className="card p-5">
          <h3 className="section-title">2. Maklumat Guru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2" ref={guruDropdownRef}>
              <label className="form-label form-required">Nama Guru</label>
              {!form.namaTiadaDalamSenarai ? (
                <div className="relative">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Taip untuk cari nama guru..."
                    value={form.nama_guru_dropdown || carianGuru}
                    onFocus={() => setTunjukSenaraiGuru(true)}
                    onChange={(e) => {
                      setCarianGuru(e.target.value)
                      kemaskiniMedan('nama_guru_dropdown', '')
                      setTunjukSenaraiGuru(true)
                    }}
                  />
                  {tunjukSenaraiGuru && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-slate-300 bg-white shadow-lg">
                      {namaGuruTertapis.map((nama) => (
                        <button
                          type="button"
                          key={nama}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-navy-50"
                          onClick={() => {
                            kemaskiniMedan('nama_guru_dropdown', nama)
                            setCarianGuru('')
                            setTunjukSenaraiGuru(false)
                          }}
                        >
                          {nama}
                        </button>
                      ))}
                      {namaGuruTertapis.length === 0 && (
                        <p className="px-3 py-2 text-sm text-slate-500">Tiada padanan dijumpai.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan Nama Guru Secara Manual"
                    value={form.nama_guru_manual}
                    onChange={(e) => kemaskiniMedan('nama_guru_manual', e.target.value)}
                  />
                </div>
              )}

              <label className="inline-flex items-center gap-2 mt-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.namaTiadaDalamSenarai}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setForm((prev) => ({
                      ...prev,
                      namaTiadaDalamSenarai: checked,
                      nama_guru_dropdown: checked ? '' : prev.nama_guru_dropdown,
                      nama_guru_manual: checked ? prev.nama_guru_manual : ''
                    }))
                  }}
                />
                {PILIHAN_NAMA_TIADA_DALAM_SENARAI}
              </label>
              {ralat.nama_guru && <p className="error-text">{ralat.nama_guru}</p>}
            </div>

            <div>
              <label className="form-label">Jawatan</label>
              <input
                type="text"
                className="form-input"
                value={form.jawatan}
                onChange={(e) => kemaskiniMedan('jawatan', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Gred Jawatan</label>
              <input
                type="text"
                className="form-input"
                value={form.gred}
                onChange={(e) => kemaskiniMedan('gred', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Mata Pelajaran</label>
              <input
                type="text"
                className="form-input"
                value={form.mata_pelajaran}
                onChange={(e) => kemaskiniMedan('mata_pelajaran', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Tahun / Kelas</label>
              <input
                type="text"
                className="form-input"
                value={form.tahun_kelas}
                onChange={(e) => kemaskiniMedan('tahun_kelas', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Emel</label>
              <input
                type="email"
                className="form-input"
                value={form.emel}
                onChange={(e) => kemaskiniMedan('emel', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Nombor Telefon</label>
              <input
                type="tel"
                className="form-input"
                value={form.telefon}
                onChange={(e) => kemaskiniMedan('telefon', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 3. Objektif Kursus */}
        <section className="card p-5">
          <h3 className="section-title">3. Objektif Kursus</h3>
          <textarea
            className="form-textarea min-h-[140px]"
            placeholder="Senaraikan objektif kursus (boleh guna senarai bernombor atau bullet, contoh: 1. ... / - ...)"
            value={form.objektif}
            onChange={(e) => kemaskiniMedan('objektif', e.target.value)}
          />
        </section>

        {/* 4. Isi Kandungan / Ilmu yang Diperoleh */}
        <section className="card p-5">
          <h3 className="section-title">4. Isi Kandungan / Ilmu yang Diperoleh</h3>
          <textarea
            className="form-textarea min-h-[160px]"
            placeholder="Catatkan isi kandungan kursus, pengetahuan baharu, kemahiran, amalan terbaik, kaedah dan bahan/sumber yang diterima."
            value={form.isi_kandungan}
            onChange={(e) => kemaskiniMedan('isi_kandungan', e.target.value)}
          />
        </section>

        {/* 5. Perkongsian kepada Warga Sekolah */}
        <section className="card p-5">
          <h3 className="section-title">5. Perkongsian kepada Warga Sekolah</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Kaedah Perkongsian</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Taklimat, Google Slides, Bengkel mini"
                value={form.perkongsian_kaedah}
                onChange={(e) => kemaskiniMedan('perkongsian_kaedah', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Sasaran Warga Sekolah</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Semua guru, Panitia BM, Guru Tingkatan 6"
                value={form.perkongsian_sasaran}
                onChange={(e) => kemaskiniMedan('perkongsian_sasaran', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Tarikh Perkongsian</label>
              <input
                type="date"
                className="form-input"
                value={form.perkongsian_tarikh}
                onChange={(e) => kemaskiniMedan('perkongsian_tarikh', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Isi Utama yang Dikongsikan</label>
              <textarea
                className="form-textarea"
                value={form.perkongsian_isi}
                onChange={(e) => kemaskiniMedan('perkongsian_isi', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Cadangan Pelaksanaan</label>
              <textarea
                className="form-textarea"
                value={form.perkongsian_cadangan}
                onChange={(e) => kemaskiniMedan('perkongsian_cadangan', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 6. Tindakan Susulan */}
        <section className="card p-5">
          <h3 className="section-title">6. Tindakan Susulan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {PILIHAN_TINDAKAN_SUSULAN.map((p) => (
              <label key={p} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.pilihan_tindakan.includes(p)}
                  onChange={() => togglePilihanTindakan(p)}
                />
                {p}
              </label>
            ))}
          </div>
          <label className="form-label">Penerangan Tambahan</label>
          <textarea
            className="form-textarea"
            value={form.tindakan_susulan}
            onChange={(e) => kemaskiniMedan('tindakan_susulan', e.target.value)}
          />
        </section>

        {/* 7. Rumusan */}
        <section className="card p-5">
          <h3 className="section-title">7. Rumusan</h3>
          <textarea
            className="form-textarea min-h-[140px]"
            placeholder="Rumusan keseluruhan kursus dan manfaat kepada guru, murid dan sekolah."
            value={form.rumusan}
            onChange={(e) => kemaskiniMedan('rumusan', e.target.value)}
          />
        </section>

        {/* 8. Dokumentasi Bergambar */}
        <section className="card p-5">
          <h3 className="section-title">8. Dokumentasi Bergambar</h3>
          <ImageUploadField items={gambarList} onChange={setGambarList} maxItems={2} maxSizeMb={5} />
        </section>

        {/* 9. Tandatangan dan Pengesahan */}
        <section className="card p-5">
          <h3 className="section-title">9. Tandatangan dan Pengesahan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="font-semibold text-navy-800">Disediakan Oleh</p>
              <div>
                <label className="form-label">Nama</label>
                <input
                  type="text"
                  className="form-input"
                  value={penyediaNama}
                  onChange={(e) => setPenyediaNama(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Jawatan</label>
                <input
                  type="text"
                  className="form-input"
                  value={penyediaJawatan}
                  onChange={(e) => setPenyediaJawatan(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Tarikh</label>
                <input
                  type="date"
                  className="form-input"
                  value={penyediaTarikh}
                  onChange={(e) => setPenyediaTarikh(e.target.value)}
                />
              </div>
              <TandatanganInput label="Tandatangan" value={tandatanganPenyedia} onChange={setTandatanganPenyedia} />
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-navy-800">Disahkan Oleh</p>
              <div>
                <label className="form-label">Nama</label>
                <input
                  type="text"
                  className="form-input"
                  value={pengesahNama}
                  onChange={(e) => setPengesahNama(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Jawatan</label>
                <input
                  type="text"
                  className="form-input"
                  value={pengesahJawatan}
                  onChange={(e) => setPengesahJawatan(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Tarikh</label>
                <input
                  type="date"
                  className="form-input"
                  value={pengesahTarikh}
                  onChange={(e) => setPengesahTarikh(e.target.value)}
                />
              </div>
              <TandatanganInput label="Tandatangan" value={tandatanganPengesah} onChange={setTandatanganPengesah} />
            </div>
          </div>
        </section>

        {/* Butang Tindakan */}
        <div className="flex flex-wrap gap-3 justify-end no-print">
          <button className="btn-secondary" onClick={() => handleSimpan('Draf')} disabled={sedangSimpan}>
            {sedangSimpan ? 'Menyimpan...' : 'Simpan sebagai Draf'}
          </button>
          <button className="btn-primary" onClick={() => handleSimpan('Lengkap')} disabled={sedangSimpan}>
            {sedangSimpan ? 'Menyimpan...' : 'Simpan sebagai Lengkap'}
          </button>
          {isEdit && (
            <button className="btn-outline" onClick={handleJanaPdf} disabled={sedangSimpan}>
              Jana PDF
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MinitCuraiForm
