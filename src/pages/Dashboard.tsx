import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HeaderRasmi from '../components/HeaderRasmi'
import type { MinitCurai, StatusRekod } from '../types'
import { janaPdfMinitCurai } from '../lib/generatePdf'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [rekodSenarai, setRekodSenarai] = useState<MinitCurai[]>([])
  const [loading, setLoading] = useState(true)
  const [carian, setCarian] = useState('')
  const [penapisStatus, setPenapisStatus] = useState<StatusRekod | 'Semua'>('Semua')
  const [rekodUntukPadam, setRekodUntukPadam] = useState<MinitCurai | null>(null)
  const [mesejRalat, setMesejRalat] = useState<string | null>(null)
  const [sedangJanaPdf, setSedangJanaPdf] = useState<string | null>(null)

  const muatSemulaRekod = useCallback(async () => {
    setLoading(true)
    setMesejRalat(null)
    const { data, error } = await supabase
      .from('minit_curai')
      .select('*, dokumentasi(*), tandatangan(*)')
      .order('created_at', { ascending: false })

    if (error) {
      setMesejRalat('Gagal memuatkan rekod. Sila cuba semula.')
    } else {
      setRekodSenarai((data as MinitCurai[]) || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    muatSemulaRekod()
  }, [muatSemulaRekod])

  const statistik = useMemo(() => {
    return {
      jumlah: rekodSenarai.length,
      draf: rekodSenarai.filter((r) => r.status === 'Draf').length,
      lengkap: rekodSenarai.filter((r) => r.status === 'Lengkap' || r.status === 'Dijana PDF').length
    }
  }, [rekodSenarai])

  const rekodTertapis = useMemo(() => {
    const kunciCarian = carian.trim().toLowerCase()
    return rekodSenarai.filter((r) => {
      const namaGuru = (r.nama_guru_manual || r.nama_guru_dropdown || '').toLowerCase()
      const sepadanCarian =
        !kunciCarian ||
        r.nama_kursus.toLowerCase().includes(kunciCarian) ||
        namaGuru.includes(kunciCarian) ||
        r.tempat.toLowerCase().includes(kunciCarian) ||
        r.tarikh_mula.includes(kunciCarian)
      const sepadanStatus = penapisStatus === 'Semua' || r.status === penapisStatus
      return sepadanCarian && sepadanStatus
    })
  }, [rekodSenarai, carian, penapisStatus])

  const handlePadam = async () => {
    if (!rekodUntukPadam) return
    const { error } = await supabase.from('minit_curai').delete().eq('id', rekodUntukPadam.id)
    if (error) {
      setMesejRalat('Gagal memadam rekod.')
    } else {
      setRekodSenarai((prev) => prev.filter((r) => r.id !== rekodUntukPadam.id))
    }
    setRekodUntukPadam(null)
  }

  const handleSalin = async (rekod: MinitCurai) => {
    const { id, created_at, updated_at, dokumentasi, tandatangan, ...rest } = rekod
    const { data, error } = await supabase
      .from('minit_curai')
      .insert({ ...rest, status: 'Draf' })
      .select()
      .single()
    if (!error && data) {
      navigate(`/rekod/${data.id}/edit`)
    } else {
      setMesejRalat('Gagal menyalin rekod.')
    }
  }

  const handleJanaPdf = async (rekod: MinitCurai) => {
    setSedangJanaPdf(rekod.id)
    try {
      const { blob, namaFail } = await janaPdfMinitCurai(rekod)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = namaFail
      a.click()
      URL.revokeObjectURL(url)
      await supabase.from('minit_curai').update({ status: 'Dijana PDF' }).eq('id', rekod.id)
      setRekodSenarai((prev) =>
        prev.map((r) => (r.id === rekod.id ? { ...r, status: 'Dijana PDF' } : r))
      )
    } catch {
      setMesejRalat('Gagal menjana PDF. Sila cuba semula.')
    } finally {
      setSedangJanaPdf(null)
    }
  }

  const badgeWarna = (status: StatusRekod) => {
    switch (status) {
      case 'Draf':
        return 'bg-amber-100 text-amber-800'
      case 'Lengkap':
        return 'bg-green-100 text-green-800'
      case 'Dijana PDF':
        return 'bg-navy-100 text-navy-800'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4">
          <HeaderRasmi compact />
          <div className="flex items-center justify-between pb-3">
            <p className="text-sm text-slate-600">
              Sistem terbuka — semua rekod minit curai kursus guru SK Taman Jasmin.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-slate-500">Jumlah Rekod Minit Curai</p>
            <p className="text-3xl font-bold text-navy-800">{statistik.jumlah}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Jumlah Draf</p>
            <p className="text-3xl font-bold text-amber-600">{statistik.draf}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Jumlah Rekod Lengkap</p>
            <p className="text-3xl font-bold text-green-700">{statistik.lengkap}</p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <label className="form-label">Cari (nama kursus, guru, tempat, tarikh)</label>
                <input
                  type="text"
                  className="form-input"
                  value={carian}
                  onChange={(e) => setCarian(e.target.value)}
                  placeholder="Contoh: Bengkel KSSM, Ahmad, Dewan..."
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={penapisStatus}
                  onChange={(e) => setPenapisStatus(e.target.value as StatusRekod | 'Semua')}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Draf">Draf</option>
                  <option value="Lengkap">Lengkap</option>
                  <option value="Dijana PDF">Dijana PDF</option>
                </select>
              </div>
            </div>
            <button onClick={() => navigate('/rekod/baharu')} className="btn-primary whitespace-nowrap">
              + Cipta Rekod Baharu
            </button>
          </div>
        </div>

        {mesejRalat && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {mesejRalat}
          </div>
        )}

        <div className="card overflow-x-auto">
          {loading ? (
            <p className="p-6 text-center text-slate-500">Sedang memuatkan rekod...</p>
          ) : rekodTertapis.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Tiada rekod dijumpai.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-navy-800 text-white">
                <tr>
                  <th className="text-left px-4 py-2">Nama Kursus</th>
                  <th className="text-left px-4 py-2">Nama Guru</th>
                  <th className="text-left px-4 py-2">Tarikh</th>
                  <th className="text-left px-4 py-2">Tempat</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rekodTertapis.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-navy-800">{r.nama_kursus}</td>
                    <td className="px-4 py-2">{r.nama_guru_manual || r.nama_guru_dropdown || '-'}</td>
                    <td className="px-4 py-2">{r.tarikh_mula}</td>
                    <td className="px-4 py-2">{r.tempat}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeWarna(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button className="text-navy-700 underline text-xs" onClick={() => navigate(`/rekod/${r.id}`)}>
                          Lihat
                        </button>
                        <button
                          className="text-navy-700 underline text-xs"
                          onClick={() => navigate(`/rekod/${r.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button className="text-navy-700 underline text-xs" onClick={() => handleSalin(r)}>
                          Salin
                        </button>
                        <button
                          className="text-navy-700 underline text-xs disabled:opacity-50"
                          onClick={() => handleJanaPdf(r)}
                          disabled={sedangJanaPdf === r.id}
                        >
                          {sedangJanaPdf === r.id ? 'Menjana...' : 'Jana PDF'}
                        </button>
                        <button
                          className="text-red-600 underline text-xs"
                          onClick={() => setRekodUntukPadam(r)}
                        >
                          Padam
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rekodUntukPadam && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50 no-print">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-navy-800 mb-2">Sahkan Pemadaman</h3>
            <p className="text-sm text-slate-600 mb-4">
              Adakah anda pasti mahu memadam rekod &ldquo;{rekodUntukPadam.nama_kursus}&rdquo;? Tindakan ini tidak
              boleh diundur.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setRekodUntukPadam(null)}>
                Batal
              </button>
              <button className="btn-danger" onClick={handlePadam}>
                Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
