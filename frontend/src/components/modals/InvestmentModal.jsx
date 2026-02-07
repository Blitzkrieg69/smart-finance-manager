import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Search, CheckCircle, IndianRupee } from 'lucide-react' // Changed DollarSign to IndianRupee
import ModalWrapper from './ModalWrapper'
import { useTheme } from '../../context/ThemeContext'

const API_URL = 'http://127.0.0.1:5001/api';

const InvestmentModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [goldUnit, setGoldUnit] = useState('oz')

  const getToday = () => new Date().toISOString().split('T')[0]
  const INVESTMENT_CATEGORIES = ["Stock", "Crypto", "Gold", "Real Estate", "Mutual Fund", "Bond"]

  const [form, setForm] = useState({
    id: null,
    name: '',
    ticker: '',
    category: 'Stock',
    quantity: '',
    buy_price: '',
    exchange: '',
    date: getToday()
  })

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setForm({
                id: initialData.id || initialData._id,
                name: initialData.name || '',
                ticker: initialData.ticker || '',
                category: initialData.category || 'Stock',
                quantity: initialData.quantity || '',
                buy_price: initialData.buy_price || '',
                exchange: initialData.exchange || '',
                date: initialData.date || getToday()
            })
        } else {
            setForm({
                id: null, name: '', ticker: '', category: 'Stock', quantity: '', 
                buy_price: '', exchange: '', date: getToday()
            })
        }
        setSearchResults([])
    }
  }, [initialData, isOpen])

  // --- DEBOUNCED SEARCH ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (form.name && form.name.length > 1 && !form.ticker) {
        setIsSearching(true)
        try {
          const res = await axios.get(`${API_URL}/investments/search?q=${form.name}`)
          setSearchResults(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
          console.error("Search failed", err)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500) 
    return () => clearTimeout(delayDebounceFn)
  }, [form.name])

  const selectAsset = (asset) => {
    setForm(prev => ({
        ...prev,
        name: asset.name,      
        ticker: asset.symbol,   
        category: asset.category || 'Stock',
        exchange: asset.exchange || 'Unknown'
    }))
    setSearchResults([]) 
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const recordId = form.id; 

    try {
        let finalQuantity = parseFloat(form.quantity || 0)
        
        // Gold Conversion
        if (form.category === 'Gold') {
            if (goldUnit === 'g') finalQuantity = finalQuantity / 31.1035
            else if (goldUnit === 'kg') finalQuantity = (finalQuantity * 1000) / 31.1035
        }

        const payload = { 
            name: form.name, 
            ticker: form.ticker || form.name.substring(0,4).toUpperCase(), 
            category: form.category, 
            exchange: form.exchange || 'Unknown', 
            quantity: finalQuantity, 
            buy_price: parseFloat(form.buy_price), // User enters INR
            date: form.date,
            currency: 'INR' // Force INR
        }

        if (recordId) await axios.put(`${API_URL}/investments/${recordId}`, payload)
        else await axios.post(`${API_URL}/investments`, payload)
        
        onSuccess() 
        onClose()
    } catch(e) { 
        console.error("Submission Error:", e)
        alert("Failed to save investment.") 
    } finally {
        setLoading(false)
    }
  }

  // Styles
  const inputClass = `w-full p-3 pl-10 rounded-xl border outline-none transition font-bold ${
    theme === 'neon' 
      ? 'bg-black border-white/20 focus:border-blue-500 text-white' 
      : 'bg-white/5 border-white/10 focus:bg-white/10 text-white'
  }`
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block group-focus-within:text-blue-500 transition-colors"
  
  const getBadgeColor = (cat) => {
    const category = (cat || '').toLowerCase();
    if (category.includes('crypto')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    if (category.includes('gold')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={form.id ? 'Edit Investment' : 'Add Investment'}>
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* SEARCH */}
            <div className="relative group">
                <label className={labelClass}>Asset Name / Ticker</label>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-gray-500"/>
                    <input 
                        type="text" 
                        className={`w-full p-3 pl-10 rounded-xl border outline-none transition font-bold ${theme === 'neon' ? 'bg-black border-white/20 focus:border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}`} 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        placeholder="e.g. Apple, Bitcoin, Gold..." 
                        autoComplete="off"
                        required
                    />
                    {isSearching && <span className="absolute right-3 top-3.5 text-xs text-blue-400 animate-pulse font-medium">Searching...</span>}
                </div>
                
                {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-[#09090b] border border-white/20 rounded-xl shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.map((result, i) => (
                            <div key={i} onClick={() => selectAsset(result)} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition">
                                <div><p className="font-bold text-sm text-white">{result.name}</p><p className="text-[10px] text-gray-500 font-medium">{result.exchange}</p></div>
                                <div className="text-right">
                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${getBadgeColor(result.category)}`}>
                                        {(result.category || 'Stock').toUpperCase()}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-mono">{result.symbol}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {form.ticker && (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg text-xs text-blue-300">
                    <CheckCircle size={14} className="text-blue-400" /> 
                    <span>Selected: <b className="text-white">{form.ticker}</b> ({form.category})</span>
                </div>
            )}

            {/* CATEGORY */}
            <div className="group">
                <label className={labelClass}>Category</label>
                <select className={`w-full p-3 rounded-xl border outline-none transition font-bold ${theme === 'neon' ? 'bg-black border-white/20 focus:border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}`} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {INVESTMENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-black">{cat}</option>
                    ))}
                </select>
            </div>

            {/* QUANTITY & INR PRICE */}
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className={labelClass}>Quantity</label>
                    <input 
                        type="number" step="0.0001" 
                        className={`w-full p-3 rounded-xl border outline-none transition font-bold ${theme === 'neon' ? 'bg-black border-white/20 focus:border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}`} 
                        value={form.quantity} 
                        onChange={e => setForm({...form, quantity: e.target.value})} 
                        placeholder="0.0" 
                        required 
                    />
                </div>
                {form.category === 'Gold' ? (
                    <div className="group">
                        <label className={labelClass}>Unit</label>
                        <select className={`w-full p-3 rounded-xl border outline-none transition font-bold ${theme === 'neon' ? 'bg-black border-white/20 focus:border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white'}`} value={goldUnit} onChange={e => setGoldUnit(e.target.value)}>
                            <option value="oz" className="bg-black">Troy Ounce</option>
                            <option value="g" className="bg-black">Grams</option>
                            <option value="kg" className="bg-black">Kilograms</option>
                        </select>
                    </div>
                ) : (
                    <div className="group">
                        <label className={labelClass}>Buy Price (₹)</label>
                        <div className="relative">
                             <IndianRupee size={14} className="absolute left-3 top-4 text-gray-500"/>
                             <input 
                                type="number" 
                                className={inputClass} 
                                value={form.buy_price} 
                                onChange={e => setForm({...form, buy_price: e.target.value})} 
                                placeholder="e.g. 24000" 
                                required 
                            />
                        </div>
                    </div>
                )}
            </div>

            <button disabled={loading} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${theme === 'neon' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_#3b82f6] text-white' : 'bg-blue-600 hover:bg-blue-500 shadow-lg text-white'}`}>
                {loading ? <span className="animate-spin">⌛</span> : <><Save size={18}/> {form.id ? 'Update' : 'Add'}</>}
            </button>
        </form>
    </ModalWrapper>
  )
}

export default InvestmentModal