import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import {
  Plus, Search, Eye, Edit2, RotateCcw, Trash2,
  ChevronLeft, ChevronRight, HeartPulse,
  AlertOctagon, ShieldCheck
} from "lucide-react";
import { safetyService } from "../../services/safetyService";
import { projectService } from "../../services/projectService";
import type { IncidentItem as SafetyItem, CreateIncidentRequest } from "../../services/safetyService";

const violationTypeColors: Record<string, string> = {
  "No Helmet": "bg-red-100 text-red-600 border-red-200",
  "Unsafe Equipment Usage": "bg-orange-100 text-orange-600 border-orange-200",
  "No Safety Harness": "bg-yellow-100 text-yellow-600 border-yellow-200",
  "Unsafe Scaffolding": "bg-amber-100 text-amber-600 border-amber-200",
  "Fire Hazard": "bg-rose-100 text-rose-600 border-rose-200",
  "Electrical Hazard": "bg-blue-100 text-blue-600 border-blue-200",
};

const VIOLATION_TYPES = [
  "No Helmet", "Unsafe Equipment Usage", "No Safety Harness",
  "Unsafe Scaffolding", "Fire Hazard", "Electrical Hazard",
];

const ManagerSafetyPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  // Align with sidebar paths: /manager/safety/incidents, /manager/safety/actions
  const activeTab = tab === "actions" ? "actions" : "incidents";
  const { selectedProjectId } = useProject();

  const [incidentList, setIncidentList] = useState<SafetyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "HighRisk" | "Critical" | "Month">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [filterViolationType, setFilterViolationType] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<number | "">("");
  const [filterChecklistStatus, setFilterChecklistStatus] = useState("");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SafetyItem | null>(null);
  const [selectedIncidentTask, setSelectedIncidentTask] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([]);

  const fetchTasks = useCallback(async (projectId: number) => {
    if (!projectId) return;
    try {
      const res = await projectService.getTasks(projectId);
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setTasks(items.map((t: any) => ({ id: t.id, title: t.title || t.name || `Task #${t.id}` })));
    } catch {
      setTasks([]);
    }
  }, []);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const userStr = localStorage.getItem('infrapilot_user');
      let currentUserId = 0;
      let localProjects: any[] = [];
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          currentUserId = user?.id || user?.user?.id || 0;
          localProjects = user?.assigned_projects || user?.user?.assigned_projects || [];
        } catch (e) { }
      }
      try {
        const res = await projectService.getAssignedProjects(currentUserId);
        const apiProjects = Array.isArray(res) ? res : ((res as any).items || (res as any).data || []);
        setProjects(apiProjects.length > 0 ? apiProjects : localProjects);
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setProjects(localProjects);
      }
    };
    fetchProjects();
  }, []);

  const getProjectName = (projId: number) => {
    const project = projects.find(p => Number(p.id || p.project_id) === Number(projId));
    return project ? (project.name || project.project_name) : `Project #${projId}`;
  };

  // Ensure project name is available when viewing a record — fetch if missing
  useEffect(() => {
    if (!isViewModalOpen || !selectedIncident) return;
    const pid = Number(selectedIncident.project_id);
    const found = projects.find(p => Number(p.id || p.project_id) === pid);
    if (!found) {
      (async () => {
        try {
          const proj = await projectService.getProjectById(pid);
          setProjects(prev => {
            const exists = prev.find(p => Number(p.id || p.project_id) === pid);
            if (exists) return prev;
            return [...prev, proj];
          });
        } catch (e) {
          // ignore
        }
      })();
    }

    const taskId = Number(selectedIncident.task_id);
    if (taskId) {
      (async () => {
        try {
          const task = await projectService.getTask(pid, taskId);
          setSelectedIncidentTask(task || null);
        } catch (e) {
          setSelectedIncidentTask(null);
        }
      })();
    } else {
      setSelectedIncidentTask(null);
    }
  }, [isViewModalOpen, selectedIncident, projects]);

  const defaultForm = (): CreateIncidentRequest => ({
    project_id: selectedProjectId || projects[0]?.id || 0,
    task_id: null,
    date: new Date().toISOString().split("T")[0],
    violation_type: "No Helmet",
    description: "",
    injury_details: "",
    action_taken: "",
    responsible_person: "",
    safety_checklist_status: "pending",
    ppe_compliance: true,
  });

  const [formData, setFormData] = useState<CreateIncidentRequest>(defaultForm());

  // ── DATA ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectId = filterProjectId !== "" ? (filterProjectId as number) : (selectedProjectId || undefined);
      const res = await safetyService.listIncidents(projectId, filterViolationType || undefined);
      const items = (res.items || []).sort((a: SafetyItem, b: SafetyItem) => Number(b.id) - Number(a.id));
      setIncidentList(items);
    } catch {
      toast.error("Failed to load safety records from the command center");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, filterViolationType, filterProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterViolationType, filterProjectId, filterChecklistStatus, activeStatFilter, sortOrder]);
  useEffect(() => { setActiveStatFilter("All"); }, [activeTab]);
  useEffect(() => {
    const pid = Number(formData.project_id);
    if (pid) fetchTasks(pid);
  }, [formData.project_id, fetchTasks]);

  // ── STATS ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = incidentList.length;
    const critical = incidentList.filter(i => i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard").length;
    const noInjury = incidentList.filter(i => {
      const t = (i.injury_details || "").trim().toLowerCase();
      return !t || t.includes("no injury") || t.includes("none") || t.includes("n/a") || t === "-";
    }).length;

    const ppeCompliant = incidentList.filter(i => i.ppe_compliance).length;
    const checklistDone = incidentList.filter(i => i.safety_checklist_status === "completed").length;

    const ppeRate = total > 0 ? (ppeCompliant / total) * 100 : 100;
    const checklistRate = total > 0 ? (checklistDone / total) * 100 : 100;
    const injuryFreeRate = total > 0 ? (noInjury / total) * 100 : 100;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCount = incidentList.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    }).length;

    return {
      total, critical,
      compliance: Math.round((noInjury / (total || 1)) * 100),
      siteSafety: Math.round((ppeRate + checklistRate + injuryFreeRate) / 3),
      thisMonthCount,
    };
  }, [incidentList]);

  // ── FILTERED LIST ─────────────────────────────────────────────
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let data = incidentList.filter(i =>
      (!term || i.description.toLowerCase().includes(term) ||
        i.responsible_person.toLowerCase().includes(term) ||
        i.violation_type.toLowerCase().includes(term)) &&
      (!filterViolationType || i.violation_type === filterViolationType) &&
      (!filterChecklistStatus || (i.safety_checklist_status || "pending") === filterChecklistStatus)
    );

    if (activeStatFilter === "HighRisk") data = data.filter(i => i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard");
    if (activeStatFilter === "Compliance") data = data.filter(i => !i.injury_details || i.injury_details.toLowerCase().includes("no injury"));
    if (activeStatFilter === "Critical") data = data.filter(i => !!(i.injury_details && !i.injury_details.toLowerCase().includes("no injury")));
    if (activeStatFilter === "Month") {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
    }

    return data.sort((a, b) => sortOrder === "latest" ? Number(b.id) - Number(a.id) : Number(a.id) - Number(b.id));
  }, [incidentList, searchTerm, filterViolationType, filterChecklistStatus, activeStatFilter, sortOrder]);

  const breakdown = useMemo(() => {
    const groups: Record<string, { total: number; resolved: number; unresolved: number }> = {};
    filteredList.forEach(q => {
      if (!groups[q.violation_type]) groups[q.violation_type] = { total: 0, resolved: 0, unresolved: 0 };
      groups[q.violation_type].total++;
      if (q.safety_checklist_status === "completed") groups[q.violation_type].resolved++;
      else groups[q.violation_type].unresolved++;
    });
    return Object.entries(groups).map(([type, d]) => ({ type, ...d, resolutionRate: Math.round((d.resolved / d.total) * 100) + "%" }));
  }, [filteredList]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  // ── HANDLERS ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(p => ({ ...p, [name]: val }));
  };

  const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
    if (e) e.preventDefault();
    if (!formData.date || !formData.violation_type || !formData.description || !formData.action_taken || !formData.responsible_person) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await safetyService.createIncident({ ...formData, project_id: selectedProjectId || formData.project_id });
      toast.success("Safety record created!");
      setIsNewModalOpen(false);
      setFormData(defaultForm());
      fetchData();
    } catch { toast.error("Failed to create record"); } finally { setIsSubmitting(false); }
  };

  const handleUpdateSubmit = async (e?: React.BaseSyntheticEvent) => {
    if (e) e.preventDefault();
    if (!selectedIncident) return;
    setIsSubmitting(true);
    try {
      await safetyService.updateIncident(selectedIncident.id, formData);
      toast.success("Record updated!");
      setIsEditModalOpen(false);
      fetchData();
    } catch { toast.error("Failed to update"); } finally { setIsSubmitting(false); }
  };

  const handleViewClick = async (id: number) => {
    try {
      const item = await safetyService.getIncident(id);
      setSelectedIncident(item);
      setSelectedIncidentTask(null);
      setIsViewModalOpen(true);
    } catch { toast.error("Failed to fetch details"); }
  };

  const handleEditClick = async (id: number) => {
    try {
      const item = await safetyService.getIncident(id);
      setSelectedIncident(item);
      setFormData({
        project_id: item.project_id, task_id: item.task_id || null, date: item.date,
        violation_type: item.violation_type, description: item.description,
        injury_details: item.injury_details || "", action_taken: item.action_taken,
        responsible_person: item.responsible_person,
        safety_checklist_status: item.safety_checklist_status || "pending",
        ppe_compliance: item.ppe_compliance ?? true,
      });
      setIsEditModalOpen(true);
    } catch { toast.error("Failed to fetch details"); }
  };

  const handleDeleteIncident = async () => {
    if (!deleteTargetId) return;
    try {
      await safetyService.deleteIncident(deleteTargetId);
      toast.success("Incident deleted!");
      setIncidentList(prev => prev.filter(i => i.id !== deleteTargetId));
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch { toast.error("Failed to delete incident"); }
  };

  const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  const tabs = [
    { id: "incidents", label: "Safety Checklist" },
    { id: "actions", label: "Incident Report" },
  ];

  const isActions = activeTab === "actions";

  return (
    <>
      <Navbar
        title="Safety Management"
        breadcrumb={["Manager", "Safety", isActions ? "Incident Report" : "Safety Checklist"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isActions ? "Incident Report" : "Safety Checklist"}
              </h1>
              <p className="text-slate-500 text-sm">
                {isActions ? "Verified logs of safety inspections and site compliance." : "Detailed archive of site accidents and response protocols."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFormData(defaultForm()); setIsNewModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              <Plus className="w-4 h-4" />
              {isActions ? "Log Audit Entry" : "Log Safety Checklist"}
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Records", value: stats.total.toString(), sub: "All Time Logs", accent: "text-slate-800", status: "All" },
            { title: "Compliance", value: `${stats.compliance}%`, sub: "Safe Operations", accent: "text-emerald-500", status: "Compliance" },
            { title: "High Risks", value: stats.critical.toString(), sub: "Critical Hazards", accent: "text-rose-500", status: "HighRisk" },
            { title: "Site Safety", value: `${stats.siteSafety}%`, sub: "Safety Movement Score", accent: "text-blue-500", status: "Month" },
          ].map(s => (
            <div key={s.title}
              onClick={() => s.status && setActiveStatFilter(s.status as any)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? "hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20" : "cursor-default"} group ${activeStatFilter === s.status ? "border-primary bg-primary/[0.02]" : ""}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary">{s.title}</p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.id} onClick={() => navigate(`/manager/safety/${t.id}`)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.id ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Incident / Action Registry ── */}
        {!isActions && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by description, person or violation..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-bold" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select value={filterProjectId} onChange={e => setFilterProjectId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id || p.project_id} value={p.id || p.project_id}>
                      {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                    </option>
                  ))}
                </select>
                <select value={filterViolationType} onChange={e => setFilterViolationType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                  <option value="">All Violations</option>
                  {VIOLATION_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterChecklistStatus} onChange={e => setFilterChecklistStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                {activeStatFilter !== "All" && (
                  <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="overflow-auto">
              {isLoading ? (
                <div className="p-20 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing vault...</p>
                </div>
              ) : (
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Project Name</th>
                      <th className="px-6 py-4">Task</th>
                      <th className="px-6 py-4">Incident Summary</th>
                      <th className="px-6 py-4">Violation Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Resources</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedList.length > 0 ? paginatedList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{item.date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-600">{getProjectName(item.project_id)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-400">—</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col max-w-xs">
                            <span className="text-xs font-bold text-slate-700 truncate">{item.description}</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <HeartPulse className="w-3 h-3 text-rose-500" />
                              <span className="truncate">{item.injury_details || "No injuries"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500"}`}>
                            {item.violation_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                            (item.safety_checklist_status || "pending") === "completed"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                          }`}>
                            {item.safety_checklist_status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{item.responsible_person}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">POC: {item.action_taken}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleViewClick(item.id)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditClick(item.id)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setDeleteTargetId(item.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                          No safety records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && filteredList.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Per page:</span>
                  <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-200 rounded-lg text-[11px] px-2 py-1 outline-none bg-white shadow-sm">
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.ceil(filteredList.length / itemsPerPage) }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(filteredList.length / itemsPerPage), currentPage + 2))
                    .map(p => (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${currentPage === p ? "bg-primary text-white border border-primary" : "bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm"}`}>
                        {p}
                      </button>
                    ))}
                  <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredList.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Corrective Actions Tab ── */}
        {isActions && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Resolution Velocity Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Violation Profile</th>
                    <th className="px-6 py-4 text-center">Incident Count</th>
                    <th className="px-6 py-4 text-center">Resolved</th>
                    <th className="px-6 py-4 text-center">Unresolved</th>
                    <th className="px-6 py-4 text-right">Resolution Velocity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.type}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">{row.total}</td>
                      <td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.resolved}</span></td>
                      <td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.unresolved}</span></td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-primary">{row.resolutionRate}</td>
                    </tr>
                  ))}
                  {breakdown.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No incidents reported.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageTransition>

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={isNewModalOpen || isEditModalOpen}
        onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? "Modify Safety Intelligence" : (isActions ? "Record Safety Audit" : "Log Safety Checklist")}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
              disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}>
              {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Create Entry")}
            </button>
          </>
        }
      >
        <form className="space-y-4 p-2" onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Impacted Project <span className="text-rose-500">*</span></label>
              <select name="project_id" value={formData.project_id}
                onChange={(e) => setFormData(p => ({ ...p, project_id: Number(e.target.value) }))}
                className={inputCls}>
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>
                    {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Task (Optional)</label>
              <select name="task_id" value={formData.task_id || ""}
                onChange={e => setFormData(p => ({ ...p, task_id: e.target.value ? Number(e.target.value) : null }))}
                className={inputCls}>
                <option value="">— None —</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date <span className="text-rose-500">*</span></label>
              <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Violation Type <span className="text-rose-500">*</span></label>
              <select name="violation_type" value={formData.violation_type} onChange={handleInputChange} className={inputCls}>
                {VIOLATION_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Responsible Person <span className="text-rose-500">*</span></label>
              <input name="responsible_person" type="text" value={formData.responsible_person}
                onChange={e => setFormData(p => ({ ...p, responsible_person: e.target.value.replace(/[^a-zA-Z\s.'-]/g, "") }))}
                placeholder="Full Name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Checklist Status</label>
              <select name="safety_checklist_status" value={formData.safety_checklist_status} onChange={handleInputChange} className={inputCls}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description <span className="text-rose-500">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} placeholder="Describe the incident..." className={inputCls + " resize-none"} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Action Taken <span className="text-rose-500">*</span></label>
              <textarea name="action_taken" value={formData.action_taken} onChange={handleInputChange} rows={2} placeholder="Corrective action taken..." className={inputCls + " resize-none"} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Injury Details</label>
              <input name="injury_details" type="text" value={formData.injury_details || ""} onChange={handleInputChange} placeholder="e.g. No injury / Minor abrasion" className={inputCls} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="ppe_compliance" id="ppe_compliance" checked={formData.ppe_compliance}
                onChange={handleInputChange} className="w-4 h-4 accent-primary" />
              <label htmlFor="ppe_compliance" className="text-sm font-bold text-slate-700">PPE Compliant</label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── View Modal ── */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Safety Record Details" maxWidth="max-w-lg">
        {selectedIncident && (
          <div className="p-6 space-y-4">
            {[
              ["Date", selectedIncident.date],
              ["Project", getProjectName(selectedIncident.project_id)],
              ["Task", selectedIncidentTask ? (selectedIncidentTask.title || `Task #${selectedIncident.task_id}`) : (selectedIncident.task_id ? `Task #${selectedIncident.task_id}` : "-")],
              ["Violation Type", selectedIncident.violation_type],
              ["Description", selectedIncident.description],
              ["Action Taken", selectedIncident.action_taken],
              ["Responsible Person", selectedIncident.responsible_person],
              ["Injury Details", selectedIncident.injury_details || "No injuries reported"],
              ["PPE Compliance", selectedIncident.ppe_compliance ? "Compliant" : "Missing"],
              ["Checklist Status", selectedIncident.safety_checklist_status || "pending"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-bold text-slate-800 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
        onConfirm={handleDeleteIncident}
        title="Delete Incident"
        message="Are you sure you want to delete this incident? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default ManagerSafetyPage;
