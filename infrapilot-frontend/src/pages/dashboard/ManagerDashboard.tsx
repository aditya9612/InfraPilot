import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FolderCheck,
  PieChart,
  Info,
  AlertTriangle,
  Activity,
  BarChart2,
  ShieldAlert,
  CheckSquare,
  CalendarDays,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "../../services/dashboardService";
import type { PMCommandCenterData, PMSummaryData } from "../../services/dashboardService";

// ─── Helper Utilities ───────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `₹${(n / 1_000).toFixed(1)}K`
      : `₹${n}`;

const priorityColor = (p: string) => {
  if (p === "High") return "bg-rose-100 text-rose-700";
  if (p === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const statusBadge = (s: string) => {
  if (s === "ON TRACK") return "bg-emerald-100 text-emerald-700";
  if (s === "DELAYED") return "bg-rose-100 text-rose-700";
  if (s === "WARNING") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const taskStatusBadge = (s: string) => {
  if (s === "Completed") return "bg-emerald-100 text-emerald-700";
  if (s === "In Progress") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-500";
};

// ─── KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
}
const KpiCard = ({ title, value, sub, icon, accent, bg }: KpiCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">{title}</p>
      <p className={`text-2xl font-bold mt-0.5 ${accent}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────
const SectionHeader = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  </div>
);

// ─── Cost Chart ──────────────────────────────────────────────────────
const CostTrackingChart = ({ data }: { data: PMCommandCenterData["cost_tracking"] }) => {
  const chartData = data.map((d) => ({
    month: d.month,
    "Actual Cost": d.actual_cost,
    Budget: d.budget,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <SectionHeader
        icon={<BarChart2 className="w-4 h-4" />}
        title="Cost Tracking"
        sub="Budget vs Actual by month"
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, ""]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
            />
            <Bar name="Budget" dataKey="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar name="Actual Cost" dataKey="Actual Cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
const ManagerDashboard = () => {
  const [commandCenter, setCommandCenter] = useState<PMCommandCenterData | null>(null);
  const [pmSummary, setPmSummary] = useState<PMSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cc, summary] = await Promise.all([
          dashboardService.getPMCommandCenter().catch((e) => {
            console.warn("PM Command Center fetch failed:", e);
            return null;
          }),
          dashboardService.getPMSummary().catch((e) => {
            console.warn("PM Summary fetch failed:", e);
            return null;
          }),
        ]);
        if (cc) setCommandCenter(cc);
        if (summary) setPmSummary(summary);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Syncing PM Intelligence...</p>
        </div>
      </div>
    );
  }

  const kpis = commandCenter?.kpis;
  const projects = commandCenter?.project_performance ?? [];
  const costData = commandCenter?.cost_tracking ?? [];
  const risks = commandCenter?.risk_analysis ?? [];
  const alerts = commandCenter?.critical_alerts ?? [];
  const tasks = commandCenter?.task_management ?? [];
  const qualityScore = commandCenter?.quality_score ?? 0;
  const safetyScore = commandCenter?.safety_score ?? 0;
  const headerDate = commandCenter?.header_date ?? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <Navbar
        title="PM Command Center"
        breadcrumb={["InfraPilot", "Dashboard", "Manager"]}
        action={{ label: "Intelligence Report" }}
      />

      <main className="p-5 bg-slate-50/60 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Oversight Command
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                {headerDate} · Real-time project intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              {alerts.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {alerts.length} Critical Alert{alerts.length > 1 ? "s" : ""}
                </span>
              )}
              <Link
                to="/manager/approvals"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Approval Queue
                {pmSummary?.pending_approvals ? (
                  <span className="bg-white text-indigo-600 rounded-full px-1.5 text-[10px] font-black">
                    {pmSummary.pending_approvals}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* ── KPI Grid (from pm-command-center + pm-summary combined) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Total Projects"
              value={kpis?.total_managed_projects ?? pmSummary?.total_projects ?? 0}
              sub="Under Management"
              icon={<FolderCheck className="w-5 h-5 text-indigo-600" />}
              accent="text-indigo-700"
              bg="bg-indigo-50"
            />
            <KpiCard
              title="Active Projects"
              value={pmSummary?.active_projects ?? 0}
              sub="Ongoing Deployments"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              accent="text-emerald-700"
              bg="bg-emerald-50"
            />
            <KpiCard
              title="Completed"
              value={pmSummary?.completed_projects ?? 0}
              sub="Handed Over"
              icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
              accent="text-blue-700"
              bg="bg-blue-50"
            />
            <KpiCard
              title="Delayed Sites"
              value={kpis?.delayed_sites_count ?? pmSummary?.delayed_projects ?? 0}
              sub="Needs Attention"
              icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
              accent="text-rose-700"
              bg="bg-rose-50"
            />
            <KpiCard
              title="Avg Completion"
              value={`${kpis?.avg_completion_percent ?? 0}%`}
              sub="Portfolio Progress"
              icon={<Activity className="w-5 h-5 text-purple-600" />}
              accent="text-purple-700"
              bg="bg-purple-50"
            />
          </div>

          {/* Second KPI row from PM Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Open Issues"
              value={pmSummary?.open_issues ?? 0}
              sub="Requiring Intervention"
              icon={<Info className="w-5 h-5 text-orange-500" />}
              accent="text-orange-600"
              bg="bg-orange-50"
            />
            <KpiCard
              title="Pending Approvals"
              value={pmSummary?.pending_approvals ?? kpis?.pending_reviews_count ?? 0}
              sub="Authorization Queue"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              accent="text-amber-600"
              bg="bg-amber-50"
            />
            <KpiCard
              title="Budget Utilized"
              value={`${pmSummary?.budget_utilized_percent ?? 0}%`}
              sub="Of Total Allocated"
              icon={<PieChart className="w-5 h-5 text-teal-600" />}
              accent="text-teal-700"
              bg="bg-teal-50"
            />
            <KpiCard
              title="Today's Activities"
              value={pmSummary?.todays_activities ?? 0}
              sub="Logged Today"
              icon={<CalendarDays className="w-5 h-5 text-sky-600" />}
              accent="text-sky-700"
              bg="bg-sky-50"
            />
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Left+Center: 2 cols ── */}
            <div className="xl:col-span-2 space-y-6">

              {/* Project Performance Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionHeader
                  icon={<FolderCheck className="w-4 h-4" />}
                  title="Project Performance"
                  sub={`${projects.length} projects under management`}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 text-left pl-1">Project</th>
                        <th className="pb-3 text-left">ID</th>
                        <th className="pb-3 text-center">Progress</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Budget Utilization</th>
                        <th className="pb-3 text-right">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {projects.map((p) => {
                        const budgetPct =
                          p.budget_utilization_total > 0
                            ? Math.min(100, Math.round((p.budget_utilization_actual / p.budget_utilization_total) * 100))
                            : 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="py-3 pl-1 font-semibold text-slate-700">
                              {p.name}
                            </td>
                            <td className="py-3 text-slate-400 text-xs font-mono">{p.business_id}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${p.status === "DELAYED" ? "bg-rose-400" : "bg-emerald-400"}`}
                                    style={{ width: `${p.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-600 w-9 text-right">
                                  {p.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <p className="text-xs font-bold text-slate-700">
                                {fmt(p.budget_utilization_actual)} / {fmt(p.budget_utilization_total)}
                              </p>
                              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${budgetPct > 90 ? "bg-rose-400" : "bg-indigo-400"}`}
                                  style={{ width: `${budgetPct}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <p className="text-[10px] text-slate-400">{p.start_date}</p>
                              <p className="text-[10px] text-slate-500 font-medium">→ {p.end_date}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Tracking Chart */}
              <CostTrackingChart data={costData} />

              {/* Task Management */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionHeader
                  icon={<CheckSquare className="w-4 h-4" />}
                  title="Task Management"
                  sub={`${tasks.length} tasks in queue`}
                />
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No tasks found.</p>
                  ) : (
                    tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{t.task_name}</p>
                            <p className="text-[11px] text-slate-400">
                              {t.engineer_name === "Unassigned" ? (
                                <span className="text-amber-500 font-medium">Unassigned</span>
                              ) : (
                                t.engineer_name
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${taskStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {t.due_date ?? "No due date"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="space-y-6">

              {/* Quality & Safety Score */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionHeader
                  icon={<ShieldAlert className="w-4 h-4" />}
                  title="Quality & Safety Scores"
                  sub="Overall compliance metrics"
                />
                <div className="space-y-4">
                  {/* Quality Score */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Quality (QC)</span>
                      <span className="text-sm font-bold text-emerald-600">{qualityScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${qualityScore > 70 ? "bg-emerald-100 text-emerald-700" : qualityScore > 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {qualityScore > 70 ? "Optimized" : qualityScore > 40 ? "At Risk" : "Critical"}
                    </span>
                  </div>

                  {/* Safety Score */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Safety (HSE)</span>
                      <span className="text-sm font-bold text-rose-500">{safetyScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-700"
                        style={{ width: `${safetyScore}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${safetyScore > 70 ? "bg-emerald-100 text-emerald-700" : safetyScore > 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {safetyScore > 70 ? "Optimized" : safetyScore > 40 ? "At Risk" : "Critical"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                <SectionHeader
                  icon={<AlertCircle className="w-4 h-4 text-rose-600" />}
                  title="Critical Alerts"
                  sub={`${alerts.length} active alert${alerts.length !== 1 ? "s" : ""}`}
                />
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-3">No critical alerts.</p>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="p-3 bg-white/70 rounded-xl border border-rose-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            {a.alert_type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{a.project_name}</span>
                        </div>
                        <p className="text-xs text-rose-700 font-medium">{a.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(a.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionHeader
                  icon={<AlertTriangle className="w-4 h-4" />}
                  title="Risk Analysis"
                  sub={`${risks.length} risk entries`}
                />
                <div className="space-y-2">
                  {risks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-3">No risks identified.</p>
                  ) : (
                    risks.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-amber-50/50 transition-colors">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{r.project_name}</p>
                          <p className="text-[11px] text-slate-400">{r.risk_type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor(r.priority)}`}>
                            {r.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Quick Navigation</h3>
                <div className="space-y-2">
                  {[
                    { label: "View All Projects", to: "/manager/projects", color: "text-indigo-600" },
                    { label: "Safety Reports", to: "/manager/safety", color: "text-rose-600" },
                    { label: "QC Inspections", to: "/manager/qc", color: "text-emerald-600" },
                    { label: "Advanced Analytics", to: "/manager/reports", color: "text-slate-600" },
                  ].map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                    >
                      <span className={`text-xs font-semibold ${l.color}`}>{l.label}</span>
                      <ArrowUpRight className={`w-3.5 h-3.5 ${l.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ManagerDashboard;
