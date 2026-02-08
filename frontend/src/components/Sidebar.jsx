import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, Briefcase, Target, Download, Sun, Moon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ onExport }) => { 
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const view = location.pathname.slice(1) || 'dashboard'
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'text-red-500' },
    { id: 'investment', label: 'Investments', icon: Briefcase, color: 'text-purple-500' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'text-pink-500' },
    { id: 'budget', label: 'Budgets', icon: PieChart, color: 'text-yellow-400' },
  ]

  // DARK MODE (Neon) - UNCHANGED
  const darkActiveStyles = {
      dashboard: "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
      income: "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      expense: "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
      investment: "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]",
      goals: "bg-pink-500/10 text-pink-400 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.5)]",
      budget: "bg-yellow-400/10 text-yellow-400 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
  }

  // LIGHT MODE (Beige/Oak) - NEW
  const lightActiveStyles = {
      dashboard: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md",
      income: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md",
      expense: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md",
      investment: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md",
      goals: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md",
      budget: "bg-[#F5F5DC] text-[#8B4513] border-[#8B4513]/30 shadow-md"
  }

  const getActiveClass = (id) => {
      if (theme === 'light') {
          return lightActiveStyles[id] || "bg-[#F5F5DC] text-[#8B4513] border border-[#8B4513]/30 shadow-md"
      }
      // Dark Mode (Neon - UNCHANGED)
      return darkActiveStyles[id] || "bg-white/10 text-white"
  }

  return (
    <div className={`w-64 border-r flex flex-col shrink-0 transition-all duration-300 relative z-20 ${theme === 'dark' ? 'bg-black border-blue-900/30 shadow-[5px_0_30px_rgba(0,0,0,0.8)]' : 'bg-[#FFF8F0] border-[#8B4513]/20 shadow-lg'}`}>
      
      {/* LOGO AREA */}
      <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden group">
        {theme === 'dark' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 shadow-[0_0_15px_#3b82f6]"></div>}
        {theme === 'light' && <div className="absolute top-0 left-0 w-1 h-full bg-[#8B4513]"></div>}
        <h1 className={`font-black text-3xl tracking-wider ${theme === 'dark' ? 'text-blue-500 drop-shadow-[0_0_10px_#3b82f6]' : 'text-[#8B4513]'}`}>SFM</h1>
      </div>

      {/* NAVIGATION MENU */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
        <p className={`px-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-[#8B4513]/50'}`}>Main Menu</p>
        
        {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            
            return (
                <Link 
                    key={item.id}
                    to={`/${item.id}`}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group border border-transparent
                      ${isActive ? getActiveClass(item.id) : (theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-[#8B4513]/70 hover:bg-[#F5F5DC]/50 hover:text-[#8B4513]')}
                    `}
                >
                    <Icon 
                        size={20} 
                        className={`transition-all duration-300 ${isActive ? (theme === 'dark' ? 'scale-110 drop-shadow-[0_0_5px_currentColor]' : 'scale-110') : `${item.color} opacity-70 group-hover:opacity-100`}`} 
                    />
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </Link>
            )
        })}

        {/* SYSTEM ACTIONS */}
        <div className={`pt-8 mt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-[#8B4513]/10'}`}>
            <p className={`px-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-[#8B4513]/50'}`}>System</p>
            <button onClick={onExport} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent transition-all duration-300 group ${theme === 'dark' ? 'text-gray-400 hover:bg-cyan-900/10 hover:text-cyan-400 hover:border-cyan-500/30' : 'text-[#8B4513]/70 hover:bg-[#F5F5DC]/50 hover:text-[#8B4513]'}`}>
                <Download size={20} className={theme === 'dark' ? 'text-cyan-600 group-hover:text-cyan-400' : 'text-[#8B4513]'} />
                <span className="font-bold text-sm tracking-wide">Export Data</span>
            </button>
        </div>
      </div>

      {/* FOOTER (Theme Toggle) */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'bg-black border-white/5' : 'bg-[#FFF8F0] border-[#8B4513]/10'}`}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/70 border-[#8B4513]/20'}`}
          >
             <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} className="text-blue-400"/> : <Sun size={18} className="text-[#8B4513]"/>}
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-[#8B4513]'}`}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
             </div>
             <div className={`w-8 h-4 rounded-full p-0.5 flex transition-colors ${theme === 'dark' ? 'bg-blue-600 justify-end' : 'bg-[#8B4513] justify-start'}`}>
                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
             </div>
          </button>
      </div>
    </div>
  )
}

export default Sidebar
