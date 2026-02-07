import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, Briefcase, Target, Download, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ view, setView, onExport }) => { 
  const { theme, setTheme } = useTheme() 
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'text-red-500' },
    { id: 'investment', label: 'Investments', icon: Briefcase, color: 'text-purple-500' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'text-pink-500' },
    { id: 'budget', label: 'Budgets', icon: PieChart, color: 'text-yellow-400' },
  ]

  // Configuration for Active State Colors in Neon Mode
  const activeStyles = {
      dashboard: "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
      income: "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      expense: "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
      investment: "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]",
      goals: "bg-pink-500/10 text-pink-400 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.5)]",
      budget: "bg-yellow-400/10 text-yellow-400 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
  }

  const getActiveClass = (id) => {
      // Glass Mode Active State
      if (theme !== 'neon') {
          return "bg-white/10 text-white border border-white/10 shadow-lg backdrop-blur-md"
      }
      // Neon Mode Active State (Lookup from object)
      return activeStyles[id] || "bg-white/10 text-white"
  }

  return (
    <div className={`w-64 border-r flex flex-col shrink-0 transition-all duration-300 relative z-20 ${theme === 'neon' ? 'bg-black border-blue-900/30 shadow-[5px_0_30px_rgba(0,0,0,0.8)]' : 'bg-[#0b0c15] border-white/5'}`}>
      
      {/* LOGO AREA */}
      <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden group">
        {theme === 'neon' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 shadow-[0_0_15px_#3b82f6]"></div>}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition duration-300 ${theme === 'neon' ? 'bg-black border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-600 shadow-lg'}`}>
          <span className={`font-black text-2xl ${theme === 'neon' ? 'text-blue-500 drop-shadow-[0_0_5px_#3b82f6]' : 'text-white'}`}>SFM</span>
        </div>
        <h1 className="font-bold text-lg tracking-wider text-white">FinDash</h1>
      </div>

      {/* NAVIGATION MENU */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
        <p className="px-2 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        
        {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            
            return (
                <button 
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group border border-transparent
                      ${isActive ? getActiveClass(item.id) : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                    `}
                >
                    <Icon 
                        size={20} 
                        className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_currentColor]' : `${item.color} opacity-70 group-hover:opacity-100`}`} 
                    />
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </button>
            )
        })}

        {/* SYSTEM ACTIONS */}
        <div className="pt-8 mt-4 border-t border-white/5">
            <p className="px-2 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">System</p>
            <button onClick={onExport} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-400 hover:bg-cyan-900/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-transparent transition-all duration-300 group">
                <Download size={20} className="text-cyan-600 group-hover:text-cyan-400" />
                <span className="font-bold text-sm tracking-wide">Export Data</span>
            </button>
        </div>
      </div>

      {/* FOOTER (Theme Toggle) */}
      <div className={`p-4 border-t border-white/5 ${theme === 'neon' ? 'bg-black' : 'bg-[#0b0c15]'}`}>
          <button 
            onClick={() => setTheme(theme === 'neon' ? 'glass' : 'neon')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition group"
          >
             <div className="flex items-center gap-3">
                {theme === 'neon' ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-blue-400"/>}
                <span className="text-xs font-bold text-gray-300">{theme === 'neon' ? 'Neon Mode' : 'Glass Mode'}</span>
             </div>
             <div className={`w-8 h-4 rounded-full p-0.5 flex transition-colors ${theme === 'neon' ? 'bg-blue-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
             </div>
          </button>
      </div>
    </div>
  )
}

export default Sidebar