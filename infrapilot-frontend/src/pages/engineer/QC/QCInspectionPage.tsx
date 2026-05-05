import { useState, useMemo, useEffect, useCallback } from "react";
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
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { qcService } from "../../../services/qcService";
import type { QcItem, CreateQcRequest } from "../../../services/qcService";

const QCInspectionPage = () => {
    const navigate = useNavigate();
    
    // Core Data States
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI States
    const [activeTab] = useState<"Inspection" | "Test Reports">("Inspection");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterType, setFilterType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Selection States
    const [selectedQc, setSelectedQc] = useState<QcItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    
    // Form States
    const [formData, setFormData] = useState<CreateQcRequest>({
        project_id: 36,
        task_id: null,
        dsr_id: null,
        inspection_type: "General",
        test_type: "Visual Check",
        result: 0,
        standard_value: 0,
        status: "Pass",
        engineer_name: "",
        remarks: ""
    });

    // ─── INITIALIZATION ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await qcService.listQc(36, { 
                status: filterStatus || undefined,
                inspection_type: filterType || undefined
            });
            setQcList(res.items || []);
        } catch (err) {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus, filterType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── ACTIONS ─────────────────────────────────────────────────────────

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Manual Validation
        if (!formData.project_id || !formData.inspection_type || !formData.test_type || 
            formData.result === undefined || formData.result === null || 
            formData.standard_value === undefined || formData.standard_value === null || 
            !formData.status || !formData.engineer_name) {
            toast.error("Please fill all mandatory fields marked with *");
            return;
        }

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

        // Manual Validation
        if (!formData.project_id || !formData.inspection_type || !formData.test_type || 
            formData.result === undefined || formData.result === null || 
            formData.standard_value === undefined || formData.standard_value === null || 
            !formData.status || !formData.engineer_name) {
            toast.error("Please fill all mandatory fields marked with *");
            return;
        }

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
            project_id: 36,
            task_id: null,
            dsr_id: null,
            inspection_type: "General",
            test_type: "Visual Check",
            result: 0,
            standard_value: 0,
            status: "Pass",
            engineer_name: "",
            remarks: ""
        });
    };

    const handleViewDetails = async (id: number) => {
        try {
            const data = await qcService.getQc(id);
            setSelectedQc(data);
            setIsViewModalOpen(true);
        } catch (err) {
            toast.error("Failed to retrieve QC details");
        }
    };

    const openEdit = (qc: QcItem) => {
        setSelectedQc(qc);
        setFormData({
            project_id: 36,
            task_id: qc.task_id,
            dsr_id: qc.dsr_id,
            inspection_type: qc.inspection_type,
            test_type: qc.test_type,
            result: qc.result,
            standard_value: qc.standard_value,
            status: qc.status,
            engineer_name: qc.engineer_name,
            remarks: qc.remarks
        });
        setIsEditModalOpen(true);
    };

    // ─── HELPERS ─────────────────────────────────────────────────────────

    const filteredList = useMemo(() => {
        return qcList.filter(qc => 
            qc.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            qc.engineer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [qcList, searchTerm]);

    const getBadgeColor = (type: string) => {
        switch (type) {
            case "General": return "bg-slate-100 text-slate-600";
            case "Concrete": return "bg-orange-100 text-orange-600";
            case "Steel": return "bg-blue-100 text-blue-600";
            case "Electrical": return "bg-yellow-100 text-yellow-600";
            case "Plumbing": return "bg-cyan-100 text-cyan-600";
            case "Finishing": return "bg-purple-100 text-purple-600";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    // ─── RENDER ──────────────────────────────────────────────────────────

    return (
        <>
            <Navbar title="QC Inspection" breadcrumb={["Engineer", "QC", "Inspection"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quality Control</h1>
                        <p className="text-slate-500 text-sm">Manage inspections and test reports</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Inspection
                    </button>
                </div>

                {/* ── Tab Bar ────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button 
                        onClick={() => navigate("/engineer/qc/inspection")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Inspection" ? "text-primary" : "text-slate-400"}`}
                    >
                        Inspection
                        {activeTab === "Inspection" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button 
                        onClick={() => navigate("/engineer/qc/reports")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Test Reports" ? "text-primary" : "text-slate-400"}`}
                    >
                        Test Reports
                        {activeTab === "Test Reports" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search by Test Type or Engineer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
                        >
                            <option value="">All Types</option>
                            {["General", "Concrete", "Steel", "Electrical", "Plumbing", "Finishing"].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── QC Cards Grid ──────────────────────────────────────── */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing quality logs...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredList.map((qc) => (
                            <div key={qc.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getBadgeColor(qc.inspection_type)}`}>
                                        {qc.inspection_type}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${qc.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {qc.status}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors">{qc.test_type}</h3>
                                <p className="text-slate-500 text-xs mb-4 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    By {qc.engineer_name}
                                </p>

                                <div className="p-4 bg-slate-50 rounded-xl mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observed Result</span>
                                        <span className="text-sm font-black text-slate-800">{qc.result}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Value</span>
                                        <span className="text-sm font-black text-slate-500">{qc.standard_value}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                    <button 
                                        onClick={() => handleViewDetails(qc.id)}
                                        className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => openEdit(qc)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="Modify Entry"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => { setDeleteId(qc.id); setIsDeleteModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Delete Entry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredList.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-400">No QC entries found</h3>
                                <p className="text-slate-400 text-sm">Click + New Inspection to add one</p>
                            </div>
                        )}
                    </div>
                )}
            </PageTransition>

            {/* ── MODALS ────────────────────────────────────────────────── */}

            {/* New / Edit Inspection Modal */}
            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Modify QC Entry" : "New QC Inspection"}
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); isEditModalOpen ? handleUpdateSubmit() : handleCreateSubmit(); }}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing..." : (isEditModalOpen ? "Update Inspection" : "Create Inspection")}
                        </button>
                    </div>
                }
            >
                <div className="space-y-6 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Project ID <span className="text-rose-500">*</span></label>
                            <input 
                                required
                                type="number"
                                value={formData.project_id}
                                onChange={(e) => setFormData({...formData, project_id: Number(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Inspection Type <span className="text-rose-500">*</span></label>
                            <select 
                                required
                                value={formData.inspection_type}
                                onChange={(e) => setFormData({...formData, inspection_type: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                {["General", "Concrete", "Steel", "Electrical", "Plumbing", "Finishing"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Test Protocol <span className="text-rose-500">*</span></label>
                            <select 
                                required
                                value={formData.test_type}
                                onChange={(e) => setFormData({...formData, test_type: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                {["Visual Check", "Cube Test", "Slump Test", "Load Test", "Compression Test"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Final Status <span className="text-rose-500">*</span></label>
                            <select 
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="Pass">Pass</option>
                                <option value="Fail">Fail</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Observed Result <span className="text-rose-500">*</span></label>
                            <input 
                                required
                                type="number"
                                value={formData.result}
                                onChange={(e) => setFormData({...formData, result: Number(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Standard Value <span className="text-rose-500">*</span></label>
                            <input 
                                required
                                type="number"
                                value={formData.standard_value}
                                onChange={(e) => setFormData({...formData, standard_value: Number(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Conducting Engineer <span className="text-rose-500">*</span></label>
                        <input 
                            required
                            type="text"
                            placeholder="Full Name"
                            value={formData.engineer_name}
                            onChange={(e) => setFormData({...formData, engineer_name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Technical Remarks</label>
                        <textarea 
                            rows={3}
                            placeholder="Observations or deviations..."
                            value={formData.remarks || ""}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="QC Intelligence Insight"
                maxWidth="max-w-lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Close</button>
                        <button 
                            onClick={() => { setIsViewModalOpen(false); openEdit(selectedQc!); }}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl"
                        >
                            Edit Entry
                        </button>
                    </div>
                }
            >
                {selectedQc && (
                    <div className="space-y-6 p-1">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedQc.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {selectedQc.status}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getBadgeColor(selectedQc.inspection_type)}`}>
                                    {selectedQc.inspection_type}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Test Protocol</p>
                                <p className="text-sm font-bold text-slate-800">{selectedQc.test_type}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Engineer</p>
                                <p className="text-sm font-bold text-slate-800">{selectedQc.engineer_name}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                                <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Result Matrix</span>
                                <CheckCircle2 className="w-5 h-5 opacity-40" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Observed</p>
                                    <p className="text-2xl font-black">{selectedQc.result}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Standard</p>
                                    <p className="text-2xl font-black opacity-60">{selectedQc.standard_value}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Technical Commentary</p>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl italic text-sm text-slate-600">
                                "{selectedQc.remarks || "No additional technical remarks provided."}"
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Purge QC Entry"
                message="Are you sure you want to delete this QC entry? This action will permanently remove the audit record from the project database."
                confirmText={isSubmitting ? "Purging..." : "Delete Permanently"}
                type="danger"
            />
        </>
    );
};

export default QCInspectionPage;
