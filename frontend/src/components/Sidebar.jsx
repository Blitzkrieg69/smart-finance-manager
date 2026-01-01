import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, Briefcase, Target, LogOut, Settings, Download } from 'lucide-react'

const Sidebar = ({ view, setView, onExport }) => { // Removed currency props
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500', hover: 'group-hover:text-blue-400', activeBg: 'bg-blue-600' },
    { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-emerald-500', hover: 'group-hover:text-emerald-400', activeBg: 'bg-emerald-600' },
    { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'text-red-500', hover: 'group-hover:text-red-400', activeBg: 'bg-red-600' },
    { id: 'investment', label: 'Investments', icon: Briefcase, color: 'text-purple-500', hover: 'group-hover:text-purple-400', activeBg: 'bg-purple-600' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'text-pink-500', hover: 'group-hover:text-pink-400', activeBg: 'bg-pink-600' },
    { id: 'budget', label: 'Budgets', icon: PieChart, color: 'text-yellow-500', hover: 'group-hover:text-yellow-400', activeBg: 'bg-yellow-600' },
  ]

  return (
    <div className="w-64 bg-[#0b0c15] border-r border-gray-800 flex flex-col shrink-0 transition-all duration-300">
      
      {/* LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/20">
          <span className="font-bold text-white text-xl">F</span>
        </div>
        <h1 className="font-bold text-xl tracking-tight text-white">Finance<span className="text-blue-500">AI</span></h1>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
        
        {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            
            return (
                <button 
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? `${item.activeBg} shadow-lg text-white` : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <Icon size={20} className={`transition-colors ${isActive ? 'text-white' : `${item.color} ${item.hover}`}`} />
                    <span className="font-medium">{item.label}</span>
                </button>
            )
        })}

        <div className="pt-6 mt-6 border-t border-gray-800">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tools</p>
            <button onClick={onExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition group">
                <Download size={20} className="text-cyan-500 group-hover:text-cyan-400" />
                <span className="font-medium">Export Data</span>
            </button>
        </div>
      </div>

      {/* USER PROFILE (Removed Currency Toggle) */}
      <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400"><Settings size={16}/></div>
              <div className="flex-1">
                  <p className="text-xs font-bold text-white">Guest User</p>
                  <p className="text-[10px] text-gray-500">INR Mode (₹)</p>
              </div>
              <button className="text-gray-500 hover:text-red-400"><LogOut size={18}/></button>
          </div>
      </div>
    </div>
  )
}

export default Sidebar