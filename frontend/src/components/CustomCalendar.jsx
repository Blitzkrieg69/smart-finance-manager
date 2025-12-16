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
    <div className="absolute top-12 right-0 bg-[#1a1b26] border border-gray-700 rounded-xl shadow-2xl p-4 w-64 z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16} className="text-gray-400"/></button>
        <span className="font-bold text-white">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded"><ChevronRight size={16} className="text-gray-400"/></button>
      </div>
      <div className="grid grid-cols-7 mb-2">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => {
           const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
           const fullDate = `${currentDate.getFullYear()}-${month}-${day.toString().padStart(2, '0')}`
           const isSelected = selectedDate === fullDate
           return (<button type="button" key={day} onClick={() => handleDayClick(day)} className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50' : 'text-gray-300 hover:bg-white/10'}`}>{day}</button>)
        })}
      </div>
    </div>
  )
}

export default CustomCalendar