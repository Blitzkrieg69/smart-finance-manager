import { useState } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Trash2, Edit2, TrendingUp, Plus, Search, Filter, Calendar as CalendarIcon, DollarSign, X, ArrowUp, ArrowDown } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'

const Income = ({ data = [], openModal, handleDelete, handleEdit, currency }) => {
    const { theme, styles } = useTheme()

    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [dateFilter, setDateFilter] = useState('')
    const [showCalendar, setShowCalendar] = useState(false)
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
    const [chartPeriod, setChartPeriod] = useState('Monthly')

    // SAFE TOTAL CALCULATION
    const total = data.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

    const sourceStats = data.reduce((acc, item) => {
        const found = acc.find(x => x.name === item.category)
        if (found) found.value += parseFloat(item.amount || 0)
        else acc.push({ name: item.category, value: parseFloat(item.amount || 0) })
        return acc
    }, []).sort((a, b) => b.value - a.value)

    const getChartData = () => {
        const now = new Date()
        
        if (chartPeriod === 'Weekly') {
            const weeks = []
            
            // Get the most recent Monday
            const today = new Date(now)
            today.setHours(0, 0, 0, 0)
            const dayOfWeek = today.getDay()
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, else go to Monday
            const recentMonday = new Date(today)
            recentMonday.setDate(today.getDate() + diff)
            
            // Generate 12 weeks ending with the most recent Monday
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(recentMonday)
                weekStart.setDate(recentMonday.getDate() - (i * 7))
                weekStart.setHours(0, 0, 0, 0)
                
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                weekEnd.setHours(23, 59, 59, 999)
                
                const label = `${weekStart.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })}`
                weeks.push({ start: weekStart, end: weekEnd, label })
            }
            
            return weeks.map(w => {
                const amount = data.reduce((sum, t) => {
                    if (!t.date) return sum
                    
                    // Parse the date string properly (YYYY-MM-DD format)
                    const dateParts = t.date.split('-')
                    const transactionDate = new Date(
                        parseInt(dateParts[0]), 
                        parseInt(dateParts[1]) - 1, 
                        parseInt(dateParts[2])
                    )
                    transactionDate.setHours(0, 0, 0, 0)
                    
                    // Compare timestamps
                    if (transactionDate >= w.start && transactionDate <= w.end) {
                        return sum + parseFloat(t.amount || 0)
                    }
                    return sum
                }, 0)
                
                return { name: w.label, amount }
            })
        }
        
        if (chartPeriod === 'Yearly') {
            const years = {}
            data.forEach(t => {
                if (t.date) {
                    const year = t.date.split('-')[0]
                    years[year] = (years[year] || 0) + parseFloat(t.amount || 0)
                }
            })
            if (Object.keys(years).length === 0) years[now.getFullYear()] = 0
            return Object.keys(years).sort().map(year => ({ name: year, amount: years[year] }))
        }
        
        // Monthly (default)
        const months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            months.push({ 
                key: d.toISOString().slice(0, 7), 
                label: d.toLocaleDateString('en-US', { month: 'short' }) 
            })
        }
        
        return months.map(m => {
            const monthSum = data
                .filter(t => t.date && t.date.startsWith(m.key))
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
            return { name: m.label, amount: monthSum }
        })
    }
    
    const chartData = getChartData()

    let processedData = data.filter(t => {
        const desc = t.description || ''
        const cat = t.category || ''
        const matchesSearch = desc.toLowerCase().includes(searchTerm.toLowerCase()) || cat.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
        const matchesDate = !dateFilter || t.date === dateFilter
        return matchesSearch && matchesCategory && matchesDate
    })

    processedData.sort((a, b) => {
        if (sortConfig.key === 'date') return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)
        if (sortConfig.key === 'amount') return sortConfig.direction === 'asc' ? parseFloat(a.amount || 0) - parseFloat(b.amount || 0) : parseFloat(b.amount || 0) - parseFloat(a.amount || 0)
        return 0
    })

    const handleSort = (key) => { setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc' }) }
    const SortIcon = ({ active, direction }) => (!active ? <span className={`opacity-50 ml-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#654321]/50'}`}>↕</span> : direction === 'asc' ? <ArrowUp size={12} className={`ml-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-[#4B3621]'}`} /> : <ArrowDown size={12} className={`ml-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-[#4B3621]'}`} />)

    const getCardStyle = (allowOverflow = false) => {
        const base = `p-6 rounded-2xl border flex flex-col relative transition-all duration-500 ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} ${styles.card}`
        if (theme === 'dark') return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]`
        return `${base} shadow-xl`
    }

    // --- DATE FORMATTER HELPER ---
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Today'
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        })
    }

    return (
        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`} onClick={() => setShowCalendar(false)}>
            <div className="p-6 flex flex-col gap-8">

                {/* HEADER */}
                <div className="flex justify-between items-center shrink-0">
                    <div>
                        <h2 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-[#4B3621]'}`}>
                            <TrendingUp size={32} className={`${theme === 'dark' ? 'text-emerald-500 drop-shadow-[0_0_15px_#10b981]' : 'text-[#4B3621]'}`} />
                            Income Analytics
                        </h2>
                        <p className={`text-sm mt-1 ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Track your earnings</p>
                    </div>
                    <div className="flex gap-6">
                        <div className={`text-right px-6 py-3 rounded-xl border transition duration-500 ${theme === 'dark' ? 'bg-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-[#F5F5DC] border-[#654321]/30 shadow-lg'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-[#654321]/70'}`}>Total Earned</p>
                            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_#10b981]' : 'text-[#4B3621]'}`}>+{currency}{formatIndianNumber(total)}</h3>
                        </div>
                        <button
                            onClick={() => openModal('income')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 border ${theme === 'dark' ? 'bg-emerald-600 text-white shadow-[0_0_20px_#10b981] hover:shadow-[0_0_40px_#10b981] border-emerald-400' : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30 shadow-lg hover:bg-[#F5F5DC]/80'}`}
                        >
                            <Plus size={20} /> Add Income
                        </button>
                    </div>
                </div>

                {/* CHARTS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0 h-72">
                    <div className={`${getCardStyle()} col-span-2 group`}>
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className={`font-bold flex items-center gap-2 text-sm tracking-wide ${theme === 'dark' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-[#4B3621]'}`}><DollarSign size={16} className={`${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-[#4B3621]'}`} /> REVENUE GROWTH</h3></div>
                            <div className={`flex rounded-lg p-1 border ${theme === 'dark' ? 'bg-black border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white border-[#C9A87C]/50'}`}>
                                {['Weekly', 'Monthly', 'Yearly'].map(period => (
                                    <button key={period} onClick={() => setChartPeriod(period)} className={`px-4 py-1 text-[10px] rounded-md transition-all font-bold tracking-wider ${chartPeriod === period ? (theme === 'dark' ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' : 'bg-[#F5F5DC] text-[#4B3621] border border-[#654321]/30') : (theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-[#654321]/60 hover:text-[#4B3621]')}`}>{period}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme === 'dark' ? "#10b981" : "#654321"} stopOpacity={theme === 'dark' ? 0.8 : 0.4} /><stop offset="95%" stopColor={theme === 'dark' ? "#10b981" : "#654321"} stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#10b981' : '#C9A87C'} strokeOpacity={theme === 'dark' ? 0.2 : 0.4} vertical={false} />
                                    <XAxis dataKey="name" stroke={theme === 'dark' ? "#6b7280" : "#654321"} tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#654321' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ stroke: theme === 'dark' ? '#10b981' : '#654321', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#000' : '#FFF8F0',
                                            border: theme === 'dark' ? '1px solid #10b981' : '1px solid #654321',
                                            borderRadius: '8px',
                                            boxShadow: theme === 'dark' ? '0 0 20px #10b981' : '0 10px 15px -3px rgba(75, 54, 33, 0.1)'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#4B3621', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke={theme === 'dark' ? "#10b981" : "#654321"} strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" className={theme === 'dark' ? 'drop-shadow-[0_0_10px_#10b981]' : ''} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={getCardStyle()}>
                        <h3 className={`font-bold mb-6 text-sm tracking-wide flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}><div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-[#654321]'}`}></div>TOP SOURCES</h3>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                            {sourceStats.length === 0 && <p className={`text-xs text-center py-10 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/50'}`}>No income recorded</p>}
                            {sourceStats.map((cat, index) => {
                                const percent = total > 0 ? ((cat.value / total) * 100) : 0
                                return (
                                    <div key={index} className="group">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className={`font-bold transition ${theme === 'dark' ? 'text-gray-300 group-hover:text-emerald-300' : 'text-[#4B3621]'}`}>{cat.name}</span>
                                            <span className={`font-mono ${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(cat.value)}</span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-[#FAF9F6] border border-[#C9A87C]/30'}`}>
                                            <div className={`h-full rounded-full ${theme === 'dark' ? 'shadow-[0_0_15px_#10b981]' : ''}`} style={{ width: `${percent}%`, backgroundColor: theme === 'dark' ? '#10b981' : '#654321' }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* HISTORY TABLE */}
                <div className={`${getCardStyle(true)} !p-0`}>
                    <div className={`p-5 border-b flex justify-between items-center gap-4 ${theme === 'dark' ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-[#C9A87C]/30 bg-[#F5F5DC]/30'}`}>
                        <h3 className={`font-bold text-sm hidden md:block tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>HISTORY</h3>
                        <div className="flex flex-1 justify-end gap-4">
                            <div className={`flex items-center rounded-xl px-4 py-2 w-56 transition border ${theme === 'dark' ? 'bg-black border-emerald-500/50 focus-within:border-emerald-400 focus-within:shadow-[0_0_15px_#10b981]' : 'bg-white border-[#C9A87C]/50 focus-within:border-[#654321]'}`}>
                                <Search size={14} className={`mr-2 ${theme === 'dark' ? 'text-emerald-500' : 'text-[#654321]'}`} />
                                <input className={`bg-transparent text-xs outline-none w-full font-medium ${theme === 'dark' ? 'text-white placeholder-gray-600' : 'text-[#4B3621] placeholder-[#654321]/40'}`} placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setShowCalendar(!showCalendar)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition h-full font-bold tracking-wide ${dateFilter ? (theme === 'dark' ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_#10b981]' : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/50') : (theme === 'dark' ? 'bg-black border-emerald-500/50 text-gray-400 hover:text-white hover:border-emerald-400' : 'bg-white border-[#C9A87C]/50 text-[#654321]/70 hover:text-[#4B3621]')}`}>
                                    <CalendarIcon size={14} />{dateFilter || "FILTER DATE"}
                                    {dateFilter && (<div onClick={(e) => { e.stopPropagation(); setDateFilter('') }} className={`ml-1 p-0.5 rounded-full ${theme === 'dark' ? 'hover:text-black' : 'hover:text-red-600'}`}><X size={12} /></div>)}
                                </button>

                                {showCalendar && (
                                    <div className={`absolute bottom-full right-0 mb-3 z-[100] shadow-2xl rounded-xl border ${theme === 'dark' ? 'border-emerald-500/50 bg-black shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-lg'}`}>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                            <CustomCalendar selectedDate={dateFilter} onSelect={setDateFilter} onClose={() => setShowCalendar(false)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <select className={`appearance-none border text-xs rounded-xl px-4 py-2 pr-8 outline-none cursor-pointer h-full transition font-bold tracking-wide ${theme === 'dark' ? 'bg-black border-emerald-500/50 text-gray-300 hover:border-emerald-400 hover:text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white border-[#C9A87C]/50 text-[#4B3621] hover:border-[#654321]'}`} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                    <option value="All" className={theme === 'dark' ? "bg-black" : "bg-white"}>ALL SOURCES</option>
                                    {sourceStats.map(c => <option key={c.name} value={c.name} className={theme === 'dark' ? "bg-black" : "bg-white"}>{c.name.toUpperCase()}</option>)}
                                </select>
                                <Filter size={12} className={`absolute right-3 top-3 pointer-events-none ${theme === 'dark' ? 'text-emerald-500' : 'text-[#654321]'}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`grid grid-cols-12 px-6 py-4 text-[10px] font-black uppercase tracking-widest select-none border-b ${theme === 'dark' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' : 'bg-[#F5F5DC]/50 text-[#654321] border-[#C9A87C]/30'}`}>
                        <div className="col-span-5">Description</div>
                        <div className="col-span-2">Source</div>
                        <div className={`col-span-2 flex items-center cursor-pointer transition ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4B3621]'}`} onClick={() => handleSort('date')}>Date <SortIcon active={sortConfig.key === 'date'} direction={sortConfig.direction} /></div>
                        <div className={`col-span-2 flex items-center justify-end cursor-pointer transition text-right ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4B3621]'}`} onClick={() => handleSort('amount')}>Amount <SortIcon active={sortConfig.key === 'amount'} direction={sortConfig.direction} /></div>
                        <div className="col-span-1 text-center">Actions</div>
                    </div>

                    <div className="overflow-visible">
                        {processedData.map((t, index) => (
                            <div key={t.id || t._id || index} className={`grid grid-cols-12 px-6 py-4 border-b transition items-center group ${theme === 'dark' ? 'border-emerald-500/10 hover:bg-emerald-500/5' : 'border-[#C9A87C]/20 hover:bg-[#F5F5DC]/30'}`}>
                                <div className={`col-span-5 font-bold truncate pr-4 flex items-center gap-3 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-[#4B3621]'}`}>
                                    {t.description}
                                    {t.recurrence && t.recurrence !== 'None' && (<span className={`text-[9px] px-2 py-0.5 rounded border tracking-wider ${theme === 'dark' ? 'bg-black text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30'}`}>{t.recurrence}</span>)}
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${theme === 'dark' ? 'bg-black text-gray-300 border-emerald-500/30 shadow-[0_0_5px_rgba(16,185,129,0.1)] group-hover:border-emerald-500/60' : 'bg-white text-[#654321] border-[#C9A87C]/50'}`}>{t.category}</span>
                                </div>
                                <div className={`col-span-2 text-xs font-mono transition ${theme === 'dark' ? 'text-gray-500 group-hover:text-emerald-300' : 'text-[#654321]/70'}`}>
                                    {formatDate(t.date)}
                                </div>
                                <div className={`col-span-2 font-bold text-sm text-right ${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]' : 'text-[#4B3621]'}`}>
                                    <span className="whitespace-nowrap">+{currency}{formatIndianNumber(parseFloat(t.amount || 0))}</span>
                                </div>
                                <div className="col-span-1 flex justify-center gap-2">
                                    <button onClick={() => handleEdit(t, 'income')} className={`p-1.5 rounded-lg transition border ${theme === 'dark' ? 'bg-black border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white text-[#654321] border-[#654321]/30 hover:bg-[#F5F5DC]'}`}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id || t._id)} className={`p-1.5 rounded-lg transition border ${theme === 'dark' ? 'bg-black border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {processedData.length === 0 && <div className={`text-center py-24 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}><Search size={48} className="mx-auto mb-4 opacity-20" /><p className="text-sm">No income found.</p></div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Income
