import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface Props {
  title: string;
  breadcrumb?: string[];
  action?: { label: string; onClick?: () => void };
}

const Navbar = ({ title, breadcrumb, action }: Props) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, text: "Cement delivery arriving in 2 hours", time: "2m ago", unread: true },
    { id: 2, text: "Structural Drawing #RCC-102 approved", time: "1h ago", unread: true },
    { id: 3, text: "Rain delay reported in Block A", time: "4h ago", unread: false },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-primary px-6 py-4 flex items-center justify-between relative shadow-md z-40">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {breadcrumb && (
          <p className="text-blue-100 text-xs mt-0.5 font-medium opacity-80">
            {breadcrumb.join(" > ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-blue-50 transition-all shadow-lg active:scale-95"
          >
            {action.label}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-8 h-8 flex items-center justify-center text-white rounded-lg transition-all ${showNotifications ? "bg-white/20 ring-2 ring-white/30" : "hover:bg-white/10"}`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 border-2 border-primary rounded-full animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Notifications</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">3 New</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${n.unread ? "bg-blue-50/30" : ""}`}>
                    <p className={`text-xs leading-relaxed ${n.unread ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">{n.time}</p>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 text-[10px] font-bold text-primary hover:bg-slate-50 transition-colors uppercase tracking-widest bg-slate-50/30">
                View All Notifications
              </button>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white/50 flex items-center justify-center text-white text-xs font-black shadow-sm">
          {user?.name.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
