import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const CustomCalendar = ({ selectedDate, onSelect, onClose }) => {
  const { theme } = useTheme()
  
  // Parse the initial date or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date()
  })

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
  }

  const handleDateClick = (day) => {
    // Create date object in local time to avoid timezone shifts
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    // Manually format to YYYY-MM-DD to preserve local date
    const offset = newDate.getTimezoneOffset()
    const localDate = new Date(newDate.getTime() - (offset*60*1000))
    const formatted = localDate.toISOString().split('T')[0]
    
    onSelect(formatted)
    onClose() 
  }

  const renderDays = () => {
    const days = []
    const totalDays = daysInMonth(currentDate)
    const startDay = firstDayOfMonth(currentDate)

    // Empty slots for days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // Simple string comparison for safety
      const isSelected = selectedDate === dayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const today = new Date();
      const isToday = 
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()

      days.push(
        <button
          key={day}
          type="button" 
          onClick={(e) => { e.stopPropagation(); handleDateClick(day) }}
          className={`
            h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300
            ${isSelected 
                ? (theme === 'neon' ? 'bg-blue-600 text-white shadow-[0_0_15px_#3b82f6]' : 'bg-blue-600 text-white shadow-lg') 
                : ''}
            ${!isSelected && isToday 
                ? (theme === 'neon' ? 'text-blue-400 border border-blue-500/50' : 'text-blue-300 border border-white/20') 
                : ''}
            ${!isSelected && !isToday 
                ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                : ''}
          `}
        >
          {day}
        </button>
      )
    }
    return days
  }

  // Dynamic Container Style
  const containerStyle = theme === 'neon' 
    ? 'bg-black border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
    : 'bg-[#1a1b26] border border-white/10 shadow-2xl'

  return (
    <div 
      className={`absolute top-full left-0 mt-2 p-4 rounded-xl z-50 w-64 animate-fade-in ${containerStyle}`}
      onClick={(e) => e.stopPropagation()} 
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button 
          type="button" 
          onClick={() => changeMonth(-1)} 
          className={`p-1 rounded-full transition ${theme === 'neon' ? 'text-blue-500 hover:text-white hover:bg-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <ChevronLeft size={16} />
        </button>
        
        <span className={`text-sm font-bold ${theme === 'neon' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-white'}`}>
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        
        <button 
          type="button" 
          onClick={() => changeMonth(1)} 
          className={`p-1 rounded-full transition ${theme === 'neon' ? 'text-blue-500 hover:text-white hover:bg-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* DAYS GRID */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <span key={d} className={`text-[10px] font-bold ${theme === 'neon' ? 'text-blue-500' : 'text-gray-500'}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  )
}

export default CustomCalendar