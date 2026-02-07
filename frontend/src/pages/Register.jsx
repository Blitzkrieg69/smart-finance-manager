import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ArrowRight, Activity } from 'lucide-react'

// Centralized API URL
const API_URL = 'http://localhost:5001/api/auth/register';

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post(API_URL, {
        name,
        email,
        password
      })
      // Optional: Auto-login logic could go here
      alert('Registration Successful! Please Login.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* --- ANIMATED BACKGROUND BLOBS --- */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* --- GLASS CARD --- */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ring-1 ring-white/5">
        
        {/* LOGO HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-sm mt-2">Start your financial journey today</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* NAME INPUT */}
          <div className="group">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block group-focus-within:text-cyan-400 transition-colors">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full bg-[#1a1b26] border border-white/5 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* EMAIL INPUT */}
          <div className="group">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block group-focus-within:text-cyan-400 transition-colors">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                autoComplete="email"
                placeholder="name@example.com" 
                className="w-full bg-[#1a1b26] border border-white/5 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="group">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block group-focus-within:text-cyan-400 transition-colors">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                autoComplete="new-password"
                placeholder="••••••••" 
                className="w-full bg-[#1a1b26] border border-white/5 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>Sign Up <ArrowRight size={18} /></>
            )}
          </button>

        </form>

        {/* FOOTER */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register