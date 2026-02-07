import { useState } from 'react'
import { CheckCircle, AlertTriangle, PieChart, Trash2, Edit2, Plus, ShieldAlert, TrendingDown, Wallet, Calendar, Clock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext' 

const Budgets = ({ budgets = [], expenses = [], openModal, handleDelete, handleEdit }) => { 
  const { theme, styles } = useTheme() 
  const [periodFilter, setPeriodFilter] = useState('All')
  
  const currency = '₹';

  // --- FILTER LOGIC ---
  const filteredBudgets = periodFilter === 'All' 
    ? budgets 
    : budgets.filter(b => b.period === periodFilter)

  // --- SMART CALCULATIONS (TIME AWARE) ---
  const calculateBudgetStats = (limit, spent, period) => {
      const numLimit = parseFloat(limit || 0);
      const numSpent = parseFloat(spent || 0);
      
      const now = new Date();
      let daysPassed = 0;
      let totalDays = 0;

      // 1. Determine Time Progress
      if (period === 'Weekly') {
          const day = now.getDay(); // 0 (Sun) - 6 (Sat)
          daysPassed = day === 0 ? 7 : day; // Treat Sunday as day 7
          totalDays = 7;
      } else if (period === 'Yearly') {
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = now - start;
          const oneDay = 1000 * 60 * 60 * 24;
          daysPassed = Math.floor(diff / oneDay);
          totalDays = 365;
      } else { 
          // Default: Monthly
          daysPassed = now.getDate(); // 1 - 31
          totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); // Days in current month
      }

      // 2. Calculate "Allowed Spend to Date"
      // Example: 3000 Limit / 30 Days = 100 per day.
      // If today is 7th, allowed = 700.
      const dailyRate = numLimit / totalDays;
      const allowedToDate = dailyRate * daysPassed;

      // 3. Calculate Status (Over vs Under for *Today*)
      const diff = allowedToDate - numSpent; 
      // If diff is positive: We spent LESS than allowed (Good/Saved)
      // If diff is negative: We spent MORE than allowed (Bad/Over)
      
      const isTrackOver = diff < 0; // We spent more than allowed so far
      const trackAmount = Math.abs(diff);

      // 4. Standard Total remaining
      const totalRemaining = numLimit - numSpent;
      const totalIsOver = totalRemaining < 0;

      return {
          pace: {
              daily: dailyRate,
              weekly: dailyRate * 7,
              monthly: numLimit
          },
          track: {
              isOver: isTrackOver,
              amount: trackAmount,
              label: isTrackOver ? 'Overbudget by' : 'Saved'
          },
          total: {
              remaining: Math.abs(totalRemaining),
              isOver: totalIsOver,
              percent: numLimit > 0 ? Math.min((numSpent / numLimit) * 100, 100) : 0
          },
          time: {
              passed: daysPassed,
              total: totalDays
          }
      };
  }

  // --- DYNAMIC STYLES ---
  const getCardGradient = (statusColor) => {
      if (theme === 'neon') {
          switch(statusColor) {
              case 'yellow': return "bg-gradient-to-br from-yellow-900/20 via-black to-black border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
              case 'orange': return "bg-gradient-to-br from-orange-900/20 via-black to-black border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              case 'red': return "bg-gradient-to-br from-red-900/20 via-black to-black border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              default: return "bg-black border-white/10"
          }
      }
      return "bg-[#1a1b26]/80 backdrop-blur-xl border-white/5 shadow-xl hover:bg-[#1f2937]/80"
  }

  const getTextColor = (statusColor) => {
      switch(statusColor) {
          case 'yellow': return 'text-yellow-400'
          case 'orange': return 'text-orange-400'
          case 'red': return 'text-red-500'
          default: return 'text-white'
      }
  }

  return (
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}>
      <div className="p-6 flex flex-col gap-8 min-h-min">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
         <div>
            <h2 className={`text-3xl font-bold text-white flex items-center gap-3 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                <PieChart size={32} className={theme === 'neon' ? "text-yellow-400 drop-shadow-[0_0_15px_#facc15]" : "text-yellow-400"} /> 
                Budget Command
            </h2>
            <p className="text-gray-400 text-sm mt-1 ml-1 tracking-wide">
                Time-aware spending limits
            </p>
         </div>

         <div className="flex gap-3">
             {/* Period Toggle */}
             <div className={`flex p-1 rounded-xl border ${theme === 'neon' ? 'bg-black border-white/10' : 'bg-white/5 border-white/5'}`}>
                 {['All', 'Weekly', 'Monthly', 'Yearly'].map(p => (
                     <button 
                        key={p} 
                        onClick={() => setPeriodFilter(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === p ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                     >
                         {p}
                     </button>
                 ))}
             </div>

             <button 
                onClick={() => openModal('budget')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${theme === 'neon' ? 'bg-yellow-400 text-black shadow-[0_0_20px_#facc15] hover:shadow-[0_0_40px_#facc15] border border-yellow-300' : 'bg-yellow-500 text-black shadow-lg hover:bg-yellow-400'}`}
             >
                <Plus size={18} className="text-black" /> 
                <span className="text-black font-black uppercase tracking-wider text-xs">Set Budget</span>
             </button>
         </div>
      </div>

      {/* BUDGET CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredBudgets.map((b, index) => { 
             const spent = expenses
                .filter(e => e.category === b.category)
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

             const limit = parseFloat(b.limit || 0);
             
             // Run Smart Stats
             const stats = calculateBudgetStats(limit, spent, b.period);
             
             // Logic for visual color (based on total limit % only)
             const percent = stats.total.percent;
             let statusColor = 'yellow'
             let Icon = CheckCircle
             if(percent > 80) { statusColor = 'orange'; Icon = AlertTriangle }
             if(percent >= 100) { statusColor = 'red'; Icon = ShieldAlert }

             const textColor = getTextColor(statusColor);

             return (
               <div key={b.id || b._id || index} className={`relative p-6 rounded-2xl border transition-all duration-500 group overflow-hidden flex flex-col ${getCardGradient(statusColor)}`}>
                  
                  {/* Floating Background Icon */}
                  <div className={`absolute -right-6 -top-6 opacity-10 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 ${textColor}`}>
                      <Icon size={120} />
                  </div>

                  {/* HEADER ROW */}
                  <div className="flex justify-between items-start relative z-10 mb-4">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-black/50 backdrop-blur-md ${textColor} border-current opacity-80 flex items-center gap-1`}>
                                 <Calendar size={10}/> {b.period || 'Monthly'}
                             </span>
                             <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                                <Clock size={10} /> Day {stats.time.passed}/{stats.time.total}
                             </span>
                         </div>
                         <h3 className="font-black text-2xl text-white tracking-tight truncate max-w-[180px]" title={b.category}>
                             {b.category}
                         </h3>
                      </div>
                      
                      {/* ACTIONS */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10">
                         <button onClick={() => handleEdit(b, 'budget')} className="p-1.5 text-gray-400 hover:text-white transition"><Edit2 size={14}/></button>
                         <button onClick={() => handleDelete(b.id || b._id, 'budget')} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={14}/></button>
                      </div>
                  </div>

                  {/* --- NEW: TIME-AWARE STATUS --- */}
                  <div className="mb-4 relative z-10">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${stats.track.isOver ? 'bg-red-900/20 border-red-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
                          <div>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${stats.track.isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {stats.track.isOver ? '⚠️ Overbudget by' : '✅ Saved so far'}
                              </p>
                              <p className={`text-xl font-mono font-bold ${stats.track.isOver ? 'text-red-100' : 'text-emerald-100'}`}>
                                  {currency}{stats.track.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] text-gray-400 uppercase font-bold">Allowed (Day {stats.time.passed})</p>
                              <p className="text-sm font-mono text-gray-200">{currency}{(stats.pace.daily * stats.time.passed).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                          </div>
                      </div>
                  </div>

                  {/* SPEND / LIMIT DISPLAY */}
                  <div className="mb-6 relative z-10 mt-auto">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-gray-400">
                            Total Spent: <span className="text-white">{currency}{spent.toLocaleString()}</span>
                        </span>
                        <span className={textColor}>
                            Limit: {currency}{limit.toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Fancy Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-gray-800 border border-white/5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 relative ${statusColor === 'yellow' ? 'bg-yellow-400 shadow-[0_0_15px_#facc15]' : statusColor === 'orange' ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-red-600 shadow-[0_0_15px_#ef4444]'}`}
                            style={{ width: `${percent}%` }}
                        >
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                    <p className={`text-right text-[10px] font-bold mt-2 ${textColor}`}>
                        {percent.toFixed(0)}% Used
                    </p>
                  </div>

                  {/* SPEND PACE GRID */}
                  <div className="mt-auto p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                          <Wallet size={14} className="text-yellow-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Allowed Spend Pace</span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Daily</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.pace.daily.toFixed(0)}</p>
                          </div>
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Weekly</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.pace.weekly.toFixed(0)}</p>
                          </div>
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Monthly</p>
                              <p className="text-white font-mono font-bold text-xs">{currency}{stats.pace.monthly.toFixed(0)}</p>
                          </div>
                      </div>
                  </div>

               </div>
             )
           })}

           {/* EMPTY STATE */}
           {filteredBudgets.length === 0 && (
             <button 
                onClick={() => openModal('budget')}
                className={`col-span-1 md:col-span-2 lg:col-span-3 h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 group cursor-pointer ${theme === 'neon' ? 'bg-black border-gray-800 hover:border-yellow-400/50 hover:bg-yellow-900/10' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
             >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition duration-500 ${theme === 'neon' ? 'bg-gray-900 group-hover:bg-yellow-400/20 group-hover:shadow-[0_0_30px_#facc15]' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <PieChart size={40} className={`transition duration-500 ${theme === 'neon' ? 'text-gray-600 group-hover:text-yellow-400' : 'text-gray-500 group-hover:text-white'}`} />
                </div>
                <p className={`font-bold uppercase tracking-widest text-sm transition ${theme === 'neon' ? 'text-gray-500 group-hover:text-yellow-400' : 'text-gray-400 group-hover:text-white'}`}>
                    No {periodFilter !== 'All' ? periodFilter : ''} budgets found
                </p>
                <span className={`text-[10px] mt-2 ${theme === 'neon' ? 'text-gray-600 group-hover:text-yellow-400/70' : 'text-gray-500 group-hover:text-gray-300'}`}>Click to set limits</span>
             </button>
           )}
        </div>
      </div>
    </div>
  )
}

export default Budgets