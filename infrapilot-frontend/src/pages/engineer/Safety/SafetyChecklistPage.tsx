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
  User,
  ShieldAlert,
  AlertCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Filter,
  Mail,
  Briefcase
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import type { IncidentItem as SafetyItem, CreateIncidentRequest as CreateSafetyRequest } from "../../../services/safetyService";

const violationTypeColors: Record<string, string> = {
    "No Helmet": "bg-red-100 text-red-600",
    "Unsafe Equipment Usage": "bg-orange-100 text-orange-600",
    "No Safety Harness": "bg-yellow-100 text-yellow-600",
    "Unsafe Scaffolding": "bg-amber-100 text-amber-600",
    "Fire Hazard": "bg-rose-100 text-rose-600",
    "Electrical Hazard": "bg-blue-100 text-blue-600",
};

const SafetyChecklistPage = () => {
    const navigate = useNavigate();
    const [incidentList, setIncidentList] = useState<SafetyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Selection States
    const [selectedIncident, setSelectedIncident] = useState<SafetyItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    
    // Filter State
    const [filterViolationType, setFilterViolationType] = useState("");
    
    const [projectId, setProjectId] = useState<number>(36);

    // Form State
    const [formData, setFormData] = useState<CreateSafetyRequest>({
        project_id: 36,
        date: new Date().toISOString().split("T")[0],
        violation_type: "No Helmet",
        description: "",
        injury_details: "",
        action_taken: "",
        responsible_person: ""
    });

    // ─── PROJECT RESOLUTION ─────────────────────────────────────────────
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) {
                    const finalPId = Number(pId);
                    setProjectId(finalPId);
                    setFormData((prev: CreateSafetyRequest) => ({ ...prev, project_id: finalPId }));
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    // ─── DATA FETCHING ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await safetyService.listIncidents(projectId, filterViolationType || undefined);
            setIncidentList(response.items || []);
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

    const stats = useMemo(() => {
        const total = incidentList.length;
        const critical = incidentList.filter(i => 
            i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard"
        ).length;
        const noInjury = incidentList.filter(i => !i.injury_details || i.injury_details.toLowerCase().includes("no injury")).length;
        
        return {
            total,
            critical,
            compliance: Math.round((noInjury / (total || 1)) * 100),
            momentum: 98
        };
    }, [incidentList]);

    const filteredList = useMemo(() => {
        return incidentList.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.violation_type.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [incidentList, searchTerm]);

    // ─── HANDLERS ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        if (!formData.date || !formData.violation_type || !formData.description || !formData.action_taken || !formData.responsible_person) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            await safetyService.createIncident(formData);
            toast.success("Safety incident created successfully!");
            setIsNewModalOpen(false);
            fetchData();
            // Reset form
            setFormData({
                project_id: projectId,
                date: new Date().toISOString().split("T")[0],
                violation_type: "No Helmet",
                description: "",
                injury_details: "",
                action_taken: "",
                responsible_person: ""
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
                responsible_person: incident.responsible_person
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

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await safetyService.deleteIncident(deleteId);
            toast.success("Safety incident deleted successfully!");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to delete safety incident");
        }
    };

    // ─── RENDER HELPERS ────────────────────────────────────────────────

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Checklist Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Safety Audit Registry</h1>
                        <p className="text-slate-500 text-sm italic-none">Historical record of safety inspections and site compliance audits.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Audit Entry
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Audits"
                        value={stats.total.toString()}
                        sub="Verified Logs"
                        accent="text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliance"
                        value={`${stats.compliance}%`}
                        sub="Incident-Free Rate"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="High Risks"
                        value={stats.critical.toString()}
                        sub="Critical Hazards"
                        accent="text-rose-500"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Site Safety"
                        value={`${stats.momentum}%`}
                        sub="Safety Momentum"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button 
                        className="pb-4 text-sm font-bold text-primary border-b-2 border-primary transition-all"
                        onClick={() => navigate("/engineer/safety/checklist")}
                    >
                        Safety Checklist
                    </button>
                    <button 
                        className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                        onClick={() => navigate("/engineer/safety/incident")}
                    >
                        Incident Report
                    </button>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by observation, officer or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={filterViolationType}
                                onChange={(e) => setFilterViolationType(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option value="">All Violation Types</option>
                                <option value="No Helmet">No Helmet</option>
                                <option value="Unsafe Equipment Usage">Unsafe Equipment Usage</option>
                                <option value="No Safety Harness">No Safety Harness</option>
                                <option value="Unsafe Scaffolding">Unsafe Scaffolding</option>
                                <option value="Fire Hazard">Fire Hazard</option>
                                <option value="Electrical Hazard">Electrical Hazard</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing safety vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Audit Details</th>
                                        <th className="px-6 py-4 font-inter">Observation Summary</th>
                                        <th className="px-6 py-4 font-inter">Violation Type</th>
                                        <th className="px-6 py-4 font-inter">Safety Officer</th>
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
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">AUDIT-#{item.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter">{item.description}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                            <AlertCircle className="w-3 h-3 text-orange-500" />
                                                            <span className="truncate font-inter italic-none">{item.action_taken}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500"}`}>
                                                        {item.violation_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-inter">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <p className="text-[10px] font-black text-slate-800 font-inter italic-none uppercase tracking-widest">{item.responsible_person}</p>
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
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
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
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                                                No safety records found in the project vault.
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
                title="Log New Safety Audit"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 rounded-b-3xl">
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
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Entry"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                        <div>
                            <label className={labelClasses}>Observation Date <span className="text-rose-500">*</span></label>
                            <input 
                                name="date" 
                                type="date" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                                className={inputClasses} 
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                            <select 
                                name="violation_type" 
                                value={formData.violation_type} 
                                onChange={handleInputChange} 
                                className={inputClasses}
                            >
                                <option value="No Helmet">No Helmet</option>
                                <option value="Unsafe Equipment Usage">Unsafe Equipment Usage</option>
                                <option value="No Safety Harness">No Safety Harness</option>
                                <option value="Unsafe Scaffolding">Unsafe Scaffolding</option>
                                <option value="Fire Hazard">Fire Hazard</option>
                                <option value="Electrical Hazard">Electrical Hazard</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Incident Description <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="description" 
                                rows={3} 
                                value={formData.description} 
                                onChange={handleInputChange} 
                                placeholder="Detail what happened..." 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Injury Details (Optional)</label>
                            <textarea 
                                name="injury_details" 
                                rows={2} 
                                value={formData.injury_details || ""} 
                                onChange={handleInputChange} 
                                placeholder="Describe any injuries sustained..." 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Action Taken <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="action_taken" 
                                rows={2} 
                                value={formData.action_taken} 
                                onChange={handleInputChange} 
                                placeholder="What steps were taken immediately?" 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Responsible Person <span className="text-rose-500">*</span></label>
                            <input 
                                name="responsible_person" 
                                value={formData.responsible_person} 
                                onChange={handleInputChange} 
                                placeholder="Enter name of the responsible individual" 
                                className={inputClasses} 
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Edit Incident Modal ────────────────────────── */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Update Audit Record"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 rounded-b-3xl">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Updating..." : "Push Changes"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                        <div>
                            <label className={labelClasses}>Observation Date <span className="text-rose-500">*</span></label>
                            <input 
                                name="date" 
                                type="date" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                                className={inputClasses} 
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                            <select 
                                name="violation_type" 
                                value={formData.violation_type} 
                                onChange={handleInputChange} 
                                className={inputClasses}
                            >
                                <option value="No Helmet">No Helmet</option>
                                <option value="Unsafe Equipment Usage">Unsafe Equipment Usage</option>
                                <option value="No Safety Harness">No Safety Harness</option>
                                <option value="Unsafe Scaffolding">Unsafe Scaffolding</option>
                                <option value="Fire Hazard">Fire Hazard</option>
                                <option value="Electrical Hazard">Electrical Hazard</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Incident Description <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="description" 
                                rows={3} 
                                value={formData.description} 
                                onChange={handleInputChange} 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Injury Details</label>
                            <textarea 
                                name="injury_details" 
                                rows={2} 
                                value={formData.injury_details || ""} 
                                onChange={handleInputChange} 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Action Taken <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="action_taken" 
                                rows={2} 
                                value={formData.action_taken} 
                                onChange={handleInputChange} 
                                className={`${inputClasses} resize-none`} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Responsible Person <span className="text-rose-500">*</span></label>
                            <input 
                                name="responsible_person" 
                                value={formData.responsible_person} 
                                onChange={handleInputChange} 
                                placeholder="Officer Name" 
                                className={inputClasses} 
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── View Detail Modal ──────────────────────────── */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Safety Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${selectedIncident.violation_type === 'Electrical Hazard' || selectedIncident.violation_type === 'Fire Hazard' ? 'bg-rose-600' : 'bg-primary'} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter italic-none">{selectedIncident.violation_type}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">Logged</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">safety.audit-#{selectedIncident.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">AUDIT DATE: {selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Operational Intelligence style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Site Audit Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Responsible Person</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedIncident.responsible_person}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Status</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none uppercase tracking-widest">Active Archive</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Violation ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">#{selectedIncident.id}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Injury Audit</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedIncident.injury_details && !selectedIncident.injury_details.toLowerCase().includes('no') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {selectedIncident.injury_details || "No Injury"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Work Narrative style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Operational Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Observation Details</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedIncident.description}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logistics style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-emerald-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.15em] font-inter">Compliance Protocol</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-bold font-inter italic-none leading-relaxed">
                                    {selectedIncident.action_taken}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-inter italic-none"
                        >
                            Dismiss Audit Insight
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Audit Entry"
                message="Are you sure you want to delete this safety record? This action will permanently remove the entry from the project ledger."
                confirmText="Archive Record"
                type="danger"
            />
        </>
    );
};

export default SafetyChecklistPage;
