import { useState } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Trash2, Edit2, TrendingUp, Plus, Search, Filter, Calendar as CalendarIcon, DollarSign, X, ArrowUp, ArrowDown } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' 
import { useTheme } from '../context/ThemeContext'

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
        const currentDay = now.getDay(); const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
        const currentMonday = new Date(now); currentMonday.setDate(diff); currentMonday.setHours(0, 0, 0, 0)
        for (let i = 11; i >= 0; i--) {
            const start = new Date(currentMonday); start.setDate(currentMonday.getDate() - (i * 7))
            const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
            const label = `${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`
            weeks.push({ start, end, label })
        }
        return weeks.map(w => {
            const amount = data.reduce((sum, t) => {
                if(!t.date) return sum;
                const tParts = t.date.split('-'); const tDate = new Date(tParts[0], tParts[1] - 1, tParts[2]) 
                return (tDate >= w.start && tDate <= w.end) ? sum + parseFloat(t.amount || 0) : sum
            }, 0)
            return { name: w.label, amount }
        })
    }
    if (chartPeriod === 'Yearly') {
        const years = {}
        data.forEach(t => { 
            if(t.date) {
                const year = t.date.split('-')[0]; 
                years[year] = (years[year] || 0) + parseFloat(t.amount || 0) 
            }
        })
        if (Object.keys(years).length === 0) years[now.getFullYear()] = 0
        return Object.keys(years).sort().map(year => ({ name: year, amount: years[year] }))
    }
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }) })
    }
    return months.map(m => {
        const monthSum = data.filter(t => t.date && t.date.startsWith(m.key)).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
        return { name: m.label, amount: monthSum }
    })
  }
  const chartData = getChartData()

  let processedData = data.filter(t => {
    const desc = t.description || '';
    const cat = t.category || '';
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
  const SortIcon = ({ active, direction }) => (!active ? <span className="text-gray-600 opacity-50 ml-1">↕</span> : direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-emerald-400"/> : <ArrowDown size={12} className="ml-1 text-emerald-400"/>)

  // FIX: Added 'allowOverflow' param to let the calendar popup
  const getCardStyle = (allowOverflow = false) => {
    const base = `p-6 rounded-2xl border flex flex-col relative transition-all duration-500 ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} ${styles.card}`
    if (theme === 'neon') return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]`
    return `${base} shadow-xl shadow-emerald-900/5`
  }

  return (
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`} onClick={() => setShowCalendar(false)}>
      <div className="p-6 flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center shrink-0">
         <div>
            <h2 className={`text-3xl font-bold text-white flex items-center gap-3 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                <TrendingUp size={32} className={`text-emerald-500 ${theme === 'neon' ? 'drop-shadow-[0_0_15px_#10b981]' : ''}`} /> 
                Income Analytics
            </h2>
            <p className="text-gray-400 text-sm mt-1 ml-1">Track your earnings</p>
         </div>
         <div className="flex gap-6">
            <div className={`text-right px-6 py-3 rounded-xl border transition duration-500 ${theme === 'neon' ? 'bg-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 border-white/10'}`}>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-gray-400'}`}>Total Earned</p>
                <h3 className={`text-2xl font-bold text-white ${theme === 'neon' ? 'drop-shadow-[0_0_10px_#10b981]' : ''}`}>+{currency}{total.toFixed(2)}</h3>
            </div>
            <button 
                onClick={() => openModal('income')} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${theme === 'neon' ? 'bg-emerald-600 text-white shadow-[0_0_20px_#10b981] hover:shadow-[0_0_40px_#10b981] border border-emerald-400' : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-500'}`}
            >
                <Plus size={20}/> Add Income
            </button>
         </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0 h-72">
         <div className={`${getCardStyle()} col-span-2 group`}>
            <div className="flex justify-between items-start mb-4">
                <div><h3 className={`text-white font-bold flex items-center gap-2 text-sm tracking-wide ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : ''}`}><DollarSign size={16} className={`text-emerald-400 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_#10b981]' : ''}`}/> REVENUE GROWTH</h3></div>
                <div className={`flex rounded-lg p-1 border ${theme === 'neon' ? 'bg-black border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10'}`}>
                    {['Weekly', 'Monthly', 'Yearly'].map(period => (
                        <button key={period} onClick={() => setChartPeriod(period)} className={`px-4 py-1 text-[10px] rounded-md transition-all font-bold tracking-wider ${chartPeriod === period ? (theme === 'neon' ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' : 'bg-emerald-600 text-white') : 'text-gray-400 hover:text-emerald-400'}`}>{period}</button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={theme === 'neon' ? 0.8 : 0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'neon' ? '#10b981' : '#333'} strokeOpacity={theme === 'neon' ? 0.2 : 0.5} vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4'}} 
                            contentStyle={{ 
                                backgroundColor: theme === 'neon' ? '#000' : '#1a1b26', 
                                border: theme === 'neon' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '8px', 
                                boxShadow: theme === 'neon' ? '0 0 20px #10b981' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                            }} 
                            itemStyle={{color: '#fff', fontWeight: 'bold'}} 
                        />
                        <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" className={theme === 'neon' ? 'drop-shadow-[0_0_10px_#10b981]' : ''} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className={getCardStyle()}>
            <h3 className="text-white font-bold mb-6 text-sm tracking-wide flex items-center gap-2"><div className={`w-2 h-2 bg-emerald-500 rounded-full ${theme === 'neon' ? 'shadow-[0_0_10px_#10b981]' : ''}`}></div>TOP SOURCES</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                {sourceStats.length === 0 && <p className="text-gray-500 text-xs text-center py-10">No income recorded</p>}
                {sourceStats.map((cat, index) => { 
                    const percent = total > 0 ? ((cat.value / total) * 100) : 0; 
                    return (
                        <div key={index} className="group">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-300 font-bold group-hover:text-emerald-300 transition">{cat.name}</span>
                                <span className={`text-emerald-400 font-mono ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : ''}`}>{currency}{cat.value}</span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'neon' ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-white/5'}`}>
                                <div className={`h-full rounded-full ${theme === 'neon' ? 'shadow-[0_0_15px_#10b981]' : ''}`} style={{ width: `${percent}%`, backgroundColor: '#10b981' }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>
         </div>
      </div>

      {/* HISTORY TABLE - FIX: Using getCardStyle(true) to allow overflow */}
      <div className={`${getCardStyle(true)} !p-0`}>
         <div className={`p-5 border-b flex justify-between items-center gap-4 ${theme === 'neon' ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-white/5 bg-white/5'}`}>
            <h3 className="font-bold text-white text-sm hidden md:block tracking-wide">HISTORY</h3>
            <div className="flex flex-1 justify-end gap-4">
                <div className={`flex items-center rounded-xl px-4 py-2 w-56 transition ${theme === 'neon' ? 'bg-black border border-emerald-500/50 focus-within:border-emerald-400 focus-within:shadow-[0_0_15px_#10b981]' : 'bg-black/20 border border-white/10'}`}>
                    <Search size={14} className="text-emerald-500 mr-2"/>
                    <input className="bg-transparent text-xs text-white outline-none w-full placeholder-gray-600 font-medium" placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowCalendar(!showCalendar)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition h-full font-bold tracking-wide ${dateFilter ? (theme === 'neon' ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_#10b981]' : 'bg-emerald-600 text-white') : (theme === 'neon' ? 'bg-black border-emerald-500/50 text-gray-400 hover:text-white hover:border-emerald-400' : 'bg-white/5 border-white/10 text-gray-400')}`}>
                        <CalendarIcon size={14} />{dateFilter || "FILTER DATE"}
                        {dateFilter && (<div onClick={(e) => { e.stopPropagation(); setDateFilter(''); }} className="ml-1 hover:text-black p-0.5 rounded-full"><X size={12}/></div>)}
                    </button>
                    
                    {/* CALENDAR FIX: Positioned ABOVE (bottom-full), High Z-Index, and Scrollable */}
                    {showCalendar && (
                        <div className={`absolute bottom-full right-0 mb-3 z-[100] shadow-2xl rounded-xl ${theme === 'neon' ? 'border border-emerald-500/50 bg-black shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-[#1a1b26] border border-white/20'}`}>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                <CustomCalendar selectedDate={dateFilter} onSelect={setDateFilter} onClose={() => setShowCalendar(false)} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <select className={`appearance-none border text-gray-300 text-xs rounded-xl px-4 py-2 pr-8 outline-none cursor-pointer h-full transition font-bold tracking-wide ${theme === 'neon' ? 'bg-black border-emerald-500/50 hover:border-emerald-400 hover:text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10'}`} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="All" className="bg-black">ALL SOURCES</option>
                        {sourceStats.map(c => <option key={c.name} value={c.name} className="bg-black">{c.name.toUpperCase()}</option>)}
                    </select>
                    <Filter size={12} className="absolute right-3 top-3 text-emerald-500 pointer-events-none"/>
                </div>
            </div>
         </div>

         <div className={`grid grid-cols-12 px-6 py-4 text-[10px] font-black uppercase tracking-widest select-none border-b ${theme === 'neon' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/5'}`}>
             <div className="col-span-5">Description</div>
             <div className="col-span-3">Source</div>
             <div className="col-span-2 flex items-center cursor-pointer hover:text-white transition" onClick={() => handleSort('date')}>Date <SortIcon active={sortConfig.key === 'date'} direction={sortConfig.direction} /></div>
             <div className="col-span-2 flex items-center justify-end cursor-pointer hover:text-white transition" onClick={() => handleSort('amount')}>Amount <SortIcon active={sortConfig.key === 'amount'} direction={sortConfig.direction} /></div>
         </div>

         <div className="overflow-visible">
             {processedData.map((t, index) => (
                 // SAFE KEY: t.id || t._id || index
                 <div key={t.id || t._id || index} className={`grid grid-cols-12 px-6 py-4 border-b transition items-center group ${theme === 'neon' ? 'border-emerald-500/10 hover:bg-emerald-500/5' : 'border-white/5 hover:bg-white/5'}`}>
                     <div className="col-span-5 font-bold text-gray-200 truncate pr-4 flex items-center gap-3 text-sm">
                        {t.description} 
                        {t.recurrence && t.recurrence !== 'None' && (<span className={`text-[9px] px-2 py-0.5 rounded border tracking-wider ${theme === 'neon' ? 'bg-black text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{t.recurrence}</span>)}
                     </div>
                     <div className="col-span-3">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${theme === 'neon' ? 'bg-black text-gray-300 border-emerald-500/30 shadow-[0_0_5px_rgba(16,185,129,0.1)] group-hover:border-emerald-500/60' : 'bg-white/5 text-gray-400 border-white/5'}`}>{t.category}</span>
                     </div>
                     <div className={`col-span-2 text-xs font-mono transition ${theme === 'neon' ? 'text-gray-500 group-hover:text-emerald-300' : 'text-gray-500'}`}>{t.date || 'Today'}</div>
                     <div className={`col-span-2 text-right font-bold text-emerald-400 flex justify-end items-center gap-3 text-sm ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]' : ''}`}>
                         +{currency}{parseFloat(t.amount || 0).toFixed(2)}
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => handleEdit(t, 'income')} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/10 text-gray-400 hover:text-white'}`}><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(t.id || t._id)} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/10 text-gray-400 hover:text-red-500'}`}><Trash2 size={14}/></button>
                         </div>
                     </div>
                 </div>
             ))}
             {processedData.length === 0 && <div className="text-center py-24 text-gray-500"><Search size={48} className="mx-auto mb-4 opacity-20"/><p className="text-sm">No income found.</p></div>}
         </div>
      </div>
      </div>
    </div>
  )
}

export default Income