import { useState, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  Briefcase,
  Phone,
  Mail,
  FileText
} from "lucide-react";

import { labourService } from "../../../services/labourService";
import type { LabourItem } from "../../../types/labour";

const initialFormData = {
    aadhaar_number: "",
    labour_name: "",
    skill_type: "Skilled",
    daily_wage_rate: "",
    contractor_id: 1,
    status: "Active",
    notes: "",
};

const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join("-") : digits;
};

const formatMobile = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("91")) {
        digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);
    return digits ? `+91 ${digits}` : "";
};

const LaborDetailsPage = () => {
    const [laborers, setLaborers] = useState<LabourItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLaborer, setSelectedLaborer] = useState<LabourItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [labourToDelete, setLabourToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.aadhaar_number.trim()) newErrors.aadhaar_number = "Aadhaar number is required";
        if (formData.aadhaar_number.replace(/-/g, "").length !== 12) newErrors.aadhaar_number = "Aadhaar must be exactly 12 digits";
        
        if (!formData.labour_name.trim()) newErrors.labour_name = "Name is required";
        if (!formData.skill_type.trim()) newErrors.skill_type = "Skill type is required";
        if (!formData.daily_wage_rate || Number(formData.daily_wage_rate) <= 0) 
            newErrors.daily_wage_rate = "Valid wage rate is required";
        if (!formData.contractor_id) newErrors.contractor_id = "Contractor ID is required";
        if (!formData.status.trim()) newErrors.status = "Status is required";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        const user = userStr ? JSON.parse(userStr) : {};
        const pId = user?.project_id || user?.user?.project_id;
        setProjectId(pId ? Number(pId) : 1);
    }, []);

    const fetchLaborers = useCallback(async () => {
        setIsLoading(true);
        const activeProjectId = projectId || 1;
        try {
            const response = await labourService.getLabours(activeProjectId, { 
                limit: 50, 
                offset: 0,
                search: searchTerm,
                status: statusFilter === "All" ? undefined : statusFilter
            });
            setLaborers(response.items || []);
        } catch (error) {
            toast.error("Failed to sync personnel registry");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, searchTerm, statusFilter]);

    useEffect(() => {
        fetchLaborers();
    }, [fetchLaborers]);

    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleViewDetail = async (labourId: number) => {
        setLoadingId(labourId);
        try {
            console.log(`Executing Detail Fetch: GET /labour/${labourId}`);
            const data = await labourService.getLabourById(labourId);
            setSelectedLaborer(data);
            setIsDetailModalOpen(true);
        } catch (err: any) {
            console.error("Detail Fetch Error:", err.response?.data || err.message);
            toast.error("Failed to retrieve profile details");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!labourToDelete) return;
        try {
            setIsDeleting(true);
            console.log(`Executing API Request: DELETE /labour/${labourToDelete}`);
            await labourService.deleteLabour(labourToDelete);
            toast.success("Worker record deleted successfully");
            setIsDeleteModalOpen(false);
            fetchLaborers();
        } catch (error: any) {
            console.error("Delete API Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Record removal failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please correct the errors in the form");
            return;
        }
        try {
            if (formMode === "edit" && editId) {
                // PUT Request Body structure & sequence
                const updatePayload = {
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate).toFixed(2), // as string "900.00"
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                };
                await labourService.updateLabour(editId, updatePayload as any);
                toast.success("Profile updated");
            } else {
                // POST Request Body structure & sequence
                const createPayload = {
                    aadhaar_number: formData.aadhaar_number.replace(/-/g, ""),
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate), // as number 800
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                };
                await labourService.createLabour(createPayload);
                toast.success("Personnel registered");
            }
            setIsFormModalOpen(false);
            fetchLaborers();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const stats = {
        total: laborers.length,
        active: laborers.filter(l => l.status === "Active").length,
        skilled: laborers.filter(l => l.skill_type === "Skilled").length,
    };

    return (
        <>
            <Navbar title="Personnel Registry" breadcrumb={["Engineer", "Workforce", "Detail Directory"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Workforce Personnel Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Centralized database of site workforce, performance metrics and compliance.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setErrors({}); setIsFormModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Personnel
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Personnel Database" value={stats.total.toString()} sub="Total Records" accent="text-slate-800" icon={<Users className="w-5 h-5" />} />
                    <StatCard title="Active Assets" value={stats.active.toString()} sub="Currently Deployed" accent="text-blue-500" icon={<UserCheck className="w-5 h-5" />} />
                    <StatCard title="Technical Skill" value={stats.skilled.toString()} sub="Skilled Laborers" accent="text-emerald-500" icon={<ShieldCheck className="w-5 h-5" />} />
                    <StatCard title="Database Integrity" value="99.4%" sub="System Health" accent="text-indigo-500" icon={<Activity className="w-5 h-5" />} />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by name, ID or Aadhaar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter">
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Parsing Personnel Records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Worker Code</th>
                                        <th className="px-6 py-4 font-inter">Labour Name</th>
                                        <th className="px-6 py-4 font-inter">Aadhaar Number</th>
                                        <th className="px-6 py-4 font-inter">Skill Type</th>
                                        <th className="px-6 py-4 font-inter text-center">Daily Wage Rate</th>
                                        <th className="px-6 py-4 font-inter text-center">Contractor ID</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Notes</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {laborers.map((labor) => (
                                        <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-inter">
                                                    {labor.worker_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{labor.labour_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-500 font-inter">{labor.aadhaar_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-slate-700 font-inter uppercase tracking-tight">{labor.skill_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-slate-800 tabular-nums font-inter italic-none">₹{labor.daily_wage_rate}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-slate-500 font-inter">{labor.contractor_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter ${labor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {labor.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] text-slate-400 font-bold font-inter truncate max-w-[150px]" title={labor.notes}>
                                                    {labor.notes}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button 
                                                        onClick={() => handleViewDetail(labor.id)} 
                                                        disabled={loadingId !== null}
                                                        className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter disabled:opacity-50"
                                                    >
                                                        {loadingId === labor.id ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button onClick={() => { setFormMode("edit"); setEditId(labor.id); setFormData({ aadhaar_number: formatAadhaar(labor.aadhaar_number), labour_name: labor.labour_name, skill_type: labor.skill_type, daily_wage_rate: labor.daily_wage_rate.toString(), contractor_id: labor.contractor_id, status: labor.status, notes: labor.notes || "" }); setErrors({}); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => { setLabourToDelete(labor.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── Form Modal ──────────────────────────────────── */}
            <Modal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                title={formMode === 'create' ? 'Register New Personnel' : 'Update Personnel Profile'} 
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="personnel-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {formMode === 'create' ? 'Confirm Registration' : 'Update Profile'}
                        </button>
                    </>
                }
            >
                <form id="personnel-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Personnel Identity & Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Aadhaar Number <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={formData.aadhaar_number} 
                                    onChange={(e) => setFormData({...formData, aadhaar_number: formatAadhaar(e.target.value)})} 
                                    placeholder="2345-6789-0123" 
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.aadhaar_number ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} 
                                    required 
                                />
                                {errors.aadhaar_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.aadhaar_number}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Labour Name <span className="text-rose-500">*</span></label>
                                <input type="text" value={formData.labour_name} onChange={(e) => setFormData({...formData, labour_name: e.target.value})} placeholder="Suresh Yadav" className={`w-full px-4 py-2.5 bg-white border ${errors.labour_name ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} required />
                                {errors.labour_name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_name}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Skill Type <span className="text-rose-500">*</span></label>
                                <select value={formData.skill_type} onChange={(e) => setFormData({...formData, skill_type: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all">
                                    <option value="Skilled">Skilled</option>
                                    <option value="Unskilled">Unskilled</option>
                                    <option value="Semi-Skilled">Semi-Skilled</option>
                                </select>
                                {errors.skill_type && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.skill_type}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Daily Wage Rate <span className="text-rose-500">*</span></label>
                                <input type="number" value={formData.daily_wage_rate} onChange={(e) => setFormData({...formData, daily_wage_rate: e.target.value})} placeholder="900.00" className={`w-full px-4 py-2.5 bg-white border ${errors.daily_wage_rate ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} required />
                                {errors.daily_wage_rate && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.daily_wage_rate}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contractor ID <span className="text-rose-500">*</span></label>
                                <input type="number" value={formData.contractor_id} onChange={(e) => setFormData({...formData, contractor_id: Number(e.target.value)})} placeholder="1" className={`w-full px-4 py-2.5 bg-white border ${errors.contractor_id ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} required />
                                {errors.contractor_id && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.contractor_id}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status <span className="text-rose-500">*</span></label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.status}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes <span className="text-rose-500">*</span></label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Helper for general site works" className={`w-full px-4 py-2.5 bg-white border ${errors.notes ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all resize-none`} rows={3} required />
                                {errors.notes && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Personnel Profile Insight" maxWidth="max-w-xl">
                {selectedLaborer && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedLaborer.labour_name.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">{selectedLaborer.labour_name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedLaborer.skill_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">worker.{selectedLaborer.worker_code.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">DAILY WAGE: ₹{selectedLaborer.daily_wage_rate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Professional Information</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Worker ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase">{selectedLaborer.worker_code}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Daily Base</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">₹{selectedLaborer.daily_wage_rate}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Aadhaar Reference</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">XXXX-XXXX-{selectedLaborer.aadhaar_number.slice(-4)}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Skill Category</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none">{selectedLaborer.skill_type}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Trail & Logistics</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registration Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">2026-04-10</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Contractor ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">CONT-0{selectedLaborer.contractor_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Deployment Status</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Assigned Site</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">Skyline Tower A</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Attendance Integrity</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">High Consistency</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Profile Insight
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Remove Personnel Entry" message="Are you sure you want to delete this labor record?" confirmText="Confirm Deletion" type="danger" isLoading={isDeleting} />
        </>
    );
};

export default LaborDetailsPage;
