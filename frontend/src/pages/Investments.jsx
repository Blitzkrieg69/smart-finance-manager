import { useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Trash2, Edit2, Plus, Briefcase, RefreshCw, Layers, Search, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../context/ThemeContext' // Import Theme Context

const Investments = ({ investments = [], openModal, handleDelete, handleEdit, currency, exchangeRate = 1 }) => {
  const { theme, styles } = useTheme() // Get Theme State

  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // --- LOGIC (Safe Version) ---
  const convert = (value, assetCurrency) => {
      const val = parseFloat(value || 0);
      if (assetCurrency === 'USD') return val * (exchangeRate || 1); 
      if (assetCurrency === 'INR') return val; 
      return val * (exchangeRate || 1); 
  }

  const handleRefresh = async () => {
      setRefreshing(true)
      try {
          const res = await axios.post('http://127.0.0.1:5001/api/investments/refresh')
          if(res.status === 200) window.location.reload()
      } catch (err) { alert("Failed to update prices.") } 
      finally { setRefreshing(false) }
  }

  const filteredInvestments = investments.filter(inv => 
    (inv.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.ticker || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalInvested = filteredInvestments.reduce((sum, i) => sum + (parseFloat(i.quantity || 0) * convert(i.buy_price, i.currency)), 0)
  const currentValue = filteredInvestments.reduce((sum, i) => sum + (parseFloat(i.quantity || 0) * convert(i.current_price, i.currency)), 0)
  const profitLoss = currentValue - totalInvested
  const isProfit = profitLoss >= 0
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

  const allocationMap = filteredInvestments.reduce((acc, item) => {
      const val = parseFloat(item.quantity || 0) * convert(item.current_price, item.currency)
      const cat = item.category || 'Other'
      acc[cat] = (acc[cat] || 0) + val
      return acc
  }, {})
  const data = Object.keys(allocationMap).map(key => ({ name: key, value: allocationMap[key] }))
  
  const COLORS = ['#a855f7', '#d946ef', '#8b5cf6', '#6366f1', '#ec4899']

  // --- DYNAMIC STYLES ---
  const getCardStyle = (colorType = 'purple') => {
      const base = `p-6 rounded-2xl border flex flex-col relative transition-all duration-500 overflow-hidden ${styles.card}`
      
      if (theme !== 'neon') return `${base} shadow-xl shadow-purple-900/5`

      switch(colorType) {
          case 'purple': return `${base} border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:border-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]`
          case 'profit': return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]`
          case 'loss': return `${base} border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]`
          default: return base
      }
  }

  const getBadgeColor = (cat) => {
    const base = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border"
    if (theme === 'neon') {
        switch(cat) {
            case 'Crypto': return `${base} bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]`
            case 'Gold': return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]`
            default: return `${base} bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]`
        }
    }
    // Glass Theme
    switch(cat) {
        case 'Crypto': return `${base} bg-orange-500/10 text-orange-400 border-orange-500/20`
        case 'Gold': return `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/20`
        default: return `${base} bg-purple-500/10 text-purple-400 border-purple-500/20`
    }
  }

  return (
    // FIX: Scrollable Main Container
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}>
      <div className="p-6 flex flex-col gap-8 min-h-min">
       
       {/* HEADER */}
       <div className="flex justify-between items-end shrink-0">
         <div>
           <h2 className={`text-3xl font-bold text-white flex items-center gap-3 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
             <Briefcase className={`text-purple-500 ${theme === 'neon' ? 'drop-shadow-[0_0_15px_#a855f7]' : ''}`} size={32} /> 
             Portfolio
           </h2>
           <p className="text-gray-400 text-sm mt-1 ml-1 tracking-wide">
             Real-time wealth tracking <span className="text-purple-500 font-mono">@ ₹{(exchangeRate || 0).toFixed(2)}/USD</span>
           </p>
         </div>
         
         <div className="flex gap-4">
             <div className="relative group">
                <Search className={`absolute left-3 top-2.5 text-purple-500 transition ${theme === 'neon' ? 'drop-shadow-[0_0_5px_#a855f7]' : ''}`} size={18} />
                <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className={`pl-10 pr-4 py-2 rounded-xl outline-none w-48 transition-all focus:w-64 ${theme === 'neon' ? 'bg-black border border-purple-500/40 text-white focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 border border-white/10 text-white'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

             <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition disabled:opacity-50 ${theme === 'neon' ? 'bg-black border border-purple-500/30 text-gray-300 hover:border-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
             >
                <RefreshCw size={18} className={refreshing ? "animate-spin text-purple-500" : "text-purple-500"} /> 
                {refreshing ? "Updating..." : "Refresh"}
             </button>
             
             <button 
                onClick={() => openModal('investment')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition hover:scale-105 ${theme === 'neon' ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg'}`}
             >
                <Plus size={20}/> Add Asset
             </button>
         </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
          
          {/* CURRENT VALUE */}
          <div className={`${getCardStyle('purple')} group`}>
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition pointer-events-none">
                  <Briefcase size={80} className={`text-purple-500 ${theme === 'neon' ? 'drop-shadow-[0_0_15px_#a855f7]' : ''}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${theme === 'neon' ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'text-gray-400'}`}>Current Value</p>
              <h3 className={`text-4xl font-black text-white mt-1 tracking-tighter ${theme === 'neon' ? 'drop-shadow-[0_0_10px_#a855f7]' : ''}`}>
                  {currency}{currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-2 uppercase tracking-widest font-bold">
                  <Layers size={12} className="text-purple-500"/> {filteredInvestments.length} Active Assets
              </p>
          </div>

          {/* TOTAL INVESTED */}
          <div className={getCardStyle('purple')}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Invested</p>
              <h3 className={`text-3xl font-black text-gray-200 mt-1 ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : ''}`}>
                  {currency}{totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <div className={`w-full h-1.5 mt-6 rounded-full overflow-hidden ${theme === 'neon' ? 'bg-purple-900/20 border border-purple-500/20' : 'bg-white/5'}`}>
                  <div className={`bg-purple-500 h-full rounded-full ${theme === 'neon' ? 'shadow-[0_0_10px_#a855f7]' : ''}`} style={{width: '100%'}}></div>
              </div>
          </div>

          {/* PROFIT/LOSS */}
          <div className={getCardStyle(isProfit ? 'profit' : 'loss')}>
              <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Total Profit / Loss</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <h3 className={`text-4xl font-black tracking-tighter ${theme === 'neon' ? (isProfit ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-red-500 drop-shadow-[0_0_10px_#ef4444]') : (isProfit ? 'text-emerald-400' : 'text-red-400')}`}>
                        {isProfit ? '+' : ''}{currency}{Math.abs(profitLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </h3>
                  </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                  <span className={`text-xs font-black px-3 py-1 rounded border ${theme === 'neon' ? 'shadow-[0_0_15px_currentColor]' : ''} ${isProfit ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' : 'bg-red-500/10 text-red-400 border-red-500/50'}`}>
                      {roi.toFixed(1)}% ROI
                  </span>
                  <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isProfit ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                      {isProfit ? "Growing" : "Down"}
                  </div>
              </div>
          </div>
      </div>

      {/* CONTENT ROW */}
      <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-0">
          
          {/* ASSET TABLE (Allowed to expand vertically) */}
          <div className={`${getCardStyle()} flex-1 !p-0`}>
              
              {/* TABLE HEADER */}
              <div className={`grid grid-cols-12 gap-2 px-6 py-4 border-b text-[10px] font-black uppercase tracking-widest ${theme === 'neon' ? 'border-purple-500/30 bg-purple-900/10 text-purple-400' : 'border-white/5 bg-white/5 text-gray-500'}`}>
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-1 text-right">Date</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-1 text-right">Avg</div>
                  <div className="col-span-1 text-right">Current</div>
                  <div className="col-span-1 text-right">Cost</div>
                  <div className="col-span-1 text-right">Value</div>
                  <div className="col-span-2 text-right">P/L</div>
                  <div className="col-span-1 text-center">Action</div>
              </div>
              
              <div className="overflow-visible">
                  {filteredInvestments.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-gray-500 opacity-50">
                          <Search size={64} className="mb-4 text-purple-900"/>
                          <p className="text-sm font-bold tracking-widest">NO ASSETS FOUND</p>
                      </div>
                  ) : (
                     filteredInvestments.map((inv, index) => { // Added Index for fallback key
                        const displayBuyPrice = convert(inv.buy_price, inv.currency)
                        const displayCurrentPrice = convert(inv.current_price, inv.currency)
                        const itemCost = (inv.quantity || 0) * displayBuyPrice
                        const itemValue = (inv.quantity || 0) * displayCurrentPrice
                        const itemProfit = itemValue - itemCost
                        const itemIsProfit = itemProfit >= 0
                        const itemRoi = itemCost > 0 ? (itemProfit / itemCost) * 100 : 0
                        
                        return (
                         // SAFE KEY: inv.id || inv._id || index
                         <div key={inv.id || inv._id || index} className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b transition group text-sm ${theme === 'neon' ? 'border-purple-500/10 hover:bg-purple-500/5' : 'border-white/5 hover:bg-white/5'}`}>
                             
                             {/* ASSET NAME */}
                             <div className="col-span-3 flex items-center gap-4 overflow-hidden">
                                 <div className={getBadgeColor(inv.category)}>
                                     {(inv.name || '?').charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                     <h4 className={`font-bold truncate transition ${theme === 'neon' ? 'text-white group-hover:text-purple-300' : 'text-gray-200'}`} title={inv.name}>{inv.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-500 font-mono tracking-wide">{inv.ticker}</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="col-span-1 text-gray-500 font-mono text-xs text-right opacity-70">
                                 {inv.date || '-'}
                             </div>

                             <div className="col-span-1 text-right font-bold text-gray-300 font-mono">
                                 {inv.category === 'Gold' ? (inv.quantity || 0).toFixed(3) : (inv.quantity || 0).toLocaleString()}
                             </div>

                             <div className="col-span-1 text-right text-gray-400 font-mono text-xs">
                                 {currency}{displayBuyPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className={`col-span-1 text-right font-bold font-mono ${theme === 'neon' ? 'text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'text-purple-300'}`}>
                                 {currency}{displayCurrentPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-1 text-right text-gray-500 font-mono text-xs">
                                 {currency}{itemCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className={`col-span-1 text-right font-black font-mono ${theme === 'neon' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-white'}`}>
                                 {currency}{itemValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-2 text-right flex flex-col items-end gap-1">
                                 <div className="flex items-center gap-2">
                                     <span className={`font-black text-sm font-mono tracking-tight ${itemIsProfit ? (theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-emerald-400') : (theme === 'neon' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-red-400')}`}>
                                             {itemIsProfit ? '+' : ''}{currency}{Math.abs(itemProfit).toLocaleString(undefined, {maximumFractionDigits: 0})}
                                     </span>
                                 </div>
                                 <span className={`text-[10px] font-bold px-1.5 rounded border ${itemIsProfit ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                     {itemRoi.toFixed(1)}%
                                 </span>
                             </div>

                             <div className="col-span-1 flex justify-center gap-2 opacity-50 group-hover:opacity-100 transition">
                                 <button onClick={() => handleEdit(inv, 'investment')} className={`p-1.5 border rounded-lg transition ${theme === 'neon' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-black hover:shadow-[0_0_10px_#3b82f6]' : 'border-white/10 text-gray-400 hover:text-white'}`}><Edit2 size={14}/></button>
                                 <button onClick={() => handleDelete(inv.id || inv._id, 'investment')} className={`p-1.5 border rounded-lg transition ${theme === 'neon' ? 'border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_10px_#ef4444]' : 'border-white/10 text-gray-400 hover:text-red-400'}`}><Trash2 size={14}/></button>
                             </div>
                          </div>
                        )
                    })
                 )}
             </div>
          </div>

          {/* ALLOCATION CHART (Right Side) */}
          <div className={`${getCardStyle()} w-80 shrink-0`}>
              <h3 className="font-bold text-white mb-6 text-center text-sm uppercase tracking-widest">Allocation</h3>
              <div className="flex-1 w-full min-h-[300px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                         <Pie 
                             data={data} 
                             innerRadius={65} 
                             outerRadius={85} 
                             paddingAngle={5} 
                             dataKey="value" 
                             stroke="none"
                         >
                             {data.map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className={theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : ''} />
                             ))}
                         </Pie>
                         <Tooltip 
                             formatter={(value) => `${currency}${value.toFixed(0)}`} 
                             contentStyle={{ 
                                 backgroundColor: theme === 'neon' ? '#000' : '#1a1b26', 
                                 borderRadius: '12px', 
                                 border: theme === 'neon' ? '1px solid rgba(168,85,247,0.5)' : '1px solid #333', 
                                 boxShadow: theme === 'neon' ? '0 0 20px rgba(168,85,247,0.3)' : '0 10px 15px -3px rgba(0,0,0,0.1)' 
                             }} 
                             itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                         />
                     </PieChart>
                 </ResponsiveContainer>
                 
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                     <div className="text-center">
                         <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'neon' ? 'text-purple-500 drop-shadow-[0_0_5px_#a855f7]' : 'text-gray-500'}`}>Total</p>
                         <p className={`text-white font-black text-sm ${theme === 'neon' ? 'drop-shadow-[0_0_5px_white]' : ''}`}>{currency}{currentValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                     </div>
                 </div>
              </div>

              <div className="mt-4 space-y-3">
                  {data.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs group">
                          <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${theme === 'neon' ? 'shadow-[0_0_8px_currentColor]' : ''}`} style={{backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length]}}></div>
                              <span className="text-gray-400 font-bold group-hover:text-white transition">{entry.name}</span>
                          </div>
                          <span className={`text-white font-mono font-bold ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : ''}`}>{currentValue > 0 ? ((entry.value / currentValue) * 100).toFixed(0) : 0}%</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
      </div>
    </div>
  )
}

export default Investments