import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Bell, AlertTriangle } from 'lucide-react'

// COMPONENTS
import Sidebar from './components/Sidebar'
import AddEditModal from './components/modals/AddEditModal'
import ExportModal from './components/modals/ExportModal'
import Login from './pages/Login'

// PAGES
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expense from './pages/Expense'
import Budgets from './pages/Budgets'
import Investments from './pages/Investments'
import Goals from './pages/Goals'

// Configure axios defaults
axios.defaults.withCredentials = true

function App() {
  // AUTH STATE
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // DATA STATE
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [investments, setInvestments] = useState([])
  const [exchangeRate, setExchangeRate] = useState(84) 

  // VIEW STATE
  const [view, setView] = useState('dashboard') 
  const currency = '₹' 
  
  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('expense')
  const [editingItem, setEditingItem] = useState(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  
  // NOTIFICATIONS
  const [showNotifications, setShowNotifications] = useState(false)
  const [clearedAlerts, setClearedAlerts] = useState([]) 

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5001/api/auth/check')
      if (response.data.authenticated) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.log('Not authenticated')
    } finally {
      setAuthChecked(true)
    }
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    fetchData()
  }

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:5001/api/auth/logout')
      setUser(null)
      setTransactions([])
      setBudgets([])
      setInvestments([])
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get('http://127.0.0.1:5001/api/transactions'),
        axios.get('http://127.0.0.1:5001/api/budgets'),
        axios.get('http://127.0.0.1:5001/api/investments')
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
    } catch (err) { 
      console.error("API Error", err) 
    }
  }

  useEffect(() => { 
    if (user) {
      fetchData() 
    }
  }, [user])

  // HANDLERS
  const handleDelete = async (id, type = 'transaction') => {
    let endpoint = `/api/transactions/${id}`
    if (type === 'budget') endpoint = `/api/budgets/${id}`
    if (type === 'investment') endpoint = `/api/investments/${id}`
    await axios.delete(`http://127.0.0.1:5001${endpoint}`)
    fetchData()
  }

  const handleEdit = (item, type) => {
    setModalType(type)
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const openModal = (type) => {
    setModalType(type)
    setEditingItem(null)
    setIsModalOpen(true)
  }

  // ALERTS LOGIC
  const expenses = transactions.filter(t => t.type === 'expense')
  const rawAlerts = budgets.map(b => { 
      const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0); 
      const percent = (spent / b.limit) * 100; 
      const alertType = percent >= 100 ? 'critical' : percent >= 80 ? 'warning' : 'healthy'; 
      if (alertType === 'healthy') return null; 
      return { 
        id: `${b.id}-${alertType}`, 
        budgetId: b.id, 
        category: b.category, 
        percent: percent, 
        type: alertType, 
        message: alertType === 'critical' ? `Exceeded limit by ${currency}${(spent - b.limit).toFixed(0)}` : `${percent.toFixed(0)}% of budget used` 
      } 
  }).filter(Boolean); 
  const activeAlerts = rawAlerts.filter(a => !clearedAlerts.includes(a.id)); 
  const handleClearNotifications = () => { 
    setClearedAlerts(prev => [...prev, ...activeAlerts.map(a => a.id)]); 
    setShowNotifications(false) 
  }

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0b0c15] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex h-screen bg-[#0b0c15] text-white font-sans overflow-hidden">
      
      <Sidebar view={view} setView={setView} onExport={() => setIsExportOpen(true)} />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 flex justify-between items-center px-8 bg-[#0b0c15] shrink-0">
          <h2 className="text-lg font-bold capitalize text-white tracking-wide">{view} Overview</h2>
          <div className="flex items-center gap-6">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-white/5 transition">
                  <Bell className="text-gray-400" size={20} />
                  {activeAlerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0c15]"></span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 animate-fade-in z-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-sm text-white">Notifications ({activeAlerts.length})</h4>
                      <button onClick={handleClearNotifications} title="Clear All" className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {activeAlerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                          <AlertTriangle size={18} className={alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
                          <div>
                            <p className="text-sm font-bold text-white">{alert.category}</p>
                            <p className="text-xs text-gray-400">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                      {activeAlerts.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No new notifications</p>}
                    </div>
                  </div>
                )}
             </div>
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <p className="text-xs text-gray-300 font-medium">{user.name}</p>
                 <p className="text-[10px] text-gray-500">{user.email}</p>
               </div>
               <button 
                 onClick={handleLogout}
                 title="Logout"
                 className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-white/20 shadow-lg shadow-cyan-500/20 hover:scale-110 transition flex items-center justify-center"
               >
                 <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
               </button>
             </div>
          </div>
        </header>

        {/* CONTENT */}
        {view === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} openModal={openModal} currency={currency} />}
        {view === 'income' && <Income data={transactions.filter(t => t.type === 'income')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'expense' && <Expense data={transactions.filter(t => t.type === 'expense')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'budget' && <Budgets budgets={budgets} expenses={transactions.filter(t => t.type === 'expense')} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} />}
        {view === 'investment' && <Investments investments={investments} openModal={openModal} handleDelete={handleDelete} handleEdit={handleEdit} currency={currency} exchangeRate={exchangeRate} />}
        {view === 'goals' && <Goals currency={currency} openModal={openModal} />}

        {/* MODALS */}
        <AddEditModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            type={modalType} 
            initialData={editingItem}
            onSuccess={fetchData}
            currency={currency}
        />

        <ExportModal 
            isOpen={isExportOpen} 
            onClose={() => setIsExportOpen(false)} 
        />

      </div>
    </div>
  )
}

export default App