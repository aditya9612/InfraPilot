import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search,
  Eye,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  User,
  ShieldAlert,
  Briefcase,
  Mail,
  RotateCcw
} from "lucide-react";

import { qcService } from "../../../services/qcService";
import type { QcItem, CreateQcRequest } from "../../../services/qcService";

const INSPECTION_TYPES = ["General", "Concrete", "Steel", "Electrical", "Plumbing", "Finishing"];
const TEST_TYPES = ["Visual Check", "Cube Test", "Slump Test", "Load Test", "Compression Test"];

const QCInspectionPage = () => {
    const navigate = useNavigate();
    
    // Core Data States
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI States
    const [activeTab] = useState<"Inspection" | "Test Reports">("Inspection");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Failed" | "Momentum">("All");
    
    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Selection States
    const [selectedQc, setSelectedQc] = useState<QcItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);
    
    // Form States
    const [formData, setFormData] = useState<CreateQcRequest>({
        project_id: 0,
        task_id: null,
        dsr_id: null,
        inspection_type: "General",
        test_type: "Visual Check",
        result: 0,
        standard_value: 0,
        status: "Pass",
        engineer_name: "",
        remarks: "",
        report_file: null
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
                    // Fallback to project 1 if none assigned, or handle as error
                    setProjectId(1);
                    setFormData(prev => ({ ...prev, project_id: 1 }));
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(1);
            }
        }
    }, []);

    // ─── INITIALIZATION ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            const res = await qcService.listQc(projectId);
            setQcList(res.items || []);
        } catch (err) {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── ACTIONS ─────────────────────────────────────────────────────────

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        setIsSubmitting(true);
        try {
            await qcService.createQc(formData);
            toast.success("QC inspection created successfully!");
            setIsNewModalOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error("Failed to create QC inspection");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedQc) return;

        setIsSubmitting(true);
        try {
            await qcService.updateQc(selectedQc.id, formData);
            toast.success("QC inspection updated successfully!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update QC inspection");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await qcService.deleteQc(deleteId);
            toast.success("QC entry deleted successfully!");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to delete QC entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            project_id: projectId || 0,
            task_id: null,
            dsr_id: null,
            inspection_type: "General",
            test_type: "Visual Check",
            result: 0,
            standard_value: 0,
            status: "Pass",
            engineer_name: "",
            remarks: "",
            report_file: null
        });
    };

    const handleViewDetails = (qc: QcItem) => {
        setSelectedQc(qc);
        setIsViewModalOpen(true);
    };

    const openEdit = (qc: QcItem) => {
        setSelectedQc(qc);
        setFormData({
            project_id: projectId || 0,
            task_id: qc.task_id,
            dsr_id: qc.dsr_id,
            inspection_type: qc.inspection_type,
            test_type: qc.test_type,
            result: qc.result,
            standard_value: qc.standard_value,
            status: qc.status,
            engineer_name: qc.engineer_name,
            remarks: qc.remarks,
            report_file: null
        });
        setIsEditModalOpen(true);
    };

    // ─── HELPERS ─────────────────────────────────────────────────────────

    const filteredList = useMemo(() => {
        let data = qcList;

        // Apply StatCard Filter
        if (activeStatFilter === "Compliance") {
            data = data.filter(q => q.status === "Pass");
        } else if (activeStatFilter === "Failed") {
            data = data.filter(q => q.status === "Fail");
        }

        return data.filter(q => {
            const matchesSearch = searchTerm === "" || 
                                q.engineer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                q.test_type.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === "All" || q.inspection_type === filterType;
            const matchesStatus = filterStatus === "All" || q.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [qcList, searchTerm, filterType, filterStatus, activeStatFilter]);

    const stats = useMemo(() => {
        const total = qcList.length;
        const passed = qcList.filter(q => q.status === "Pass").length;
        const failed = qcList.filter(q => q.status === "Fail").length;
        return {
            total,
            passed,
            failed,
            compliance: Math.round((passed / (total || 1)) * 100)
        };
    }, [qcList]);

    const statusBadge: Record<string, string> = {
        Pass: "bg-emerald-100 text-emerald-600",
        Fail: "bg-red-100 text-red-600",
    };


    return (
        <>
            <Navbar title="QC Inspection" breadcrumb={["Engineer", "Quality Control", "Inspection Vault"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Quality Control Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Historical record of site inspections and material quality audits.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log QC Entry
                    </button>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Audits"
                            value={stats.total.toString()}
                            sub="Verified Logs"
                            accent="text-slate-800"
                            icon={<FileText className={`w-5 h-5 ${activeStatFilter === "All" ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Compliance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Compliance" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Compliance"
                            value={`${stats.compliance}%`}
                            sub="Pass Rate"
                            accent="text-emerald-500"
                            icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Compliance" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Failed")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Failed" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Failed Tests"
                            value={stats.failed.toString()}
                            sub="Action Required"
                            accent="text-rose-500"
                            icon={<AlertTriangle className={`w-5 h-5 ${activeStatFilter === "Failed" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Momentum")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Momentum" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Audit Momentum"
                            value="98%"
                            sub="Project Efficiency"
                            accent="text-blue-500"
                            icon={<Activity className={`w-5 h-5 ${activeStatFilter === "Momentum" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
                        />
                    </div>
                </div>

                {/* ── Tab Bar ────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button 
                        onClick={() => navigate("/engineer/qc/inspection")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Inspection" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        QC Inspection
                    </button>
                    <button 
                        onClick={() => navigate("/engineer/qc/reports")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Test Reports" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Test Reports
                    </button>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by test type or engineer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-3 font-inter">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters:</span>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
                            >
                                <option value="All">All Types</option>
                                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest"
                            >
                                <option value="All">All Status</option>
                                <option value="Pass">Pass</option>
                                <option value="Fail">Fail</option>
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing quality logs...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Audit Details</th>
                                        <th className="px-6 py-4 font-inter">Test Description</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Values</th>
                                        <th className="px-6 py-4 font-inter">Auditor</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((qc) => (
                                            <tr key={qc.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{qc.inspection_type}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">AUDIT-#{qc.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs font-inter">
                                                        <span className="text-xs font-bold text-slate-700 truncate font-inter">{qc.test_type}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter truncate">
                                                            <Activity className="w-3 h-3" />
                                                            <span className="truncate font-inter italic-none">{qc.remarks || "No additional remarks"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusBadge[qc.status]}`}>
                                                        {qc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col font-inter">
                                                        <p className="text-[10px] font-black text-slate-800 font-inter italic-none">Result: {qc.result}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">Std: {qc.standard_value}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-inter">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <p className="text-[10px] font-black text-slate-800 font-inter uppercase tracking-widest">{qc.engineer_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity font-inter">
                                                        <button
                                                            onClick={() => handleViewDetails(qc)}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(qc)}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteId(qc.id); setIsDeleteModalOpen(true); }}
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
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                                                No quality audits found in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── MODALS ────────────────────────────────────────────────── */}

            {/* New / Edit Modal */}
            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Modify QC Inspection" : "Register New Inspection"}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex justify-end gap-3 px-6 pb-6">
                        <button 
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-inter"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => isEditModalOpen ? handleUpdateSubmit() : handleCreateSubmit()}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Commit Entry")}
                        </button>
                    </div>
                }
            >
                <form className="p-6 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Identification & Protocol</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Inspection Category *</label>
                                <select 
                                    value={formData.inspection_type}
                                    onChange={(e) => setFormData({...formData, inspection_type: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                >
                                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Test Protocol *</label>
                                <select 
                                    value={formData.test_type}
                                    onChange={(e) => setFormData({...formData, test_type: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                >
                                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Conducting Engineer *</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.engineer_name}
                                    onChange={(e) => setFormData({...formData, engineer_name: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Result Matrix</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-inter">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Observed Value *</label>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.result}
                                    onChange={(e) => setFormData({...formData, result: Number(e.target.value)})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Standard Threshold *</label>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.standard_value}
                                    onChange={(e) => setFormData({...formData, standard_value: Number(e.target.value)})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Final Status *</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                >
                                    <option value="Pass">Pass (Compliant)</option>
                                    <option value="Fail">Fail (Non-Compliant)</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 font-inter">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter">Technical Remarks</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Any observations or deviations noticed during the test..."
                                    value={formData.remarks || ""}
                                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-inter"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="QC Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedQc && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${selectedQc.status === 'Pass' ? 'bg-emerald-400' : 'bg-red-400'} border-4 border-white/20 rounded-full animate-pulse`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter italic-none uppercase">{selectedQc.test_type}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedQc.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">qc.audit-#{selectedQc.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">LOGGED BY: {selectedQc.engineer_name}</span>
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Inspection Category</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase">{selectedQc.inspection_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Final Status</p>
                                        <p className={`text-sm font-black font-inter italic-none uppercase tracking-widest ${selectedQc.status === 'Pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {selectedQc.status === 'Pass' ? 'Compliant' : 'Non-Compliant'}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Observed Value</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedQc.result}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Standard Threshold</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedQc.standard_value}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Auditor Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedQc.remarks || "No additional technical remarks provided for this audit."}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
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
                title="Discard QC Audit Entry"
                message="Are you sure you want to delete this QC record? This action will permanently remove the entry from the project ledger."
                confirmText="Archive Record"
                type="danger"
            />
        </>
    );
};

export default QCInspectionPage;
