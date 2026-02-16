import { useState } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Trash2, Edit2, Plus, Briefcase, RefreshCw, Layers, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'


const Investments = ({ investments = [], openModal, handleDelete, handleEdit, currency, exchangeRate = 1 }) => {
    const { theme, styles } = useTheme()

    const [refreshing, setRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // --- LOGIC ---
    const convert = (value, assetCurrency) => {
        const val = parseFloat(value || 0);
        if (assetCurrency === 'USD') return val * (exchangeRate || 1);
        if (assetCurrency === 'INR') return val;
        return val * (exchangeRate || 1);
    }

    // --- DISPLAY HELPERS ---
    const isCrypto = (inv) => String(inv?.category || '').toLowerCase() === 'crypto'

    const normalizeExchange = (exch) => {
        const ex = String(exch || '').trim()
        if (!ex || ex.toLowerCase() === 'unknown') return ''
        if (['nse', 'bse', 'nasdaq', 'nyse'].includes(ex.toLowerCase())) return ex.toUpperCase()
        return ex
    }

    const getAssetMetaLine = (inv) => {
        const ticker = String(inv?.ticker || '').trim()
        const exchange = isCrypto(inv) ? '' : normalizeExchange(inv?.exchange)
        const parts = [exchange, ticker].filter(Boolean)
        return parts.join(' • ')
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            const res = await axios.post('http://localhost:5000/api/investments/refresh')
            if (res.status === 200) window.location.reload()
        } catch (err) { 
            alert("Failed to update prices.") 
        } finally { 
            setRefreshing(false) 
        }
    }

    const filteredInvestments = investments.filter(inv =>
        (inv.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.ticker || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.exchange || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    // PORTFOLIO-WIDE STATS (ALL INVESTMENTS - MATCHES ANALYTICS)
    const portfolioInvested = investments.reduce((sum, i) => sum + (parseFloat(i.quantity || 0) * convert(i.buy_price, i.currency)), 0)
    const portfolioValue = investments.reduce((sum, i) => sum + (parseFloat(i.quantity || 0) * convert(i.current_price, i.currency)), 0)
    const portfolioProfitLoss = portfolioValue - portfolioInvested
    const portfolioIsProfit = portfolioProfitLoss >= 0
    const portfolioROI = portfolioInvested > 0 ? (portfolioProfitLoss / portfolioInvested) * 100 : 0

    // FILTERED VIEW STATS (VISIBLE INVESTMENTS ONLY)
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

    const COLORS = theme === 'dark'
        ? ['#a855f7', '#d946ef', '#8b5cf6', '#6366f1', '#ec4899']
        : ['#4B3621', '#654321', '#8B4513', '#A0522D', '#6B4423']

    // --- DYNAMIC STYLES ---
    const getCardStyle = (colorType = 'purple') => {
        const base = `p-6 rounded-2xl border flex flex-col relative transition-all duration-500 overflow-hidden ${styles.card}`

        if (theme !== 'dark') return `${base} shadow-xl`

        switch (colorType) {
            case 'purple': return `${base} border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:border-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]`
            case 'profit': return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]`
            case 'loss': return `${base} border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]`
            default: return base
        }
    }

    const getBadgeColor = (cat) => {
        const base = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border"
        if (theme === 'dark') {
            return cat === 'Crypto'
                ? `${base} bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]`
                : `${base} bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]`
        }
        return cat === 'Crypto'
            ? `${base} bg-orange-100 text-orange-700 border-orange-300`
            : `${base} bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30`
    }

    return (
        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}>
            <div className="p-6 flex flex-col gap-8 min-h-min">

                {/* HEADER */}
                <div className="flex justify-between items-end shrink-0">
                    <div>
                        <h2 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-[#4B3621]'}`}>
                            <Briefcase className={`${theme === 'dark' ? 'text-purple-500 drop-shadow-[0_0_15px_#a855f7]' : 'text-[#4B3621]'}`} size={32} />
                            Portfolio
                        </h2>
                        <p className={`text-sm mt-1 ml-1 tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                            Real-time wealth tracking <span className={`font-mono ${theme === 'dark' ? 'text-purple-500' : 'text-[#4B3621]'}`}>@ ₹{(exchangeRate || 0).toFixed(2)}/USD</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Search className={`absolute left-3 top-2.5 transition ${theme === 'dark' ? 'text-purple-500 drop-shadow-[0_0_5px_#a855f7]' : 'text-[#654321]'}`} size={18} />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                className={`pl-10 pr-4 py-2 rounded-xl outline-none w-48 transition-all focus:w-64 border ${theme === 'dark' ? 'bg-black border-purple-500/40 text-white focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white border-[#C9A87C]/50 text-[#4B3621] focus:border-[#654321]'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition disabled:opacity-50 border ${theme === 'dark' ? 'bg-black border-purple-500/30 text-gray-300 hover:border-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white border-[#C9A87C]/50 text-[#4B3621] hover:border-[#654321]'}`}
                        >
                            <RefreshCw size={18} className={`${refreshing ? "animate-spin" : ""} ${theme === 'dark' ? "text-purple-500" : "text-[#654321]"}`} />
                            {refreshing ? "Updating..." : "Refresh"}
                        </button>

                        <button
                            onClick={() => openModal('investment')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition hover:scale-105 border ${theme === 'dark' ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-400' : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30 shadow-lg hover:bg-[#F5F5DC]/80'}`}
                        >
                            <Plus size={20} /> Add Asset
                        </button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">

                    {/* CURRENT VALUE */}
                    <div className={`${getCardStyle('purple')} group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition pointer-events-none">
                            <Briefcase size={80} className={`${theme === 'dark' ? 'text-purple-500 drop-shadow-[0_0_15px_#a855f7]' : 'text-[#654321]'}`} />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${theme === 'dark' ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'text-[#654321]/70'}`}>Current Value</p>
                        <h3 className={`text-2xl font-black mt-1 tracking-tight ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_#a855f7]' : 'text-[#4B3621]'}`}>
                            {currency}{formatIndianNumber(portfolioValue)}
                        </h3>
                        <p className={`text-[10px] mt-4 flex items-center gap-2 uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                            <Layers size={12} className={theme === 'dark' ? 'text-purple-500' : 'text-[#654321]'} /> {investments.length} Active Assets
                        </p>
                    </div>

                    {/* TOTAL INVESTED */}
                    <div className={getCardStyle('purple')}>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Total Invested</p>
                        <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-gray-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-[#4B3621]'}`}>
                            {currency}{formatIndianNumber(portfolioInvested)}
                        </h3>
                        <div className={`w-full h-1.5 mt-6 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-purple-900/20 border border-purple-500/20' : 'bg-[#FAF9F6] border border-[#C9A87C]/30'}`}>
                            <div className={`h-full rounded-full ${theme === 'dark' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-[#654321]'}`} style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* PROFIT/LOSS - NOW USES PORTFOLIO VALUES */}
                    <div className={getCardStyle(portfolioIsProfit ? 'profit' : 'loss')}>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Total Profit / Loss</p>
                            <div className="flex items-baseline gap-3 mt-2">
                                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? (portfolioIsProfit ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-red-500 drop-shadow-[0_0_10px_#ef4444]') : 'text-[#4B3621]'}`}>
                                    {portfolioIsProfit ? '+' : ''}{currency}{formatIndianNumber(Math.abs(portfolioProfitLoss))}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <span className={`text-xs font-black px-3 py-1 rounded border ${theme === 'dark' ? 'shadow-[0_0_15px_currentColor]' : ''} ${portfolioIsProfit ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' : 'bg-emerald-50 text-emerald-700 border-emerald-300') : (theme === 'dark' ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'bg-red-50 text-red-700 border-red-300')}`}>
                                {portfolioROI.toFixed(1)}% ROI
                            </span>
                            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${portfolioIsProfit ? (theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700') : (theme === 'dark' ? 'text-red-500' : 'text-red-700')}`}>
                                {portfolioIsProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {portfolioIsProfit ? "Growing" : "Down"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT ROW */}
                <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-0">

                    {/* ASSET TABLE */}
                    <div className={`${getCardStyle()} flex-1 !p-0`}>

                        {/* TABLE HEADER */}
                        <div className={`grid grid-cols-12 gap-2 px-6 py-4 border-b text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'border-purple-500/30 bg-purple-900/10 text-purple-400' : 'border-[#C9A87C]/30 bg-[#F5F5DC]/50 text-[#654321]'}`}>
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
                                <div className={`h-64 flex flex-col items-center justify-center opacity-50 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/50'}`}>
                                    <Search size={64} className={`mb-4 ${theme === 'dark' ? 'text-purple-900' : 'text-[#654321]/30'}`} />
                                    <p className="text-sm font-bold tracking-widest">NO ASSETS FOUND</p>
                                </div>
                            ) : (
                                filteredInvestments.map((inv, index) => {
                                    const displayBuyPrice = convert(inv.buy_price, inv.currency)
                                    const displayCurrentPrice = convert(inv.current_price, inv.currency)
                                    const itemCost = (inv.quantity || 0) * displayBuyPrice
                                    const itemValue = (inv.quantity || 0) * displayCurrentPrice
                                    const itemProfit = itemValue - itemCost
                                    const itemIsProfit = itemProfit >= 0
                                    const itemRoi = itemCost > 0 ? (itemProfit / itemCost) * 100 : 0

                                    const metaLine = getAssetMetaLine(inv)

                                    return (
                                        <div key={inv.id || inv._id || index} className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b transition group text-sm ${theme === 'dark' ? 'border-purple-500/10 hover:bg-purple-500/5' : 'border-[#C9A87C]/20 hover:bg-[#F5F5DC]/30'}`}>

                                            {/* ASSET NAME */}
                                            <div className="col-span-3 flex items-center gap-4 overflow-hidden">
                                                <div className={getBadgeColor(inv.category)}>
                                                    {(inv.name || '?').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold truncate transition ${theme === 'dark' ? 'text-white group-hover:text-purple-300' : 'text-[#4B3621]'}`} title={inv.name}>{inv.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-mono tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>
                                                            {metaLine || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`col-span-1 font-mono text-xs text-right opacity-70 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>
                                                {inv.date || '-'}
                                            </div>

                                            <div className={`col-span-1 text-right font-bold font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-[#4B3621]'}`}>
                                                {(inv.quantity || 0).toLocaleString()}
                                            </div>

                                            <div className={`col-span-1 text-right font-mono text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                                                {currency}{formatIndianNumber(displayBuyPrice)}
                                            </div>

                                            <div className={`col-span-1 text-right font-bold font-mono ${theme === 'dark' ? 'text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'text-[#4B3621]'}`}>
                                                {currency}{formatIndianNumber(displayCurrentPrice)}
                                            </div>

                                            <div className={`col-span-1 text-right font-mono text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>
                                                {currency}{formatIndianNumber(itemCost)}
                                            </div>

                                            <div className={`col-span-1 text-right font-black font-mono ${theme === 'dark' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-[#4B3621]'}`}>
                                                {currency}{formatIndianNumber(itemValue)}
                                            </div>

                                            <div className="col-span-2 text-right flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black text-sm font-mono tracking-tight ${itemIsProfit ? (theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-[#4B3621]') : (theme === 'dark' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-[#4B3621]')}`}>
                                                        {itemIsProfit ? '+' : ''}{currency}{formatIndianNumber(Math.abs(itemProfit))}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 rounded border ${itemIsProfit ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700') : (theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-300 text-red-700')}`}>
                                                    {itemRoi.toFixed(1)}%
                                                </span>
                                            </div>

                                            <div className="col-span-1 flex justify-center gap-2 opacity-50 group-hover:opacity-100 transition">
                                                <button onClick={() => handleEdit(inv, 'investment')} className={`p-1.5 border rounded-lg transition ${theme === 'dark' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-black hover:shadow-[0_0_10px_#3b82f6]' : 'border-[#654321]/30 text-[#654321] hover:bg-[#F5F5DC]'}`}><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(inv.id || inv._id, 'investment')} className={`p-1.5 border rounded-lg transition ${theme === 'dark' ? 'border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_10px_#ef4444]' : 'border-red-300 text-red-600 hover:bg-red-50'}`}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* ALLOCATION CHART */}
                    <div className={`${getCardStyle()} w-80 shrink-0`}>
                        <h3 className={`font-bold mb-6 text-center text-sm uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>Allocation</h3>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className={theme === 'dark' ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : ''} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${currency}${formatIndianNumber(value)}`}
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#000' : '#FFF8F0',
                                            borderRadius: '12px',
                                            border: theme === 'dark' ? '1px solid rgba(168,85,247,0.5)' : '1px solid #654321',
                                            boxShadow: theme === 'dark' ? '0 0 20px rgba(168,85,247,0.3)' : '0 10px 15px -3px rgba(75,54,33,0.1)'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#4B3621', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-purple-500 drop-shadow-[0_0_5px_#a855f7]' : 'text-[#654321]/70'}`}>Total</p>
                                    <p className={`font-black text-sm ${theme === 'dark' ? 'text-white drop-shadow-[0_0_5px_white]' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(portfolioValue)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {data.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center text-xs group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'shadow-[0_0_8px_currentColor]' : ''}`} style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}></div>
                                        <span className={`font-bold transition ${theme === 'dark' ? 'text-gray-400 group-hover:text-white' : 'text-[#4B3621]'}`}>{entry.name}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-[#4B3621]'}`}>{portfolioValue > 0 ? ((entry.value / portfolioValue) * 100).toFixed(0) : 0}%</span>
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
