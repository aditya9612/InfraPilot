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
import CreateReportModal from "../../components/dashboard/CreateReportModal";
import { projectService } from "../../services/projectService";
import { boqService } from "../../services/boqService";
import { userService } from "../../services/userService";
import type { Project, ProjectStatus } from "../../types/project";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const budgetData = [
  { month: "Jan", budget: 45, actual: 40 },
  { month: "Feb", budget: 52, actual: 48 },
  { month: "Mar", budget: 48, actual: 55 },
  { month: "Apr", budget: 61, actual: 58 },
  { month: "May", budget: 55, actual: 60 },
  { month: "Jun", budget: 67, actual: 72 },
];

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
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [projectAlertsData, setProjectAlertsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pData, pAlerts, tAlerts] = await Promise.all([
        projectService.getProjects(100, 0),
        projectService.getProjectAlerts().catch(() => []),
        projectService.getTaskAlerts().catch(() => []),
      ]);

      const projectsList = Array.isArray(pData)
        ? pData
        : pData.items || pData.data || [];
      setProjects(projectsList);
      setProjectAlertsData(Array.isArray(pAlerts) ? pAlerts : []);

      // Combine alerts for activity feed
      const combinedAlerts = [
        ...(Array.isArray(pAlerts) ? pAlerts : []),
        ...(Array.isArray(tAlerts) ? tAlerts : []),
      ].map((a: any) => ({
        user: a.user_name || "System",
        action:
          a.message ||
          a.detail ||
          (a.project_name
            ? `${a.project_name} is ${a.status}`
            : "Alert reported"),
        time: a.created_at
          ? new Date(a.created_at).toLocaleTimeString()
          : "Recent",
        type: a.type || "alert",
      }));
      setAlerts(combinedAlerts);
    } catch (error) {
      console.error("Dashboard: Data Sync Error", error);
      toast.error("Failed to sync dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
    active: projects.filter((p) => p.status?.toString().trim().toLowerCase() === "ongoing").length,
    completed: projects.filter((p) => p.status?.toString().trim().toLowerCase() === "completed").length,
    delayed: projects.filter((p) => p.status?.toString().trim().toLowerCase() === "delayed").length,
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
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              Create Report
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
              value="₹12.8Cr"
              sub="FY 2025-26"
              accent="text-indigo-500"
            />
            <StatCard
              title="Total Expenses"
              value="₹8.4Cr"
              sub="Payments & Wages"
              accent="text-orange-500"
            />
            <StatCard
              title="Profit / Loss"
              value="+ ₹4.4Cr"
              sub="Net Margin"
              accent="text-green-600"
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
              value="138"
              sub="Across 12 sites"
              accent="text-sky-500"
            />
            <StatCard
              title="Pending Approvals"
              value="12"
              sub="5 Awaiting Admin"
              accent="text-amber-500"
            />
            <StatCard
              title="Active Alerts"
              value="4"
              sub="Low stock / Over budget"
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
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-0">
                <option>This Year</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              {!isLoading ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  debounce={100}
                >
                  <LineChart
                    data={budgetData}
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
                {["All", "Issues", "Updates"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivityFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      activityFilter === tab
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        act.type === "alert"
                          ? "bg-red-50 text-red-500"
                          : act.type === "money"
                            ? "bg-green-50 text-green-500"
                            : "bg-blue-50 text-blue-500"
                      }`}
                    >
                      {act.type === "task" && "✔"}
                      {act.type === "money" && "₹"}
                      {act.type === "photo" && "📷"}
                      {act.type === "alert" && "⚠️"}
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
                Ongoing Modules
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
                projects.slice(0, 4).map((p, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {p.project_name}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">
                        {p.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressPulse[p.status] || "bg-slate-300"} transition-all duration-1000`}
                        style={{ width: `${p.completion_percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status] || "bg-slate-400"}`}
                      />
                      <span className="text-[9px] font-bold text-slate-400 uppercase translate-y-px">
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Construction Specific Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
              👷
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Labor Today
              </p>
              <p className="text-lg font-bold text-slate-800">
                1,240{" "}
                <span className="text-[10px] font-medium text-slate-400">
                  Personnel
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold">
              🏗️
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Material Used
              </p>
              <p className="text-lg font-bold text-slate-800">
                42{" "}
                <span className="text-[10px] font-medium text-slate-400">
                  Truckloads
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center font-bold">
              🚧
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Site Issues
              </p>
              <p className="text-lg font-bold text-slate-800">
                32{" "}
                <span className="text-[10px] font-medium text-slate-400">
                  Tickets Open
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Projects Overview Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Master Projects Overview
            </h2>
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
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400 italic text-sm"
                    >
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400 italic text-sm"
                    >
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((p, i) => (
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
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[p.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
      <CreateReportModal
        isOpen={isReportModalOpen}
        projects={projects}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};

export default AdminDashboard;
