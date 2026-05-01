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
  Filter
} from "lucide-react";

import { labourService } from "../../../services/labourService";
import type { LabourItem } from "../../../types/labour";

const initialFormData = {
    labour_name: "",
    aadhaar_number: "",
    contractor_id: 1,
    skill_type: "Skilled",
    daily_wage_rate: "",
    status: "Active",
    notes: "",
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

    const handleViewDetail = async (labourId: number) => {
        try {
            const data = await labourService.getLabourById(labourId);
            setSelectedLaborer(data);
            setIsDetailModalOpen(true);
        } catch (err) {
            toast.error("Profile retrieval failed");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!labourToDelete) return;
        try {
            setIsDeleting(true);
            await labourService.deleteLabour(labourToDelete);
            toast.success("Worker removed from registry");
            setIsDeleteModalOpen(false);
            fetchLaborers();
        } catch (error) {
            toast.error("Removal failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formMode === "edit" && editId) {
                await labourService.updateLabour(editId, formData as any);
                toast.success("Profile updated");
            } else {
                await labourService.createLabour({ ...formData, project_id: projectId || 1 });
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
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
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
                                        <th className="px-6 py-4 font-inter">Personnel Detail</th>
                                        <th className="px-6 py-4 font-inter">Skill Profile</th>
                                        <th className="px-6 py-4 font-inter">Wage Matrix</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {laborers.map((labor) => (
                                        <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter">{labor.labour_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">ID: {labor.worker_code} • {labor.aadhaar_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-xs font-black text-slate-700 font-inter uppercase tracking-tight">{labor.skill_type} Personnel</span>
                                                    <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">Contractor ID: {labor.contractor_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-black text-slate-800 tabular-nums font-inter">₹{labor.daily_wage_rate}</span>
                                                    <span className="text-[9px] text-emerald-500 font-bold font-inter italic-none uppercase tracking-widest">Base Daily Rate</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${labor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {labor.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button onClick={() => handleViewDetail(labor.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => { setFormMode("edit"); setEditId(labor.id); setFormData({ labour_name: labor.labour_name, aadhaar_number: labor.aadhaar_number, contractor_id: labor.contractor_id, skill_type: labor.skill_type, daily_wage_rate: labor.daily_wage_rate.toString(), status: labor.status, notes: labor.notes || "" }); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
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
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={formMode === 'create' ? 'Register New Personnel' : 'Update Personnel Profile'} maxWidth="max-w-xl">
                <div className="p-8 font-inter text-inter">
                    <form onSubmit={handleSubmit} className="space-y-6 font-inter">
                        <div className="grid grid-cols-1 gap-6 font-inter">
                            <div className="flex flex-col font-inter">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Full Legal Name</label>
                                <input type="text" value={formData.labour_name} onChange={(e) => setFormData({...formData, labour_name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-inter">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Aadhaar ID</label>
                                    <input type="text" value={formData.aadhaar_number} onChange={(e) => setFormData({...formData, aadhaar_number: e.target.value})} placeholder="0000-0000-0000" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Skill Classification</label>
                                    <select value={formData.skill_type} onChange={(e) => setFormData({...formData, skill_type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter">
                                        <option value="Skilled">Skilled</option>
                                        <option value="Semi-Skilled">Semi-Skilled</option>
                                        <option value="Unskilled">Unskilled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-inter">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Daily Wage Rate (₹)</label>
                                    <input type="number" value={formData.daily_wage_rate} onChange={(e) => setFormData({...formData, daily_wage_rate: e.target.value})} placeholder="650" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Employment Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-6 font-inter">
                            <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all font-inter italic-none">Cancel</button>
                            <button type="submit" className="px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter italic-none">
                                {formMode === 'create' ? 'Confirm Registration' : 'Update Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Personnel Profile Insight" maxWidth="max-w-xl">
                {selectedLaborer && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Identity Verified Profile</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedLaborer.labour_name}</h3>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Worker ID</p>
                                        <p className="text-lg font-black font-inter italic-none uppercase">{selectedLaborer.worker_code}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Daily Base</p>
                                        <p className="text-lg font-black font-inter italic-none">₹{selectedLaborer.daily_wage_rate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Compliance Artifacts</p>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Aadhaar Card</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedLaborer.aadhaar_number}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Skill Class</p>
                                        <p className="text-sm font-black text-slate-800 font-inter uppercase">{selectedLaborer.skill_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none">Dismiss Profile Insight</button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Remove Personnel Entry" message="Are you sure you want to delete this labor record?" confirmText="Confirm Deletion" type="danger" isLoading={isDeleting} />
        </>
    );
};

export default LaborDetailsPage;
