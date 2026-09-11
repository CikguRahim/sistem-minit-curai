import React, { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'

interface Props {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
}

const TandatanganInput: React.FC<Props> = ({ label, value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const padRef = useRef<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(!value)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const ctx = canvas.getContext('2d')
      ctx?.scale(ratio, ratio)
      padRef.current?.clear()
      if (value) {
        padRef.current?.fromDataURL(value)
      }
    }

    padRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(15,23,42)'
    })

    padRef.current.addEventListener('endStroke', () => {
      if (padRef.current) {
        setIsEmpty(padRef.current.isEmpty())
        onChange(padRef.current.isEmpty() ? null : padRef.current.toDataURL('image/png'))
      }
    })

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClear = () => {
    padRef.current?.clear()
    setIsEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <p className="form-label">{label}</p>
      <div className="rounded-md border border-slate-300 bg-white overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-40 touch-none cursor-crosshair" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">
          {isEmpty ? 'Belum ditandatangani' : 'Tandatangan telah direkodkan'}
        </span>
        <button type="button" onClick={handleClear} className="btn-secondary py-1 px-3 text-xs no-print">
          Padam &amp; Tandatangan Semula
        </button>
      </div>
    </div>
  )
}

export default TandatanganInput
