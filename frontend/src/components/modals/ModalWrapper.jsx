import { X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  const { theme } = useTheme()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div 
        className={`w-full max-w-md p-8 rounded-2xl border relative transition-all duration-300 ${
          theme === 'neon' 
            ? 'bg-black border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]' 
            : 'bg-[#12131e] border-white/10 shadow-2xl'
        }`}
      >
        {/* CLOSE BUTTON */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
        >
          <X size={20}/>
        </button>

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-6 text-white capitalize flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full block"></span>
            {title}
        </h2>

        {/* CONTENT (The Form goes here) */}
        <div>
            {children}
        </div>
      </div>
    </div>
  )
}

export default ModalWrapper