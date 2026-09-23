import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Search,
    Eye,
    Edit2,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    HeartPulse,
    Briefcase,
    Activity,
    Mail
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import { projectService } from "../../../services/projectService";
import type { IncidentItem as SafetyItem, CreateIncidentRequest as CreateSafetyRequest } from "../../../services/safetyService";
import { useProject } from "../../../context/ProjectContext";

const violationTypeColors: Record<string, string> = {
    "No Helmet": "bg-red-100 text-red-600 border-red-200",
    "Unsafe Equipment Usage": "bg-orange-100 text-orange-600 border-orange-200",
    "No Safety Harness": "bg-yellow-100 text-yellow-600 border-yellow-200",
    "Unsafe Scaffolding": "bg-amber-100 text-amber-600 border-amber-200",
    "Fire Hazard": "bg-rose-100 text-rose-600 border-rose-200",
    "Electrical Hazard": "bg-blue-100 text-blue-600 border-blue-200",
};

const VIOLATION_TYPES = [
    "No Helmet",
    "Unsafe Equipment Usage",
    "No Safety Harness",
    "Unsafe Scaffolding",
    "Fire Hazard",
    "Electrical Hazard",
];

const SafetyManagementPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on route
    const activeTab = location.pathname.includes("incident") ? "Incident Report" : "Safety Checklist";

    const [incidentList, setIncidentList] = useState<SafetyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "HighRisk" | "Critical" | "Month">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Selection States
    const [selectedIncident, setSelectedIncident] = useState<SafetyItem | null>(null);

    // Filter State
    const [filterViolationType, setFilterViolationType] = useState("");

    const { selectedProjectId, setSelectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [pageTasks, setPageTasks] = useState<any[]>([]);

    const getProjectName = (projId: number) => {
        const project = projects.find(p => Number(p.id || p.project_id) === Number(projId));
        return project ? (project.name || project.project_name) : `Project #${projId}`;
    };

    // Fetch and cache project when opening view modal (to avoid showing numeric id)
    useEffect(() => {
        if (!isViewModalOpen || !selectedIncident) return;
        const pid = Number(selectedIncident.project_id);
        const found = projects.find(p => Number(p.id || p.project_id) === pid);
        if (found) return;
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
    }, [isViewModalOpen, selectedIncident, projects]);

    const getTaskName = (taskId: number) => {
        if (!taskId) return "-";
        const task = pageTasks.find(t => Number(t.id) === Number(taskId));
        return task ? (task.title || `Task #${taskId}`) : `Task #${taskId}`;
    };

    // Form State
    const [formData, setFormData] = useState<CreateSafetyRequest | any>({
        project_id: 0,
        task_id: 0,
        date: new Date().toISOString().split("T")[0],
        violation_type: "No Helmet",
        description: "",
        injury_details: "",
        action_taken: "",
        responsible_person: "",
        safety_checklist_status: "pending",
        ppe_compliance: true
    });
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);
    const [formFieldErrors, setFormFieldErrors] = useState<Record<string, boolean>>({});
    const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

    // ─── PROJECT RESOLUTION ─────────────────────────────────────────────
    useEffect(() => {
        const initializeProject = async () => {
            try {
                // Fetch all projects for the dropdown
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to fetch projects list", err);
                }

                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId) {
                        const finalPId = Number(pId);
                        setSelectedProjectId(finalPId);
                        setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: finalPId }));
                        return;
                    }
                }
                setSelectedProjectId(0);
                setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: 0 }));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setSelectedProjectId(0);
            }
        };
        initializeProject();
    }, []);

    // Refresh projects list whenever a modal opens
    useEffect(() => {
        if (isNewModalOpen || isEditModalOpen) {
            const fetchProjects = async () => {
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to refresh projects list", err);
                }
            };
            fetchProjects();
        }
    }, [isNewModalOpen, isEditModalOpen]);

    useEffect(() => {
        const fetchProjectTasks = async () => {
            if (!formData.project_id) {
                setTasks([]);
                return;
            }
            try {
                const res = await projectService.getTasks(formData.project_id);
                const tasksList = Array.isArray(res) ? res : (res.items || res.data || []);
                setTasks(tasksList);
            } catch (error) {
                console.error("Failed to fetch project tasks", error);
                setTasks([]);
            }
        };
        fetchProjectTasks();
    }, [formData.project_id]);

    // ─── DATA FETCHING ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await safetyService.listIncidents(projectId, filterViolationType || undefined);
            const items = response.items || [];
            const sortedItems = items.sort((a: SafetyItem, b: SafetyItem) => Number(b.id) - Number(a.id));
            setIncidentList(sortedItems);
        } catch (error) {
            console.error("Failed to fetch safety incidents", error);
            toast.error("Failed to load safety records");
        } finally {
            setIsLoading(false);
        }
    }, [filterViolationType, projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const fetchPageTasks = async () => {
            if (!projectId) return;
            try {
                const res = await projectService.getTasks(projectId);
                const tasksList = Array.isArray(res) ? res : (res.items || res.data || []);
                setPageTasks(tasksList);
            } catch (err) {
                console.error("Failed to fetch page tasks", err);
            }
        };
        fetchPageTasks();
    }, [projectId]);

    const baseFilteredList = useMemo(() => {
        return incidentList.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.violation_type.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesViolationType = !filterViolationType || item.violation_type === filterViolationType;

            return matchesSearch && matchesViolationType;
        });
    }, [incidentList, searchTerm, filterViolationType]);

    // Stats calculation based on tab
    const stats = useMemo(() => {
        const data = baseFilteredList;
        const total = data.length;

        const critical = data.filter(i =>
            i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard"
        ).length;

        const noInjury = data.filter(i => {
            if (!i.injury_details) return true;
            const text = i.injury_details.trim().toLowerCase();
            return text === "" || text.includes("no injury") || text.includes("none") || text.includes("n/a") || text === "-";
        }).length;

        const ppeCompliant = data.filter(i => i.ppe_compliance === true).length;
        const checklistCompleted = data.filter(i => i.safety_checklist_status === "completed").length;

        const ppeRate = total > 0 ? (ppeCompliant / total) * 100 : 100;
        const checklistRate = total > 0 ? (checklistCompleted / total) * 100 : 100;
        const injuryFreeRate = total > 0 ? (noInjury / total) * 100 : 100;

        const siteSafety = Math.round((ppeRate + checklistRate + injuryFreeRate) / 3);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthCount = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        }).length;

        const withInjuryCount = data.filter(item => {
            if (!item.injury_details) return false;
            const text = item.injury_details.trim().toLowerCase();
            return text !== "" && !text.includes("no injury") && !text.includes("none") && !text.includes("n/a") && text !== "-";
        }).length;

        return {
            total,
            critical,
            compliance: Math.round((noInjury / (total || 1)) * 100),
            siteSafety,
            thisMonthCount,
            withInjuryCount
        };
    }, [baseFilteredList]);

    const breakdown = useMemo(() => {
        const groups: Record<string, { total: number; resolved: number; unresolved: number }> = {};

        VIOLATION_TYPES.forEach(type => {
            groups[type] = { total: 0, resolved: 0, unresolved: 0 };
        });

        baseFilteredList.forEach(q => {
            if (!groups[q.violation_type]) {
                groups[q.violation_type] = { total: 0, resolved: 0, unresolved: 0 };
            }
            groups[q.violation_type].total++;
            if (q.safety_checklist_status === "completed") {
                groups[q.violation_type].resolved++;
            } else {
                groups[q.violation_type].unresolved++;
            }
        });

        return Object.entries(groups).map(([type, data]) => ({
            type,
            ...data,
            resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) + "%" : "0%"
        }));
    }, [baseFilteredList]);

    const filteredList = useMemo(() => {
        let data = [...baseFilteredList];

        // Apply StatCard Filter
        if (activeStatFilter === "HighRisk") {
            data = data.filter(i => i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard");
        } else if (activeStatFilter === "Compliance") {
            data = data.filter(i => !i.injury_details || i.injury_details.toLowerCase().includes("no injury"));
        } else if (activeStatFilter === "Critical") {
            data = data.filter(i => !!(i.injury_details && !i.injury_details.toLowerCase().includes("no injury")));
        } else if (activeStatFilter === "Month") {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            data = data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            });
        }

        data.sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });

        return data;
    }, [baseFilteredList, activeStatFilter, sortOrder]);

    const paginatedList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterViolationType, activeStatFilter, sortOrder, activeTab]);

    // Reset stat filter on tab change
    useEffect(() => {
        setActiveStatFilter("All");
    }, [activeTab]);

    // ─── HANDLERS ───────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, [name]: val }));
        // Clear field error on change
        if (formFieldErrors[name]) {
            setFormFieldErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    // Alpha-only handler for responsible_person field
    const handlePersonNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const cleaned = raw.replace(/[^a-zA-Z\s.'-]/g, "");
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, responsible_person: cleaned }));
    };

    const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        setFormNotification(null);
        setFormFieldErrors({});

        // Collect ALL missing mandatory fields at once
        const missingFields: string[] = [];
        const fieldErrors: Record<string, boolean> = {};
        if (!formData.project_id) { missingFields.push('Project'); fieldErrors['project_id'] = true; }
        if (!formData.date) { missingFields.push('Date'); fieldErrors['date'] = true; }
        if (!formData.ppe_compliance) { missingFields.push('PPE Compliance Checked'); fieldErrors['ppe_compliance'] = true; }

        if (missingFields.length > 0) {
            const msg = `Please fill the following mandatory field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`;
            setFormNotification({ type: 'error', message: msg, fields: missingFields });
            setFormFieldErrors(fieldErrors);
            toast.error(msg, { id: 'validation' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Build payload ensuring string defaults for required backend string fields (avoiding 422 validation errors)
            const payload: CreateSafetyRequest = {
                ...formData,
                project_id: Number(formData.project_id) || projectId || 0,
                task_id: formData.task_id ? Number(formData.task_id) : null,
                description: formData.description?.trim() || "No description provided",
                responsible_person: formData.responsible_person?.trim() || "Unassigned",
                injury_details: formData.injury_details?.trim() || "None",
                action_taken: formData.action_taken?.trim() || "None",
                violation_type: formData.violation_type || "No Helmet",
                safety_checklist_status: formData.safety_checklist_status || "pending",
                ppe_compliance: !!formData.ppe_compliance
            };

            const newIncident = await safetyService.createIncident(payload);
            setFormNotification({ type: 'success', message: activeTab === "Incident Report" ? 'Incident reported successfully!' : 'Safety audit saved successfully!' });
            toast.success(activeTab === "Incident Report" ? "Incident reported successfully!" : "Safety audit saved successfully!");
            setIsNewModalOpen(false);
            setFormNotification(null);

            setIncidentList(prev => [newIncident, ...prev]);

            fetchData();
            // Reset form
            setFormData({
                project_id: projectId || 0,
                date: new Date().toISOString().split("T")[0],
                violation_type: "No Helmet",
                description: "",
                injury_details: "",
                action_taken: "",
                responsible_person: "",
                safety_checklist_status: "pending",
                ppe_compliance: true
            });
        } catch (error: any) {
            let errMsg = activeTab === "Incident Report" ? "Failed to report incident" : "Failed to save safety audit";
            const detail = error?.response?.data?.detail;
            if (Array.isArray(detail)) {
                errMsg = detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') + ': ' : ''}${d.msg || d}`).join(' | ');
            } else if (typeof detail === 'string') {
                errMsg = detail;
            } else if (error?.response?.data?.message) {
                errMsg = error.response.data.message;
            } else if (error?.message) {
                errMsg = error.message;
            }
            setFormNotification({ type: 'error', message: errMsg });
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewClick = async (id: number) => {
        try {
            const incident = await safetyService.getIncident(id);
            setSelectedIncident(incident);
            setIsViewModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch details");
        }
    };

    const handleEditClick = async (id: number) => {
        try {
            const incident = await safetyService.getIncident(id);
            setSelectedIncident(incident);
            setFormData({
                project_id: incident.project_id,
                date: incident.date,
                violation_type: incident.violation_type,
                description: incident.description,
                injury_details: incident.injury_details || "",
                action_taken: incident.action_taken,
                responsible_person: incident.responsible_person,
                safety_checklist_status: incident.safety_checklist_status || (activeTab === "Incident Report" ? "pending" : "completed"),
                ppe_compliance: incident.ppe_compliance ?? true
            });
            setIsEditModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch incident details");
        }
    };

    const handleUpdateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        if (!selectedIncident) return;
        setFormNotification(null);
        setFormFieldErrors({});

        // Collect ALL missing mandatory fields at once
        const missingFields: string[] = [];
        const fieldErrors: Record<string, boolean> = {};
        if (!formData.project_id) { missingFields.push('Project'); fieldErrors['project_id'] = true; }
        if (!formData.date) { missingFields.push('Date'); fieldErrors['date'] = true; }
        if (!formData.ppe_compliance) { missingFields.push('PPE Compliance Checked'); fieldErrors['ppe_compliance'] = true; }

        if (missingFields.length > 0) {
            const msg = `Please fill the following mandatory field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`;
            setFormNotification({ type: 'error', message: msg, fields: missingFields });
            setFormFieldErrors(fieldErrors);
            toast.error(msg, { id: 'validation' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateSafetyRequest = {
                ...formData,
                project_id: Number(formData.project_id),
                task_id: formData.task_id ? Number(formData.task_id) : null,
                description: formData.description?.trim() || "No description provided",
                responsible_person: formData.responsible_person?.trim() || "Unassigned",
                injury_details: formData.injury_details?.trim() || "None",
                action_taken: formData.action_taken?.trim() || "None",
                violation_type: formData.violation_type || "No Helmet",
                safety_checklist_status: formData.safety_checklist_status || "pending",
                ppe_compliance: !!formData.ppe_compliance
            };

            await safetyService.updateIncident(selectedIncident.id, payload);
            setFormNotification({ type: 'success', message: 'Safety record updated successfully!' });
            toast.success("Safety record updated successfully!");
            setIsEditModalOpen(false);
            setFormNotification(null);
            fetchData();
        } catch (error: any) {
            let errMsg = "Failed to update safety record";
            const detail = error?.response?.data?.detail;
            if (Array.isArray(detail)) {
                errMsg = detail.map((d: any) => `${d.loc ? d.loc.join(' -> ') + ': ' : ''}${d.msg || d}`).join(' | ');
            } else if (typeof detail === 'string') {
                errMsg = detail;
            } else if (error?.response?.data?.message) {
                errMsg = error.response.data.message;
            } else if (error?.message) {
                errMsg = error.message;
            }
            setFormNotification({ type: 'error', message: errMsg });
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── RENDER HELPERS ─────────────────────────────────────────────────

    const labelClasses = "block text-sm font-bold text-slate-900 mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

    const statCardsData = [
        { title: "Total Audits", value: stats.total.toString(), sub: "Verified Logs", accent: "text-slate-800", status: "All" },
        { title: "Compliance", value: `${stats.compliance}%`, sub: "Safe Operations", accent: "text-emerald-500", status: "Compliance" },
        { title: "High Risks", value: stats.critical?.toString() || "0", sub: "Critical Hazards", accent: "text-rose-500", status: "HighRisk" },
        { title: "Site Safety", value: `${stats.siteSafety || 0}%`, sub: "Safety Momentum", accent: "text-blue-500", status: null }
    ];

    return (
        <>
            {/* ── Top-Right Floating Toast (matches Drawing/Site Evidence style) ─── */}
            {formNotification && (
                <div
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        zIndex: 99999,
                        minWidth: '260px',
                        maxWidth: '380px',
                        animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <style>{`
                        @keyframes slideDownIn {
                            from { opacity: 0; transform: translateY(-16px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    <div
                        className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5 font-inter"
                        style={{
                            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                            border: '1px solid #f1f5f9',
                        }}
                    >
                        {/* Red circle X icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                        }`}>
                            <span className="text-white text-xs font-bold">
                                {formNotification.type === 'error' ? '×' : '✓'}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                            {formNotification.type === 'error'
                                ? `Mandatory fields required: ${(formNotification.fields || []).join(', ')}`
                                : formNotification.message}
                        </p>
                        <button
                            type="button"
                            onClick={() => setFormNotification(null)}
                            className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", activeTab === "Safety Checklist" ? "Checklist Vault" : "Incident Logs"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {activeTab === "Safety Checklist" ? "Safety Audit Registry" : "Incident Response Vault"}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {activeTab === "Safety Checklist"
                                ? "Historical record of safety inspections and site compliance audits."
                                : "Detailed archive of site accidents, injuries, and corrective actions taken."}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    project_id: projectId || 0,
                                    date: new Date().toISOString().split("T")[0],
                                    violation_type: "No Helmet",
                                    description: "",
                                    injury_details: "",
                                    action_taken: "",
                                    responsible_person: "",
                                    safety_checklist_status: "pending",
                                    ppe_compliance: activeTab === "Incident Report" ? true : false
                                });
                                setIsNewModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            {activeTab === "Safety Checklist" ? "Log Audit Entry" : "Log Incident Report"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {statCardsData.map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
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

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 md:mb-8 max-w-full overflow-x-auto scrollbar-none font-inter">
                    <button
                        onClick={() => navigate("/engineer/safety/checklist")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Safety Checklist" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Safety Checklist
                    </button>
                    <button
                        onClick={() => navigate("/engineer/safety/incident")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Incident Report" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Incident Report
                    </button>
                </div>

                {activeTab === "Safety Checklist" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                        {/* Integrated Filter Bar */}
                        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white font-inter w-full">
                            <div className="relative flex-1 max-w-md font-inter">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                    <Search className="w-4 h-4 font-inter" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by description, person or violation..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 font-inter">
                                <select
                                    value={filterViolationType}
                                    onChange={(e) => setFilterViolationType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                >
                                    <option value="">All Violation Types</option>
                                    {VIOLATION_TYPES.map(vt => (
                                        <option key={vt} value={vt}>{vt}</option>
                                    ))}
                                </select>
                                {activeStatFilter !== "All" && (
                                    <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter bg-white border border-slate-200 rounded-xl shadow-sm" title="Clear Stat Filter">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}

                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                            {isLoading ? (
                                <div className="p-20 text-center font-inter">
                                    <div className="inline-block w-8 h-8 border-4 border-t-current rounded-full animate-spin mb-4 font-inter text-primary border-primary/20" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing vault...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left font-inter min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                            <th className="px-6 py-4 font-inter">Incident Details</th>
                                            <th className="px-6 py-4 font-inter">Project Name</th>
                                            <th className="px-6 py-4 font-inter">Task</th>
                                            <th className="px-6 py-4 font-inter">Incident Summary</th>
                                            <th className="px-6 py-4 font-inter">Violation Type</th>
                                            <th className="px-6 py-4 font-inter">Status</th>
                                            <th className="px-6 py-4 font-inter">Resources</th>
                                            <th className="px-6 py-4 text-right font-inter">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-inter">
                                        {paginatedList.length > 0 ? (
                                            paginatedList.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col font-inter">
                                                            <span className="text-sm font-bold text-slate-800 font-inter">{item.date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-semibold text-slate-600 font-inter">
                                                            {getProjectName(item.project_id)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-semibold text-slate-600 font-inter bg-slate-100 px-2.5 py-1 rounded-lg truncate block max-w-[150px]" title={getTaskName((item as any).task_id)}>
                                                            {getTaskName((item as any).task_id)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-xs font-inter">
                                                            <span className="text-xs font-bold text-slate-700 truncate font-inter">{item.description}</span>
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                                <HeartPulse className="w-3 h-3 text-rose-500" />
                                                                <span className="truncate font-inter">{item.injury_details || "No injuries"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500"}`}>
                                                            {item.violation_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${item.safety_checklist_status === 'resolved' || item.safety_checklist_status === 'approved' || item.safety_checklist_status === 'safe' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                                                            item.safety_checklist_status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' :
                                                                item.safety_checklist_status === 'rejected' || item.safety_checklist_status === 'unsafe' ? 'bg-rose-50 text-rose-600 border border-rose-200/50' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {item.safety_checklist_status || "pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col font-inter">
                                                            <p className="text-[10px] font-bold text-slate-800 font-inter uppercase tracking-widest">{item.responsible_person}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter truncate max-w-[150px]">ACTION: {item.action_taken}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-inter">
                                                        <div className="flex items-center justify-end gap-2 font-inter">
                                                            <button
                                                                onClick={() => handleViewClick(item.id)}
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditClick(item.id)}
                                                                className="p-2 text-slate-400 rounded-xl transition-all font-inter hover:text-primary hover:bg-primary/10"
                                                                title="Modify Record"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                    No matching records found in the project vault.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* ── Pagination Controls ─────────────────────────────────── */}
                        {!isLoading && filteredList.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                                {/* Left: Items per page */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Center: Showing info */}
                                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} records
                                </div>

                                {/* Right: Pagination */}
                                <div className="flex flex-wrap justify-center items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {(() => {
                                        const totalItems = filteredList.length;
                                        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                        const pages = [];
                                        if (totalPages <= 5) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                pages.push(1, 2, 3, 4, '...', totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                            }
                                        }

                                        return pages.map((page, index) => {
                                            if (page === '...') {
                                                return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                            }
                                            const pageNum = page;
                                            const isActive = currentPage === pageNum;
                                            return (
                                                <button
                                                    key={`page-${pageNum}`}
                                                    onClick={() => setCurrentPage(pageNum as number)}
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        });
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredList.length / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(filteredList.length / itemsPerPage)) || filteredList.length === 0}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Incident Report" && (
                    <div className="space-y-10 font-inter">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-50 bg-white">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Safety Incident Breakdown</h3>
                            </div>
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-left font-inter">
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
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-800">{row.type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{row.total}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.resolved}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.unresolved}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-primary">{row.resolutionRate}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {breakdown.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                    No safety incidents reported
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>

            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); setFormNotification(null); }}
                title={isEditModalOpen ? (activeTab === "Incident Report" ? "Modify Incident Report" : "Modify Safety Intelligence") : (activeTab === "Incident Report" ? "Log New Incident Report" : "Record New Safety Audit")}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); setFormNotification(null); }}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="audit-form"
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                        >
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Edit Safety" : (activeTab === "Incident Report" ? "Create Report" : "Save Safety Audit"))}
                        </button>
                    </>
                }
            >
                <form id="audit-form" className="space-y-6 p-2 font-inter" onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
                    {/* ── Inline Validation Error Banner (like Drawing/Site Evidence style) ── */}
                    {formNotification && formNotification.type === 'error' && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-red-600">Validation Error</p>
                                <p className="text-xs text-red-500 mt-0.5">
                                    Mandatory fields required: {(formNotification.fields || []).join(', ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormNotification(null)}
                                className="text-red-300 hover:text-red-500 text-base leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {formNotification && formNotification.type === 'success' && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm font-bold text-emerald-700 flex-1">{formNotification.message}</p>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-emerald-300 hover:text-emerald-500 text-base leading-none">×</button>
                        </div>
                    )}
                    {/* Basic Info */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Project <span className="text-red-600">*</span></label>
                                <select
                                    name="project_id"
                                    value={formData.project_id}
                                    onChange={(e) => {
                                        setFormData((prev: any) => ({ ...prev, project_id: Number(e.target.value), task_id: 0 }));
                                        if (formFieldErrors['project_id']) setFormFieldErrors(prev => ({ ...prev, project_id: false }));
                                    }}
                                    className={`${inputClasses}${formFieldErrors['project_id'] ? ' border-red-400 focus:ring-red-200 ring-1 ring-red-400' : (!formData.project_id ? ' border-slate-300' : '')}`}
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                                {formFieldErrors['project_id'] && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-0.5">Required</p>
                                )}
                            </div>
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Task</label>
                                {/* Custom styled dropdown like Pass Task modal */}
                                <div className="relative w-full">
                                    {/* Trigger button */}
                                    <button
                                        type="button"
                                        onClick={() => setTaskDropdownOpen(o => !o)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-xl text-sm font-inter transition-all ${
                                            taskDropdownOpen
                                                ? 'border-2 border-primary ring-4 ring-primary/10'
                                                : 'border border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className={formData.task_id ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                                            {formData.task_id
                                                ? (() => { const t = tasks.find((t: any) => Number(t.id) === Number(formData.task_id)); return t ? (t.title || `Task #${t.id}`) : `Task #${formData.task_id}`; })()
                                                : '-- Select Task --'}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                                taskDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown panel */}
                                    {taskDropdownOpen && (
                                        <div
                                            className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                                        >
                                            {/* Header row */}
                                            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Tasks</span>
                                            </div>
                                            {/* Scrollable list */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {/* Clear option */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setFormData((prev: any) => ({ ...prev, task_id: 0 })); setTaskDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                                        !formData.task_id
                                                            ? 'bg-primary/5 text-primary font-semibold'
                                                            : 'text-slate-400 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    -- Select Task --
                                                </button>
                                                {tasks.length === 0 && (
                                                    <div className="px-4 py-3 text-xs text-slate-400 text-center">No tasks available for this project</div>
                                                )}
                                                {tasks.map((t: any) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => { setFormData((prev: any) => ({ ...prev, task_id: t.id })); setTaskDropdownOpen(false); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                                                            Number(formData.task_id) === Number(t.id)
                                                                ? 'bg-primary/5 text-primary font-semibold'
                                                                : 'text-slate-700 hover:bg-slate-50 font-medium'
                                                        }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0"></span>
                                                        <span className="truncate">{t.title || `Task #${t.id}`}</span>
                                                        {t.status && (
                                                            <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-slate-400 flex-shrink-0">
                                                                {t.status}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Click-outside overlay */}
                                    {taskDropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setTaskDropdownOpen(false)}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Date <span className="text-red-600">*</span></label>
                                <input
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className={`${inputClasses}${formFieldErrors['date'] ? ' border-red-400 ring-1 ring-red-400' : ''}`}
                                />
                                {formFieldErrors['date'] && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-0.5">Required</p>
                                )}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Responsible Person (Optional)</label>
                                <input
                                    name="responsible_person"
                                    value={formData.responsible_person}
                                    onChange={handlePersonNameChange}
                                    placeholder="Enter responsible officer name"
                                    className={`${inputClasses}${/\d/.test(formData.responsible_person) ? " border-rose-400 focus:ring-rose-200" : ""}`}
                                />
                                {/\d/.test(formData.responsible_person) && (
                                    <p className="text-[10px] text-red-600 font-bold mt-1 ml-1">⚠ Only alphabetic characters allowed.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observation Details */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">
                            Observation Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="font-inter">
                                <label className={labelClasses}>Safety Checklist Status <span className="text-red-600">*</span></label>
                                <select
                                    name="safety_checklist_status"
                                    value={formData.safety_checklist_status}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Violation Type (Optional)</label>
                                <select
                                    name="violation_type"
                                    value={formData.violation_type}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    {VIOLATION_TYPES.map(vt => (
                                        <option key={vt} value={vt}>{vt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Description (Optional)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    rows={2}
                                    placeholder="Enter observation description"
                                />
                            </div>

                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Injury Details (Optional)</label>
                                <textarea
                                    name="injury_details"
                                    value={formData.injury_details}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    rows={2}
                                    placeholder="Enter injury details if any"
                                />
                            </div>

                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Action Taken (Optional)</label>
                                <textarea
                                    name="action_taken"
                                    value={formData.action_taken}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    rows={2}
                                    placeholder="Enter action taken"
                                />
                            </div>

                            <div className={`md:col-span-2 font-inter flex flex-col gap-1 mt-2 p-3 rounded-xl border transition-all ${formFieldErrors['ppe_compliance'] ? 'border-red-400 bg-red-50' : 'border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="ppe_compliance"
                                        id="ppe_compliance"
                                        checked={formData.ppe_compliance}
                                        onChange={handleInputChange}
                                        className={`w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer ${formFieldErrors['ppe_compliance'] ? 'border-red-400' : 'border-slate-300'}`}
                                    />
                                    <label htmlFor="ppe_compliance" className="text-sm font-bold text-slate-700 cursor-pointer">
                                        PPE Compliance Checked <span className="text-red-600">*</span>
                                    </label>
                                </div>
                                {formFieldErrors['ppe_compliance'] && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-0.5 ml-7">Required</p>
                                )}
                                {!formFieldErrors['ppe_compliance'] && !formData.ppe_compliance && (
                                    <p className="text-[10px] text-red-500 font-semibold ml-7">Please check PPE compliance before submitting.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Safety Protocol Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter">
                        <div className="bg-primary rounded-xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <span className="text-4xl font-bold font-inter text-center leading-none px-2">{selectedIncident.violation_type.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-slate-800 rounded-full animate-pulse ${selectedIncident.safety_checklist_status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter truncate max-w-[200px]">{selectedIncident.violation_type}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${selectedIncident.safety_checklist_status === 'resolved' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                            {selectedIncident.safety_checklist_status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter uppercase tracking-widest">sfty.ref-#{selectedIncident.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-bold uppercase tracking-widest font-inter">OFFICER: {selectedIncident.responsible_person}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Incident Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Violation Profile</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase truncate" title={selectedIncident.violation_type}>{selectedIncident.violation_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">PPE Compliance</p>
                                        <p className={`text-sm font-bold font-inter uppercase tracking-widest ${selectedIncident.ppe_compliance ? 'text-emerald-500' : 'text-red-600'}`}>
                                            {selectedIncident.ppe_compliance ? 'Compliant' : 'Non-Compliant'}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Date</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{selectedIncident.date}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Project Link</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter truncate" title={getProjectName(selectedIncident.project_id)}>{getProjectName(selectedIncident.project_id)}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Task Link</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter truncate" title={getTaskName(selectedIncident.task_id as number)}>{getTaskName(selectedIncident.task_id as number)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Observation Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Observation Summary</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter">
                                            "{selectedIncident.description || "No narrative provided."}"
                                        </div>
                                    </div>
                                    {selectedIncident.injury_details && (
                                        <div className="font-inter">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Injury Report</p>
                                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-700 leading-relaxed font-inter">
                                                "{selectedIncident.injury_details}"
                                            </div>
                                        </div>
                                    )}
                                    {selectedIncident.action_taken && (
                                        <div className="font-inter">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Corrective Measures</p>
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-700 leading-relaxed font-inter">
                                                "{selectedIncident.action_taken}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter"
                        >
                            Dismiss Audit Insight
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default SafetyManagementPage;
