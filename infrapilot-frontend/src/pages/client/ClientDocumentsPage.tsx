import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { drawingService } from "../../services/drawingService";
import { documentService } from "../../services/documentService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import toast from "react-hot-toast";

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

const tabs = ["All", "Document", "Drawing"];

/**
 * Intelligent Base URL resolver
 * - Uses VITE_API_URL if it's an absolute URL
 * - Fallback to window.location.origin for proxy-based environments
 */
const getBaseUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL || "";
  if (apiURL.startsWith("http")) {
    return apiURL.replace(/\/api\/v1\/?$/, "");
  }
  return window.location.origin;
};

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiDrawings, setApiDrawings] = useState<DrawingDoc[]>([]);
  const [apiDocs, setApiDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);

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
    const toastId = toast.loading(`Preparing ${doc.name || doc.title}...`);
    try {
      let file_url = doc.file_url;

      // Always try to get a fresh download URL from the new API if ID is available
      if (doc.id) {
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
      link.download = doc.name || doc.title || "document";
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

      if (doc.id) {
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
        name: currentDoc.title || currentDoc.name || "Preview",
        previewUrl: blobUrl,
        previewType: contentType,
        fullUrl: fullUrl,
        // Ensure new API fields are captured
        remarks: currentDoc.remarks,
        uploaded_at: currentDoc.uploaded_at || currentDoc.date,
        project_name: currentDoc.project_name,
        file_size: currentDoc.file_size
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

  const handleBack = () => {
    setCurrentFolderId(null);
    setCurrentFolderName(null);
  };

  const fetchDrawingHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [versionsResult, latestResult, docsResult] = await Promise.allSettled([
        drawingService.getVersions(projectId),
        drawingService.getLatest(projectId),
        documentService.listDocuments({ 
            project_id: projectId,
            parent_id: currentFolderId
        })
      ]);

      if (versionsResult.status === 'fulfilled') {
        const versions = Array.isArray(versionsResult.value) ? versionsResult.value : (versionsResult.value as any).items || [];
        setApiDrawings(versions);
      }

      if (latestResult.status === 'fulfilled' && latestResult.value) {
        // Latest result is fetched but currently unused in this view
      }

      if (docsResult.status === 'fulfilled') {
        const docs = Array.isArray(docsResult.value) ? docsResult.value : (docsResult.value as any).items || (docsResult.value as any).data || (docsResult.value as any).documents || [];
        setApiDocs(docs);
      }
    } catch (err: any) {
      console.error(">>> Failed to fetch vault repo:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchDrawingHistory();
      setCurrentPage(1);
    }
  }, [projectId, currentFolderId, fetchDrawingHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const drawingDocs = apiDrawings.map((d) => ({
    id: d.id,
    name: d.drawing_name,
    type: "Drawing" as const,
    uploadDate: d.date ? new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    version: d.version || "v1",
    size: "—",
    file_url: d.file_url || "",
    approval_status: d.approval_status,
    approval_id: d.approval_id,
    is_folder: false,
  }));

  const otherDocs = apiDocs
    .filter(d => (d.document_type || d.type || "").toLowerCase() !== "invoice")
    .map((d) => {
      return {
        id: d.id,
        name: d.title || d.name || "Untitled Document",
        type: "Document" as any,
        uploadDate: d.created_at || d.uploaded_at ? new Date(d.created_at || d.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        version: d.version || "Original",
        size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—",
        file_url: d.file_url || "",
        approval_status: d.status || d.approval_status || "Archived",
        approval_id: null,
        is_folder: d.is_folder || d.document_type === 'folder'
      };
    });

  const allVaultDocs = [...drawingDocs, ...otherDocs].sort((a, b) => b.id - a.id);
  const filteredDocs = (activeTab === "All" ? allVaultDocs : allVaultDocs.filter((d) => d.type.toLowerCase() === activeTab.toLowerCase()))
    .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {currentFolderName ? `Vault: ${currentFolderName}` : 'Project Document Vault'}
            </h1>
          </div>
          {currentFolderId && (
            <button 
                onClick={handleBack}
                className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Documents
            </button>
          )}
        </div>


        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          {/* Search + Tab Filter Bar */}
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 w-full md:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by document name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
            </div>
            {/* Tab Filters */}
            <div className="flex gap-2 ml-auto">
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-black uppercase tracking-widest">Auditing Vault Contents...</p>
              </div>
            ) : paginatedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <svg className="w-14 h-14 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm font-black uppercase tracking-widest">No documents in this category yet</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-6 pl-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Name</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Version</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Upload Date</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="p-6 pr-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedDocs.map((doc, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-6 pl-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary text-lg shadow-inner">{doc.type === "Drawing" ? "📐" : "🧾"}</div>
                          <p className="text-sm font-black text-slate-800 leading-tight">{doc.name}</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${doc.type === "Drawing" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{doc.type}</span>
                      </td>
                      <td className="p-6 text-center whitespace-nowrap"><span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{doc.version}</span></td>
                      <td className="p-6 text-center whitespace-nowrap"><p className="text-xs font-bold text-slate-500">{doc.uploadDate}</p></td>
                      <td className="p-6 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap ${(doc.approval_status === 'Approved' || doc.approval_status === 'Active')
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : (doc.approval_status === 'Pending' || doc.approval_status === 'Under Review' || doc.approval_status === 'UNDER_REVIEW')
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                          {doc.approval_status?.replace(/_/g, ' ') || 'Archived'}
                        </span>
                      </td>
                      <td className="p-6 pr-10">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                                if (doc.is_folder) {
                                    setCurrentFolderId(doc.id);
                                    setCurrentFolderName(doc.name);
                                } else {
                                    handleView(doc);
                                }
                            }} 
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors transform active:scale-95" 
                            title={doc.is_folder ? "Open Folder" : "View Document"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          
                          <button 
                            onClick={() => {
                                if (doc.is_folder) {
                                    setCurrentFolderId(doc.id);
                                    setCurrentFolderName(doc.name);
                                    toast.success(`Opening ${doc.name}...`);
                                } else {
                                    handleDownload(doc);
                                }
                            }} 
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors transform active:scale-95" 
                            title="Download"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <div className="p-6 border-t border-slate-50 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Records Per Page:</p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                  >
                    {[10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(filteredDocs.length, currentPage * itemsPerPage)} Of {filteredDocs.length} Records
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-[10px] font-black ${currentPage === p ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}>{p}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedPreview(null); }}
        title={`Vault Record: ${selectedPreview?.name || 'Preview'}`}
        maxWidth="max-w-6xl"
      >
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          {fetchingDetail ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Establishing secure stream...</p>
            </div>
          ) : selectedPreview?.previewUrl ? (
            selectedPreview.previewType?.startsWith('image/') ? (
              <div className="flex items-center justify-center h-[75vh] bg-slate-900"><img src={selectedPreview.previewUrl} alt={selectedPreview.name} className="max-h-full max-w-full object-contain rounded-2xl" /></div>
            ) : selectedPreview.previewType ? (
              <iframe src={selectedPreview.previewUrl} className="w-full h-[75vh]" title="Document Preview" />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-800 text-slate-400 p-12 text-center">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-white">Stream Unavailable</h3>
                <p className="text-xs font-bold max-w-xs mb-8">This file format or repository doesn't support direct in-browser streaming. Please use the button below to open it in a new window or download it locally.</p>
                <button
                  onClick={() => window.open(selectedPreview.fullUrl, '_blank')}
                  className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all"
                >
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
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Status: {selectedPreview?.approval_status || selectedPreview?.status || 'Archived'}</span>
            {selectedPreview?.project_name && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Project: {selectedPreview.project_name}</span>
            )}
            {selectedPreview?.uploaded_at && (
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Uploaded: {new Date(selectedPreview.uploaded_at).toLocaleDateString()}</span>
            )}
            {selectedPreview?.file_size && (
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Size: {(selectedPreview.file_size / 1024).toFixed(1)} KB</span>
            )}
          </div>

          {selectedPreview?.remarks && (
            <div className="w-full bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Remarks & Annotations</p>
              <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{selectedPreview.remarks}</p>
            </div>
          )}

          <div className="flex gap-3 ml-auto">
            <button onClick={() => handleDownload(selectedPreview)} className="px-6 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all font-inter">Download {selectedPreview?.file_url?.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? 'Image' : 'PDF'}</button>
            <button onClick={() => setIsPreviewOpen(false)} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all font-inter">Exit Theater</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientDocumentsPage;
