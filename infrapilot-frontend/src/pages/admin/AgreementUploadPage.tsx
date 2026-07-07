import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import AgreementUpload from "../../components/admin/owners/AgreementUpload";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";
import { agreementService } from "../../services/agreementService";
import type { Agreement, AgreementStats } from "../../types/agreement";
import SortDropdown from "../../components/common/SortDropdown";
import { Plus, X } from "lucide-react";

export default function AgreementUploadPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [stats, setStats] = useState<AgreementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<Agreement | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const PAGE_SIZE = 10;

  const fetchAgreements = useCallback(async (query = "") => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        agreementService.listAgreements({ search: query }),
        agreementService.getAgreementStats()
      ]);
      setAgreements(data);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch agreements", err);
      toast.error("Failed to sync document registry");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Debounce or immediate search
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAgreements(searchTerm);
      setCurrentPage(0);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchAgreements]);

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

  const handleView = async (agr: Agreement) => {
    setSelectedPreview(agr);
    setPreviewBlobUrl(null);
    if (!agr.file_url) return;
    setIsPreviewLoading(true);
    try {
      const url = buildFileUrl(agr.file_url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Guard: if server returns an HTML page (error/SPA fallback), don't display it as PDF
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Server returned a web page instead of the document file.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(objectUrl);
    } catch (err) {
      console.error("Preview fetch failed:", err);
      toast.error("Could not load document preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = async (agr: Agreement) => {
    if (!agr.file_url) {
      toast.error("File URL not available");
      return;
    }
    const toastId = toast.loading(`Preparing ${agr.document_id || 'Document'} for download...`);
    try {
      const url = buildFileUrl(agr.file_url);
      console.log("[Agreement Download] Fetching URL:", url);
      const userString = localStorage.getItem("infrapilot_user");
      const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Guard: if response is HTML (error page / SPA fallback), abort — don't save as PDF
      const contentType = response.headers.get("content-type") || "";
      console.log("[Agreement Download] Content-Type:", contentType, "| Content-Length:", response.headers.get("content-length"));
      if (contentType.includes("text/html")) {
        throw new Error("Server returned a web page instead of the document. The file may not exist on the server.");
      }

      const blob = await response.blob();
      console.log("[Agreement Download] Blob size:", blob.size, "bytes, type:", blob.type);

      // Verify it's actually a PDF by reading the first few bytes (PDF signature is %PDF-)
      const header = await blob.slice(0, 5).text();
      if (!header.startsWith("%PDF")) {
        throw new Error(`Downloaded file is not a valid PDF (got: "${header.substring(0, 20)}"). The server may have returned an error page.`);
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${agr.document_id || 'Agreement'}_${agr.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started!", { id: toastId });
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    }
  };

  const sortedAgreements = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = term
      ? agreements.filter(a =>
          (a.document_id || "").toLowerCase().includes(term) ||
          (a.owner_name || "").toLowerCase().includes(term) ||
          (a.project_name || "").toLowerCase().includes(term) ||
          (a.type || "").toLowerCase().includes(term) ||
          (a.status || "").toLowerCase().includes(term)
        )
      : agreements;

    return [...filtered].sort((a, b) => {
      const aDate = new Date(a.uploaded_at || 0).getTime();
      const bDate = new Date(b.uploaded_at || 0).getTime();
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [agreements, sortOrder, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(sortedAgreements.length / PAGE_SIZE));
  const pagedAgreements = sortedAgreements.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <>
      <Navbar title="Owner Management" breadcrumb={["Admin", "Owners", "Agreements"]} />

      <PageTransition
        key="agreement-upload"
        className="p-6 bg-slate-50 min-h-screen pb-24 font-inter"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Agreement Documents
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Securely upload and manage official agreement papers for site owners.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/25 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Upload Agreement
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Agreements"
            value={stats ? String(stats.total_agreements) : "..."}
            sub="Lifetime documents secured"
            accent="text-primary"
          />
          <StatCard
            title="Recent Uploads"
            value={stats ? String(stats.recent_uploads) : "..."}
            sub="Added this month"
            accent="text-emerald-500"
          />
          <StatCard
            title="Storage Used"
            value={stats ? stats.storage_used : "..."}
            sub="of 2.0 GB allocated"
            accent="text-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 mb-10">
          {/* Registry Table Section - Now Full Width */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col min-h-[500px]">
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="font-bold text-slate-800 tracking-tight text-lg">
                    Document Registry
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {isLoading ? "Synchronizing with Archive..." : "Official Document Registry"}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search registry..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="bg-transparent text-xs outline-none w-24 md:w-40 font-medium text-slate-600"
                    />
                  </div>
                  <SortDropdown value={sortOrder} onChange={setSortOrder} />
                </div>
              </div>

              <div className="overflow-auto flex-1 custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="px-6 py-4">Ref ID</th>
                      <th className="px-6 py-4">Owner Name</th>
                      <th className="px-6 py-4">Linked Project</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Uploaded At</th>
                      <th className="px-6 py-4">File URL</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agreements.length > 0 ? (
                      pagedAgreements.map((agr) => (
                        <tr key={agr.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              {agr.document_id || `AGR-${agr.id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                              {agr.owner_name || "Assigned Owner"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {agr.project_name || "General Site"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${agr.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                              {agr.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-blue-50 text-blue-500`}>
                              {agr.type || "Document"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-500 whitespace-nowrap">
                              {agr.uploaded_at ? new Date(agr.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {agr.uploaded_at ? new Date(agr.uploaded_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                          </td>
                          <td className="px-6 py-4 max-w-[180px]">
                            {agr.file_url ? (
                              <a
                                href={buildFileUrl(agr.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary font-bold truncate block hover:underline"
                                title={agr.file_url}
                              >
                                {agr.file_url.split("/").pop() || agr.file_url}
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2 transition-all">
                              <button
                                onClick={() => handleView(agr)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all shadow-sm bg-white"
                                title="View Document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDownload(agr)}
                                className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all shadow-sm bg-white"
                                title="Download"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : !isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Documents Identified</p>
                            <p className="text-xs text-slate-400 mt-1">Try refining your search or add a new agreement.</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Showing {(currentPage * PAGE_SIZE) + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, agreements.length)} of {agreements.length} Entries
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                      {currentPage + 1}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[95vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Plus className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">Upload Agreement</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Secure Document Archive</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  <AgreementUpload onUploadSuccess={() => {
                    fetchAgreements(searchTerm);
                    setIsUploadModalOpen(false);
                  }} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 font-inter text-inter">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreview(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 tracking-tight">
                      {selectedPreview.owner_name} - Agreement
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Reference ID: {selectedPreview.document_id || selectedPreview.id} • {selectedPreview.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPreview(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-hidden relative">
                <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden border border-slate-200 relative flex items-center justify-center">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm font-medium">Loading document...</p>
                    </div>
                  ) : previewBlobUrl ? (
                    <iframe
                      src={previewBlobUrl}
                      className="w-full h-full border-none absolute inset-0"
                      title="Document Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center">
                      <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-bold text-slate-500 mb-1">Preview unavailable</p>
                        <p className="text-xs text-slate-400">The file could not be loaded for preview.</p>
                      </div>
                      <a
                        href={buildFileUrl(selectedPreview.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Open in New Tab ↗
                      </a>
                    </div>
                  )}
                  {/* Watermark */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none rotate-12">
                    <span className="text-[120px] font-black text-slate-900">INFRAPILOT</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-800 font-bold uppercase tracking-widest">
                    Project: {selectedPreview.project_name || "General"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Uploaded on: {new Date(selectedPreview.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(selectedPreview)}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
