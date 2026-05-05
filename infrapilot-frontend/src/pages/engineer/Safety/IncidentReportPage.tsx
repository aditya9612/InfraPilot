import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FileText,
  Activity,
  Shield,
  HeartPulse,
  Clock
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

const StatCard = ({ title, value, icon, color, subValue }: { title: string, value: string | number, icon: React.ReactNode, color: string, subValue?: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                {icon}
            </div>
            {subValue && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</span>}
        </div>
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
);

const IncidentReportPage = () => {
    const [incidents, setIncidents] = useState<IncidentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
    const [projectId, setProjectId] = useState<number>(1);
    
    // Form State
    const [formData, setFormData] = useState<CreateIncidentRequest>({
        project_id: 1,
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
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    const resolvedId = Number(pId);
                    setProjectId(resolvedId);
                    setFormData(prev => ({ ...prev, project_id: resolvedId }));
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
        
        const noInjuryCount = incidents.filter(item => 
            item.injury_details.toLowerCase().includes("no injury")
        ).length;
        
        const withInjuryCount = total - noInjuryCount;
        
        return { total, thisMonthCount, noInjuryCount, withInjuryCount };
    }, [incidents]);

    // ─── HANDLERS ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await safetyService.createIncident({ ...formData, project_id: projectId });
            toast.success("Incident reported successfully!");
            setIncidents(prev => [response, ...prev]);
            setIsNewModalOpen(false);
            // DO NOT call fetchData() here to preserve the 'Virtual' item in local state
            // as the restricted backend won't return it in the next fetch.
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
            toast.error("Failed to report incident");
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
                injury_details: incident.injury_details,
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
            const response = await safetyService.updateIncident(selectedIncident.id, formData);
            toast.success("Incident updated successfully!");
            setIncidents(prev => prev.map(item => item.id === response.id ? response : item));
            setIsEditModalOpen(false);
            // fetchData();
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
            // fetchData();
        } catch (error) {
            toast.error("Failed to delete incident");
        }
    };

    // ─── RENDER HELPERS ────────────────────────────────────────────────

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-300";

    return (
        <>
            <Navbar title="Safety Management" />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter text-slate-800">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Safety Management</h1>
                        <p className="text-slate-500 text-sm">Track incidents, violations and safety compliance</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Report Incident
                    </button>
                </div>

                {/* ── Stats Row ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Total Incidents" 
                        value={stats.total} 
                        icon={<Activity className="w-5 h-5 text-blue-600" />} 
                        color="bg-blue-50"
                        subValue="All Time"
                    />
                    <StatCard 
                        title="This Month" 
                        value={stats.thisMonthCount} 
                        icon={<Clock className="w-5 h-5 text-amber-600" />} 
                        color="bg-amber-50"
                        subValue={new Date().toLocaleString('default', { month: 'long' })}
                    />
                    <StatCard 
                        title="No Injury" 
                        value={stats.noInjuryCount} 
                        icon={<Shield className="w-5 h-5 text-emerald-600" />} 
                        color="bg-emerald-50"
                        subValue="Compliance"
                    />
                    <StatCard 
                        title="With Injury" 
                        value={stats.withInjuryCount} 
                        icon={<HeartPulse className="w-5 h-5 text-rose-600" />} 
                        color="bg-rose-50"
                        subValue="Critical"
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <select 
                            value={filterViolationType}
                            onChange={(e) => setFilterViolationType(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-full"
                        >
                            <option value="">All Violation Types</option>
                            {violationTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-slate-600 outline-none"
                            />
                        </div>
                        <span className="text-slate-300 text-xs font-bold">TO</span>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-slate-600 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Incident Cards Grid ─────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-white rounded-[2rem] border border-slate-100"></div>
                        ))}
                    </div>
                ) : incidents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {incidents.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${violationTypeColors[item.violation_type] || 'bg-slate-100 text-slate-500'}`}>
                                        {item.violation_type}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.date}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-slate-800 text-sm font-semibold line-clamp-2 leading-relaxed mb-3">
                                        {item.description}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-2">
                                            <HeartPulse className="w-3.5 h-3.5 text-rose-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Injury Status</p>
                                                <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{item.injury_details}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action Taken</p>
                                                <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{item.action_taken}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.responsible_person}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => { setSelectedIncident(item); setIsViewModalOpen(true); }}
                                            className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(item.id)}
                                            className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(item.id)}
                                            className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            title="Delete"
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
                        <div className="p-6 bg-rose-50 rounded-full mb-6">
                            <ShieldAlert className="w-12 h-12 text-rose-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No incidents reported</h3>
                        <p className="text-slate-500 mb-8">Maintain a safe workspace by reporting any violations immediately.</p>
                        <button
                            onClick={() => setIsNewModalOpen(true)}
                            className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Report Incident
                        </button>
                    </div>
                )}
            </PageTransition>

            {/* ── New Incident Modal ─────────────────────────── */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="Report New Incident"
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
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Reporting..." : "Report Incident"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <textarea name="action_taken" rows={2} value={formData.action_taken} onChange={handleInputChange} placeholder="What immediate actions were taken?" className={`${inputClasses} resize-none`} required />
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
                title="Update Incident Report"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 rounded-b-3xl">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Updating..." : "Update Incident"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                title="Incident Details"
                maxWidth="max-w-xl"
                footer={
                    <div className="flex items-center justify-end gap-3 p-4">
                        <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
                            Close
                        </button>
                        <button 
                            onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedIncident!.id); }}
                            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                            Edit
                        </button>
                    </div>
                }
            >
                {selectedIncident && (
                    <div className="p-6 space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${violationTypeColors[selectedIncident.violation_type] || 'bg-white/10 text-white'}`}>
                                        {selectedIncident.violation_type}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{selectedIncident.date}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black tracking-tight mb-2">Safety Violation Logged</h3>
                                <div className="flex items-center gap-2 text-white/60">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold">{selectedIncident.responsible_person}</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[100px] rounded-full" />
                        </div>

                        <div className="grid grid-cols-1 gap-8 px-2">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {selectedIncident.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <HeartPulse className="w-4 h-4 text-rose-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Injury Details</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{selectedIncident.injury_details}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Taken</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{selectedIncident.action_taken}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Confirm Deletion"
                message="Are you sure you want to delete this incident? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default IncidentReportPage;
