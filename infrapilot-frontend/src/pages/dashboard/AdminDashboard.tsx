import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "../../utils/csvExport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from "recharts";
import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import NewProjectModal from "../../components/dashboard/NewProjectModal";
import CreateUserModal from "../../components/forms/CreateUserModal";
import PageTransition from "../../components/common/PageTransition";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import { formatCurrency } from "../../utils/currencyUtils";

import { projectService } from "../../services/projectService";
import { boqService } from "../../services/boqService";
import { userService } from "../../services/userService";
import { expenseService } from "../../services/expenseService";
import { financeService } from "../../services/financeService";
import { sitePhotoService } from "../../services/sitePhotoService";
import { materialService } from "../../services/materialService";
import { generateProjectListPDF } from "../../utils/projectPDFGenerator";
import type { Project, ProjectStatus } from "../../types/project";

// Dynamic graph data will replace this
// const budgetData = [];

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
  const [activityFilter, setActivityFilter] = useState("All");
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
    activeAlerts: 0
  });


  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pData, pAlerts, tAlerts, expensesData, invoicesRes, usersRes, pendingApprovalsRes, photosRes, mLogs] = await Promise.all([
        projectService.getProjects(100, 0),
        projectService.getProjectAlerts().catch(() => []),
        projectService.getTaskAlerts().catch(() => []),
        expenseService.listExpenses().catch(() => []),
        financeService.getInvoices(100).catch(() => []),
        userService.getAllUsers(100).catch(() => []),
        financeService.getPendingInvoices().catch(() => []),
        sitePhotoService.getPhotos().catch(() => ({ items: [] })),
        materialService.getLogs({ limit: 50 }).catch(() => [])
      ]);

      const projectsList = Array.isArray(pData)
        ? pData
        : pData.items || pData.data || [];
      setProjects(projectsList);
      const projectAlerts = Array.isArray(pAlerts) ? pAlerts : (pAlerts?.items || pAlerts?.data || []);
      const taskAlerts = Array.isArray(tAlerts) ? tAlerts : (tAlerts?.items || tAlerts?.data || []);
      const invoices = Array.isArray(invoicesRes) ? invoicesRes : ((invoicesRes as any)?.items || (invoicesRes as any)?.data || []);
      const users = Array.isArray(usersRes) ? usersRes : ((usersRes as any)?.items || (usersRes as any)?.data || []);
      const pendingApprovals = Array.isArray(pendingApprovalsRes) ? pendingApprovalsRes : ((pendingApprovalsRes as any)?.items || (pendingApprovalsRes as any)?.data || []);

      const totalExpenses = Array.isArray(expensesData) ? expensesData.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0) : 0;
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || Number(inv.amount) || 0), 0);
      const profitLoss = totalRevenue - totalExpenses;

      setDashboardStats({
        totalRevenue,
        totalExpenses,
        profitLoss,
        activeUsers: users.filter((u: any) => u.is_active !== false).length,
        pendingApprovals: pendingApprovals.length,
        activeAlerts: projectAlerts.length + taskAlerts.length
      });

      setProjectAlertsData(projectAlerts);

      const photos = Array.isArray(photosRes) ? photosRes : (photosRes.items || []);
      const logs = Array.isArray(mLogs) ? mLogs : [];

      // Combine alerts for activity feed
      const combinedAlerts = [
        ...projectAlerts.map((a: any) => {
          const isDelayed = (a.status || "").toLowerCase().includes("delayed");
          return {
            user: a.user_name || "System",
            action: a.message || a.description || (a.project_name ? `${a.project_name} is ${a.status || 'Updated'}` : "Project alert reported"),
            time: a.created_at ? new Date(a.created_at).toLocaleTimeString() : "Recent",
            rawTime: a.created_at || "",
            type: isDelayed ? "alert" : "task",
            icon: isDelayed ? "⚠️" : "🏗️",
            color: isDelayed ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500",
          };
        }),
        ...taskAlerts.map((a: any) => {
          const isFinance = /payment|invoice|bill|payroll|budget|expense|salary/i.test(a.task_name || "");
          const isDelayed = (a.status || "").toLowerCase().includes("delayed") || (a.action || "").toLowerCase().includes("delay");
          return {
            user: a.assigned_to_name || a.author || "Member",
            action: `${a.task_name || 'Task'}: ${a.status || 'Updated'}`,
            time: a.updated_at ? new Date(a.updated_at).toLocaleTimeString() : (a.created_at ? new Date(a.created_at).toLocaleTimeString() : "Recent"),
            rawTime: a.updated_at || a.created_at || "",
            type: isDelayed ? "alert" : (isFinance ? "money" : "task"),
            icon: isDelayed ? "⚠️" : (isFinance ? "💰" : "✔"),
            color: isDelayed ? "bg-red-50 text-red-500" : (isFinance ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"),
          };
        }),
        ...invoices.map((inv: any) => ({
          user: inv.client_name || "System",
          action: `Invoice #${inv.invoice_number || inv.id}: ${inv.status}`,
          time: inv.created_at ? new Date(inv.created_at).toLocaleTimeString() : "Recent",
          rawTime: inv.created_at || "",
          type: "money",
          icon: "🧾",
          color: "bg-amber-50 text-amber-500",
        })),
        ...photos.map((p: any) => ({
          user: p.uploaded_by || "Engineer",
          action: `Uploaded site photo: ${p.description || p.activity_tag || "General Update"}`,
          time: p.created_at ? new Date(p.created_at).toLocaleTimeString() : "Recent",
          rawTime: p.created_at || "",
          type: "task",
          icon: "📷",
          color: "bg-purple-50 text-purple-500",
        })),
        ...logs.map((l: any) => {
          const isPurchase = l.type === "PURCHASE";
          return {
            user: "Store",
            action: `${l.type}: ${l.quantity} units of material recorded`,
            time: l.created_at ? new Date(l.created_at).toLocaleTimeString() : "Recent",
            rawTime: l.created_at || "",
            type: isPurchase ? "money" : "task",
            icon: isPurchase ? "🛒" : "📦",
            color: isPurchase ? "bg-orange-50 text-orange-500" : "bg-slate-50 text-slate-500",
          };
        })
      ].sort((a: any, b: any) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime());

      setAlerts(combinedAlerts);

      // Compute Chart Data
      const monthlyData: Record<string, { budget: number, actual: number }> = {
        Jan: { budget: 0, actual: 0 }, Feb: { budget: 0, actual: 0 },
        Mar: { budget: 0, actual: 0 }, Apr: { budget: 0, actual: 0 },
        May: { budget: 0, actual: 0 }, Jun: { budget: 0, actual: 0 },
        Jul: { budget: 0, actual: 0 }, Aug: { budget: 0, actual: 0 },
        Sep: { budget: 0, actual: 0 }, Oct: { budget: 0, actual: 0 },
        Nov: { budget: 0, actual: 0 }, Dec: { budget: 0, actual: 0 },
      };

      projectsList.forEach((p: any) => {
        if (p.budget && p.start_date && p.end_date) {
          const start = new Date(p.start_date);
          const end = new Date(p.end_date);
          const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
          const monthlyBudget = p.budget / (monthsDiff > 0 ? monthsDiff : 1);

          for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
            const monthKey = d.toLocaleString('default', { month: 'short' });
            if (monthlyData[monthKey]) {
              monthlyData[monthKey].budget += monthlyBudget;
            }
          }
        }
      });

      if (Array.isArray(expensesData)) {
        expensesData.forEach((exp: any) => {
          if (exp.expense_date) {
            const monthKey = new Date(exp.expense_date).toLocaleString('default', { month: 'short' });
            if (monthlyData[monthKey]) {
              monthlyData[monthKey].actual += Number(exp.amount) || 0;
            }
          }
        });
      }

      const monthsArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      if (timeFilter === "This Year") {
        const formattedGraphData = monthsArr.map(m => ({
          month: m,
          budget: Math.round(monthlyData[m].budget),
          actual: Math.round(monthlyData[m].actual),
        }));
        setGraphData(formattedGraphData);
      } else {
        // "This Month" logic - show days of the current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthName = monthsArr[currentMonth];

        const dailyBudget = monthlyData[monthName].budget / daysInMonth;
        const dailyDataArray = [];

        for (let i = 1; i <= daysInMonth; i++) {
          let dayActual = 0;
          if (Array.isArray(expensesData)) {
            expensesData.forEach((exp: any) => {
              if (exp.expense_date) {
                const expDate = new Date(exp.expense_date);
                if (expDate.getDate() === i && expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                  dayActual += Number(exp.amount) || 0;
                }
              }
            });
          }

          dailyDataArray.push({
            month: `${i} ${monthName}`, // Label as "1 May", "2 May", etc.
            budget: Math.round(dailyBudget),
            actual: Math.round(dayActual),
          });
        }
        setGraphData(dailyDataArray);
      }
    } catch (error) {
      console.error("Dashboard: Data Sync Error", error);
      toast.error("Failed to sync dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, timeFilter]);

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
      efficiency_score: "92.4",
    }));
    exportToCSV(csvData, "master_projects_overview.csv", {
      project_name: "Site / Project",
      start_date: "Start Date",
      end_date: "End Date",
      status: "Health",
      completion: "Total Progress",
      efficiency_score: "Efficiency Score",
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

  // Dynamic Statistics
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "Ongoing").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    delayed: projects.filter((p) => p.status === "Delayed").length,
  };

  const filteredAlerts = alerts.filter(act => {
    if (activityFilter === "All") return true;
    if (activityFilter === "Finance") return act.type === "money";
    if (activityFilter === "Issues") return act.type === "alert";
    if (activityFilter === "Updates") return act.type === "task";
    return true;
  });

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
              value={String(stats.total)}
              sub="+3 this month"
              accent="text-primary"
            />
            <StatCard
              title="Ongoing Projects"
              value={String(stats.active)}
              sub="On-going sites"
              accent="text-blue-500"
            />
            <StatCard
              title="Completed Projects"
              value={String(stats.completed)}
              sub="Handed over"
              accent="text-emerald-500"
            />
            <StatCard
              title="Delayed Projects"
              value={String(stats.delayed)}
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
              value={formatCurrency(dashboardStats.totalRevenue)}
              sub="Total Invoiced"
              accent="text-indigo-500"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(dashboardStats.totalExpenses)}
              sub="Payments & Purchases"
              accent="text-orange-500"
            />
            <StatCard
              title="Profit / Loss"
              value={`${dashboardStats.profitLoss > 0 ? '+ ' : ''}${formatCurrency(dashboardStats.profitLoss)}`}
              sub="Net Margin"
              accent={dashboardStats.profitLoss >= 0 ? "text-green-600" : "text-danger"}
            />
          </div>
        </div>

        {/* Operations & Alerts */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Operations & Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Active Users"
              value={dashboardStats.activeUsers.toString()}
              sub={`Across ${projects.length} sites`}
              accent="text-sky-500"
            />
            <StatCard
              title="Pending Approvals"
              value={dashboardStats.pendingApprovals.toString()}
              sub="Invoices / Work Orders"
              accent="text-amber-500"
            />
            <StatCard
              title="Active Alerts"
              value={dashboardStats.activeAlerts.toString()}
              sub="Project & Task Updates"
              accent="text-danger"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Cost Tracking
                </h2>
                <p className="text-xs text-slate-400">
                  Budget vs Actual expenditure across all projects
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
                  <LineChart
                    data={graphData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="month"
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
                    <Line
                      type="monotone"
                      dataKey="budget"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Planned Budget"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#F43F5E"
                      strokeWidth={3}
                      dot={{ fill: "#F43F5E", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Actual Cost"
                    />
                    {/* Highlight Over Budget Areas in Red */}
                    <ReferenceArea
                      x1="Feb"
                      x2="Apr"
                      fill="#fee2e2"
                      fillOpacity={0.3}
                      label={{
                        position: "top",
                        value: "Over Budget",
                        fill: "#ef4444",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                  </LineChart>
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
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="font-bold text-slate-800 mb-4">Activity Pulse</h2>
              <div className="flex gap-2">
                {["All", "Finance", "Issues", "Updates"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivityFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activityFilter === tab
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No Alerts
                  </p>
                </div>
              ) : (
                filteredAlerts.map((act, i) => (
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
                        {alert.project_name}
                        <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                          {alert.status}
                        </span>
                      </p>
                      <p className="text-[10px] text-red-600 mt-0.5">
                        Delayed since:{" "}
                        {alert.end_date
                          ? new Date(alert.end_date).toLocaleDateString()
                          : "TBD"}
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Page {progressPage + 1} of {Math.ceil(projects.length / PROGRESS_PER_PAGE)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setProgressPage(p => Math.max(0, p - 1))}
                    disabled={progressPage === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-primary/20">
                    {progressPage + 1}
                  </div>
                  <button
                    onClick={() => setProgressPage(p => Math.min(Math.ceil(projects.length / PROGRESS_PER_PAGE) - 1, p + 1))}
                    disabled={progressPage >= Math.ceil(projects.length / PROGRESS_PER_PAGE) - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
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
                  <th className="px-6 py-4 text-center">Efficiency Score</th>
                  <th className="px-6 py-4">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
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
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-800 font-bold">92.4</span>
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
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Showing {tablePage * TABLE_PER_PAGE + 1}–{Math.min((tablePage + 1) * TABLE_PER_PAGE, projects.length)} of {projects.length} projects
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTablePage(p => Math.max(0, p - 1))}
                  disabled={tablePage === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-primary/20">
                  {tablePage + 1}
                </div>
                <button
                  onClick={() => setTablePage(p => Math.min(Math.ceil(projects.length / TABLE_PER_PAGE) - 1, p + 1))}
                  disabled={tablePage >= Math.ceil(projects.length / TABLE_PER_PAGE) - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
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
