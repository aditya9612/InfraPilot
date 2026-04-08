import { useAuth } from "../../context/AuthContext";

interface Props {
  title: string;
  breadcrumb?: string[];
  action?: { label: string; onClick?: () => void };
}

const Navbar = ({ title, breadcrumb, action }: Props) => {
  const { user } = useAuth();

  return (
    <div className="bg-primary px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {breadcrumb && (
          <p className="text-blue-100 text-xs mt-0.5">
            {breadcrumb.join(" > ")}
          </p>
        )}
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
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
