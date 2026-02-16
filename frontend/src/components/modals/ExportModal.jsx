import { useState } from 'react'
import axios from 'axios'
import { X, Calendar as CalendarIcon, Download, FileText, TrendingUp, Target, Package, Database, AlertCircle } from 'lucide-react'
import CustomCalendar from '../CustomCalendar'
import { useTheme } from '../../context/ThemeContext'

const ExportModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme()
  const [activeCalendar, setActiveCalendar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedExportType, setSelectedExportType] = useState('transactions')

  const getToday = () => new Date().toISOString().split('T')[0]
  
  const [exportForm, setExportForm] = useState({ 
    start_date: getToday(), 
    end_date: getToday()
  })

  const exportTypes = [
    { 
      id: 'transactions', 
      label: 'Transactions', 
      icon: FileText, 
      needsDates: true,
      description: 'All income & expense records'
    },
    { 
      id: 'budgets', 
      label: 'Budget Report', 
      icon: Target, 
      needsDates: false,
      description: 'Current budget status and spending'
    },
    { 
      id: 'investments', 
      label: 'Investments', 
      icon: TrendingUp, 
      needsDates: false,
      description: 'Portfolio with ROI and current values'
    },
    { 
      id: 'goals', 
      label: 'Goals', 
      icon: Target, 
      needsDates: false,
      description: 'Financial goals progress tracking'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: Package, 
      needsDates: true,
      description: 'Summary for selected date range'
    },
    { 
      id: 'complete', 
      label: 'Complete Export', 
      icon: Database, 
      needsDates: true,
      description: 'Everything within date range'
    }
  ]

  const selectedType = exportTypes.find(t => t.id === selectedExportType)

  const handleExport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      let url = `http://localhost:5000/api/export/${selectedExportType}`
      let params = {}

      if (selectedType.needsDates) {
        params.start_date = exportForm.start_date
        params.end_date = exportForm.end_date
      }

      const response = await axios.get(url, { 
        params,
        responseType: 'blob',
        withCredentials: true
      })

      // Check if response is actually a blob
      if (response.data.size === 0) {
        throw new Error('No data received from server')
      }

      const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = urlBlob
      link.setAttribute('download', `${selectedExportType}_${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(urlBlob)
      }, 100)

      // Close modal after successful download
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      console.error("Export failed", error)
      
      // Set proper error message
      if (error.response) {
        setError(`Server error: ${error.response.status}. Make sure backend is running.`)
      } else if (error.request) {
        setError('Cannot connect to server. Is the backend running on port 5000?')
      } else {
        setError(error.message || 'Export failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-2xl rounded-2xl border relative overflow-hidden ${theme === 'dark' ? 'bg-black border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-[#FFF8F0] border-[#654321]/30 shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`relative px-6 py-4 border-b ${theme === 'dark' ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-emerald-500/20' : 'bg-[#F5F5DC] border-[#C9A87C]/30'}`}>
          
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-full transition ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[#654321] hover:text-[#4B3621] hover:bg-white'}`}
          >
            <X size={18}/>
          </button>

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

        {/* EXPORT TYPE SELECTOR */}
        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-emerald-500/10' : 'border-[#C9A87C]/30'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
            What do you want to export?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {exportTypes.map(type => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedExportType(type.id)
                    setError(null)
                  }}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedExportType === type.id
                      ? (theme === 'dark' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[#F5F5DC] border-[#654321] text-[#4B3621]')
                      : (theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30' : 'bg-white border-[#C9A87C]/30 text-[#654321]/70 hover:border-[#654321]/50')
                  }`}
                >
                  <Icon size={20} className="mx-auto mb-1" />
                  <p className="text-[10px] font-bold">{type.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleExport} className="p-6 space-y-4">
          
          {/* Date Range */}
          {selectedType.needsDates && (
            <>
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
                  <div className="absolute bottom-full left-0 z-50 mb-2">
                    <CustomCalendar 
                      selectedDate={exportForm.start_date} 
                      onSelect={(date) => { setExportForm({...exportForm, start_date: date}); setActiveCalendar(null); }} 
                      onClose={() => setActiveCalendar(null)} 
                    />
                  </div>
                )}
              </div>

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
                  <div className="absolute bottom-full left-0 z-50 mb-2">
                    <CustomCalendar 
                      selectedDate={exportForm.end_date} 
                      onSelect={(date) => { setExportForm({...exportForm, end_date: date}); setActiveCalendar(null); }} 
                      onClose={() => setActiveCalendar(null)} 
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Description */}
          <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#F5F5DC] border border-[#C9A87C]/30'}`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-[#654321]'}`}>
              {selectedType.description}
            </p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className={`p-3 rounded-xl flex items-start gap-2 ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-300'}`}>
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
          )}

          {/* Download Button */}
          <button 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border mt-2 ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400 disabled:opacity-50' : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-[#654321]/30 shadow-lg disabled:opacity-50'}`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⌛</span>
                <span>Exporting...</span>
              </>
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
