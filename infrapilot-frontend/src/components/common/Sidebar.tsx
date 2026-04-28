import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { sidebarMenus, type MenuItem } from "../../config/sidebarMenu";
import ConfirmModal from "./ConfirmModal";
import type { JSX } from "react";
import logo from "../../assets/logo.png";

// ... (icons remain unchanged)

const icons: Record<string, JSX.Element> = {
  grid: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.8" />
    </svg>
  ),
  folder: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  ),
  users: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  ),
  "bar-chart": (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M18 20V10M12 20V4M6 20v-6"
      />
    </svg>
  ),
  settings: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    </svg>
  ),
  list: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  package: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
      />
    </svg>
  ),
  "check-square": (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
      />
    </svg>
  ),
  tool: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      />
    </svg>
  ),
  "file-text": (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.8" />
      <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.8" />
      <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.8" />
    </svg>
  ),
  "file-plus": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.8" />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.8" />
      <line x1="12" y1="18" x2="12" y2="12" strokeWidth="1.8" />
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1.8" />
    </svg>
  ),
  clipboard: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  file: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.8" />
    </svg>
  ),
  "dollar-sign": (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <line x1="12" y1="1" x2="12" y2="23" strokeWidth="1.8" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
      />
    </svg>
  ),
  "credit-card": (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" strokeWidth="1.8" />
      <line x1="1" y1="10" x2="23" y2="10" strokeWidth="1.8" />
    </svg>
  ),
  briefcase: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeWidth="1.8" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  "user-check": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="8.5" cy="7" r="4" strokeWidth="1.8" />
      <polyline points="17 11 19 13 23 9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  "check-circle": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="1.8" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeWidth="1.8" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeWidth="1.8" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  camera: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="4" strokeWidth="1.8" />
    </svg>
  ),
  "alert-triangle": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ),
  "message-circle": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  box: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  "trending-up": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  "trending-down": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <polyline points="17 18 23 18 23 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  "book-open": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeWidth="1.8" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeWidth="1.8" />
    </svg>
  ),
  truck: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M1 3h15v13H1z" strokeWidth="1.8" />
      <path d="M16 8h4l3 3v5h-7V8z" strokeWidth="1.8" />
      <circle cx="5.5" cy="18.5" r="2.5" strokeWidth="1.8" />
      <circle cx="18.5" cy="18.5" r="2.5" strokeWidth="1.8" />
    </svg>
  ),
  percent: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="19" y1="5" x2="5" y2="19" strokeWidth="1.8" />
      <circle cx="6.5" cy="6.5" r="2.5" strokeWidth="1.8" />
      <circle cx="17.5" cy="17.5" r="2.5" strokeWidth="1.8" />
    </svg>
  ),
  home: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="1.8" />
      <polyline points="9 22 9 12 15 12 15 22" strokeWidth="1.8" />
    </svg>
  ),
  "edit-3": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 20h9" strokeWidth="1.8" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="1.8" />
    </svg>
  ),
  layers: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="12 2 2 7 12 12 22 7 12 2" strokeWidth="1.8" />
      <polyline points="2 17 12 22 22 17" strokeWidth="1.8" />
      <polyline points="2 12 12 17 22 12" strokeWidth="1.8" />
    </svg>
  ),
  "rotate-ccw": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="1 4 1 10 7 10" strokeWidth="1.8" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeWidth="1.8" />
    </svg>
  ),
  "refresh-cw": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10" strokeWidth="1.8" />
      <polyline points="1 20 1 14 7 14" strokeWidth="1.8" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth="1.8" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
      <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="1.8" />
      <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="1.8" />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.8" />
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.8" />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.8" />
    </svg>
  ),
};

const Chevron = ({ isOpen }: { isOpen?: boolean }) => (
  <svg
    className={`w-3 h-3 ml-auto text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

interface SidebarProps {
  onClose?: () => void;
}

const SidebarItem = ({ 
  item, 
  onClose, 
  depth = 0 
}: { 
  item: MenuItem; 
  onClose?: () => void; 
  depth?: number 
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(location.pathname.startsWith(item.path));
  const hasSubNav = item.subNav && item.subNav.length > 0;
  const isParentActive = hasSubNav && location.pathname.startsWith(item.path);

  if (hasSubNav) {
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isParentActive
              ? "text-primary bg-blue-50/50 font-semibold"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <span className={isParentActive ? "text-primary" : "text-slate-400"}>
            {icons[item.icon]}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          <Chevron isOpen={isOpen} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden ml-4 border-l border-slate-100 pl-2"
            >
              <div className="pt-0.5 pb-1">
              {item.subNav!.map((subItem) => (
                <SidebarItem 
                  key={subItem.path} 
                  item={subItem} 
                  onClose={onClose} 
                  depth={depth + 1} 
                />
              ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={depth > 0 || item.path === "/admin" || item.path === "/manager" || item.path === "/engineer" || item.path === "/contractor" || item.path === "/accountant" || item.path === "/client"}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
          isActive
            ? "text-primary bg-blue-50 font-semibold shadow-sm shadow-blue-100/50"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? "text-primary" : "text-slate-400"}>
            {icons[item.icon]}
          </span>
          <span className="flex-1">{item.label}</span>
          {!hasSubNav && depth === 0 && <Chevron />}
        </>
      )}
    </NavLink>
  );
};

const Sidebar = ({ onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!user) return null;
  const menu = sidebarMenus[user.role];

  const rolePaths: Record<string, string> = {
    Admin: "/admin",
    ProjectManager: "/manager",
    SiteEngineer: "/engineer",
    Accountant: "/accountant",
    Client: "/client",
  };

  return (
    <aside className="w-full h-full bg-white border-r border-slate-100 flex flex-col shadow-sm shrink-0">
      {/* Logo container */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-center relative">
        <Link 
          to={rolePaths[user.role]} 
          className="flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src={logo}
            alt="InfraPilot Logo"
            className="h-16 w-auto object-contain"
          />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden absolute right-4 text-slate-500 p-2 hover:bg-slate-50 rounded-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-1 pb-3 overflow-y-auto">
        {menu.map((item) => (
          <SidebarItem key={item.path} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-blue-600/20">
            {user.name === "Test Client" ? "M" : user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user.name === "Test Client" ? "Mr. Sharma" : user.name}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate tracking-tight">{user.mobile}</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-100"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Logout Account"
        message="Are you sure you want to log out of your account? You will need to sign in again to access the dashboard."
        confirmText="Logout"
        type="danger"
      />
    </aside>
  );
};

export default Sidebar;
