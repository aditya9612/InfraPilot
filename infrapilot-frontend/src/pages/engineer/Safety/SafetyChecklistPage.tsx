import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
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
  User,
  ShieldAlert,
  AlertCircle,
  FileText
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import type { SafetyItem, CreateSafetyRequest } from "../../../services/safetyService";

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

    // ─── DATA FETCHING ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await safetyService.listIncidents(36, { 
                violation_type: filterViolationType || undefined 
            });
            setIncidentList(response.items || []);
        } catch (error) {
            console.error("Failed to fetch safety incidents", error);
            toast.error("Failed to load safety records");
        } finally {
            setIsLoading(false);
        }
    }, [filterViolationType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── HANDLERS ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                project_id: 36,
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

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300";

    return (
        <>
            <Navbar title="Safety Management" />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Safety Management</h1>
                        <p className="text-slate-500 text-sm italic-none">Manage safety checklists and incident reports</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Incident
                    </button>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button 
                        className="pb-4 text-sm font-bold text-blue-600 border-b-2 border-blue-600 transition-all"
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

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-72">
                        <div className="pl-3 text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <select 
                            value={filterViolationType}
                            onChange={(e) => setFilterViolationType(e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-medium outline-none pr-4 py-1.5"
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

                {/* ── Incident Cards Grid ─────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100"></div>
                        ))}
                    </div>
                ) : incidentList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {incidentList.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden">
                                {/* Header: Badge + Date */}
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${violationTypeColors[item.violation_type] || 'bg-slate-100 text-slate-600'}`}>
                                        {item.violation_type}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.date}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body: Title (Responsible Person) + Description */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-sm font-bold text-slate-800 italic-none">{item.responsible_person}</h3>
                                    </div>
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 italic-none">
                                        {item.description}
                                    </p>
                                    {item.injury_details && (
                                        <p className="mt-3 text-[11px] text-slate-400 italic italic-none">
                                            Injury: {item.injury_details}
                                        </p>
                                    )}
                                </div>

                                {/* Footer: Action Taken */}
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                        <span className="text-[11px] font-semibold italic-none line-clamp-1">{item.action_taken}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => { setSelectedIncident(item); setIsViewModalOpen(true); }}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(item.id)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(item.id)}
                                            className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 border-dashed">
                        <div className="p-6 bg-slate-50 rounded-full mb-6">
                            <ShieldAlert className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No safety incidents found</h3>
                        <p className="text-slate-500 mb-8">Click + New Incident to add one</p>
                        <button
                            onClick={() => setIsNewModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Incident
                        </button>
                    </div>
                )}
            </PageTransition>

            {/* ── New Incident Modal ─────────────────────────── */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="Log New Safety Incident"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4">
                        <button 
                            onClick={() => setIsNewModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Incident"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                title="Update Safety Incident"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Updating..." : "Update Incident"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                title="Incident Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter">
                        <div className="bg-blue-600 rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight italic-none">{selectedIncident.violation_type}</h3>
                                    <div className="flex items-center gap-2 text-white/70 mt-1 font-bold italic-none">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] uppercase tracking-widest">{selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 px-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsible</p>
                                    <p className="text-sm font-bold text-slate-800 italic-none">{selectedIncident.responsible_person}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-emerald-500 italic-none uppercase tracking-widest">Logged</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                        <AlertCircle className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedIncident.description}
                                </div>
                            </div>

                            {selectedIncident.injury_details && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-rose-50 rounded-lg">
                                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Injury Audit</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 italic-none ml-2">
                                        {selectedIncident.injury_details}
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                                        <FileText className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Taken</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-bold italic-none leading-relaxed">
                                    {selectedIncident.action_taken}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                            <button 
                                onClick={() => setIsViewModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedIncident.id); }}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                            >
                                Edit Incident
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Safety Incident"
                message="Are you sure you want to delete this incident record? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default SafetyChecklistPage;
