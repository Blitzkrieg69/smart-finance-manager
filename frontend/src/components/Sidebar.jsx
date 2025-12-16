import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, PieChart as PieChartIcon, Globe } from 'lucide-react'

const Sidebar = ({ view, setView, currency, setCurrency }) => {
  
  const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'GBP', symbol: '£', label: 'British Pound' }
  ]

  const NavItem = ({ name, id, icon }) => (
    <button 
      onClick={() => setView(id)} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        view === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-gray-400 hover:bg-white/5'
      }`}
    >
      {icon} <span className="font-medium text-sm">{name}</span>
    </button>
  )

  return (
    <div className="w-64 border-r border-gray-800 bg-[#0b0c15] flex flex-col p-6 hidden md:flex shrink-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Wallet size={20} className="text-white" />
        </div>
        <h1 className="font-bold text-xl tracking-wide text-white">Finance<span className="text-blue-500">AI</span></h1>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem name="Dashboard" id="dashboard" icon={<LayoutDashboard size={20}/>} />
        <NavItem name="Income" id="income" icon={<TrendingUp size={20}/>} />
        <NavItem name="Expenses" id="expense" icon={<TrendingDown size={20}/>} />
        <NavItem name="Budgets" id="budget" icon={<PieChartIcon size={20}/>} />
      </nav>

      {/* CURRENCY SELECTOR */}
      <div className="mt-auto pt-6 border-t border-gray-800">
        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Currency</label>
        <div className="relative">
            <Globe size={16} className="absolute left-3 top-3 text-gray-400" />
            <select 
                className="w-full bg-[#1a1b26] text-white text-sm rounded-lg py-2.5 pl-10 pr-4 outline-none border border-gray-700 focus:border-blue-500 appearance-none cursor-pointer"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
            >
                {CURRENCIES.map(c => (
                    <option key={c.code} value={c.symbol}>
                        {c.symbol} &nbsp; {c.code}
                    </option>
                ))}
            </select>
        </div>
      </div>
    </div>
  )
}

export default Sidebar