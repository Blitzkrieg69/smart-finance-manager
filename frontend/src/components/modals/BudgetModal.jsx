import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, PieChart, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'


const API_URL = 'http://127.0.0.1:5001/api';


const BudgetModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [displayLimit, setDisplayLimit] = useState('')


  const [form, setForm] = useState({ 
    id: null, 
    category: '', 
    limit: '', 
    period: 'Monthly'
  })


  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            const limit = initialData.limit || initialData.amount || '';
            setForm({ 
                id: initialData.id || initialData._id, 
                category: initialData.category || '',
                limit: limit,
                period: initialData.period || 'Monthly'
            })
            setDisplayLimit(limit ? parseFloat(limit).toLocaleString('en-IN') : '')
        } else {
            setForm({ 
                id: null, 
                category: '', 
                limit: '', 
                period: 'Monthly'
            })
            setDisplayLimit('')
        }
    }
  }, [initialData, isOpen])


  const handleLimitChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setForm({...form, limit: value})
      if (value) {
        const parts = value.split('.')
        parts[0] = parseFloat(parts[0]).toLocaleString('en-IN')
        setDisplayLimit(parts.join('.'))
      } else {
        setDisplayLimit('')
      }
    }
  }


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


  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-2xl border relative overflow-hidden ${theme === 'dark' ? 'bg-black border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-500/20' : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>


          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#F5F5DC] border-[#654321]/30'}`}>
              <PieChart size={20} className={theme === 'dark' ? 'text-yellow-400' : 'text-[#4B3621]'} />
            </div>
            <div>
              <h2 className={`text-xl font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {form.id ? 'Edit' : 'Set'} Budget
              </h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                {form.id ? 'Update spending limit' : 'Control your spending'}
              </p>
            </div>
          </div>
        </div>


        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* CATEGORY */}
            <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Category Name
                </label>
                <input 
                    type="text" 
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-yellow-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    placeholder="e.g. Shopping, Groceries..." 
                    required 
                    autoFocus
                />
            </div>


            {/* PERIOD & LIMIT */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Period
                    </label>
                    <select 
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-yellow-500/50 text-white' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
                      value={form.period} 
                      onChange={e => setForm({...form, period: e.target.value})}
                    >
                        {["Weekly", "Monthly", "Yearly"].map(opt => (
                            <option key={opt} value={opt} className={theme === 'dark' ? 'bg-black' : 'bg-white'}>{opt}</option>
                        ))}
                    </select>
                </div>


                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Limit Amount
                    </label>
                    <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]'}`}>₹</div>
                        <input 
                            type="text"
                            inputMode="decimal"
                            className={`w-full pl-8 pr-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-transparent ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-yellow-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                            value={displayLimit} 
                            onChange={handleLimitChange} 
                            placeholder="0.00" 
                            required 
                        />
                    </div>
                </div>
            </div>


            {/* SUBMIT BUTTON */}
            <button 
              disabled={loading} 
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-300' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'}`}
            >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Save size={18}/> 
                    {form.id ? 'Update Budget' : 'Set Budget'}
                  </>
                )}
            </button>
        </form>
      </div>
    </div>
  )
}


export default BudgetModal
