import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "../../utils/csvExport";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import NewProjectModal from "../../components/dashboard/NewProjectModal";
import EditProjectModal from "../../components/dashboard/EditProjectModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";
import { financeService } from "../../services/financeService";
import type { Project, ProjectStatus } from "../../types/project";
import SortDropdown from "../../components/common/SortDropdown";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<ProjectStatus, string> = {
  Planned: "bg-slate-100 text-slate-500",
  Ongoing: "bg-green-100 text-success",
  Delayed: "bg-red-100 text-red-600",
  Completed: "bg-blue-100 text-primary",
  "On Hold": "bg-amber-100 text-warning",
};

const progressFill: Record<ProjectStatus, string> = {
  Planned: "bg-slate-300",
  Ongoing: "bg-success",
  Delayed: "bg-red-500",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

const statusDot: Record<ProjectStatus, string> = {
  Planned: "bg-slate-400",
  Ongoing: "bg-success",
  Delayed: "bg-red-500",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

const backendStatusMap: Record<string, string> = {
  "Planned": "PLANNED",
  "Ongoing": "ONGOING",
  "Completed": "COMPLETED",
  "On Hold": "ON_HOLD",
  "Delayed": "" // Backend filter doesn't support DELAYED yet, so we fetch all and filter client-side
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | ProjectStatus>(
    "All",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [actTab, setActTab] = useState("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  // Pagination
  const [progressPage, setProgressPage] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const PROGRESS_PER_PAGE = 6;
  const TABLE_PER_PAGE = 10;

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch data concurrently
      const statusParam = filterStatus === "All" ? "" : (backendStatusMap[filterStatus] || "");
      console.log(`Fetching projects with filterStatus="${filterStatus}", statusParam="${statusParam}"`);

      const [pRes, allRes, pAlerts, tAlerts, invoices] = await Promise.all([
        projectService.getProjects(100, 0, debouncedSearch, statusParam),
        projectService.getProjects(100, 0),
        projectService.getProjectAlerts().catch(() => []),
        projectService.getTaskAlerts().catch(() => []),
        financeService.getInvoices(50, 0).catch(() => [])
      ]);

      const projectList = Array.isArray(pRes) ? pRes : (pRes.items || pRes.data || []);
      const fullList = Array.isArray(allRes) ? allRes : (allRes.items || allRes.data || []);

      setProjects(projectList);
      setAllProjects(fullList);

      // Process Alerts into Activities
      const combined = [
        ...pAlerts.map((a: any) => ({
          user: a.user_name || "System",
          action: `${a.project_name || 'Project'} is ${a.status || 'Updated'}`,
          rawTime: a.created_at || "",
          time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
          type: "Site",
          icon: "⚠️",
          color: "bg-red-50 text-red-500",
        })),
        ...tAlerts.map((a: any) => {
          const isFinance = /payment|invoice|bill|payroll|budget|expense|salary/i.test(a.task_name || "");
          return {
            user: a.assigned_to_name || a.author || "Member",
            action: `${a.task_name || 'Task'}: ${a.status || 'Updated'}`,
            rawTime: a.updated_at || a.created_at || "",
            time: a.updated_at ? new Date(a.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
            type: isFinance ? "Finance" : "Site",
            icon: isFinance ? "💰" : "✔",
            color: isFinance ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500",
          };
        }),
        ...invoices.map((inv: any) => ({
          user: inv.client_name || "System",
          action: `Invoice #${inv.invoice_number || inv.id}: ${inv.status}`,
          rawTime: inv.created_at || "",
          time: inv.created_at ? new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
          type: "Finance",
          icon: "🧾",
          color: "bg-amber-50 text-amber-500",
        }))
      ].sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime());

      setActivities(combined);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (projectData: any) => {
    try {
      await projectService.createProject(projectData);
      toast.success("Project created successfully!");
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  const handleEditClick = async (project: Project) => {
    try {
      const toastId = toast.loading("Fetching project details...");
      const freshProject = await projectService.getProjectById(project.id);
      setEditingProject(freshProject);
      setIsEditModalOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Failed to load project details");
      // Fallback to existing project data if API fails
      setEditingProject(project);
      setIsEditModalOpen(true);
    }
  };

  const handleEditProject = async (updatedData: any) => {
    if (!editingProject) return;
    try {
      await projectService.updateProject(editingProject.id, updatedData);
      toast.success("Project updated successfully!");
      setIsEditModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      toast.error("Failed to update project");
      console.error(error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const sortedProjects = useMemo(() => {
    const list = filterStatus === "All"
      ? projects
      : projects.filter((p) => p.status?.toLowerCase() === filterStatus.toLowerCase());

    return [...list].sort((a, b) => {
      const aVal = a.id;
      const bVal = b.id;
      return sortOrder === "latest" ? bVal - aVal : aVal - bVal;
    });
  }, [projects, filterStatus, sortOrder]);

  const filtered = sortedProjects;

  // Reset pages when filter changes
  const handleFilterChange = (s: any) => {
    setFilterStatus(s);
    setProgressPage(0);
    setTablePage(0);
  };

  const stats = useMemo(() => {
    const s = {
      total: allProjects.length,
      ongoing: allProjects.filter((p) => p.status?.toLowerCase() === "ongoing").length,
      completed: allProjects.filter((p) => p.status?.toLowerCase() === "completed").length,
      delayed: allProjects.filter((p) => p.status?.toLowerCase() === "delayed").length,
      planned: allProjects.filter((p) => p.status?.toLowerCase() === "planned").length,
      onhold: allProjects.filter((p) => p.status?.toLowerCase() === "on hold" || p.status?.toLowerCase() === "on_hold").length,
    };
    return s;
  }, [allProjects]);

  const handleViewProject = (id: number) => {
    // Determine the base path based on the current URL (admin or manager)
    const basePath = window.location.pathname.startsWith("/admin")
      ? "/admin"
      : "/manager";
    navigate(`${basePath}/projects/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await projectService.deleteProject(projectToDelete);
        toast.success("Project deleted successfully!");
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
        fetchProjects();
      } catch (error) {
        toast.error("Failed to delete project");
        console.error(error);
      }
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filtered.map(p => ({
      id: `PRJ-${p.id}`,
      project_name: p.project_name,
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
      percentage: `${p.completion_percentage}%`
    }));

    exportToCSV(csvData, "projects_export.csv", {
      id: "Project ID",
      project_name: "Project Name",
      start_date: "Start Date",
      end_date: "End Date",
      status: "Status",
      percentage: "Completion (%)"
    });
  };

  return (
    <>
      <Navbar title="Projects" breadcrumb={["InfraPilot", "Projects"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Site / Project Management
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time infrastructure projects and budget monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              Download CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Projects",
              value: String(stats.total),
              sub: `Across all locations`,
              accent: "text-primary",
              status: "All",
            },
            {
              title: "Ongoing Sites",
              value: String(stats.ongoing),
              sub: "Currently in progress",
              accent: "text-success",
              status: "Ongoing",
            },
            {
              title: "Completed",
              value: String(stats.completed),
              sub: "Successfully delivered",
              accent: "text-blue-500",
              status: "Completed",
            },
            {
              title: "Delayed",
              value: String(stats.delayed),
              sub: "Needs urgent attention",
              accent: "text-red-500",
              status: "Delayed",
            },
          ].map((s) => (
            <div
              key={s.title}
              onClick={() => s.status && handleFilterChange(s.status as any)}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer active:scale-95 group hover:border-primary/20"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              {s.sub && (
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="M21 21l-4.35-4.35"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search project name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-xs text-slate-500 outline-none w-full placeholder:text-slate-400"
                  />
                </div>
                <SortDropdown value={sortOrder} onChange={setSortOrder} />
                <div className="flex gap-2">
                  {(
                    [
                      "All",
                      "Ongoing",
                      "Planned",
                      "Delayed",
                      "Completed",
                      "On Hold",
                    ] as const
                  ).map((s) => {
                    const count = s === "All" ? stats.total :
                      s === "Ongoing" ? stats.ongoing :
                        s === "Planned" ? stats.planned :
                          s === "Delayed" ? stats.delayed :
                            s === "Completed" ? stats.completed :
                              s === "On Hold" ? stats.onhold : 0;
                    return (
                      <button
                        key={s}
                        onClick={() => handleFilterChange(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${filterStatus === s
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                      >
                        {s.toUpperCase()}
                        <span className={`px-1 rounded-md ${filterStatus === s ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-slate-800">Project Progress</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {filtered.length} of {projects.length} Projects
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic text-sm">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                  Loading project progress...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏗️</p>
                  <p className="font-bold text-slate-500 text-sm">
                    No projects found
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered
                      .slice(progressPage * PROGRESS_PER_PAGE, (progressPage + 1) * PROGRESS_PER_PAGE)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleViewProject(p.id)}
                          className="group cursor-pointer bg-slate-50/50 rounded-xl p-4 hover:bg-slate-50 transition-colors border border-slate-50"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="min-w-0">
                              <p className="text-[9px] font-mono font-bold text-slate-400">
                                PRJ-{p.id}
                              </p>
                              <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors truncate max-w-[150px]">
                                {p.project_name}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {p.completion_percentage}%
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3 mb-2">
                            <div
                              className={`h-full ${progressFill[p.status as ProjectStatus] || progressFill["Ongoing" as ProjectStatus] || "bg-slate-300"} transition-all duration-1000`}
                              style={{ width: `${p.completion_percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status as ProjectStatus] || statusDot["Ongoing" as ProjectStatus] || "bg-slate-400"}`}
                              />
                              <span className="text-[9px] font-bold text-slate-400 uppercase translate-y-px">
                                {p.status}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">
                              {p.start_date}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Progress Pagination */}
                  {filtered.length > PROGRESS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Page {progressPage + 1} of {Math.ceil(filtered.length / PROGRESS_PER_PAGE)}
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
                          onClick={() => setProgressPage(p => Math.min(Math.ceil(filtered.length / PROGRESS_PER_PAGE) - 1, p + 1))}
                          disabled={progressPage >= Math.ceil(filtered.length / PROGRESS_PER_PAGE) - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="font-bold text-slate-800 mb-4">
                Project Activity
              </h2>
              <div className="flex gap-2">
                {["All", "Finance", "Site"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${actTab === tab
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[420px]">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No Activities
                  </p>
                </div>
              ) : (
                activities
                  .filter((act) => actTab === "All" || act.type === actTab)
                  .map((act, i) => (
                    <div key={i} className="flex gap-4 group animate-in fade-in duration-300">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}
                      >
                        {act.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-800 leading-snug">
                          <span className="font-bold">{act.user}</span> {act.action}
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Master Projects Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-6 py-4">Project ID</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Loading projects...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  filtered
                    .slice(tablePage * TABLE_PER_PAGE, (tablePage + 1) * TABLE_PER_PAGE)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">PRJ-{p.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">{p.project_name}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{p.start_date} to {p.end_date}</td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${progressFill[p.status] || "bg-slate-300"}`} style={{ width: `${p.completion_percentage}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-400">{p.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[p.status as ProjectStatus] || statusBadge["Ongoing" as ProjectStatus] || "bg-slate-100 text-slate-500"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleViewProject(p.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleEditClick(p)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit Project">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteClick(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Project">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {/* Table Pagination */}
          {filtered.length > TABLE_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Showing {tablePage * TABLE_PER_PAGE + 1}–{Math.min((tablePage + 1) * TABLE_PER_PAGE, filtered.length)} of {filtered.length} projects
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
                  onClick={() => setTablePage(p => Math.min(Math.ceil(filtered.length / TABLE_PER_PAGE) - 1, p + 1))}
                  disabled={tablePage >= Math.ceil(filtered.length / TABLE_PER_PAGE) - 1}
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

        <NewProjectModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateProject}
        />

        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProject(null);
          }}
          project={editingProject}
          onSubmit={handleEditProject}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          message="Are you sure you want to delete this project? This will permanently remove all associated data including tasks and finance records."
          confirmText="Delete"
          type="danger"
        />
      </PageTransition>
    </>
  );
};

export default ProjectsPage;
