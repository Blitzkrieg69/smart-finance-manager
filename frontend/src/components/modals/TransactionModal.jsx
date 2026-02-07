import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Calendar as CalendarIcon, DollarSign } from 'lucide-react'
import ModalWrapper from './ModalWrapper'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'

const API_URL = 'http://127.0.0.1:5001/api';

const TransactionModal = ({ isOpen, onClose, type, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(false)
  const [loading, setLoading] = useState(false)

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({ 
    id: null, 
    amount: '', 
    category: '', 
    description: '', 
    date: getToday(), 
    recurrence: 'None',
    type: type // 'income' or 'expense'
  })

  const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Sold Items", "Rental Income", "Other"]

  // Load Data for Editing
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setForm({ 
                ...initialData, 
                id: initialData.id || initialData._id, // Map MongoDB _id
                description: initialData.title || initialData.description || '',
                date: initialData.date || getToday()
            })
        } else {
            // Reset for New Entry
            setForm({ 
                id: null, 
                amount: '', 
                category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0], 
                description: '', 
                date: getToday(), 
                recurrence: 'None',
                type: type 
            })
        }
    }
  }, [initialData, type, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const recordId = form.id; 

    try {
        const payload = { 
            amount: form.amount,
            category: form.category,
            description: form.description || "Untitled",
            date: form.date,
            recurrence: form.recurrence,
            type: type 
        }

        if (recordId) await axios.put(`${API_URL}/transactions/${recordId}`, payload)
        else await axios.post(`${API_URL}/transactions`, payload)
        
        onSuccess() 
        onClose()
    } catch(e) { 
        console.error("Submission Error:", e)
        alert("Failed to save transaction.") 
    } finally {
        setLoading(false)
    }
  }

  // Styles
  const inputClass = `w-full p-3 rounded-xl border outline-none transition font-bold ${
    theme === 'neon' 
      ? 'bg-black border-white/20 focus:border-blue-500 text-white' 
      : 'bg-white/5 border-white/10 focus:bg-white/10 text-white'
  }`
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block"

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`${form.id ? 'Edit' : 'Add'} ${type}`}>
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* DATE */}
            <div className="relative group">
                <label className={labelClass}>Date</label>
                <button type="button" onClick={() => setActiveCalendar(!activeCalendar)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${theme === 'neon' ? 'bg-black border-white/20 text-white' : 'bg-white/5 border-white/10 text-white'}`}>
                    <CalendarIcon size={16} className="text-gray-400"/>
                    <span className="font-medium text-sm">{form.date}</span>
                </button>
                {activeCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                        <CustomCalendar selectedDate={form.date} onSelect={(date) => setForm({...form, date: date})} onClose={() => setActiveCalendar(false)} />
                    </div>
                )}
            </div>

            {/* CATEGORY & RECURRENCE */}
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className={labelClass}>Category</label>
                    <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                            <option key={cat} value={cat} className="bg-black">{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="group">
                    <label className={labelClass}>Recurrence</label>
                    <select className={inputClass} value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})}>
                        {["None", "Weekly", "Monthly", "Yearly"].map(opt => (
                            <option key={opt} value={opt} className="bg-black">{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* AMOUNT */}
            <div className="group">
                <label className={labelClass}>Amount</label>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-4 text-gray-500"/>
                    <input type="number" className={`${inputClass} pl-8`} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" required />
                </div>
            </div>

            {/* DESCRIPTION */}
            <div className="group">
                <label className={labelClass}>Description</label>
                <input type="text" className={inputClass} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. Salary, Rent..." />
            </div>

            {/* SUBMIT */}
            <button disabled={loading} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${theme === 'neon' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_#3b82f6] text-white' : 'bg-blue-600 hover:bg-blue-500 shadow-lg text-white'}`}>
                {loading ? <span className="animate-spin">⌛</span> : <><Save size={18}/> {form.id ? 'Save Changes' : 'Add Entry'}</>}
            </button>
        </form>
    </ModalWrapper>
  )
}

export default TransactionModal