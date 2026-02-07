import { BarChart, Bar, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { useTheme } from '../context/ThemeContext' 

const Dashboard = ({ transactions, budgets, openModal, currency }) => {
  const { theme, styles } = useTheme() 
  
  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const balance = totalIncome - totalExpense

  const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444']

  const performanceData = transactions.slice(-7).map((t, i) => ({
    name: t.date || `Tx ${i + 1}`,
    income: t.type === 'income' ? parseFloat(t.amount || 0) : 0,
    expense: t.type === 'expense' ? parseFloat(t.amount || 0) : 0
  }))

  const expensePieData = expenses.reduce((acc, item) => {
    const found = acc.find(x => x.name === item.category)
    if (found) found.value += parseFloat(item.amount || 0)
    else acc.push({ name: item.category, value: parseFloat(item.amount || 0) })
    return acc
  }, [])

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl border ${theme === 'neon' ? 'bg-black border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-[#12131e] border-white/10 shadow-xl'}`}>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
          {payload.map((p, index) => (
             <div key={index} className="flex justify-between gap-4 text-xs font-bold mb-1 last:mb-0">
               <span style={{ color: p.color }}>{p.name}:</span>
               <span className={`font-mono ${theme === 'neon' ? 'text-white' : 'text-gray-200'}`}>{currency}{p.value.toFixed(2)}</span>
             </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Card Style Generator
  const getCardStyle = (colorType) => {
      const base = `p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden group flex flex-col ${styles.card}`
      
      if (theme !== 'neon') return `${base} shadow-lg`

      switch(colorType) {
          case 'blue': return `${base} border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:border-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]`
          case 'green': return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]`
          case 'red': return `${base} border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:border-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]`
          default: return base
      }
  }

  return (
    <div className={`flex flex-col gap-6 h-full w-full animate-fade-in p-6 overflow-y-auto custom-scrollbar ${styles.bg}`}>
       
       {/* 1. STATS ROW */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
           {/* BALANCE */}
           <div className={getCardStyle('blue')}>
              <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'neon' ? 'text-blue-400 drop-shadow-[0_0_5px_#3b82f6]' : 'text-gray-400'}`}>Total Balance</p>
                    <h3 className={`text-4xl font-black tracking-tighter ${theme === 'neon' ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'text-white'}`}>
                        {currency}{balance.toFixed(2)}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'neon' ? 'bg-blue-900/20 border-blue-500/40 shadow-[0_0_15px_#3b82f6] group-hover:scale-110' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                    <Wallet className={theme === 'neon' ? 'text-blue-500' : 'text-blue-500'} size={28}/>
                  </div>
              </div>
           </div>

           {/* INCOME */}
           <div className={getCardStyle('green')}>
              <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-gray-400'}`}>Total Income</p>
                    <h3 className={`text-3xl font-black tracking-tighter ${theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-emerald-400'}`}>
                        +{currency}{totalIncome.toFixed(2)}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'neon' ? 'bg-emerald-900/20 border-emerald-500/40 shadow-[0_0_15px_#10b981] group-hover:scale-110' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                    <TrendingUp className={theme === 'neon' ? 'text-emerald-500' : 'text-emerald-500'} size={28}/>
                  </div>
              </div>
           </div>

           {/* EXPENSE */}
           <div className={getCardStyle('red')}>
              <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'neon' ? 'text-red-400 drop-shadow-[0_0_5px_#ef4444]' : 'text-gray-400'}`}>Total Expenses</p>
                    <h3 className={`text-3xl font-black tracking-tighter ${theme === 'neon' ? 'text-red-500 drop-shadow-[0_0_10px_#ef4444]' : 'text-red-400'}`}>
                        -{currency}{totalExpense.toFixed(2)}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'neon' ? 'bg-red-900/20 border-red-500/40 shadow-[0_0_15px_#ef4444] group-hover:scale-110' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <TrendingDown className={theme === 'neon' ? 'text-red-500' : 'text-red-500'} size={28}/>
                  </div>
              </div>
           </div>
       </div>

       {/* 2. CHARTS ROW (Balanced Height) */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80 shrink-0">
          
          {/* MAIN CHART */}
          <div className={`lg:col-span-2 ${getCardStyle('blue')}`}>
            <h3 className={`font-bold text-sm text-white mb-4 flex items-center gap-3 tracking-widest uppercase ${theme === 'neon' ? 'drop-shadow-[0_0_5px_#3b82f6]' : ''}`}>
                <Activity size={16} className={theme === 'neon' ? "text-blue-500" : "text-gray-400"}/> 
                Financial Performance
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} barGap={6}>
                  <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'neon' ? '#1e3a8a' : '#333'} strokeOpacity={0.4} vertical={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                  <Bar dataKey="income" name="Income" fill={theme === 'neon' ? "url(#incomeGradient)" : "#10b981"} radius={[4, 4, 0, 0]} barSize={12} className={theme === 'neon' ? 'drop-shadow-[0_0_8px_#3b82f6]' : ''} />
                  <Bar dataKey="expense" name="Expense" fill={theme === 'neon' ? "url(#expenseGradient)" : "#ef4444"} radius={[4, 4, 0, 0]} barSize={12} className={theme === 'neon' ? 'drop-shadow-[0_0_8px_#ef4444]' : ''} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART */}
          <div className={getCardStyle('blue')}>
             <h3 className="font-bold text-sm text-white mb-2 tracking-widest uppercase">Expense Breakdown</h3>
             <div className="flex-1 w-full min-h-0 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie 
                    data={expensePieData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={6} 
                    dataKey="value" 
                    stroke="none"
                   >
                     {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className={theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : ''} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] text-gray-400 ml-1 font-bold">{value.toUpperCase()}</span>}/>
                 </PieChart>
               </ResponsiveContainer>
               
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                   <div className="text-center">
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'neon' ? 'text-blue-500 drop-shadow-[0_0_5px_#3b82f6]' : 'text-gray-500'}`}>Total</p>
                       <p className="text-xs font-black text-white">SPEND</p>
                   </div>
               </div>
             </div>
          </div>
       </div>

       {/* 3. BOTTOM ROW (Balanced Height) */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px] shrink-0">
          
          {/* TRANSACTIONS */}
          <div className={getCardStyle('blue')}>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-sm text-white tracking-widest uppercase">Recent Transactions</h3>
               <button 
                  onClick={() => openModal('expense')} 
                  className={`text-[10px] font-bold px-4 py-2 rounded-lg transition duration-300 ${theme === 'neon' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white'}`}
               >
                 + QUICK ADD
               </button>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {/* CHANGED TO SLICE(-5) FOR LIMIT OF 5 */}
                {transactions.slice(-5).reverse().map((t, index) => ( 
                  <div key={t.id || t._id || index} className={`flex justify-between items-center p-3 rounded-xl transition border border-transparent group ${theme === 'neon' ? 'hover:bg-white/5 hover:border-blue-500/30' : 'hover:bg-white/5 hover:border-white/10'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} ${theme === 'neon' ? 'shadow-[0_0_10px_rgba(0,0,0,0.5)]' : ''}`}>
                          {t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                        </div>
                        <div>
                           <p className={`font-bold text-xs group-hover:text-white transition uppercase tracking-wide ${theme === 'neon' ? 'text-gray-200' : 'text-gray-300'}`}>{t.category}</p>
                           <p className="text-[10px] text-gray-500">{t.description || '-'}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${t.type === 'income' ? (theme === 'neon' ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-emerald-400') : 'text-white'}`}>
                        {t.type === 'income' ? '+' : '-'}{currency}{Math.abs(parseFloat(t.amount || 0)).toFixed(2)}
                      </span>
                  </div>
                ))}
             </div>
          </div>

          {/* BUDGET HEALTH */}
          <div className={getCardStyle('blue')}>
             <h3 className="font-bold text-sm text-white mb-4 tracking-widest uppercase">Budget Health</h3>
             <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                {budgets.map((b, index) => { 
                  const spent = expenses
                    .filter(e => e.category === b.category)
                    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                  
                  const limit = parseFloat(b.limit || 1)
                  const percent = Math.min((spent / limit) * 100, 100)
                  
                  let color = percent >= 100 ? "bg-red-500" : percent > 80 ? "bg-yellow-500" : "bg-blue-500"
                  let shadowColor = percent >= 100 ? "#ef4444" : percent > 80 ? "#f59e0b" : "#3b82f6"
                  let textColor = percent >= 100 ? "text-red-400" : percent > 80 ? "text-yellow-400" : "text-blue-400"
                  
                  return (
                    <div key={b.id || b._id || index}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-gray-300 font-bold uppercase tracking-wider">{b.category}</span>
                        <span className={`font-bold ${textColor} ${theme === 'neon' ? `drop-shadow-[0_0_5px_${shadowColor}]` : ''}`}>{currency}{spent.toFixed(0)} / {currency}{b.limit}</span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${theme === 'neon' ? 'bg-white/5 border border-white/10' : 'bg-gray-700'}`}>
                          <div 
                             className={`h-full rounded-full transition-all duration-1000 ${color}`} 
                             style={{
                                 width: `${percent}%`,
                                 boxShadow: theme === 'neon' ? `0 0 12px ${shadowColor}` : 'none'
                             }}
                          ></div>
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>
       </div>
    </div>
  )
}

export default Dashboard