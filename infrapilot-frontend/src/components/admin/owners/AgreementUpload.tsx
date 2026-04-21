import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgreementUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Only PDF, DOC, and DOCX are allowed.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit.");
      return;
    }

    setFile(selectedFile);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Agreement Document</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Document Details / Description
        </label>
        <input
          type="text"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          placeholder="e.g. Final Agreement for Plot A1..."
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
        />
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 transition-colors hover:bg-slate-100"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <svg
          className="w-12 h-12 text-slate-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-slate-600 mb-1 text-center">
          Drag and drop your file here, or
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-primary text-sm font-semibold hover:underline mb-2"
        >
          browse files
        </button>
        <p className="text-xs text-slate-400 text-center">
          Allowed Formats: PDF, DOC, DOCX
          <br />
          Maximum Size: 5 MB
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100"
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {file && !error && (
           <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
               <svg className="w-8 h-8 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <div className="min-w-0">
                  <a href="#" className="text-sm font-semibold text-emerald-700 truncate block hover:underline" onClick={(e) => {e.preventDefault(); alert("Mock File Download/Open");}}>
                    {file.name}
                  </a>
                  <p className="text-xs text-emerald-600/80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
            </div>
            <button
               onClick={() => setFile(null)}
               className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
               title="Remove"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
