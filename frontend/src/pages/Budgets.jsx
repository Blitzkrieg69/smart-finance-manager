import { CheckCircle, AlertTriangle, PieChart, Trash2, Edit2, CalendarClock, Plus, ShieldAlert } from 'lucide-react'
import { useTheme } from '../context/ThemeContext' 

const Budgets = ({ budgets, expenses, openModal, handleDelete, handleEdit, currency }) => { 
  const { theme, styles } = useTheme() 

  // --- DYNAMIC STYLES ---
  const getBudgetCardStyle = (statusColor, theme) => {
      // Base layout
      const base = "p-6 rounded-2xl border relative group transition-all duration-500 flex flex-col justify-between h-64"
      
      // GLASS MODE
      if (theme !== 'neon') {
          return `${base} bg-[#1a1b26]/60 backdrop-blur-xl border-white/5 shadow-xl hover:bg-white/5 hover:border-white/10`
      }

      // NEON MODE
      switch(statusColor) {
          // DEFAULT / HEALTHY -> LEMON YELLOW
          case 'yellow': return `${base} bg-black border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.25)] hover:border-yellow-300 hover:shadow-[0_0_40px_rgba(250,204,21,0.35)]`
          // WARNING -> ORANGE
          case 'orange': return `${base} bg-black border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:border-orange-400 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]`
          // CRITICAL -> RED
          case 'red': return `${base} bg-black border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:border-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]`
          default: return base
      }
  }

  const getProgressBarStyle = (statusColor, theme) => {
      if (theme !== 'neon') {
          if(statusColor === 'yellow') return "bg-yellow-400"
          if(statusColor === 'orange') return "bg-orange-500"
          return "bg-red-500"
      }
      
      // Neon Glows
      if(statusColor === 'yellow') return "bg-yellow-400 shadow-[0_0_15px_#facc15]"
      if(statusColor === 'orange') return "bg-orange-500 shadow-[0_0_15px_#f97316]"
      return "bg-red-600 shadow-[0_0_15px_#ef4444]"
  }

  return (
    <div className={`flex-1 h-full overflow-y-auto custom-scrollbar animate-fade-in ${styles.bg}`}>
      <div className="p-6 flex flex-col gap-8 min-h-min">
      
      {/* HEADER */}
      <div className="flex justify-between items-center shrink-0">
         <div>
            <h2 className={`text-3xl font-bold text-white flex items-center gap-3 ${theme === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                <PieChart size={32} className={theme === 'neon' ? "text-yellow-400 drop-shadow-[0_0_15px_#facc15]" : "text-yellow-400"} /> 
                Budget Enforcer
            </h2>
            <p className="text-gray-400 text-sm mt-1 ml-1 tracking-wide">
                Strict visual tracking of your limits
            </p>
         </div>
         <button 
            onClick={() => openModal('budget')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${theme === 'neon' ? 'bg-yellow-400 text-black shadow-[0_0_20px_#facc15] hover:shadow-[0_0_40px_#facc15] border border-yellow-300' : 'bg-yellow-500 text-black shadow-lg hover:bg-yellow-400'}`}
         >
            <Plus size={20} className="text-black" /> 
            <span className="text-black font-black uppercase tracking-wider">Set Limit</span>
         </button>
      </div>

      {/* BUDGET CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {budgets.map(b => {
             const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0)
             const percent = Math.min((spent / b.limit) * 100, 100)
             
             // --- LOGIC UPDATE: Default is now Yellow ---
             let statusColor = 'yellow'
             let statusText = 'HEALTHY'
             let Icon = CheckCircle
             
             if(percent > 80) { statusColor = 'orange'; statusText = 'WARNING'; Icon = AlertTriangle }
             if(percent >= 100) { statusColor = 'red'; statusText = 'CRITICAL'; Icon = ShieldAlert }

             // Color Mappings
             const textColorMap = {
                 yellow: 'text-yellow-400',
                 orange: 'text-orange-400',
                 red: theme === 'neon' ? 'text-red-500' : 'text-red-400'
             }

             return (
               <div key={b.id} className={getBudgetCardStyle(statusColor, theme)}>
                  {/* HEADER ROW */}
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className={`font-black text-xl text-white tracking-tight ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`}>
                            {b.category}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Icon size={18} className={`${textColorMap[statusColor]} ${theme === 'neon' ? 'drop-shadow-[0_0_10px_currentColor]' : ''}`}/> 
                            <span className={`text-[10px] font-black uppercase tracking-widest ${textColorMap[statusColor]} ${theme === 'neon' ? 'drop-shadow-[0_0_5px_currentColor]' : ''}`}>
                                {statusText}
                            </span>
                        </div>
                     </div>
                     
                     {/* ACTIONS */}
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button 
                            onClick={() => handleEdit(b, 'budget')} 
                            className={`p-2 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_15px_#facc15]' : 'bg-white/10 text-gray-300 hover:text-white'}`}
                        >
                            <Edit2 size={16}/>
                        </button>
                        <button 
                            onClick={() => handleDelete(b.id, 'budget')} 
                            className={`p-2 rounded-lg transition ${theme === 'neon' ? 'bg-black border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_15px_#ef4444]' : 'bg-white/10 text-gray-300 hover:text-red-400'}`}
                        >
                            <Trash2 size={16}/>
                        </button>
                     </div>
                  </div>

                  {/* STATS ROW */}
                  <div className="flex justify-between items-end mt-4">
                     <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${theme === 'neon' ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5'}`}>
                        <CalendarClock size={14} className="text-gray-400" /> 
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{b.period || 'Monthly'}</span>
                     </div>
                     <div className="text-right">
                        <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-0.5">Limit</p>
                        <p className={`text-white font-black text-2xl font-mono ${theme === 'neon' ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : ''}`}>
                            {currency}{b.limit.toLocaleString()}
                        </p>
                     </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                        <span className={`${textColorMap[statusColor]} ${theme === 'neon' ? 'drop-shadow-[0_0_5px_currentColor]' : ''}`}>{currency}{spent.toLocaleString()} Spent</span>
                        <span className="text-white">{percent.toFixed(0)}%</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden border relative ${theme === 'neon' ? 'bg-gray-900 border-white/10' : 'bg-white/5 border-white/5'}`}>
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${getProgressBarStyle(statusColor, theme)}`} 
                            style={{ width: `${percent}%` }}
                        >
                             {/* Shimmer Overlay */}
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                  </div>
               </div>
             )
           })}

           {/* EMPTY STATE */}
           {budgets.length === 0 && (
             <button 
                onClick={() => openModal('budget')}
                className={`col-span-1 md:col-span-2 lg:col-span-3 h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 group cursor-pointer ${theme === 'neon' ? 'bg-black border-gray-800 hover:border-yellow-400/50 hover:bg-yellow-900/10' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
             >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition duration-500 ${theme === 'neon' ? 'bg-gray-900 group-hover:bg-yellow-400/20 group-hover:shadow-[0_0_30px_#facc15]' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <PieChart size={40} className={`transition duration-500 ${theme === 'neon' ? 'text-gray-600 group-hover:text-yellow-400' : 'text-gray-500 group-hover:text-white'}`} />
                </div>
                <p className={`font-bold uppercase tracking-widest text-sm transition ${theme === 'neon' ? 'text-gray-500 group-hover:text-yellow-400' : 'text-gray-400 group-hover:text-white'}`}>
                    No budgets enforced yet
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