import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface Props {
  title: string;
  breadcrumb?: (string | BreadcrumbItem)[];
  action?: { label: string; onClick?: () => void };
}

const routeMap: Record<string, string> = {
  "InfraPilot": "/",
  "Dashboard": "/",
  "Admin": "/admin",
  "Users": "/admin/users",
  "Roles": "/admin/users/roles",
  "Permissions": "/admin/users/permissions",
  "Projects": "/admin/projects",
  "Contractors": "/admin/contractors",
  "Clients": "/admin/clients",
  "Engineers": "/admin/engineers",
  "Inventory": "/admin/inventory",
  "Finance": "/admin/finance",
  "Reports": "/admin/reports",
  "Notifications": "/admin/notifications",
  "Documents": "/admin/documents",
  "Settings": "/admin/settings",
  "Integrations": "/admin/integrations",
  "Master Data": "/admin/master-data",
  "BOQ": "/admin/boq",
};

const Navbar = ({ title, breadcrumb, action }: Props) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Revision v2.1 Uploaded", body: "Structural drawing for Block B has been updated.", time: "10 mins ago", type: "info" },
    { id: 2, title: "Approval Pending", body: "Cement requisition for April needs your e-sign.", time: "2 hours ago", type: "warning" },
    { id: 3, title: "Weather Alert", body: "Heavy rain predicted. Ensure material covers are active.", time: "5 hours ago", type: "error" },
  ];

  return (
    <div className="sticky top-0 z-[100] shadow-sm bg-primary px-8 py-5 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {breadcrumb && (
          <nav className="flex items-center gap-1 text-blue-100 text-[10px] mt-1 font-black uppercase tracking-widest" aria-label="Breadcrumb">
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              const label = typeof item === "string" ? item : item.label;
              const path = typeof item === "object" ? item.path : routeMap[label];

              return (
                <div key={index} className="flex items-center gap-1">
                  {path && !isLast ? (
                    <Link
                      to={path}
                      className="hover:text-white transition-colors hover:underline decoration-blue-300/50 underline-offset-2"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-white/90" : ""}>{label}</span>
                  )}
                  {!isLast && (
                    <svg className="w-2 h-2 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3 relative">
        {action && (
          <button
            onClick={action.onClick}
            className="px-5 py-2.5 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-sm active:scale-95 mr-3"
          >
            {action.label}
          </button>
        )}

        {/* Notification section */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showNotifications ? 'bg-white text-primary shadow-lg' : 'text-white hover:bg-white/10'}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-primary rounded-full shadow-sm" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Clear All</button>
                </div>
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'info' ? 'bg-blue-50 text-blue-600' : n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors">{n.title}</p>
                          <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{n.body}</p>
                          <p className="text-[10px] font-bold text-slate-300 italic pt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 text-center">
                  <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary transition-colors">See all site activity</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-white/20 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer">
          {user?.name.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
