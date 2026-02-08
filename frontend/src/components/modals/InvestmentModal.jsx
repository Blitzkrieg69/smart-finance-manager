import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Search, CheckCircle, IndianRupee, X, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'


const API_URL = 'http://127.0.0.1:5000/api';


const InvestmentModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [goldUnit, setGoldUnit] = useState('oz')
  const [displayQuantity, setDisplayQuantity] = useState('')
  const [displayPrice, setDisplayPrice] = useState('')
  const [activeCalendar, setActiveCalendar] = useState(false)


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
            const quantity = initialData.quantity || '';
            const price = initialData.buy_price || '';
            setForm({
                id: initialData.id || initialData._id,
                name: initialData.name || '',
                ticker: initialData.ticker || '',
                category: initialData.category || 'Stock',
                quantity: quantity,
                buy_price: price,
                exchange: initialData.exchange || '',
                date: initialData.date || getToday()
            })
            setDisplayQuantity(quantity ? parseFloat(quantity).toLocaleString('en-IN') : '')
            setDisplayPrice(price ? parseFloat(price).toLocaleString('en-IN') : '')
        } else {
            setForm({
                id: null, name: '', ticker: '', category: 'Stock', quantity: '', 
                buy_price: '', exchange: '', date: getToday()
            })
            setDisplayQuantity('')
            setDisplayPrice('')
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


  const handleQuantityChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d{0,4}$/.test(value)) {
      setForm({...form, quantity: value})
      if (value) {
        const parts = value.split('.')
        parts[0] = parseFloat(parts[0]).toLocaleString('en-IN')
        setDisplayQuantity(parts.join('.'))
      } else {
        setDisplayQuantity('')
      }
    }
  }


  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setForm({...form, buy_price: value})
      if (value) {
        const parts = value.split('.')
        parts[0] = parseFloat(parts[0]).toLocaleString('en-IN')
        setDisplayPrice(parts.join('.'))
      } else {
        setDisplayPrice('')
      }
    }
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
            buy_price: parseFloat(form.buy_price),
            date: form.date,
            currency: 'INR'
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


  if (!isOpen) return null;


  const getBadgeColor = (cat) => {
    const category = (cat || '').toLowerCase();
    if (theme === 'dark') {
      if (category.includes('crypto')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      if (category.includes('gold')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
    if (category.includes('crypto')) return 'bg-orange-100 text-orange-700 border-orange-300'
    if (category.includes('gold')) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-blue-100 text-blue-700 border-blue-300'
  }


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-2xl border relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-black border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? 'bg-gradient-to-r from-purple-900/20 to-transparent border-purple-500/20' : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>


          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme === 'dark' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#F5F5DC] border-[#654321]/30'}`}>
              <TrendingUp size={20} className={theme === 'dark' ? 'text-purple-400' : 'text-[#4B3621]'} />
            </div>
            <div>
              <h2 className={`text-xl font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {form.id ? 'Edit' : 'New'} Investment
              </h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                {form.id ? 'Update portfolio' : 'Track your assets'}
              </p>
            </div>
          </div>
        </div>


        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* DATE */}
            <div className="relative">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Purchase Date
                </label>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setActiveCalendar(!activeCalendar); }} 
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-purple-500/50 text-white' : 'bg-white border-[#C9A87C]/50 hover:border-[#654321] text-[#4B3621]'}`}
                >
                    <CalendarIcon size={16} className={theme === 'dark' ? 'text-purple-400' : 'text-[#654321]'}/>
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


            {/* SEARCH */}
            <div className="relative">
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Asset Name / Ticker
                </label>
                <div className="relative">
                    <Search size={16} className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]'}`}/>
                    <input 
                        type="text" 
                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        placeholder="e.g. Apple, Bitcoin, Gold..." 
                        autoComplete="off"
                        required
                    />
                    {isSearching && <span className={`absolute right-3 top-3 text-xs animate-pulse font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-[#654321]'}`}>Searching...</span>}
                </div>
                
                {searchResults.length > 0 && (
                    <div className={`absolute z-50 w-full rounded-xl shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar border ${theme === 'dark' ? 'bg-[#09090b] border-purple-500/20' : 'bg-white border-[#C9A87C]/50'}`}>
                        {searchResults.map((result, i) => (
                            <div key={i} onClick={() => selectAsset(result)} className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition ${theme === 'dark' ? 'hover:bg-white/10 border-white/5' : 'hover:bg-[#F5F5DC] border-[#C9A87C]/20'}`}>
                                <div>
                                  <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>{result.name}</p>
                                  <p className={`text-[10px] font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>{result.exchange}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${getBadgeColor(result.category)}`}>
                                        {(result.category || 'Stock').toUpperCase()}
                                    </div>
                                    <p className={`text-[10px] font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/70'}`}>{result.symbol}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {form.ticker && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs border ${theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-50 border-blue-300 text-blue-700'}`}>
                    <CheckCircle size={14} className={theme === 'dark' ? 'text-purple-400' : 'text-blue-600'} /> 
                    <span>Selected: <b className={theme === 'dark' ? 'text-white' : 'text-blue-900'}>{form.ticker}</b> ({form.category})</span>
                </div>
            )}


            {/* CATEGORY */}
            <div>
                <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                  Category
                </label>
                <select 
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})}
                >
                    {INVESTMENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className={theme === 'dark' ? 'bg-black' : 'bg-white'}>{cat}</option>
                    ))}
                </select>
            </div>


            {/* QUANTITY & UNIT (for Gold) OR PRICE (for others) */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Quantity
                    </label>
                    <input 
                        type="text"
                        inputMode="decimal"
                        className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-transparent ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                        value={displayQuantity} 
                        onChange={handleQuantityChange} 
                        placeholder="0.0" 
                        required 
                    />
                </div>
                {form.category === 'Gold' ? (
                    <div>
                        <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                          Unit
                        </label>
                        <select 
                          className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
                          value={goldUnit} 
                          onChange={e => setGoldUnit(e.target.value)}
                        >
                            <option value="oz" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Troy Ounce</option>
                            <option value="g" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Grams</option>
                            <option value="kg" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Kilograms</option>
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                          Buy Price (₹)
                        </label>
                        <div className="relative">
                             <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]'}`}>₹</div>
                             <input 
                                type="text"
                                inputMode="decimal"
                                className={`w-full pl-8 pr-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-transparent ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                                value={displayPrice} 
                                onChange={handlePriceChange} 
                                placeholder="24000" 
                                required 
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* GOLD PRICE (shown separately when Gold is selected) */}
            {form.category === 'Gold' && (
                <div>
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      Buy Price per {goldUnit === 'oz' ? 'Troy Ounce' : goldUnit === 'g' ? 'Gram' : 'Kilogram'} (₹)
                    </label>
                    <div className="relative">
                         <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]'}`}>₹</div>
                         <input 
                            type="text"
                            inputMode="decimal"
                            className={`w-full pl-8 pr-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-transparent ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-purple-500/50 text-white placeholder-gray-600' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621] placeholder-[#654321]/40'}`}
                            value={displayPrice} 
                            onChange={handlePriceChange} 
                            placeholder="5000" 
                            required 
                        />
                    </div>
                </div>
            )}


            {/* SUBMIT BUTTON */}
            <button 
              disabled={loading} 
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-400' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg'}`}
            >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Save size={18}/> 
                    {form.id ? 'Update Investment' : 'Add Investment'}
                  </>
                )}
            </button>
        </form>
      </div>
    </div>
  )
}


export default InvestmentModal
