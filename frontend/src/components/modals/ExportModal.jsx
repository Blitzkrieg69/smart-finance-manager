import { useState } from 'react'
import axios from 'axios'
import { X, Calendar as CalendarIcon, Download } from 'lucide-react'
import CustomCalendar from '../CustomCalendar' // Make sure this path is correct for your setup

const ExportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const getToday = () => new Date().toISOString().split('T')[0]
  
  // State for the form
  const [exportForm, setExportForm] = useState({ 
    start_date: getToday(), 
    end_date: getToday(), 
    type: 'all' 
  })
  
  const [activeCalendar, setActiveCalendar] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleExport = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Request the file from the Backend
      const response = await axios.post('http://127.0.0.1:5001/api/export', exportForm, { 
        responseType: 'blob' // Important: Tells axios we are downloading a file
      })

      // 2. Create a download link invisibly
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `finance_report_${exportForm.type}_${exportForm.start_date}.csv`)
      
      // 3. Trigger click
      document.body.appendChild(link)
      link.click()
      
      // 4. Cleanup
      link.parentNode.removeChild(link)
      onClose()
    } catch (error) {
      console.error("Export failed", error)
      alert("Failed to download. Make sure the backend is running!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-[#09090b]/90 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 w-full max-w-sm relative shadow-2xl">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-full transition">
          <X size={20}/>
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          <Download size={20} className="text-blue-500" /> Export Data
        </h2>

        {/* Form */}
        <form onSubmit={handleExport} className="space-y-4">
          
          {/* Start Date */}
          <div className="relative group">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Start Date</label>
            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveCalendar('start') }} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 text-white hover:bg-white/10 transition text-left">
              <CalendarIcon size={16} className="text-gray-400"/> {exportForm.start_date}
            </button>
            {activeCalendar === 'start' && (
              <CustomCalendar 
                selectedDate={exportForm.start_date} 
                onSelect={(date) => setExportForm({...exportForm, start_date: date})} 
                onClose={() => setActiveCalendar(null)} 
              />
            )}
          </div>

          {/* End Date */}
          <div className="relative group">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">End Date</label>
            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveCalendar('end') }} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 text-white hover:bg-white/10 transition text-left">
              <CalendarIcon size={16} className="text-gray-400"/> {exportForm.end_date}
            </button>
            {activeCalendar === 'end' && (
              <CustomCalendar 
                selectedDate={exportForm.end_date} 
                onSelect={(date) => setExportForm({...exportForm, end_date: date})} 
                onClose={() => setActiveCalendar(null)} 
              />
            )}
          </div>

          {/* Type Selector */}
          <div className="group">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Data Type</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition" 
              value={exportForm.type} 
              onChange={e => setExportForm({...exportForm, type: e.target.value})}
            >
              <option value="all" className="bg-[#1a1b26]">All Transactions</option>
              <option value="income" className="bg-[#1a1b26]">Income Only</option>
              <option value="expense" className="bg-[#1a1b26]">Expenses Only</option>
            </select>
          </div>

          {/* Download Button */}
          <button 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 transition shadow-lg shadow-emerald-900/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Download CSV'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ExportModal