import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import { documentService } from "../../services/documentService";
import type { Document, DocumentUpdateParams } from "../../types/document";
import {
    Download, ChevronLeft, ChevronRight, Folder, FolderPlus,
    Upload, Trash2, X, FileImage, FileSpreadsheet, Filter,
    Edit2, History, FileText, RefreshCcw, Eye, Loader2, Search
} from "lucide-react";
import { drawingService } from "../../services/drawingService";

// ─── Types ──────────────────────────────────────────────────────────
type TypeFilter = "All" | "Documents" | "Folders";
type SortOrder = "latest" | "oldest";

// ─── Helpers ────────────────────────────────────────────────────────
const getFileType = (doc: Document): { label: string; color: string; icon: React.ReactNode } => {
    const url = (doc.file_url || "").toLowerCase();
    const type = (doc.document_type || "").toLowerCase();

    if (doc.is_folder) return { label: "DIR", color: "indigo", icon: <Folder className="w-5 h-5" /> };
    if (url.endsWith(".pdf") || type === "pdf")
        return { label: "PDF", color: "rose", icon: <FileText className="w-5 h-5" /> };
    if (url.endsWith(".doc") || url.endsWith(".docx"))
        return { label: "DOC", color: "blue", icon: <FileText className="w-5 h-5" /> };
    if (url.endsWith(".xls") || url.endsWith(".xlsx") || url.endsWith(".csv"))
        return { label: "XLS", color: "emerald", icon: <FileSpreadsheet className="w-5 h-5" /> };
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(url))
        return { label: "IMG", color: "purple", icon: <FileImage className="w-5 h-5" /> };
    if (url.endsWith(".dwg") || url.endsWith(".dxf"))
        return { label: "DWG", color: "amber", icon: <FileText className="w-5 h-5" /> };
    return { label: "FILE", color: "slate", icon: <FileText className="w-5 h-5" /> };
};

const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
    rose: "bg-rose-50 border-rose-200 text-rose-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    slate: "bg-slate-50 border-slate-200 text-slate-500",
};

const DOC_TYPES = ["Drawing", "Contract", "Report", "Specification", "Schedule", "Invoice", "Other"];

// ─── Page ────────────────────────────────────────────────────────────
const ManagerDocumentsPage = () => {
    const { selectedProjectId, selectedProject, assignedProjects, setSelectedProjectId } = useProject();
    const { tab } = useParams();
    const navigate = useNavigate();

    // Data
    const [docs, setDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation
    const [currentParentId, setCurrentParentId] = useState<number | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: number; name: string }[]>([]);

    // Filters & Sort
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
    const [mainTab, setMainTab] = useState<"Drawings" | "Documents">("Drawings");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Modals
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: 0, title: "", document_type: "", remarks: "", version: "", status: ""
    });
    const [editFile, setEditFile] = useState<File | null>(null);
    const editFileInputRef = React.useRef<HTMLInputElement>(null);

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedDocForHistory, setSelectedDocForHistory] = useState<Document | null>(null);
    const [approvalHistory, setApprovalHistory] = useState<any[]>([]);

    // Form
    const [uploadForm, setUploadForm] = useState({
        title: "", document_type: "Drawing", remarks: "", version: ""
    });
    const [uploadProjectId, setUploadProjectId] = useState<number | null>(null);
    const [folderName, setFolderName] = useState("");
    const [folderParentId, setFolderParentId] = useState<string>("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // ─── Routing Sync ────────────────────────────────────────────────
    useEffect(() => {
        if (tab) {
            const tabMap: Record<string, TypeFilter> = {
                documents: "Documents",
                folders: "Folders",
                files: "All",
                drawings: "All",
                contracts: "All",
            };
            const mappedTab = tabMap[tab.toLowerCase()];
            if (mappedTab) setTypeFilter(mappedTab);
        }
    }, [tab]);

    const handleTabChange = (newTab: TypeFilter) => {
        setTypeFilter(newTab);
        setCurrentPage(1);
        const urlMap: Record<TypeFilter, string> = {
            All: "files",
            Documents: "documents",
            Folders: "folders",
        };
        navigate(`/manager/documents/${urlMap[newTab]}`);
    };

    // ─── Fetch ───────────────────────────────────────────────────────
    const fetchDocs = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const listRes = await documentService.listDocuments({
                project_id: selectedProjectId,
                parent_id: currentParentId,
                limit: 100,
            });

            const items = Array.isArray(listRes)
                ? listRes
                : (listRes as any).items || (listRes as any).data || [];

            // Sort folders first, then by date
            items.sort((a: Document, b: Document) => {
                if (a.is_folder && !b.is_folder) return -1;
                if (!a.is_folder && b.is_folder) return 1;
                return Number(b.id) - Number(a.id);
            });
            setDocs(items);
        } catch {
            toast.error("Failed to sync document vault");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, currentParentId]);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter, categoryFilter]);

    // ─── Actions ─────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!uploadFile || !uploadForm.title.trim()) {
            toast.error("Drawing name and file are required.");
            return;
        }
        if (!uploadForm.version.trim()) {
            toast.error("Version is required.");
            return;
        }
        const targetProjectId = uploadProjectId || selectedProjectId;
        if (!targetProjectId) { toast.error("Please select a project."); return; }
        setIsSubmitting(true);
        try {
            await documentService.uploadDocument({
                project_id: targetProjectId,
                title: uploadForm.title,
                document_type: uploadForm.document_type,
                remarks: uploadForm.remarks,
                version: uploadForm.version,
                parent_id: currentParentId || undefined,
                file: uploadFile,
            });
            toast.success("Document uploaded successfully!");
            setIsUploadModalOpen(false);
            setUploadForm({ title: "", document_type: "Drawing", remarks: "", version: "" });
            setUploadFile(null);
            if (targetProjectId !== selectedProjectId) {
                setSelectedProjectId(targetProjectId);
            }
            setUploadProjectId(null);
            // Small delay to allow backend to commit before re-fetching
            setTimeout(() => fetchDocs(), 500);
        } catch {
            toast.error("Upload failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!folderName.trim()) { toast.error("Folder name is required."); return; }
        if (!selectedProjectId) { toast.error("No project selected."); return; }
        setIsSubmitting(true);
        try {
            const resolvedParentId = folderParentId.trim() !== ""
                ? Number(folderParentId)
                : currentParentId || undefined;
            await documentService.createFolder({
                project_id: selectedProjectId,
                title: folderName,
                parent_id: resolvedParentId,
            });
            toast.success("Folder created!");
            setIsFolderModalOpen(false);
            setFolderName("");
            setFolderParentId("");
            fetchDocs();
        } catch {
            toast.error("Failed to create folder.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownload = async (doc: Document) => {
        const toastId = toast.loading(`Downloading ${doc.title}...`);
        try {
            await documentService.downloadDocument(doc.id, doc.title);
            toast.success("Download started.", { id: toastId });
        } catch {
            toast.error("Download failed.", { id: toastId });
        }
    };

    const handleEditClick = (doc: Document) => {
        setEditForm({
            id: doc.id,
            title: doc.title || "",
            document_type: doc.document_type || "Other",
            remarks: doc.remarks || "",
            version: doc.version || "v1.0",
            status: doc.status || "PENDING",
        });
        setEditFile(null);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editForm.title.trim()) {
            toast.error("Title is required.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Updating metadata...");
        try {
            let payload: DocumentUpdateParams | FormData;
            if (editFile) {
                const fd = new FormData();
                fd.append("title", editForm.title);
                fd.append("document_type", editForm.document_type);
                fd.append("remarks", editForm.remarks);
                fd.append("version", editForm.version);
                fd.append("status", editForm.status);
                fd.append("file", editFile);
                payload = fd;
            } else {
                payload = {
                    title: editForm.title,
                    document_type: editForm.document_type,
                    remarks: editForm.remarks,
                    version: editForm.version,
                    status: editForm.status,
                };
            }
            await documentService.updateDocument(editForm.id, payload);
            toast.success("Document updated successfully!", { id: toastId });
            setIsEditModalOpen(false);
            setEditFile(null);
            fetchDocs();
        } catch {
            toast.error("Update failed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewHistory = async (doc: Document) => {
        const toastId = toast.loading("Fetching approval history...");
        try {
            const history = await drawingService.getApprovalHistory(doc.id);
            setApprovalHistory(history);
            setSelectedDocForHistory(doc);
            setIsHistoryModalOpen(true);
            toast.dismiss(toastId);
        } catch {
            toast.error("Failed to fetch history.", { id: toastId });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await documentService.deleteDocument(deleteId);
            toast.success("Document deleted.");
            setDocs(prev => prev.filter(d => d.id !== deleteId));
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch {
            toast.error("Delete failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFolderClick = (doc: Document) => {
        setCurrentParentId(doc.id);
        setFolderPath(prev => [...prev, { id: doc.id, name: doc.title }]);
    };

    const handleBreadcrumb = (index: number) => {
        if (index === -1) { setCurrentParentId(null); setFolderPath([]); }
        else {
            const newPath = folderPath.slice(0, index + 1);
            setCurrentParentId(newPath[newPath.length - 1].id);
            setFolderPath(newPath);
        }
    };

    // ─── Computed ────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let data = docs;

        // Main tab filter: Drawings vs Documents
        if (mainTab === "Drawings") {
            data = data.filter(d => d.is_folder || (d.document_type || "").toLowerCase() === "drawing");
        } else {
            // Documents tab: show everything that is NOT a drawing (includes null/empty document_type)
            data = data.filter(d => d.is_folder || (d.document_type || "").toLowerCase() !== "drawing");
        }

        // Sub-tab filter: All, Documents (non-folders), Folders
        if (typeFilter === "Documents") {
            data = data.filter(d => !d.is_folder);
        } else if (typeFilter === "Folders") {
            data = data.filter(d => d.is_folder);
        }

        // Specific category filter (exact document_type match)
        if (categoryFilter) {
            data = data.filter(d =>
                d.is_folder ||
                (d.document_type || "").toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            data = data.filter(d =>
                (d.title || "").toLowerCase().includes(term) ||
                (d.document_type || "").toLowerCase().includes(term)
            );
        }

        return [...data].sort((a, b) => {
            if (a.is_folder && !b.is_folder) return -1;
            if (!a.is_folder && b.is_folder) return 1;
            const timeA = new Date(a.uploaded_at || 0).getTime();
            const timeB = new Date(b.uploaded_at || 0).getTime();
            return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
        });
    }, [docs, mainTab, typeFilter, categoryFilter, searchTerm, sortOrder]);

    // Derive available category options from ALL docs (not filtered) so dropdown always shows full list
    const availableCategories = useMemo(() => {
        const types = docs
            .filter(d => !d.is_folder && d.document_type)
            .map(d => d.document_type as string);
        return Array.from(new Set(types)).sort();
    }, [docs]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    const statsCounts = useMemo(() => ({
        total: docs.filter(d => !d.is_folder).length,
        folders: docs.filter(d => d.is_folder).length,
        approved: docs.filter(d => !d.is_folder && (d.status === "APPROVED")).length,
    }), [docs]);

    // ─── Styles ──────────────────────────────────────────────────────
    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    // ─── No Project Guard ─────────────────────────────────────────────
    if (!selectedProjectId) {
        return (
            <>
                <Navbar title="Document Vault" breadcrumb={["Manager", "Documents"]} />
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Folder className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Select a project to view documents.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar
                title="Document Vault"
                breadcrumb={["Manager", "Documents", folderPath.length > 0 ? folderPath[folderPath.length - 1].name : "Root"]}
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Document Vault</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Centralized repository for drawings, contracts, and project files.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDocs}
                            disabled={isLoading}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-200 bg-white shadow-sm"
                            title="Refresh"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setIsFolderModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <FolderPlus className="w-4 h-4 text-indigo-500" />
                            New Folder
                        </button>
                        <button
                            onClick={() => {
                                const type = mainTab === "Drawings" ? "Drawing" : "Document";
                                setUploadForm({ title: "", document_type: type, remarks: "", version: "" });
                                setUploadFile(null);
                                setUploadProjectId(selectedProjectId);
                                setIsUploadModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <Upload className="w-4 h-4" />
                            {mainTab === "Drawings" ? "Upload Drawing" : "Upload Document"}
                        </button>
                    </div>
                </div>

                {/* Main Tabs — Drawings / Documents */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
                    {(["Drawings", "Documents"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setMainTab(tab); setCategoryFilter(""); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${mainTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { title: "Total Files", value: statsCounts.total, sub: "In this project", accent: "text-slate-800", icon: <FileText className="w-5 h-5" />, bg: "bg-slate-100 text-slate-600" },
                        { title: "Folders", value: statsCounts.folders, sub: "Organized categories", accent: "text-indigo-600", icon: <Folder className="w-5 h-5" />, bg: "bg-indigo-100 text-indigo-600" },
                        { title: "Approved Files", value: statsCounts.approved, sub: "Review completed", accent: "text-emerald-600", icon: <FileText className="w-5 h-5" />, bg: "bg-emerald-100 text-emerald-600" },
                    ].map(s => (
                        <div key={s.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.title}</span>
                            </div>
                            <h3 className={`text-2xl font-black ${s.accent}`}>{s.value}</h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                {(["All", "Documents", "Folders"] as TypeFilter[]).map(tabName => (
                                    <button
                                        key={tabName}
                                        onClick={() => { handleTabChange(tabName); setCategoryFilter(""); }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${typeFilter === tabName ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        {tabName}
                                    </button>
                                ))}
                            </div>
                            {/* Category type filter — shows actual document_type values from data */}
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className={`px-3 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
                                    categoryFilter
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                            >
                                <option value="">All Types</option>
                                {availableCategories.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as SortOrder)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="latest">Latest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    {folderPath.length > 0 && (
                        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-50 flex items-center gap-2">
                            <button onClick={() => handleBreadcrumb(-1)} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">Root Vault</button>
                            {folderPath.map((f, idx) => (
                                <React.Fragment key={f.id}>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <button onClick={() => handleBreadcrumb(idx)} className={`text-xs font-bold transition-colors ${idx === folderPath.length - 1 ? "text-slate-800" : "text-slate-500 hover:text-primary"}`}>
                                        {f.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4 w-14">Type</th>
                                    <th className="px-6 py-4">Document Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Version</th>
                                    <th className="px-6 py-4">Uploaded</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing document vault...</p>
                                        </div>
                                    </td></tr>
                                ) : paginated.length > 0 ? (
                                    <AnimatePresence>
                                        {paginated.map((doc) => {
                                            const ft = getFileType(doc);
                                            return (
                                                <motion.tr
                                                    key={doc.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="hover:bg-slate-50/50 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 shadow-sm group-hover:scale-105 transition-transform ${colorMap[ft.color]}`}>
                                                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">{ft.label}</span>
                                                            {ft.icon}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {doc.is_folder ? (
                                                            <button
                                                                onClick={() => handleFolderClick(doc)}
                                                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                                                            >
                                                                {doc.title}
                                                            </button>
                                                        ) : (
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{doc.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">{doc.remarks || "—"}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                                                            {doc.document_type || (doc.is_folder ? "Folder" : "File")}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" : doc.status === "REJECTED" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                                                            {doc.status || "PENDING"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                        {doc.version || "v1.0"}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                                                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {!doc.is_folder && (
                                                                <>
                                                                    <button
                                                                        onClick={() => { setViewingDoc(doc); setIsViewModalOpen(true); }}
                                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleViewHistory(doc)}
                                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                                        title="Approval History"
                                                                    >
                                                                        <History className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditClick(doc)}
                                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                                        title="Edit Details"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDownload(doc)}
                                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                                        title="Download"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => { setDeleteId(doc.id); setIsDeleteModalOpen(true); }}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                ) : (
                                    <tr><td colSpan={7} className="px-6 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                                        No documents found in this location.
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && filtered.length > itemsPerPage && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <p className="text-[11px] text-slate-500">
                                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                    Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)
                                ).map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${currentPage === p ? "bg-primary text-white border border-primary" : "bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm"}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 bg-white shadow-sm">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title={mainTab === "Drawings" ? "Upload Drawing" : "Upload Document"}
                maxWidth="max-w-lg"
                footer={
                    <>
                        <button onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleUpload} disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isSubmitting ? "Uploading..." : "Upload"}
                        </button>
                    </>
                }
            >
                <div className="p-4 space-y-4">
                    <div>
                        <label className={labelCls}>Project <span className="text-rose-500">*</span></label>
                        <select
                            value={uploadProjectId ?? ""}
                            onChange={e => setUploadProjectId(e.target.value ? Number(e.target.value) : null)}
                            className={inputCls}
                        >
                            <option value="">Select Project</option>
                            {assignedProjects.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>{mainTab === "Drawings" ? "Drawing Name" : "Document Title"} <span className="text-rose-500">*</span></label>
                        <input value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                            placeholder={mainTab === "Drawings" ? "e.g. Foundation Drawing Rev-2" : "e.g. Site Contract 2026"} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Document Type</label>
                            {mainTab === "Drawings" ? (
                                <input value="Drawing" readOnly className={inputCls + " bg-slate-50 text-slate-400 cursor-not-allowed"} />
                            ) : (
                                <select value={uploadForm.document_type} onChange={e => setUploadForm(p => ({ ...p, document_type: e.target.value }))} className={inputCls}>
                                    {DOC_TYPES.filter(t => t !== "Drawing").map(t => <option key={t}>{t}</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className={labelCls}>Version <span className="text-rose-500">*</span></label>
                            <input value={uploadForm.version} onChange={e => setUploadForm(p => ({ ...p, version: e.target.value }))}
                                placeholder="e.g. V1" className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Remarks</label>
                        <textarea value={uploadForm.remarks} onChange={e => setUploadForm(p => ({ ...p, remarks: e.target.value }))}
                            placeholder="Optional notes..." rows={2} className={inputCls + " resize-none"} />
                    </div>
                    <div>
                        <label className={labelCls}>File <span className="text-rose-500">*</span></label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                            {uploadFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-800">{uploadFile.name}</p>
                                        <p className="text-xs text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                                        className="ml-auto p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-500">Click to select file</p>
                                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DWG, Images supported</p>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => { setIsFolderModalOpen(false); setFolderName(""); setFolderParentId(""); }}
                title="Create New Folder"
                maxWidth="max-w-sm"
                footer={
                    <>
                        <button onClick={() => { setIsFolderModalOpen(false); setFolderName(""); setFolderParentId(""); }} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button onClick={handleCreateFolder} disabled={isSubmitting}
                            className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                            Create
                        </button>
                    </>
                }
            >
                <div className="p-4 space-y-4">
                    <div>
                        <label className={labelCls}>Project Name</label>
                        <input
                            value={selectedProject?.project_name || `Project #${selectedProjectId}`}
                            readOnly
                            className={inputCls + " bg-slate-50 text-slate-500 cursor-not-allowed"}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Folder Name <span className="text-rose-500">*</span></label>
                        <input value={folderName} onChange={e => setFolderName(e.target.value)}
                            placeholder="e.g. Structural Drawings" className={inputCls} autoFocus />
                    </div>
                    <div>
                        <label className={labelCls}>Parent ID <span className="text-slate-400 font-medium normal-case tracking-normal">(optional)</span></label>
                        <input
                            type="number"
                            value={folderParentId}
                            onChange={e => setFolderParentId(e.target.value)}
                            placeholder={currentParentId ? `Current: ${currentParentId}` : "Leave blank for root"}
                            className={inputCls}
                            min={1}
                        />
                        {currentParentId && !folderParentId && (
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                Defaults to current folder (ID: {currentParentId})
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Document Details" maxWidth="max-w-md">
                {viewingDoc && (
                    <div className="p-6 space-y-3">
                        {[
                            ["Title", viewingDoc.title],
                            ["Project", viewingDoc.project_name || `Project #${viewingDoc.project_id}`],
                            ["Type", viewingDoc.document_type || "—"],
                            ["Status", viewingDoc.status || "PENDING"],
                            ["Version", viewingDoc.version || "v1.0"],
                            ["Uploaded", viewingDoc.uploaded_at ? new Date(viewingDoc.uploaded_at).toLocaleString() : "—"],
                            ["Uploaded By", viewingDoc.uploaded_by_name || (viewingDoc.uploaded_by_user_id ? `User #${viewingDoc.uploaded_by_user_id}` : "—")],
                            ["Remarks", viewingDoc.remarks || "—"],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-4">{label}</span>
                                <span className={`text-sm font-bold text-right max-w-[60%] ${
                                    label === "Status"
                                        ? value === "APPROVED" ? "text-emerald-600"
                                        : value === "REJECTED" ? "text-rose-600"
                                        : "text-amber-600"
                                        : "text-slate-800"
                                }`}>{value}</span>
                            </div>
                        ))}

                        {/* File URL row */}
                        {viewingDoc.file_url && (
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-4">File URL</span>
                                <a
                                    href={viewingDoc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-primary hover:underline text-right max-w-[60%] truncate block"
                                    title={viewingDoc.file_url}
                                >
                                    {viewingDoc.file_url.split("/").pop() || viewingDoc.file_url}
                                </a>
                            </div>
                        )}

                        {viewingDoc.file_url && (
                            <button onClick={() => handleDownload(viewingDoc)}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all">
                                <Download className="w-4 h-4" /> Download File
                            </button>
                        )}
                    </div>
                )}
            </Modal>

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteId(null); }}
                onConfirm={handleDelete}
                title="Delete Document"
                message="This action is permanent and cannot be undone."
                confirmText="Delete"
                type="danger"
            />

            {/* Edit Document Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditFile(null); }}
                title="Edit Document Details"
                maxWidth="max-w-lg"
                footer={
                    <>
                        <button onClick={() => { setIsEditModalOpen(false); setEditFile(null); }} disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleUpdate} disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                            {isSubmitting ? "Updating..." : "Save Changes"}
                        </button>
                    </>
                }
            >
                <div className="p-4 space-y-4">
                    <div>
                        <label className={labelCls}>Document Title <span className="text-rose-500">*</span></label>
                        <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Revised Drawing" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Document Type</label>
                            <select value={editForm.document_type} onChange={e => setEditForm(p => ({ ...p, document_type: e.target.value }))} className={inputCls}>
                                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Version</label>
                            <input value={editForm.version} onChange={e => setEditForm(p => ({ ...p, version: e.target.value }))}
                                placeholder="v1.0" className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Remarks</label>
                        <textarea value={editForm.remarks} onChange={e => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                            placeholder="Update notes..." rows={3} className={inputCls + " resize-none"} />
                    </div>
                    <div>
                        <label className={labelCls}>Replace File <span className="text-slate-400 font-medium normal-case tracking-normal">(optional)</span></label>
                        <div
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                            {editFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-800">{editFile.name}</p>
                                        <p className="text-xs text-slate-400">{(editFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); setEditFile(null); }}
                                        className="ml-auto p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold text-slate-500">Click to select a new file</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOC, DWG, Images supported</p>
                                </>
                            )}
                        </div>
                        <input ref={editFileInputRef} type="file" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) setEditFile(e.target.files[0]); }} />
                    </div>
                </div>
            </Modal>

            {/* Approval History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Document Approval History"
                maxWidth="max-w-xl"
            >
                <div className="p-6">
                    {selectedDocForHistory && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">{selectedDocForHistory.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Current Status: {selectedDocForHistory.status || "PENDING"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {approvalHistory.length > 0 ? (
                            approvalHistory.map((item, idx) => (
                                <div key={item.id || idx} className="relative pl-8">
                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${item.status === "Approved" ? "bg-emerald-500" :
                                        item.status === "Rejected" ? "bg-rose-500" : "bg-amber-500"
                                        }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.status === "Approved" ? "bg-emerald-50 text-emerald-600" :
                                                item.status === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">{item.remarks || "No remarks provided"}</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">
                                                <X className="w-2.5 h-2.5 text-slate-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                Update by {item.updated_by || "System Admin"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No history recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ManagerDocumentsPage;
