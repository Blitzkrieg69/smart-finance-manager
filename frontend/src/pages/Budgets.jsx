import { CheckCircle, AlertTriangle, Target, Trash2, Edit2, CalendarClock } from 'lucide-react'

const Budgets = ({ budgets, expenses, openModal, handleDelete, handleEdit, currency }) => { // <--- Added prop
  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0">
         <div><h2 className="text-2xl font-bold text-white">Budget Enforcer</h2><p className="text-gray-500">Visual tracking of your spending limits</p></div>
         <button onClick={() => openModal('budget')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition">+ Set New Budget</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {budgets.map(b => {
             const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount), 0)
             const percent = Math.min((spent / b.limit) * 100, 100)
             let color = "bg-blue-500"; let status = "Healthy"; let icon = <CheckCircle size={16} className="text-gray-400"/>; let statusColor = "text-gray-300"
             if(percent > 80) { color = "bg-yellow-500"; status = "Warning"; icon = <AlertTriangle size={16} className="text-yellow-500"/>; statusColor = "text-yellow-500" }
             if(percent >= 100) { color = "bg-red-500"; status = "Exceeded"; icon = <AlertTriangle size={16} className="text-red-500"/>; statusColor = "text-red-500" }

             return (
               <div key={b.id} className="bg-[#12131e] p-6 rounded-2xl border border-gray-800 relative group hover:border-gray-600 transition flex flex-col justify-between h-52">
                  <div className="flex justify-between items-start">
                     <div><h3 className="font-bold text-xl text-white">{b.category}</h3><div className="flex items-center gap-1 mt-1">{icon} <span className={`text-xs font-bold ${statusColor}`}>{status}</span></div></div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => handleEdit(b, 'budget')} className="p-2 bg-gray-800 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition"><Edit2 size={16}/></button><button onClick={() => handleDelete(b.id, 'budget')} className="p-2 bg-gray-800 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition"><Trash2 size={16}/></button></div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                     <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-[10px] text-gray-400 border border-gray-700"><CalendarClock size={12} /> {b.period || 'Monthly'}</div>
                     <div className="text-right"><p className="text-gray-500 text-xs uppercase font-bold">Limit</p><p className="text-white font-bold text-xl">{currency}{b.limit}</p></div>
                  </div>
                  <div className="mt-4"><div className="flex justify-between text-xs font-bold text-gray-400 mb-2"><span>{currency}{spent} Spent</span><span>{percent.toFixed(0)}%</span></div><div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{width: `${percent}%`}}></div></div></div>
               </div>
             )
           })}
           {budgets.length === 0 && <div className="col-span-3 h-64 flex flex-col items-center justify-center bg-[#12131e] rounded-2xl border border-dashed border-gray-800"><Target size={48} className="text-gray-700 mb-4" /><p className="text-gray-500">No budgets set.</p></div>}
        </div>
      </div>
    </div>
  )
}

export default Budgets