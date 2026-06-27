import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import {
    Plus, Search, Eye, Edit2, Trash2, Activity, User,
    ShieldCheck, RotateCcw,
    ChevronLeft, ChevronRight, Download
} from "lucide-react";
import ProjectSelector from "../../components/common/ProjectSelector";
import { qcService } from "../../services/qcService";
import type { QcItem } from "../../services/qcService";

const INSPECTION_TYPES = ["General", "Concrete", "Steel", "Electrical", "Plumbing", "Finishing"];
const TEST_TYPES = ["Visual Check", "Cube Test", "Slump Test", "Load Test", "Compression Test"];

const ManagerQualityPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "inspections";
    const { selectedProjectId, assignedProjects } = useProject();

    // ── Data States ───────────────────────────────────────────────
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── UI States ─────────────────────────────────────────────────
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Failed" | "Momentum">("All");

    // ── Modal States ──────────────────────────────────────────────
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);

    // ── Selection States ──────────────────────────────────────────
    const [selectedQc, setSelectedQc] = useState<QcItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    interface QcFormData {
        project_id: number | "";
        task_id: number | null;
        dsr_id: number | null;
        inspection_type: string;
        test_type: string;
        result: number | "";
        standard_value: number | "";
        status: string;
        engineer_name: string;
        remarks: string;
        report_file: string;
    }

    const [formData, setFormData] = useState<QcFormData>({
        project_id: selectedProjectId || "",
        task_id: null, dsr_id: null,
        inspection_type: "General", test_type: "Visual Check",
        result: "", standard_value: "",
        status: "Pass", engineer_name: "", remarks: "", report_file: ""
    });

    // ── DATA FETCH ────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const res = await qcService.listQc(selectedProjectId);
            const items = (res.items || []).sort((a: QcItem, b: QcItem) => Number(b.id) - Number(a.id));
            setQcList(items);
        } catch {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, filterStatus, activeStatFilter, sortOrder]);

    // ── ACTIONS ───────────────────────────────────────────────────
    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.engineer_name.trim()) { toast.error("Engineer name required"); return; }
        if (formData.result === "") { toast.error("Enter observed value"); return; }
        if (formData.standard_value === "") { toast.error("Enter standard threshold"); return; }

        setIsSubmitting(true);
        try {
            await qcService.createQc({ ...formData, project_id: selectedProjectId || formData.project_id } as any);
            toast.success("QC entry created!");
            setIsNewModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to create QC entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedQc) return;
        setIsSubmitting(true);
        try {
            await qcService.updateQc(selectedQc.id, formData as any);
            toast.success("QC entry updated!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to update");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await qcService.deleteQc(deleteId);
            toast.success("QC entry deleted!");
            setQcList(prev => prev.filter(q => q.id !== deleteId));
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch { toast.error("Failed to delete"); } finally { setIsSubmitting(false); }
    };

    const resetForm = () => setFormData({
        project_id: selectedProjectId || "", task_id: null, dsr_id: null,
        inspection_type: "General", test_type: "Visual Check",
        result: "", standard_value: "", status: "Pass", engineer_name: "", remarks: "", report_file: ""
    });

    const handleViewDetails = async (qc: QcItem) => {
        setViewLoadingId(qc.id);
        try {
            const data = await qcService.getQc(qc.id);
            setSelectedQc(data);
            setIsViewModalOpen(true);
        } catch {
            setSelectedQc(qc);
            setIsViewModalOpen(true);
        } finally { setViewLoadingId(null); }
    };

    const openEdit = (qc: QcItem) => {
        setSelectedQc(qc);
        setFormData({
            project_id: qc.project_id || selectedProjectId || "",
            task_id: qc.task_id, dsr_id: qc.dsr_id,
            inspection_type: qc.inspection_type, test_type: qc.test_type,
            result: qc.result, standard_value: qc.standard_value,
            status: qc.status, engineer_name: qc.engineer_name,
            remarks: qc.remarks || "", report_file: qc.report_file || ""
        });
        setIsEditModalOpen(true);
    };

    // ── COMPUTED ──────────────────────────────────────────────────
    const filteredList = useMemo(() => {
        let data = qcList;
        if (activeStatFilter === "Compliance") data = data.filter(q => q.status === "Pass");
        else if (activeStatFilter === "Failed") data = data.filter(q => q.status === "Fail");

        const term = searchTerm.toLowerCase();
        data = data.filter(q =>
            !term ||
            q.engineer_name.toLowerCase().includes(term) ||
            q.test_type.toLowerCase().includes(term) ||
            q.inspection_type.toLowerCase().includes(term) ||
            q.status.toLowerCase().includes(term) ||
            (q.remarks || "").toLowerCase().includes(term) ||
            String(q.id).includes(term)
        ).filter(q =>
            (filterType === "All" || q.inspection_type?.toLowerCase() === filterType.toLowerCase()) &&
            (filterStatus === "All" || q.status?.toLowerCase() === filterStatus.toLowerCase())
        );

        return data.sort((a, b) => sortOrder === "latest" ? Number(b.id) - Number(a.id) : Number(a.id) - Number(b.id));
    }, [qcList, searchTerm, filterType, filterStatus, activeStatFilter, sortOrder]);

    const breakdown = useMemo(() => {
        const groups: Record<string, { total: number; passed: number; failed: number }> = {};
        filteredList.forEach(q => {
            if (!groups[q.test_type]) groups[q.test_type] = { total: 0, passed: 0, failed: 0 };
            groups[q.test_type].total++;
            if (q.status === "Pass") groups[q.test_type].passed++;
            else groups[q.test_type].failed++;
        });
        return Object.entries(groups).map(([type, d]) => ({ type, ...d, passRate: Math.round((d.passed / d.total) * 100) + "%" }));
    }, [filteredList]);

    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(start, start + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        const total = filteredList.length;
        const passed = filteredList.filter(q => q.status === "Pass").length;
        const failed = filteredList.filter(q => q.status === "Fail").length;
        return {
            total, passed, failed,
            compliance: Math.round((passed / (total || 1)) * 100)
        };
    }, [filteredList]);

    const statusBadge: Record<string, string> = {
        Pass: "bg-emerald-100 text-emerald-600",
        Fail: "bg-rose-100 text-rose-600",
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    const tabs = [
        { id: "inspections", label: "Inspection" },
        { id: "reports", label: "Test Reports" },
    ];

    return (
        <>
            <Navbar
                title="Quality Control (QC)"
                breadcrumb={["Manager", "Quality Control", activeTab === "inspections" ? "Inspection" : "Test Reports"]}
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">QC Inspection Ledger</h1>
                            <p className="text-slate-500 text-sm">Historical record of site inspections and material quality audits.</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <ProjectSelector variant="page" />
                        <div className="flex flex-wrap gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                <Download className="w-4 h-4 text-primary" /> Export
                            </button>
                            <button
                                onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                            >
                                <Plus className="w-4 h-4" /> Log QC Entry
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { title: "Total Audits", value: stats.total.toString(), sub: "Verified Logs", accent: "text-slate-800", status: "All" },
                        { title: "Pass Tests", value: stats.passed.toString(), sub: "Compliance", accent: "text-emerald-500", status: "Compliance" },
                        { title: "Failed Tests", value: stats.failed.toString(), sub: "Non-Compliant", accent: "text-rose-500", status: "Failed" },
                        { title: "Audit Momentum", value: `${stats.compliance}%`, sub: "Overall Pass Percentage", accent: "text-blue-500", status: "Momentum" },
                    ].map(s => (
                        <div key={s.title} onClick={() => setActiveStatFilter(s.status as any)}
                            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20 transition-all group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary">{s.title}</p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Tab Nav ── */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 max-w-full overflow-x-auto scrollbar-none">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => navigate(`/manager/quality/${t.id}`)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.id ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Inspections Tab ── */}
                {activeTab === "inspections" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search by test type or engineer..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-bold" />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                                    <option value="All">All Types</option>
                                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                                    <option value="All">All Status</option>
                                    <option value="Pass">Pass</option>
                                    <option value="Fail">Fail</option>
                                </select>
                                {activeStatFilter !== "All" && (
                                    <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none shadow-sm">
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-auto">
                            {isLoading ? (
                                <div className="p-20 text-center text-slate-400">
                                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Syncing quality logs...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                            <th className="px-6 py-4">Audit Details</th>
                                            <th className="px-6 py-4">Test Description</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Values</th>
                                            <th className="px-6 py-4">Auditor</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedList.length > 0 ? paginatedList.map(qc => (
                                            <tr key={qc.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-800">{qc.inspection_type}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs">
                                                        <span className="text-xs font-bold text-slate-700 truncate">{qc.test_type}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <Activity className="w-3 h-3" />
                                                            <span className="truncate">{qc.remarks || "No remarks"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusBadge[qc.status] || "bg-slate-100 text-slate-500"}`}>
                                                        {qc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] font-bold text-slate-800">Result: {qc.result}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Std: {qc.standard_value}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{qc.engineer_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleViewDetails(qc)} disabled={viewLoadingId === qc.id}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                            {viewLoadingId === qc.id ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={() => openEdit(qc)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => { setDeleteId(qc.id); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                    No quality audits found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {!isLoading && filteredList.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Per page:</span>
                                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] px-2 py-1 outline-none bg-white shadow-sm">
                                        {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length}
                                </p>
                                <div className="flex gap-1.5">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: Math.ceil(filteredList.length / itemsPerPage) }, (_, i) => i + 1).slice(
                                        Math.max(0, currentPage - 3), Math.min(Math.ceil(filteredList.length / itemsPerPage), currentPage + 2)
                                    ).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${currentPage === p ? "bg-primary text-white border border-primary" : "bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm"}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredList.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Test Reports Tab ── */}
                {activeTab === "reports" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Test Protocol Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Test Protocol</th>
                                        <th className="px-6 py-4 text-center">Sample Count</th>
                                        <th className="px-6 py-4 text-center">Compliant</th>
                                        <th className="px-6 py-4 text-center">Non-Compliant</th>
                                        <th className="px-6 py-4 text-right">Pass Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {breakdown.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.type}</td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-600">{row.total}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.passed}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.failed}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-primary">{row.passRate}</td>
                                        </tr>
                                    ))}
                                    {breakdown.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                No test data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* ── Create / Edit Modal ── */}
            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                title={isEditModalOpen ? "Modify QC Inspection" : "Log QC Entry"}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button type="button" onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                            disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="button" onClick={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}>
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Push Changes" : "Create Entry")}
                        </button>
                    </>
                }
            >
                <form className="space-y-6 p-2" onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Target Project <span className="text-rose-500">*</span></label>
                            <select
                                value={formData.project_id}
                                onChange={e => setFormData(p => ({ ...p, project_id: Number(e.target.value) }))}
                                className={inputCls}
                            >
                                <option value="">Select Project</option>
                                {assignedProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Inspection Type <span className="text-rose-500">*</span></label>
                            <select value={formData.inspection_type} onChange={e => setFormData(p => ({ ...p, inspection_type: e.target.value }))} className={inputCls}>
                                {INSPECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Test Type <span className="text-rose-500">*</span></label>
                            <select value={formData.test_type} onChange={e => setFormData(p => ({ ...p, test_type: e.target.value }))} className={inputCls}>
                                {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Observed Result <span className="text-rose-500">*</span></label>
                            <input type="number" value={formData.result} onChange={e => setFormData(p => ({ ...p, result: e.target.value as any }))} placeholder="e.g. 28" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Standard Threshold <span className="text-rose-500">*</span></label>
                            <input type="number" value={formData.standard_value} onChange={e => setFormData(p => ({ ...p, standard_value: e.target.value as any }))} placeholder="e.g. 25" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Status <span className="text-rose-500">*</span></label>
                            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                                <option value="Pass">Pass</option>
                                <option value="Fail">Fail</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Engineer In-Charge <span className="text-rose-500">*</span></label>
                            <input type="text" value={formData.engineer_name} onChange={e => setFormData(p => ({ ...p, engineer_name: e.target.value }))} placeholder="Er. Full Name" className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>Remarks</label>
                            <textarea value={formData.remarks} onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))} placeholder="Additional observations..." rows={3} className={inputCls + " resize-none"} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ── */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="QC Inspection Details" maxWidth="max-w-lg">
                {selectedQc && (
                    <div className="p-6 space-y-4">
                        {[
                            ["Inspection Type", selectedQc.inspection_type],
                            ["Test Type", selectedQc.test_type],
                            ["Status", selectedQc.status],
                            ["Result", String(selectedQc.result)],
                            ["Standard Value", String(selectedQc.standard_value)],
                            ["Engineer", selectedQc.engineer_name],
                            ["Remarks", selectedQc.remarks || "—"],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                                <span className="text-sm font-bold text-slate-800 text-right max-w-[60%]">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* ── Delete Confirm ── */}
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm}
                title="Delete QC Entry" message="This action cannot be undone." confirmText="Delete" type="danger" />
        </>
    );
};

export default ManagerQualityPage;
