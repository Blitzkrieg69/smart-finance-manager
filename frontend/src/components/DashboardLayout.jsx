import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, X, AlertTriangle, Sun, Moon, Trash2 } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function DashboardLayout({ notifications = [], onExport }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);

  // Get Page Title
  const pageName = location.pathname.slice(1) || 'dashboard';
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  // Filter out dismissed notifications
  const activeNotifications = notifications.filter(
    n => !dismissedNotifications.includes(n.id)
  );

  // Clear all notifications
  const handleClearAll = () => {
    setDismissedNotifications(notifications.map(n => n.id));
    setTimeout(() => setShowNotifications(false), 300);
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${
      theme === 'dark' ? 'bg-[#0b0c15] text-white' : 'bg-[#FFF8F0] text-[#4B3621]'
    }`}>
      <Sidebar onExport={onExport} />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* HEADER */}
        <header className={`h-16 border-b flex justify-between items-center px-8 shrink-0 ${
          theme === 'dark' 
            ? 'border-white/5 bg-[#0b0c15]' 
            : 'border-[#654321]/10 bg-[#FFF8F0]'
        }`}>
          <h2 className={`text-lg font-bold tracking-wide ${
            theme === 'dark' ? 'text-white' : 'text-[#4B3621]'
          }`}>
            {title} Overview
          </h2>
          
          <div className="flex items-center gap-4">
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${
                theme === 'dark' 
                  ? 'hover:bg-white/5 text-gray-400 hover:text-yellow-400' 
                  : 'hover:bg-[#F5F5DC] text-[#654321] hover:text-[#4B3621]'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-all ${
                  theme === 'dark' 
                    ? 'hover:bg-white/5 text-gray-400' 
                    : 'hover:bg-[#F5F5DC] text-[#654321]'
                }`}
              >
                <Bell size={20} />
                {activeNotifications.length > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-bold ${
                    theme === 'dark'
                      ? 'bg-red-500 text-white border-2 border-[#0b0c15]'
                      : 'bg-red-500 text-white border-2 border-[#FFF8F0]'
                  }`}>
                    {activeNotifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className={`absolute right-0 top-12 w-96 rounded-2xl shadow-2xl p-4 z-50 border animate-fade-in ${
                  theme === 'dark'
                    ? 'bg-[#09090b]/95 backdrop-blur-xl border-white/10'
                    : 'bg-white border-[#654321]/20 shadow-lg'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className={`font-bold text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-[#4B3621]'
                    }`}>
                      Notifications ({activeNotifications.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      {activeNotifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            theme === 'dark'
                              ? 'text-red-400 hover:bg-red-500/10 border border-red-500/30'
                              : 'text-red-600 hover:bg-red-50 border border-red-300'
                          }`}
                          title="Clear all notifications"
                        >
                          <Trash2 size={12} />
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className={`p-1 rounded-lg transition ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-[#F5F5DC]'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {activeNotifications.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border flex gap-3 transition-all ${
                          alert.type === 'critical'
                            ? theme === 'dark'
                              ? 'border-red-500/30 bg-red-500/10'
                              : 'border-red-300 bg-red-50'
                            : theme === 'dark'
                            ? 'border-yellow-500/30 bg-yellow-500/10'
                            : 'border-yellow-300 bg-yellow-50'
                        }`}
                      >
                        <AlertTriangle
                          size={18}
                          className={
                            alert.type === 'critical'
                              ? 'text-red-500 flex-shrink-0'
                              : 'text-yellow-500 flex-shrink-0'
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-[#4B3621]'
                          }`}>
                            {alert.category}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))}

                    {activeNotifications.length === 0 && (
                      <div className="text-center py-8">
                        <Bell size={32} className={`mx-auto mb-2 ${
                          theme === 'dark' ? 'text-gray-600' : 'text-[#654321]/30'
                        }`} />
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'
                        }`}>
                          No notifications
                        </p>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-600' : 'text-[#654321]/40'
                        }`}>
                          You're all caught up! 🎉
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#4B3621]'
                }`}>
                  {user?.name}
                </p>
                <p className={`text-[10px] ${
                  theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'
                }`}>
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-[#F5F5DC] hover:bg-[#654321] text-[#4B3621] hover:text-white border-2 border-[#654321]/30'
                }`}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <Outlet /> 
      </div>
    </div>
  );
}
