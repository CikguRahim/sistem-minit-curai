import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HeaderRasmi from '../components/HeaderRasmi'
import type { MinitCurai } from '../types'
import { janaPdfMinitCurai } from '../lib/generatePdf'

const LihatRekod: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [rekod, setRekod] = useState<MinitCurai | null>(null)
  const [loading, setLoading] = useState(true)
  const [sedangJana, setSedangJana] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('minit_curai')
      .select('*, dokumentasi(*), tandatangan(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRekod((data as MinitCurai) || null)
        setLoading(false)
      })
  }, [id])

  const handleJanaPdf = async () => {
    if (!rekod) return
    setSedangJana(true)
    try {
      const { blob, namaFail } = await janaPdfMinitCurai(rekod)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = namaFail
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setSedangJana(false)
    }
  }

  const namaGuru = rekod?.nama_guru_manual || rekod?.nama_guru_dropdown || '-'
  const penyedia = rekod?.tandatangan?.find((t) => t.jenis === 'penyedia')
  const pengesah = rekod?.tandatangan?.find((t) => t.jenis === 'pengesah')

  if (loading) return <div className="min-h-screen flex items-center justify-center">Sedang memuatkan...</div>
  if (!rekod) return <div className="min-h-screen flex items-center justify-center">Rekod tidak dijumpai.</div>

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4 no-print">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </button>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => navigate(`/rekod/${id}/edit`)}>
              Edit
            </button>
            <button className="btn-primary" onClick={handleJanaPdf} disabled={sedangJana}>
              {sedangJana ? 'Menjana PDF...' : 'Jana / Muat Turun PDF'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <HeaderRasmi />
          <hr className="my-4 border-navy-100" />

          <Bahagian tajuk="1. Maklumat Kursus atau Lawatan">
            <Medan label="Nama Kursus/Lawatan" nilai={rekod.nama_kursus} />
            <Medan label="Jenis Aktiviti" nilai={rekod.jenis_aktiviti} />
            <Medan label="Tarikh" nilai={`${rekod.tarikh_mula} hingga ${rekod.tarikh_tamat}`} />
            <Medan label="Masa" nilai={`${rekod.masa_mula} - ${rekod.masa_tamat}`} />
            <Medan label="Tempat" nilai={rekod.tempat} />
            <Medan label="Anjuran" nilai={rekod.anjuran} />
            <Medan label="Peringkat" nilai={rekod.peringkat} />
            <Medan label="Bilangan Jam" nilai={rekod.bilangan_jam ? String(rekod.bilangan_jam) : '-'} />
            <Medan label="No. Rujukan" nilai={rekod.nombor_rujukan || '-'} />
          </Bahagian>

          <Bahagian tajuk="2. Maklumat Guru">
            <Medan label="Nama Guru" nilai={namaGuru} />
            <Medan label="Jawatan" nilai={rekod.jawatan || '-'} />
            <Medan label="Gred Jawatan" nilai={rekod.gred || '-'} />
            <Medan label="Mata Pelajaran" nilai={rekod.mata_pelajaran || '-'} />
            <Medan label="Tahun/Kelas" nilai={rekod.tahun_kelas || '-'} />
            <Medan label="Emel" nilai={rekod.emel || '-'} />
            <Medan label="No. Telefon" nilai={rekod.telefon || '-'} />
          </Bahagian>

          <BahagianTeks tajuk="3. Objektif Kursus" teks={rekod.objektif} />
          <BahagianTeks tajuk="4. Isi Kandungan / Ilmu yang Diperoleh" teks={rekod.isi_kandungan} />

          <Bahagian tajuk="5. Perkongsian kepada Warga Sekolah">
            <Medan label="Kaedah Perkongsian" nilai={rekod.perkongsian_kaedah || '-'} />
            <Medan label="Sasaran" nilai={rekod.perkongsian_sasaran || '-'} />
            <Medan label="Tarikh Perkongsian" nilai={rekod.perkongsian_tarikh || '-'} />
            <Medan label="Isi Utama" nilai={rekod.perkongsian_isi || '-'} />
            <Medan label="Cadangan Pelaksanaan" nilai={rekod.perkongsian_cadangan || '-'} />
          </Bahagian>

          <div className="mb-6">
            <h3 className="section-title">6. Tindakan Susulan</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {(rekod.pilihan_tindakan || []).length === 0 && <li>Tiada tindakan dipilih.</li>}
              {(rekod.pilihan_tindakan || []).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {rekod.tindakan_susulan && (
              <p className="text-sm mt-2 whitespace-pre-wrap">{rekod.tindakan_susulan}</p>
            )}
          </div>

          <BahagianTeks tajuk="7. Rumusan" teks={rekod.rumusan} />

          {rekod.dokumentasi && rekod.dokumentasi.length > 0 && (
            <div className="mb-6">
              <h3 className="section-title">8. Dokumentasi Bergambar</h3>
              <div className="grid grid-cols-2 gap-4">
                {rekod.dokumentasi.map((d) => (
                  <div key={d.id}>
                    <img src={d.image_url} alt={d.caption || ''} className="w-full h-40 object-cover rounded-md border" />
                    {d.caption && <p className="text-xs text-slate-500 mt-1">{d.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2">
            <h3 className="section-title">9. Pengesahan</h3>
            <div className="grid grid-cols-2 gap-6">
              <BlokTandatangan tajuk="Disediakan oleh" data={penyedia} />
              <BlokTandatangan tajuk="Disahkan oleh" data={pengesah} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Bahagian: React.FC<{ tajuk: string; children: React.ReactNode }> = ({ tajuk, children }) => (
  <div className="mb-6">
    <h3 className="section-title">{tajuk}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">{children}</div>
  </div>
)

const BahagianTeks: React.FC<{ tajuk: string; teks: string | null | undefined }> = ({ tajuk, teks }) => (
  <div className="mb-6">
    <h3 className="section-title">{tajuk}</h3>
    <p className="text-sm whitespace-pre-wrap">{teks || '-'}</p>
  </div>
)

const Medan: React.FC<{ label: string; nilai: string }> = ({ label, nilai }) => (
  <div>
    <span className="font-semibold text-navy-800">{label}: </span>
    <span>{nilai}</span>
  </div>
)

const BlokTandatangan: React.FC<{ tajuk: string; data?: { nama: string; jawatan: string; tarikh: string; signature_data: string | null } }> = ({
  tajuk,
  data
}) => (
  <div>
    <p className="font-semibold text-navy-800 mb-2">{tajuk}:</p>
    {data?.signature_data ? (
      <img src={data.signature_data} alt="Tandatangan" className="h-16 border-b border-slate-400 mb-2" />
    ) : (
      <div className="h-16 border-b border-slate-400 mb-2" />
    )}
    <p className="text-sm">Nama: {data?.nama || '-'}</p>
    <p className="text-sm">Jawatan: {data?.jawatan || '-'}</p>
    <p className="text-sm">Tarikh: {data?.tarikh || '-'}</p>
  </div>
)

export default LihatRekod
