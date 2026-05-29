import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, Settings, Bell, CheckCheck } from "lucide-react";
import Modal from "./Modal";
import { notificationService, type Notification } from "../../services/notificationService";
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



const Navbar = ({ title, breadcrumb, action }: Props) => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      let combinedNotifs: Notification[] = [];
      
      // 1. Fetch system notifications
      const role = user?.role === "SiteEngineer" ? "SiteEngineer" : "All";
      const systemNotifs = await notificationService.getNotifications(role);
      combinedNotifs = [...systemNotifs];

      // 2. If client, fetch real project alerts/announcements
      /* 
      if (user?.role === "Client") {
        try {
          const { alertService } = await import("../../services/alertService");
          const alerts = await alertService.getAlerts();
          
          const alertNotifs: Notification[] = alerts.map(a => ({
            id: a.id + 1000, // Offset IDs to avoid collision with mock system notifs
            title: a.alert_type === 'Announcement' ? 'New Announcement' : 'Project Alert',
            description: a.message,
            details: `Official message from project team: ${a.message}. Type: ${a.alert_type}. Status: ${a.status}.`,
            type: "Alert",
            timestamp: a.created_at,
            read: a.status === 'read',
            role_target: "All"
          }));
          
          combinedNotifs = [...alertNotifs, ...combinedNotifs];
        } catch (e) {
          console.warn("Navbar: Failed to fetch alerts for client", e);
        }
      }
      */

      // Sort by timestamp newest first
      combinedNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(combinedNotifs);
    };
    fetchNotifs();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = async (notif: Notification) => {
    setSelectedNotif(notif);
    setIsDetailOpen(true);
    setIsNotificationOpen(false);
    if (!notif.read) {
      try {
        if (notif.id >= 1000) {
          const { alertService } = await import("../../services/alertService");
          await alertService.markAlertRead(notif.id - 1000);
        } else {
          await notificationService.markAsRead(notif.id);
        }
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      } catch (err) {
        console.error("Navbar: Failed to mark notif as read", err);
      }
    }
  };

  const markAllRead = async () => {
    const role = user?.role === "SiteEngineer" ? "SiteEngineer" : "All";
    await notificationService.markAllAsRead(role);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };


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
    <>
      <div className="sticky top-0 z-40 shadow-sm bg-primary px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
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

          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white leading-tight truncate">
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
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
              {unreadCount > 0 && (
                <span className="absolute top-0 -right-1 w-4 h-4 bg-rose-500 border-2 border-primary rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center font-inter">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto font-inter">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} onClick={() => handleNotifClick(notif)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 font-medium">{notif.description}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">No notifications</div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => { 
                      setIsNotificationOpen(false); 
                      const target = user?.role === "Admin" ? "/admin/notifications" : 
                                    user?.role === "SiteEngineer" ? "/engineer/notifications" : 
                                    user?.role === "Client" ? "/client/communication/announcements" : "/";
                      navigate(target); 
                    }}
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

      {/* Notification Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Notification Details" maxWidth="max-w-md">
        {selectedNotif && (
          <div className="p-6 font-inter">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${selectedNotif.type === 'Alert' ? 'bg-rose-100 text-rose-600' : selectedNotif.type === 'Approval' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{selectedNotif.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(selectedNotif.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedNotif.details}</p>
            </div>
            <button onClick={() => setIsDetailOpen(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all uppercase tracking-widest text-xs">
              Dismiss
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Navbar;
