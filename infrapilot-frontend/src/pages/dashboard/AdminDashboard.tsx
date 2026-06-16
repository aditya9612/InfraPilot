import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "../../utils/csvExport";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import NewProjectModal from "../../components/dashboard/NewProjectModal";
import CreateUserModal from "../../components/forms/CreateUserModal";
import PageTransition from "../../components/common/PageTransition";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import { formatCompactCurrency } from "../../utils/currencyUtils";

import { projectService } from "../../services/projectService";
import { boqService } from "../../services/boqService";
import { userService } from "../../services/userService";
import { dashboardService } from "../../services/dashboardService";
import { generateProjectListPDF } from "../../utils/projectPDFGenerator";
import type { Project, ProjectStatus } from "../../types/project";

// ─── Styling Helpers ──────────────────────────────────────────────────────────
const statusBadge: Record<ProjectStatus, string> = {
  Planned: "bg-slate-100 text-slate-500",
  Ongoing: "bg-green-100 text-success",
  Delayed: "bg-red-100 text-danger",
  Completed: "bg-blue-100 text-primary",
  "On Hold": "bg-amber-100 text-warning",
};

const statusDot: Record<ProjectStatus, string> = {
  Planned: "bg-slate-400",
  Ongoing: "bg-success",
  Delayed: "bg-danger",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

const progressPulse: Record<ProjectStatus, string> = {
  Planned: "bg-slate-300",
  Ongoing: "bg-success",
  Delayed: "bg-danger",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [timeFilter, setTimeFilter] = useState("This Year");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [projectAlertsData, setProjectAlertsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Pagination
  const [progressPage, setProgressPage] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const PROGRESS_PER_PAGE = 6;
  const TABLE_PER_PAGE = 10;

  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profitLoss: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    actionItems: 0,
    siteIssuesOpen: 0,
    totalLabourToday: 0,
    materialUsedToday: 0,
    projectOverview: {
      total: 0,
      active: 0,
      completed: 0,
      delayed: 0
    }
  });

  const [kpiComparison, setKpiComparison] = useState({
    current_month: 0,
    previous_month: 0,
    difference: 0,
  });

  const [disciplineProgress, setDisciplineProgress] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Dashboard: Fetching from /api/v1/dashboard/admin...");

      const data = await dashboardService.getAdminDashboard();
      console.log("Dashboard: API response received", data);

      // --- Map stats from the correct API response shape ---
      const po = data.project_overview || {};
      const financial = data.financial || {};
      const vitals = data.vitals || {};

      setDashboardStats({
        totalRevenue: Number(financial.revenue) || 0,
        totalExpenses: Number(financial.expense) || 0,
        profitLoss: Number(financial.profit) || 0,
        activeUsers: Number(data.active_users) || 0,
        pendingApprovals: Number(vitals.pending_approvals) || 0,
        actionItems: Number(vitals.action_items) || 0,
        siteIssuesOpen: Number(vitals.site_issues_open) || 0,
        totalLabourToday: Number(vitals.total_labour_today) || 0,
        materialUsedToday: Number(vitals.material_used_today) || 0,
        projectOverview: {
          total: Number(po.total) || 0,
          active: Number(po.active) || 0,
          completed: Number(po.completed) || 0,
          delayed: Number(po.delayed) || 0,
        }
      });

      // KPI comparison
      if (data.kpi_comparison) {
        setKpiComparison(data.kpi_comparison);
      }

      // Discipline progress (used for chart)
      const discipline = Array.isArray(data.discipline_progress) ? data.discipline_progress : [];
      setDisciplineProgress(discipline);

      // Projects: master_projects[] -> map to Project shape
      const projectsList = (data.master_projects || []).map((p: any) => ({
        id: p.id,
        project_name: p.name,
        start_date: p.start_date,
        end_date: p.end_date,
        completion_percentage: p.progress ?? 0,
        status: (() => {
          const h = (p.health || "").toUpperCase();
          if (h === "ONGOING") return "Ongoing";
          if (h === "COMPLETED") return "Completed";
          if (h === "DELAYED") return "Delayed";
          if (h === "ON_HOLD") return "On Hold";
          return "Planned";
        })(),
        performance_score: p.performance_score,
      } as unknown as Project));
      setProjects(projectsList);

      // Critical alerts: delayed projects from master_projects
      const criticalAlerts = projectsList
        .filter((p: any) => p.status === "Delayed" || (p.performance_score !== undefined && p.performance_score < -50))
        .map((p: any) => ({
          ...p,
          display_name: p.project_name,
          display_status: p.status,
          display_date: p.end_date ? `End: ${new Date(p.end_date).toLocaleDateString()}` : "TBD",
          project_id: p.id,
        }));
      setProjectAlertsData(criticalAlerts);

      // Activity / alerts feed from recent_activities
      const activities = Array.isArray(data.recent_activities) ? data.recent_activities : [];
      const ACTIVITY_ICONS: Record<string, string> = {
        UPDATE_USER: "👤", DELETE_USER: "🗑️", CREATE_USER: "👤+",
        UPDATE_PROJECT: "🏗️", DELETE_PROJECT: "🗑️", CREATE_PROJECT: "🏗️+",
        UPDATE_INVOICE: "🧾", CREATE_INVOICE: "🧾+", DELETE_INVOICE: "🗑️",
      };
      setAlerts(activities.map((a: any) => ({
        user: a.user || "System",
        action: `${a.description || a.type}${a.project_name && a.project_name !== "Global" ? ` — ${a.project_name}` : ""}`,
        time: a.time || "Recent",
        rawTime: a.time || "",
        type: (a.type || "").toLowerCase().includes("delete") ? "alert" :
          (a.type || "").toLowerCase().includes("invoice") ? "money" : "task",
        icon: ACTIVITY_ICONS[a.type] || "🔔",
        color: (a.type || "").toLowerCase().includes("delete") ? "bg-red-50 text-red-500" :
          (a.type || "").toLowerCase().includes("invoice") ? "bg-amber-50 text-amber-500" :
            "bg-blue-50 text-blue-500",
      })));

      // Discipline dataset is stored entirely into state; we construct the timeline via useEffect
      if (discipline.length === 0) {
        setGraphData([{ name: "None", budget: 0, actual: 0 }]);
      }

    } catch (error) {
      console.error("Dashboard: /api/v1/dashboard/admin failed", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Generate timeline data for the graph depending on timeFilter
  useEffect(() => {
    if (disciplineProgress.length === 0) return;

    // Use the first discipline (General) or sum them to trace the primary timeline
    const targetPlanned = disciplineProgress[0]?.planned_percent || 0;
    const targetActual = disciplineProgress[0]?.actual_percent || 0;
    const d = new Date();

    if (timeFilter === "This Year") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = d.getMonth();
      const mapped = months.map((m, i) => {
        // Curve Planned Budget up to target linearly
        const budget = Number(((targetPlanned / 11) * i).toFixed(2));

        let actual = 0;
        if (i <= currentMonth) {
          // Curve Actual Cost up to the target on the current month
          actual = currentMonth === 0 ? targetActual : Number(((targetActual / currentMonth) * i).toFixed(2));
        }

        return { name: m, budget, actual };
      });
      setGraphData(mapped);
    } else {
      // "This Month" filter
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const currentWeek = Math.min(Math.floor(d.getDate() / 7), 3);
      const mapped = weeks.map((w, i) => {
        const budget = Number(((targetPlanned / 3) * i).toFixed(2));
        let actual = 0;
        if (i <= currentWeek) {
          actual = currentWeek === 0 ? targetActual : Number(((targetActual / currentWeek) * i).toFixed(2));
        }
        return { name: w, budget, actual };
      });
      setGraphData(mapped);
    }
  }, [disciplineProgress, timeFilter]);

  const navigate = useNavigate();

  const handleViewProject = (id: number) => {
    navigate(`/admin/projects/${id}`);
  };

  const handleDownloadCSV = () => {
    const csvData = projects.map((p) => ({
      project_name: p.project_name,
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
      completion: `${p.completion_percentage}%`,
    }));
    exportToCSV(csvData, "master_projects_overview.csv", {
      project_name: "Site / Project",
      start_date: "Start Date",
      end_date: "End Date",
      status: "Health",
      completion: "Total Progress",
    });
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await userService.createUser(userData);
      toast.success("User created successfully!");
      setIsUserModalOpen(false);
      fetchDashboardData(); // Refresh stats
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      await projectService.createProject(projectData);
      toast.success("Project created successfully!");
      setIsNewProjectModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleCreateBOQ = async (boqData: any) => {
    try {
      await boqService.createBoq(boqData);
      toast.success("BOQ item created successfully!");
      setIsBOQModalOpen(false);
    } catch (error) {
      toast.error("Failed to create BOQ item");
    }
  };

  return (
    <>
      <Navbar
        title="Admin Overview"
        breadcrumb={["InfraPilot", "Dashboard", "Admin"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Project Pulse
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time infrastructure health and budget monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              + New Project
            </button>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              + Add User
            </button>
            <button
              onClick={() => setIsBOQModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              + Create BOQ
            </button>

          </div>
        </div>

        {/* Top Feature Stats - Project Overview */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Project Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={String(dashboardStats.projectOverview.total)}
              sub="Master projects"
              accent="text-primary"
            />
            <StatCard
              title="Ongoing Projects"
              value={String(dashboardStats.projectOverview.active)}
              sub="On-going sites"
              accent="text-blue-500"
            />
            <StatCard
              title="Completed Projects"
              value={String(dashboardStats.projectOverview.completed)}
              sub="Handed over"
              accent="text-emerald-500"
            />
            <StatCard
              title="Delayed Projects"
              value={String(dashboardStats.projectOverview.delayed)}
              sub="At high risk"
              accent="text-rose-500"
            />
          </div>
        </div>

        {/* Financial Overview */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Financial Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Revenue"
              value={formatCompactCurrency(dashboardStats.totalRevenue)}
              sub="Total Invoiced"
              accent="text-indigo-500"
            />
            <StatCard
              title="Total Expenses"
              value={formatCompactCurrency(dashboardStats.totalExpenses)}
              sub="Payments & Purchases"
              accent="text-orange-500"
            />
            <StatCard
              title="Profit / Loss"
              value={`${dashboardStats.profitLoss > 0 ? '+ ' : ''}${formatCompactCurrency(dashboardStats.profitLoss)}`}
              sub="Net Margin"
              accent={dashboardStats.profitLoss >= 0 ? "text-green-600" : "text-danger"}
            />
          </div>
        </div>

        {/* Operations & Vitals */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Operations &amp; Vitals
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Active Users"
              value={dashboardStats.activeUsers.toString()}
              sub={`Across ${projects.length} sites`}
              accent="text-sky-500"
            />
            <StatCard
              title="Pending Approvals"
              value={dashboardStats.pendingApprovals.toString()}
              sub="Awaiting review"
              accent="text-amber-500"
            />
            <StatCard
              title="Action Items"
              value={dashboardStats.actionItems.toString()}
              sub="Requires action"
              accent="text-orange-500"
            />
            <StatCard
              title="Site Issues Open"
              value={dashboardStats.siteIssuesOpen.toString()}
              sub="Open tickets"
              accent="text-danger"
            />
            <StatCard
              title="Labour Today"
              value={dashboardStats.totalLabourToday.toString()}
              sub="On-site workers"
              accent="text-emerald-500"
            />
          </div>
        </div>

        {/* KPI Comparison */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            KPI — Month on Month
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Month</p>
              <p className="text-2xl font-black text-indigo-600">{formatCompactCurrency(kpiComparison.current_month)}</p>
              <p className="text-xs text-slate-400 mt-1">Revenue this month</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previous Month</p>
              <p className="text-2xl font-black text-slate-600">{formatCompactCurrency(kpiComparison.previous_month)}</p>
              <p className="text-xs text-slate-400 mt-1">Revenue last month</p>
            </div>
            <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-4 ${kpiComparison.difference >= 0 ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Difference</p>
              <p className={`text-2xl font-black ${kpiComparison.difference >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpiComparison.difference >= 0 ? '+' : ''}{formatCompactCurrency(kpiComparison.difference)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{kpiComparison.difference >= 0 ? 'Growth' : 'Decline'} vs last month</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Discipline Progress
                </h2>
                <p className="text-xs text-slate-400">
                  Planned vs Actual % progress across disciplines
                </p>
              </div>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-0"
              >
                <option value="This Year">This Year</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
            <div className="h-[300px] w-full relative">
              {!isLoading && graphData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  debounce={100}
                >
                  <ComposedChart
                    data={graphData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    <Area type="monotone" dataKey="actual" name="Actual Cost" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.05} dot={{ r: 4, strokeWidth: 2, fill: "#f43f5e" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="budget" name="Planned Budget" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Loading Analytics...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Activity Pulse</h2>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No Alerts
                  </p>
                </div>
              ) : (
                alerts.map((act, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.color || (act.type === "alert"
                        ? "bg-red-50 text-red-500"
                        : act.type === "money"
                          ? "bg-green-50 text-green-500"
                          : "bg-blue-50 text-blue-500")
                        }`}
                    >
                      {act.icon || (
                        <>
                          {act.type === "task" && "✔"}
                          {act.type === "money" && "₹"}
                          {act.type === "photo" && "📷"}
                          {act.type === "alert" && "⚠️"}
                        </>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800 leading-snug">
                        <span className="font-bold">{act.user}</span>{" "}
                        {act.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-red-500 font-bold">⚠️</span>
              <h2 className="font-bold text-slate-800">Critical Alerts</h2>
            </div>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {projectAlertsData.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    All Projects Healthy
                  </p>
                </div>
              ) : (
                projectAlertsData.map((alert, i) => (
                  <div
                    key={i}
                    className="p-3 bg-red-50 rounded-xl flex items-start gap-3 border border-red-100/50 hover:bg-red-100/50 transition-all cursor-pointer"
                    onClick={() => handleViewProject(alert.project_id)}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-900 flex justify-between items-center">
                        {alert.display_name || alert.project_name}
                        <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                          {alert.display_status || alert.status}
                        </span>
                      </p>
                      <p className="text-[10px] text-red-600 mt-0.5">
                        {alert.display_date || (alert.end_date ? `Delayed since: ${new Date(alert.end_date).toLocaleDateString()}` : "TBD")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Project Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800">Project Progress</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {projects.length} OF {projects.length} PROJECTS
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <div className="col-span-2 py-8 text-center text-slate-400 italic text-sm">
                  Loading progress...
                </div>
              ) : projects.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-400 italic text-sm">
                  No projects available.
                </div>
              ) : (
                projects
                  .slice(progressPage * PROGRESS_PER_PAGE, (progressPage + 1) * PROGRESS_PER_PAGE)
                  .map((p, i) => (
                    <div key={i} className="group cursor-pointer" onClick={() => handleViewProject(p.id)}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest">
                          PRJ-{p.id}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">
                          {p.completion_percentage}%
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors mb-2 truncate">
                        {p.project_name}
                      </p>
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressPulse[p.status] || "bg-slate-300"} transition-all duration-1000`}
                          style={{ width: `${p.completion_percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status] || "bg-slate-400"}`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{p.status}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">{p.end_date}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            {/* Progress Pagination */}
            {projects.length > PROGRESS_PER_PAGE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                <span className="text-xs text-slate-400 font-medium">
                  {progressPage * PROGRESS_PER_PAGE + 1}–{Math.min((progressPage + 1) * PROGRESS_PER_PAGE, projects.length)} of {projects.length} projects
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProgressPage(p => Math.max(0, p - 1))}
                    disabled={progressPage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    {progressPage + 1}
                  </div>
                  <button
                    onClick={() => setProgressPage(p => Math.min(Math.ceil(projects.length / PROGRESS_PER_PAGE) - 1, p + 1))}
                    disabled={progressPage >= Math.ceil(projects.length / PROGRESS_PER_PAGE) - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Projects Overview Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Master Projects Overview
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => generateProjectListPDF(projects)}
                className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Download PDF
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-6 py-4">Site/Project</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Total Progress</th>
                  <th className="px-6 py-4">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects
                    .slice(tablePage * TABLE_PER_PAGE, (tablePage + 1) * TABLE_PER_PAGE)
                    .map((p, i) => (
                      <tr
                        key={i}
                        onClick={() => handleViewProject(p.id)}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {p.project_name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                          {p.start_date} - {p.end_date}
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${progressPulse[p.status] || "bg-slate-300"}`}
                                style={{ width: `${p.completion_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                              {p.completion_percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[p.status] || "bg-slate-100 text-slate-500"}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {/* Table Pagination */}
          {projects.length > TABLE_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
              <span className="text-xs text-slate-400 font-medium">
                {tablePage * TABLE_PER_PAGE + 1}–{Math.min((tablePage + 1) * TABLE_PER_PAGE, projects.length)} of {projects.length} projects
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTablePage(p => Math.max(0, p - 1))}
                  disabled={tablePage === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                  {tablePage + 1}
                </div>
                <button
                  onClick={() => setTablePage(p => Math.min(Math.ceil(projects.length / TABLE_PER_PAGE) - 1, p + 1))}
                  disabled={tablePage >= Math.ceil(projects.length / TABLE_PER_PAGE) - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleCreateUser}
      />
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      <CreateBOQModal
        isOpen={isBOQModalOpen}
        projects={projects}
        onClose={() => setIsBOQModalOpen(false)}
        onSubmit={handleCreateBOQ}
      />

    </>
  );
};

export default AdminDashboard;
