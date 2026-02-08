import { useState } from 'react'
import axios from 'axios'
import { X, Calendar as CalendarIcon, Download } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'


const ExportModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(null)
  const [loading, setLoading] = useState(false)


  const getToday = () => new Date().toISOString().split('T')[0]
  
  const [exportForm, setExportForm] = useState({ 
    start_date: getToday(), 
    end_date: getToday(), 
    type: 'all' 
  })


  const handleExport = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post('http://localhost:5000/api/export', exportForm, { 
        responseType: 'blob'
      })


      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `finance_report_${exportForm.type}_${exportForm.start_date}.csv`)
      
      document.body.appendChild(link)
      link.click()
      
      link.parentNode.removeChild(link)
      onClose()
    } catch (error) {
      console.error("Export failed", error)
      alert("Failed to download. Make sure the backend is running!")
    } finally {
      setLoading(false)
    }
  }


  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-2xl border relative overflow-hidden ${theme === 'dark' ? 'bg-black border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-emerald-500/20' : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>


          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#F5F5DC] border-[#654321]/30'}`}>
              <Download size={20} className={theme === 'dark' ? 'text-emerald-400' : 'text-[#4B3621]'} />
            </div>
            <div>
              <h2 className={`text-xl font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                Export Data
              </h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                Download your financial records
              </p>
            </div>
          </div>
        </div>


        {/* FORM */}
        <form onSubmit={handleExport} className="p-6 space-y-4">
          
          {/* Start Date */}
          <div className="relative">
            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              Start Date
            </label>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setActiveCalendar(activeCalendar === 'start' ? null : 'start') }} 
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 text-white' : 'bg-white border-[#C9A87C]/50 hover:border-[#654321] text-[#4B3621]'}`}
            >
              <CalendarIcon size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-[#654321]'}/>
              <span className="font-mono text-sm font-bold">{exportForm.start_date}</span>
            </button>
            {activeCalendar === 'start' && (
              <div className="absolute top-full left-0 z-50 mt-2">
                <CustomCalendar 
                  selectedDate={exportForm.start_date} 
                  onSelect={(date) => { setExportForm({...exportForm, start_date: date}); setActiveCalendar(null); }} 
                  onClose={() => setActiveCalendar(null)} 
                />
              </div>
            )}
          </div>


          {/* End Date */}
          <div className="relative">
            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              End Date
            </label>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setActiveCalendar(activeCalendar === 'end' ? null : 'end') }} 
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 text-white' : 'bg-white border-[#C9A87C]/50 hover:border-[#654321] text-[#4B3621]'}`}
            >
              <CalendarIcon size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-[#654321]'}/>
              <span className="font-mono text-sm font-bold">{exportForm.end_date}</span>
            </button>
            {activeCalendar === 'end' && (
              <div className="absolute top-full left-0 z-50 mt-2">
                <CustomCalendar 
                  selectedDate={exportForm.end_date} 
                  onSelect={(date) => { setExportForm({...exportForm, end_date: date}); setActiveCalendar(null); }} 
                  onClose={() => setActiveCalendar(null)} 
                />
              </div>
            )}
          </div>


          {/* Type Selector */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              Data Type
            </label>
            <select 
              className={`w-full px-3 py-2.5 rounded-xl border outline-none transition font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-emerald-500/50 text-white' : 'bg-white border-[#C9A87C]/50 focus:border-[#654321] text-[#4B3621]'}`}
              value={exportForm.type} 
              onChange={e => setExportForm({...exportForm, type: e.target.value})}
            >
              <option value="all" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>All Transactions</option>
              <option value="income" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Income Only</option>
              <option value="expense" className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Expenses Only</option>
            </select>
          </div>


          {/* Download Button */}
          <button 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400 disabled:opacity-50' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg disabled:opacity-50'}`}
          >
            {loading ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <>
                <Download size={18}/> 
                Download CSV
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}


export default ExportModal
