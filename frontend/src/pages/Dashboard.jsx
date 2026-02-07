import { BarChart, Bar, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'


const Dashboard = ({ transactions, budgets, openModal, currency }) => {
  const { theme, styles } = useTheme()

  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const balance = totalIncome - totalExpense


  const COLORS = theme === 'dark'
    ? ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444']
    : ['#4B3621', '#654321', '#8B4513', '#A0522D', '#6B4423', '#765341', '#5D4037']


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
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-lg'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>{label}</p>
          {payload.map((p, index) => (
            <div key={index} className="flex justify-between gap-4 text-xs font-bold mb-1 last:mb-0">
              <span style={{ color: theme === 'dark' ? p.color : '#4B3621' }}>{p.name}:</span>
              <span className={`font-mono ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(p.value)}</span>
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

    if (theme !== 'dark') return `${base} shadow-lg`


    switch (colorType) {
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
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'dark' ? 'text-blue-400 drop-shadow-[0_0_5px_#3b82f6]' : 'text-[#654321]/70'}`}>Total Balance</p>
              <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'text-[#4B3621]'}`}>
                {currency}{formatIndianNumber(balance)}
              </h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'dark' ? 'bg-blue-900/20 border-blue-500/40 shadow-[0_0_15px_#3b82f6] group-hover:scale-110' : 'bg-[#F5F5DC] border-[#654321]/30 text-[#4B3621]'}`}>
              <Wallet className={theme === 'dark' ? 'text-blue-500' : 'text-[#4B3621]'} size={28} />
            </div>
          </div>
        </div>


        {/* INCOME */}
        <div className={getCardStyle('green')}>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-[#654321]/70'}`}>Total Income</p>
              <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-[#4B3621]'}`}>
                +{currency}{formatIndianNumber(totalIncome)}
              </h3>

            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/40 shadow-[0_0_15px_#10b981] group-hover:scale-110' : 'bg-[#F5F5DC] border-[#654321]/30 text-[#4B3621]'}`}>
              <TrendingUp className={theme === 'dark' ? 'text-emerald-500' : 'text-[#4B3621]'} size={28} />
            </div>
          </div>
        </div>


        {/* EXPENSE */}
        <div className={getCardStyle('red')}>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'dark' ? 'text-red-400 drop-shadow-[0_0_5px_#ef4444]' : 'text-[#654321]/70'}`}>Total Expenses</p>
              <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-red-500 drop-shadow-[0_0_10px_#ef4444]' : 'text-[#4B3621]'}`}>
                -{currency}{formatIndianNumber(totalExpense)}
              </h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition duration-500 ${theme === 'dark' ? 'bg-red-900/20 border-red-500/40 shadow-[0_0_15px_#ef4444] group-hover:scale-110' : 'bg-[#F5F5DC] border-[#654321]/30 text-[#4B3621]'}`}>
              <TrendingDown className={theme === 'dark' ? 'text-red-500' : 'text-[#4B3621]'} size={28} />
            </div>
          </div>
        </div>
      </div>


      {/* 2. CHARTS ROW (Balanced Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80 shrink-0">

        {/* MAIN CHART */}
        <div className={`lg:col-span-2 ${getCardStyle('blue')}`}>
          <h3 className={`font-bold text-sm mb-4 flex items-center gap-3 tracking-widest uppercase ${theme === 'dark' ? 'text-white drop-shadow-[0_0_5px_#3b82f6]' : 'text-[#4B3621]'}`}>
            <Activity size={16} className={theme === 'dark' ? "text-blue-500" : "text-[#4B3621]"} />
            Financial Performance
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} barGap={6}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e3a8a' : '#D2B48C'} strokeOpacity={0.4} vertical={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="income" name="Income" fill={theme === 'dark' ? "url(#incomeGradient)" : "#654321"} radius={[4, 4, 0, 0]} barSize={12} className={theme === 'dark' ? 'drop-shadow-[0_0_8px_#3b82f6]' : ''} />
                <Bar dataKey="expense" name="Expense" fill={theme === 'dark' ? "url(#expenseGradient)" : "#4B3621"} radius={[4, 4, 0, 0]} barSize={12} className={theme === 'dark' ? 'drop-shadow-[0_0_8px_#ef4444]' : ''} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* PIE CHART */}
        <div className={getCardStyle('blue')}>
          <h3 className={`font-bold text-sm mb-2 tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>Expense Breakdown</h3>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className={theme === 'dark' ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : ''} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className={`text-[10px] ml-1 font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>{value.toUpperCase()}</span>} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-blue-500 drop-shadow-[0_0_5px_#3b82f6]' : 'text-[#654321]/70'}`}>Total</p>
                <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>SPEND</p>
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
            <h3 className={`font-bold text-sm tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>Recent Transactions</h3>
            <button
              onClick={() => openModal('expense')}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg transition duration-300 ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-[#F5F5DC] text-[#4B3621] hover:bg-[#F5F5DC]/80 border border-[#654321]/30'}`}
            >
              + QUICK ADD
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {transactions.slice(-5).reverse().map((t, index) => (
              <div key={t.id || t._id || index} className={`flex justify-between items-center p-3 rounded-xl transition border border-transparent group ${theme === 'dark' ? 'hover:bg-white/5 hover:border-blue-500/30' : 'hover:bg-[#F5F5DC]/50 hover:border-[#654321]/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === 'income' ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#F5F5DC] border border-[#654321]/30 text-[#4B3621]') : (theme === 'dark' ? 'bg-red-500/10 text-red-500' : 'bg-[#F5F5DC] border border-[#654321]/30 text-[#4B3621]')} ${theme === 'dark' ? 'shadow-[0_0_10px_rgba(0,0,0,0.5)]' : ''}`}>
                    {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className={`font-bold text-xs transition uppercase tracking-wide ${theme === 'dark' ? 'text-gray-200 group-hover:text-white' : 'text-[#4B3621]'}`}>{t.category}</p>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>{t.description || '-'}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.type === 'income' ? (theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-[#4B3621]') : (theme === 'dark' ? 'text-white' : 'text-[#4B3621]')}`}>
                  {t.type === 'income' ? '+' : '-'}{currency}{formatIndianNumber(Math.abs(parseFloat(t.amount || 0)))}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* BUDGET HEALTH */}
        <div className={getCardStyle('blue')}>
          <h3 className={`font-bold text-sm mb-4 tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>Budget Health</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
            {budgets.map((b, index) => {
              const spent = expenses
                .filter(e => e.category === b.category)
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

              const limit = parseFloat(b.limit || 1)
              const percent = Math.min((spent / limit) * 100, 100)

              let color = percent >= 100 ? (theme === 'dark' ? "bg-red-500" : "bg-[#4B3621]") : percent > 80 ? (theme === 'dark' ? "bg-yellow-500" : "bg-[#654321]") : (theme === 'dark' ? "bg-blue-500" : "bg-[#8B4513]")
              let shadowColor = percent >= 100 ? "#ef4444" : percent > 80 ? "#f59e0b" : "#3b82f6"
              let textColor = percent >= 100 ? (theme === 'dark' ? "text-red-400" : "text-[#4B3621]") : percent > 80 ? (theme === 'dark' ? "text-yellow-400" : "text-[#654321]") : (theme === 'dark' ? "text-blue-400" : "text-[#8B4513]")

              return (
                <div key={b.id || b._id || index}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className={`font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-[#4B3621]'}`}>{b.category}</span>
                    <span className={`font-bold ${textColor} ${theme === 'dark' ? `drop-shadow-[0_0_5px_${shadowColor}]` : ''}`}>{currency}{formatIndianNumber(spent)} / {currency}{formatIndianNumber(b.limit)}</span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#FAF9F6] border border-[#D2B48C]/30'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${color}`}
                      style={{
                        width: `${percent}%`,
                        boxShadow: theme === 'dark' ? `0 0 12px ${shadowColor}` : 'none'
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
