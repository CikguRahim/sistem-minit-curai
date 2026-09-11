import React from 'react'

const LOGO_KPM = 'https://i.postimg.cc/4NPGCNRL/LOGO-KPM-NO-BG.png'
const LOGO_SKTJ = 'https://i.postimg.cc/26jkq6B8/LOGO-SKTJ-3D-REAL.png'

interface Props {
  compact?: boolean
}

const HeaderRasmi: React.FC<Props> = ({ compact = false }) => {
  return (
    <div className={`flex items-center justify-between gap-4 ${compact ? 'py-2' : 'py-4'}`}>
      <img
        src={LOGO_KPM}
        alt="Logo Kementerian Pendidikan Malaysia"
        className={`${compact ? 'h-10' : 'h-16'} w-auto object-contain shrink-0`}
      />
      <div className="text-center flex-1 px-2">
        <h1 className="font-extrabold text-navy-800 leading-tight text-base sm:text-xl tracking-wide">
          SISTEM MINIT CURAI KURSUS GURU
        </h1>
        <p className="text-navy-600 font-semibold text-xs sm:text-sm mt-0.5">
          SEKOLAH KEBANGSAAN TAMAN JASMIN
        </p>
      </div>
      <img
        src={LOGO_SKTJ}
        alt="Logo SK Taman Jasmin"
        className={`${compact ? 'h-10' : 'h-16'} w-auto object-contain shrink-0`}
      />
    </div>
  )
}

export default HeaderRasmi
