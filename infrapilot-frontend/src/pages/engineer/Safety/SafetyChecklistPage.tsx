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
    User,
    ShieldAlert,
    AlertCircle,
    FileText,
    Filter,
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
import type { IncidentItem as SafetyItem, CreateIncidentRequest as CreateSafetyRequest } from "../../../services/safetyService";

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

const SafetyChecklistPage = () => {
    const navigate = useNavigate();
    const [incidentList, setIncidentList] = useState<SafetyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "HighRisk">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Selection States
    const [selectedIncident, setSelectedIncident] = useState<SafetyItem | null>(null);

    // Filter State
    const [filterViolationType, setFilterViolationType] = useState("");

    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);

    const getProjectName = (projId: number) => {
        const project = projects.find(p => Number(p.id || p.project_id) === Number(projId));
        return project ? (project.name || project.project_name) : `Project #${projId}`;
    };

    // Form State
    const [formData, setFormData] = useState<CreateSafetyRequest>({
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

    // â”€â”€â”€ PROJECT RESOLUTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                        setProjectId(finalPId);
                        setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: finalPId }));
                        return;
                    }
                }
                setProjectId(92);
                setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: 92 }));
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

    const baseFilteredList = useMemo(() => {
        return incidentList.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.violation_type.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesViolationType = !filterViolationType || item.violation_type === filterViolationType;

            return matchesSearch && matchesViolationType;
        });
    }, [incidentList, searchTerm, filterViolationType]);

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

        // Site Safety score: average of PPE compliance, checklist completion, and injury-free rates
        const ppeCompliant = data.filter(i => i.ppe_compliance === true).length;
        const checklistCompleted = data.filter(i => i.safety_checklist_status === "completed").length;

        const ppeRate = total > 0 ? (ppeCompliant / total) * 100 : 100;
        const checklistRate = total > 0 ? (checklistCompleted / total) * 100 : 100;
        const injuryFreeRate = total > 0 ? (noInjury / total) * 100 : 100;

        const siteSafety = Math.round((ppeRate + checklistRate + injuryFreeRate) / 3);

        return {
            total,
            critical,
            compliance: Math.round((noInjury / (total || 1)) * 100),
            siteSafety
        };
    }, [baseFilteredList]);

    const filteredList = useMemo(() => {
        let data = baseFilteredList;

        // Apply StatCard Filter
        if (activeStatFilter === "HighRisk") {
            data = data.filter(i => i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard");
        } else if (activeStatFilter === "Compliance") {
            data = data.filter(i => !i.injury_details || i.injury_details.toLowerCase().includes("no injury"));
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
    }, [searchTerm, filterViolationType, activeStatFilter, sortOrder]);

    // â”€â”€â”€ HANDLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, [name]: val }));
    };

    // Alpha-only handler for responsible_person field
    const handlePersonNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Strip digits entirely — only allow letters, spaces, dots, hyphens
        const cleaned = raw.replace(/[^a-zA-Z\s.'-]/g, "");
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, responsible_person: cleaned }));
    };

    const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        if (!formData.date || !formData.violation_type || !formData.description || !formData.action_taken || !formData.responsible_person) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const newIncident = await safetyService.createIncident(formData);
            toast.success("Safety incident created successfully!");
            setIsNewModalOpen(false);

            // Instantly update UI with the new record
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
        } catch (error) {
            toast.error("Failed to create safety incident");
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
            toast.error("Failed to fetch safety record details");
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
                safety_checklist_status: incident.safety_checklist_status || "completed",
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
            await safetyService.updateIncident(selectedIncident.id, formData);
            toast.success("Safety incident updated successfully!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update safety incident");
        } finally {
            setIsSubmitting(false);
        }
    };


    // â”€â”€â”€ RENDER HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Checklist Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Safety Audit Registry</h1>
                        <p className="text-slate-500 text-sm font-inter">Historical record of safety inspections and site compliance audits.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                project_id: projectId || 92,
                                date: new Date().toISOString().split("T")[0],
                                violation_type: "No Helmet",
                                description: "",
                                injury_details: "",
                                action_taken: "",
                                responsible_person: "",
                                safety_checklist_status: "pending",
                                ppe_compliance: false
                            });
                            setIsNewModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        Log Audit Entry
                    </button>
                </div>

                {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Audits"
                            value={stats.total.toString()}
                            sub="Verified Logs"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Compliance"
                            value={`${stats.compliance}%`}
                            sub="Safe Operations"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("HighRisk")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "HighRisk" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="High Risks"
                            value={stats.critical.toString()}
                            sub="Critical Hazards"
                            accent="text-rose-500" />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                        <StatCard
                            title="Site Safety"
                            value={`${stats.siteSafety}%`}
                            sub="Safety Momentum"
                            accent="text-blue-500" />
                    </div>
                </div>

                {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8 font-inter">
                    <button
                        className="pb-4 text-sm font-bold text-primary border-b-2 border-primary transition-all font-inter"
                        onClick={() => navigate("/engineer/safety/checklist")}
                    >
                        Safety Checklist
                    </button>
                    <button
                        className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all font-inter"
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <Search className="w-4 h-4 font-inter" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by description or officer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={filterViolationType}
                                    onChange={(e) => setFilterViolationType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm"
                                >
                                    <option value="">All Violation Types</option>
                                    {VIOLATION_TYPES.map(vt => (
                                        <option key={vt} value={vt}>{vt}</option>
                                    ))}
                                </select>
                            </div>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
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
                            <div className="p-20 text-center font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing safety vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Audit Identity</th>
                                        <th className="px-6 py-4 font-inter">Project Name</th>
                                        <th className="px-6 py-4 font-inter">Observation Summary</th>
                                        <th className="px-6 py-4 font-inter">Violation Profile</th>
                                        <th className="px-6 py-4 font-inter">Safety Officer</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {paginatedList.length > 0 ? (
                                        paginatedList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{item.date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <span className="text-xs font-semibold text-slate-600 font-inter">
                                                        {getProjectName(item.project_id)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter">{item.description}</span>
                                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest font-inter">
                                                            <AlertCircle className="w-3 h-3 text-orange-500" />
                                                            <span className="truncate font-inter">{item.action_taken}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                        {item.violation_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex items-center gap-2 font-inter">
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-inter">
                                                            <User className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-700 font-inter uppercase tracking-widest">{item.responsible_person}</p>
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
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
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
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                No matching safety records found in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* â”€â”€ Pagination Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                title={isEditModalOpen ? "Modify Safety Intelligence" : "Record New Safety Audit"}
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
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Create Audit Entry")}
                        </button>
                    </>
                }
            >
                <form id="audit-form" className="space-y-6 p-2 font-inter" onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
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
                                    onChange={(e) => setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: Number(e.target.value) }))}
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
                                    {VIOLATION_TYPES.map(vt => (
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
                title="Safety Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter">
                        {/* â”€â”€ Profile Style Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="bg-primary rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-800 rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{selectedIncident.violation_type}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[9px] font-bold uppercase tracking-widest font-inter">Logged Audit</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter uppercase tracking-widest">safety.audit-#{selectedIncident.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-bold uppercase tracking-widest font-inter">Audit Sequence: {selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter mb-8">
                            <div className="font-inter">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Safety Officer</p>
                                <p className="text-sm font-bold text-slate-800 font-inter uppercase tracking-widest">{selectedIncident.responsible_person}</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Vault Status</p>
                                <p className="text-sm font-bold text-emerald-500 font-inter uppercase tracking-widest">Active Audit</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Intelligence ID</p>
                                <p className="text-sm font-bold text-slate-800 font-inter tracking-widest">#SFT-{selectedIncident.id}</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Trauma Audit</p>
                                <p className={`text-sm font-bold font-inter uppercase tracking-widest ${selectedIncident.injury_details && !selectedIncident.injury_details.toLowerCase().includes('no') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {selectedIncident.injury_details || "No Trauma Detected"}
                                </p>
                            </div>
                        </div>

                        {/* Work Narrative style section */}
                        <div className="font-inter">
                            <div className="flex items-center gap-2 mb-6 font-inter">
                                <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                    <Briefcase className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">Audit Parameters</p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 font-inter mb-8">
                                <div className="font-inter">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-inter ml-1">Observation Narrative</p>
                                    <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed font-inter shadow-inner">
                                        "{selectedIncident.description}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics style section */}
                        <div className="font-inter">
                            <div className="flex items-center gap-2 mb-6 font-inter">
                                <div className="p-2 bg-emerald-50 rounded-xl font-inter border border-emerald-100 shadow-sm">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                </div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] font-inter">Remediation Protocol</p>
                            </div>
                            <div className="p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 text-xs font-bold text-emerald-800 font-inter leading-relaxed shadow-inner uppercase tracking-widest">
                                {selectedIncident.action_taken}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 mt-8 bg-primary text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 active:scale-95 font-inter mb-2"
                        >
                            Dismiss Audit Intelligence
                        </button>
                    </div>
                )}
            </Modal>


        </>
    );
};

export default SafetyChecklistPage;
