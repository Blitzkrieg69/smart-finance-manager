import { useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Trash2, Edit2, Plus, Briefcase, RefreshCw, Layers, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const Investments = ({ investments, openModal, handleDelete, handleEdit, currency, exchangeRate }) => {
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // --- CONVERTER (MODIFIED FOR INR ONLY) ---
  const convert = (value, assetCurrency) => {
      // Always target INR
      if (assetCurrency === 'USD') return value * exchangeRate; // Convert USD to INR
      if (assetCurrency === 'INR') return value; // Already INR
      // Fallback for Crypto/Gold if stored in USD
      return value * exchangeRate; 
  }

  const handleRefresh = async () => {
      setRefreshing(true)
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/investments/refresh')
          if(res.status === 200) window.location.reload()
      } catch (err) { alert("Failed to update prices.") } 
      finally { setRefreshing(false) }
  }

  const filteredInvestments = investments.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalInvested = filteredInvestments.reduce((sum, i) => sum + (i.quantity * convert(i.buy_price, i.currency)), 0)
  const currentValue = filteredInvestments.reduce((sum, i) => sum + (i.quantity * convert(i.current_price, i.currency)), 0)
  const profitLoss = currentValue - totalInvested
  const isProfit = profitLoss >= 0
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

  const allocationMap = filteredInvestments.reduce((acc, item) => {
      const val = item.quantity * convert(item.current_price, item.currency)
      acc[item.category] = (acc[item.category] || 0) + val
      return acc
  }, {})
  const data = Object.keys(allocationMap).map(key => ({ name: key, value: allocationMap[key] }))
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

  const getBadgeColor = (cat) => {
    switch(cat) {
        case 'Crypto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'Gold': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  }

  const getExchangeBadge = (exch) => {
      if (!exch || exch === 'Unknown') return null;
      const e = exch.toUpperCase();
      if (e.includes('NSE') || e.includes('BSE')) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      if (e.includes('NAS') || e.includes('NYQ') || e.includes('NYSE')) return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      if (e.includes('CCC')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      return 'bg-gray-700/30 text-gray-400 border border-gray-600/30';
  }

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden animate-fade-in space-y-6">
       
       <div className="flex justify-between items-end shrink-0">
         <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Briefcase className="text-purple-500" /> Investment Portfolio
           </h2>
           {/* Updated text to reflect INR base */}
           <p className="text-gray-500">Real-time wealth tracking (INR Base @ ₹{exchangeRate.toFixed(2)}/USD)</p>
         </div>
         
         <div className="flex gap-3">
             <div className="relative group">
                <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-blue-500 transition" size={18} />
                <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="bg-[#1a1b26] border border-gray-700 text-white pl-10 pr-4 py-2 rounded-xl outline-none focus:border-blue-500 w-48 transition focus:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

             <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-[#1a1b26] border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-800 hover:text-white transition disabled:opacity-50">
                <RefreshCw size={18} className={refreshing ? "animate-spin text-purple-500" : ""} /> {refreshing ? "Updating..." : "Refresh"}
             </button>
             <button onClick={() => openModal('investment')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20">
                <Plus size={18}/> Add Asset
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Briefcase size={64} className="text-purple-500" /></div>
              <p className="text-gray-500 text-xs font-bold uppercase">Current Value</p>
              <h3 className="text-3xl font-bold text-white mt-1">{currency}{currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Layers size={12}/> {filteredInvestments.length} Assets Shown</p>
          </div>

          <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 shadow-lg">
              <p className="text-gray-500 text-xs font-bold uppercase">Total Invested</p>
              <h3 className="text-3xl font-bold text-gray-300 mt-1">{currency}{totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
              <div className="w-full bg-gray-800 h-1 mt-4 rounded-full"><div className="bg-gray-600 h-1 rounded-full" style={{width: '100%'}}></div></div>
          </div>

          <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase">Total Profit / Loss</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <h3 className={`text-3xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{isProfit ? '+' : ''}{currency}{profitLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{roi.toFixed(1)}% ROI</span>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  {isProfit ? <TrendingUp size={14} className="text-emerald-500"/> : <TrendingDown size={14} className="text-red-500"/>}
                  {isProfit ? "Portfolio is growing" : "Portfolio is down"}
              </div>
          </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
          
          <div className="flex-1 bg-[#12131e] rounded-2xl border border-gray-800 flex flex-col shadow-lg overflow-hidden">
             
             <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 bg-[#0b0c15]/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                 <div className="col-span-3">Asset</div>
                 <div className="col-span-1 text-right">Date</div>
                 <div className="col-span-1 text-right">Qty</div>
                 <div className="col-span-1 text-right">Avg</div>
                 <div className="col-span-1 text-right">Current</div>
                 <div className="col-span-1 text-right">Cost</div>
                 <div className="col-span-1 text-right">Value</div>
                 <div className="col-span-2 text-right">Profit / Loss</div>
                 <div className="col-span-1 text-center">Action</div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {filteredInvestments.length === 0 ? (
                     <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                         <Search size={48} className="mb-4 opacity-20"/>
                         <p>No assets found matching "{searchTerm}"</p>
                     </div>
                 ) : (
                    filteredInvestments.map(inv => {
                        const displayBuyPrice = convert(inv.buy_price, inv.currency)
                        const displayCurrentPrice = convert(inv.current_price, inv.currency)
                        
                        const itemCost = inv.quantity * displayBuyPrice
                        const itemValue = inv.quantity * displayCurrentPrice
                        const itemProfit = itemValue - itemCost
                        const itemIsProfit = itemProfit >= 0
                        const itemRoi = itemCost > 0 ? (itemProfit / itemCost) * 100 : 0
                        
                        return (
                         <div key={inv.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-gray-800 hover:bg-white/5 transition group text-sm">
                             
                             <div className="col-span-3 flex items-center gap-3 overflow-hidden">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getBadgeColor(inv.category)}`}>
                                     {inv.name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                     <h4 className="font-bold text-white truncate" title={inv.name}>{inv.name}</h4>
                                     <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-gray-500">{inv.ticker}</span>
                                        {inv.exchange && inv.exchange !== 'Unknown' && (
                                            <span className={`text-[8px] font-bold px-1.5 py-0 rounded ${getExchangeBadge(inv.exchange)}`}>
                                                {inv.exchange}
                                            </span>
                                        )}
                                        <span className="text-[9px] bg-gray-700 text-gray-300 px-1 rounded">{inv.currency}</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="col-span-1 text-gray-500 font-medium text-xs text-right">
                                 {inv.date || '-'}
                             </div>

                             <div className="col-span-1 text-right font-bold text-gray-300">
                                 {inv.category === 'Gold' ? inv.quantity.toFixed(3) : inv.quantity.toLocaleString()}
                             </div>

                             <div className="col-span-1 text-right text-gray-300">
                                 {currency}{displayBuyPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-1 text-right text-gray-300">
                                 {currency}{displayCurrentPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-1 text-right text-gray-400 font-medium">
                                 {currency}{itemCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-1 text-right font-bold text-white">
                                 {currency}{itemValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                             </div>

                             <div className="col-span-2 text-right flex flex-col items-end gap-1">
                                 <div className="flex items-center gap-2">
                                     <span className={`font-bold text-sm ${itemIsProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                         {itemIsProfit ? '+' : ''}{currency}{itemProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                     </span>
                                     <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${itemIsProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                         {itemRoi.toFixed(1)}%
                                     </span>
                                 </div>
                             </div>

                             <div className="col-span-1 flex justify-center gap-2">
                                 <button onClick={() => handleEdit(inv, 'investment')} className="p-1.5 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-500 transition" title="Edit">
                                    <Edit2 size={15}/>
                                 </button>
                                 <button onClick={() => handleDelete(inv.id, 'investment')} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition" title="Delete">
                                    <Trash2 size={15}/>
                                 </button>
                             </div>
                         </div>
                        )
                    })
                 )}
             </div>
          </div>

          <div className="w-80 bg-[#12131e] rounded-2xl border border-gray-800 flex flex-col shadow-lg p-5 shrink-0 hidden xl:flex">
             <h3 className="font-bold text-gray-200 mb-4 text-center">Allocation</h3>
             <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${currency}${value.toFixed(0)}`} contentStyle={{ backgroundColor: '#0b0c15', borderRadius: '8px', border: '1px solid #374151' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                        <p className="text-white font-bold text-sm">{currency}{currentValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                </div>
             </div>
             <div className="mt-4 space-y-2">
                 {data.map((entry, index) => (
                     <div key={index} className="flex justify-between items-center text-xs">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                             <span className="text-gray-400">{entry.name}</span>
                         </div>
                         <span className="text-white font-bold">{((entry.value / currentValue) * 100).toFixed(0)}%</span>
                     </div>
                 ))}
             </div>
          </div>

      </div>
    </div>
  )
}

export default Investments