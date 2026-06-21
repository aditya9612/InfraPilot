import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    Activity,
    User,
    Briefcase,
    Mail,
    RotateCcw,
    CheckCircle2,
    Image as ImageIcon,
    Camera,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { qcService } from "../../../services/qcService";
import { projectService } from "../../../services/projectService";
import { settingsService } from "../../../services/settingsService";
import { dsrService } from "../../../services/dsrService";
import type { QcItem } from "../../../services/qcService";

const INSPECTION_TYPES = ["General", "Concrete", "Steel", "Electrical", "Plumbing", "Finishing"];
const TEST_TYPES = ["Visual Check", "Cube Test", "Slump Test", "Load Test", "Compression Test"];

const QCInspectionPage = () => {
    const navigate = useNavigate();

    // Core Data States
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI States
    const location = useLocation();
    const activeTab = location.pathname.includes("reports") ? "Test Reports" : "Inspection";
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Compliance" | "Failed" | "Momentum">("All");

    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);
    const [, setSelectedFile] = useState<File | null>(null);

    // Selection States
    const [selectedQc, setSelectedQc] = useState<QcItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [dsrs, setDsrs] = useState<any[]>([]);

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

    // Form States
    const [formData, setFormData] = useState<QcFormData>({
        project_id: 92,
        task_id: null,
        dsr_id: null,
        inspection_type: "General",
        test_type: "Visual Check",
        result: "",
        standard_value: "",
        status: "Pass",
        engineer_name: "",
        remarks: "",
        report_file: ""
    });

    // â”€â”€â”€ PROJECT RESOLUTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const initializeProject = async () => {
            try {
                // Fetch all projects for the dropdown
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to fetch projects list", err);
                }

                let finalProjectId: number | null = null;
                
                // Try fetching from backend settings first (ultimate source of truth)
                try {
                    const settings = await settingsService.getSettings();
                    if (settings && settings.default_project_id) {
                        finalProjectId = Number(settings.default_project_id);
                    }
                } catch (e) {
                    console.warn("Could not fetch settings, falling back to local storage", e);
                }

                // Fallback to local storage if API fails or doesn't have it
                if (!finalProjectId) {
                    const userStr = localStorage.getItem("infrapilot_user");
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            const pId = user?.default_project_id || user?.project_id || user?.user?.project_id;
                            if (pId) {
                                finalProjectId = Number(pId);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }

                if (finalProjectId) {
                    setProjectId(finalProjectId);
                    
                    // Attempt to get user name for default form data
                    const userStr = localStorage.getItem("infrapilot_user");
                    let eName = "";
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            eName = user.full_name || user.username || "";
                        } catch(e) {}
                    }
                    
                    setFormData(prev => ({ ...prev, project_id: finalProjectId as number, engineer_name: eName }));
                    return;
                }

                setProjectId(92);
                setFormData(prev => ({ ...prev, project_id: 92 }));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
                setFormData(prev => ({ ...prev, project_id: 92 }));
            }
        };
        initializeProject();

        window.addEventListener('storage', initializeProject);
        return () => window.removeEventListener('storage', initializeProject);
    }, []);

    useEffect(() => {
        if (isNewModalOpen || isEditModalOpen) {
            const fetchProjects = async () => {
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to refresh projects list", err);
                }
            };
            fetchProjects();
        }
    }, [isNewModalOpen, isEditModalOpen]);

    useEffect(() => {
        const fetchProjectRelatedData = async () => {
            if (!formData.project_id) {
                setTasks([]);
                setDsrs([]);
                return;
            }
            try {
                const [tasksData, dsrsData] = await Promise.all([
                    projectService.getTasks(Number(formData.project_id)).catch(() => []),
                    dsrService.getDsrByProject(Number(formData.project_id)).catch(() => ({ items: [] }))
                ]);
                
                const taskItems = Array.isArray(tasksData) ? tasksData : (tasksData.items || tasksData.data || []);
                const dsrItems = dsrsData?.items || (Array.isArray(dsrsData) ? dsrsData : []);
                
                setTasks(taskItems);
                setDsrs(dsrItems);
            } catch (err) {
                console.error("Failed to load project tasks or DSRs", err);
            }
        };
        fetchProjectRelatedData();
    }, [formData.project_id]);

    // â”€â”€â”€ INITIALIZATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const fetchData = useCallback(async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            const res = await qcService.listQc(projectId);
            const items = Array.isArray(res) ? res : (res.items || (res as any).data || []);
            const sortedItems = items.sort((a: QcItem, b: QcItem) => Number(b.id) - Number(a.id));
            setQcList(sortedItems);
        } catch (err) {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterStatus, activeStatFilter, sortOrder]);

    // â”€â”€â”€ ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.engineer_name.trim()) {
            toast.error("Please enter the Engineer In-Charge name");
            return;
        }

        if (formData.result === null || formData.result === undefined || formData.result === "") {
            toast.error("Please enter the observed value");
            return;
        }

        if (formData.standard_value === null || formData.standard_value === undefined || formData.standard_value === "") {
            toast.error("Please enter the standard threshold");
            return;
        }

        setIsSubmitting(true);
        try {
            await qcService.createQc(formData as any);
            toast.success("QC inspection created successfully!");
            setIsNewModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            console.error("QC Create Error:", err.response?.data || err.message);
            let errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to create QC inspection";
            if (typeof errorMsg !== "string") errorMsg = "Validation failed: Please check all required fields.";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedQc) return;

        if (!formData.engineer_name.trim()) {
            toast.error("Please enter the Engineer In-Charge name");
            return;
        }

        if (formData.result === null || formData.result === undefined || formData.result === "") {
            toast.error("Please enter the observed value");
            return;
        }

        if (formData.standard_value === null || formData.standard_value === undefined || formData.standard_value === "") {
            toast.error("Please enter the standard threshold");
            return;
        }

        setIsSubmitting(true);
        try {
            await qcService.updateQc(selectedQc.id, formData as any);
            toast.success("QC inspection updated successfully!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error("QC Update Error:", err.response?.data || err.message);
            let errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to update QC inspection";
            if (typeof errorMsg !== "string") errorMsg = "Validation failed: Please check all required fields.";
            toast.error(errorMsg);
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
            setQcList(prev => prev.filter(q => q.id !== deleteId));
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            // Intentionally not calling fetchData() here to prevent stale backend data from causing the item to reappear
        } catch (err) {
            toast.error("Failed to delete QC entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setFormData({
            project_id: projectId || 92,
            task_id: null,
            dsr_id: null,
            inspection_type: "General",
            test_type: "Visual Check",
            result: "",
            standard_value: "",
            status: "Pass",
            engineer_name: "",
            remarks: "",
            report_file: ""
        });
    };

    const handleViewDetails = async (qc: QcItem) => {
        setViewLoadingId(qc.id);
        try {
            const data = await qcService.getQc(qc.id);
            setSelectedQc(data);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch QC details:", error);
            setSelectedQc(qc);
            setIsViewModalOpen(true);
            toast.error("Using cached data. Live fetch failed.");
        } finally {
            setViewLoadingId(null);
        }
    };

    const openEdit = (qc: QcItem) => {
        setSelectedQc(qc);
        setFormData({
            project_id: qc.project_id || projectId || 92,
            task_id: qc.task_id,
            dsr_id: qc.dsr_id,
            inspection_type: qc.inspection_type,
            test_type: qc.test_type,
            result: qc.result,
            standard_value: qc.standard_value,
            status: qc.status,
            engineer_name: qc.engineer_name,
            remarks: qc.remarks || "",
            report_file: qc.report_file || ""
        });
        setIsEditModalOpen(true);
    };

    // â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const filteredList = useMemo(() => {
        let data = qcList;

        if (activeStatFilter === "Compliance") {
            data = data.filter(q => q.status === "Pass");
        } else if (activeStatFilter === "Failed") {
            data = data.filter(q => q.status === "Fail");
        }

        const filtered = data.filter(q => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === "" ||
                q.engineer_name.toLowerCase().includes(term) ||
                q.test_type.toLowerCase().includes(term) ||
                q.inspection_type.toLowerCase().includes(term) ||
                q.status.toLowerCase().includes(term) ||
                (q.remarks || "").toLowerCase().includes(term) ||
                String(q.id).includes(term);
            const matchesType = filterType === "All" || (q.inspection_type || "").toLowerCase().trim() === filterType.toLowerCase().trim();
            const matchesStatus = filterStatus === "All" || (q.status || "").toLowerCase().trim() === filterStatus.toLowerCase().trim();
            return matchesSearch && matchesType && matchesStatus;
        });

        return filtered.sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });
    }, [qcList, searchTerm, filterType, filterStatus, activeStatFilter, sortOrder]);

    const breakdown = useMemo(() => {
        const groups: Record<string, { total: number; passed: number; failed: number }> = {};
        filteredList.forEach(q => {
            if (!groups[q.test_type]) {
                groups[q.test_type] = { total: 0, passed: 0, failed: 0 };
            }
            groups[q.test_type].total++;
            if (q.status === "Pass") groups[q.test_type].passed++;
            else groups[q.test_type].failed++;
        });

        return Object.entries(groups).map(([type, data]) => ({
            type,
            ...data,
            passRate: Math.round((data.passed / data.total) * 100) + "%"
        }));
    }, [filteredList]);

    const paginatedList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        const total = filteredList.length;
        const passed = filteredList.filter(q => q.status === "Pass").length;
        const failed = filteredList.filter(q => q.status === "Fail").length;

        let totalFields = 0;
        let filledFields = 0;

        filteredList.forEach(q => {
            const fields = [
                q.inspection_type,
                q.test_type,
                q.result !== undefined && q.result !== null && String(q.result) !== '',
                q.standard_value !== undefined && q.standard_value !== null && String(q.standard_value) !== '',
                q.status,
                q.engineer_name,
                q.remarks,
                q.report_file
            ];
            fields.forEach(f => {
                totalFields++;
                if (f && String(f).trim() !== '') {
                    filledFields++;
                }
            });
        });

        const momentum = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 100;

        return {
            total,
            passed,
            failed,
            compliance: Math.round((passed / (total || 1)) * 100),
            passPercent: total > 0 ? Math.round((passed / total) * 100) : 0,
            failPercent: total > 0 ? Math.round((failed / total) * 100) : 0,
            momentum
        };
    }, [filteredList]);

    const statusBadge: Record<string, string> = {
        Pass: "bg-emerald-100 text-emerald-600",
        Fail: "bg-red-100 text-red-600",
    };

    return (
        <>
            <Navbar title="QC Inspection" breadcrumb={["Engineer", "Quality Control", "Inspection Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Quality Control Ledger
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Historical record of site inspections and material quality audits.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { resetForm(); setIsNewModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Log QC Entry
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Audits",
                            value: stats.total.toString(),
                            sub: "Verified Logs",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "Pass Tests",
                            value: stats.passed.toString(),
                            sub: "Pass Tests",
                            accent: "text-emerald-500",
                            status: "Compliance",
                        },
                        {
                            title: "Failed Tests",
                            value: stats.failed.toString(),
                            sub: "Failed Tests",
                            accent: "text-rose-500",
                            status: "Failed",
                        },
                        {
                            title: "Audit Momentum",
                            value: `${stats.compliance}%`,
                            sub: "Overall Pass Percentage",
                            accent: "text-blue-500",
                            status: "Momentum",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            {s.sub && (
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {s.sub}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 md:mb-8 max-w-full overflow-x-auto scrollbar-none font-inter">
                    <button
                        onClick={() => navigate("/engineer/qc/inspection")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Inspection" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        QC Inspection
                    </button>
                    <button
                        onClick={() => navigate("/engineer/qc/reports")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Test Reports" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Test Reports
                    </button>
                </div>

                {activeTab === "Inspection" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                            <div className="relative flex-1 max-w-md font-inter">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by test type or engineer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 font-inter">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                >
                                    <option value="All">All Types</option>
                                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Pass">Pass</option>
                                    <option value="Fail">Fail</option>
                                </select>
                                {activeStatFilter !== "All" && (
                                    <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                            {isLoading ? (
                                <div className="p-20 text-center text-slate-400 font-inter">
                                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Syncing quality logs...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left font-inter min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Audit Details</th>
                                            <th className="px-6 py-4">Test Description</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Values</th>
                                            <th className="px-6 py-4">Auditor</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-inter">
                                        {paginatedList.length > 0 ? (
                                            paginatedList.map((qc) => (
                                                <tr key={qc.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-slate-700 font-inter">
                                                            {projects.find(p => Number(p.id) === Number(qc.project_id))?.project_name ||
                                                                projects.find(p => Number(p.id) === Number(qc.project_id))?.name ||
                                                                `Project #${qc.project_id}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col font-inter">
                                                            <span className="text-sm font-bold text-slate-800 font-inter">{qc.inspection_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-xs font-inter">
                                                            <span className="text-xs font-bold text-slate-700 truncate font-inter">{qc.test_type}</span>
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter truncate">
                                                                <Activity className="w-3 h-3" />
                                                                <span className="truncate font-inter">{qc.remarks || "No additional remarks"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusBadge[qc.status]}`}>
                                                            {qc.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col font-inter">
                                                            <p className="text-[10px] font-bold text-slate-800 font-inter">Result: {qc.result}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">Std: {qc.standard_value}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 font-inter">
                                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                                            <p className="text-[10px] font-bold text-slate-800 font-inter uppercase tracking-widest">{qc.engineer_name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 font-inter">
                                                            <button
                                                                onClick={() => handleViewDetails(qc)}
                                                                disabled={viewLoadingId === qc.id}
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                                title="View Details"
                                                            >
                                                                {viewLoadingId === qc.id ? (
                                                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
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
                                                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-inter font-bold uppercase tracking-widest text-[10px]">
                                                    No quality audits found in the project vault.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* ─── Pagination ─────────────────────────────────── */}
                        {!isLoading && filteredList.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                                {/* Left: Items per page */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Center: Showing info */}
                                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} records
                                </div>

                                {/* Right: Pagination */}
                                <div className="flex flex-wrap justify-center items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {(() => {
                                        const totalItems = filteredList.length;
                                        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                        const pages = [];
                                        if (totalPages <= 5) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                pages.push(1, 2, 3, 4, '...', totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                            }
                                        }

                                        return pages.map((page, index) => {
                                            if (page === '...') {
                                                return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                            }
                                            const pageNum = page;
                                            const isActive = currentPage === pageNum;
                                            return (
                                                <button
                                                    key={`page-${pageNum}`}
                                                    onClick={() => setCurrentPage(pageNum as number)}
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        });
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredList.length / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(filteredList.length / itemsPerPage)) || filteredList.length === 0}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Test Reports" && (
                    <div className="space-y-10 font-inter">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-50 bg-white">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Test Protocol Breakdown</h3>
                            </div>
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-left font-inter">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                            <th className="px-6 py-4">Test Protocol</th>
                                            <th className="px-6 py-4 text-center">Sample Count</th>
                                            <th className="px-6 py-4 text-center">Compliant</th>
                                            <th className="px-6 py-4 text-center">Non-Compliant</th>
                                            <th className="px-6 py-4 text-right">Velocity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {breakdown.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-800">{row.type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{row.total}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.passed}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.failed}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-primary">{row.passRate}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {breakdown.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                    No test reports available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>

            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                title={isEditModalOpen ? "Modify QC Inspection" : "Log QC Entry"}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-inter disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => isEditModalOpen ? handleUpdateSubmit() : handleCreateSubmit()}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : (isEditModalOpen ? "Update Inspection" : "Commit Entry")}
                        </button>
                    </>
                }
            >
                <div className="p-6 space-y-6 bg-slate-50/30 font-inter max-h-[70vh] overflow-y-auto scrollbar-thin">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-primary" />
                            file upload
                        </h3>
                        <div className="space-y-4 font-inter">
                            <div className="group relative border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl p-8 transition-all bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden font-inter">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            toast.success(`Selected: ${file.name}`);
                                            setSelectedFile(file);
                                            setFormData({ ...formData, report_file: file.name });
                                        }
                                    }}
                                />
                                <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform font-inter">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-center font-inter">
                                    <p className="text-xs font-bold text-slate-700 mb-1 font-inter">file upload</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">PNG, JPG or PDF up to 10MB</p>
                                </div>
                            </div>
                            {formData.report_file && (
                                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl font-inter">
                                    <div className="flex items-center gap-3 font-inter">
                                        <div className="p-2 bg-white rounded-lg font-inter">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="font-inter">
                                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none mb-1 font-inter">Ready for Sync</p>
                                            <p className="text-[11px] font-bold text-slate-600 truncate max-w-[200px] font-inter">{formData.report_file}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setFormData({ ...formData, report_file: "" });
                                        }}
                                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 font-inter"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                            Audit Intelligence
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">project *</label>
                                <select
                                    value={formData.project_id}
                                    onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter cursor-pointer"
                                    required
                                >
                                    <option value="">-- Select project --</option>
                                    {projects.map(p => (
                                        <option key={p.project_id || p.id} value={p.project_id || p.id}>
                                            {p.project_name || p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">inspection type *</label>
                                <select
                                    value={formData.inspection_type}
                                    onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter cursor-pointer"
                                >
                                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">task <span className="normal-case text-slate-300">(optional)</span></label>
                                <select
                                    value={formData.task_id || ""}
                                    onChange={(e) => setFormData({ ...formData, task_id: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter cursor-pointer"
                                >
                                    <option value="">None</option>
                                    {tasks.map(t => {
                                        const cleanTitle = (t.title || "").replace(/^Task\s*#\d+\s*[-:]?\s*/i, "");
                                        return (
                                            <option key={t.id} value={t.id}>
                                                {cleanTitle || `Task #${t.id}`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">dsr <span className="normal-case text-slate-300">(optional)</span></label>
                                <select
                                    value={formData.dsr_id || ""}
                                    onChange={(e) => setFormData({ ...formData, dsr_id: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter cursor-pointer"
                                >
                                    <option value="">None</option>
                                    {dsrs.map(d => {
                                        let workDoneStr = d.work_done || "";
                                        
                                        // Clean any leading "DSR #ID - " prefix
                                        workDoneStr = workDoneStr.replace(/^DSR\s*#\d+\s*[-:]?\s*/i, "").trim();
                                        
                                        // Display clean work description
                                        let display = workDoneStr || `DSR #${d.id}`;
                                        
                                        return (
                                            <option key={d.id} value={d.id}>
                                                {display}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">test type *</label>
                                <select
                                    value={formData.test_type}
                                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter cursor-pointer"
                                >
                                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">engineer name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter auditor name..."
                                    value={formData.engineer_name}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                                        setFormData({ ...formData, engineer_name: val });
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-primary" />
                            Measurement Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">result *</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.result}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, result: val === "" ? "" : Number(val) });
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">standard value *</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.standard_value}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, standard_value: val === "" ? "" : Number(val) });
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold outline-none transition-all font-inter cursor-pointer ${formData.status === 'Pass' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}
                                >
                                    <option value="Pass">Pass</option>
                                    <option value="Fail">Fail</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            Technical Narrative
                        </h3>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                remark <span className="normal-case text-slate-300">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Describe observations, deviations or site notes for the ledger..."
                                value={formData.remarks || ""}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-inter placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="QC Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedQc && (
                    <div className="p-6 font-inter">
                        <div className="bg-primary rounded-xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <span className="text-4xl font-bold font-inter">{selectedQc.test_type.charAt(0)}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-slate-800 rounded-full animate-pulse ${selectedQc.status === 'Pass' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter truncate max-w-[200px]">{selectedQc.test_type}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${selectedQc.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                                            {selectedQc.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter uppercase tracking-widest">qc.ref-#{selectedQc.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-bold uppercase tracking-widest font-inter">INSPECTION: {selectedQc.inspection_type}</span>
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
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Project</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase truncate" title={projects.find(p => p.id === selectedQc.project_id || p.project_id === selectedQc.project_id)?.project_name || projects.find(p => p.id === selectedQc.project_id || p.project_id === selectedQc.project_id)?.name || String(selectedQc.project_id)}>
                                            {projects.find(p => p.id === selectedQc.project_id || p.project_id === selectedQc.project_id)?.project_name || projects.find(p => p.id === selectedQc.project_id || p.project_id === selectedQc.project_id)?.name || selectedQc.project_id}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Engineer Name</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase">{selectedQc.engineer_name}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Task</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase">
                                            {selectedQc.task_id ? (tasks.find(t => t.id === selectedQc.task_id)?.title ? (tasks.find(t => t.id === selectedQc.task_id).title.replace(/^Task\s*#\d+\s*[-:]?\s*/i, "")) : `Task #${selectedQc.task_id}`) : "N/A"}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">DSR</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase">
                                            {selectedQc.dsr_id ? (() => {
                                                const d = dsrs.find(dsr => dsr.id === selectedQc.dsr_id);
                                                if (d) {
                                                    let workDoneStr = d.work_done || "";
                                                    workDoneStr = workDoneStr.replace(/^DSR\s*#\d+\s*[-:]?\s*/i, "").trim();
                                                    return workDoneStr || `DSR #${selectedQc.dsr_id}`;
                                                }
                                                return `DSR #${selectedQc.dsr_id}`;
                                            })() : "N/A"}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Inspection Category</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase">{selectedQc.inspection_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Final Status</p>
                                        <p className={`text-sm font-bold font-inter uppercase tracking-widest ${selectedQc.status === 'Pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {selectedQc.status}
                                        </p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Observed Value (Result)</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{selectedQc.result}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Standard Threshold</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{selectedQc.standard_value}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Auditor Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter">
                                            "{selectedQc.remarks || "No additional technical remarks provided for this audit."}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter"
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
