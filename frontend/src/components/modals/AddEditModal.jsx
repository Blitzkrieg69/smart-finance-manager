import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Calendar as CalendarIcon, Search, CheckCircle } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'

const AddEditModal = ({ isOpen, onClose, type, initialData, onSuccess, currency }) => {
  if (!isOpen) return null

  const getToday = () => new Date().toISOString().split('T')[0]
  
  // Internal State
  const [form, setForm] = useState({ 
    id: null, amount: '', category: '', description: '', date: getToday(), recurrence: 'None',
    quantity: '', buy_price: '', current_price: '', name: '', ticker: '', exchange: ''
  })
  
  const [activeCalendar, setActiveCalendar] = useState(false)
  const [goldUnit, setGoldUnit] = useState('oz')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Sold Items", "Rental Income", "Other"]

  // Load Data on Open
  useEffect(() => {
    if (initialData) {
        setForm({ ...initialData })
    } else {
        // Reset Form
        const defaultCat = type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        setForm({ 
            id: null, amount: '', category: defaultCat, description: '', date: getToday(), recurrence: 'None',
            quantity: '', buy_price: '', current_price: '', name: '', ticker: '', exchange: ''
        })
    }
  }, [initialData, type, isOpen])

  const getActiveCategories = () => {
    if(type === 'income') return INCOME_CATEGORIES
    return EXPENSE_CATEGORIES
  }

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
    } catch (err) { console.error("Search failed", err) } 
    finally { setIsSearching(false) }
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

  const handleDescriptionChange = async (e) => {
    const desc = e.target.value
    setForm(prev => ({ ...prev, description: desc }))
    if (type === 'expense' && desc.length > 3 && !form.category) {
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
    
    try {
        if (type === 'budget') {
            await axios.post('http://127.0.0.1:5000/api/budgets', { category: form.category, limit: form.amount, period: form.recurrence })
        } else if (type === 'investment') {
            let finalQuantity = parseFloat(form.quantity)
            if (form.category === 'Gold') {
                if (goldUnit === 'g') finalQuantity = finalQuantity / 31.1035
                else if (goldUnit === 'kg') finalQuantity = (finalQuantity * 1000) / 31.1035
            }

            const payload = { 
                name: form.name, ticker: form.ticker, category: form.category, exchange: form.exchange || 'Unknown', 
                quantity: finalQuantity, buy_price: form.buy_price, current_price: form.current_price || form.buy_price, date: form.date
            }
            if (form.id) await axios.put(`http://127.0.0.1:5000/api/investments/${form.id}`, payload)
            else await axios.post('http://127.0.0.1:5000/api/investments', payload)

        } else {
            const payload = { ...form, type: type }
            if (form.id) await axios.put(`http://127.0.0.1:5000/api/transactions/${form.id}`, payload)
            else await axios.post('http://127.0.0.1:5000/api/transactions', payload)
        }
        onSuccess() // Refresh parent data
        onClose()
    } catch(e) { console.error(e) }
  }

  const getBadgeColor = (cat) => {
    switch(cat) {
        case 'Crypto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'Gold': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-[#09090b]/90 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 w-full max-w-md relative shadow-2xl ring-1 ring-white/5">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-6 text-white capitalize flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full block"></span>
                {form.id ? 'Edit' : 'Add'} {type}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {type !== 'budget' && (
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-blue-400 transition-colors">Date</label>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveCalendar(!activeCalendar) }} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 text-white hover:bg-white/10 hover:border-white/20 transition text-left">
                            <CalendarIcon size={16} className="text-gray-400"/>
                            <span className="font-medium text-sm">{form.date}</span>
                        </button>
                        {activeCalendar && <CustomCalendar selectedDate={form.date} onSelect={(date) => setForm({...form, date: date})} onClose={() => setActiveCalendar(false)} />}
                    </div>
                )}

                {type !== 'investment' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                {getActiveCategories().map(cat => <option key={cat} value={cat} className="bg-[#1a1b26]">{cat}</option>)}
                            </select>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{type === 'budget' ? 'Period' : 'Recurrence'}</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition" value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})}>
                                {type === 'budget' ? ["Monthly", "Weekly", "Yearly"].map(opt => <option key={opt} value={opt} className="bg-[#1a1b26]">{opt}</option>) : ["None", "Weekly", "Monthly", "Yearly"].map(opt => <option key={opt} value={opt} className="bg-[#1a1b26]">{opt}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {type === 'investment' ? (
                    <>
                        <div className="relative group">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Search Asset</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3.5 text-gray-500"/>
                                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition" value={form.name} onChange={handleSearchChange} placeholder="e.g. Apple..." autoComplete="off"/>
                                {isSearching && <span className="absolute right-3 top-3.5 text-xs text-blue-400 animate-pulse font-medium">Searching...</span>}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="absolute z-20 w-full bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map((result, i) => (
                                        <div key={i} onClick={() => selectAsset(result)} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition">
                                            <div><p className="font-bold text-sm text-white">{result.name}</p><p className="text-[10px] text-gray-500 font-medium">{result.exchange}</p></div>
                                            <div className="text-right"><div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${getBadgeColor(result.category)}`}>{result.category.toUpperCase()}</div><p className="text-[10px] text-gray-500 font-mono">{result.symbol}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {form.ticker && <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg text-xs text-blue-300"><CheckCircle size={14} className="text-blue-400" /> <span>Selected: <b className="text-white">{form.ticker}</b> ({form.category})</span></div>}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quantity</label><input type="number" step="0.0001" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="0.0" /></div>
                            {form.category === 'Gold' ? (
                                <div className="group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Unit</label><select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" value={goldUnit} onChange={e => setGoldUnit(e.target.value)}><option value="oz" className="bg-[#1a1b26]">Troy Ounce</option><option value="g" className="bg-[#1a1b26]">Grams</option><option value="kg" className="bg-[#1a1b26]">Kilograms</option></select></div>
                            ) : (
                                <div className="group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Buy Price</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50" value={form.buy_price} onChange={e => setForm({...form, buy_price: e.target.value})} placeholder="0.00" /></div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{type === 'budget' ? 'Limit' : 'Amount'}</label><input autoFocus type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" /></div>
                        {type !== 'budget' && (
                            <div className="group"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label><div className="relative"><input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50" value={form.description} onChange={handleDescriptionChange} placeholder="e.g. Salary..." />{aiLoading && <span className="absolute right-3 top-3.5 text-xs text-blue-400 animate-pulse font-bold">AI...</span>}</div></div>
                        )}
                    </>
                )}
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl mt-4 transition-all duration-300 shadow-lg shadow-blue-900/20 hover:scale-[1.02]">{form.id ? 'Save Changes' : 'Add Entry'}</button>
            </form>
        </div>
    </div>
  )
}
export default AddEditModal