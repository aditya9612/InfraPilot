import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, Settings, Bell } from "lucide-react";

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
  InfraPilot: "/",
  Dashboard: "/",
  Admin: "/admin",
  Users: "/admin/users",
  Roles: "/admin/users/roles",
  Permissions: "/admin/users/permissions",
  Projects: "/admin/projects",
  Contractors: "/admin/contractors",
  Clients: "/admin/clients",
  Engineers: "/admin/engineers",
  Inventory: "/admin/inventory",
  Finance: "/admin/finance",
  Reports: "/admin/reports",
  Notifications: "/admin/notifications",
  Documents: "/admin/documents",
  Settings: "/admin/settings",
  Integrations: "/admin/integrations",
  "Master Data": "/admin/master-data",
  BOQ: "/admin/boq",
};

const mockNotifications = [
  { id: 1, type: "alert", title: "Low Stock Alert", desc: "Cement (Grade 53) is below minimum threshold at Site A.", time: "10m ago", read: false },
  { id: 2, type: "approval", title: "Pending Approval", desc: "Arjun requested 500 Bags of Cement.", time: "1h ago", read: false },
  { id: 3, type: "system", title: "System Update", desc: "Scheduled maintenance at 2:00 AM.", time: "5h ago", read: true },
];

const Navbar = ({ title, breadcrumb, action }: Props) => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-40 shadow-sm bg-primary px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white leading-tight">
            {title}
          </h1>
          {breadcrumb && (
            <nav
              className="flex items-center gap-1 text-blue-100 text-[10px] mt-0.5 font-medium"
              aria-label="Breadcrumb"
            >
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                const label = typeof item === "string" ? item : item.label;
                const path =
                  typeof item === "object" ? item.path : routeMap[label];

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
                      <span className={isLast ? "text-white/90" : ""}>
                        {label}
                      </span>
                    )}
                    {!isLast && (
                      <svg
                        className="w-2 h-2 text-blue-300/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )}
        {/* Notification Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative w-8 h-8 flex items-center justify-center text-white rounded-lg transition-colors ${isNotificationOpen ? 'bg-blue-600' : 'hover:bg-blue-600'}`}
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" strokeWidth={2.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-primary rounded-full" />
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">2 New</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map(notif => (
                  <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                      <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{notif.desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => { setIsNotificationOpen(false); navigate(user?.role === "Admin" ? "/admin/notifications" : "#"); }}
                  className="w-full py-2 text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform"
            title={user?.name || "Profile"}
          >
            {user?.name?.charAt(0) || "U"}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate capitalize">{user?.role}</p>
              </div>
              <div className="p-2 space-y-1">
                <button 
                  onClick={() => { 
                    setIsProfileOpen(false); 
                    const settingsPath = user?.role === "Admin" ? "/admin/settings" : 
                                       user?.role === "SiteEngineer" ? "/engineer/settings" : 
                                       user?.role === "Client" ? "/client/settings" : 
                                       user?.role === "Accountant" ? "/accountant/settings" : "/admin/settings";
                    navigate(`${settingsPath}#profile`); 
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  My Profile
                </button>
                <button 
                  onClick={() => { 
                    setIsProfileOpen(false); 
                    const settingsPath = user?.role === "Admin" ? "/admin/settings" : 
                                       user?.role === "SiteEngineer" ? "/engineer/settings" : 
                                       user?.role === "Client" ? "/client/settings" : 
                                       user?.role === "Accountant" ? "/accountant/settings" : "/admin/settings";
                    navigate(settingsPath); 
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
              </div>
              <div className="p-2 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
