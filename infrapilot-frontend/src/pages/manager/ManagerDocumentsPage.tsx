import React, { useState, useMemo, useEffect, useCallback } from "react";

import { useParams } from "react-router-dom";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import { documentService } from "../../services/documentService";
import type { Document, DocumentUpdateParams, DocumentStats } from "../../types/document";
import {
    Download, ChevronLeft, ChevronRight, Folder, FolderPlus,
    Upload, Trash2, X, FileImage, FileSpreadsheet,
    Edit2, History, FileText, RefreshCcw, Eye, Loader2, Search
} from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import { drawingService } from "../../services/drawingService";
import ProjectSelector from "../../components/common/ProjectSelector";

// ─── Types ──────────────────────────────────────────────────────────
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

const normalizeDrawingToDocument = (drawing: any, projectName?: string): Document => {
    const approvalStatus = String(drawing.approval_status || drawing.status || "").toLowerCase();
    const status: Document["status"] = approvalStatus === "approved"
        ? "APPROVED"
        : approvalStatus === "rejected"
            ? "REJECTED"
            : approvalStatus === "under_review" || approvalStatus === "under review"
                ? "UNDER_REVIEW"
                : "PENDING";

    return {
        id: Number(drawing.id),
        project_id: Number(drawing.project_id || 0),
        project_name: drawing.project_name || projectName,
        title: drawing.drawing_name || drawing.title || "Untitled Drawing",
        document_type: "Drawing",
        file_url: drawing.file_url || null,
        file_size: 0,
        version: drawing.version || "",
        status,
        is_folder: false,
        parent_id: null,
        uploaded_by_user_id: Number(drawing.uploaded_by_user_id || 0),
        uploaded_at: drawing.created_at || drawing.date || "",
        remarks: drawing.remarks || null,
        uploaded_by_name: drawing.uploaded_by_name || null,
    };
};

// ─── Page ────────────────────────────────────────────────────────────
const ManagerDocumentsPage = () => {
    const { selectedProjectId, selectedProject, assignedProjects, setSelectedProjectId } = useProject();
    const { tab } = useParams();


    // Data
    const [docs, setDocs] = useState<Document[]>([]);
    const [stats, setStats] = useState<DocumentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation
    const [currentParentId, setCurrentParentId] = useState<number | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: number; name: string }[]>([]);

    // Filters & Sort
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
    const [mainTab, setMainTab] = useState<"Drawings" | "Documents">("Drawings");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Modals
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: 0, title: "", document_type: "", remarks: "", version: "", status: "", date: ""
    });
    const [editFile, setEditFile] = useState<File | null>(null);
    const editFileInputRef = React.useRef<HTMLInputElement>(null);

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedDocForHistory, setSelectedDocForHistory] = useState<Document | null>(null);
    const [approvalHistory, setApprovalHistory] = useState<any[]>([]);

    // Document Viewer Modal State
    const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
    const [docViewerDoc, setDocViewerDoc] = useState<Document | null>(null);
    const [docViewerBlobUrl, setDocViewerBlobUrl] = useState<string | null>(null);

    const [, setDocViewerVersions] = useState<any[]>([]);
    const [, setDocViewerLatest] = useState<any | null>(null);
    const [docViewerLoading, setDocViewerLoading] = useState(false);
    const docViewerBlobRef = React.useRef<string | null>(null);

    // Form
    const [uploadForm, setUploadForm] = useState({
        title: "", document_type: "Drawing", remarks: "", version: "", date: "", parent_id: null as number | null
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
            // No longer syncing typeFilter from tab
        }
    }, [tab]);


    // ─── Fetch ───────────────────────────────────────────────────────
    const fetchDocs = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            documentService.getStats().then(res => setStats(res)).catch(() => null);
            let items: Document[] = [];

            if (mainTab === "Drawings") {
                // ── Hit all 3 drawing APIs in parallel (same as engineer module) ──
                // 1. GET /api/v1/drawings          (list)
                // 2. GET /api/v1/drawings/{id}/latest
                // 3. GET /api/v1/drawings/{id}/versions
                const listParams = {
                    project_id: Number(selectedProjectId),
                    parent_id: currentParentId,
                    limit: 50,
                    offset: 0,
                    latest_only: true,
                };
                const latestParams = { parent_id: currentParentId };
                const versionParams = { parent_id: currentParentId, skip: 0, limit: 50 };

                const rawAccumulator: any[] = [];

                await Promise.allSettled([
                    drawingService.getList(listParams)
                        .then(res => { rawAccumulator.push(...(Array.isArray(res) ? res : [])); })
                        .catch(err => console.warn("getList failed:", err)),

                    drawingService.getLatest(Number(selectedProjectId), latestParams)
                        .then(res => { rawAccumulator.push(...(Array.isArray(res) ? res : [])); })
                        .catch(err => console.warn("getLatest failed:", err)),

                    drawingService.getVersions(Number(selectedProjectId), versionParams)
                        .then(res => { rawAccumulator.push(...(Array.isArray(res) ? res : [])); })
                        .catch(err => console.warn("getVersions failed:", err)),
                ]);

                // Deduplicate by id, sort newest first
                const seen = new Set<number>();
                const deduped = rawAccumulator.filter((d: any) => {
                    if (seen.has(Number(d.id))) return false;
                    seen.add(Number(d.id));
                    return true;
                });
                deduped.sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));

                items = deduped.map((drawing: any) =>
                    normalizeDrawingToDocument(drawing, selectedProject?.project_name)
                );
            } else {
                const listRes = await documentService.listDocuments({
                    project_id: (selectedProjectId && selectedProjectId !== 0) ? Number(selectedProjectId) : undefined,
                    parent_id: currentParentId,
                    limit: 100,
                });

                items = Array.isArray(listRes)
                    ? listRes
                    : (listRes as any).items || (listRes as any).data || [];
            }

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
    }, [selectedProjectId, currentParentId, mainTab, selectedProject?.project_name]);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, categoryFilter]);

    // ─── Actions ─────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!uploadFile) {
            toast.error("Please select a file.");
            return;
        }
        if (mainTab === "Drawings") {
            if (!uploadForm.title.trim()) {
                toast.error("Drawing name is required.");
                return;
            }
            if (!uploadForm.version.trim()) {
                toast.error("Version is required.");
                return;
            }
        }
        const targetProjectId = uploadProjectId || selectedProjectId;
        if (!targetProjectId) { toast.error("Please select a project."); return; }
        setIsSubmitting(true);
        try {
            if (mainTab === "Drawings") {
                await drawingService.uploadDrawing({
                    project_id: targetProjectId,
                    drawing_name: uploadForm.title,
                    version: uploadForm.version,
                    date: uploadForm.date || new Date().toISOString().split("T")[0],
                    remarks: uploadForm.remarks || "",
                    approved_by: "Manager",
                    file: uploadFile,
                });
                toast.success("Drawing uploaded successfully!");
            } else {
                await documentService.uploadDocument({
                    project_id: targetProjectId,
                    title: uploadForm.title || undefined,
                    document_type: uploadForm.document_type || undefined,
                    remarks: uploadForm.remarks || undefined,
                    version: uploadForm.version || undefined,
                    date: uploadForm.date || undefined,
                    parent_id: uploadForm.parent_id ?? currentParentId ?? undefined,
                    file: uploadFile,
                });
                toast.success("Document uploaded successfully!");
            }
            setIsUploadModalOpen(false);
            setUploadForm({ title: "", document_type: "Drawing", remarks: "", version: "", date: "", parent_id: null });
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
                : currentParentId ?? undefined;

            if (mainTab === "Drawings") {
                await drawingService.createFolder(selectedProjectId, {
                    drawing_name: folderName,
                    parent_id: resolvedParentId || 0,
                });
            } else {
                await documentService.createFolder({
                    project_id: selectedProjectId,
                    title: folderName,
                    parent_id: resolvedParentId,
                });
            }

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

    const handleViewDocumentFile = async (doc: Document) => {
        // Revoke any previous blob URL
        if (docViewerBlobRef.current) {
            window.URL.revokeObjectURL(docViewerBlobRef.current);
            docViewerBlobRef.current = null;
        }

        setDocViewerDoc(doc);
        setDocViewerBlobUrl(null);
        setDocViewerVersions([]);
        setDocViewerLatest(null);
        setDocViewerLoading(true);
        setIsDocViewerOpen(true);

        const toastId = toast.loading(`Loading ${doc.title}...`);
        try {
            // Run all 3 API calls in parallel
            const [viewRes, versionsRes, latestRes] = await Promise.allSettled([
                // 1. GET /api/v1/drawings/documents/view/{id}
                (mainTab === "Drawings" || (doc.document_type || "").toLowerCase() === "drawing")
                    ? drawingService.viewDocument(doc.id)
                    : documentService.viewDocument(doc.id),
                // 2. GET /api/v1/drawings/{project_id}/versions
                drawingService.getVersions(doc.project_id),
                // 3. GET /api/v1/drawings/{project_id}/latest
                drawingService.getLatest(doc.project_id),
            ]);

            // Handle blob/view
            if (viewRes.status === "fulfilled") {
                const res = viewRes.value;
                const ct = String(res.contentType || "application/pdf");
                const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: ct }));
                docViewerBlobRef.current = blobUrl;
                setDocViewerBlobUrl(blobUrl);
            }

            // Handle versions
            if (versionsRes.status === "fulfilled") {
                setDocViewerVersions(Array.isArray(versionsRes.value) ? versionsRes.value : []);
            }

            // Handle latest
            if (latestRes.status === "fulfilled") {
                const latestArr = Array.isArray(latestRes.value) ? latestRes.value : [latestRes.value];
                // Find the one matching this drawing name or just use first
                const match = latestArr.find((l: any) => l?.drawing_name === doc.title) || latestArr[0];
                setDocViewerLatest(match || null);
            }

            toast.dismiss(toastId);
        } catch {
            toast.error("Failed to open document.", { id: toastId });
        } finally {
            setDocViewerLoading(false);
        }
    };

    const handleCloseDocViewer = () => {
        setIsDocViewerOpen(false);
        // Delay revoke so iframe can finish unloading
        setTimeout(() => {
            if (docViewerBlobRef.current) {
                window.URL.revokeObjectURL(docViewerBlobRef.current);
                docViewerBlobRef.current = null;
            }
            setDocViewerBlobUrl(null);
            setDocViewerDoc(null);
        }, 500);
    };

    const handleEditClick = (doc: Document) => {
        setEditForm({
            id: doc.id,
            title: doc.title || "",
            document_type: doc.document_type || "Other",
            remarks: doc.remarks || "",
            version: doc.version || "v1.0",
            status: doc.status || "PENDING",
            date: (doc as any).date || "",
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
            if (mainTab === "Drawings") {
                // PUT /api/v1/drawings/{id} — application/json
                await drawingService.updateDrawing(editForm.id, {
                    drawing_name: editForm.title,
                    version: editForm.version,
                    date: editForm.date || null,
                    remarks: editForm.remarks || null,
                });
            } else {
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
            }
            toast.success("Updated successfully!", { id: toastId });
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
            if (mainTab === "Drawings") {
                await drawingService.deleteDrawing(deleteId);
                toast.success("Drawing deleted.");
            } else {
                await documentService.deleteDocument(deleteId);
                toast.success("Document deleted.");
            }
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
            // Documents tab: show all items in repository
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
            
            return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
        });
    }, [docs, mainTab, categoryFilter, searchTerm, sortOrder]);



    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    // ─── Styles ──────────────────────────────────────────────────────
    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

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
                        <ProjectSelector variant="page" />
                        <button
                            onClick={fetchDocs}
                            disabled={isLoading || !selectedProjectId}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-200 bg-white shadow-sm disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                        {/* <button
                            onClick={() => setIsFolderModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <FolderPlus className="w-4 h-4 text-indigo-500" />
                            New Folder
                        </button> */}
                        <button
                            onClick={() => {
                                const type = mainTab === "Drawings" ? "Drawing" : "Document";
                                setUploadForm({ title: "", document_type: type, remarks: "", version: "", date: "", parent_id: null });
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

                {!selectedProjectId ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <Folder className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium font-inter">Select a project above to view documents.</p>
                    </div>
                ) : (
                    <>
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
                                {
                                    title: "Total Storage",
                                    value: stats ? (stats.total_storage_bytes >= 1048576 ? `${(stats.total_storage_bytes / 1024 / 1024).toFixed(1)} MB` : stats.total_storage_bytes >= 1024 ? `${(stats.total_storage_bytes / 1024).toFixed(1)} KB` : `${stats.total_storage_bytes} B`) : "...",
                                    sub: `${stats?.total_storage_gb || 0} GB used of 10 GB`,
                                    accent: "text-primary",
                                    icon: <FileText className="w-5 h-5" />,
                                    bg: "bg-primary/10 text-primary"
                                },
                                {
                                    title: "Pending Approval",
                                    value: docs.filter(d => !d.is_folder && ["PENDING", "UNDER_REVIEW"].includes(String(d.status).toUpperCase())).length.toString(),
                                    sub: mainTab === "Drawings" ? "Drawings awaiting review" : "Documents awaiting review",
                                    accent: "text-amber-500",
                                    icon: <RefreshCcw className="w-5 h-5 text-amber-500" />,
                                    bg: "bg-amber-50 text-amber-600"
                                },
                                {
                                    title: mainTab === "Drawings" ? "Total Drawings" : "Total Documents",
                                    value: docs.length.toString(),
                                    sub: mainTab === "Drawings" ? "Total drawings in repository" : "Total files in repository",
                                    accent: "text-emerald-500",
                                    icon: <FileText className="w-5 h-5 text-emerald-500" />,
                                    bg: "bg-emerald-50 text-emerald-600"
                                },
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
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
                                    <SortDropdown value={sortOrder} onChange={setSortOrder} />
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
                                            <th className="px-6 py-4">{mainTab === "Drawings" ? "Drawing Name" : "Document Name"}</th>
                                            <th className="px-6 py-4">{mainTab === "Drawings" ? "Drawing Type" : "Category"}</th>
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
                                            <>
                                                {paginated.map((doc) => {
                                                    const ft = getFileType(doc);
                                                    return (
                                                        <tr
                                                            key={doc.id}
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
                                                                    <div className="max-w-[250px]">
                                                                        <p className="text-sm font-bold text-slate-800 break-words whitespace-normal">{doc.title}</p>
                                                                        <p className="text-[10px] text-slate-400 font-medium break-words whitespace-normal mt-0.5">{doc.remarks || "—"}</p>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                                                                    {doc.document_type || (doc.is_folder ? "Folder" : "File")}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" : doc.status === "REJECTED" ? "bg-rose-100 text-rose-600" : doc.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
                                                                    {doc.status ? doc.status.replace("_", " ") : "PENDING"}
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
                                                                                onClick={() => handleViewDocumentFile(doc)}
                                                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                                title="View File"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                            {mainTab === "Drawings" && (
                                                                                <button
                                                                                    onClick={() => handleViewHistory(doc)}
                                                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                                                    title="Approval History"
                                                                                >
                                                                                    <History className="w-4 h-4" />
                                                                                </button>
                                                                            )}
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
                                                        </tr>
                                                    );
                                                })}
                                            </>
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
                    </>
                )}
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

                    {mainTab === "Drawings" ? (
                        // ── Drawings tab fields: drawing_name, version, date, remarks, file ──
                        <>
                            <div>
                                <label className={labelCls}>Drawing Name <span className="text-rose-500">*</span></label>
                                <input value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. Foundation Drawing Rev-2" className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Version <span className="text-rose-500">*</span></label>
                                    <input value={uploadForm.version} onChange={e => setUploadForm(p => ({ ...p, version: e.target.value }))}
                                        placeholder="e.g. V1" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Date</label>
                                    <input type="date" value={uploadForm.date}
                                        onChange={e => setUploadForm(p => ({ ...p, date: e.target.value }))}
                                        className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Remarks</label>
                                <textarea value={uploadForm.remarks} onChange={e => setUploadForm(p => ({ ...p, remarks: e.target.value }))}
                                    placeholder="Optional notes..." rows={2} className={inputCls + " resize-none"} />
                            </div>
                        </>
                    ) : (
                        // ── Documents tab fields: title, document_type, parent_id, remarks, file ──
                        <>
                            <div>
                                <label className={labelCls}>Document Title</label>
                                <input value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. Site Contract 2026" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Document Type</label>
                                <select value={uploadForm.document_type} onChange={e => setUploadForm(p => ({ ...p, document_type: e.target.value }))} className={inputCls}>
                                    <option value="">Select Type</option>
                                    {DOC_TYPES.filter(t => t !== "Drawing").map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Parent Folder ID</label>
                                <input type="number" value={uploadForm.parent_id ?? ""}
                                    onChange={e => setUploadForm(p => ({ ...p, parent_id: e.target.value ? Number(e.target.value) : null }))}
                                    placeholder="Optional folder ID" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Remarks</label>
                                <textarea value={uploadForm.remarks} onChange={e => setUploadForm(p => ({ ...p, remarks: e.target.value }))}
                                    placeholder="Optional notes..." rows={2} className={inputCls + " resize-none"} />
                            </div>
                        </>
                    )}

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

            {/* ─── Document Viewer Modal (Engineer-style card) ───────────── */}
            <Modal
                isOpen={isDocViewerOpen}
                onClose={handleCloseDocViewer}
                title="Document Preview"
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-5">
                        <button
                            onClick={handleCloseDocViewer}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                            Close
                        </button>
                        {docViewerDoc && (
                            <button
                                onClick={() => handleDownload(docViewerDoc)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </button>
                        )}
                    </div>
                }
            >
                {docViewerDoc && (() => {
                    const fileUrl = docViewerDoc.file_url || "";
                    const lowerUrl = fileUrl.toLowerCase();
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif)$/i.test(lowerUrl);
                    const isPdf = lowerUrl.endsWith(".pdf");
                    const fileType = docViewerDoc.document_type || (isImage ? "Drawing" : isPdf ? "PDF Document" : "File");

                    return (
                        <div>
                            {/* Blue Header */}
                            <div className="bg-primary mx-5 mt-2 mb-5 rounded-2xl p-5 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                                        <FileText className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold tracking-tight">{docViewerDoc.title}</h3>
                                            {docViewerDoc.version && (
                                                <span className="px-2 py-0.5 bg-white/25 rounded-lg text-[10px] font-black uppercase tracking-widest">{docViewerDoc.version}</span>
                                            )}
                                        </div>
                                        <p className="text-white/70 text-[11px] font-bold">
                                            🗓 Added on {docViewerDoc.uploaded_at ? new Date(docViewerDoc.uploaded_at).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Two-panel body */}
                            <div className="flex gap-0 px-5 pb-4">
                                {/* Left: Metadata */}
                                <div className="w-48 shrink-0 pr-6 border-r border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                                        <span>ⓘ</span> File Metadata
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">File Type</p>
                                            <p className="text-sm font-bold text-slate-800">{fileType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Linked Project</p>
                                            <p className="text-sm font-bold text-slate-800">{docViewerDoc.project_name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                            <p className="text-sm font-bold text-slate-800">{docViewerDoc.status || "PENDING"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Storage Location</p>
                                            <p className="text-sm font-bold text-slate-800">Secure Vault / Project Files</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remarks</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{docViewerDoc.remarks || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Content Preview */}
                                <div className="flex-1 pl-6">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                                        <span>⊟</span> Content Preview
                                    </p>
                                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative" style={{ minHeight: 320 }}>
                                        {docViewerLoading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 gap-3">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fetching Secure Preview...</p>
                                            </div>
                                        ) : null}

                                        {isImage && docViewerBlobUrl ? (
                                            <img
                                                src={docViewerBlobUrl}
                                                alt={docViewerDoc.title}
                                                className="w-full h-full object-contain max-h-[400px]"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        ) : isPdf && docViewerBlobUrl ? (
                                            <iframe
                                                src={docViewerBlobUrl}
                                                title={docViewerDoc.title}
                                                className="w-full"
                                                style={{ height: 400, border: "none" }}
                                            />
                                        ) : docViewerBlobUrl ? (
                                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                                                <FileText className="w-16 h-16 text-indigo-200" />
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-700">Preview not natively supported</p>
                                                    <p className="text-[10px] text-slate-400 max-w-xs text-center truncate mt-1">{fileUrl}</p>
                                                </div>
                                                <button
                                                    onClick={() => docViewerDoc && handleDownload(docViewerDoc)}
                                                    className="px-6 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Download to View
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-300">
                                                <FileText className="w-12 h-12" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No preview available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Edit Document Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditFile(null); }}
                title={mainTab === "Drawings" ? "Edit Drawing Details" : "Edit Document Details"}
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
                        <label className={labelCls}>{mainTab === "Drawings" ? "Drawing Name" : "Document Title"} <span className="text-rose-500">*</span></label>
                        <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Revised Drawing" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {mainTab !== "Drawings" && (
                            <div>
                                <label className={labelCls}>Document Type</label>
                                <select value={editForm.document_type} onChange={e => setEditForm(p => ({ ...p, document_type: e.target.value }))} className={inputCls}>
                                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className={labelCls}>Version</label>
                            <input value={editForm.version} onChange={e => setEditForm(p => ({ ...p, version: e.target.value }))}
                                placeholder="v1.0" className={inputCls} />
                        </div>
                    </div>
                    {mainTab !== "Drawings" && (
                        <div>
                            <label className={labelCls}>Status</label>
                            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className={labelCls}>Remarks</label>
                        <textarea value={editForm.remarks} onChange={e => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                            placeholder="Update notes..." rows={3} className={inputCls + " resize-none"} />
                    </div>
                    {mainTab !== "Drawings" && (
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
                    )}
                </div>
            </Modal>

            {/* Approval History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Drawing Approval History"
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
