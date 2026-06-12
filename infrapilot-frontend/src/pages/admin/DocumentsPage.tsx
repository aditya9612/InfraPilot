import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Download, Trash2, Folder, FileText } from "lucide-react";
import CreateFolderModal from "../../components/forms/CreateFolderModal";
import DocumentPreviewModal from "../../components/dashboard/DocumentPreviewModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { documentService } from "../../services/documentService";
import UploadDocumentModal from "../../components/forms/UploadDocumentModal";
import EditDocumentModal from "../../components/forms/EditDocumentModal";
import type { Document, DocumentStats } from "../../types/document";
import SortDropdown from "../../components/common/SortDropdown";

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const PAGE_SIZE = 10;

  const fetchDocs = useCallback(async (query = "", folderId = currentFolderId) => {
    setIsLoading(true);
    try {
      const [res, statsData] = await Promise.all([
        documentService.listDocuments({
          search: query,
          parent_id: folderId
        }),
        documentService.getStats()
      ]);
      // Explicitly filter to only show items at this folder level
      // This prevents sub-folder documents from showing at the root
      const items = (res.items || []).filter(item => item.parent_id === folderId);
      setDocuments(items);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      toast.error("Failed to sync repository");
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    fetchDocs(searchTerm);
    setCurrentPage(0);
  }, [fetchDocs, searchTerm, currentFolderId]);

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
      await documentService.uploadDocument({
        project_id: parseInt(uploadFormData.get("project_id") as string),
        title: uploadFormData.get("title") as string,
        document_type: uploadFormData.get("document_type") as string,
        parent_id: currentFolderId,
        remarks: uploadFormData.get("remarks") as string,
        file: uploadFormData.get("file") as File
      });
      toast.success("Document uploaded successfully", { id: toastId });
      fetchDocs();
    } catch (err) {
      toast.error("Failed to upload document", { id: toastId });
      throw err;
    }
  };

  const handleUpdateSubmit = async (id: number, data: any) => {
    const toastId = toast.loading("Updating details...");
    try {
      await documentService.updateDocument(id, data);
      toast.success("Document updated successfully", { id: toastId });
      fetchDocs();
    } catch (err) {
      toast.error("Failed to update document", { id: toastId });
      throw err;
    }
  };

  const handleDelete = async () => {
    if (docToDelete) {
      const toastId = toast.loading("Deleting document...");
      try {
        await documentService.deleteDocument(docToDelete);
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
      // Prioritize the file_url already in the document (the one that works in previews)
      let file_url = doc.file_url;

      // Fallback only if missing
      if (!file_url) {
        const data = await documentService.getDownloadUrl(doc.id);
        file_url = typeof data === 'string' ? data : (data as any)?.file_url;
      }

      if (!file_url) throw new Error("File path not available");

      // Normalize path
      const normalizedPath = file_url.replace(/\\/g, '/');
      const fullUrl = buildFileUrl(normalizedPath);

      // Extract extension from file_url
      const extension = normalizedPath.split('.').pop()?.split('?')[0] || '';
      const downloadName = doc.title.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
        ? doc.title
        : `${doc.title}.${extension}`;

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

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const aDate = new Date(a.uploaded_at || 0).getTime();
      const bDate = new Date(b.uploaded_at || 0).getTime();
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [documents, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / PAGE_SIZE));
  const pagedDocuments = sortedDocuments.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <>
      <Navbar title="Document Management" breadcrumb={["Admin", "Documents"]} />

      <PageTransition className="p-3 sm:p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            {currentFolderId && (
              <button
                onClick={() => {
                  // In a more complex app, we'd need a stack of folder IDs. 
                  // For now, since we removed breadcrumbs, we'll go back to root.
                  // OR better: we can keep a stack in a separate state.
                  setCurrentFolderId(null);
                }}
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                title="Back to Root"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7" /></svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Document Repository</h1>
              <p className="text-slate-500 text-sm">Securely store and manage official project documentation.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-slate-400" />
              New Folder
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload File
            </button>
          </div>
        </div>



        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Storage"
            value={stats ? `${(stats.total_storage_bytes / 1024 / 1024).toFixed(1)} MB` : "..."}
            sub={`${stats?.total_storage_gb || 0} GB used of 10 GB`}
            accent="text-primary"
          />
          <StatCard
            title="Pending Approval"
            value={stats ? stats.pending_approvals.toString() : "..."}
            sub="Documents awaiting review"
            accent="text-amber-500"
          />
          <StatCard
            title="Total Documents"
            value={stats ? stats.total_documents.toString() : "..."}
            sub="Total files in repository"
            accent="text-emerald-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] relative">
          <div className="p-4 border-b border-slate-50">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search documents by name or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-3 sm:px-4 py-3">Document Name</th>
                  <th className="px-3 sm:px-4 py-3">Type</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3">Project Link</th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-3">Version</th>
                  <th className="px-3 sm:px-4 py-3">Status</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3">Date</th>
                  <th className="px-3 sm:px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 flex-shrink-0 ${doc.is_folder ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"} rounded-lg flex items-center justify-center`}>
                          {doc.is_folder ? <Folder size={16} /> : <FileText size={16} />}
                        </div>
                        <div
                          className="cursor-pointer min-w-0"
                          onClick={() => {
                            if (doc.is_folder) {
                              setCurrentFolderId(doc.id);
                            } else {
                              setViewingDoc(doc);
                              setIsPreviewModalOpen(true);
                            }
                          }}
                        >
                          <span className="font-bold text-slate-700 group-hover:text-primary transition-colors block leading-tight truncate max-w-[10rem] sm:max-w-xs">
                            {doc.title}
                          </span>
                          {doc.remarks && (
                            <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{doc.remarks}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{doc.document_type || "Folder"}</td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{doc.project_name || "General"}</td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                        {doc.version}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" : doc.status === "PENDING" ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-500"
                        }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-xs font-bold text-slate-400 whitespace-nowrap">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setViewingDoc(doc);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary transition-all rounded-lg hover:bg-primary/5"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all rounded-lg hover:bg-amber-50"
                          title="Edit Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {!doc.is_folder && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 transition-all rounded-lg hover:bg-emerald-50"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDocToDelete(doc.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {documents.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}–{Math.min((currentPage + 1) * PAGE_SIZE, documents.length)} of {documents.length} records
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
          file_url: buildFileUrl(viewingDoc.file_url || "")
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
    </>
  );
};

export default DocumentsPage;
