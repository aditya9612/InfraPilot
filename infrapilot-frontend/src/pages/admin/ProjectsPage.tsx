import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "../../utils/csvExport";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import NewProjectModal from "../../components/dashboard/NewProjectModal";
import EditProjectModal from "../../components/dashboard/EditProjectModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";
import type { Project, ProjectStatus } from "../../types/project";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<ProjectStatus, string> = {
  Planned: "bg-slate-100 text-slate-500",
  Active: "bg-green-100 text-success",
  Delayed: "bg-red-100 text-red-600",
  Completed: "bg-blue-100 text-primary",
  "On Hold": "bg-amber-100 text-warning",
};

const progressFill: Record<ProjectStatus, string> = {
  Planned: "bg-slate-300",
  Active: "bg-success",
  Delayed: "bg-red-500",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

const statusDot: Record<ProjectStatus, string> = {
  Planned: "bg-slate-400",
  Active: "bg-success",
  Delayed: "bg-red-500",
  Completed: "bg-primary",
  "On Hold": "bg-warning",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | ProjectStatus>(
    "All",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actTab, setActTab] = useState("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await projectService.getProjects(100, 0, debouncedSearch, filterStatus);
      const projectList = Array.isArray(res) ? res : (res.items || res.data || []);
      setProjects(projectList);
    } catch (error) {
      toast.error("Failed to fetch projects");
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

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
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

  const filtered = projects;

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "Active").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    delayed: projects.filter((p) => p.status === "Delayed").length,
  };

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
              title: "Active Sites",
              value: String(stats.active),
              sub: "Currently in progress",
              accent: "text-success",
              status: "Active",
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
              onClick={() => s.status && setFilterStatus(s.status as any)}
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
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
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
                <div className="flex gap-2">
                  {(
                    [
                      "All",
                      "Active",
                      "Planned",
                      "Delayed",
                      "Completed",
                      "On Hold",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterStatus === s
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map((p) => (
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
                          className={`h-full ${progressFill[p.status] || "bg-slate-300"} transition-all duration-1000`}
                          style={{ width: `${p.completion_percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status] || "bg-slate-400"}`}
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
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      actTab === tab
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
              {[
                {
                  user: "Ravi K.",
                  action: "completed Foundation — SARA CITY",
                  time: "12m ago",
                  type: "Site",
                  icon: "✔",
                  color: "bg-blue-50 text-blue-500",
                },
                {
                  user: "Priya N.",
                  action: "submitted Invoice #882 for METRO HEIGHTS",
                  time: "45m ago",
                  type: "Finance",
                  icon: "₹",
                  color: "bg-green-50 text-green-500",
                },
                {
                  user: "Site Bot",
                  action: "uploaded 12 site photos",
                  time: "2h ago",
                  type: "Site",
                  icon: "📷",
                  color: "bg-blue-50 text-blue-500",
                },
                {
                  user: "Amit K.",
                  action: "reported Material Shortage at Hadapsar",
                  time: "4h ago",
                  type: "Site",
                  icon: "⚠️",
                  color: "bg-red-50 text-red-500",
                },
              ]
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
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Master Projects Overview
            </h2>
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
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        PRJ-{p.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {p.project_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {p.start_date} to {p.end_date}
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressFill[p.status] || "bg-slate-300"}`}
                              style={{ width: `${p.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400">
                            {p.completion_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[p.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewProject(p.id)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
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
