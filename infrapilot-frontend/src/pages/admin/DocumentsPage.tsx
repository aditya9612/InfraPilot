import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import {
  Eye, Download, Trash2, Folder, FileText,
  ChevronRight, Search, Filter, FileImage,
  FileSpreadsheet, FolderPlus, RefreshCcw, History, CheckCircle, Edit2, Upload
} from "lucide-react";
import CreateFolderModal from "../../components/forms/CreateFolderModal";
import DocumentPreviewModal from "../../components/dashboard/DocumentPreviewModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import { documentService } from "../../services/documentService";
import { drawingService } from "../../services/drawingService";
import { projectService } from "../../services/projectService";
import { userService } from "../../services/userService";
import UploadDocumentModal from "../../components/forms/UploadDocumentModal";
import EditDocumentModal from "../../components/forms/EditDocumentModal";
import type { Document, DocumentStats } from "../../types/document";
import SortDropdown from "../../components/common/SortDropdown";
import { motion, AnimatePresence } from "framer-motion";

// --- Helpers ---
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

type TypeFilter = "All" | "Documents" | "Folders";

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [mainTab, setMainTab] = useState<"Drawings" | "Documents">("Drawings");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [uploadType, setUploadType] = useState<string>("General");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [uploaderName, setUploaderName] = useState<string>("");
  const [overallTotalDocs, setOverallTotalDocs] = useState<number | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects(100, 0);
        const list = Array.isArray(data) ? data : (data.items || data.data || []);
        setProjects(list);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  /**
   * Fetches all documents by paginating through the API (max limit=100 per the backend).
   * Returns the flat list of all items and the total count from meta.
   */
  const fetchAllDocuments = async (params: {
    search?: string;
    parent_id?: number | null;
    project_id?: number | null;
  }): Promise<{ items: any[]; total: number }> => {
    const BATCH = 100;
    let offset = 0;
    let total = 0;
    const allItems: any[] = [];

    while (true) {
      const res = await documentService.listDocuments({ ...params, limit: BATCH, offset }) as any;
      const items: any[] = Array.isArray(res) ? res : (res.items || res.data || []);
      const meta = res.meta;
      if (offset === 0 && meta?.total !== undefined) total = meta.total;
      allItems.push(...items);
      if (items.length < BATCH) break; // last page
      offset += BATCH;
    }

    return { items: allItems, total };
  };

  const fetchDocs = useCallback(async (query = "", folderId = currentFolderId) => {
    setIsLoading(true);
    try {
      // Fetch all documents (paginated) + stats + drawings in parallel
      const [docResult, statsData, apiDrawings] = await Promise.all([
        fetchAllDocuments({
          search: query,
          parent_id: folderId,
          ...(selectedProjectId ? { project_id: selectedProjectId } : {})
        }),
        documentService.getStats().catch(() => null),
        // At root level on Drawings tab, also fetch specialized drawings
        (folderId === null && mainTab === "Drawings" && selectedProjectId)
          ? drawingService.getVersions(selectedProjectId).catch(() => [])
          : Promise.resolve([])
      ]);

      // Update overall total from meta
      if (docResult.total > 0) setOverallTotalDocs(docResult.total);

      // Map standard Documents
      const mappedDocs = docResult.items.map((d: any) => ({
        ...d,
        type: d.is_folder ? "Folder" : "Document",
        display_name: d.title
      }));

      // Map specialized Drawings from drawing service
      const mappedDrawings = (apiDrawings as any[]).map((d: any) => ({
        ...d,
        id: d.id,
        title: d.drawing_name,
        display_name: d.drawing_name,
        document_type: "Drawing",
        type: "Drawing",
        uploaded_at: d.created_at || d.date,
        file_url: d.file_url,
        project_name: projects.find(p => p.id === d.project_id)?.project_name || projects.find(p => p.id === d.project_id)?.name || "Project #" + d.project_id
      }));

      const combined = [...mappedDrawings, ...mappedDocs];

      // Client-side search filter (type/tab filtering is in the filteredDocuments useMemo)
      const filtered = query
        ? combined.filter(item => (item.display_name || "").toLowerCase().includes(query.toLowerCase()))
        : combined;

      setDocuments(filtered);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      toast.error("Failed to sync repository");
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, selectedProjectId, projects, mainTab]);

  useEffect(() => {
    fetchDocs(searchTerm);
    setCurrentPage(0);
  }, [fetchDocs, searchTerm, currentFolderId, selectedProjectId, typeFilter, mainTab]);

  useEffect(() => {
    if (!viewingDoc) {
      setPreviewUrl("");
      return;
    }
    // <img> and <iframe> tags load cross-origin URLs without CORS restrictions.
    // No need to fetch/blob — just build the direct URL.
    setPreviewUrl(buildFileUrl(viewingDoc.file_url || ""));
  }, [viewingDoc]);

  const handleViewHistory = async (doc: Document) => {
    const toastId = toast.loading("Fetching approval history...");
    try {
      const history = await drawingService.getApprovalHistory(doc.id);
      setApprovalHistory(history);
      setViewingDoc(doc);
      setIsHistoryModalOpen(true);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error("Failed to fetch history", { id: toastId });
    }
  };

  const handleNewFolder = async (folderData: { title: string; project_id: number; remarks?: string }) => {
    const toastId = toast.loading("Creating folder...");
    try {
      await documentService.createFolder({
        ...folderData,
        parent_id: currentFolderId
      });
      toast.success("Folder created successfully", { id: toastId });
      fetchDocs();
      setIsFolderModalOpen(false);
    } catch (err) {
      toast.error("Failed to create folder", { id: toastId });
    }
  };

  const handleUploadSubmit = async (uploadFormData: FormData) => {
    const file = uploadFormData.get("file") as File;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }
    const toastId = toast.loading("Uploading document...");
    try {
      if (uploadFormData.get("document_type") === "Drawing") {
        const drawingProjectId = parseInt(uploadFormData.get("project_id") as string);
        await drawingService.uploadDrawing({
          project_id: drawingProjectId,
          drawing_name: uploadFormData.get("title") as string,
          version: (uploadFormData.get("version") as string) || "v1.0",
          approved_by: (uploadFormData.get("approved_by") as string) || "Site Engineer",
          date: (uploadFormData.get("date") as string) || new Date().toISOString().split('T')[0],
          remarks: uploadFormData.get("remarks") as string,
          file: uploadFormData.get("file") as File
        });
        // Switch project filter to match the uploaded drawing's project
        // so it appears in the list immediately
        if (drawingProjectId) {
          setSelectedProjectId(drawingProjectId);
        }
      } else {
        await documentService.uploadDocument({
          project_id: parseInt(uploadFormData.get("project_id") as string),
          title: uploadFormData.get("title") as string,
          document_type: uploadFormData.get("document_type") as string,
          parent_id: currentFolderId,
          remarks: uploadFormData.get("remarks") as string,
          file: uploadFormData.get("file") as File
        });
      }
      toast.success("Successful", { id: toastId });
      fetchDocs();
    } catch (err) {
      toast.error("Process failed", { id: toastId });
      throw err;
    }
  };

  const handleUpdateSubmit = async (id: number, data: any) => {
    const toastId = toast.loading("Updating details...");
    try {
      if (editingDoc?.document_type === "Drawing") {
        await drawingService.updateDrawing(id, {
          drawing_name: data.title,
          version: data.version,
          date: data.date,
          remarks: data.remarks
        });
      } else {
        await documentService.updateDocument(id, data);
      }
      toast.success("Details updated successfully", { id: toastId });
      fetchDocs();
    } catch (err) {
      toast.error("Update failed", { id: toastId });
      throw err;
    }
  };

  const handleDelete = async () => {
    if (docToDelete) {
      const doc = documents.find(d => d.id === docToDelete);
      const toastId = toast.loading("Deleting document...");
      try {
        if (doc?.document_type === "Drawing") {
          await drawingService.deleteDrawing(docToDelete);
        } else {
          await documentService.deleteDocument(docToDelete);
        }
        toast.success("Document removed", { id: toastId });
        fetchDocs();
        setIsDeleteModalOpen(false);
        setDocToDelete(null);
      } catch (err) {
        toast.error("Deletion failed", { id: toastId });
      }
    }
  };

  const buildFileUrl = (file_url: string) => {
    if (!file_url) return "";
    // Normalize backslashes to forward slashes for web compatibility
    const normalizedUrl = file_url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('http')) return normalizedUrl;

    // Ensure leading slash for consistency
    const path = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;

    // Robust absolute URL selection:
    // 1. If VITE_API_URL is absolute, use it (removing /api/v1 suffix if present)
    // 2. If VITE_API_URL is relative or missing, fallback to the known production domain
    let baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl.startsWith('http')) {
      baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    } else {
      baseUrl = 'https://infrapilot.in';
    }

    return `${baseUrl}${path}`;
  };

  const handleDownload = async (doc: Document) => {
    const toastId = toast.loading(`Preparing ${doc.title}...`);
    try {
      await documentService.downloadDocument(doc.id, doc.title);
      toast.success("Download started", { id: toastId });
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    }
  };

  const openPreview = async (doc: Document) => {
    setViewingDoc(doc);
    setUploaderName("");
    setIsPreviewModalOpen(true);
    if (doc.uploaded_by_user_id) {
      try {
        const user = await userService.getUserById(doc.uploaded_by_user_id);
        setUploaderName(user.full_name || user.name || `User #${doc.uploaded_by_user_id}`);
      } catch {
        setUploaderName(`User #${doc.uploaded_by_user_id}`);
      }
    }
  };

  const handleFolderClick = (doc: Document) => {
    setCurrentFolderId(doc.id);
    setFolderPath(prev => [...prev, { id: doc.id, name: doc.title }]);
  };

  const handleBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolderId(newPath[newPath.length - 1].id);
      setFolderPath(newPath);
    }
  };

  const filteredDocuments = useMemo(() => {
    let data = documents;

    // Main tab: Drawings vs Documents
    if (mainTab === "Drawings") {
      // Show only drawing-type items and folders
      data = data.filter(d => d.is_folder || (d as any).type === "Drawing" || (d.document_type || "").toLowerCase() === "drawing");
    } else {
      // Show only non-drawing items (documents and folders)
      data = data.filter(d => d.is_folder || ((d as any).type !== "Drawing" && (d.document_type || "").toLowerCase() !== "drawing"));
    }

    // Sub-tab: All, Documents (non-folders), Folders
    if (typeFilter === "Documents") {
      data = data.filter(d => !d.is_folder);
    } else if (typeFilter === "Folders") {
      data = data.filter(d => d.is_folder);
    }

    // Category filter
    if (categoryFilter) {
      data = data.filter(d =>
        d.is_folder || (d.document_type || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Search
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
      const aDate = new Date(a.uploaded_at || 0).getTime();
      const bDate = new Date(b.uploaded_at || 0).getTime();
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [documents, mainTab, typeFilter, categoryFilter, searchTerm, sortOrder]);

  const availableCategories = useMemo(() => {
    const types = documents
      .filter(d => !d.is_folder && d.document_type)
      .map(d => d.document_type as string);
    return Array.from(new Set(types)).sort();
  }, [documents]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const pagedDocuments = filteredDocuments.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <>
      <Navbar title="Document Vault" breadcrumb={["Admin", "Documents", folderPath.length > 0 ? folderPath[folderPath.length - 1].name : "Root"]} />

      <PageTransition className="p-3 sm:p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Document Vault</h1>
            <p className="text-slate-500 text-sm mt-1">
              Centralized repository for drawings, contracts, and project files.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDocs(searchTerm)}
              disabled={isLoading}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-200 bg-white shadow-sm"
              title="Refresh"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all font-semibold"
            >
              <FolderPlus className="w-4 h-4 text-indigo-500" />
              New Folder
            </button>
            <button
              onClick={() => {
                const type = mainTab === "Drawings" ? "Drawing" : "Document";
                setUploadType(type);
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
              onClick={() => { setMainTab(tab); setCategoryFilter(""); setCurrentPage(0); setTypeFilter("All"); }}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${mainTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Storage"
            icon={<FileText className="w-5 h-5" />}
            value={stats ? `${(stats.total_storage_bytes / 1024 / 1024).toFixed(1)} MB` : "..."}
            sub={`${stats?.total_storage_gb || 0} GB used of 10 GB`}
            accent="text-primary"
          />
          <StatCard
            title="Pending Approval"
            icon={<RefreshCcw className="w-5 h-5 text-amber-500" />}
            value={stats ? stats.pending_approvals.toString() : "..."}
            sub="Documents awaiting review"
            accent="text-amber-500"
          />
          <StatCard
            title="Total Documents"
            icon={<FileText className="w-5 h-5 text-emerald-500" />}
            value={
              overallTotalDocs !== null
                ? overallTotalDocs.toString()
                : stats
                  ? stats.total_documents.toString()
                  : "..."
            }
            sub="Total files in repository"
            accent="text-emerald-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] relative">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Project Filter */}
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as TypeFilter); setCategoryFilter(""); }}
                className={`px-3 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${typeFilter !== "All"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
              >
                <option value="All">All</option>
                <option value="Documents">{mainTab === "Drawings" ? "Drawings" : "Documents"}</option>
                <option value="Folders">Folders</option>
              </select>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          {/* Breadcrumbs */}
          {(folderPath.length > 0 || currentFolderId !== null) && (
            <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-50 flex items-center gap-2">
              <button onClick={() => handleBreadcrumb(-1)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Root Vault</button>
              {folderPath.map((f, idx) => (
                <React.Fragment key={f.id}>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <button
                    onClick={() => handleBreadcrumb(idx)}
                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${idx === folderPath.length - 1 ? "text-slate-800" : "text-slate-500 hover:text-primary"}`}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4 w-14">Type</th>
                  <th className="px-6 py-4">{mainTab === "Drawings" ? "Drawing Name" : "Document Name"}</th>
                  <th className="px-6 py-4">{mainTab === "Drawings" ? "Drawing Type" : "Category"}</th>
                  <th className="hidden md:table-cell px-6 py-4">Project Link</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {pagedDocuments.map((doc) => {
                    const ft = getFileType(doc);
                    return (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
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
                              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left cursor-pointer"
                            >
                              {doc.title}
                            </button>
                          ) : (
                            <div
                              onClick={() => openPreview(doc)}
                              className="cursor-pointer"
                            >
                              <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{doc.title}</p>
                              {doc.remarks && (
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">{doc.remarks}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                            {doc.document_type || (doc.is_folder ? "Folder" : "File")}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">{doc.project_name || "General"}</td>
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
                                  onClick={() => {
                                    openPreview(doc);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewHistory(doc)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                  title="View History"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingDoc(doc);
                                    setIsEditModalOpen(true);
                                  }}
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
                              onClick={() => {
                                setDocToDelete(doc.id);
                                setIsDeleteModalOpen(true);
                              }}
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
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {filteredDocuments.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length} records
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-bold"
                title="First Page"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => Math.abs(i - currentPage) <= 1 || i === 0 || i === totalPages - 1)
                .map((i, idx, arr) => (
                  <div key={i} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== i - 1 && (
                      <span className="px-1 text-slate-400 text-[10px]">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${i === currentPage
                        ? "border-slate-200 text-slate-700 bg-white font-inter"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  </div>
                ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-bold"
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>

          {documents.length === 0 && !isLoading && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No documents found in this view.</p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </PageTransition>

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSubmit={handleNewFolder}
      />

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUploadSubmit}
        parentId={currentFolderId}
        preSelectedType={uploadType}
      />

      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDoc(null);
        }}
        document={editingDoc}
        onSubmit={handleUpdateSubmit}
      />

      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setViewingDoc(null);
        }}
        document={viewingDoc ? {
          ...viewingDoc,
          name: viewingDoc.title,
          type: viewingDoc.document_type || "Folder",
          project: viewingDoc.project_name || "General",
          date: new Date(viewingDoc.uploaded_at).toLocaleDateString(),
          isFolder: viewingDoc.is_folder,
          file_url: previewUrl,
          uploaded_by: uploaderName || viewingDoc.uploaded_by_name || "—",
          remarks: viewingDoc.remarks || "—",
          folder_status: viewingDoc.is_folder ? "Folder" : "File",
        } : null}
        onDownload={handleDownload}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDocToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document? This action cannot be undone and the file will be removed from the repository."
        confirmText="Delete Document"
        type="danger"
      />

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => { setIsHistoryModalOpen(false); setViewingDoc(null); }}
        title="Approval History"
        maxWidth="max-w-2xl"
      >
        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden font-inter">
          <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between font-inter">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-inter">{(viewingDoc as any)?.display_name || viewingDoc?.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-inter">Version: {viewingDoc?.version}</p>
            </div>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto font-inter text-slate-800">
            {approvalHistory.length > 0 ? (
              <div className="space-y-4 font-inter relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {approvalHistory.map((historyItem: any, index: number) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active font-inter">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-inter z-10">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm font-inter">
                      <div className="flex items-center justify-between mb-1 font-inter">
                        <div className="font-bold text-slate-800 text-sm font-inter">{historyItem.status || "Status Updated"}</div>
                        <div className="text-[10px] font-bold text-slate-400 font-inter">
                          {new Date(historyItem.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 font-inter">
                        {historyItem.remarks || "No remarks provided."}
                      </div>
                      {(historyItem.requested_by || historyItem.approved_by) && (
                        <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">
                          By: User ID {historyItem.approved_by || historyItem.requested_by}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 font-inter">
                <p className="text-sm font-bold text-slate-500 font-inter">No approval history found for this document.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DocumentsPage;
