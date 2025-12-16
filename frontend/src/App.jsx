import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Bell, AlertTriangle, CheckCircle, Calendar as CalendarIcon, Repeat } from 'lucide-react'

// Modules
import Sidebar from './components/Sidebar'
import CustomCalendar from './components/CustomCalendar'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expense from './pages/Expense'
import Budgets from './pages/Budgets'

function App() {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [view, setView] = useState('dashboard') 
  
  // GLOBAL CURRENCY STATE (Default to $)
  const [currency, setCurrency] = useState('$')

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('expense')
  const [showCalendar, setShowCalendar] = useState(false)
  
  const getToday = () => new Date().toISOString().split('T')[0]
  
  // FORM STATE
  const [form, setForm] = useState({ 
    id: null, 
    amount: '', 
    category: '', 
    description: '', 
    date: getToday(), 
    recurrence: 'None' 
  })
  
  const [aiLoading, setAiLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Sold Items", "Rental Income", "Other"]
  
  const getActiveCategories = () => modalType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get('http://127.0.0.1:5000/api/transactions'),
        axios.get('http://127.0.0.1:5000/api/budgets')
      ])
      if(results[0].status === 'fulfilled') setTransactions(results[0].value.data || [])
      if(results[1].status === 'fulfilled') setBudgets(results[1].value.data || [])
    } catch (err) { console.error("API Error", err) }
  }

  useEffect(() => { fetchData() }, [])

  // ALERTS
  const expenses = transactions.filter(t => t.type === 'expense')
  const income = transactions.filter(t => t.type === 'income')
  
  const alerts = budgets.map(b => {
    const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0)
    const percent = (spent / b.limit) * 100
    if (percent >= 100) return { id: b.id, category: b.category, percent: percent, type: 'critical', message: `Exceeded limit by ${currency}${(spent - b.limit).toFixed(0)}` }
    if (percent >= 80) return { id: b.id, category: b.category, percent: percent, type: 'warning', message: `${percent.toFixed(0)}% of budget used` }
    return null
  }).filter(Boolean)

  // HANDLERS
  const handleDescriptionChange = async (e) => {
    const desc = e.target.value
    setForm(prev => ({ ...prev, description: desc }))
    if (modalType === 'expense' && desc.length > 3 && !form.category) {
      setAiLoading(true)
      try {
        const res = await axios.post('http://127.0.0.1:5000/api/predict', { description: desc })
        if (res.data.category && EXPENSE_CATEGORIES.includes(res.data.category)) {
            setForm(prev => ({ ...prev, category: res.data.category }))
        }
      } catch (err) { console.error(err) } finally { setAiLoading(false) }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) return
    const endpoint = modalType === 'budget' ? '/api/budgets' : '/api/transactions'
    const payload = modalType === 'budget' 
      ? { category: form.category, limit: form.amount, period: form.recurrence } 
      : { ...form, type: modalType }
    
    try {
        await axios.post(`http://127.0.0.1:5000${endpoint}`, payload)
        const defaultCat = modalType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        const defaultRecurrence = modalType === 'budget' ? 'Monthly' : 'None'
        setForm({ id: null, amount: '', category: defaultCat, description: '', date: getToday(), recurrence: defaultRecurrence })
        setIsModalOpen(false)
        fetchData()
    } catch(e) { console.error(e) }
  }

  const handleDelete = async (id, type = 'transaction') => {
    const endpoint = type === 'budget' ? `/api/budgets/${id}` : `/api/transactions/${id}`
    await axios.delete(`http://127.0.0.1:5000${endpoint}`)
    fetchData()
  }

  const handleEdit = (item, type) => {
    setModalType(type)
    setForm({ 
        id: item.id, amount: item.limit || item.amount, 
        category: item.category, description: item.description || '', 
        date: item.date || getToday(),
        recurrence: item.recurrence || item.period || (type === 'budget' ? 'Monthly' : 'None')
    })
    setIsModalOpen(true)
  }

  const openModal = (type) => {
    setModalType(type)
    const defaultCat = type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    const defaultRecurrence = type === 'budget' ? 'Monthly' : 'None'
    setForm({ id: null, amount: '', category: defaultCat, description: '', date: getToday(), recurrence: defaultRecurrence })
    setIsModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#0b0c15] text-white font-sans overflow-hidden">
      
      {/* 1. PASS CURRENCY TO SIDEBAR */}
      <Sidebar view={view} setView={setView} currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col relative min-w-0" onClick={() => setShowCalendar(false)}>
        <header className="h-16 border-b border-gray-800 flex justify-between items-center px-8 bg-[#0b0c15] shrink-0">
          <h2 className="text-lg font-bold capitalize text-gray-200">{view} Overview</h2>
          <div className="flex items-center gap-6">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-gray-800 transition">
                  <Bell className="text-gray-400" size={20} />
                  {alerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0c15]"></span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-[#1a1b26] border border-gray-700 rounded-xl shadow-2xl p-4 animate-fade-in z-50">
                    <h4 className="font-bold text-sm mb-3">Notifications ({alerts.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                          <AlertTriangle size={18} className={alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
                          <div><p className="text-sm font-bold text-white">{alert.category}</p><p className="text-xs text-gray-400">{alert.message}</p></div>
                        </div>
                      ))}
                      {alerts.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">All budgets healthy</p>}
                    </div>
                  </div>
                )}
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/20"></div>
          </div>
        </header>

        {/* 2. PASS CURRENCY TO ALL PAGES */}
        {view === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} openModal={openModal} currency={currency} />}
        {view === 'income' && <Income data={income} openModal={openModal} handleDelete={handleDelete} currency={currency} />}
        {view === 'expense' && <Expense data={expenses} openModal={openModal} handleDelete={handleDelete} currency={currency} />}
        {view === 'budget' && <Budgets budgets={budgets} expenses={expenses} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-[#1a1b26] p-8 rounded-2xl border border-gray-700 w-full max-w-md relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
              <h2 className="text-xl font-bold mb-4 text-white capitalize">{form.id ? 'Edit' : 'Add'} {modalType}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType !== 'budget' && (
                    <div className="relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar) }} className="w-full flex items-center gap-2 bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1 hover:border-blue-500 transition">
                            <CalendarIcon size={16} className="text-gray-400"/>{form.date}
                        </button>
                        {showCalendar && <CustomCalendar selectedDate={form.date} onSelect={(date) => setForm({...form, date: date})} onClose={() => setShowCalendar(false)} />}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                        <select className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {getActiveCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{modalType === 'budget' ? 'Period' : 'Recurrence'}</label>
                        <select className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})}>
                            {modalType === 'budget' ? ["Monthly", "Weekly", "Yearly"].map(opt => <option key={opt} value={opt}>{opt}</option>) : ["None", "Weekly", "Monthly", "Yearly"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">{modalType === 'budget' ? 'Limit' : 'Amount'}</label>
                    <input autoFocus type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                </div>
                {modalType !== 'budget' && (
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                      <div className="relative">
                        <input type="text" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.description} onChange={handleDescriptionChange} placeholder="e.g. Salary, Uber..." />
                        {aiLoading && <span className="absolute right-3 top-4 text-xs text-blue-500 animate-pulse">AI...</span>}
                      </div>
                   </div>
                )}
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition">{form.id ? 'Update' : 'Save'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App