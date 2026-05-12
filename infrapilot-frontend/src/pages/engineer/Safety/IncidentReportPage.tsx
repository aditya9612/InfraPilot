import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2,
  Calendar,
  ShieldAlert,
  HeartPulse,
  Filter,
  CheckCircle2,
  Mail,
  Briefcase,
  RotateCcw
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import type { IncidentItem, CreateIncidentRequest } from "../../../services/safetyService";

const violationTypeOptions = [
    "No Helmet",
    "No Safety Harness",
    "Unsafe Equipment Usage",
    "No Safety Shoes",
    "Fire Hazard",
    "Electrical Hazard",
    "Working at Height without Protection",
    "Other"
];

const violationTypeColors: Record<string, string> = {
    "No Helmet": "bg-red-100 text-red-600",
    "No Safety Harness": "bg-orange-100 text-orange-600",
    "Unsafe Equipment Usage": "bg-amber-100 text-amber-600",
    "No Safety Shoes": "bg-yellow-100 text-yellow-600",
    "Fire Hazard": "bg-rose-100 text-rose-600",
    "Electrical Hazard": "bg-purple-100 text-purple-600",
    "Working at Height without Protection": "bg-blue-100 text-blue-600",
    "Other": "bg-slate-100 text-slate-500",
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Selection States
    const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    
    // Filter State
    const [filterViolationType, setFilterViolationType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Month" | "Critical" | "Compliance">("All");
    
    // Form State
    const [formData, setFormData] = useState<CreateIncidentRequest>({
        project_id: 0,
        date: new Date().toISOString().split("T")[0],
        violation_type: "No Helmet",
        description: "",
        injury_details: "",
        action_taken: "",
        responsible_person: "",
        safety_checklist_status: "Completed",
        ppe_compliance: true
    });

    // ─── PROJECT RESOLUTION ─────────────────────────────────────────────
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    const resolvedId = Number(pId);
                    setProjectId(resolvedId);
                    setFormData(prev => ({ ...prev, project_id: resolvedId }));
                } else {
                    setProjectId(36);
                    setFormData(prev => ({ ...prev, project_id: 36 }));
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(36);
            }
        }
    }, []);

    // ─── DATA FETCHING ──────────────────────────────────────────────────

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

    // ─── STATS CALCULATION ──────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = incidents.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthCount = incidents.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        }).length;
        
        const withInjuryCount = incidents.filter(item => 
            item.injury_details && !item.injury_details.toLowerCase().includes("no injury")
        ).length;
        
        return { 
            total, 
            thisMonthCount, 
            critical: withInjuryCount,
            compliance: Math.round(((total - withInjuryCount) / (total || 1)) * 100)
        };
    }, [incidents]);

    const filteredList = useMemo(() => {
        return incidents.filter(item => {
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
    }, [incidents, searchTerm, startDate, endDate, filterViolationType, activeStatFilter]);

    // ─── HANDLERS ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
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
                safety_checklist_status: "Completed",
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
                safety_checklist_status: incident.safety_checklist_status || "Completed",
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

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await safetyService.deleteIncident(deleteId);
            toast.success("Incident deleted successfully!");
            setIncidents(prev => prev.filter(item => item.id !== deleteId));
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete incident");
        }
    };

    // ─── RENDER HELPERS ────────────────────────────────────────────────

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Incident Logs"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
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

                {/* ── Summary Stats ───────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <div onClick={() => setActiveStatFilter("Month")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Month" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Month Activity"
                            value={stats.thisMonthCount.toString()}
                            sub="Current Month"
                            accent="text-blue-500" />
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button 
                        className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                        onClick={() => navigate("/engineer/safety/checklist")}
                    >
                        Safety Checklist
                    </button>
                    <button 
                        className="pb-4 text-sm font-bold text-rose-600 border-b-2 border-rose-600 transition-all"
                        onClick={() => navigate("/engineer/safety/incident")}
                    >
                        Incident Report
                    </button>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
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
                                    {filteredList.length > 0 ? (
                                        filteredList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{item.date}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">LOG-#{item.id}</span>
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
                                                            className="p-2 text-white bg-primary rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(item.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(item.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                </div>
            </PageTransition>

            {/* ── New Incident Modal ─────────────────────────── */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="Log New Incident Report"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 rounded-b-3xl font-inter">
                        <button 
                            onClick={() => setIsNewModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Logging..." : "Submit Report"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                        <div>
                            <label className={labelClasses}>Incident Date <span className="text-rose-500">*</span></label>
                            <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                            <select name="violation_type" value={formData.violation_type} onChange={handleInputChange} className={inputClasses} required>
                                {violationTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Checklist Status <span className="text-rose-500">*</span></label>
                            <select 
                                name="safety_checklist_status" 
                                value={formData.safety_checklist_status} 
                                onChange={handleInputChange} 
                                className={inputClasses}
                                required
                            >
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <input 
                                name="ppe_compliance" 
                                type="checkbox"
                                checked={formData.ppe_compliance} 
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500/20 transition-all cursor-pointer"
                            />
                            <label className="text-xs font-bold text-slate-700 cursor-pointer">PPE Compliance Verified</label>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Incident Description <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Describe the incident details..." className={`${inputClasses} resize-none`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Injury Details <span className="text-rose-500">*</span></label>
                            <textarea name="injury_details" rows={2} value={formData.injury_details} onChange={handleInputChange} placeholder="Describe injuries or enter 'No Injury'..." className={`${inputClasses} resize-none`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Action Taken <span className="text-rose-500">*</span></label>
                            <textarea name="action_taken" rows={2} value={formData.action_taken} onChange={handleInputChange} placeholder="What immediate actions were taken?" className={`${inputClasses} resize-none font-inter`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Responsible Person <span className="text-rose-500">*</span></label>
                            <input name="responsible_person" value={formData.responsible_person} onChange={handleInputChange} placeholder="Enter name" className={inputClasses} required />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Edit Incident Modal ────────────────────────── */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Update Incident Intelligence"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 rounded-b-3xl">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all font-inter">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Updating..." : "Commit Update"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                        <div>
                            <label className={labelClasses}>Incident Date <span className="text-rose-500">*</span></label>
                            <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                            <select name="violation_type" value={formData.violation_type} onChange={handleInputChange} className={inputClasses} required>
                                {violationTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Checklist Status <span className="text-rose-500">*</span></label>
                            <select 
                                name="safety_checklist_status" 
                                value={formData.safety_checklist_status} 
                                onChange={handleInputChange} 
                                className={inputClasses}
                                required
                            >
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <input 
                                name="ppe_compliance" 
                                type="checkbox"
                                checked={formData.ppe_compliance} 
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500/20 transition-all cursor-pointer"
                            />
                            <label className="text-xs font-bold text-slate-700 cursor-pointer">PPE Compliance Verified</label>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Incident Description <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className={`${inputClasses} resize-none`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Injury Details <span className="text-rose-500">*</span></label>
                            <textarea name="injury_details" rows={2} value={formData.injury_details} onChange={handleInputChange} className={`${inputClasses} resize-none`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Action Taken <span className="text-rose-500">*</span></label>
                            <textarea name="action_taken" rows={2} value={formData.action_taken} onChange={handleInputChange} className={`${inputClasses} resize-none`} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Responsible Person <span className="text-rose-500">*</span></label>
                            <input name="responsible_person" value={formData.responsible_person} onChange={handleInputChange} className={inputClasses} required />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── View Detail Modal ──────────────────────────── */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Incident Response Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter">
                        {/* ── Profile Style Header ────────────────── */}
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

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Incident Report"
                message="Are you sure you want to delete this incident record? This action will permanently remove the log from the project vault."
                confirmText="Archive Report"
                type="danger"
            />
        </>
    );
};

export default IncidentReportPage;
