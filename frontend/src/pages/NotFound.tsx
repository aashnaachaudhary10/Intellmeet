import { useNavigate } from 'react-router-dom'
import { Bot, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-3xl mb-6">
          <Bot size={40} className="text-slate-500" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-3">404</h1>
        <p className="text-slate-400 text-lg mb-8">Oops! This page doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          <Home size={18} /> Back to Dashboard
        </button>
      </div>
    </div>
  )
}
