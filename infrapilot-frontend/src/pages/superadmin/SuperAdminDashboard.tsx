import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, FolderKanban, AlertCircle, CheckCircle2,
  Loader2, RefreshCw, Tag, ClipboardList, ArrowRight, UserCheck,
  ChevronLeft, ChevronRight
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import StatCard from "../../components/common/StatCard";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { superadminService } from "../../api/superadmin";
import { Link } from "react-router-dom";

const PIE_COLORS: Record<string, string> = {
  trial: "#3b82f6",
  active: "#10b981",
  suspended: "#f59e0b",
  cancelled: "#ef4444",
  expired: "#8b5cf6",
};

const SuperAdminDashboard = () => {
  const [companyPage, setCompanyPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const itemsPerPage = 5;

  const { data: stats, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["superadmin-dashboard"],
    queryFn: () => superadminService.getDashboardStats(),
  });

  const { data: companiesResponse, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["superadmin_companies_dash"],
    queryFn: () => superadminService.getCompanies({ limit: 50 }),
  });

  const dataSubscription = stats?.subscription_distribution
    ? Object.entries(stats.subscription_distribution).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: PIE_COLORS[key.toLowerCase()] || "#94a3b8",
      }))
    : [];

  const totalSubs = dataSubscription.reduce((sum, d) => sum + d.value, 0);
  const recentActivity = stats?.recent_activity || [];
  const companies = companiesResponse?.items || [];

  const totalCompanyPages = Math.ceil(companies.length / itemsPerPage);
  const currentCompanies = companies.slice((companyPage - 1) * itemsPerPage, companyPage * itemsPerPage);

  const totalActivityPages = Math.ceil(recentActivity.length / itemsPerPage);
  const currentActivity = recentActivity.slice((activityPage - 1) * itemsPerPage, activityPage * itemsPerPage);

  if (isLoading) {
    return (
      <>
        <Navbar title="Global Dashboard" breadcrumb={["InfraPilot", "Super Admin", "Dashboard"]} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 font-inter">
          <div className="w-16 h-16 relative flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Global Dashboard" breadcrumb={["InfraPilot", "Super Admin", "Dashboard"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Platform</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Super Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Real-time overview of all tenants, subscriptions, and platform activity.</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-blue-500" : "text-slate-400"}`} />
            <span className="text-sm font-bold text-slate-600">Refresh</span>
          </button>
        </div>

        {/* ── Platform Vitals ───────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Platform Vitals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Companies"
              value={(stats?.companies ?? 0).toString()}
              sub={`${stats?.active_companies ?? 0} Active · ${stats?.suspended_companies ?? 0} Suspended`}
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              accent="text-blue-600"
            />
            <StatCard
              title="Total Users"
              value={(stats?.users ?? 0).toString()}
              sub={`${stats?.active_users ?? 0} Active Users`}
              icon={<Users className="w-5 h-5 text-violet-600" />}
              accent="text-violet-600"
            />
            <StatCard
              title="Active Projects"
              value={(stats?.active_projects ?? 0).toString()}
              sub={`${stats?.projects ?? 0} Total Projects`}
              icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
              accent="text-emerald-600"
            />
            <StatCard
              title="Plans & Subscriptions"
              value={(stats?.subscriptions_count ?? 0).toString()}
              sub={`${stats?.plans_count ?? 0} Plans Available`}
              icon={<Tag className="w-5 h-5 text-amber-600" />}
              accent="text-amber-600"
            />
          </div>
        </div>

        {/* ── Quick Stats Row ──────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <StatCard
              title="Active Companies"
              value={(stats?.active_companies ?? 0).toString()}
              sub="Currently operational"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              accent="text-emerald-600"
            />
            <StatCard
              title="Suspended"
              value={(stats?.suspended_companies ?? 0).toString()}
              sub="Requires attention"
              icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
              accent="text-rose-500"
            />
            <StatCard
              title="Active Users"
              value={(stats?.active_users ?? 0).toString()}
              sub="Across all tenants"
              icon={<UserCheck className="w-5 h-5 text-sky-600" />}
              accent="text-sky-600"
            />
            <StatCard
              title="Expiring Soon"
              value={(stats?.expiring_subscriptions ?? 0).toString()}
              sub="Subscriptions near end"
              icon={<ClipboardList className="w-5 h-5 text-amber-500" />}
              accent="text-amber-500"
            />
          </div>
        </div>

        {/* ── Expiring Subscriptions Alert ──────────────────── */}
        {(stats?.expiring_subscriptions ?? 0) > 0 && (
          <div className="mb-6 md:mb-8 flex items-center gap-3 bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {stats!.expiring_subscriptions} subscription{stats!.expiring_subscriptions > 1 ? "s" : ""} expiring soon
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Review and take action to prevent service interruptions</p>
            </div>
            <Link to="/superadmin/subscriptions" className="px-3 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-amber-200 transition-colors flex items-center gap-1 shrink-0">
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* ── Company Health + Subscription Overview ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 md:mb-8">

          {/* Recent Companies — like "Today's Work Summary" */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recent Companies</h2>
                <p className="text-xs text-slate-400">Latest registered tenants on the platform</p>
              </div>
              <Link to="/superadmin/companies" className="w-fit px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {/* Removed max-h and overflow-y-auto to let pagination control height */}
            <div className="space-y-3 flex-1">
              {isLoadingCompanies ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
              ) : currentCompanies.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">No companies found.</div>
              ) : currentCompanies.map((company) => (
                <Link key={company.id} to={`/superadmin/companies/${company.id}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">{company.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{company.subdomain || "No subdomain"}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                    company.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {company.is_active ? "Active" : "Inactive"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalCompanyPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(companyPage - 1) * itemsPerPage + 1} to {Math.min(companyPage * itemsPerPage, companies.length)} of {companies.length}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                    disabled={companyPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCompanyPage(p => Math.min(totalCompanyPages, p + 1))}
                    disabled={companyPage === totalCompanyPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Overview — like "Overall Progress" */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Subscription Overview</p>
            {dataSubscription.length > 0 ? (
              <>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataSubscription}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dataSubscription.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-slate-800">{totalSubs}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400">Total</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                  {dataSubscription.map((item) => (
                    <div key={item.name} className="text-left p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.name}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <ClipboardList className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">No subscriptions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Activity (like Timeline Tracking) ──────── */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Recent Activity</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Platform Activity Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest actions across all tenants</p>
              </div>
              <Link to="/superadmin/audit-logs" className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="space-y-4 flex-1">
              {currentActivity.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">No recent activity.</div>
              ) : currentActivity.map((log, index) => {
                const actionUpper = (log.action || "").toUpperCase();
                const isDelete = actionUpper.includes("DELETE") || actionUpper.includes("REMOVE");
                const isCreate = actionUpper.includes("CREATE") || actionUpper.includes("ADD");
                const isUpdate = actionUpper.includes("UPDATE") || actionUpper.includes("CHANGE");
                const isComplete = actionUpper.includes("COMPLETE") || actionUpper.includes("TASK");

                const dotColor = isDelete ? "bg-rose-500" :
                  isCreate ? "bg-emerald-500" :
                  isUpdate ? "bg-amber-500" :
                  isComplete ? "bg-blue-500" :
                  "bg-slate-400";

                const tagStyle = isDelete ? "bg-rose-100 text-rose-700" :
                  isCreate ? "bg-emerald-100 text-emerald-700" :
                  isUpdate ? "bg-amber-100 text-amber-700" :
                  isComplete ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-500";

                const detailMsg = log.details?.message || null;

                return (
                  <div key={log.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      </div>
                      {index < currentActivity.length - 1 && (
                        <div className="w-0.5 h-full min-h-[30px] bg-slate-100 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-700">
                          {log.action?.replaceAll("_", " ")}
                        </p>
                        <span className={`w-fit px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${tagStyle}`}>
                          {log.entity} {log.details?.project_name || log.details?.name ? (log.details.project_name || log.details.name) : (log.entity_id ? `#${log.entity_id}` : "")}
                        </span>
                      </div>
                      {detailMsg && (
                        <p className="text-xs text-slate-500 mb-1 leading-relaxed">{detailMsg}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(log.created_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalActivityPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(activityPage - 1) * itemsPerPage + 1} to {Math.min(activityPage * itemsPerPage, recentActivity.length)} of {recentActivity.length}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                    disabled={activityPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                    disabled={activityPage === totalActivityPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </PageTransition>
    </>
  );
};

export default SuperAdminDashboard;
