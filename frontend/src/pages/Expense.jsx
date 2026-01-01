import { useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, ReferenceLine, CartesianGrid } from 'recharts'
import { Trash2, Edit2, TrendingDown, Plus, Search, Filter, AlertCircle, Calendar as CalendarIcon, X, ArrowUp, ArrowDown } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' 

// ADD handleEdit to props
const Expense = ({ data, openModal, handleDelete, handleEdit, currency }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const ALL_CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Health", "Shopping", "Travel", "Education", "Other"]

  const total = data.reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const categoryStats = data.reduce((acc, item) => {
    const found = acc.find(x => x.name === item.category)
    if (found) found.value += parseFloat(item.amount)
    else acc.push({ name: item.category, value: parseFloat(item.amount) })
    return acc
  }, []).sort((a, b) => b.value - a.value)

  const getLast7Days = () => {
    const dates = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(d.toISOString().split('T')[0]) } return dates
  }
  const last7Days = getLast7Days()
  const dailyData = last7Days.map(date => {
      const daySum = data.filter(t => t.date === date).reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const dateObj = new Date(date)
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = dateObj.getDate()
      return { name: `${dayName} ${dayNum}`, fullDate: date, amount: daySum }
  })
  const averageSpending = dailyData.reduce((sum, d) => sum + d.amount, 0) / 7

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
  const SortIcon = ({ active, direction }) => (!active ? <span className="text-gray-600 opacity-50 ml-1">↕</span> : direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-blue-400"/> : <ArrowDown size={12} className="ml-1 text-blue-400"/>)

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden animate-fade-in space-y-6" onClick={() => setShowCalendar(false)}>
      <div className="flex justify-between items-center shrink-0">
         <div><h2 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingDown className="text-red-500" /> Expense Control</h2><p className="text-gray-500">Analyze patterns and cut unnecessary costs</p></div>
         <div className="flex gap-4"><div className="text-right bg-[#12131e] px-5 py-2 rounded-xl border border-gray-800 shadow-lg"><p className="text-[10px] text-gray-500 uppercase font-bold">Total Outflow</p><h3 className="text-xl font-bold text-red-400">-{currency}{total.toFixed(2)}</h3></div><button onClick={() => openModal('expense')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20"><Plus size={18}/> Add Expense</button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 h-64">
         <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex flex-col shadow-lg col-span-2 relative group">
            <div className="flex justify-between items-start mb-2"><div><h3 className="text-gray-200 font-bold flex items-center gap-2"><AlertCircle size={16} className="text-orange-500"/> Daily Activity</h3><p className="text-xs text-gray-500">Last 7 Days</p></div><div className="text-right"><p className="text-[10px] text-gray-500 uppercase">Daily Avg</p><p className="text-orange-400 font-bold text-lg">{currency}{averageSpending.toFixed(0)}</p></div></div>
            <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} /><XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 10}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#0b0c15', border: '1px solid #374151', borderRadius: '8px' }} /><ReferenceLine y={averageSpending} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#f97316', fontSize: 10 }} /><Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30}>{dailyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.amount > averageSpending * 1.5 ? '#ef4444' : '#374151'} />))}</Bar></ComposedChart></ResponsiveContainer></div>
         </div>
         <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex flex-col shadow-lg overflow-hidden">
            <h3 className="text-gray-200 font-bold mb-4">Top Categories</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {categoryStats.length === 0 && <p className="text-gray-500 text-xs text-center py-4">No data yet</p>}
                {categoryStats.map((cat, index) => { const percent = ((cat.value / total) * 100); return (<div key={index}><div className="flex justify-between text-xs mb-1"><span className="text-gray-300 font-medium">{cat.name}</span><span className="text-gray-500">{currency}{cat.value} ({percent.toFixed(0)}%)</span></div><div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: '#ef4444' }}></div></div></div>)})}
            </div>
         </div>
      </div>

      <div className="flex-1 bg-[#12131e] rounded-2xl border border-gray-800 flex flex-col shadow-lg min-h-0">
         <div className="p-5 border-b border-gray-800 flex justify-between items-center gap-4">
            <h3 className="font-bold text-gray-200 hidden md:block">History</h3>
            <div className="flex flex-1 justify-end gap-3">
                <div className="flex items-center bg-[#0b0c15] border border-gray-700 rounded-lg px-3 py-2 w-48 focus-within:border-blue-500 transition"><Search size={16} className="text-gray-500 mr-2"/><input className="bg-transparent text-xs text-white outline-none w-full placeholder-gray-600" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setShowCalendar(!showCalendar)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition h-full ${dateFilter ? 'bg-blue-600/10 border-blue-600 text-blue-400' : 'bg-[#0b0c15] border-gray-700 text-gray-400 hover:border-gray-500'}`}><CalendarIcon size={16} />{dateFilter || "Filter Date"}{dateFilter && (<div onClick={(e) => { e.stopPropagation(); setDateFilter(''); }} className="ml-1 hover:text-white p-1"><X size={12}/></div>)}</button>{showCalendar && <CustomCalendar selectedDate={dateFilter} onSelect={setDateFilter} onClose={() => setShowCalendar(false)} />}</div>
                <div className="relative"><select className="appearance-none bg-[#0b0c15] border border-gray-700 text-gray-300 text-xs rounded-lg px-4 py-2 pr-8 outline-none cursor-pointer h-full hover:border-gray-500 transition" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">All Categories</option>{ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><Filter size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/></div>
            </div>
         </div>
         <div className="grid grid-cols-12 px-6 py-3 bg-[#1a1b26] text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
             <div className="col-span-5">Description</div><div className="col-span-3">Category</div><div className="col-span-2 flex items-center cursor-pointer hover:text-white" onClick={() => handleSort('date')}>Date <SortIcon active={sortConfig.key === 'date'} direction={sortConfig.direction} /></div><div className="col-span-2 flex items-center justify-end cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>Amount <SortIcon active={sortConfig.key === 'amount'} direction={sortConfig.direction} /></div>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
             {processedData.map(t => (
                 <div key={t.id} className="grid grid-cols-12 px-6 py-4 border-b border-gray-800/50 hover:bg-white/5 transition items-center group">
                     <div className="col-span-5 font-bold text-gray-200 truncate pr-4 flex items-center gap-2">{t.description} {t.recurrence && t.recurrence !== 'None' && (<span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">{t.recurrence}</span>)}</div>
                     <div className="col-span-3"><span className="px-2 py-1 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">{t.category}</span></div>
                     <div className="col-span-2 text-xs text-gray-500">{t.date || 'Today'}</div>
                     <div className="col-span-2 text-right font-bold text-white flex justify-end items-center gap-3">
                         -{currency}{t.amount}
                         {/* --- EDIT AND DELETE BUTTONS --- */}
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleEdit(t, 'expense')} className="text-gray-500 hover:text-blue-500 transition"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-500 transition"><Trash2 size={14}/></button>
                         </div>
                     </div>
                 </div>
             ))}
             {processedData.length === 0 && <div className="text-center py-20 text-gray-500"><Search size={48} className="mx-auto mb-4 opacity-20"/><p>No transactions found.</p></div>}
         </div>
      </div>
    </div>
  )
}

export default Expense