import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bell, AlertTriangle } from 'lucide-react'
import { ThemeProvider, useTheme } from './context/ThemeContext' // Import Context

// COMPONENTS
import Sidebar from './components/Sidebar'
import AddEditModal from './components/modals/AddEditModal'
import ExportModal from './components/modals/ExportModal'

// PAGES
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expense from './pages/Expense'
import Budgets from './pages/Budgets'
import Investments from './pages/Investments'
import Goals from './pages/Goals'

// Separate Component to use the Hook
const AppContent = () => {
  const { theme, styles } = useTheme() // ACCESS THEME
  
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [investments, setInvestments] = useState([])
  const [exchangeRate, setExchangeRate] = useState(84) 
  const [view, setView] = useState('dashboard') 
  const currency = '₹' 
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('expense')
  const [editingItem, setEditingItem] = useState(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [clearedAlerts, setClearedAlerts] = useState([]) 

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get('http://127.0.0.1:5000/api/transactions'),
        axios.get('http://127.0.0.1:5000/api/budgets'),
        axios.get('http://127.0.0.1:5000/api/investments')
      ])
      if(results[0].status === 'fulfilled') setTransactions(results[0].value.data || [])
      if(results[1].status === 'fulfilled') setBudgets(results[1].value.data || [])
      if(results[2].status === 'fulfilled') {
          const data = results[2].value.data
          if (data.rate) {
              setExchangeRate(data.rate)
              setInvestments(data.investments || [])
          } else {
              setInvestments(data || [])
          }
      }
    } catch (err) { console.error("API Error", err) }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id, type = 'transaction') => {
    let endpoint = `/api/transactions/${id}`
    if (type === 'budget') endpoint = `/api/budgets/${id}`
    if (type === 'investment') endpoint = `/api/investments/${id}`
    try { await axios.delete(`http://127.0.0.1:5000${endpoint}`); fetchData() } catch (err) { console.error(err) }
  }

  const handleEdit = (item, type) => { setModalType(type); setEditingItem(item); setIsModalOpen(true) }
  const openModal = (type) => { setModalType(type); setEditingItem(null); setIsModalOpen(true) }

  const expenses = transactions.filter(t => t.type === 'expense')
  const rawAlerts = budgets.map(b => { 
      const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0); 
      const percent = (spent / b.limit) * 100; 
      const alertType = percent >= 100 ? 'critical' : percent >= 80 ? 'warning' : 'healthy'; 
      if (alertType === 'healthy') return null; 
      return { id: `${b.id}-${alertType}`, budgetId: b.id, category: b.category, percent: percent, type: alertType, message: alertType === 'critical' ? `Exceeded limit by ${currency}${(spent - b.limit).toFixed(0)}` : `${percent.toFixed(0)}% of budget used` } 
  }).filter(Boolean); 
  const activeAlerts = rawAlerts.filter(a => !clearedAlerts.includes(a.id)); 
  const handleClearNotifications = () => { setClearedAlerts(prev => [...prev, ...activeAlerts.map(a => a.id)]); setShowNotifications(false) }

  return (
    // DYNAMIC BACKGROUND
    <div className={`flex h-screen ${styles.bg} ${styles.text} font-sans overflow-hidden transition-colors duration-500`}>
      
      <Sidebar view={view} setView={setView} onExport={() => setIsExportOpen(true)} />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* HEADER */}
        <header className={`h-16 border-b ${styles.borderSubtle} flex justify-between items-center px-8 shrink-0 transition-colors duration-500`}>
          <h2 className="text-lg font-bold capitalize tracking-wide">{view} Overview</h2>
          <div className="flex items-center gap-6">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-white/5 transition">
                  <Bell className="text-gray-400" size={20} />
                  {activeAlerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 top-12 w-80 p-4 rounded-xl shadow-2xl animate-fade-in z-50 ${styles.card}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-sm">Notifications ({activeAlerts.length})</h4>
                      <button onClick={handleClearNotifications} className="text-xs text-gray-500 hover:text-white transition">Clear All</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {activeAlerts.map(alert => (<div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}><AlertTriangle size={18} className={alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'} /><div><p className="text-sm font-bold">{alert.category}</p><p className="text-xs text-gray-400">{alert.message}</p></div></div>))}
                      {activeAlerts.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No new notifications</p>}
                    </div>
                  </div>
                )}
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-white/20 shadow-lg"></div>
          </div>
        </header>

        {view === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} openModal={openModal} currency={currency} />}
        {view === 'income' && <Income data={transactions.filter(t => t.type === 'income')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'expense' && <Expense data={transactions.filter(t => t.type === 'expense')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'budget' && <Budgets budgets={budgets} expenses={transactions.filter(t => t.type === 'expense')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'investment' && <Investments investments={investments} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} exchangeRate={exchangeRate} />}
        {view === 'goals' && <Goals currency={currency} openModal={openModal} />}

        <AddEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} initialData={editingItem} onSuccess={fetchData} currency={currency} />
        <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      </div>
    </div>
  )
}

// MAIN WRAPPER
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App