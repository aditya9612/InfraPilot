import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Clock,
  ShieldAlert,
  Wallet,
  FileText,
  Users,
  Heart,
  TrendingUp,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { type ClientDashboardData, dashboardService } from "../../services/dashboardService";
import { projectService } from "../../services/projectService";
import { expenseService } from "../../services/expenseService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import toast from "react-hot-toast";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [recentExpensesList, setRecentExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // false initially; set true only when fetching
  const { projectId, loading: projectIdLoading } = useClientProjectId();

  useEffect(() => {
    if (projectIdLoading || !projectId) {
      console.warn('[ClientDashboard] projectId is loading or null — waiting for resolution...');
      return;
    }
    let active = true;

    const fetchDashboardContent = async () => {
      try {
        setLoading(true);

        try {
          const activeProject = await projectService.getProjectById(projectId);
          if (active) setProjectData(activeProject);
        } catch (projErr: any) {
          console.warn("Project details fetch warning:", projErr);
          if (projErr?.response?.status === 404) {
            localStorage.removeItem("client_selected_project_id");
            localStorage.removeItem("infrapilot_selected_project_id");
            window.dispatchEvent(new Event("project_changed"));
            return;
          }
        }

        try {
          const statsData = await dashboardService.getClientDashboard(projectId);
          console.log('[ClientDashboard] statsData set to state:', JSON.stringify(statsData, null, 2));
          if (active) setDashboardData(statsData);
        } catch (dashErr) {
          console.warn("Dashboard stats fetch error:", dashErr);
        }

        try {
          const expData = await expenseService.getExpensesByProject(Number(projectId));
          if (active && Array.isArray(expData) && expData.length > 0) {
            setRecentExpensesList(expData);
          }
        } catch (e) {
          console.warn("Expenses fetch failed:", e);
        }

      } catch (error: any) {
        if (!active) return;
        console.error("Dashboard Fetch Error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardContent();
    return () => { active = false; };
  }, [projectId, projectIdLoading]);

  // ── Fields from API only ──
  const projectName = projectData?.project_name || projectData?.name || "";
  const projectStatus = (dashboardData?.status || projectData?.status || "").toUpperCase();
  const startDateStr = dashboardData?.start_date || projectData?.start_date || "";
  const endDateStr = dashboardData?.end_date || projectData?.end_date || "";

  const daysRemaining       = Number(dashboardData?.days_remaining ?? dashboardData?.remaining_days ?? 0);
  const progressPercent     = Number(dashboardData?.actual_progress ?? dashboardData?.progress_percent ?? dashboardData?.progress ?? dashboardData?.overall_progress ?? 0);
  const budgetTotal         = Number(dashboardData?.budget_total ?? dashboardData?.budget ?? 0);
  const totalExpense        = Number(dashboardData?.total_expense ?? dashboardData?.spent ?? 0);
  const remainingBudget     = Number(dashboardData?.remaining_budget ?? dashboardData?.remaining ?? (budgetTotal > 0 ? budgetTotal - totalExpense : 0));
  const budgetUsedPercent   = Number(dashboardData?.budget_used_percent ?? dashboardData?.spent_percent ?? 0);
  const tasksCompleted      = Number(dashboardData?.tasks_completed ?? 0);
  const tasksTotal          = Number(dashboardData?.tasks_total ?? 0);
  const tasksPending        = Math.max(0, tasksTotal - tasksCompleted);
  const milestonesCompleted = Number(dashboardData?.milestones_completed ?? 0);
  const milestonesTotal     = Number(dashboardData?.milestones_total ?? 0);
  const milestonesPending   = Math.max(0, milestonesTotal - milestonesCompleted);

  // Derived or direct percentage from API
  const remainingPercent = dashboardData?.remaining_percent !== undefined && dashboardData?.remaining_percent !== null
    ? Number(dashboardData.remaining_percent)
    : (budgetTotal > 0 ? (remainingBudget / budgetTotal) * 100 : 0);

  const spentPercent = dashboardData?.spent_percent !== undefined && dashboardData?.spent_percent !== null
    ? Number(dashboardData.spent_percent)
    : (budgetTotal > 0 ? (totalExpense / budgetTotal) * 100 : 0);

  const budgetStatus     = dashboardData?.budget_status || (remainingBudget >= 0 ? "Healthy" : "Over Budget");

  // Extended fields — now typed in ClientDashboardData (may be undefined if not returned by backend)
  const projectHealth      = dashboardData?.project_health || dashboardData?.health || "";
  const projectDuration    = dashboardData?.project_duration ?? 0;
  const elapsedDays        = dashboardData?.elapsed_days ?? 0;
  const timelineProgress   = dashboardData?.timeline_progress ?? 0;
  const scheduleVariance   = dashboardData?.variance_percent ?? 0;
  const scheduleStatus     = dashboardData?.schedule_status || "";
  const riskLevel          = dashboardData?.risk_level || "";
  const overdueTasks       = dashboardData?.overdue_tasks ?? 0;
  const overdueMilestones  = dashboardData?.overdue_milestones ?? 0;
  const highPriorityOverdue = dashboardData?.high_priority_overdue ?? 0;

  const taskCompletionPct      = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const milestoneCompletionPct = milestonesTotal > 0 ? Math.round((milestonesCompleted / milestonesTotal) * 100) : 0;

  const formatCurrency = (val: number) =>
    "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };


  // Dynamic 6-month expense trend combining API trend data and local expense list fallback
  const expenseTrendData = (() => {
    const apiTrend: any[] = Array.isArray(dashboardData?.expense_trend) ? dashboardData.expense_trend : [];

    const months: { month: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      // Look for key matching apiTrend (e.g., month: "2026-07")
      const trendItem = apiTrend.find((item: any) =>
        item.month === key ||
        (item.month && String(item.month).startsWith(key)) ||
        (item.month && String(item.month).toLowerCase().includes(label.toLowerCase()))
      );

      let total = 0;
      if (trendItem) {
        total = Number(trendItem.total_amount ?? trendItem.amount ?? trendItem.total ?? trendItem.spent ?? 0);
      } else {
        total = recentExpensesList
          .filter((e: any) => (e.created_at || e.date || "").startsWith(key))
          .reduce((sum: number, e: any) => sum + Number(e.amount || e.total_amount || 0), 0);
      }

      months.push({ month: label, amount: total });
    }

    // Fallback: If no amounts matched the generated window but API has trend items, map them directly
    const hasAnyAmount = months.some((m) => m.amount > 0);
    if (!hasAnyAmount && apiTrend.length > 0) {
      return apiTrend.map((item: any) => {
        let label = String(item.month || "");
        if (/^\d{4}-\d{2}$/.test(label)) {
          const [y, m] = label.split("-").map(Number);
          const d = new Date(y, m - 1, 1);
          label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        }
        return {
          month: label,
          amount: Number(item.total_amount ?? item.amount ?? item.total ?? item.spent ?? 0),
        };
      });
    }

    return months;
  })();

  const botMessages = [
    { role: "assistant", text: "Hello! I am your InfraPilot AI assistant. How can I help you today?", time: "Just now" },
    { role: "user",      text: "What is the current project health and progress?", time: "Just now" },
    { role: "assistant", text: `Project health is ${projectHealth || "unknown"} with ${progressPercent}% completion.`, time: "Just now" },
  ];

  if (projectIdLoading || loading) {
    return (
      <>
        <Navbar title="Dashboard" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar title="Dashboard" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />

      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{projectName || "Dashboard"}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Project overview &amp; real-time analytics
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-slate-500">Project Status:</span>
            <span className="font-black text-slate-800">{projectStatus || "—"}</span>
          </div>
        </div>


        {/* ── ROW 1 — 6 KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* PROJECT HEALTH */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Health</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-lg font-black text-slate-800 truncate">{projectHealth || "—"}</p>
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              </div>
            </div>
          </div>

          {/* BUDGET STATUS */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Budget Status</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-lg font-black text-slate-800 truncate">{budgetStatus}</p>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              </div>
            </div>
          </div>

          {/* PROJECT PROGRESS */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Progress</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800">{progressPercent}%</p>
                <p className="text-[10px] font-bold text-slate-400">Actual Progress</p>
              </div>
            </div>
          </div>

          {/* SCHEDULE STATUS */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Schedule Status</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-black text-slate-800 leading-tight">{scheduleStatus || "—"}</p>
                {scheduleStatus && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
              </div>
            </div>
          </div>

          {/* RISK LEVEL */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Risk Level</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-lg font-black text-slate-800 truncate">{riskLevel || "—"}</p>
                {riskLevel && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
              </div>
            </div>
          </div>

          {/* TIMELINE PROGRESS */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Timeline Progress</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#2563eb" strokeWidth="4.5"
                    strokeDasharray={`${Math.min(100, timelineProgress)}, 100`}
                    strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800">{timelineProgress.toFixed(2)}%</p>
                <p className="text-[10px] font-bold text-slate-400">Time Elapsed</p>
              </div>
            </div>
          </div>

        </div>


        {/* ── ROW 2 — Budget Overview | Timeline Overview | Schedule Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_2.5fr_1.8fr] gap-6">

          {/* BUDGET OVERVIEW */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">Budget Overview</h2>

            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="space-y-4 text-xs shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <span className="w-3 h-3 rounded-sm bg-slate-200 shrink-0" />
                    Spent
                  </div>
                  <p className="text-xs font-black text-slate-800 pl-[18px]">{formatCurrency(totalExpense)}</p>
                  <p className="text-[10px] font-bold text-slate-400 pl-[18px]">({spentPercent.toFixed(2)}%)</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                    Remaining
                  </div>
                  <p className="text-xs font-black text-slate-800 pl-[18px]">{formatCurrency(remainingBudget)}</p>
                  <p className="text-[10px] font-bold text-slate-400 pl-[18px]">({remainingPercent.toFixed(2)}%)</p>
                </div>
              </div>

              {/* Pure SVG ring — solid blue, no gray track */}
              <div className="relative flex-1 h-56 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-56 h-56">
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Budget</p>
                  <p className="text-sm font-black text-slate-800 leading-tight mt-0.5">{formatCurrency(budgetTotal)}</p>
                </div>
              </div>
            </div>

            {/* Bottom stats */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Budget",      value: formatCurrency(budgetTotal) },
                { label: "Spent ₹",     value: formatCurrency(totalExpense) },
                { label: "Remaining",   value: formatCurrency(remainingBudget) },
                { label: "Remaining %", value: `${remainingPercent.toFixed(2)}%` },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-[10px] font-black text-slate-800 truncate">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE OVERVIEW */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Timeline Overview</h2>
              <span className="text-sm font-black text-slate-700">{timelineProgress.toFixed(2)}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, timelineProgress)}%` }} />
            </div>

            {/* 4 stat boxes */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { val: projectDuration, label: "Total Days" },
                { val: elapsedDays,     label: "Elapsed Days" },
                { val: daysRemaining,   label: "Remaining Days", blue: true },
                { val: `${timelineProgress.toFixed(2)}%`, label: "Time Progress" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                  <p className={`text-base font-black ${s.blue ? "text-blue-600" : "text-slate-800"}`}>{s.val}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Date rows */}
            <div className="space-y-2">
              {[
                { icon: <Calendar className="w-3.5 h-3.5 text-slate-400" />, label: "Start Date",      val: formatDate(startDateStr) },
                { icon: <Calendar className="w-3.5 h-3.5 text-slate-400" />, label: "End Date",        val: formatDate(endDateStr) },
                { icon: <Clock    className="w-3.5 h-3.5 text-slate-400" />, label: "Total Duration",  val: `${projectDuration} Days` },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    {r.icon}{r.label}
                  </span>
                  <span className="text-[11px] font-black text-slate-800">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SCHEDULE OVERVIEW */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">Schedule Overview</h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Actual Progress",   val: `${progressPercent}%`,                                   color: "text-slate-800" },
                { label: "Expected Progress", val: `${timelineProgress.toFixed(2)}%`,                        color: "text-slate-800" },
                { label: "Variance",          val: `${scheduleVariance > 0 ? "+" : ""}${scheduleVariance.toFixed(2)}%`, color: scheduleVariance < 0 ? "text-rose-500" : "text-emerald-500" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{m.label}</p>
                  <p className={`text-xl font-black ${m.color}`}>{m.val}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              {scheduleStatus ? (
                <span className="inline-flex px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-black border border-rose-100">
                  {scheduleStatus}
                </span>
              ) : (
                <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-[11px] font-bold border border-slate-100">
                  —
                </span>
              )}
            </div>
          </div>

        </div>


        {/* ── ROW 3 — Key KPIs | Task Summary | Milestone Summary | Recent Expenses | Expense Trend ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.2fr_1.7fr_2fr] gap-4">

          {/* KEY KPIs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">Key KPIs</h2>
            <div className="space-y-4">
              {[
                { dot: "bg-rose-500",   label: "Overdue Tasks",       val: overdueTasks },
                { dot: "bg-amber-400",  label: "Overdue Milestones",   val: overdueMilestones },
                { dot: "bg-purple-500", label: "High Priority Tasks",  val: highPriorityOverdue },
              ].map((k) => (
                <div key={k.label} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${k.dot} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                    <p className="text-2xl font-black text-slate-800">{k.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TASK SUMMARY */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">Task Summary</h2>
            <div className="space-y-3">
              {[
                { label: "Total Tasks", val: tasksTotal },
                { label: "Completed",   val: tasksCompleted },
                { label: "Pending",     val: tasksPending },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">{r.label}</span>
                  <span className="text-[11px] font-black text-slate-800">{r.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">Completion</span>
                <span className="text-[11px] font-black text-slate-800">{taskCompletionPct}%</span>
              </div>
            </div>
          </div>

          {/* MILESTONE SUMMARY */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">Milestone Summary</h2>
            <div className="space-y-3">
              {[
                { label: "Total Milestones", val: milestonesTotal },
                { label: "Completed",         val: milestonesCompleted },
                { label: "Pending",           val: milestonesPending },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">{r.label}</span>
                  <span className="text-[11px] font-black text-slate-800">{r.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">Completion</span>
                <span className="text-[11px] font-black text-slate-800">{milestoneCompletionPct}%</span>
              </div>
            </div>
          </div>

          {/* RECENT EXPENSES */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-5">
              Recent Expenses
            </h2>
            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200">
              {recentExpensesList.length === 0 ? (
                <p className="text-[11px] font-bold text-slate-400">• No recent expenses</p>
              ) : (
                recentExpensesList.map((exp: any, i: number) => (
                  <div key={exp.id || i} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">
                          {exp.title || exp.category || exp.expense_type || ""}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">
                          {exp.subtitle || exp.description || exp.notes || ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-blue-600">
                        ₹{Number(exp.amount || exp.total_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {exp.date ||
                          (exp.created_at
                            ? new Date(exp.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EXPENSE TREND */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">
              Expense Trend (6 Months)
            </h2>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseTrendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 8, fill: "#94a3b8", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "#94a3b8", fontWeight: 700 }}
                    tickFormatter={(val: number) => (val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, "Expenses"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>


        {/* ── ROW 4 — EXECUTIVE SUMMARY ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1.5">
                Executive Summary
              </h2>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Project{" "}
                <span className="font-black text-slate-800">{projectName || "—"}</span>{" "}
                is{" "}
                <span className="font-black text-slate-800">{progressPercent.toFixed(2)}%</span>{" "}
                complete. Budget utilization is{" "}
                <span className="font-black text-slate-800">{budgetUsedPercent.toFixed(2)}%</span>.
                Project health is{" "}
                <span className="font-black text-rose-500">{projectHealth || "—"}</span>.
                There are{" "}
                <span className="font-black text-slate-800">{tasksPending}</span>{" "}
                pending tasks and{" "}
                <span className="font-black text-slate-800">{milestonesPending}</span>{" "}
                pending milestones.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        title="InfraPilot AI Assistant"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {botMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-relaxed
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50"
                    }`}
                >
                  {msg.text}
                  <p className={`text-[9px] mt-1 font-black uppercase ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientDashboard;
