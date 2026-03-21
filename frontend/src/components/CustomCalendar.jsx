import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const pad2 = (n) => String(n).padStart(2, '0')

const formatYYYYMMDD = (date) => {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  return `${y}-${m}-${d}`
}

const parseYYYYMMDDLocal = (value) => {
  if (!value) return null
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const daysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

const firstDayOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1).getDay()

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const CustomCalendar = ({ selectedDate, onSelect, onClose }) => {
  const { theme } = useTheme()

  const initialDate = useMemo(() => {
    return parseYYYYMMDDLocal(selectedDate) || new Date()
  }, [selectedDate])

  const [currentDate, setCurrentDate] = useState(initialDate)

  useEffect(() => {
    const parsed = parseYYYYMMDDLocal(selectedDate)
    if (parsed) setCurrentDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }, [selectedDate])

  const changeMonth = (offset) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onSelect?.(formatYYYYMMDD(newDate))
    onClose?.()
  }

  const renderDays = () => {
    const days = []
    const totalDays = daysInMonth(currentDate)
    const startDay = firstDayOfMonth(currentDate)

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }

    const today = new Date()

    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayStr = formatYYYYMMDD(dayDate)
      const isSelected = selectedDate === dayStr
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()

      days.push(
        <button
          key={dayStr}
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDateClick(day) }}
          className={`
            h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300
            ${isSelected ? 'bg-blue-600 text-white shadow-lg' : ''}
            ${!isSelected && isToday ? 'text-blue-400 border border-blue-500/50' : ''}
            ${!isSelected && !isToday ? (theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-blue-500/10' : 'text-[#4B3621] hover:bg-[#654321]/10') : ''}
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    // ✅ REMOVED absolute top-full left-0 mt-2 — parent controls positioning
    <div
      className={`p-4 rounded-xl w-64 animate-fade-in ${
        theme === 'dark'
          ? 'bg-black border border-white/10 shadow-2xl'
          : 'bg-[#FFF8F0] border border-[#654321]/20 shadow-xl'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className={`p-1 rounded-full transition ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-[#654321] hover:bg-[#654321]/10'
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          className={`p-1 rounded-full transition ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-[#654321] hover:bg-[#654321]/10'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* WEEKDAY LABELS */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekdayLabels.map((d, idx) => (
          <span
            key={`wd-${idx}`}
            className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}
          >
            {d}
          </span>
        ))}
      </div>

      {/* DAYS */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  )
}

export default CustomCalendar
