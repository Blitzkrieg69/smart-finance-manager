import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CustomCalendar = ({ selectedDate, onSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  
  const handleDayClick = (day) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const dateStr = `${currentDate.getFullYear()}-${month}-${day.toString().padStart(2, '0')}`
    onSelect(dateStr)
    onClose()
  }
  
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div 
      className="absolute top-12 right-0 bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-4 w-72 z-50 animate-fade-in" 
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 px-1">
        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition">
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-white tracking-wide">
          {months[currentDate.getMonth()]} <span className="text-gray-400">{currentDate.getFullYear()}</span>
        </span>
        <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* DAYS HEADER - FIXED FONT COLOR */}
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => {
           const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
           const fullDate = `${currentDate.getFullYear()}-${month}-${day.toString().padStart(2, '0')}`
           const isSelected = selectedDate === fullDate
           
           return (
             <button 
               type="button" 
               key={day} 
               onClick={() => handleDayClick(day)} 
               className={`
                  h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' 
                    : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }
               `}
             >
               {day}
             </button>
           )
        })}
      </div>
    </div>
  )
}

export default CustomCalendar