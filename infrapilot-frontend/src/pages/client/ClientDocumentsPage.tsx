import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { drawingService } from "../../services/drawingService";
import { documentService } from "../../services/documentService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import toast from "react-hot-toast";
import { RefreshCw, FileDown } from "lucide-react";

interface DrawingDoc {
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
}

const SORT_OPTIONS = ["Latest First", "Oldest First", "Name A-Z", "Name Z-A"];

const getBaseUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL || "";
  if (apiURL.startsWith("http")) return apiURL.replace(/\/api\/v1\/?$/, "");
  return window.location.origin;
};

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Latest First");
  const [apiDrawings, setApiDrawings] = useState<DrawingDoc[]>([]);
  const [apiDocs, setApiDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);

  const { projectId } = useClientProjectId();

  const buildFileUrl = (file_url: string) => {
    if (!file_url) return "";
    const normalizedUrl = file_url.replace(/\\/g, "/");
    if (normalizedUrl.startsWith("http")) return normalizedUrl;
    const path = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
    let baseUrl = import.meta.env.VITE_API_URL || "";
    if (baseUrl.startsWith("http")) baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "");
    else baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  };

  const handleDownload = async (doc: any) => {
    const toastId = toast.loading(`Preparing ${doc.name || doc.title}...`);
    try {
      let file_url = doc.file_url;
      if (doc.id) {
        try {
          const data = await documentService.getDownloadUrl(doc.id);
          if (data?.file_url) file_url = data.file_url;
        } catch (e) {
          console.warn("Fresh URL fetch failed, using cached");
        }
      }
      if (!file_url) throw new Error("Source path unavailable");
      const fullUrl = buildFileUrl(file_url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
      const response = await fetch(fullUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = doc.name || doc.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started", { id: toastId });
    } catch (err: any) {
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
      if (doc.id) {
        try {
          const detail = await documentService.getDocument(doc.id);
          if (detail) { currentDoc = detail; file_url = detail.file_url; }
        } catch (e) {
          console.warn("Fresh metadata failed, using list data");
        }
      }
      if (!file_url) throw new Error("No file path");
      const fullUrl = buildFileUrl(file_url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
      const response = await fetch(fullUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "application/pdf";
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setSelectedPreview({ ...currentDoc, name: currentDoc.title || currentDoc.name || "Preview", previewUrl: blobUrl, previewType: contentType, fullUrl, remarks: currentDoc.remarks, uploaded_at: currentDoc.uploaded_at || currentDoc.date, project_name: currentDoc.project_name, file_size: currentDoc.file_size });
    } catch (err: any) {
      const baseUrl = getBaseUrl();
      const fallbackUrl = doc.file_url?.startsWith("http") ? doc.file_url : `${baseUrl}/${doc.file_url?.replace(/^\//, "")}`;
      setSelectedPreview({ ...doc, previewUrl: fallbackUrl, previewType: null, fullUrl: fallbackUrl });
    } finally {
      setFetchingDetail(false);
    }
  };

  const fetchDrawingHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [versionsResult, docsResult] = await Promise.allSettled([
        drawingService.getVersions(projectId),
        documentService.listDocuments({ project_id: projectId, parent_id: currentFolderId })
      ]);
      if (versionsResult.status === "fulfilled") {
        const versions = Array.isArray(versionsResult.value) ? versionsResult.value : (versionsResult.value as any).items || [];
        setApiDrawings(versions);
      }
      if (docsResult.status === "fulfilled") {
        const docs = Array.isArray(docsResult.value) ? docsResult.value : (docsResult.value as any).items || (docsResult.value as any).data || (docsResult.value as any).documents || [];
        setApiDocs(docs);
      }
    } catch (err: any) {
      console.error("Vault fetch failed:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentFolderId]);

  useEffect(() => {
    if (projectId) { fetchDrawingHistory(); setCurrentPage(1); }
  }, [projectId, currentFolderId, fetchDrawingHistory]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, sortBy]);

  const drawingDocs = apiDrawings.map((d) => ({
    id: d.id, name: d.drawing_name, type: "Drawing" as const,
    uploadDate: d.date ? new Date(d.date).toLocaleDateString("en-GB") : "—",
    rawDate: d.date ? new Date(d.date).getTime() : 0,
    version: d.version || "V1.0", size: "—", file_url: d.file_url || "",
    approval_status: d.approval_status, approval_id: d.approval_id, is_folder: false,
    path: d.file_url || ""
  }));

  const otherDocs = apiDocs
    .filter((d) => (d.document_type || d.type || "").toLowerCase() !== "invoice")
    .map((d) => ({
      id: d.id, name: d.title || d.name || "Untitled Document", type: "Document" as any,
      uploadDate: d.created_at || d.uploaded_at ? new Date(d.created_at || d.uploaded_at).toLocaleDateString("en-GB") : "—",
      rawDate: d.created_at || d.uploaded_at ? new Date(d.created_at || d.uploaded_at).getTime() : 0,
      version: d.version || "V1.0", size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—",
      file_url: d.file_url || "", approval_status: d.status || d.approval_status || "Pending",
      approval_id: null, is_folder: d.is_folder || d.document_type === "folder",
      path: d.file_url || d.title || ""
    }));

  const allVaultDocs = [...drawingDocs, ...otherDocs];

  const filtered = (activeTab === "All" ? allVaultDocs : allVaultDocs.filter((d) => d.type.toLowerCase() === activeTab.toLowerCase()))
    .filter((d) => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "Latest First") return b.rawDate - a.rawDate;
    if (sortBy === "Oldest First") return a.rawDate - b.rawDate;
    if (sortBy === "Name A-Z") return a.name.localeCompare(b.name);
    if (sortBy === "Name Z-A") return b.name.localeCompare(a.name);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedDocs = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    all: allVaultDocs.length,
    documents: allVaultDocs.filter((d) => d.type === "Document").length,
    drawings: allVaultDocs.filter((d) => d.type === "Drawing").length,
  };

  const getExtIcon = (name: string, type: string) => {
    const ext = name?.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return { bg: "bg-red-100", text: "text-red-600", label: "PDF" };
    if (["xls", "xlsx", "csv"].includes(ext)) return { bg: "bg-emerald-100", text: "text-emerald-600", label: ext.toUpperCase() };
    if (["doc", "docx"].includes(ext)) return { bg: "bg-blue-100", text: "text-blue-600", label: "DOC" };
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return { bg: "bg-purple-100", text: "text-purple-600", label: "IMG" };
    if (["dwg", "dxf"].includes(ext)) return { bg: "bg-amber-100", text: "text-amber-600", label: "DWG" };
    if (type === "Drawing") return { bg: "bg-amber-100", text: "text-amber-600", label: "DWG" };
    return { bg: "bg-slate-100", text: "text-slate-500", label: "FILE" };
  };

  const statusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "active" || s === "verified") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (s === "pending" || s === "under review" || s === "under_review" || s === "submitted") return "bg-amber-50 text-amber-600 border-amber-100";
    if (s === "rejected" || s === "rejected") return "bg-red-50 text-red-600 border-red-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
      <div className="p-8 bg-[#f8fafc] min-h-screen font-inter pb-20">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {currentFolderName ? `Vault: ${currentFolderName}` : "Engineering Document Vault"}
            </h1>
            <p className="text-slate-400 font-medium mt-1 text-sm tracking-tight">
              Centralized repository for structural blueprints and technical revisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentFolderId && (
              <button
                onClick={() => { setCurrentFolderId(null); setCurrentFolderName(null); }}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                title="Back to Documents"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
            )}
            <button
              onClick={fetchDrawingHistory}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "ALL FILES", value: stats.all, sub: "Total Assets", color: "text-slate-800", filter: "All" },
            { label: "DOCUMENTS", value: stats.documents, sub: "PDFs, Docs, Excels", color: "text-blue-600", filter: "Document" },
            { label: "DRAWINGS", value: stats.drawings, sub: "Images & CAD", color: "text-amber-500", filter: "Drawing" },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(card.filter)}
              className={`bg-white p-8 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${activeTab === card.filter ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500" : "border-slate-100 shadow-sm hover:shadow-md"}`}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{card.label}</p>
              <h3 className={`text-4xl font-black ${card.color} mb-1 tracking-tighter`}>{loading ? "—" : card.value}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">

          {/* Filter Bar */}
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by document name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-3.5 pl-12 pr-6 text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-1.5">
              {["All", "Documents", "Drawings"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t === "Documents" ? "Document" : t === "Drawings" ? "Drawing" : "All")}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${(activeTab === "All" && t === "All") || (activeTab === "Document" && t === "Documents") || (activeTab === "Drawing" && t === "Drawings") ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Auditing Vault Contents...</p>
              </div>
            ) : paginatedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <svg className="w-14 h-14 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm font-black uppercase tracking-widest">No documents in this category yet</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="p-6 pl-10 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[8%]">Asset</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[38%]">Engineering Asset</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[12%]">Version Profile</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Approval Status</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[12%]">Vault Date</th>
                    <th className="p-6 pr-10 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedDocs.map((doc, i) => {
                    const extIcon = getExtIcon(doc.name, doc.type);
                    return (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-all align-middle">
                        {/* Asset Icon */}
                        <td className="p-6 pl-10">
                          <div className={`w-12 h-12 ${extIcon.bg} rounded-2xl flex items-center justify-center`}>
                            <span className={`text-[10px] font-black ${extIcon.text} tracking-widest`}>{extIcon.label}</span>
                          </div>
                        </td>

                        {/* Engineering Asset */}
                        <td className="p-6">
                          <p className="text-sm font-black text-slate-800 tracking-tight mb-0.5 truncate max-w-sm">{doc.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-sm">{(doc.path || doc.file_url || "").toUpperCase()}</p>
                        </td>

                        {/* Version */}
                        <td className="p-6">
                          <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{doc.version}</span>
                        </td>

                        {/* Approval Status */}
                        <td className="p-6">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${statusStyle(doc.approval_status)}`}>
                            {(doc.approval_status || "Pending").replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>

                        {/* Vault Date */}
                        <td className="p-6">
                          <p className="text-sm font-black text-slate-700 tracking-tight">{doc.uploadDate}</p>
                        </td>

                        {/* Actions */}
                        <td className="p-6 pr-10">
                          <div className="flex items-center justify-end gap-1">
                            {/* View */}
                            <button
                              onClick={() => { if (doc.is_folder) { setCurrentFolderId(doc.id); setCurrentFolderName(doc.name); } else { handleView(doc); } }}
                              className="p-2 text-slate-300 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-lg active:scale-95"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            {/* Download */}
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 text-slate-300 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-lg active:scale-95"
                              title="Download"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-10 py-8 border-t border-slate-50 bg-white mt-auto flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-400 tracking-tight">
                Showing {(currentPage - 1) * itemsPerPage + 1} – {Math.min(sorted.length, currentPage * itemsPerPage)} of {sorted.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${currentPage === p ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedPreview(null); }}
        title={`Vault Record: ${selectedPreview?.name || "Preview"}`}
        maxWidth="max-w-6xl"
      >
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          {fetchingDetail ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Establishing secure stream...</p>
            </div>
          ) : selectedPreview?.previewUrl ? (
            selectedPreview.previewType?.startsWith("image/") ? (
              <div className="flex items-center justify-center h-[75vh] bg-slate-900">
                <img src={selectedPreview.previewUrl} alt={selectedPreview.name} className="max-h-full max-w-full object-contain rounded-2xl" />
              </div>
            ) : selectedPreview.previewType ? (
              <iframe src={selectedPreview.previewUrl} className="w-full h-[75vh]" title="Document Preview" />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-800 text-slate-400 p-12 text-center">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-white">Stream Unavailable</h3>
                <p className="text-xs font-bold max-w-xs mb-8">This file format doesn't support direct streaming. Use the button below to open or download.</p>
                <button onClick={() => window.open(selectedPreview.fullUrl, "_blank")} className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all">
                  Try Native Browser Preview
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Failed to stream document</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Version: {selectedPreview?.version}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Status: {selectedPreview?.approval_status || "Archived"}</span>
            {selectedPreview?.project_name && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Project: {selectedPreview.project_name}</span>}
            {selectedPreview?.uploaded_at && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Uploaded: {new Date(selectedPreview.uploaded_at).toLocaleDateString()}</span>}
          </div>
          {selectedPreview?.remarks && (
            <div className="w-full bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Remarks & Annotations</p>
              <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{selectedPreview.remarks}</p>
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={() => handleDownload(selectedPreview)} className="px-6 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">Download</button>
            <button onClick={() => setIsPreviewOpen(false)} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">Exit</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientDocumentsPage;
