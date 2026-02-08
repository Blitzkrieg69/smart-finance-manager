import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Target, Calendar as CalendarIcon, X } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'

const API_URL = 'http://127.0.0.1:5000/api';

const GoalModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [displayTarget, setDisplayTarget] = useState('')
  const [displaySaved, setDisplaySaved] = useState('')

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    id: null,
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: getToday(), 
    color: '#ec4899' 
  })

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            const target = initialData.target_amount ?? '';
            const saved = initialData.saved_amount ?? '';
            
            setForm({
                id: initialData.id || initialData._id,
                name: initialData.name || '',
                target_amount: target,
                saved_amount: saved,
                deadline: initialData.deadline || getToday(),
                color: initialData.color || '#ec4899'
            })
            
            // Format initial values
            setDisplayTarget(target !== '' ? parseFloat(target).toLocaleString('en-IN') : '')
            setDisplaySaved(saved !== '' ? parseFloat(saved).toLocaleString('en-IN') : '')
        } else {
            setForm({ 
                id: null, 
                name: '', 
                target_amount: '', 
                saved_amount: '', 
                deadline: getToday(), 
                color: '#ec4899' 
            })
            setDisplayTarget('')
            setDisplaySaved('')
        }
    }
  }, [initialData, isOpen])

  const handleTargetChange = (e) => {
    // Remove existing commas to get raw number string
    const rawValue = e.target.value.replace(/,/g, '');
    
    // Validate: allow empty or decimal number
    if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
      setForm({...form, target_amount: rawValue})
      
      if (rawValue !== '') {
        const number = parseFloat(rawValue);
        if (!isNaN(number)) {
             // Split decimal part to preserve trailing .0 or .00 user might be typing
            const parts = rawValue.split('.');
            parts[0] = parseFloat(parts[0]).toLocaleString('en-IN');
            setDisplayTarget(parts.join('.'));
        } else {
            setDisplayTarget(rawValue);
        }
      } else {
        setDisplayTarget('');
      }
    }
  }

  const handleSavedChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    
    if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
      setForm({...form, saved_amount: rawValue})
      
      if (rawValue !== '') {
        const number = parseFloat(rawValue);
        if (!isNaN(number)) {
            const parts = rawValue.split('.');
            parts[0] = parseFloat(parts[0]).toLocaleString('en-IN');
            setDisplaySaved(parts.join('.'));
        } else {
            setDisplaySaved(rawValue);
        }
      } else {
        setDisplaySaved('');
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const recordId = form.id; 

    try {
        if (recordId) await axios.put(`${API_URL}/goals/${recordId}`, form)
        else await axios.post(`${API_URL}/goals`, form)
        
        onSuccess() 
        onClose()
    } catch(e) { 
        console.error("Submission Error:", e)
        alert("Failed to save goal.") 
    } finally {
        setLoading(false)
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-2xl border relative overflow-hidden ${theme === 'dark' ? 'bg-black border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? 'bg-gradient-to-r from-pink-900/20 to-transparent border-pink-500/20' : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme === 'dark' ? 'bg-pink-500/10 border-pink-500/30' : 'bg-[#F5F5DC] border-[#654321]/30'}`}>
              <Target size={20} className={theme === 'dark' ? 'text-pink-400' : 'text-[#4B3621]'} />
            </div>
            <div>
              <h2 className={`text-xl font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {form.id ? 'Edit' : 'New'} Goal
              </h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                {form.id ? 'Update dream target' : 'Set your dream target'}
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* NAME */}
            <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Goal Name
                </label>
                <input 
                    type="text" 
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition font-bold text-base ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-pink-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g. Dream House, New Car..." 
                    required 
                    autoFocus
                />
            </div>

            {/* AMOUNTS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Target Amount
                    </label>
                    <div className="relative">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/50'}`}>₹</div>
                        <input 
                            type="text"
                            inputMode="decimal"
                            className={`w-full pl-8 pr-4 py-3 rounded-xl border outline-none transition font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-pink-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                            value={displayTarget} 
                            onChange={handleTargetChange} 
                            placeholder="0.00" 
                            required 
                        />
                    </div>
                </div>

                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Saved So Far
                    </label>
                    <div className="relative">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/50'}`}>₹</div>
                        <input 
                            type="text"
                            inputMode="decimal"
                            className={`w-full pl-8 pr-4 py-3 rounded-xl border outline-none transition font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-pink-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                            value={displaySaved} 
                            onChange={handleSavedChange} 
                            placeholder="0.00" 
                        />
                    </div>
                </div>
            </div>

            {/* DEADLINE */}
            <div className="relative">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Target Date
                </label>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setActiveCalendar(!activeCalendar); }} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-pink-500/50 text-white' : 'bg-white border-[#C9A87C]/50 hover:border-[#654321] text-[#4B3621]'}`}
                >
                    <CalendarIcon size={18} className={theme === 'dark' ? 'text-pink-400' : 'text-[#654321]'}/>
                    <span className="font-mono text-base font-bold">{form.deadline}</span>
                </button>
                {activeCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                        <CustomCalendar 
                          selectedDate={form.deadline} 
                          onSelect={(date) => { setForm({...form, deadline: date}); setActiveCalendar(false); }} 
                          onClose={() => setActiveCalendar(false)} 
                        />
                    </div>
                )}
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] border-pink-400' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'}`}
            >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Save size={18}/> 
                    {form.id ? 'Update Goal' : 'Create Goal'}
                  </>
                )}
            </button>
        </form>
      </div>
    </div>
  )
}

export default GoalModal
