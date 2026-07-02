import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { drawingService } from "../../services/drawingService";
import { documentService } from "../../services/documentService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import {
  Loader2,
  FileText,
  Search,
  Eye,
  RefreshCcw,
  CheckCircle,
  Download,
  History,
  ChevronLeft,
  ChevronRight,
  Folder,
} from "lucide-react";
import toast from "react-hot-toast";
import DocumentPreviewModal from "../../components/dashboard/DocumentPreviewModal";

interface DrawingRecord {
  id: number;
  project_id: number;
  drawing_name: string;
  version: string;
  date: string;
  remarks: string;
  file_url: string;
  approval_status: string;
  approval_id: number | null;
  is_folder: boolean;
  type: string;
  project_name: string;
}

const getBaseUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL || "";
  if (apiURL.startsWith("http")) {
    return apiURL.replace(/\/api\/v1\/?$/, "");
  }
  return window.location.origin;
};

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState<"Drawings" | "Documents">("Drawings");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [apiDrawings, setApiDrawings] = useState<any[]>([]);
  const [apiDocs, setApiDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDocsFromApi, setTotalDocsFromApi] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number; name: string }[]>([]);

  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDrawingHistory, setSelectedDrawingHistory] = useState<any>(null);

  const { projectId } = useClientProjectId();

  const buildFileUrl = (file_url: string) => {
    if (!file_url) return "";
    const normalizedUrl = file_url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('http')) return normalizedUrl;
    const path = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;

    let baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl.startsWith('http')) {
      baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    } else {
      baseUrl = window.location.origin;
    }
    return `${baseUrl}${path}`;
  };

  const handleDownload = async (doc: any) => {
    if (!doc) return;
    const toastId = toast.loading(`Preparing ${doc.drawing_name || doc.name || doc.title || 'document'}...`);
    try {
      let file_url = doc.file_url;
      if (doc.id && doc.type !== "Drawing") {
        try {
          const data = await documentService.getDownloadUrl(doc.id);
          if (data?.file_url) {
            file_url = data.file_url;
          }
        } catch (e) {
          console.warn("Failed to fetch fresh download URL, falling back to cached URL");
        }
      }

      if (!file_url) throw new Error("Source path unavailable");

      const fullUrl = buildFileUrl(file_url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;

      const response = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      const extension = file_url.replace(/\\/g, '/').split('.').pop()?.split('?')[0] || '';
      const downloadName = (doc.name || doc.drawing_name || 'document').toLowerCase().endsWith(`.${extension.toLowerCase()}`)
          ? (doc.name || doc.drawing_name || 'document')
          : `${doc.name || doc.drawing_name || 'document'}.${extension}`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started", { id: toastId });
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    }
  };

  const handleView = async (doc: any) => {
    if (!doc.id && !doc.file_url) return;
    setFetchingDetail(true);
    setIsPreviewOpen(true);
    try {
      let file_url = doc.file_url;
      let currentDoc = doc;

      if (doc.id && doc.type !== "Drawing") {
        try {
          const detail = await documentService.getDocument(doc.id);
          if (detail) {
            currentDoc = detail;
            file_url = detail.file_url;
          }
        } catch (e) {
          console.warn("Failed to fetch fresh metadata, using list data");
        }
      }

      if (!file_url) throw new Error("No file path");

      const fullUrl = buildFileUrl(file_url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;

      const response = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get("content-type") || 'application/pdf';
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setSelectedPreview({ 
        ...currentDoc, 
        name: currentDoc.drawing_name || currentDoc.title || currentDoc.name || "Preview", 
        previewUrl: blobUrl, 
        previewType: contentType, 
        fullUrl, 
        remarks: currentDoc.remarks, 
        uploaded_at: currentDoc.uploaded_at || currentDoc.date, 
        project_name: currentDoc.project_name || currentDoc.projectName, 
        file_size: currentDoc.file_size,
        type: doc.type
      });
    } catch (err: any) {
      console.error("View failed:", err);
      const baseUrl = getBaseUrl();
      const fallbackUrl = doc.file_url?.startsWith('http') ? doc.file_url : `${baseUrl}/${doc.file_url?.replace(/^\//, '')}`;
      setSelectedPreview({ ...doc, previewUrl: fallbackUrl, previewType: null, fullUrl: fallbackUrl });
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleFolderClick = (folder: any) => {
    setCurrentFolderId(Number(folder.id));
    setCurrentFolderName(folder.drawing_name);
    setFolderPath(prev => [...prev, { id: Number(folder.id), name: folder.drawing_name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolderId(newPath[newPath.length - 1].id);
      setCurrentFolderName(newPath[newPath.length - 1].name);
      setFolderPath(newPath);
    }
  };

  const handleViewHistory = async (drawing: any) => {
    const toastId = toast.loading("Fetching approval history...");
    try {
      const history = await drawingService.getApprovalHistory(drawing.id);
      setApprovalHistory(history);
      setSelectedDrawingHistory(drawing);
      setIsHistoryModalOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Failed to fetch history", { id: toastId });
    }
  };

  const fetchDrawingHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [versionsResult, docsResult] = await Promise.allSettled([
        drawingService.getVersions(projectId),
        documentService.listDocuments({ 
            project_id: projectId,
            parent_id: currentFolderId,
            limit: 100
        })
      ]);

      if (versionsResult.status === 'fulfilled') {
        const versions = Array.isArray(versionsResult.value) ? versionsResult.value : (versionsResult.value as any).items || [];
        setApiDrawings(versions);
      }

      if (docsResult.status === 'fulfilled') {
        const resValue = docsResult.value as any;
        const docs = Array.isArray(resValue) ? resValue : resValue.items || resValue.data || resValue.documents || [];
        setApiDocs(docs);
        // Use the backend's total count which includes all docs across all folders
        if (resValue?.meta?.total != null) {
          setTotalDocsFromApi(resValue.meta.total);
        } else {
          setTotalDocsFromApi(null);
        }
      }
    } catch (err: any) {
      console.error(">>> Failed to fetch vault repo:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentFolderId]);

  useEffect(() => {
    if (projectId) {
      fetchDrawingHistory();
      setCurrentPage(1);
    }
  }, [projectId, currentFolderId, fetchDrawingHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const drawingData = useMemo(() => {
    const drawingDocsMapped = apiDrawings.map((d: any) => ({
      id: d.id,
      project_name: d.project_name || "—",
      drawing_name: d.drawing_name || d.title,
      type: "Drawing",
      date: d.date ? d.date.split('T')[0] : "—",
      version: d.version || "V1.0",
      file_size: null,
      file_url: d.file_url || d.upload_file || "",
      approval_status: d.approval_status || "Pending",
      approval_id: d.approval_id,
      is_folder: false,
      remarks: d.remarks || ""
    }));

    const otherDocsMapped = apiDocs
      .filter(d => (d.document_type || d.type || "").toLowerCase() !== "invoice")
      .map((d) => {
        const name = d.title || d.name || "Untitled Document";
        const isFolder = d.is_folder || d.document_type === "folder";
        return {
          id: d.id,
          project_name: d.project_name || "—",
          drawing_name: name,
          type: isFolder ? "Folder" : (d.document_type || "Document"),
          date: d.created_at || d.uploaded_at ? new Date(d.created_at || d.uploaded_at).toISOString().split('T')[0] : "—",
          version: d.version || "V1.0",
          file_size: d.file_size || null,
          file_url: d.file_url || "",
          approval_status: d.status || d.approval_status || "Pending",
          approval_id: null,
          is_folder: isFolder,
          remarks: d.remarks || ""
        };
      });

    return [...drawingDocsMapped, ...otherDocsMapped].sort((a, b) => b.id - a.id);
  }, [apiDrawings, apiDocs]);

  const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|sketch)$/i;

  const filteredDrawings = useMemo(() => {
    let data = drawingData;

    // Apply type tab filter
    if (activeTab === "Drawings") {
      // Only drawings/images + folders
      data = data.filter(d => {
        if (d.is_folder) return true;
        const url = (d.file_url || "").toLowerCase();
        return IMAGE_EXTS.test(url) || d.type === "Drawing";
      });
    } else if (activeTab === "Documents") {
      // All files EXCEPT images + folders
      data = data.filter(d => {
        if (d.is_folder) return true;
        const url = (d.file_url || "").toLowerCase();
        return !IMAGE_EXTS.test(url) && d.type !== "Drawing";
      });
    }

    // Apply search query
    let result = data.filter(d =>
      (d.drawing_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(d.id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      if (dateA !== dateB) {
        return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
      }
      return b.id - a.id;
    });

    return result;
  }, [drawingData, searchQuery, activeTab, sortOrder]);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDrawings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDrawings, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    let allCount = 0;
    let docsCount = 0;
    let drawingsCount = 0;
    let pendingCount = 0;

    drawingData.forEach(d => {
      allCount++;
      if (d.is_folder) return;
      const url = (d.file_url || "").toLowerCase();
      const isDrawing = IMAGE_EXTS.test(url) || d.type === "Drawing";
      if (isDrawing) {
        drawingsCount++;
      } else {
        docsCount++;
      }
      const s = (d.approval_status || "").toLowerCase();
      if (s === "pending" || s === "under review" || s === "under_review" || s === "submitted") {
        pendingCount++;
      }
    });

    return {
      all: allCount,
      documents: docsCount,
      drawings: drawingsCount,
      pending: pendingCount
    };
  }, [drawingData]);

  const totalStorageBytes = useMemo(() => {
    return apiDocs.reduce((acc, d) => acc + (d.file_size || 0), 0);
  }, [apiDocs]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Navbar title="Drawings & Documents" breadcrumb={["Client", "Document Vault", "Blueprints"]} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Engineering Document Vault</h1>
            <p className="text-slate-500 text-sm font-inter">Centralized repository for structural blueprints and technical revisions.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={fetchDrawingHistory}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:rotate-180 duration-500 disabled:opacity-50 font-inter"
              title="Refresh Vault"
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Stat Cards */}
        {activeTab === "Documents" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Documents</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {totalDocsFromApi != null ? totalDocsFromApi : stats.documents}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1">All Vault Assets</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500 tracking-tight">{stats.pending}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1">Awaiting Review</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Storage Used</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-500 tracking-tight">{formatBytes(totalStorageBytes)}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1">Total Consumption</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">All Files</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.all}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1">Total Assets</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Drawings</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500 tracking-tight">{stats.drawings}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1">Images & CAD</span>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 md:mb-8 max-w-full overflow-x-auto scrollbar-none font-inter">
          <button
            onClick={() => { setActiveTab("Drawings"); setCurrentPage(1); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Drawings" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Drawings List
          </button>
          <button
            onClick={() => { setActiveTab("Documents"); setCurrentPage(1); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Documents" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Documents List
          </button>
        </div>

        {/* Content Vault Dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            {/* Search */}
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by document name or ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
              />
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1 font-inter">
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value as "latest" | "oldest"); setCurrentPage(1); }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Breadcrumbs for folder navigation */}
          {folderPath.length > 0 && activeTab === "Documents" && (
            <div className="flex items-center gap-2 mt-4 px-4 pb-2">
              <button 
                onClick={() => handleBreadcrumbClick(folderPath.length - 2)} 
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors mr-2 border border-slate-200 shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button onClick={() => handleBreadcrumbClick(-1)} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">Root Vault</button>
              {folderPath.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <button onClick={() => handleBreadcrumbClick(idx)} className={`text-xs font-bold transition-colors ${idx === folderPath.length - 1 ? "text-slate-800" : "text-slate-500 hover:text-primary"}`}>
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter mt-2">
            <table className="w-full text-left font-inter min-w-[1200px]">
              {activeTab === "Documents" ? (
                <>
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter whitespace-nowrap">
                      <th className="px-4 py-4">project_name</th>
                      <th className="px-4 py-4">title</th>
                      <th className="px-4 py-4">document_type</th>
                      <th className="px-4 py-4">version</th>
                      <th className="px-4 py-4">status</th>
                      <th className="px-4 py-4">uploaded_at</th>
                      <th className="px-4 py-4">remarks</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-inter whitespace-nowrap">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-20 text-center font-inter">
                          <div className="flex flex-col items-center gap-3 font-inter">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing vault intelligence...</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedDocs.length > 0 ? (
                      paginatedDocs.map((drawing: any, index) => (
                        <tr key={`doc_${drawing.id}_${index}`} className="hover:bg-slate-50/50 transition-colors group font-inter text-[11px] font-medium text-slate-600">
                          <td className="px-4 py-3">{drawing.project_name}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {drawing.is_folder ? (
                              <button onClick={() => handleFolderClick(drawing)} className="text-indigo-600 hover:underline">{drawing.drawing_name}</button>
                            ) : (
                              drawing.drawing_name
                            )}
                          </td>
                          <td className="px-4 py-3">{drawing.type !== undefined ? String(drawing.type) : "null"}</td>
                          <td className="px-4 py-3">{drawing.version}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {drawing.approval_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{drawing.date || "null"}</td>
                          <td className="px-4 py-3 truncate max-w-[150px]" title={drawing.remarks}>{drawing.remarks || "null"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-inter">
                              <button onClick={() => handleView(drawing)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {!drawing.is_folder && (
                                <button onClick={() => handleDownload(drawing)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download File">
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                          No documents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                      <th className="px-6 py-4 font-inter">Asset</th>
                      <th className="px-6 py-4 font-inter">Engineering Asset</th>
                      <th className="px-6 py-4 font-inter">Version Profile</th>
                      <th className="px-4 py-4 font-inter">Approval Status</th>
                      <th className="px-6 py-4 font-inter">Vault Date</th>
                      <th className="px-6 py-4 text-right font-inter">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-inter">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center font-inter">
                          <div className="flex flex-col items-center gap-3 font-inter">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing vault intelligence...</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedDocs.length > 0 ? (
                      paginatedDocs.map((drawing, index) => (
                        <tr key={`${drawing.type}_${drawing.id}_${index}`} className="hover:bg-slate-50/50 transition-colors group font-inter">
                          <td className="px-6 py-4 font-inter">
                            {(() => {
                              if (drawing.is_folder) {
                                return (
                                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">DIR</span>
                                    <Folder className="w-5 h-5 text-indigo-500" />
                                  </div>
                                );
                              }

                              const fileUrl = (drawing.file_url || "").toLowerCase();
                              const isPdf = fileUrl.endsWith(".pdf");
                              const isDoc = fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx");
                              const isExcel = fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx") || fileUrl.endsWith(".csv");
                              const isDwg = fileUrl.endsWith(".dwg") || fileUrl.endsWith(".dxf");
                              const isImage = IMAGE_EXTS.test(fileUrl);

                              if (isPdf) return (
                                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none">PDF</span>
                                  <FileText className="w-5 h-5 text-rose-500" />
                                </div>
                              );
                              if (isDoc) return (
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">DOC</span>
                                  <FileText className="w-5 h-5 text-blue-500" />
                                </div>
                              );
                              if (isExcel) return (
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">XLS</span>
                                  <FileText className="w-5 h-5 text-emerald-500" />
                                </div>
                              );
                              if (isDwg) return (
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">DWG</span>
                                  <FileText className="w-5 h-5 text-amber-500" />
                                </div>
                              );
                              if (isImage) return (
                                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                  <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">IMG</span>
                                  <FileText className="w-5 h-5 text-purple-500" />
                                </div>
                              );
                              return (
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center font-inter">
                                  <FileText className="w-6 h-6 text-slate-400" />
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <div className="flex flex-col font-inter">
                              {drawing.is_folder ? (
                                <button
                                  onClick={() => handleFolderClick(drawing)}
                                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 text-left hover:underline font-inter w-fit"
                                >
                                  {drawing.drawing_name}
                                </button>
                              ) : (
                                <span onClick={() => handleView(drawing)} className="text-sm font-bold text-slate-800 font-inter hover:text-blue-600 hover:underline cursor-pointer">{drawing.drawing_name}</span>
                              )}
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">
                                {drawing.file_url || (drawing.is_folder ? "Directory" : "Cloud Sync")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className="px-2.5 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-lg uppercase tracking-widest border border-slate-200 font-inter">
                              {drawing.version}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-inter">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border w-fit font-inter ${drawing.approval_status === "Approved"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : drawing.approval_status === "Pending"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>
                              {drawing.approval_status || "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className="text-xs font-bold text-slate-500 font-inter">{drawing.date}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-inter">
                            <div className="flex items-center justify-end gap-1.5 font-inter">
                              <button onClick={() => handleView(drawing)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {!drawing.is_folder && (
                                <>
                                  <button onClick={() => handleDownload(drawing)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-inter" title="Download File">
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <div className="flex items-center gap-1 border-l border-slate-100 pl-2 ml-1">
                                    <button onClick={() => handleViewHistory(drawing)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all font-inter" title="View approval history">
                                      <History className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                          No technical blueprints found in the project vault.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredDrawings.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
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
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDrawings.length)} of {filteredDrawings.length} records
              </div>

              {/* Right: Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const totalItems = filteredDrawings.length;
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
                    const pageNum = page as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
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
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredDrawings.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.max(1, Math.ceil(filteredDrawings.length / itemsPerPage)) || filteredDrawings.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Document Preview Modal ──────────────────────────────────────────────────────── */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedPreview(null);
        }}
        document={selectedPreview ? {
          ...selectedPreview,
          name: selectedPreview.drawing_name || selectedPreview.title || selectedPreview.name || "Preview",
          type: selectedPreview.type || "Document",
          project: selectedPreview.project_name || selectedPreview.projectName || "General",
          date: new Date(selectedPreview.uploaded_at || selectedPreview.date).toLocaleDateString(),
          isFolder: selectedPreview.is_folder || selectedPreview.type === "Folder",
          status: selectedPreview.status || selectedPreview.approval_status || "Pending",
          file_url: buildFileUrl(selectedPreview.file_url || "")
        } : null}
        onDownload={handleDownload}
      />

      {/* ── History Modal ────────────────────────────────────────────────────────── */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => { setIsHistoryModalOpen(false); setSelectedDrawingHistory(null); }} title="Approval History" maxWidth="max-w-2xl">
        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden font-inter">
          <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between font-inter">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-inter">{selectedDrawingHistory?.drawing_name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-inter">Version: {selectedDrawingHistory?.version}</p>
            </div>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto font-inter col-span-12">
            {approvalHistory.length > 0 ? (
              <div className="space-y-4 font-inter relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {approvalHistory.map((historyItem: any, index: number) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active font-inter">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-inter z-10">
                      <CheckCircle className="w-4 h-4 font-inter" />
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

export default ClientDocumentsPage;
