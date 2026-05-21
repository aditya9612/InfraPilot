import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import AgreementUpload from "../../components/admin/owners/AgreementUpload";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";

export default function AgreementUploadPage() {
  const [agreements, setAgreements] = useState([
    {
      id: "AGR-1024",
      owner: "Rajiv Malhotra",
      project: "City Center Complex",
      date: "2024-05-10",
      type: "PDF",
      size: "2.4 MB",
      status: "Verified",
    },
    {
      id: "AGR-1025",
      owner: "Sneha Patil",
      project: "Riverside Apartments",
      date: "2024-05-08",
      type: "DOCX",
      size: "1.2 MB",
      status: "Pending",
    },
    {
      id: "AGR-1026",
      owner: "Amit Shah",
      project: "Metro Heights",
      date: "2024-05-05",
      type: "PDF",
      size: "3.1 MB",
      status: "Verified",
    },
  ]);

  const [selectedPreview, setSelectedPreview] = useState<any>(null);

  const handleView = (agr: any) => {
    setSelectedPreview(agr);
  };

  const handleDownload = (agr: any) => {
    const toastId = toast.loading(`Preparing ${agr.id} for download...`);

    // Simulated download logic
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      link.download = `${agr.id}_Agreement.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!", { id: toastId });
    }, 1000);
  };

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
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Agreements"
            value={String(agreements.length + 124)}
            sub="Lifetime documents secured"
            accent="text-primary"
          />
          <StatCard
            title="Recent Uploads"
            value="12"
            sub="Added this month"
            accent="text-emerald-500"
          />
          <StatCard
            title="Storage Used"
            value="432 MB"
            sub="of 2.0 GB allocated"
            accent="text-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          {/* Upload Section */}
          <div className="xl:col-span-1">
            <AgreementUpload onUploadSuccess={(newAgr) => {
              setAgreements(prev => [newAgr, ...prev]);
            }} />
          </div>

          {/* Registry Table Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="font-bold text-slate-800 tracking-tight">
                    Document Registry
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Viewing {agreements.length} most recent entries
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search registry..."
                      className="bg-transparent text-xs outline-none w-24 md:w-40"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="px-6 py-4">Ref ID</th>
                      <th className="px-6 py-4">Owner / Project</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agreements.map((agr) => (
                      <tr key={agr.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                          {agr.id}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                            {agr.owner}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {agr.project}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {agr.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${agr.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                            }`}>
                            {agr.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 transition-all">
                            <button
                              onClick={() => handleView(agr)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                              title="View Document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDownload(agr)}
                              className="p-1.5 text-slate-400 hover:text-success hover:bg-success/5 rounded-lg transition-all"
                              title="Download"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 font-inter">
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
                      {selectedPreview.owner} - Agreement
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Reference ID: {selectedPreview.id} • {selectedPreview.type}
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
                <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden border border-slate-200">
                  <iframe
                    src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#toolbar=0"
                    className="w-full h-full border-none"
                    title="Document Preview"
                  />
                  {/* Mock Watermark */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none rotate-12">
                    <span className="text-[120px] font-black text-slate-900">INFRAPILOT</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium italic">
                  Preview mode only. Confidential document for internal use.
                </p>
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
