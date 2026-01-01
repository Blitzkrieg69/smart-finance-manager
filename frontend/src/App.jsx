import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Bell, AlertTriangle, Calendar as CalendarIcon, Download, Search, CheckCircle } from 'lucide-react'

import Sidebar from './components/Sidebar'
import CustomCalendar from './components/CustomCalendar'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expense from './pages/Expense'
import Budgets from './pages/Budgets'
import Investments from './pages/Investments'
import Goals from './pages/Goals'

function App() {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [investments, setInvestments] = useState([])
  const [exchangeRate, setExchangeRate] = useState(84) 

  const [view, setView] = useState('dashboard') 
  const currency = '₹' // <--- HARDCODED TO INR
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('expense')
  const [showCalendar, setShowCalendar] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportForm, setExportForm] = useState({ start_date: '', end_date: '', type: 'all' })
  const getToday = () => new Date().toISOString().split('T')[0]
  
  const [form, setForm] = useState({ 
    id: null, amount: '', category: '', description: '', date: getToday(), recurrence: 'None',
    quantity: '', buy_price: '', current_price: '', name: '', ticker: '', exchange: ''
  })

  const [goldUnit, setGoldUnit] = useState('oz') 
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [clearedAlerts, setClearedAlerts] = useState([]) 

  const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Sold Items", "Rental Income", "Other"]
  
  const getActiveCategories = () => {
      if(modalType === 'income') return INCOME_CATEGORIES
      return EXPENSE_CATEGORIES
  }

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get('http://127.0.0.1:5000/api/transactions'),
        axios.get('http://127.0.0.1:5000/api/budgets'),
        axios.get('http://127.0.0.1:5000/api/investments')
      ])
      
      if(results[0].status === 'fulfilled') setTransactions(results[0].value.data || [])
      if(results[1].status === 'fulfilled') setBudgets(results[1].value.data || [])
      
      if(results[2].status === 'fulfilled') {
          const data = results[2].value.data
          if (data.rate) {
              setExchangeRate(data.rate)
              setInvestments(data.investments || [])
          } else {
              setInvestments(data || [])
          }
      }
    } catch (err) { console.error("API Error", err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearchChange = async (e) => {
      const query = e.target.value
      setForm(prev => ({ ...prev, name: query }))
      
      if (query.length < 2) {
          setSearchResults([])
          return
      }

      setIsSearching(true)
      try {
          const res = await axios.get(`http://127.0.0.1:5000/api/search?q=${query}`)
          setSearchResults(res.data)
      } catch (err) {
          console.error("Search failed", err)
      } finally {
          setIsSearching(false)
      }
  }

  const selectAsset = (asset) => {
      setForm(prev => ({
          ...prev,
          name: asset.name,      
          ticker: asset.symbol,  
          category: asset.category,
          exchange: asset.exchange 
      }))
      setSearchResults([]) 
  }
  
  const getBadgeColor = (cat) => {
      switch(cat) {
          case 'Crypto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
          case 'Gold': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
      }
  }

  const handleExport = async (e) => {
    e.preventDefault()
    try {
        const response = await axios.post('http://127.0.0.1:5000/api/export', exportForm, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `finance_report_${exportForm.type}.csv`); document.body.appendChild(link); link.click(); link.remove(); setIsExportOpen(false)
    } catch (error) { console.error("Export failed", error) }
  }

  const handleDescriptionChange = async (e) => {
    const desc = e.target.value
    setForm(prev => ({ ...prev, description: desc }))
    if (modalType === 'expense' && desc.length > 3 && !form.category) {
      setAiLoading(true)
      try {
        const res = await axios.post('http://127.0.0.1:5000/api/predict', { description: desc })
        if (res.data.category && EXPENSE_CATEGORIES.includes(res.data.category)) setForm(prev => ({ ...prev, category: res.data.category }))
      } catch (err) { console.error(err) } finally { setAiLoading(false) }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.category && modalType !== 'investment') return 
    if (modalType === 'investment' && !form.ticker) {
        alert("Please select a valid asset from the search list.");
        return;
    }
    
    try {
        if (modalType === 'budget') {
            await axios.post('http://127.0.0.1:5000/api/budgets', { category: form.category, limit: form.amount, period: form.recurrence })
        } else if (modalType === 'investment') {
            
            let finalQuantity = parseFloat(form.quantity)
            if (form.category === 'Gold') {
                if (goldUnit === 'g') {
                    finalQuantity = finalQuantity / 31.1035
                } else if (goldUnit === 'kg') {
                    finalQuantity = (finalQuantity * 1000) / 31.1035
                }
            }

            const payload = { 
                name: form.name, 
                ticker: form.ticker, 
                category: form.category, 
                exchange: form.exchange || 'Unknown', 
                quantity: finalQuantity, 
                buy_price: form.buy_price, 
                current_price: form.current_price || form.buy_price,
                date: form.date
            }
            
            if (form.id) await axios.put(`http://127.0.0.1:5000/api/investments/${form.id}`, payload)
            else await axios.post('http://127.0.0.1:5000/api/investments', payload)

        } else {
            const payload = { ...form, type: modalType }
            if (form.id) await axios.put(`http://127.0.0.1:5000/api/transactions/${form.id}`, payload)
            else await axios.post('http://127.0.0.1:5000/api/transactions', payload)
        }
        
        const defaultCat = modalType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        setForm({ id: null, amount: '', category: defaultCat, description: '', date: getToday(), recurrence: 'None', quantity: '', buy_price: '', current_price: '', name: '', ticker: '' })
        setGoldUnit('oz') 
        setIsModalOpen(false)
        fetchData()
    } catch(e) { console.error(e) }
  }

  const handleDelete = async (id, type = 'transaction') => {
    let endpoint = `/api/transactions/${id}`
    if (type === 'budget') endpoint = `/api/budgets/${id}`
    if (type === 'investment') endpoint = `/api/investments/${id}`
    await axios.delete(`http://127.0.0.1:5000${endpoint}`)
    fetchData()
  }

  const handleEdit = (item, type) => {
    setModalType(type)
    if (type === 'investment') {
        setForm({ 
            id: item.id, name: item.name, ticker: item.ticker || '', category: item.category, 
            quantity: item.quantity, buy_price: item.buy_price, current_price: item.current_price,
            date: item.date || getToday()
        })
    } else {
        setForm({ 
            id: item.id, amount: item.limit || item.amount, category: item.category, description: item.description || '', 
            date: item.date || getToday(), recurrence: item.recurrence || item.period || (type === 'budget' ? 'Monthly' : 'None')
        })
    }
    setIsModalOpen(true)
  }

  const openModal = (type) => {
    setModalType(type)
    const defaultCat = type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    setForm({ id: null, amount: '', category: defaultCat, description: '', date: getToday(), recurrence: 'None', quantity: '', buy_price: '', current_price: '', name: '', ticker: '' })
    setSearchResults([]) 
    setGoldUnit('oz') 
    setIsModalOpen(true)
  }

  const expenses = transactions.filter(t => t.type === 'expense'); const income = transactions.filter(t => t.type === 'income'); const rawAlerts = budgets.map(b => { const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0); const percent = (spent / b.limit) * 100; const alertType = percent >= 100 ? 'critical' : percent >= 80 ? 'warning' : 'healthy'; if (alertType === 'healthy') return null; return { id: `${b.id}-${alertType}`, budgetId: b.id, category: b.category, percent: percent, type: alertType, message: alertType === 'critical' ? `Exceeded limit by ${currency}${(spent - b.limit).toFixed(0)}` : `${percent.toFixed(0)}% of budget used` } }).filter(Boolean); const activeAlerts = rawAlerts.filter(a => !clearedAlerts.includes(a.id)); const handleClearNotifications = () => { setClearedAlerts(prev => [...prev, ...activeAlerts.map(a => a.id)]); setShowNotifications(false) }

  return (
    <div className="flex h-screen bg-[#0b0c15] text-white font-sans overflow-hidden">
      
      <Sidebar view={view} setView={setView} onExport={() => setIsExportOpen(true)} />
      
      <div className="flex-1 flex flex-col relative min-w-0" onClick={() => setShowCalendar(false)}>
        
        <header className="h-16 border-b border-gray-800 flex justify-between items-center px-8 bg-[#0b0c15] shrink-0">
          <h2 className="text-lg font-bold capitalize text-gray-200">{view} Overview</h2>
          <div className="flex items-center gap-6">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-gray-800 transition">
                  <Bell className="text-gray-400" size={20} />
                  {activeAlerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0c15]"></span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-[#1a1b26] border border-gray-700 rounded-xl shadow-2xl p-4 animate-fade-in z-50">
                    <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-sm">Notifications ({activeAlerts.length})</h4><button onClick={handleClearNotifications} title="Clear All" className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition"><X size={16} /></button></div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {activeAlerts.map(alert => (<div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}><AlertTriangle size={18} className={alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'} /><div><p className="text-sm font-bold text-white">{alert.category}</p><p className="text-xs text-gray-400">{alert.message}</p></div></div>))}
                      {activeAlerts.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No new notifications</p>}
                    </div>
                  </div>
                )}
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/20"></div>
          </div>
        </header>

        {view === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} openModal={openModal} currency={currency} />}
        {view === 'income' && <Income data={income} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'expense' && <Expense data={expenses} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'budget' && <Budgets budgets={budgets} expenses={expenses} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'investment' && <Investments investments={investments} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} exchangeRate={exchangeRate} />}
        {view === 'goals' && <Goals currency={currency} openModal={openModal} />}

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

                {modalType !== 'investment' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                            <select className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{getActiveCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">{modalType === 'budget' ? 'Period' : 'Recurrence'}</label>
                            <select className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})}>{modalType === 'budget' ? ["Monthly", "Weekly", "Yearly"].map(opt => <option key={opt} value={opt}>{opt}</option>) : ["None", "Weekly", "Monthly", "Yearly"].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                        </div>
                    </div>
                )}

                {modalType === 'investment' ? (
                    <>
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase">Search Asset (Stock, Crypto, Gold)</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3.5 text-gray-500"/>
                                <input 
                                    autoFocus 
                                    type="text" 
                                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 pl-10 text-white outline-none focus:border-blue-500 mt-1" 
                                    value={form.name} 
                                    onChange={handleSearchChange} 
                                    placeholder="Type to find..." 
                                    autoComplete="off"
                                />
                                {isSearching && <span className="absolute right-3 top-3.5 text-xs text-blue-500 animate-pulse">Searching...</span>}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="absolute z-20 w-full bg-[#12131e] border border-gray-700 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map((result, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => selectAsset(result)}
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-gray-800 last:border-0"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-white">{result.name}</p>
                                                <p className="text-xs text-gray-500">{result.exchange}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${getBadgeColor(result.category)}`}>
                                                    {result.category.toUpperCase()}
                                                </div>
                                                <p className="text-xs text-gray-500">{result.symbol}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {form.ticker && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 p-2 rounded-lg text-xs text-blue-300">
                                    <CheckCircle size={14} /> Selected: <b>{form.ticker}</b> ({form.category})
                                </div>
                                {form.category === 'Gold' && (
                                     <div className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
                                         ℹ️ <b>Note:</b> Gold market prices are per <b>Troy Ounce</b>. The app will auto-convert your grams/kg input.
                                     </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
                                <input type="number" step="0.0001" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="0.0" />
                            </div>

                            {form.category === 'Gold' ? (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Unit</label>
                                    <select 
                                        className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1"
                                        value={goldUnit}
                                        onChange={e => setGoldUnit(e.target.value)}
                                    >
                                        <option value="oz">Troy Ounce</option>
                                        <option value="g">Grams</option>
                                        <option value="kg">Kilograms</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Avg Buy Price (Native)</label>
                                    <input type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.buy_price} onChange={e => setForm({...form, buy_price: e.target.value})} placeholder="e.g. 150 for AAPL" />
                                </div>
                            )}
                        </div>
                        
                        {form.category === 'Gold' && (
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Avg Buy Price (Per {goldUnit})</label>
                                <input type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.buy_price} onChange={e => setForm({...form, buy_price: e.target.value})} placeholder="0.00" />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">{modalType === 'budget' ? 'Limit' : 'Amount'}</label><input autoFocus type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" /></div>
                        {modalType !== 'budget' && (<div><label className="text-xs font-bold text-gray-500 uppercase">Description</label><div className="relative"><input type="text" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" value={form.description} onChange={handleDescriptionChange} placeholder="e.g. Salary, Uber..." />{aiLoading && <span className="absolute right-3 top-4 text-xs text-blue-500 animate-pulse">AI...</span>}</div></div>)}
                    </>
                )}
                
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition">{form.id ? 'Update' : 'Save'}</button>
              </form>
            </div>
          </div>
        )}

        {isExportOpen && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4"><div className="bg-[#1a1b26] p-8 rounded-2xl border border-gray-700 w-full max-w-sm relative shadow-2xl"><button onClick={() => setIsExportOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button><h2 className="text-xl font-bold mb-4 text-white">Export Data</h2><form onSubmit={handleExport} className="space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Start Date</label><input type="date" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1" value={exportForm.start_date} onChange={e => setExportForm({...exportForm, start_date: e.target.value})} required /></div><div><label className="text-xs font-bold text-gray-500 uppercase">End Date</label><input type="date" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1" value={exportForm.end_date} onChange={e => setExportForm({...exportForm, end_date: e.target.value})} required /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Data Type</label><select className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1" value={exportForm.type} onChange={e => setExportForm({...exportForm, type: e.target.value})}><option value="all">All Transactions</option><option value="income">Income Only</option><option value="expense">Expenses Only</option></select></div><button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg mt-2 transition"><Download size={18} /> Download CSV</button></form></div></div>)}
      </div>
    </div>
  )
}

export default App