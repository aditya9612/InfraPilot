import { useState, useEffect, useCallback } from "react";
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
      setDocuments(res.items);
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
  }, [fetchDocs, searchTerm]);

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
    if (file_url.startsWith('http')) return file_url;
    // Prepend /api/v1 so the request goes via the /api proxy to https://infrapilot.in/api/v1/uploads/...
    return `${import.meta.env.VITE_API_URL}${file_url}`;
  };

  const handleDownload = async (doc: Document) => {
    const toastId = toast.loading(`Preparing ${doc.title}...`);
    try {
      const { file_url } = await documentService.getDownloadUrl(doc.id);
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
      link.download = doc.title;
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

  return (
    <>
      <Navbar title="Document Management" breadcrumb={["Admin", "Documents"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Document Repository</h1>
            <p className="text-slate-500 text-sm">Securely store and manage blueprints, contracts, and financial records.</p>
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
            <div className="relative flex-1 max-w-md">
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Document Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Project Link</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${doc.is_folder ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"} rounded-lg flex items-center justify-center`}>
                          {doc.is_folder ? <Folder size={16} /> : <FileText size={16} />}
                        </div>
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            if (doc.is_folder) {
                              setCurrentFolderId(doc.id);
                            } else {
                              setViewingDoc(doc);
                              setIsPreviewModalOpen(true);
                            }
                          }}
                        >
                          <span className="font-bold text-slate-700 group-hover:text-primary transition-colors block leading-tight">
                            {doc.title}
                          </span>
                          {doc.remarks && (
                            <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{doc.remarks}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{doc.document_type || "Folder"}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{doc.project_name || "General"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                        {doc.version}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" : doc.status === "PENDING" ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-500"
                        }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
          // /uploads paths are proxied directly by vite — no API prefix needed
          file_url: viewingDoc.file_url
            ? (viewingDoc.file_url.startsWith('http') || viewingDoc.file_url.startsWith('/uploads')
              ? viewingDoc.file_url
              : `${import.meta.env.VITE_API_URL}${viewingDoc.file_url}`)
            : ""
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
