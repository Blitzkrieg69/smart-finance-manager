import { useState } from 'react'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react'
import axios from 'axios'

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await axios.post(`http://127.0.0.1:5001${endpoint}`, formData, {
        withCredentials: true
      })

      if (response.data.user) {
        onLoginSuccess(response.data.user)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#0b0c15] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <span className="font-bold text-white text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Finance<span className="text-blue-500">AI</span>
          </h1>
          <p className="text-gray-500 mt-2">Smart Personal Finance Manager</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#12131e] rounded-2xl border border-gray-800 p-8 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-[#0b0c15] rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                !isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                'Please wait...'
              ) : isLogin ? (
                <>
                  <LogIn size={18} />
                  Login
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Test Credentials */}
          {isLogin && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 font-medium">Test Credentials:</p>
              <p className="text-xs text-gray-400 mt-1">
                Email: <span className="text-white">test@test.com</span>
              </p>
              <p className="text-xs text-gray-400">
                Password: <span className="text-white">password</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login