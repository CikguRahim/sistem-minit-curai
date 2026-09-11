import jsPDF from 'jspdf'
import type { MinitCurai } from '../types'

const LOGO_KPM = 'https://i.postimg.cc/4NPGCNRL/LOGO-KPM-NO-BG.png'
const LOGO_SKTJ = 'https://i.postimg.cc/26jkq6B8/LOGO-SKTJ-3D-REAL.png'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function namaGuruAkhir(rekod: MinitCurai): string {
  return rekod.nama_guru_manual?.trim() || rekod.nama_guru_dropdown?.trim() || '-'
}

function tajukFail(rekod: MinitCurai): string {
  const namaKursus = rekod.nama_kursus.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const tarikh = rekod.tarikh_mula
  return `Minit-Curai-${namaKursus}-${tarikh}.pdf`
}

export async function janaPdfMinitCurai(rekod: MinitCurai): Promise<{ blob: Blob; namaFail: string }> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const [logoKpm, logoSktj] = await Promise.all([
    loadImageAsDataUrl(LOGO_KPM),
    loadImageAsDataUrl(LOGO_SKTJ)
  ])

  let y = MARGIN

  const pageBreakIfNeeded = (tinggiDiperlukan: number) => {
    if (y + tinggiDiperlukan > PAGE_H - 20) {
      tambahNomborHalaman()
      doc.addPage()
      y = MARGIN
    }
  }

  const tambahNomborHalaman = () => {
    const pageInfo = doc.getCurrentPageInfo()
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(`Halaman ${pageInfo.pageNumber}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' })
    doc.text(
      `Dijana pada: ${new Date().toLocaleString('ms-MY')}`,
      MARGIN,
      PAGE_H - 10
    )
  }

  // --- Header dengan logo ---
  if (logoKpm) doc.addImage(logoKpm, 'PNG', MARGIN, y, 22, 22)
  if (logoSktj) doc.addImage(logoSktj, 'PNG', PAGE_W - MARGIN - 22, y, 22, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(21, 44, 72)
  doc.text('SISTEM MINIT CURAI KURSUS GURU', PAGE_W / 2, y + 9, { align: 'center' })
  doc.setFontSize(11)
  doc.text('SEKOLAH KEBANGSAAN TAMAN JASMIN', PAGE_W / 2, y + 16, { align: 'center' })
  doc.setDrawColor(21, 44, 72)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 24, PAGE_W - MARGIN, y + 24)
  y += 30

  doc.setTextColor(0, 0, 0)

  // --- Helper untuk tajuk bahagian ---
  const tajukBahagian = (teks: string) => {
    pageBreakIfNeeded(12)
    doc.setFillColor(21, 44, 72)
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(teks, MARGIN + 2, y + 5)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  const barisMedan = (label: string, nilai: string, lebarLabel = 55) => {
    pageBreakIfNeeded(7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(label, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    const teksNilai = doc.splitTextToSize(nilai || '-', CONTENT_W - lebarLabel)
    doc.text(teksNilai, MARGIN + lebarLabel, y)
    y += Math.max(6, teksNilai.length * 4.5)
  }

  const perenganPanjang = (label: string, teks: string) => {
    tajukBahagian(label)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines: string[] = doc.splitTextToSize(teks?.trim() || '-', CONTENT_W)
    for (const line of lines) {
      pageBreakIfNeeded(6)
      doc.text(line, MARGIN, y)
      y += 5
    }
    y += 3
  }

  // --- 1. Maklumat Kursus ---
  tajukBahagian('1. MAKLUMAT KURSUS / LAWATAN')
  barisMedan('Nama Kursus/Lawatan:', rekod.nama_kursus)
  barisMedan('Jenis Aktiviti:', rekod.jenis_aktiviti)
  barisMedan('Tarikh:', `${rekod.tarikh_mula} hingga ${rekod.tarikh_tamat}`)
  barisMedan('Masa:', `${rekod.masa_mula} - ${rekod.masa_tamat}`)
  barisMedan('Tempat:', rekod.tempat)
  barisMedan('Anjuran:', rekod.anjuran || '-')
  barisMedan('Peringkat:', rekod.peringkat)
  barisMedan('Bilangan Jam:', rekod.bilangan_jam ? String(rekod.bilangan_jam) : '-')
  barisMedan('No. Rujukan/Surat:', rekod.nombor_rujukan || '-')
  y += 2

  // --- 2. Maklumat Guru ---
  tajukBahagian('2. MAKLUMAT GURU')
  barisMedan('Nama Guru:', namaGuruAkhir(rekod))
  barisMedan('Jawatan:', rekod.jawatan || '-')
  barisMedan('Gred Jawatan:', rekod.gred || '-')
  barisMedan('Mata Pelajaran:', rekod.mata_pelajaran || '-')
  barisMedan('Tahun/Kelas:', rekod.tahun_kelas || '-')
  barisMedan('Emel:', rekod.emel || '-')
  barisMedan('No. Telefon:', rekod.telefon || '-')
  y += 2

  // --- 3-7 Perenggan panjang ---
  perenganPanjang('3. OBJEKTIF KURSUS', rekod.objektif || '')
  perenganPanjang('4. ISI KANDUNGAN / ILMU YANG DIPEROLEH', rekod.isi_kandungan || '')

  tajukBahagian('5. PERKONGSIAN KEPADA WARGA SEKOLAH')
  barisMedan('Kaedah Perkongsian:', rekod.perkongsian_kaedah || '-')
  barisMedan('Sasaran Warga Sekolah:', rekod.perkongsian_sasaran || '-')
  barisMedan('Tarikh Perkongsian:', rekod.perkongsian_tarikh || '-')
  barisMedan('Isi Utama:', rekod.perkongsian_isi || '-')
  barisMedan('Cadangan Pelaksanaan:', rekod.perkongsian_cadangan || '-')
  y += 2

  tajukBahagian('6. TINDAKAN SUSULAN')
  const pilihan = rekod.pilihan_tindakan || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (pilihan.length === 0) {
    doc.text('Tiada tindakan susulan dipilih.', MARGIN, y)
    y += 6
  } else {
    for (const item of pilihan) {
      pageBreakIfNeeded(6)
      doc.text(`[X] ${item}`, MARGIN, y)
      y += 5
    }
  }
  if (rekod.tindakan_susulan) {
    y += 1
    perenganPanjang('Penerangan Tambahan:', rekod.tindakan_susulan)
  }

  perenganPanjang('7. RUMUSAN', rekod.rumusan || '')

  // --- 8. Dokumentasi Bergambar ---
  if (rekod.dokumentasi && rekod.dokumentasi.length > 0) {
    tajukBahagian('8. DOKUMENTASI BERGAMBAR')
    let x = MARGIN
    const lebarGambar = (CONTENT_W - 10) / 2
    const tinggiGambar = 55
    pageBreakIfNeeded(tinggiGambar + 12)
    const yMula = y
    for (let i = 0; i < rekod.dokumentasi.length; i++) {
      const gambar = rekod.dokumentasi[i]
      const dataUrl = await loadImageAsDataUrl(gambar.image_url)
      const posX = MARGIN + (i % 2) * (lebarGambar + 10)
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, 'JPEG', posX, yMula, lebarGambar, tinggiGambar, undefined, 'FAST')
        } catch {
          doc.rect(posX, yMula, lebarGambar, tinggiGambar)
        }
      } else {
        doc.rect(posX, yMula, lebarGambar, tinggiGambar)
      }
      doc.setFontSize(8)
      doc.text(gambar.caption || `Gambar ${i + 1}`, posX, yMula + tinggiGambar + 4, {
        maxWidth: lebarGambar
      })
    }
    y = yMula + tinggiGambar + 10
  }

  // --- 9. Tandatangan ---
  tajukBahagian('9. PENGESAHAN')
  const penyedia = rekod.tandatangan?.find((t) => t.jenis === 'penyedia')
  const pengesah = rekod.tandatangan?.find((t) => t.jenis === 'pengesah')

  pageBreakIfNeeded(60)
  const yTandatangan = y
  const lebarBlok = (CONTENT_W - 10) / 2

  const lukisBlokTandatangan = async (
    tajuk: string,
    data: typeof penyedia,
    posX: number
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(tajuk, posX, yTandatangan)
    const gambarTT = data?.signature_data || data?.signature_url
    if (gambarTT) {
      const dataUrl = gambarTT.startsWith('data:') ? gambarTT : await loadImageAsDataUrl(gambarTT)
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, 'PNG', posX, yTandatangan + 3, lebarBlok, 20)
        } catch {
          /* abaikan jika gagal */
        }
      }
    }
    doc.line(posX, yTandatangan + 25, posX + lebarBlok, yTandatangan + 25)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Nama: ${data?.nama || '-'}`, posX, yTandatangan + 30)
    doc.text(`Jawatan: ${data?.jawatan || '-'}`, posX, yTandatangan + 35)
    doc.text(`Tarikh: ${data?.tarikh || '-'}`, posX, yTandatangan + 40)
  }

  await lukisBlokTandatangan('Disediakan oleh:', penyedia, MARGIN)
  await lukisBlokTandatangan('Disahkan oleh:', pengesah, MARGIN + lebarBlok + 10)
  y = yTandatangan + 46

  tambahNomborHalaman()

  const blob = doc.output('blob')
  return { blob, namaFail: tajukFail(rekod) }
}
