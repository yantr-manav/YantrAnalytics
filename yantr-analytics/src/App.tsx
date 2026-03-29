import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Analysis from './pages/Analysis'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze/:handle" element={<Analysis />} />
      </Routes>
    </div>
  )
}
