import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const Dashboard = ({ transactions, budgets, openModal, currency }) => { // <--- Added 'currency'
  
  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const balance = totalIncome - totalExpense

  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981']

  const performanceData = transactions.slice(-7).map((t, i) => ({
    name: t.date || `Tx ${i + 1}`,
    income: t.type === 'income' ? parseFloat(t.amount) : 0,
    expense: t.type === 'expense' ? parseFloat(t.amount) : 0
  }))

  const expensePieData = expenses.reduce((acc, item) => {
    const found = acc.find(x => x.name === item.category)
    if (found) found.value += parseFloat(item.amount)
    else acc.push({ name: item.category, value: parseFloat(item.amount) })
    return acc
  }, [])

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 h-full overflow-hidden animate-fade-in">
       {/* STATS ROW */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
           <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex justify-between items-center shadow-lg">
              <div><p className="text-gray-400 text-xs font-bold uppercase">Balance</p><h3 className="text-3xl font-bold text-white mt-1">{currency}{balance.toFixed(2)}</h3></div>
              <div className="p-3 bg-blue-500/10 rounded-xl"><Wallet className="text-blue-500" size={24}/></div>
           </div>
           <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex justify-between items-center shadow-lg">
              <div><p className="text-gray-400 text-xs font-bold uppercase">Income</p><h3 className="text-3xl font-bold text-emerald-400 mt-1">+{currency}{totalIncome.toFixed(2)}</h3></div>
              <div className="p-3 bg-emerald-500/10 rounded-xl"><TrendingUp className="text-emerald-500" size={24}/></div>
           </div>
           <div className="bg-[#12131e] p-5 rounded-2xl border border-gray-800 flex justify-between items-center shadow-lg">
              <div><p className="text-gray-400 text-xs font-bold uppercase">Expenses</p><h3 className="text-3xl font-bold text-red-400 mt-1">-{currency}{totalExpense.toFixed(2)}</h3></div>
              <div className="p-3 bg-red-500/10 rounded-xl"><TrendingDown className="text-red-500" size={24}/></div>
           </div>
       </div>

       {/* CHARTS ROW */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 bg-[#12131e] rounded-2xl p-5 border border-gray-800 flex flex-col">
            <h3 className="font-bold text-gray-200 mb-4">Financial Performance</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#0b0c15', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#12131e] rounded-2xl p-5 border border-gray-800 flex flex-col">
             <h3 className="font-bold text-gray-200 mb-2">Expense Breakdown</h3>
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={expensePieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                     {expensePieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none"/>)}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#0b0c15', borderRadius: '8px', border: 'none' }} />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* BOTTOM ROW */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="bg-[#12131e] rounded-2xl p-5 border border-gray-800 flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-gray-200">Recent Transactions</h3>
               <button onClick={() => openModal('expense')} className="text-xs bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-500">+ Quick Add</button>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {transactions.slice(-10).reverse().map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded transition border-b border-gray-800/50 last:border-0">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                         {t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                       </div>
                       <div><p className="font-bold text-sm text-gray-200">{t.category}</p><p className="text-[10px] text-gray-500">{t.description}</p></div>
                     </div>
                     <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'income' ? '+' : '-'}{currency}{t.amount}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-[#12131e] rounded-2xl p-5 border border-gray-800 flex flex-col">
             <h3 className="font-bold text-gray-200 mb-3">Budget Health</h3>
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {budgets.map(b => {
                  const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  const percent = Math.min((spent / b.limit) * 100, 100)
                  let color = percent >= 100 ? "bg-red-500" : percent > 80 ? "bg-yellow-500" : "bg-blue-500"
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 font-bold">{b.category}</span>
                        <span className={`${percent >= 100 ? 'text-red-500' : 'text-gray-500'}`}>{currency}{spent} / {currency}{b.limit}</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full"><div className={`h-2 rounded-full ${color}`} style={{width: `${percent}%`}}></div></div>
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