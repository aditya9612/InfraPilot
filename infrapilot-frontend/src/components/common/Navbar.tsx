import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

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
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

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
        {/* Notification icons */}
        <button className="relative w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-success rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
          {user?.name.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
