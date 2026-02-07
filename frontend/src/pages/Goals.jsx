import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Target, Calendar as CalendarIcon, X, Edit2, Trophy, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' 
import { useTheme } from '../context/ThemeContext' 

// Central API URL
const API_URL = 'http://127.0.0.1:5001/api';

const Goals = ({ currency, openModal }) => { 
  const { theme, styles } = useTheme() 

  const [goals, setGoals] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    id: null,
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: getToday(), 
    color: '#ec4899' 
  })

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API_URL}/goals`)
      setGoals(Array.isArray(res.data) ? res.data : [])
    } catch (err) { 
      console.error("Failed to fetch goals:", err)
      setGoals([]) 
    }
  }

  useEffect(() => { fetchGoals() }, [])

  // --- SMART CALCULATIONS ---
  const calculateRequiredSavings = (target, saved, deadline) => {
      const remaining = target - saved;
      if (remaining <= 0) return null; // Goal reached

      const today = new Date();
      const end = new Date(deadline);
      const timeDiff = end.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysLeft <= 0) return 'overdue';

      return {
          daysLeft,
          daily: remaining / daysLeft,
          weekly: remaining / (daysLeft / 7),
          monthly: remaining / (daysLeft / 30)
      };
  }

  // --- HANDLERS ---
  const openGoalModal = (goal = null) => {
    if (goal) {
      setForm({ ...goal, id: goal.id || goal._id })
    } else {
      setForm({ id: null, name: '', target_amount: '', saved_amount: '', deadline: getToday(), color: '#ec4899' })
    }
    setShowCalendar(false) 
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const goalId = form.id || form._id; 
      if (goalId) await axios.put(`${API_URL}/goals/${goalId}`, form)
      else await axios.post(`${API_URL}/goals`, form)
      setIsModalOpen(false)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if(!id) return;
    try {
      await axios.delete(`${API_URL}/goals/${id}`)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  // --- DYNAMIC STYLES ---
  const getCardGradient = (isCompleted, isOverdue) => {
      if (theme === 'neon') {
          if (isCompleted) return "bg-gradient-to-br from-emerald-900/40 via-black to-black border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          if (isOverdue) return "bg-gradient-to-br from-red-900/40 via-black to-black border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          return "bg-gradient-to-br from-pink-900/30 via-black to-black border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.2)]"
      }
      return "bg-[#1a1b26]/80 backdrop-blur-xl border-white/5 shadow-xl hover:bg-[#1f2937]/80"
  }

  // --- RESTORED MISSING FUNCTION ---
  const getAddButtonStyle = () => {
      if (theme !== 'neon') return "group flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all duration-300"
      return "group flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-2xl hover:border-pink-500/50 hover:bg-pink-900/5 transition-all duration-300"
  }

  return (
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`} onClick={() => setShowCalendar(false)}>
      <div className="p-6 flex flex-col gap-8 min-h-min">
      
      {/* HEADER */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className={`text-3xl font-bold text-white flex items-center gap-3 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
             <Target size={32} className={theme === 'neon' ? "text-pink-500 drop-shadow-[0_0_15px_#ec4899]" : "text-pink-500"} /> 
             Dream Targets
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-1 tracking-wide">AI-powered savings projection</p>
        </div>
        <button 
          onClick={() => openGoalModal()} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${theme === 'neon' ? 'bg-pink-600 text-white shadow-[0_0_20px_#ec4899] hover:shadow-[0_0_40px_#ec4899] border border-pink-400' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg'}`}
        >
          <Plus size={20} /> New Goal
        </button>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map((goal, index) => { 
          const saved = parseFloat(goal.saved_amount || 0)
          const target = parseFloat(goal.target_amount || 1)
          const progress = Math.min((saved / target) * 100, 100)
          const isCompleted = progress >= 100
          
          // Smart Calculations
          const stats = calculateRequiredSavings(target, saved, goal.deadline)
          const isOverdue = stats === 'overdue'

          return (
            <div key={goal.id || goal._id || index} className={`relative p-6 rounded-2xl border transition-all duration-500 group overflow-hidden flex flex-col ${getCardGradient(isCompleted, isOverdue)}`}>
              
              {/* Background Glow Icon */}
              <div className={`absolute -right-6 -top-6 opacity-10 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 pointer-events-none ${isCompleted ? 'text-emerald-500' : 'text-pink-500'}`}>
                  {isCompleted ? <Trophy size={140} /> : <Target size={140} />}
              </div>

              {/* Header Row */}
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {!isCompleted && !isOverdue && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-black/50 border-pink-500/50 text-pink-400">
                                <Clock size={10} /> {stats?.daysLeft} Days Left
                            </span>
                        )}
                        {isCompleted && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-900/50 border-emerald-500 text-emerald-400">Goal Achieved</span>}
                        {isOverdue && !isCompleted && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-red-900/50 border-red-500 text-red-400">Overdue</span>}
                    </div>
                    <h3 className="font-black text-2xl text-white tracking-tight truncate max-w-[200px]" title={goal.name}>{goal.name}</h3>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10">
                    <button onClick={() => openGoalModal(goal)} className="p-1.5 text-gray-400 hover:text-white transition"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(goal.id || goal._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={14}/></button>
                </div>
              </div>

              {/* Progress Circle & Stats */}
              <div className="mb-6 relative z-10">
                  <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-400">Saved: <span className="text-white">{currency}{saved.toLocaleString()}</span></span>
                      <span className={isCompleted ? "text-emerald-400" : "text-pink-500"}>{currency}{target.toLocaleString()}</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden border relative ${theme === 'neon' ? 'bg-gray-900 border-white/10' : 'bg-white/5'}`}>
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isCompleted ? "bg-emerald-500 shadow-[0_0_15px_#10b981]" : "bg-pink-600 shadow-[0_0_15px_#ec4899]"}`}
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-right text-[10px] font-bold mt-1 text-gray-500">{progress.toFixed(0)}% Completed</p>
              </div>

              {/* SMART RECOMMENDATION GRID */}
              {!isCompleted && !isOverdue && stats && (
                  <div className="mt-auto p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                          <TrendingUp size={14} className="text-pink-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Required Savings Pace</span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Daily</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.daily.toFixed(0)}</p>
                          </div>
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Weekly</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.weekly.toFixed(0)}</p>
                          </div>
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Monthly</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.monthly.toFixed(0)}</p>
                          </div>
                      </div>
                  </div>
              )}

              {/* Completed State */}
              {isCompleted && (
                  <div className="mt-auto p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20 flex items-center justify-center gap-3 relative z-10">
                      <Trophy size={20} className="text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-100">Congratulations!</span>
                  </div>
              )}

              {/* Overdue State */}
              {isOverdue && !isCompleted && (
                  <div className="mt-auto p-4 rounded-xl bg-red-900/20 border border-red-500/20 flex items-center justify-center gap-3 relative z-10">
                      <AlertCircle size={20} className="text-red-400" />
                      <span className="text-sm font-bold text-red-100">Deadline Missed</span>
                  </div>
              )}

            </div>
          )
        })}

        {/* CREATE NEW CARD */}
        <button 
            onClick={() => openGoalModal()}
            className={getAddButtonStyle()}
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition duration-300 ${theme === 'neon' ? 'bg-gray-900 group-hover:scale-110 group-hover:bg-pink-500/10 group-hover:shadow-[0_0_20px_#ec4899]' : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'}`}>
                <Plus size={32} className={`text-gray-600 transition ${theme === 'neon' ? 'group-hover:text-pink-500' : 'group-hover:text-white'}`} />
            </div>
            <p className={`font-bold uppercase tracking-widest text-xs transition ${theme === 'neon' ? 'text-gray-500 group-hover:text-pink-400' : 'text-gray-500 group-hover:text-white'}`}>Create New Goal</p>
        </button>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className={`p-8 rounded-2xl w-full max-w-md relative ${theme === 'neon' ? 'bg-black border border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.4)]' : 'bg-[#1a1b26]/95 backdrop-blur-2xl border border-white/10 shadow-2xl'}`}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
              <X size={20}/>
            </button>
            <h2 className="text-2xl font-black mb-8 text-white uppercase tracking-wider flex items-center gap-3">
                <span className={`w-1.5 h-8 block ${theme === 'neon' ? 'bg-pink-500 shadow-[0_0_15px_#ec4899]' : 'bg-pink-500'}`}></span>
                {form.id ? 'Edit Goal' : 'New Goal'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Goal Name</label>
                <input autoFocus type="text" className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500' : 'bg-white/5 border border-white/10'}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Dream House" required />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Target Amount</label>
                  <input type="number" className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500' : 'bg-white/5 border border-white/10'}`} value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} placeholder="0.00" required />
                </div>
                <div className="group">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Saved So Far</label>
                  <input type="number" className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500' : 'bg-white/5 border border-white/10'}`} value={form.saved_amount} onChange={e => setForm({...form, saved_amount: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div className="relative group">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Target Date</label>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar) }} className={`w-full flex items-center gap-3 rounded-xl p-3 text-white transition text-left ${theme === 'neon' ? 'bg-black border border-pink-500/30 hover:border-pink-500' : 'bg-white/5 border border-white/10'}`}>
                      <CalendarIcon size={16} className="text-pink-500"/>
                      <span className="font-mono text-sm">{form.deadline}</span>
                  </button>
                  {showCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                        <CustomCalendar selectedDate={form.deadline} onSelect={(date) => setForm({...form, deadline: date})} onClose={() => setShowCalendar(false)} />
                    </div>
                  )}
              </div>

              <button className={`w-full font-bold py-4 rounded-xl mt-4 transition-all duration-300 uppercase tracking-widest ${theme === 'neon' ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_#ec4899]' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg'}`}>
                {form.id ? 'Update Goal' : 'Create Goal'}
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