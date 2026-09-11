import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MinitCuraiForm from './pages/MinitCuraiForm'
import LihatRekod from './pages/LihatRekod'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/rekod/baharu" element={<MinitCuraiForm />} />
      <Route path="/rekod/:id/edit" element={<MinitCuraiForm />} />
      <Route path="/rekod/:id" element={<LihatRekod />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
