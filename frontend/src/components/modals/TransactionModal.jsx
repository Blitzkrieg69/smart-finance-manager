import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Calendar as CalendarIcon, DollarSign, X } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'


const API_URL = 'http://127.0.0.1:5001/api';


const TransactionModal = ({ isOpen, onClose, type, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [displayAmount, setDisplayAmount] = useState('')


  const getToday = () => new Date().toISOString().split('T')[0]


  const [form, setForm] = useState({ 
    id: null, 
    amount: '', 
    category: '', 
    description: '', 
    date: getToday(), 
    recurrence: 'None',
    type: type
  })


  const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Sold Items", "Rental Income", "Other"]


  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            const amount = initialData.amount || '';
            setForm({ 
                ...initialData, 
                id: initialData.id || initialData._id,
                description: initialData.title || initialData.description || '',
                date: initialData.date || getToday(),
                amount: amount
            })
            setDisplayAmount(amount ? parseFloat(amount).toLocaleString('en-IN') : '')
        } else {
            setForm({ 
                id: null, 
                amount: '', 
                category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0], 
                description: '', 
                date: getToday(), 
                recurrence: 'None',
                type: type 
            })
            setDisplayAmount('')
        }
    }
  }, [initialData, type, isOpen])


  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setForm({...form, amount: value})
      
      if (value) {
        const parts = value.split('.')
        parts[0] = parseFloat(parts[0]).toLocaleString('en-IN')
        setDisplayAmount(parts.join('.'))
      } else {
        setDisplayAmount('')
      }
    }
  }


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


  if (!isOpen) return null;


  const isIncome = type === 'income';


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-2xl border relative overflow-hidden ${theme === 'dark' ? (isIncome ? 'bg-black border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-black border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.4)]') : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? (isIncome ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-emerald-500/20' : 'bg-gradient-to-r from-red-900/20 to-transparent border-red-500/20') : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>


          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme === 'dark' ? (isIncome ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-[#F5F5DC] border-[#654321]/30'}`}>
              <DollarSign size={20} className={theme === 'dark' ? (isIncome ? 'text-emerald-400' : 'text-red-400') : 'text-[#4B3621]'} />
            </div>
            <div>
              <h2 className={`text-xl font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {form.id ? 'Edit' : 'New'} {isIncome ? 'Income' : 'Expense'}
              </h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                {form.id ? 'Update transaction' : 'Track your money'}
              </p>
            </div>
          </div>
        </div>


        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* DATE */}
            <div className="relative">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Date
                </label>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setActiveCalendar(!activeCalendar); }} 
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${theme === 'dark' ? (isIncome ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 text-white' : 'bg-white/5 border-white/10 hover:border-red-500/50 text-white') : 'bg-white border-[#C9A87C]/50 hover:border-[#654321] text-[#4B3621]'}`}
                >
                    <CalendarIcon size={16} className={theme === 'dark' ? (isIncome ? 'text-emerald-400' : 'text-red-400') : 'text-[#654321]'}/>
                    <span className="font-mono text-sm font-bold">{form.date}</span>
                </button>
                {activeCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                        <CustomCalendar 
                          selectedDate={form.date} 
                          onSelect={(date) => { setForm({...form, date: date}); setActiveCalendar(false); }} 
                          onClose={() => setActiveCalendar(false)} 
                        />
                    </div>
                )}
            </div>


            {/* CATEGORY & RECURRENCE */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Category
                    </label>
                    <select 
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? (isIncome ? 'bg-white/5 border-white/10 focus:border-emerald-500/50 text-white' : 'bg-white/5 border-white/10 focus:border-red-500/50 text-white') : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})}
                    >
                        {(isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                            <option key={cat} value={cat} className={theme === 'dark' ? 'bg-black' : 'bg-white'}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Recurrence
                    </label>
                    <select 
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? (isIncome ? 'bg-white/5 border-white/10 focus:border-emerald-500/50 text-white' : 'bg-white/5 border-white/10 focus:border-red-500/50 text-white') : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
                      value={form.recurrence} 
                      onChange={e => setForm({...form, recurrence: e.target.value})}
                    >
                        {["None", "Weekly", "Monthly", "Yearly"].map(opt => (
                            <option key={opt} value={opt} className={theme === 'dark' ? 'bg-black' : 'bg-white'}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>


            {/* AMOUNT */}
            <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Amount
                </label>
                <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]'}`}>₹</div>
                    <input 
                      type="text"
                      inputMode="decimal"
                      className={`w-full pl-8 pr-3 py-2.5 rounded-xl border outline-none transition font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-transparent ${theme === 'dark' ? (isIncome ? 'bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder-gray-600' : 'bg-white/5 border-white/10 focus:border-red-500/50 text-white placeholder-gray-600') : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                      value={displayAmount} 
                      onChange={handleAmountChange} 
                      placeholder="0.00" 
                      required 
                    />
                </div>
            </div>


            {/* DESCRIPTION */}
            <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Description (Optional)
                </label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? (isIncome ? 'bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder-gray-600' : 'bg-white/5 border-white/10 focus:border-red-500/50 text-white placeholder-gray-600') : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="e.g. Monthly Salary..." 
                />
            </div>


            {/* SUBMIT BUTTON */}
            <button 
              disabled={loading} 
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? (isIncome ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-400') : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'}`}
            >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Save size={18}/> 
                    {form.id ? 'Save Changes' : `Add ${isIncome ? 'Income' : 'Expense'}`}
                  </>
                )}
            </button>
        </form>
      </div>
    </div>
  )
}


export default TransactionModal
