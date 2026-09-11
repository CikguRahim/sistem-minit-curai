import React, { useRef, useState } from 'react'

export interface GambarItem {
  id: string
  file?: File
  previewUrl: string
  caption: string
  existingUrl?: string
  storagePath?: string
}

interface Props {
  items: GambarItem[]
  onChange: (items: GambarItem[]) => void
  maxItems?: number
  maxSizeMb?: number
}

const FORMAT_DIBENARKAN = ['image/jpeg', 'image/jpg', 'image/png']

const ImageUploadField: React.FC<Props> = ({ items, onChange, maxItems = 2, maxSizeMb = 5 }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [ralat, setRalat] = useState<string | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setRalat(null)

    const baki = maxItems - items.length
    if (baki <= 0) {
      setRalat(`Maksimum ${maxItems} gambar dibenarkan.`)
      return
    }

    const failDipilih = Array.from(files).slice(0, baki)
    const itemBaharu: GambarItem[] = []

    for (const file of failDipilih) {
      if (!FORMAT_DIBENARKAN.includes(file.type)) {
        setRalat('Hanya format JPG, JPEG dan PNG dibenarkan.')
        continue
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setRalat(`Saiz gambar tidak boleh melebihi ${maxSizeMb}MB.`)
        continue
      }
      itemBaharu.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: ''
      })
    }

    onChange([...items, ...itemBaharu])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(items.map((it) => (it.id === id ? { ...it, caption } : it)))
  }

  const handleRemove = (id: string) => {
    onChange(items.filter((it) => it.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-3">
        {items.map((item) => (
          <div key={item.id} className="w-40 card p-2">
            <img
              src={item.existingUrl || item.previewUrl}
              alt={item.caption || 'Dokumentasi'}
              className="w-full h-28 object-cover rounded-md border border-slate-200"
            />
            <input
              type="text"
              placeholder="Kapsyen gambar"
              value={item.caption}
              onChange={(e) => handleCaptionChange(item.id, e.target.value)}
              className="form-input mt-2 text-xs px-2 py-1"
            />
            <div className="flex justify-between mt-2">
              <label className="text-xs text-navy-700 underline cursor-pointer no-print">
                Ganti
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (!FORMAT_DIBENARKAN.includes(file.type)) {
                      setRalat('Hanya format JPG, JPEG dan PNG dibenarkan.')
                      return
                    }
                    if (file.size > maxSizeMb * 1024 * 1024) {
                      setRalat(`Saiz gambar tidak boleh melebihi ${maxSizeMb}MB.`)
                      return
                    }
                    onChange(
                      items.map((it) =>
                        it.id === item.id
                          ? { ...it, file, previewUrl: URL.createObjectURL(file), existingUrl: undefined }
                          : it
                      )
                    )
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="text-xs text-red-600 underline no-print"
              >
                Padam
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <div className="no-print">
          <label className="btn-outline cursor-pointer inline-flex">
            Muat Naik Gambar ({items.length}/{maxItems})
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Format JPG, JPEG, PNG. Saiz maksimum {maxSizeMb}MB setiap gambar.
          </p>
        </div>
      )}

      {ralat && <p className="error-text">{ralat}</p>}
    </div>
  )
}

export default ImageUploadField
