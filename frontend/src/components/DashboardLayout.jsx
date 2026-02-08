import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // Renders the current page
import { Bell, X, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ notifications = [], onExport }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get Page Title (e.g. "/income" -> "Income")
  const pageName = location.pathname.slice(1) || 'dashboard';
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="flex h-screen bg-[#0b0c15] text-white font-sans overflow-hidden">
      <Sidebar onExport={onExport} />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 flex justify-between items-center px-8 bg-[#0b0c15] shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {title} Overview
          </h2>
          
          <div className="flex items-center gap-6">
            {/* NOTIFICATIONS */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-white/5 transition">
                <Bell className="text-gray-400" size={20} />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0c15]"></span>}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm">Notifications ({notifications.length})</h4>
                    <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map(alert => (
                      <div key={alert.id} className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex gap-3">
                        <AlertTriangle size={18} className="text-yellow-500" />
                        <div>
                          <p className="text-sm font-bold">{alert.category}</p>
                          <p className="text-xs text-gray-400">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-gray-500 text-sm">No new alerts</p>}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-300 font-medium">{user?.name}</p>
                <p className="text-[10px] text-gray-500">{user?.email}</p>
              </div>
              <button onClick={logout} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
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
