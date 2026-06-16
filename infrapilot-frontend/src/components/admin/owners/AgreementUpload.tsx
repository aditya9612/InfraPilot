import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ownerService } from "../../../services/ownerService";
import { projectService } from "../../../services/projectService";
import { agreementService } from "../../../services/agreementService";
import type { Owner } from "../../../types/owner";

interface AgreementUploadProps {
  onUploadSuccess?: (newAgreement: any) => void;
}

export default function AgreementUpload({ onUploadSuccess }: AgreementUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [searchOwner, setSearchOwner] = useState("");
  const [searchProject, setSearchProject] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ownersData, projectsData] = await Promise.all([
          ownerService.getOwners(),
          projectService.getProjects(100)
        ]);
        setOwners(ownersData);
        setProjects(Array.isArray(projectsData) ? projectsData : (projectsData.items || []));
      } catch (err) {
        console.error("Failed to fetch dependencies", err);
        toast.error("Failed to load owners or projects");
      }
    };
    fetchData();
  }, []);

  const filteredOwners = owners.filter(o =>
    o.name.toLowerCase().includes(searchOwner.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    (p.name || p.project_name || "").toLowerCase().includes(searchProject.toLowerCase())
  );

  const selectedOwner = owners.find(o => o.id === selectedOwnerId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file format. PDF, Word, and Images are allowed.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB size limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !selectedOwnerId || !selectedProjectId) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading document to ${selectedProject?.name || "project"}...`);

    try {
      const newAgreement = await agreementService.uploadAgreement({
        owner_id: parseInt(selectedOwnerId),
        project_id: selectedProjectId ? parseInt(selectedProjectId) : null,
        type: docName,
        file: file
      });

      toast.success("Agreement uploaded and linked successfully!", { id: toastId });

      if (onUploadSuccess) {
        onUploadSuccess(newAgreement);
      }

      setFile(null);
      setDocName("");
      setSelectedOwnerId("");
      setSelectedProjectId("");
    } catch (err: any) {
      console.error("Upload failed", err);
      toast.error(err.response?.data?.message || "Failed to upload agreement", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      const event = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8 h-full flex flex-col font-inter">
      <div className="space-y-6 mb-8">
        {/* Owner Selector */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
            Associate Owner <span className="text-rose-500">*</span>
          </label>
          <div
            onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer flex items-center justify-between hover:border-primary/30 transition-all"
          >
            <span className={selectedOwner ? "text-slate-900" : "text-slate-400"}>
              {selectedOwner ? selectedOwner.name : "Select an owner..."}
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <AnimatePresence>
            {isOwnerDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-slate-50">
                  <input
                    type="text"
                    value={searchOwner}
                    onChange={(e) => setSearchOwner(e.target.value)}
                    placeholder="Search owners..."
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs outline-none border border-transparent focus:border-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredOwners.length > 0 ? (
                    filteredOwners.map(o => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setSelectedOwnerId(o.id);
                          setIsOwnerDropdownOpen(false);
                          setSearchOwner("");
                        }}
                        className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary cursor-pointer transition-colors font-medium"
                      >
                        {o.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-400 italic">No owners found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Project Selector */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
            Associate Project <span className="text-slate-300 font-normal">(Optional)</span>
          </label>
          <div
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer flex items-center justify-between hover:border-primary/30 transition-all shadow-sm"
          >
            <span className={selectedProject ? "text-slate-900" : "text-slate-400"}>
              {selectedProject ? (selectedProject.name || selectedProject.project_name) : "Select a project..."}
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <AnimatePresence>
            {isProjectDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-slate-50">
                  <input
                    type="text"
                    value={searchProject}
                    onChange={(e) => setSearchProject(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs outline-none border border-transparent focus:border-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setIsProjectDropdownOpen(false);
                          setSearchProject("");
                        }}
                        className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary cursor-pointer transition-colors font-medium border-b border-slate-50 last:border-0"
                      >
                        {p.name || p.project_name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-400 italic">No projects found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
            Agreement Type / Custom Name <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Land Purchase Deed, Rent Agreement..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 min-h-[160px] sm:min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 sm:p-8 bg-slate-50/50 transition-all hover:bg-slate-50 hover:border-primary/30 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800 mb-1">
          Drag and drop your file here
        </p>
        <p className="text-xs text-slate-500 mb-4">
          or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary font-bold hover:underline"
          >
            browse your computer
          </button>
        </p>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span> PDF
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span> DOCX
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span> MAX 10MB
          </span>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-rose-50 text-rose-600 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-start gap-2 border border-rose-100"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-100 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {file && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-800 truncate block">
                    {file.name}
                  </p>
                  <p className="text-[10px] font-black text-emerald-600/80 uppercase tracking-widest">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · READY
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Remove"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleUpload}
          disabled={!file || !!error || !selectedOwnerId || !docName.trim() || isUploading}
          className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${file && !error && selectedOwnerId && docName.trim() && !isUploading
            ? "bg-primary text-white shadow-xl shadow-primary/20 hover:bg-blue-600"
            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
        >
          {isUploading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
          )}
          {isUploading ? "Uploading to Server..." : "Finalize and Upload Document"}
        </button>
        {!file && !error && (
          <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-[0.1em]">
            Select owner and document to activate
          </p>
        )}
      </div>
    </div >
  );
}
