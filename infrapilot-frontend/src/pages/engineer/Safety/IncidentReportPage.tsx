import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    Eye,
    Edit2,
    Calendar,
    ShieldAlert,
    HeartPulse,
    Filter,
    CheckCircle2,
    Mail,
    Briefcase,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Clock,
    ChevronDown
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import { projectService } from "../../../services/projectService";
import type { IncidentItem, CreateIncidentRequest } from "../../../services/safetyService";

const violationTypeOptions = [
    "No Helmet",
    "Unsafe Equipment Usage",
    "No Safety Harness",
    "Unsafe Scaffolding",
    "Fire Hazard",
    "Electrical Hazard",
];

const violationTypeColors: Record<string, string> = {
    "No Helmet": "bg-red-100 text-red-600",
    "Unsafe Equipment Usage": "bg-amber-100 text-amber-600",
    "No Safety Harness": "bg-orange-100 text-orange-600",
    "Unsafe Scaffolding": "bg-yellow-100 text-yellow-600",
    "Fire Hazard": "bg-rose-100 text-rose-600",
    "Electrical Hazard": "bg-purple-100 text-purple-600",
};

const IncidentReportPage = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<IncidentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Selection States
    const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);

    // Filter State
    const [filterViolationType, setFilterViolationType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Month" | "Critical" | "Compliance">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Form State
    const [formData, setFormData] = useState<CreateIncidentRequest>({
        project_id: 0,
        date: new Date().toISOString().split("T")[0],
        violation_type: "No Helmet",
        description: "",
        injury_details: "",
        action_taken: "",
        responsible_person: "",
        safety_checklist_status: "pending",
        ppe_compliance: true
    });

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
                        const resolvedId = Number(pId);
                        setProjectId(resolvedId);
                        setFormData(prev => ({ ...prev, project_id: resolvedId }));
                        return;
                    }
                }
                setProjectId(92);
                setFormData(prev => ({ ...prev, project_id: 92 }));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
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

    // â”€â”€â”€ DATA FETCHING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await safetyService.listIncidents(projectId, filterViolationType || undefined);
            setIncidents(response.items || []);
        } catch (error) {
            console.error("Failed to fetch safety incidents", error);
            toast.error("Failed to load incident reports");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, filterViolationType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // â”€â”€â”€ STATS CALCULATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const stats = useMemo(() => {
        const data = incidents;
        const total = data.length;
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
            thisMonthCount,
            critical: withInjuryCount,
            compliance: Math.round(((total - withInjuryCount) / (total || 1)) * 100)
        };
    }, [incidents]);

    const filteredList = useMemo(() => {
        let data = incidents.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.violation_type.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesViolationType = !filterViolationType || item.violation_type === filterViolationType;

            let matchesDate = true;
            if (startDate && item.date < startDate) matchesDate = false;
            if (endDate && item.date > endDate) matchesDate = false;

            // Apply StatCard Filter
            let matchesStat = true;
            if (activeStatFilter === "Month") {
                const itemDate = new Date(item.date);
                matchesStat = itemDate.getMonth() === new Date().getMonth() && itemDate.getFullYear() === new Date().getFullYear();
            } else if (activeStatFilter === "Critical") {
                matchesStat = !!(item.injury_details && !item.injury_details.toLowerCase().includes("no injury"));
            } else if (activeStatFilter === "Compliance") {
                matchesStat = !item.injury_details || item.injury_details.toLowerCase().includes("no injury");
            }

            return matchesSearch && matchesViolationType && matchesDate && matchesStat;
        });

        data.sort((a: any, b: any) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });

        return data;
    }, [incidents, searchTerm, startDate, endDate, filterViolationType, activeStatFilter, sortOrder]);

    const paginatedList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, filterViolationType, activeStatFilter, sortOrder]);

    // â”€â”€â”€ HANDLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Alpha-only handler for responsible_person field
    const handlePersonNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Strip digits — only allow letters, spaces, dots, hyphens, apostrophes
        const cleaned = raw.replace(/[^a-zA-Z\s.'-]/g, "");
        setFormData(prev => ({ ...prev, responsible_person: cleaned }));
    };

    const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await safetyService.createIncident({ ...formData, project_id: projectId || 0 });
            toast.success("Incident reported successfully!");
            setIncidents(prev => [response, ...prev]);
            setIsNewModalOpen(false);
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
        } catch (error) {
            toast.error("Failed to report incident");
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
            toast.error("Failed to fetch incident details");
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
                injury_details: incident.injury_details,
                action_taken: incident.action_taken,
                responsible_person: incident.responsible_person,
                safety_checklist_status: incident.safety_checklist_status || "pending",
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

        setIsSubmitting(true);
        try {
            const response = await safetyService.updateIncident(selectedIncident.id, formData);
            toast.success("Incident updated successfully!");
            setIncidents(prev => prev.map(item => item.id === response.id ? response : item));
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error("Failed to update incident");
        } finally {
            setIsSubmitting(false);
        }
    };



    // â”€â”€â”€ RENDER HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Incident Logs"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Response Vault</h1>
                        <p className="text-slate-500 text-sm">Detailed archive of site accidents, injuries, and corrective actions taken.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Incident Report
                    </button>
                </div>

                {/* â”€â”€ Summary Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Reports"
                            value={stats.total.toString()}
                            sub="Incident Archives"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Compliance"
                            value={`${stats.compliance}%`}
                            sub="Incident-Free Rate"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Critical")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Critical" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Critical"
                            value={stats.critical.toString()}
                            sub="Injury Incidents"
                            accent="text-rose-500" />
                    </div>
                </div>

                {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button
                        className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all font-inter"
                        onClick={() => navigate("/engineer/safety/checklist")}
                    >
                        Safety Checklist
                    </button>
                    <button
                        className="pb-4 text-sm font-bold text-rose-600 border-b-2 border-rose-600 transition-all font-inter"
                        onClick={() => navigate("/engineer/safety/incident")}
                    >
                        Incident Report
                    </button>
                </div>

                {/* â”€â”€ Registry Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    {/* Integrated Filter Bar */}
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by description, person or violation..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-600 outline-none font-inter"
                                />
                                <span className="text-[10px] font-bold text-slate-300 uppercase font-inter">TO</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-600 outline-none font-inter"
                                />
                            </div>
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={filterViolationType}
                                    onChange={(e) => setFilterViolationType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                                >
                                    <option value="">All Types</option>
                                    {violationTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            {activeStatFilter !== "All" && (
                                <button
                                    onClick={() => setActiveStatFilter("All")}
                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Clear Stat Filter"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}

                            <div className="relative flex items-center font-inter">
                                <div className="absolute left-3 text-slate-400 pointer-events-none">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                    className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <div className="absolute right-3 text-slate-400 pointer-events-none">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing incident vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Incident Details</th>
                                        <th className="px-6 py-4 font-inter">Incident Summary</th>
                                        <th className="px-6 py-4 font-inter">Violation Type</th>
                                        <th className="px-6 py-4 font-inter">Resources</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {paginatedList.length > 0 ? (
                                        paginatedList.map((item: IncidentItem) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{item.date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter">{item.description}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                            <HeartPulse className="w-3 h-3 text-rose-500" />
                                                            <span className="truncate font-inter">{item.injury_details}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500"}`}>
                                                        {item.violation_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-[10px] font-bold text-slate-800 font-inter uppercase tracking-widest">{item.responsible_person}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter truncate max-w-[150px]">ACTION: {item.action_taken}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity font-inter">
                                                        <button
                                                            onClick={() => handleViewClick(item.id)}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(item.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-inter">
                                                No incident reports found in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* ———————————————————————————————— */}
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
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                                    isActive 
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
            </PageTransition>

            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Modify Incident Report" : "Log New Incident Report"}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button 
                            type="button"
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                        >
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Create Report")}
                        </button>
                    </>
                }
            >
                <form id="incident-form" className="space-y-6 p-2 font-inter" onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
                    {/* Basic Info */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                                <select
                                    name="project_id"
                                    value={formData.project_id}
                                    onChange={(e) => setFormData((prev: CreateIncidentRequest) => ({ ...prev, project_id: Number(e.target.value) }))}
                                    className={inputClasses}
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Date <span className="text-rose-500">*</span></label>
                                <input
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Responsible Person <span className="text-rose-500">*</span></label>
                                <input
                                    name="responsible_person"
                                    value={formData.responsible_person}
                                    onChange={handlePersonNameChange}
                                    placeholder="Enter responsible officer name"
                                    className={`${inputClasses}${/\d/.test(formData.responsible_person) ? " border-rose-400 focus:ring-rose-200" : ""}`}
                                />
                                {/\d/.test(formData.responsible_person) && (
                                    <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">⚠ Only alphabetic characters allowed.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observation Details */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
                            Observation Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="font-inter">
                                <label className={labelClasses}>Safety Checklist Status <span className="text-rose-500">*</span></label>
                                <select
                                    name="safety_checklist_status"
                                    value={formData.safety_checklist_status}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                                <select
                                    name="violation_type"
                                    value={formData.violation_type}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    {violationTypeOptions.map(vt => (
                                        <option key={vt} value={vt}>{vt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3 pt-2 pb-2 font-inter">
                                <input
                                    name="ppe_compliance"
                                    type="checkbox"
                                    checked={formData.ppe_compliance}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer font-inter"
                                />
                                <label className="text-sm font-bold text-slate-700 cursor-pointer font-inter">PPE Compliance Verified</label>
                            </div>
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Description <span className="text-rose-500">*</span></label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the safety observation or incident..."
                                    className={`${inputClasses} resize-none`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resolution & Impact */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
                            Resolution & Impact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Injury Details (Optional)</label>
                                <textarea
                                    name="injury_details"
                                    rows={2}
                                    value={formData.injury_details || ""}
                                    onChange={handleInputChange}
                                    placeholder="Describe any physical injuries..."
                                    className={`${inputClasses} resize-none`}
                                />
                            </div>
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Action Taken <span className="text-rose-500">*</span></label>
                                <textarea
                                    name="action_taken"
                                    rows={2}
                                    value={formData.action_taken}
                                    onChange={handleInputChange}
                                    placeholder="What corrective actions were taken?"
                                    className={`${inputClasses} resize-none`}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* â”€â”€ View Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Incident Response Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter">
                        {/* â”€â”€ Profile Style Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{selectedIncident.violation_type}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">Verified</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter">incident.log-#{selectedIncident.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">INCIDENT DATE: {selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8 pt-8 border-t border-white/10 font-inter">
                                <div className="font-inter">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1.5 font-inter">Reporting Officer</p>
                                    <p className="text-sm font-bold text-white font-inter">{selectedIncident.responsible_person}</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1.5 font-inter">Status</p>
                                    <p className="text-sm font-bold text-white font-inter uppercase tracking-widest">Active Report</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1.5 font-inter">Log ID</p>
                                    <p className="text-sm font-bold text-white font-inter">#{selectedIncident.id}</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1.5 font-inter">Injury Severity</p>
                                    <p className={`text-sm font-bold font-inter ${selectedIncident.injury_details && !selectedIncident.injury_details.toLowerCase().includes('no') ? 'text-rose-200' : 'text-emerald-200'}`}>
                                        {selectedIncident.injury_details || "No Injury"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Incident Narrative */}
                        <div className="mb-8 font-inter">
                            <div className="flex items-center gap-2 mb-6 font-inter">
                                <div className="p-2 bg-rose-50 rounded-lg font-inter">
                                    <Briefcase className="w-4 h-4 text-rose-600" />
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Incident Intelligence</p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 font-inter">
                                <div className="font-inter">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Detailed Description</p>
                                    <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 text-sm text-slate-600 leading-relaxed font-inter">
                                        "{selectedIncident.description}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Corrective Action */}
                        <div className="mb-8 font-inter">
                            <div className="flex items-center gap-2 mb-6 font-inter">
                                <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-[11px] font-bold text-primary uppercase tracking-[0.15em] font-inter">Corrective Action</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-primary font-bold font-inter leading-relaxed">
                                {selectedIncident.action_taken}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Response Insight
                        </button>
                    </div>
                )}
            </Modal>


        </>
    );
};

export default IncidentReportPage;
