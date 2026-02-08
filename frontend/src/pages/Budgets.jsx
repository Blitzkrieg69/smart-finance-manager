import { useState } from 'react'
import { CheckCircle, AlertTriangle, PieChart, Trash2, Edit2, Plus, ShieldAlert, TrendingDown, Wallet, Calendar, Clock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'


const Budgets = ({ budgets = [], expenses = [], openModal, handleDelete, handleEdit }) => { 
  const { theme, styles } = useTheme() 
  const [periodFilter, setPeriodFilter] = useState('All')
  
  const currency = '₹';


const normalizePeriod = (p) =>
  ((p ?? 'Monthly').toString()).trim().toLowerCase()

const filteredBudgets =
  periodFilter === 'All'
    ? budgets
    : budgets.filter(b => normalizePeriod(b.period) === normalizePeriod(periodFilter))


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
      const dailyRate = numLimit / totalDays;
      const allowedToDate = dailyRate * daysPassed;


      // 3. Calculate Status
      const diff = allowedToDate - numSpent; 
      const isTrackOver = diff < 0;
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
      if (theme === 'dark') {
          switch(statusColor) {
              case 'yellow': return "bg-gradient-to-br from-yellow-900/20 via-black to-black border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
              case 'orange': return "bg-gradient-to-br from-orange-900/20 via-black to-black border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              case 'red': return "bg-gradient-to-br from-red-900/20 via-black to-black border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              default: return "bg-black border-white/10"
          }
      }
      switch(statusColor) {
          case 'yellow': return "bg-[#FFF8F0] border-[#C9A87C]/50 shadow-lg"
          case 'orange': return "bg-orange-50 border-orange-300 shadow-lg"
          case 'red': return "bg-red-50 border-red-300 shadow-lg"
          default: return "bg-[#FFF8F0] border-[#C9A87C]/50 shadow-xl"
      }
  }


  const getTextColor = (statusColor) => {
      if (theme === 'dark') {
          switch(statusColor) {
              case 'yellow': return 'text-yellow-400'
              case 'orange': return 'text-orange-400'
              case 'red': return 'text-red-500'
              default: return 'text-white'
          }
      }
      switch(statusColor) {
          case 'yellow': return 'text-[#4B3621]'
          case 'orange': return 'text-orange-700'
          case 'red': return 'text-red-700'
          default: return 'text-[#4B3621]'
      }
  }


  return (
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}>
      <div className="p-6 flex flex-col gap-8 min-h-min">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
         <div>
            <h2 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-[#4B3621]'}`}>
                <PieChart size={32} className={theme === 'dark' ? "text-yellow-400 drop-shadow-[0_0_15px_#facc15]" : "text-[#4B3621]"} /> 
                Budget Command
            </h2>
            <p className={`text-sm mt-1 ml-1 tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                Time-aware spending limits
            </p>
         </div>


         <div className="flex gap-3">
             {/* Period Toggle */}
             <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-[#C9A87C]/50'}`}>
                 {['All', 'Weekly', 'Monthly', 'Yearly'].map(p => (
                     <button 
                        key={p} 
                        onClick={() => setPeriodFilter(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === p ? (theme === 'dark' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-[#F5F5DC] text-[#4B3621] border border-[#654321]/30') : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#654321] hover:text-[#4B3621]')}`}
                     >
                         {p}
                     </button>
                 ))}
             </div>


             <button 
                onClick={() => openModal('budget')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 border ${theme === 'dark' ? 'bg-yellow-400 text-black shadow-[0_0_20px_#facc15] hover:shadow-[0_0_40px_#facc15] border-yellow-300' : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/30 shadow-lg hover:bg-[#F5F5DC]/80'}`}
             >
                <Plus size={18} /> 
                <span className="font-black uppercase tracking-wider text-xs">Set Budget</span>
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
             
             // Logic for visual color
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
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${theme === 'dark' ? 'bg-black/50 backdrop-blur-md border-current opacity-80' : 'bg-white border-[#C9A87C]/50'} ${textColor}`}>
                                 <Calendar size={10}/> {b.period || 'Monthly'}
                             </span>
                             <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-black/30 text-gray-500 border-white/10' : 'bg-white text-[#654321]/70 border-[#C9A87C]/50'}`}>
                                <Clock size={10} /> Day {stats.time.passed}/{stats.time.total}
                             </span>
                         </div>
                         <h3 className={`font-black text-2xl tracking-tight truncate max-w-[180px] ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`} title={b.category}>
                             {b.category}
                         </h3>
                      </div>
                      
                      {/* ACTIONS */}
                      <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 p-1 rounded-lg border ${theme === 'dark' ? 'bg-black/60 backdrop-blur-md border-white/10' : 'bg-white border-[#C9A87C]/50'}`}>
                         <button onClick={() => handleEdit(b, 'budget')} className={`p-1.5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#654321] hover:text-[#4B3621]'}`}><Edit2 size={14}/></button>
                         <button onClick={() => handleDelete(b.id || b._id, 'budget')} className={`p-1.5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-red-500' : 'text-[#654321] hover:text-red-600'}`}><Trash2 size={14}/></button>
                      </div>
                  </div>


                  {/* TIME-AWARE STATUS */}
                  <div className="mb-4 relative z-10">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${stats.track.isOver ? (theme === 'dark' ? 'bg-red-900/20 border-red-500/30' : 'bg-red-100 border-red-400') : (theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-100 border-emerald-400')}`}>
                          <div>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${stats.track.isOver ? (theme === 'dark' ? 'text-red-400' : 'text-red-700') : (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700')}`}>
                                  {stats.track.isOver ? '⚠️ Overbudget by' : '✅ Saved so far'}
                              </p>
                              <p className={`text-xl font-mono font-bold ${stats.track.isOver ? (theme === 'dark' ? 'text-red-100' : 'text-red-800') : (theme === 'dark' ? 'text-emerald-100' : 'text-emerald-800')}`}>
                                  {currency}{formatIndianNumber(stats.track.amount)}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className={`text-[9px] uppercase font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Allowed (Day {stats.time.passed})</p>
                              <p className={`text-sm font-mono ${theme === 'dark' ? 'text-gray-200' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(stats.pace.daily * stats.time.passed)}</p>
                          </div>
                      </div>
                  </div>


                  {/* SPEND / LIMIT DISPLAY */}
                  <div className="mb-6 relative z-10 mt-auto">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}>
                            Total Spent: <span className={theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}>{currency}{formatIndianNumber(spent)}</span>
                        </span>
                        <span className={textColor}>
                            Limit: {currency}{formatIndianNumber(limit)}
                        </span>
                    </div>
                    
                    {/* Fancy Progress Bar */}
                    <div className={`w-full h-2 rounded-full overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-white/5' : 'bg-white border-[#C9A87C]/30'}`}>
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 relative ${statusColor === 'yellow' ? (theme === 'dark' ? 'bg-yellow-400 shadow-[0_0_15px_#facc15]' : 'bg-[#654321]') : statusColor === 'orange' ? (theme === 'dark' ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-orange-500') : (theme === 'dark' ? 'bg-red-600 shadow-[0_0_15px_#ef4444]' : 'bg-red-600')}`}
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
                  <div className={`mt-auto p-3 rounded-xl border backdrop-blur-sm relative z-10 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-[#C9A87C]/30'}`}>
                      <div className="flex items-center gap-2 mb-3">
                          <Wallet size={14} className={theme === 'dark' ? 'text-yellow-500' : 'text-[#654321]'} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Allowed Spend Pace</span>
                      </div>
                      <div className={`grid grid-cols-3 divide-x text-center ${theme === 'dark' ? 'divide-white/10' : 'divide-[#C9A87C]/30'}`}>
                          <div>
                              <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Daily</p>
                              <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(stats.pace.daily)}</p>
                          </div>
                          <div>
                              <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Weekly</p>
                              <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(stats.pace.weekly)}</p>
                          </div>
                          <div>
                              <p className={`text-[9px] uppercase font-bold mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>Monthly</p>
                              <p className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>{currency}{formatIndianNumber(stats.pace.monthly)}</p>
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
                className={`col-span-1 md:col-span-2 lg:col-span-3 h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 group cursor-pointer ${theme === 'dark' ? 'bg-black border-gray-800 hover:border-yellow-400/50 hover:bg-yellow-900/10' : 'bg-[#FFF8F0] border-[#C9A87C]/50 hover:border-[#654321] hover:bg-[#F5F5DC]/30'}`}
             >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition duration-500 ${theme === 'dark' ? 'bg-gray-900 group-hover:bg-yellow-400/20 group-hover:shadow-[0_0_30px_#facc15]' : 'bg-[#F5F5DC] group-hover:bg-[#F5F5DC]/80'}`}>
                    <PieChart size={40} className={`transition duration-500 ${theme === 'dark' ? 'text-gray-600 group-hover:text-yellow-400' : 'text-[#654321] group-hover:text-[#4B3621]'}`} />
                </div>
                <p className={`font-bold uppercase tracking-widest text-sm transition ${theme === 'dark' ? 'text-gray-500 group-hover:text-yellow-400' : 'text-[#654321] group-hover:text-[#4B3621]'}`}>
                    No {periodFilter !== 'All' ? periodFilter : ''} budgets found
                </p>
                <span className={`text-[10px] mt-2 transition ${theme === 'dark' ? 'text-gray-600 group-hover:text-yellow-400/70' : 'text-[#654321]/70 group-hover:text-[#4B3621]'}`}>Click to set limits</span>
             </button>
           )}
        </div>
      </div>
    </div>
  )
}


export default Budgets
