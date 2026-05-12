import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { drawingService, type Drawing } from "../../services/drawingService";
import { Loader2, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";

const MOCK_AGREEMENTS = [
  { name: "Master Service Agreement - Phase 3", type: "Agreement", uploadDate: "02 Apr 2026", version: "v2.1", size: "2.4 MB" },
  { name: "Procurement Invoice - Steel & Cement", type: "Invoice", uploadDate: "15 Mar 2026", version: "v1.0", size: "1.1 MB" },
  { name: "Legal Clearance Receipt", type: "Agreement", uploadDate: "05 Mar 2026", version: "v1.0", size: "0.8 MB" },
];

const tabs = ["All", "Agreement", "Drawing", "Invoice"];

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const drawings = await drawingService.getLatestDrawings(1); // project_id = 1
      
      const mappedDrawings = drawings.map((d: Drawing) => ({
        name: d.drawing_name,
        type: "Drawing",
        uploadDate: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        version: d.version,
        size: "N/A",
        raw: d
      }));

      setDocuments([...MOCK_AGREEMENTS, ...mappedDrawings]);
    } catch (error) {
      console.error("Failed to fetch drawings:", error);
      toast.error("Failed to load project drawings.");
      setDocuments(MOCK_AGREEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = async (doc: any) => {
    if (doc.type === "Drawing" && doc.raw) {
      try {
        await drawingService.downloadDrawing(doc.raw);
        toast.success(`Downloading ${doc.name}...`);
      } catch (err) {
        toast.error("Failed to download drawing.");
      }
    } else {
      // Mock download for agreements/invoices
      const generated = new Date().toLocaleString("en-IN");
      const html = `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');body{font-family:'Inter',sans-serif;padding:50px;}.header{border-bottom:3px solid #2563EB;padding-bottom:20px;margin-bottom:30px;}.brand{font-size:24px;font-weight:900;color:#2563EB;}.box{background:#f8fafc;padding:30px;border-radius:20px;border:1px solid #e2e8f0;}</style></head><body><div class="header"><div class="brand">InfraPilot</div><p>Generated: ${generated}</p></div><h2>${doc.name}</h2><div class="box"><p>Type: ${doc.type}</p><p>Version: ${doc.version}</p><p>Date: ${doc.uploadDate}</p></div></body></html>`;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;width:0;height:0;border:none;";
      document.body.appendChild(iframe);
      const d = iframe.contentWindow?.document;
      if (!d) return;
      d.open(); d.write(html); d.close();
      setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 2000); }, 600);
    }
  };

  const filteredDocs = activeTab === "All"
    ? documents
    : documents.filter((d) => d.type === activeTab);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Document Vault</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Secure access to all project agreements, drawings, and financial records</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Repository Ledger</h2>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === t
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Loader2 className="w-10 h-10 mb-4 animate-spin text-blue-500 opacity-50" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Accessing secure repository...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <p className="text-[10px] font-bold uppercase tracking-widest">No documents in this category yet</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 pl-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Document Name</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Type</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Version</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Upload Date</th>
                    <th className="p-4 pr-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-8">
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{doc.size}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          doc.type === "Agreement" ? "bg-emerald-50 text-emerald-600" :
                          doc.type === "Drawing" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{doc.version}</span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <p className="text-[10px] font-bold text-slate-500">{doc.uploadDate}</p>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="text-primary hover:text-blue-700 text-[9px] font-bold uppercase tracking-widest transition-colors active:scale-95"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDocumentsPage;
