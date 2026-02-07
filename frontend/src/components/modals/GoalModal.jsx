import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Target, Calendar as CalendarIcon, DollarSign } from 'lucide-react'
import ModalWrapper from './ModalWrapper'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'

// Central API URL
const API_URL = 'http://127.0.0.1:5001/api';

const GoalModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(false)
  const [loading, setLoading] = useState(false)

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    id: null,
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: getToday(), 
    color: '#ec4899' 
  })

  // Load Data for Editing
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setForm({
                id: initialData.id || initialData._id,
                name: initialData.name || '',
                target_amount: initialData.target_amount || '',
                saved_amount: initialData.saved_amount || '',
                deadline: initialData.deadline || getToday(),
                color: initialData.color || '#ec4899'
            })
        } else {
            // Reset for New Goal
            setForm({ 
                id: null, 
                name: '', 
                target_amount: '', 
                saved_amount: '', 
                deadline: getToday(), 
                color: '#ec4899' 
            })
        }
    }
  }, [initialData, isOpen])

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

  // Styles
  const inputClass = `w-full p-3 rounded-xl border outline-none transition font-bold ${
    theme === 'neon' 
      ? 'bg-black border-white/20 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] text-white' 
      : 'bg-white/5 border-white/10 focus:bg-white/10 text-white'
  }`
  
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-pink-500 transition-colors"

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={form.id ? 'Edit Goal' : 'New Goal'}>
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ICON HEADER */}
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'neon' ? 'bg-black border border-pink-500 shadow-[0_0_20px_#ec4899]' : 'bg-white/10'}`}>
                    <Target size={32} className="text-pink-500" />
                </div>
            </div>

            {/* NAME */}
            <div className="group">
                <label className={labelClass}>Goal Name</label>
                <input 
                    type="text" 
                    className={inputClass} 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g. Dream House, New Laptop..." 
                    required 
                    autoFocus
                />
            </div>

            {/* AMOUNTS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className={labelClass}>Target Amount</label>
                    <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-4 text-gray-500"/>
                        <input 
                            type="number" 
                            className={`${inputClass} pl-8`} 
                            value={form.target_amount} 
                            onChange={e => setForm({...form, target_amount: e.target.value})} 
                            placeholder="0.00" 
                            required 
                        />
                    </div>
                </div>

                <div className="group">
                    <label className={labelClass}>Saved So Far</label>
                    <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-4 text-gray-500"/>
                        <input 
                            type="number" 
                            className={`${inputClass} pl-8`} 
                            value={form.saved_amount} 
                            onChange={e => setForm({...form, saved_amount: e.target.value})} 
                            placeholder="0.00" 
                        />
                    </div>
                </div>
            </div>

            {/* DEADLINE */}
            <div className="relative group">
                <label className={labelClass}>Target Date</label>
                <button type="button" onClick={() => setActiveCalendar(!activeCalendar)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${theme === 'neon' ? 'bg-black border-white/20 text-white' : 'bg-white/5 border-white/10 text-white'}`}>
                    <CalendarIcon size={16} className="text-pink-500"/>
                    <span className="font-medium text-sm">{form.deadline}</span>
                </button>
                {activeCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                        <CustomCalendar selectedDate={form.deadline} onSelect={(date) => setForm({...form, deadline: date})} onClose={() => setActiveCalendar(false)} />
                    </div>
                )}
            </div>

            {/* SUBMIT */}
            <button disabled={loading} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${theme === 'neon' ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_#ec4899]' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg'}`}>
                {loading ? <span className="animate-spin">⌛</span> : <><Save size={18}/> {form.id ? 'Update Goal' : 'Create Goal'}</>}
            </button>
        </form>
    </ModalWrapper>
  )
}

export default GoalModal