// frontend/src/pages/Goals.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Plus,
  Trash2,
  Target,
  Calendar as CalendarIcon,
  X,
  Edit2,
  Trophy,
  TrendingUp,
  Clock
} from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'

// API
const API_URL = 'http://localhost:5000/api'

const Goals = ({ currency, openModal }) => {
  const { theme, styles } = useTheme()

  const [goals, setGoals] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const [contributeModal, setContributeModal] = useState(false)
  const [contributeForm, setContributeForm] = useState({ goalId: null, amount: '' })
  const [displayContribute, setDisplayContribute] = useState('')

  const [displayTarget, setDisplayTarget] = useState('')
  const [displaySaved, setDisplaySaved] = useState('')

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    id: null,
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: getToday(),
    priority: 'medium',
    description: '',
    color: '#ec4899'
  })

  // ---------- helpers ----------
  const toNumber = (v) => {
    if (v === null || v === undefined || v === '') return 0
    if (typeof v === 'number') return v
    const cleaned = String(v).replace(/,/g, '')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }

  const buildGoalPayload = (src) => ({
    name: (src?.name ?? '').trim(),
    target_amount: toNumber(src?.target_amount),
    saved_amount: toNumber(src?.saved_amount),
    deadline: src?.deadline || getToday(),
    priority: src?.priority || 'medium',
    description: src?.description || '',
    color: src?.color || '#ec4899'
  })

  // ---------- API ----------
  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API_URL}/goals`, { withCredentials: true })
      setGoals(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setGoals([])
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  // ---------- calculations ----------
  const calculateRequiredSavings = (target, saved, deadline) => {
    const remaining = target - saved
    if (remaining <= 0) return null

    const today = new Date()
    const end = new Date(deadline)
    const timeDiff = end.getTime() - today.getTime()
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))

    if (daysLeft <= 0) return 'overdue'

    return {
      daysLeft,
      daily: remaining / daysLeft,
      weekly: remaining / (daysLeft / 7),
      monthly: remaining / (daysLeft / 30)
    }
  }

  // ---------- handlers ----------
  const openGoalModal = (goal = null) => {
    if (goal) {
      const id = goal.id || goal._id
      const target = goal.target_amount ?? ''
      const saved = goal.saved_amount ?? ''

      setForm({
        id,
        name: goal.name || '',
        target_amount: target === null || target === undefined ? '' : String(target),
        saved_amount: saved === null || saved === undefined ? '' : String(saved),
        deadline: goal.deadline || getToday(),
        priority: goal.priority || 'medium',
        description: goal.description || '',
        color: goal.color || '#ec4899'
      })

      setDisplayTarget(target !== '' ? toNumber(target).toLocaleString('en-IN') : '')
      setDisplaySaved(saved !== '' ? toNumber(saved).toLocaleString('en-IN') : '')
    } else {
      setForm({
        id: null,
        name: '',
        target_amount: '',
        saved_amount: '',
        deadline: getToday(),
        priority: 'medium',
        description: '',
        color: '#ec4899'
      })
      setDisplayTarget('')
      setDisplaySaved('')
    }

    setShowCalendar(false)
    setIsModalOpen(true)
  }

  const handleTargetChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
      setForm({ ...form, target_amount: rawValue })

      if (rawValue !== '') {
        const number = parseFloat(rawValue)
        setDisplayTarget(
          !isNaN(number)
            ? rawValue.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
            (rawValue.includes('.') ? '.' + rawValue.split('.')[1] : '')
            : rawValue
        )
      } else {
        setDisplayTarget('')
      }
    }
  }

  const handleSavedChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
      setForm({ ...form, saved_amount: rawValue })

      if (rawValue !== '') {
        const number = parseFloat(rawValue)
        setDisplaySaved(
          !isNaN(number)
            ? rawValue.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
            (rawValue.includes('.') ? '.' + rawValue.split('.')[1] : '')
            : rawValue
        )
      } else {
        setDisplaySaved('')
      }
    }
  }

  const handleContributeChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
      setContributeForm({ ...contributeForm, amount: rawValue })

      if (rawValue !== '') {
        const number = parseFloat(rawValue)
        setDisplayContribute(
          !isNaN(number)
            ? rawValue.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
            (rawValue.includes('.') ? '.' + rawValue.split('.')[1] : '')
            : rawValue
        )
      } else {
        setDisplayContribute('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const goalId = form.id
      const payload = buildGoalPayload(form)

      if (goalId) {
        await axios.put(`${API_URL}/goals/${goalId}`, payload, { withCredentials: true })
      } else {
        await axios.post(`${API_URL}/goals`, payload, { withCredentials: true })
      }

      setIsModalOpen(false)
      fetchGoals()
    } catch (err) {
      console.error(err)
      if (err?.response?.data) console.error('Backend error:', err.response.data)
      alert(err?.response?.data?.error || 'Failed to save goal')
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    try {
      await axios.delete(`${API_URL}/goals/${id}`, { withCredentials: true })
      fetchGoals()
    } catch (err) {
      console.error(err)
    }
  }

  const openContributeModal = (goalId) => {
    setContributeForm({ goalId, amount: '' })
    setDisplayContribute('')
    setContributeModal(true)
  }

  const handleContribute = async (e) => {
    e.preventDefault()
    try {
      const goal = goals.find((g) => (g.id || g._id) === contributeForm.goalId)
      if (!goal) return

      const newSavedAmount = toNumber(goal.saved_amount) + toNumber(contributeForm.amount)

      const payload = buildGoalPayload({
        ...goal,
        saved_amount: newSavedAmount
      })

      await axios.put(`${API_URL}/goals/${contributeForm.goalId}`, payload, { withCredentials: true })

      setContributeModal(false)
      setContributeForm({ goalId: null, amount: '' })
      setDisplayContribute('')
      fetchGoals()
    } catch (err) {
      console.error(err)
      alert('Failed to add contribution')
    }
  }

  // ---------- styles ----------
  const getCardGradient = (isCompleted, isOverdue) => {
    if (theme === 'dark') {
      if (isCompleted)
        return 'bg-gradient-to-br from-emerald-900/40 via-black to-black border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
      if (isOverdue)
        return 'bg-gradient-to-br from-red-900/40 via-black to-black border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
      return 'bg-gradient-to-br from-pink-900/30 via-black to-black border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.2)]'
    }
    if (isCompleted) return 'bg-emerald-50 border-emerald-300 shadow-lg'
    if (isOverdue) return 'bg-red-50 border-red-300 shadow-lg'
    return 'bg-[#FFF8F0] border-[#C9A87C]/50 shadow-xl'
  }

  const getAddButtonStyle = () => {
    if (theme !== 'dark')
      return 'group flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#C9A87C]/50 rounded-2xl hover:border-[#654321] hover:bg-[#F5F5DC]/30 transition-all duration-300'
    return 'group flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-2xl hover:border-pink-500/50 hover:bg-pink-900/5 transition-all duration-300'
  }

  // ---------- UI ----------
  return (
    <div
      className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}
      onClick={() => setShowCalendar(false)}
    >
      <div className="p-6 flex flex-col gap-8 min-h-min">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2
              className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark'
                  ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                  : 'text-[#4B3621]'
                }`}
            >
              <Target
                size={32}
                className={theme === 'dark' ? 'text-pink-500 drop-shadow-[0_0_15px_#ec4899]' : 'text-[#4B3621]'}
              />
              Dream Targets
            </h2>
            <p className={`text-sm mt-1 ml-1 tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              AI-powered savings projection
            </p>
          </div>

          <button
            onClick={() => openGoalModal()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 border ${theme === 'dark'
                ? 'bg-pink-600 text-white shadow-[0_0_20px_#ec4899] hover:shadow-[0_0_40px_#ec4899] border-pink-400'
                : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30 shadow-lg hover:bg-[#F5F5DC]/80'
              }`}
          >
            <Plus size={20} /> New Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map((goal, index) => {
            const saved = toNumber(goal.saved_amount || 0)
            const target = Math.max(toNumber(goal.target_amount || 1), 1)
            const progress = Math.min((saved / target) * 100, 100)
            const isCompleted = progress >= 100
            const stats = calculateRequiredSavings(target, saved, goal.deadline)
            const isOverdue = stats === 'overdue'

            return (
              <div
                key={goal.id || goal._id || index}
                className={`relative p-6 rounded-2xl border transition-all duration-500 group overflow-hidden flex flex-col ${getCardGradient(
                  isCompleted,
                  isOverdue
                )}`}
              >
                <div
                  className={`absolute -right-6 -top-6 opacity-10 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 pointer-events-none ${isCompleted
                      ? theme === 'dark'
                        ? 'text-emerald-500'
                        : 'text-emerald-600'
                      : theme === 'dark'
                        ? 'text-pink-500'
                        : 'text-[#654321]'
                    }`}
                >
                  {isCompleted ? <Trophy size={140} /> : <Target size={140} />}
                </div>

                <div className="flex justify-between items-start relative z-10 mb-4">
                  <div className="flex-1">
                    <h3
                      className={`font-black text-2xl tracking-tight truncate max-w-[200px] ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'
                        }`}
                      title={goal.name}
                    >
                      {goal.name}
                    </h3>
                    
                    {/* DAYS REMAINING BADGE */}
                    <div className="mt-2">
                      {isCompleted ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          theme === 'dark' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}>
                          <Trophy size={12} />
                          Completed!
                        </span>
                      ) : isOverdue ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          theme === 'dark' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}>
                          <Clock size={12} />
                          Overdue
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          theme === 'dark' 
                            ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                            : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30'
                        }`}>
                          <Clock size={12} />
                          {stats.daysLeft} {stats.daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 p-1 rounded-lg border ${theme === 'dark' ? 'bg-black/60 backdrop-blur-md border-white/10' : 'bg-white border-[#C9A87C]/50'
                      }`}
                  >
                    <button
                      onClick={() => openGoalModal(goal)}
                      className={`p-1.5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#654321] hover:text-[#4B3621]'}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id || goal._id)}
                      className={`p-1.5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-[#654321] hover:text-red-600'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-6 relative z-10">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}>
                      Saved:{' '}
                      <span className={theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}>
                        {currency}{formatIndianNumber(saved)}
                      </span>
                    </span>
                    <span
                      className={
                        isCompleted
                          ? theme === 'dark'
                            ? 'text-emerald-400'
                            : 'text-emerald-700'
                          : theme === 'dark'
                            ? 'text-pink-500'
                            : 'text-[#4B3621]'
                      }
                    >
                      {currency}{formatIndianNumber(target)}
                    </span>
                  </div>

                  <div className={`w-full h-3 rounded-full overflow-hidden border relative ${theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-[#C9A87C]/30'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isCompleted
                          ? theme === 'dark'
                            ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]'
                            : 'bg-emerald-500'
                          : theme === 'dark'
                            ? 'bg-pink-600 shadow-[0_0_15px_#ec4899]'
                            : 'bg-[#654321]'
                        }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Required Savings Pace (Daily/Weekly/Monthly) */}
                {!isCompleted && !isOverdue && stats && (
                  <div className={`mb-4 p-3 rounded-xl border backdrop-blur-sm relative z-10 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-[#C9A87C]/30'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} className={theme === 'dark' ? 'text-pink-500' : 'text-[#654321]'} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                        Required Savings Pace
                      </span>
                    </div>

                    <div className={`grid grid-cols-3 divide-x text-center ${theme === 'dark' ? 'divide-white/10' : 'divide-[#C9A87C]/30'}`}>
                      <div>
                        <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Daily</p>
                        <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                          {currency}{formatIndianNumber(stats.daily)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Weekly</p>
                        <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                          {currency}{formatIndianNumber(stats.weekly)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Monthly</p>
                        <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                          {currency}{formatIndianNumber(stats.monthly)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isCompleted && (
                  <button
                    onClick={() => openContributeModal(goal.id || goal._id)}
                    className={`mt-auto w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 border ${theme === 'dark'
                        ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border-pink-400'
                        : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'
                      }`}
                  >
                    <Plus size={18} /> Contribute
                  </button>
                )}
              </div>
            )
          })}

          <button onClick={() => openGoalModal()} className={getAddButtonStyle()}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition duration-300 ${theme === 'dark' ? 'bg-gray-900 group-hover:scale-110 group-hover:bg-pink-500/10' : 'bg-[#F5F5DC] group-hover:bg-[#F5F5DC]/80 group-hover:scale-105'}`}>
              <Plus size={32} className={`transition ${theme === 'dark' ? 'text-gray-600 group-hover:text-pink-500' : 'text-[#654321] group-hover:text-[#4B3621]'}`} />
            </div>
            <p className={`font-bold uppercase tracking-widest text-xs transition ${theme === 'dark' ? 'text-gray-500 group-hover:text-pink-400' : 'text-[#654321] group-hover:text-[#4B3621]'}`}>
              Create New Goal
            </p>
          </button>
        </div>

        {/* Goal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className={`p-8 rounded-2xl w-full max-w-md relative border ${theme === 'dark' ? 'bg-black border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}>
              <button onClick={() => setIsModalOpen(false)} className={`absolute top-4 right-4 transition p-1 rounded-full ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-[#F5F5DC]'}`}>
                <X size={20} />
              </button>

              <h2 className={`text-2xl font-black mb-8 uppercase tracking-wider flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {form.id ? 'Edit Goal' : 'New Goal'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>Goal Name</label>
                  <input
                    autoFocus
                    type="text"
                    className={`w-full rounded-xl p-3 outline-none transition border font-bold text-base ${theme === 'dark'
                        ? 'bg-black border-pink-500/30 text-white placeholder-gray-700 focus:border-pink-500'
                        : 'bg-white border-[#C9A87C]/50 text-[#4B3621] placeholder-[#654321]/40 focus:border-[#654321]'
                      }`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dream House"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>Target Amount</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`w-full rounded-xl p-3 outline-none transition border font-bold text-lg ${theme === 'dark'
                          ? 'bg-black border-pink-500/30 text-white focus:border-pink-500'
                          : 'bg-white border-[#C9A87C]/50 text-[#4B3621] focus:border-[#654321]'
                        }`}
                      value={displayTarget}
                      onChange={handleTargetChange}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>Saved So Far</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`w-full rounded-xl p-3 outline-none transition border font-bold text-lg ${theme === 'dark'
                          ? 'bg-black border-pink-500/30 text-white focus:border-pink-500'
                          : 'bg-white border-[#C9A87C]/50 text-[#4B3621] focus:border-[#654321]'
                        }`}
                      value={displaySaved}
                      onChange={handleSavedChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>Target Date</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCalendar(!showCalendar)
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 transition text-left border ${theme === 'dark'
                        ? 'bg-black border-pink-500/30 text-white hover:border-pink-500'
                        : 'bg-white border-[#C9A87C]/50 text-[#4B3621] hover:border-[#654321]'
                      }`}
                  >
                    <CalendarIcon size={18} className={theme === 'dark' ? 'text-pink-500' : 'text-[#654321]'} />
                    <span className="font-mono text-base font-bold">{form.deadline}</span>
                  </button>

                  {showCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                      <CustomCalendar
                        selectedDate={form.deadline}
                        onSelect={(date) => {
                          setForm({ ...form, deadline: date })
                          setShowCalendar(false)
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold py-4 rounded-xl mt-4 transition-all duration-300 uppercase tracking-widest border ${theme === 'dark'
                      ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_#ec4899] border-pink-400'
                      : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'
                    }`}
                >
                  {form.id ? 'Update Goal' : 'Create Goal'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Contribute Modal */}
        {contributeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className={`p-8 rounded-2xl w-full max-w-md relative border ${theme === 'dark' ? 'bg-black border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}>
              <button onClick={() => setContributeModal(false)} className={`absolute top-4 right-4 transition p-1 rounded-full ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-[#F5F5DC]'}`}>
                <X size={20} />
              </button>

              <h2 className={`text-2xl font-black mb-2 uppercase tracking-wider flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                Add Contribution
              </h2>

              <form onSubmit={handleContribute} className="space-y-6">
                <div className="group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>Amount to Add</label>
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    className={`w-full rounded-xl p-3 outline-none transition border text-2xl font-bold ${theme === 'dark'
                        ? 'bg-black border-pink-500/30 text-white focus:border-pink-500'
                        : 'bg-white border-[#C9A87C]/50 text-[#4B3621] focus:border-[#654321]'
                      }`}
                    value={displayContribute}
                    onChange={handleContributeChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold py-4 rounded-xl transition-all duration-300 uppercase tracking-widest border ${theme === 'dark'
                      ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_#ec4899] border-pink-400'
                      : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'
                    }`}
                >
                  Add Contribution
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Goals
