import { useState, useEffect } from 'react'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { Target, Plus, Trash2, Edit2, TrendingUp, CheckCircle, Calendar, X } from 'lucide-react'

const Goals = ({ currency, openModal }) => {
  const [goals, setGoals] = useState([])
  
  // --- STATES FOR MODALS ---
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFundModalOpen, setIsFundModalOpen] = useState(false) // <--- NEW STATE
  
  // --- DATA STATES ---
  const [form, setForm] = useState({ id: null, name: '', target_amount: '', saved_amount: '0', deadline: '', color: '#6366f1' })
  const [selectedGoal, setSelectedGoal] = useState(null) // <--- Track which goal we are adding money to
  const [fundAmount, setFundAmount] = useState('') // <--- Amount to add

  // --- FETCH GOALS ---
  const fetchGoals = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/goals')
      setGoals(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchGoals() }, [])

  // --- CALCULATE INSIGHT ---
  const getInsight = (target, saved, deadline) => {
      if (saved >= target) return "Goal Completed! 🎉"
      const today = new Date()
      const end = new Date(deadline)
      const months = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth())
      if (months <= 0) return "Deadline passed!"
      const remaining = target - saved
      const perMonth = remaining / months
      return `Save ${currency}${perMonth.toFixed(0)}/mo to reach by deadline`
  }

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
      e.preventDefault()
      try {
          if (form.id) await axios.put(`http://127.0.0.1:5000/api/goals/${form.id}`, form)
          else await axios.post('http://127.0.0.1:5000/api/goals', form)
          
          setIsFormOpen(false)
          setForm({ id: null, name: '', target_amount: '', saved_amount: '0', deadline: '', color: '#6366f1' })
          fetchGoals()
      } catch (err) { alert("Error saving goal") }
  }

  const handleDelete = async (id) => {
      if(confirm("Delete this goal?")) {
          await axios.delete(`http://127.0.0.1:5000/api/goals/${id}`)
          fetchGoals()
      }
  }

  const handleEdit = (g) => {
      setForm(g)
      setIsFormOpen(true)
  }

  // --- NEW: OPEN FUND MODAL ---
  const openFundModal = (goal) => {
      setSelectedGoal(goal)
      setFundAmount('')
      setIsFundModalOpen(true)
  }

  // --- NEW: SUBMIT FUNDS ---
  const handleFundSubmit = async (e) => {
      e.preventDefault()
      if (!selectedGoal || !fundAmount) return

      try {
          const newSaved = selectedGoal.saved_amount + parseFloat(fundAmount)
          await axios.put(`http://127.0.0.1:5000/api/goals/${selectedGoal.id}`, { saved_amount: newSaved })
          
          // CELEBRATION IF COMPLETED
          if (newSaved >= selectedGoal.target_amount) {
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
          }
          
          setIsFundModalOpen(false)
          fetchGoals()
      } catch (err) { console.error(err) }
  }

  // --- STATS ---
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.saved_amount, 0)
  const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="flex-1 p-8 overflow-hidden flex flex-col h-full animate-fade-in text-white relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-pink-500" /> Financial Goals
          </h2>
          <p className="text-gray-500">Dream it. Save it. Achieve it.</p>
        </div>
        <button onClick={() => { setForm({id:null, name:'', target_amount:'', saved_amount:'0', deadline:'', color:'#ec4899'}); setIsFormOpen(true)}} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-xl font-bold transition shadow-lg shadow-pink-600/20">
            <Plus size={18} /> New Goal
        </button>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 border border-pink-500/20 p-6 rounded-2xl mb-8 flex items-center justify-between shrink-0">
          <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Progress</p>
              <h3 className="text-3xl font-bold mt-1">{currency}{totalSaved.toLocaleString()} <span className="text-lg text-gray-500 font-medium">/ {currency}{totalTarget.toLocaleString()}</span></h3>
          </div>
          <div className="text-right">
              <h3 className="text-3xl font-bold text-pink-400">{progress.toFixed(0)}%</h3>
              <p className="text-xs text-gray-400 uppercase">Funded</p>
          </div>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-1">
          {goals.map(goal => {
              const percent = Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
              const isCompleted = percent >= 100
              
              return (
                  <div key={goal.id} className={`bg-[#1a1b26] p-5 rounded-2xl border transition group relative overflow-hidden ${isCompleted ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                      {/* HEADER */}
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{backgroundColor: `${goal.color}20`, color: goal.color}}>
                                  {goal.name.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg">{goal.name}</h4>
                                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/> {goal.deadline}</p>
                              </div>
                          </div>
                          {isCompleted && <CheckCircle className="text-yellow-500" size={24} />}
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="mb-2 flex justify-between text-xs font-bold text-gray-400">
                          <span>{percent.toFixed(0)}%</span>
                          <span>{currency}{goal.target_amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
                          <div className="h-full rounded-full transition-all duration-1000" style={{width: `${percent}%`, backgroundColor: isCompleted ? '#eab308' : goal.color}}></div>
                      </div>

                      {/* INSIGHT */}
                      <div className="bg-[#0b0c15] p-3 rounded-lg mb-4 text-xs text-gray-400 flex items-center gap-2">
                          <TrendingUp size={14} className={isCompleted ? "text-yellow-500" : "text-gray-500"}/>
                          {getInsight(goal.target_amount, goal.saved_amount, goal.deadline)}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2">
                          <button onClick={() => openFundModal(goal)} disabled={isCompleted} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-bold transition disabled:opacity-50">
                              + Add Funds
                          </button>
                          <button onClick={() => handleEdit(goal)} className="p-2 hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 rounded-lg transition"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(goal.id)} className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition"><Trash2 size={16}/></button>
                      </div>
                  </div>
              )
          })}
      </div>

      {/* MODAL 1: CREATE / EDIT GOAL */}
      {isFormOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-[#1a1b26] p-6 rounded-2xl border border-gray-700 w-full max-w-sm relative shadow-2xl">
                  <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                  <h3 className="text-xl font-bold mb-4">{form.id ? 'Edit Goal' : 'Create New Goal'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                      <div><label className="text-xs text-gray-500 uppercase font-bold">Goal Name</label><input autoFocus required type="text" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-2 text-white mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. New iPhone" /></div>
                      <div><label className="text-xs text-gray-500 uppercase font-bold">Target Amount</label><input required type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-2 text-white mt-1" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} placeholder="50000" /></div>
                      {!form.id && <div><label className="text-xs text-gray-500 uppercase font-bold">Initial Savings (Optional)</label><input type="number" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-2 text-white mt-1" value={form.saved_amount} onChange={e => setForm({...form, saved_amount: e.target.value})} placeholder="0" /></div>}
                      <div><label className="text-xs text-gray-500 uppercase font-bold">Deadline</label><input required type="date" className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-2 text-white mt-1" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Color</label>
                          <div className="flex gap-2 mt-1">
                              {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#ec4899'].map(c => (
                                  <div key={c} onClick={() => setForm({...form, color: c})} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${form.color === c ? 'border-white' : 'border-transparent'}`} style={{backgroundColor: c}}></div>
                              ))}
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-lg font-bold mt-2">Save Goal</button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL 2: ADD FUNDS (NEW) */}
      {isFundModalOpen && selectedGoal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-[#1a1b26] p-6 rounded-2xl border border-gray-700 w-full max-w-sm relative shadow-2xl">
                  <button onClick={() => setIsFundModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                  
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" style={{backgroundColor: `${selectedGoal.color}20`, color: selectedGoal.color}}>
                          {selectedGoal.name.charAt(0)}
                      </div>
                      <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Add Funds To</p>
                          <h3 className="text-xl font-bold text-white">{selectedGoal.name}</h3>
                      </div>
                  </div>

                  <form onSubmit={handleFundSubmit} className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Amount to Add</label>
                          <input 
                              autoFocus 
                              required 
                              type="number" 
                              className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1 text-lg font-bold" 
                              value={fundAmount} 
                              onChange={e => setFundAmount(e.target.value)} 
                              placeholder="0.00" 
                          />
                      </div>
                      
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                          <Plus size={18}/> Deposit Funds
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  )
}

export default Goals