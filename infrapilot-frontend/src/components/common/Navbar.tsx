import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, Settings, Bell, CheckCheck } from "lucide-react";
import Modal from "./Modal";
import { notificationService, type Notification } from "../../services/notificationService";
import { alertService } from "../../services/alertService";
import { projectService } from "../../services/projectService";
import { getFullImageUrl } from "../../utils/imageUtils";
import { handleNotificationClick } from "../../utils/notificationNavigator";
import api from "../../services/api";
interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface Props {
  title: string;
  breadcrumb?: (string | BreadcrumbItem)[];
  action?: { label: string; onClick?: () => void };
  rightElement?: React.ReactNode;
}

const routeMap: Record<string, string> = {
  InfraPilot: "/",
  Dashboard: "/",
  Admin: "/admin",
  Users: "/admin/users",
  Roles: "/admin/users/roles",
  Permissions: "/admin/users/permissions",
  Projects: "/admin/projects",
  Clients: "/admin/clients",
  Invoices: "/client/invoices",
  Payment: "/client/payment/history",
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



const Navbar = ({ title, breadcrumb, action, rightElement }: Props) => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [clientTotalCount, setClientTotalCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch notifications if not a Client (to avoid 401 logouts for new roles)
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        let data: any[] = [];
        if (user.role === "Client") {
          // Use the same endpoints as ClientNotificationsPage so counts match
          const [sysRes, taskRes] = await Promise.allSettled([
            api.get("/notifications"),
            api.get("/projects/alerts/tasks"),
          ]);

          const sysRaw = sysRes.status === "fulfilled" ? sysRes.value.data : [];
          const sysItems: any[] = Array.isArray(sysRaw) ? sysRaw : sysRaw?.items || sysRaw?.data || sysRaw?.notifications || [];

          const taskRaw = taskRes.status === "fulfilled" ? taskRes.value.data : [];
          const taskItems: any[] = Array.isArray(taskRaw) ? taskRaw : taskRaw?.items || taskRaw?.data || [];

          const TASK_READ_KEY = "client_task_notif_read_ids";
          let taskReadIds: string[] = [];
          try { taskReadIds = JSON.parse(localStorage.getItem(TASK_READ_KEY) || "[]"); } catch { /**/ }

          const mappedSys = sysItems.map((n: any) => ({
            ...n,
            id: n.id,
            title: n.title || n.alert_type || "Notification",
            description: n.message || n.description || n.content || "",
            details: n.message || n.details || "",
            message: n.message || "",
            type: n.type || "Info",
            timestamp: n.created_at || n.timestamp || new Date().toISOString(),
            read: !!(n.is_read || n.read),
            source: "system",
            link: n.link || n.url || n.action_url || null,
            entity: n.entity || n.entity_type || null,
            entity_type: n.entity_type || n.entity || null,
            entity_id: n.entity_id || n.reference_id || n.related_id || null,
            reference_id: n.reference_id || n.related_id || null,
            project_id: n.project_id || null,
          }));

          const mappedTasks = taskItems.map((t: any) => ({
            ...t,
            id: `task-${t.task_id}`,
            task_id: t.task_id,
            project_id: t.project_id,
            title: t.title || "Delayed Task",
            description: `Delayed Status: ${t.status || "Delayed"}. Due Date: ${t.end_date || "N/A"}`,
            details: `Due: ${t.end_date || 'N/A'}`,
            type: "Alert",
            timestamp: t.end_date || new Date().toISOString(),
            read: taskReadIds.includes(`task-${t.task_id}`),
            source: "task",
            entity: "task",
            entity_type: "task",
            entity_id: t.task_id,
          }));

          data = [...mappedSys, ...mappedTasks];
          // Set the total count (matches the "TOTAL ALERTS" stat on the Notifications page)
          setClientTotalCount(data.length);
        } else if (user.role === "Labour") {
          // Use the unified overview endpoint for Labour to match the main notifications page
          data = await notificationService.getNotificationsOverview();
        } else {
          data = await notificationService.getNotifications();
        }
        setNotifications(data);
      } catch (err) {
        console.error("Notifications fetch failed", err);
      }
    };

    fetchNotifs();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  // For Clients: show total alerts count (matching the Notifications page "TOTAL ALERTS" stat)
  // For other roles: show unread count
  const bellBadgeCount = user?.role === "Client" ? clientTotalCount : unreadCount;

  const handleNotifClick = async (notif: Notification) => {
    setIsNotificationOpen(false);
    await handleNotificationClick(notif, navigate, user?.role || "Client", {
      onMarkedRead: (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      },
      onCloseDropdown: () => setIsNotificationOpen(false),
    });
  };

  const markAllRead = async () => {
    await notificationService.markAllAsRead("All", notifications);
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
      <div className="fixed top-0 right-0 lg:left-56 left-0 z-40 h-16 shadow-md bg-primary px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
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
          {rightElement}
          {/* Notification Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative w-8 h-8 flex items-center justify-center text-white rounded-lg transition-colors ${isNotificationOpen ? 'bg-blue-600' : 'hover:bg-blue-600'}`}
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" strokeWidth={2.5} />
              {bellBadgeCount > 0 && (
                <span className="absolute top-0 -right-1 w-4 h-4 bg-rose-500 border-2 border-primary rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                  {bellBadgeCount > 99 ? '99+' : bellBadgeCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center font-inter">
                  <h3 className="font-black text-black uppercase tracking-widest text-[11px]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black text-slate-900 hover:text-black transition-colors uppercase tracking-widest flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto font-inter">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} onClick={() => handleNotifClick(notif)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notif.read ? 'opacity-80' : 'bg-blue-50/20'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-black text-black tracking-tight">{notif.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">{new Date(notif.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 font-bold tracking-tight">{notif.description}</p>
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
                          user?.role === "Client" ? "/client/notifications" :
                            user?.role === "Labour" ? "/labour/notifications" : "/";
                      navigate(target);
                    }}
                    className="w-full py-2 text-[10px] font-black text-slate-900 hover:text-black transition-colors uppercase tracking-[0.2em]"
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
              className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform overflow-hidden"
              title={user?.name || "Profile"}
            >
              {user?.profile_image ? (
                <img src={getFullImageUrl(user.profile_image)} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
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
                            user?.role === "ProjectManager" ? "/manager/settings" :
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
                            user?.role === "ProjectManager" ? "/manager/settings" :
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
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedNotif.details || selectedNotif.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const notif = selectedNotif;
                  setIsDetailOpen(false);
                  handleNotificationClick(notif, navigate, user?.role || "Client");
                }}
                className="py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                Open Page
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all uppercase tracking-widest text-xs cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Navbar;
