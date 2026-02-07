import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, DollarSign, PieChart } from 'lucide-react'
import ModalWrapper from './ModalWrapper'
import { useTheme } from '../../context/ThemeContext'

// Central API URL
const API_URL = 'http://127.0.0.1:5001/api';

const BudgetModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)

  // Form State
  const [form, setForm] = useState({ 
    id: null, 
    category: '', 
    limit: '', 
    period: 'Monthly'
  })

  // Load Data for Editing
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setForm({ 
                id: initialData.id || initialData._id, 
                category: initialData.category || '',
                limit: initialData.limit || initialData.amount || '', // Handle potential field mismatch
                period: initialData.period || 'Monthly'
            })
        } else {
            // Reset for New Entry
            setForm({ 
                id: null, 
                category: '', 
                limit: '', 
                period: 'Monthly'
            })
        }
    }
  }, [initialData, isOpen])

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const recordId = form.id; 

    try {
        const payload = { 
            category: form.category, 
            limit: form.limit, 
            period: form.period 
        }

        if (recordId) await axios.put(`${API_URL}/budgets/${recordId}`, payload)
        else await axios.post(`${API_URL}/budgets`, payload)
        
        onSuccess() 
        onClose()
    } catch(e) { 
        console.error("Submission Error:", e)
        alert("Failed to save budget.") 
    } finally {
        setLoading(false)
    }
  }

  // Styles
  const inputClass = `w-full p-3 rounded-xl border outline-none transition font-bold ${
    theme === 'neon' 
      ? 'bg-black border-white/20 focus:border-yellow-500 focus:shadow-[0_0_15px_rgba(234,179,8,0.4)] text-white' 
      : 'bg-white/5 border-white/10 focus:bg-white/10 text-white'
  }`
  
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-yellow-500 transition-colors"

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={form.id ? 'Edit Budget' : 'Set Budget'}>
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ICON HEADER */}
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'neon' ? 'bg-black border border-yellow-500 shadow-[0_0_20px_#facc15]' : 'bg-white/10'}`}>
                    <PieChart size={32} className="text-yellow-500" />
                </div>
            </div>

            {/* CATEGORY */}
            <div className="group">
                <label className={labelClass}>Category Name</label>
                <input 
                    type="text" 
                    className={inputClass} 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    placeholder="e.g. Shopping, Groceries..." 
                    required 
                    autoFocus
                />
            </div>

            {/* PERIOD & LIMIT */}
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className={labelClass}>Period</label>
                    <select className={inputClass} value={form.period} onChange={e => setForm({...form, period: e.target.value})}>
                        {["Weekly", "Monthly", "Yearly"].map(opt => (
                            <option key={opt} value={opt} className="bg-black">{opt}</option>
                        ))}
                    </select>
                </div>

                <div className="group">
                    <label className={labelClass}>Limit Amount</label>
                    <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-4 text-gray-500"/>
                        <input 
                            type="number" 
                            className={`${inputClass} pl-8`} 
                            value={form.limit} 
                            onChange={e => setForm({...form, limit: e.target.value})} 
                            placeholder="0.00" 
                            required 
                        />
                    </div>
                </div>
            </div>

            {/* SUBMIT */}
            <button disabled={loading} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${theme === 'neon' ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_#facc15]' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg'}`}>
                {loading ? <span className="animate-spin">⌛</span> : <><Save size={18}/> {form.id ? 'Update Limit' : 'Set Budget'}</>}
            </button>
        </form>
    </ModalWrapper>
  )
}

export default BudgetModal