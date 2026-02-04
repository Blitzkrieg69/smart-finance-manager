import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Target, Calendar as CalendarIcon, X, Edit2, Trophy } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' 
import { useTheme } from '../context/ThemeContext' 

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
      const res = await axios.get('http://127.0.0.1:5000/api/goals')
      setGoals(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (form.id) await axios.put(`http://127.0.0.1:5000/api/goals/${form.id}`, form)
      else await axios.post('http://127.0.0.1:5000/api/goals', form)
      setIsModalOpen(false)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/goals/${id}`)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  const openGoalModal = (goal = null) => {
    if (goal) {
      setForm(goal)
    } else {
      setForm({ id: null, name: '', target_amount: '', saved_amount: '', deadline: getToday(), color: '#ec4899' })
    }
    setShowCalendar(false) 
    setIsModalOpen(true)
  }

  // --- DYNAMIC STYLES ---
  
  // 1. CARD STYLE
  const getGoalCardStyle = (isCompleted) => {
      // GLASS MODE (Premium Frosted Look)
      if (theme !== 'neon') {
          return "bg-[#1a1b26]/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl hover:bg-white/5 transition-all duration-300 relative group flex flex-col hover:border-white/10"
      }

      // NEON MODE (Radioactive Glow)
      const base = "bg-black border rounded-2xl p-6 relative group transition-all duration-500 overflow-hidden"
      if (isCompleted) {
          return `${base} border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-400`
      }
      return `${base} border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:border-pink-400 hover:shadow-[0_0_50px_rgba(236,72,153,0.4)]`
  }

  // 2. ICON CONTAINER STYLE
  const getIconStyle = (isCompleted) => {
      const base = "w-14 h-14 rounded-2xl flex items-center justify-center transition duration-500"
      
      // GLASS
      if (theme !== 'neon') {
          if (isCompleted) return `${base} bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`
          return `${base} bg-pink-500/10 text-pink-500 border border-pink-500/20`
      }

      // NEON
      if (isCompleted) return `${base} bg-emerald-500/10 border border-emerald-500 text-emerald-500 shadow-[0_0_20px_#10b981]`
      return `${base} bg-pink-500/10 border border-pink-500 text-pink-500 shadow-[0_0_20px_#ec4899]`
  }

  // 3. PROGRESS BAR STYLE
  const getProgressBarStyle = (isCompleted) => {
      if (theme !== 'neon') {
          return isCompleted ? "bg-emerald-500" : "bg-pink-500"
      }
      return isCompleted 
        ? "bg-emerald-500 shadow-[0_0_20px_#10b981]" 
        : "bg-pink-600 shadow-[0_0_20px_#ec4899]"
  }

  // 4. ADD BUTTON STYLE
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
             Financial Goals
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-1 tracking-wide">Target your dreams</p>
        </div>
        <button 
          onClick={() => openGoalModal()} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${theme === 'neon' ? 'bg-pink-600 text-white shadow-[0_0_20px_#ec4899] hover:shadow-[0_0_40px_#ec4899] border border-pink-400' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/20'}`}
        >
          <Plus size={20} /> New Goal
        </button>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map(goal => {
          const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
          const isCompleted = progress >= 100
          
          return (
            <div key={goal.id} className={getGoalCardStyle(isCompleted)}>
              
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button 
                    onClick={() => openGoalModal(goal)}
                    className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-white/20 text-gray-400 hover:text-white hover:border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'}`}
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    onClick={() => handleDelete(goal.id)}
                    className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-red-500/30 text-red-500 hover:text-red-400 hover:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/10 text-gray-300 hover:text-red-400 hover:bg-white/20'}`}
                >
                    <Trash2 size={14} />
                </button>
              </div>

              {/* Goal Header */}
              <div className="flex items-center gap-4 mb-6 relative">
                <div className={getIconStyle(isCompleted)}>
                   {isCompleted ? <Trophy size={28} className={theme === 'neon' ? "drop-shadow-[0_0_10px_currentColor]" : ""} /> : <Target size={28} className={theme === 'neon' ? "drop-shadow-[0_0_10px_currentColor]" : ""} />}
                </div>
                <div>
                  <h3 className={`font-black text-xl text-white tracking-tight ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`}>{goal.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Deadline: {goal.deadline}</p>
                </div>
              </div>

              {/* Amount Stats */}
              <div className="mb-3 flex justify-between items-end">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Saved</p>
                    <span className={`text-2xl font-black ${isCompleted ? (theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-emerald-400') : (theme === 'neon' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-white')}`}>
                        {currency}{goal.saved_amount.toLocaleString()}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Target</p>
                    <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-500' : (theme === 'neon' ? 'text-pink-500 drop-shadow-[0_0_5px_#ec4899]' : 'text-pink-500')}`}>
                        {currency}{goal.target_amount.toLocaleString()}
                    </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-3 rounded-full overflow-hidden relative ${theme === 'neon' ? 'bg-gray-900 border border-white/10' : 'bg-white/5'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${getProgressBarStyle(isCompleted)}`}
                  style={{ width: `${progress}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className={`text-right text-[10px] font-bold mt-2 ${isCompleted ? 'text-emerald-500' : 'text-pink-500'}`}>{progress.toFixed(0)}% Complete</p>
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
            <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
            >
              <X size={20}/>
            </button>
            <h2 className="text-2xl font-black mb-8 text-white uppercase tracking-wider flex items-center gap-3">
                <span className={`w-1.5 h-8 block ${theme === 'neon' ? 'bg-pink-500 shadow-[0_0_15px_#ec4899]' : 'bg-pink-500'}`}></span>
                {form.id ? 'Edit Goal' : 'New Goal'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block transition ${theme === 'neon' ? 'text-pink-500 group-focus-within:text-pink-400' : 'text-gray-400'}`}>Goal Name</label>
                <input 
                  autoFocus
                  type="text" 
                  className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10'}`}
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. Dream House" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block transition ${theme === 'neon' ? 'text-gray-500 group-focus-within:text-pink-500' : 'text-gray-400'}`}>Target Amount</label>
                  <input 
                    type="number" 
                    className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10'}`}
                    value={form.target_amount} 
                    onChange={e => setForm({...form, target_amount: e.target.value})} 
                    placeholder="0.00" 
                    required
                  />
                </div>
                <div className="group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block transition ${theme === 'neon' ? 'text-gray-500 group-focus-within:text-pink-500' : 'text-gray-400'}`}>Saved So Far</label>
                  <input 
                    type="number" 
                    className={`w-full rounded-xl p-3 text-white outline-none transition placeholder-gray-700 ${theme === 'neon' ? 'bg-black border border-pink-500/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10'}`}
                    value={form.saved_amount} 
                    onChange={e => setForm({...form, saved_amount: e.target.value})} 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="relative group">
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 block transition ${theme === 'neon' ? 'text-gray-500 group-focus-within:text-pink-500' : 'text-gray-400'}`}>Target Date</label>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar) }} 
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-white transition text-left ${theme === 'neon' ? 'bg-black border border-pink-500/30 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                  >
                      <CalendarIcon size={16} className={theme === 'neon' ? "text-pink-500" : "text-gray-400"}/>
                      <span className="font-mono text-sm">{form.deadline}</span>
                  </button>
                  
                  {showCalendar && (
                    <CustomCalendar 
                      selectedDate={form.deadline} 
                      onSelect={(date) => setForm({...form, deadline: date})} 
                      onClose={() => setShowCalendar(false)} 
                    />
                  )}
              </div>

              <button className={`w-full font-bold py-4 rounded-xl mt-4 transition-all duration-300 uppercase tracking-widest ${theme === 'neon' ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_#ec4899] hover:shadow-[0_0_35px_#ec4899] hover:scale-[1.02]' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg'}`}>
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