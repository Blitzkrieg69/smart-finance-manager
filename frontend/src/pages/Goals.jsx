import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Target, Calendar as CalendarIcon, X } from 'lucide-react'
import CustomCalendar from '../components/CustomCalendar' // IMPORTED

const Goals = ({ currency, openModal }) => { 
  const [goals, setGoals] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // NEW: Calendar State
  const [showCalendar, setShowCalendar] = useState(false)

  const getToday = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    id: null,
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: getToday(), // Default to today
    color: '#6366f1'
  })

  const fetchGoals = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/goals')
      setGoals(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (form.id) await axios.put(`http://127.0.0.1:5000/api/goals/${form.id}`, form)
      else await axios.post('http://127.0.0.1:5000/api/goals', form)
      setIsModalOpen(false)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/goals/${id}`)
      fetchGoals()
    } catch (err) { console.error(err) }
  }

  const openGoalModal = (goal = null) => {
    if (goal) {
      setForm(goal)
    } else {
      setForm({ id: null, name: '', target_amount: '', saved_amount: '', deadline: getToday(), color: '#6366f1' })
    }
    setShowCalendar(false) // Reset calendar
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 p-8 h-full overflow-y-auto custom-scrollbar animate-fade-in" onClick={() => setShowCalendar(false)}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Goals</h2>
          <p className="text-gray-400 text-sm mt-1">Track your savings targets</p>
        </div>
        <button 
          onClick={() => openGoalModal()} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} /> New Goal
        </button>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
          
          return (
            <div key={goal.id} className="bg-[#12131e] border border-gray-800 rounded-2xl p-6 relative group hover:border-gray-700 transition-all duration-300">
              <button 
                onClick={() => handleDelete(goal.id)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                   <Target size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                  <p className="text-xs text-gray-400">by {goal.deadline}</p>
                </div>
              </div>

              <div className="mb-2 flex justify-between items-end">
                <span className="text-2xl font-bold text-white">{currency}{goal.saved_amount}</span>
                <span className="text-xs text-gray-500 font-medium uppercase">Target: {currency}{goal.target_amount}</span>
              </div>

              <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${progress}%`, backgroundColor: goal.color, boxShadow: `0 0 10px ${goal.color}` }}
                ></div>
              </div>
              
              <button 
                onClick={() => openGoalModal(goal)}
                className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                Edit Goal
              </button>
            </div>
          )
        })}

        {/* EMPTY STATE */}
        {goals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
            <Target size={48} className="mb-4 opacity-50" />
            <p>No goals set yet. Start saving today!</p>
          </div>
        )}
      </div>

      {/* GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[#1a1b26] p-8 rounded-2xl border border-gray-700 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={20}/>
            </button>
            <h2 className="text-xl font-bold mb-6 text-white capitalize">{form.id ? 'Edit Goal' : 'New Goal'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Goal Name</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. New Car" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Target Amount</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" 
                    value={form.target_amount} 
                    onChange={e => setForm({...form, target_amount: e.target.value})} 
                    placeholder="0.00" 
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Saved So Far</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 mt-1" 
                    value={form.saved_amount} 
                    onChange={e => setForm({...form, saved_amount: e.target.value})} 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              {/* CUSTOM CALENDAR INPUT */}
              <div className="relative">
                  <label className="text-xs font-bold text-gray-500 uppercase">Target Date</label>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar) }} 
                    className="w-full flex items-center gap-2 bg-[#0b0c15] border border-gray-700 rounded-lg p-3 text-white mt-1 hover:border-blue-500 transition"
                  >
                      <CalendarIcon size={16} className="text-gray-400"/>
                      {form.deadline}
                  </button>
                  
                  {showCalendar && (
                    <CustomCalendar 
                      selectedDate={form.deadline} 
                      onSelect={(date) => setForm({...form, deadline: date})} 
                      onClose={() => setShowCalendar(false)} 
                    />
                  )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Color Tag</label>
                <div className="flex gap-3 mt-2">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setForm({...form, color})}
                      className={`w-8 h-8 rounded-full border-2 transition ${form.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition">
                {form.id ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals