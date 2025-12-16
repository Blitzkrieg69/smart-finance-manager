import { useState } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts'
import { Trash2, TrendingUp, Plus, Search, Filter, Calendar as CalendarIcon, DollarSign, X, ArrowUp, ArrowDown } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' 

const Income = ({ data, openModal, handleDelete, currency }) => { // <--- Added prop
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [chartPeriod, setChartPeriod] = useState('Monthly') 

  const total = data.reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const sourceStats = data.reduce((acc, item) => {
    const found = acc.find(x => x.name === item.category)
    if (found) found.value += parseFloat(item.amount)
    else acc.push({ name: item.category, value: parseFloat(item.amount) })
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
                const tParts = t.date.split('-'); const tDate = new Date(tParts[0], tParts[1] - 1, tParts[2]) 
                return (tDate >= w.start && tDate <= w.end) ? sum + parseFloat(t.amount) : sum
            }, 0)
            return { name: w.label, amount }
        })
    }
    if (chartPeriod === 'Yearly') {
        const years = {}
        data.forEach(t => { const year = t.date.split('-')[0]; years[year] = (years[year] || 0) + parseFloat(t.amount) })
        if (Object.keys(years).length === 0) years[now.getFullYear()] = 0
        return Object.keys(years).sort().map(year => ({ name: year, amount: years[year] }))
    }
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }) })
    }
    return months.map(m => {
        const monthSum = data.filter(t => t.date && t.date.startsWith(m.key)).reduce((sum, t) => sum + parseFloat(t.amount), 0)
        return { name: m.label, amount: monthSum }
    })
  }
  const chartData = getChartData()

  let processedData = data.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
    const matchesDate = !dateFilter || t.date === dateFilter 
    return matchesSearch && matchesCategory && matchesDate
  })

  processedData.sort((a, b) => {
    if (sortConfig.key === 'date') return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)
    if (sortConfig.key === 'amount') return sortConfig.direction === 'asc' ? parseFloat(a.amount) - parseFloat(b.amount) : parseFloat(b.amount) - parseFloat(a.amount)
    return 0
  })

  const handleSort = (key) => { setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc' }) }
  const SortIcon = ({ active, direction }) => (!active ? <span className="text-gray-600 opacity-50 ml-1">↕</span> : direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-emerald-400"/> : <ArrowDown size={12} className="ml-1 text-emerald-400"/>)

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden animate-fade-in space-y-6" onClick={() => setShowCalendar(false)}>
      <div className="flex justify-between items-center shrink-0">
         <div><h2 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Income Analytics</h2><p className="text-gray-500">Track your earnings</p></div>
         <div className="flex gap-4"><div className="text-right bg-[#12131e] px-5 py-2 rounded-xl border border-gray-800 shadow-lg"><p className="text-[10px] text-gray-500 uppercase font-bold">Total Earned</p><h3 className="text-xl font-bold text-emerald-400">+{currency}{total.toFixed(2)}</h3></div><button onClick={() => openModal('income')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"><Plus size={18}/> Add Income</button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 h-64">
         <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex flex-col shadow-lg col-span-2 relative">
            <div className="flex justify-between items-start mb-2"><div><h3 className="text-gray-200 font-bold flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Revenue Growth</h3></div><div className="flex bg-[#0b0c15] rounded-lg p-1 border border-gray-700">{['Weekly', 'Monthly', 'Yearly'].map(period => (<button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 text-[10px] rounded-md transition font-bold ${chartPeriod === period ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:text-white'}`}>{period}</button>))}</div></div>
            <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} /><XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 10}} axisLine={false} tickLine={false} /><Tooltip cursor={{stroke: '#10b981', strokeWidth: 1}} contentStyle={{ backgroundColor: '#0b0c15', border: '1px solid #374151', borderRadius: '8px' }} /><Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" /></AreaChart></ResponsiveContainer></div>
         </div>
         <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex flex-col shadow-lg overflow-hidden">
            <h3 className="text-gray-200 font-bold mb-4">Top Sources</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {sourceStats.length === 0 && <p className="text-gray-500 text-xs text-center py-4">No income recorded</p>}
                {sourceStats.map((cat, index) => { const percent = ((cat.value / total) * 100); return (<div key={index}><div className="flex justify-between text-xs mb-1"><span className="text-gray-300 font-medium">{cat.name}</span><span className="text-gray-500">{currency}{cat.value} ({percent.toFixed(0)}%)</span></div><div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: '#10b981' }}></div></div></div>)})}
            </div>
         </div>
      </div>

      <div className="flex-1 bg-[#12131e] rounded-2xl border border-gray-800 flex flex-col shadow-lg min-h-0">
         <div className="p-5 border-b border-gray-800 flex justify-between items-center gap-4">
            <h3 className="font-bold text-gray-200 hidden md:block">History</h3>
            <div className="flex flex-1 justify-end gap-3">
                <div className="flex items-center bg-[#0b0c15] border border-gray-700 rounded-lg px-3 py-2 w-48 focus-within:border-emerald-500 transition"><Search size={16} className="text-gray-500 mr-2"/><input className="bg-transparent text-xs text-white outline-none w-full placeholder-gray-600" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setShowCalendar(!showCalendar)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition h-full ${dateFilter ? 'bg-emerald-600/10 border-emerald-600 text-emerald-400' : 'bg-[#0b0c15] border-gray-700 text-gray-400 hover:border-gray-500'}`}><CalendarIcon size={16} />{dateFilter || "Filter Date"}{dateFilter && (<div onClick={(e) => { e.stopPropagation(); setDateFilter(''); }} className="ml-1 hover:text-white p-1"><X size={12}/></div>)}</button>{showCalendar && <CustomCalendar selectedDate={dateFilter} onSelect={setDateFilter} onClose={() => setShowCalendar(false)} />}</div>
                <div className="relative"><select className="appearance-none bg-[#0b0c15] border border-gray-700 text-gray-300 text-xs rounded-lg px-4 py-2 pr-8 outline-none cursor-pointer h-full hover:border-gray-500 transition" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">All Sources</option>{sourceStats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select><Filter size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/></div>
            </div>
         </div>
         <div className="grid grid-cols-12 px-6 py-3 bg-[#1a1b26] text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
             <div className="col-span-5">Description</div><div className="col-span-3">Source</div><div className="col-span-2 flex items-center cursor-pointer hover:text-white" onClick={() => handleSort('date')}>Date <SortIcon active={sortConfig.key === 'date'} direction={sortConfig.direction} /></div><div className="col-span-2 flex items-center justify-end cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>Amount <SortIcon active={sortConfig.key === 'amount'} direction={sortConfig.direction} /></div>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
             {processedData.map(t => (
                 <div key={t.id} className="grid grid-cols-12 px-6 py-4 border-b border-gray-800/50 hover:bg-white/5 transition items-center group">
                     <div className="col-span-5 font-bold text-gray-200 truncate pr-4 flex items-center gap-2">{t.description} {t.recurrence && t.recurrence !== 'None' && (<span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">{t.recurrence}</span>)}</div>
                     <div className="col-span-3"><span className="px-2 py-1 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">{t.category}</span></div>
                     <div className="col-span-2 text-xs text-gray-500">{t.date || 'Today'}</div>
                     <div className="col-span-2 text-right font-bold text-emerald-400 flex justify-end items-center gap-4">+{currency}{t.amount}<button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button></div>
                 </div>
             ))}
             {processedData.length === 0 && <div className="text-center py-20 text-gray-500"><Search size={48} className="mx-auto mb-4 opacity-20"/><p>No income found.</p></div>}
         </div>
      </div>
    </div>
  )
}

export default Income