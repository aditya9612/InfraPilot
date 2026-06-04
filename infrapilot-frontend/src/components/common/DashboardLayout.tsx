import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";

interface Props {
  children?: ReactNode;
}

const DashboardContent = ({ children }: Props) => {
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-800/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex-shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 overflow-y-auto pt-16 relative">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

const DashboardLayout = (props: Props) => {
  return (
    <SidebarProvider>
      <DashboardContent {...props} />
    </SidebarProvider>
  );
};

export default DashboardLayout;
