import { useState, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Eye, Download, Trash2, Folder, FileText } from "lucide-react";
import CreateFolderModal from "../../components/forms/CreateFolderModal";
import DocumentPreviewModal from "../../components/dashboard/DocumentPreviewModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const initialDocuments = [
  { id: 1, name: "Foundation Drawing - Rev A", type: "Drawing", project: "Skyline Tower A", version: "v1.2", status: "Approved", date: "2026-03-20", isFolder: false },
  { id: 2, name: "Cement Supply Invoice #882", type: "Invoice", project: "Metro Ph-II", version: "v1.0", status: "Pending", date: "2026-04-01", isFolder: false },
  { id: 3, name: "Sub-Contractor Agreement", type: "Agreement", project: "Grand Vista Residency", version: "v2.1", status: "Under Review", date: "2026-03-28", isFolder: false },
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewFolder = (name: string) => {
    const newFolder = {
      id: Date.now(),
      name,
      type: "Folder",
      project: "General",
      version: "v1.0",
      status: "System",
      date: new Date().toISOString().split('T')[0],
      isFolder: true
    };
    setDocuments(prev => [newFolder, ...prev]);
    setIsFolderModalOpen(false);
    toast.success(`Folder "${name}" created!`);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.type.split('/')[1]?.toUpperCase() || "FILE",
        project: "Unassigned",
        version: "v1.0",
        status: "Uploaded",
        date: new Date().toISOString().split('T')[0],
        isFolder: false
      };
      setDocuments(prev => [newDoc, ...prev]);
      toast.success(`File "${file.name}" uploaded successfully!`);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (docToDelete) {
      setDocuments(prev => prev.filter(d => d.id !== docToDelete));
      toast.success("Document removed.");
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.isFolder) {
      toast.error("Cannot download a folder directly. Please download individual files.");
      return;
    }
    
    // Simulate a file download with mock content based on the metadata
    const mockContent = `Document Name: ${doc.name}\nProject: ${doc.project}\nVersion: ${doc.version}\nType: ${doc.type}\nStatus: ${doc.status}\nDate Added: ${doc.date}\n\n[MOCK FILE CONTENT GENERATED FOR DEMONSTRATION]`;
    const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    // Sanitize filename
    const safeName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `${safeName}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Started download for ${doc.name}`);
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
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload File
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUploadFile}
            />
          </div>
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Storage" value="4.2 GB" sub="Used of 10 GB" accent="text-primary" />
          <StatCard title="Pending Approvals" value={documents.filter(d => d.status === "Pending").length.toString()} sub="Documents awaiting review" accent="text-amber-500" />
          <StatCard title="Total Documents" value={documents.length.toString()} sub="Active files in repository" accent="text-emerald-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
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
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${doc.isFolder ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"} rounded-lg flex items-center justify-center`}>
                          {doc.isFolder ? <Folder size={16} /> : <FileText size={16} />}
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{doc.type}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{doc.project}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{doc.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        doc.status === "Approved" ? "bg-emerald-100 text-emerald-600" : 
                        doc.status === "Pending" ? "bg-amber-100 text-amber-600" : 
                        doc.status === "System" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{doc.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => {
                            setViewingDoc(doc);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                          title="View Document"
                        >
                          <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                          title="Download File"
                        >
                          <Download className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={() => {
                            setDocToDelete(doc.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDocs.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No documents found in this view.</p>
            </div>
          )}
        </div>
      </PageTransition>

      <CreateFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSubmit={handleNewFolder}
      />

      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setViewingDoc(null);
        }}
        document={viewingDoc}
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
