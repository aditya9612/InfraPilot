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
  Briefcase,
  RotateCcw
} from "lucide-react";

import { safetyService } from "../../../services/safetyService";
import type { IncidentItem as SafetyItem, CreateIncidentRequest as CreateSafetyRequest } from "../../../services/safetyService";

const violationTypeColors: Record<string, string> = {
    "No Helmet": "bg-red-100 text-red-600 border-red-200",
    "Unsafe Equipment Usage": "bg-orange-100 text-orange-600 border-orange-200",
    "No Safety Harness": "bg-yellow-100 text-yellow-600 border-yellow-200",
    "Unsafe Scaffolding": "bg-amber-100 text-amber-600 border-amber-200",
    "Fire Hazard": "bg-rose-100 text-rose-600 border-rose-200",
    "Electrical Hazard": "bg-blue-100 text-blue-600 border-blue-200",
};

const SafetyChecklistPage = () => {
    const navigate = useNavigate();
    const [incidentList, setIncidentList] = useState<SafetyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "HighRisk">("All");

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
        let data = incidentList;

        // Apply StatCard Filter
        if (activeStatFilter === "HighRisk") {
          data = data.filter(i => i.violation_type === "Electrical Hazard" || i.violation_type === "Fire Hazard");
        } else if (activeStatFilter === "Compliance") {
          data = data.filter(i => !i.injury_details || i.injury_details.toLowerCase().includes("no injury"));
        }

        return data.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.violation_type.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesViolationType = !filterViolationType || item.violation_type === filterViolationType;

            return matchesSearch && matchesViolationType;
        });
    }, [incidentList, searchTerm, filterViolationType, activeStatFilter]);

    // ─── HANDLERS ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev: CreateSafetyRequest) => ({ ...prev, [name]: val }));
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
                responsible_person: "",
                safety_checklist_status: "Completed",
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
    const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter";

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Checklist Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Safety Audit Registry</h1>
                        <p className="text-slate-500 text-sm italic-none font-inter">Historical record of safety inspections and site compliance audits.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        Log Audit Entry
                    </button>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-slate-800 bg-slate-100 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Total Audits"
                          value={stats.total.toString()}
                          sub="Verified Logs"
                          accent="text-slate-800"
                          icon={<FileText className={`w-5 h-5 ${activeStatFilter === "All" ? "text-slate-800 scale-110" : "text-slate-400 group-hover:text-slate-800"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Compliance"
                          value={`${stats.compliance}%`}
                          sub="Safe Operations"
                          accent="text-emerald-500"
                          icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Compliance" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("HighRisk")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "HighRisk" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="High Risks"
                          value={stats.critical.toString()}
                          sub="Critical Hazards"
                          accent="text-rose-500"
                          icon={<AlertTriangle className={`w-5 h-5 ${activeStatFilter === "HighRisk" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                      />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Site Safety"
                          value={`${stats.momentum}%`}
                          sub="Safety Momentum"
                          accent="text-blue-500"
                          icon={<Activity className="w-5 h-5 text-blue-500" />}
                      />
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8 font-inter">
                    <button 
                        className="pb-4 text-sm font-black uppercase tracking-widest text-primary border-b-2 border-primary transition-all font-inter"
                        onClick={() => navigate("/engineer/safety/checklist")}
                    >
                        Safety Checklist
                    </button>
                    <button 
                        className="pb-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all font-inter"
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
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                              <Filter className="w-4 h-4 text-slate-400" />
                              <select
                                  value={filterViolationType}
                                  onChange={(e) => setFilterViolationType(e.target.value)}
                                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer font-inter shadow-sm"
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
                            {activeStatFilter !== "All" && (
                              <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing safety vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Audit Identity</th>
                                        <th className="px-6 py-4 font-inter">Observation Summary</th>
                                        <th className="px-6 py-4 font-inter">Violation Profile</th>
                                        <th className="px-6 py-4 font-inter">Safety Officer</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter italic-none">{item.date}</span>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter">AUDIT-#{item.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter italic-none">{item.description}</span>
                                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase tracking-widest font-inter">
                                                            <AlertCircle className="w-3 h-3 text-orange-500" />
                                                            <span className="truncate font-inter italic-none">{item.action_taken}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${violationTypeColors[item.violation_type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                        {item.violation_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex items-center gap-2 font-inter">
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-inter">
                                                          <User className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-700 font-inter italic-none uppercase tracking-widest">{item.responsible_person}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-inter">
                                                    <div className="flex items-center justify-end gap-2 font-inter">
                                                        <button
                                                            onClick={() => handleViewClick(item.id)}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                            title="View Insight"
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
                                                        <button
                                                            onClick={() => handleDeleteClick(item.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                            title="Archive Record"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">
                                                No matching safety records found in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── New / Edit Modal ─────────────────────────── */}
            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Modify Audit Intelligence" : "Commit Safety Audit Entry"}
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button 
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                            className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Commit Entry")}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-6 font-inter">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                        <div className="font-inter">
                            <label className={labelClasses}>Observation Date <span className="text-rose-500">*</span></label>
                            <input 
                                name="date" 
                                type="date" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                                className={inputClasses} 
                            />
                        </div>
                        <div className="font-inter">
                            <label className={labelClasses}>Violation Profile <span className="text-rose-500">*</span></label>
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
                            <div className="font-inter">
                                <label className={labelClasses}>Vault Status <span className="text-rose-500">*</span></label>
                                <select 
                                    name="safety_checklist_status" 
                                    value={formData.safety_checklist_status} 
                                    onChange={handleInputChange} 
                                    className={inputClasses}
                                >
                                    <option value="Completed">Completed</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 pt-6 font-inter">
                                <input 
                                    name="ppe_compliance" 
                                    type="checkbox"
                                    checked={formData.ppe_compliance} 
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer font-inter"
                                />
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-700 cursor-pointer font-inter">PPE Compliance Verified</label>
                            </div>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Incident Narrative <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="description" 
                                rows={3} 
                                value={formData.description} 
                                onChange={handleInputChange} 
                                placeholder="Detail the operational hazard..." 
                                className={`${inputClasses} resize-none font-bold`} 
                            />
                        </div>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Physical Injury Audit (Optional)</label>
                            <textarea 
                                name="injury_details" 
                                rows={2} 
                                value={formData.injury_details || ""} 
                                onChange={handleInputChange} 
                                placeholder="Describe any physical trauma..." 
                                className={`${inputClasses} resize-none font-bold`} 
                            />
                        </div>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Compliance Protocol <span className="text-rose-500">*</span></label>
                            <textarea 
                                name="action_taken" 
                                rows={2} 
                                value={formData.action_taken} 
                                onChange={handleInputChange} 
                                placeholder="What corrective actions were deployed?" 
                                className={`${inputClasses} resize-none font-bold`} 
                            />
                        </div>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Responsible Safety Officer <span className="text-rose-500">*</span></label>
                            <input 
                                name="responsible_person" 
                                value={formData.responsible_person} 
                                onChange={handleInputChange} 
                                placeholder="Enter officer name" 
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
                        <div className={`${selectedIncident.violation_type === 'Electrical Hazard' || selectedIncident.violation_type === 'Fire Hazard' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-primary shadow-primary/20'} rounded-[2.5rem] p-8 mb-8 text-white shadow-2xl relative overflow-hidden font-inter`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-800 rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight italic-none font-inter">{selectedIncident.violation_type}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter">Logged Audit</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter italic-none uppercase tracking-widest">safety.audit-#{selectedIncident.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-black uppercase tracking-widest font-inter">Audit Sequence: {selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Operational Intelligence style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Audit Parameters</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Safety Officer</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase tracking-widest">{selectedIncident.responsible_person}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Vault Status</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none uppercase tracking-widest">Active Audit</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Intelligence ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none tracking-widest">#SFT-{selectedIncident.id}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Trauma Audit</p>
                                        <p className={`text-sm font-black font-inter italic-none uppercase tracking-widest ${selectedIncident.injury_details && !selectedIncident.injury_details.toLowerCase().includes('no') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {selectedIncident.injury_details || "No Trauma Detected"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Work Narrative style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter ml-1">Observation Narrative</p>
                                        <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed font-inter italic-none shadow-inner">
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
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] font-inter">Remediation Protocol</p>
                                </div>
                                <div className="p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 text-xs font-black text-emerald-800 font-inter italic-none leading-relaxed shadow-inner uppercase tracking-widest">
                                    {selectedIncident.action_taken}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 font-inter italic-none mb-2"
                        >
                            Dismiss Audit Intelligence
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Audit Entry"
                message="Are you sure you want to discard this safety intelligence record from the project vault? This action is permanent."
                confirmText="Archive Intelligence"
                type="danger"
            />
        </>
    );
};

export default SafetyChecklistPage;
