import type { MinitCuraiFormData } from '../types'

export interface RalatBorang {
  [key: string]: string
}

export function validasiMaklumatKursus(data: Partial<MinitCuraiFormData>): RalatBorang {
  const ralat: RalatBorang = {}

  if (!data.nama_kursus?.trim()) ralat.nama_kursus = 'Nama kursus wajib diisi.'
  if (!data.tarikh_mula) ralat.tarikh_mula = 'Tarikh mula wajib diisi.'
  if (!data.tarikh_tamat) ralat.tarikh_tamat = 'Tarikh tamat wajib diisi.'
  if (!data.tempat?.trim()) ralat.tempat = 'Tempat wajib diisi.'

  if (data.tarikh_mula && data.tarikh_tamat) {
    if (new Date(data.tarikh_tamat) < new Date(data.tarikh_mula)) {
      ralat.tarikh_tamat = 'Tarikh tamat tidak boleh lebih awal daripada tarikh mula.'
    } else if (
      data.tarikh_mula === data.tarikh_tamat &&
      data.masa_mula &&
      data.masa_tamat &&
      data.masa_tamat < data.masa_mula
    ) {
      ralat.masa_tamat = 'Masa tamat tidak boleh lebih awal daripada masa mula.'
    }
  }

  return ralat
}

export function validasiNamaGuru(
  namaDropdown: string | null | undefined,
  namaManual: string | null | undefined
): RalatBorang {
  const ralat: RalatBorang = {}
  const adaDropdown = !!namaDropdown?.trim()
  const adaManual = !!namaManual?.trim()

  if (adaDropdown && adaManual) {
    ralat.nama_guru = 'Sila pilih SATU sahaja: nama dari senarai ATAU nama secara manual, bukan kedua-duanya.'
  } else if (!adaDropdown && !adaManual) {
    ralat.nama_guru = 'Sila pilih nama guru daripada senarai atau masukkan nama secara manual.'
  }

  return ralat
}

export function gabungkanRalat(...ralatList: RalatBorang[]): RalatBorang {
  return ralatList.reduce((acc, r) => ({ ...acc, ...r }), {})
}
