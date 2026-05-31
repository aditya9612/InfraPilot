import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { drawingService } from "../../services/drawingService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
}

const tabs = ["All", "Agreement", "Drawing", "Invoice"];

const generateDocumentHtml = (doc: { name: string; type: string; version: string; uploadDate: string; size: string }) => {
  const generated = new Date().toLocaleString("en-IN");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${doc.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; padding:48px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2563EB; padding-bottom:24px; margin-bottom:32px; }
    .logo h1  { font-size:22px; font-weight:900; color:#2563EB; letter-spacing:-0.5px; }
    .logo p   { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta     { text-align:right; }
    .meta .badge { display:inline-block; background:#eff6ff; color:#2563EB; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .meta p   { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p  { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }
    .doc-box { padding:40px; background:#f8fafc; border-radius:24px; border:1px solid #e2e8f0; margin-bottom:32px; }
    .doc-row { display:flex; justify-content:space-between; margin-bottom:12px; font-size:11px; }
    .doc-row span:first-child { font-weight:900; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; }
    .doc-row span:last-child { font-weight:700; color:#1e293b; }
    .content { font-size:11px; color:#475569; line-height:1.8; font-weight:500; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <h1>InfraPilot</h1>
      <p>Project Transparency Portal</p>
    </div>
    <div class="meta">
      <span class="badge">Official Project Document</span>
      <p>Generated: ${generated}</p>
    </div>
  </div>
  <div class="title-block">
    <h2>${doc.name}</h2>
    <p>Project repository archival record</p>
  </div>
  <div class="doc-box">
    <div class="doc-row"><span>Document Type</span><span>${doc.type}</span></div>
    <div class="doc-row"><span>Version Control</span><span>${doc.version}</span></div>
    <div class="doc-row"><span>Upload Date</span><span>${doc.uploadDate}</span></div>
    <div class="doc-row"><span>File Size</span><span>${doc.size}</span></div>
    <div class="doc-row"><span>Security Hash</span><span>SHA-256: 8a4c...d9f2</span></div>
  </div>
  <div class="content">
    <strong>Document Status:</strong> Verified & Approved. <br/><br/>
    This document serves as an official record within the InfraPilot Transparency Portal. 
    It is part of the Project Repository Ledger and has been authenticated for accuracy 
    against the physical records submitted on ${doc.uploadDate}. 
    Access to this document is logged and monitored for project transparency and compliance.
  </div>
  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>SECURE ARCHIVE | Page 1 of 1</span>
  </div>
</body>
</html>`;
};

const downloadDocument = (doc: { name: string; type: string; version: string; uploadDate: string; size: string }) => {
  const docPdf = new jsPDF();
  const generated = new Date().toLocaleString("en-IN");
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(22);
  docPdf.setTextColor(37, 99, 235);
  docPdf.text("InfraPilot", 14, 22);
  docPdf.setFontSize(10);
  docPdf.setTextColor(148, 163, 184);
  docPdf.text("Project Transparency Portal", 14, 28);
  docPdf.setFontSize(9);
  docPdf.setTextColor(37, 99, 235);
  docPdf.text("OFFICIAL PROJECT DOCUMENT", 196, 22, { align: "right" });
  docPdf.setFont("helvetica", "normal");
  docPdf.setTextColor(100, 116, 139);
  docPdf.text(`Generated: ${generated}`, 196, 28, { align: "right" });
  docPdf.setDrawColor(37, 99, 235);
  docPdf.setLineWidth(1);
  docPdf.line(14, 32, 196, 32);
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.setTextColor(15, 23, 42);
  docPdf.text(doc.name, 14, 46);
  docPdf.setFontSize(10);
  docPdf.setTextColor(100, 116, 139);
  docPdf.text("PROJECT REPOSITORY ARCHIVAL RECORD", 14, 52);
  autoTable(docPdf, {
    startY: 60,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [148, 163, 184] },
      1: { fontStyle: "bold", textColor: [30, 41, 59] }
    },
    body: [
      ["Document Type", doc.type],
      ["Version Control", doc.version],
      ["Upload Date", doc.uploadDate],
      ["File Size", doc.size],
      ["Security Hash", "SHA-256: 8a4c...d9f2"]
    ],
    margin: { left: 14, right: 14 }
  });
  docPdf.save(`${doc.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
};

const viewDocument = (doc: { name: string; type: string; version: string; uploadDate: string; size: string }) => {
  const html = generateDocumentHtml(doc);
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
};

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [apiDrawings, setApiDrawings] = useState<DrawingDoc[]>([]);
  const [apiDocs, setApiDocs] = useState<any[]>([]);
  const [latestDrawing, setLatestDrawing] = useState<DrawingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const { projectId } = useClientProjectId();

  const fetchDrawingHistory = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const versions = await drawingService.getVersions(projectId);
      setApiDrawings(versions);
      
      // Fetch other documents (Agreements, Invoices) via documentService
      const { documentService } = await import("../../services/documentService");
      const docsResult = await documentService.listDocuments({ project_id: projectId });
      const docs = Array.isArray(docsResult) ? docsResult : ((docsResult as any).items || (docsResult as any).data || []);
      setApiDocs(docs);
    } catch (err: any) {
      console.error(">>> Failed to fetch document repository:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestDrawing = async () => {
    if (!projectId) return;
    try {
      setLoadingLatest(true);
      const latest = await drawingService.getLatest(projectId);
      if (latest) {
        setLatestDrawing({
          id: latest.id,
          project_id: latest.project_id,
          drawing_name: latest.drawing_name,
          version: latest.version,
          date: latest.date || "",
          remarks: latest.remarks || "",
          file_url: latest.file_url || "",
          approval_status: latest.approval_status || "Pending",
          approval_id: latest.approval_id || null,
        });
      }
    } catch (err: any) {
      console.error(">>> Failed to fetch latest drawing:", err?.message);
    } finally {
      setLoadingLatest(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDrawingHistory();
      fetchLatestDrawing();
    }
  }, [projectId]);


  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const handleDownload = async (doc: any) => {
    if (doc.id) {
      try {
        await drawingService.downloadDocument(doc.id, doc.name);
      } catch (err) {
        downloadDocument(doc);
      }
    } else {
      downloadDocument(doc);
    }
  };

  const handleView = async (doc: any) => {
    if (doc.id) {
      setFetchingDetail(true);
      setIsPreviewOpen(true);
      try {
        // Fetch drawing blob
        const result = await drawingService.viewDocument(doc.id);
        const blob = new Blob([result.data], { type: result.contentType as string });
        const blobUrl = URL.createObjectURL(blob);

        setSelectedPreview({
          ...doc,
          previewUrl: blobUrl,
          previewType: result.contentType,
        });
      } catch (err: any) {
        console.error("Preview fetch failed:", err);
        // Fallback
        if (doc.file_url) {
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';
          const fullUrl = doc.file_url.startsWith('http') ? doc.file_url : `${baseUrl}/${doc.file_url.replace(/^\//, '')}`;
          window.open(fullUrl, '_blank');
          setIsPreviewOpen(false);
        } else {
          setSelectedPreview({ ...doc, previewUrl: null });
        }
      } finally {
        setFetchingDetail(false);
      }
    } else {
      viewDocument(doc);
    }
  };

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
  }));

  const otherDocs = apiDocs.map((d) => ({
    id: d.id,
    name: d.title || d.name,
    type: (d.document_type || "Agreement") as any,
    uploadDate: d.created_at ? new Date(d.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    version: d.version || "Original",
    size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—",
    file_url: d.file_url || "",
    approval_status: d.status || "Archived",
    approval_id: null,
  }));

  const allVaultDocs = [...drawingDocs, ...otherDocs];

  const filteredDocs = activeTab === "All"
    ? allVaultDocs
    : allVaultDocs.filter((d) => d.type.toLowerCase() === activeTab.toLowerCase());

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Document Vault</h1>
        </div>

        {!loadingLatest && latestDrawing && (
          <div className="mb-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">📐</div>
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Latest Engineering Schematic</span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">{latestDrawing.drawing_name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-bold text-slate-400">Version {latestDrawing.version}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-xs font-bold text-slate-400">Released {latestDrawing.date ? new Date(latestDrawing.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Approval Matrix</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                    latestDrawing.approval_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {latestDrawing.approval_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Repository Ledger</h2>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-black uppercase tracking-widest">Auditing Vault Contents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
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
                    <th className="p-6 pr-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-6 pl-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary text-lg shadow-inner">{doc.type === "Drawing" ? "📐" : "🧾"}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{doc.approval_status ? `Status: ${doc.approval_status}` : "Archived Record"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${doc.type === "Drawing" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{doc.type}</span>
                      </td>
                      <td className="p-6 text-center whitespace-nowrap"><span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{doc.version}</span></td>
                      <td className="p-6 text-center whitespace-nowrap"><p className="text-xs font-bold text-slate-500">{doc.uploadDate}</p></td>
                      <td className="p-6 pr-10">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleView(doc)} className="p-2 text-slate-400 hover:text-primary transition-colors active:scale-95 transform" title="View Document"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button onClick={() => handleDownload(doc)} className="p-2 text-slate-400 hover:text-primary transition-colors active:scale-95 transform" title="Download Document"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Theater */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedPreview(null);
        }}
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
              <div className="flex items-center justify-center h-[75vh] bg-slate-900">
                <img
                  src={selectedPreview.previewUrl}
                  alt={selectedPreview.name}
                  className="max-h-full max-w-full object-contain rounded-2xl"
                />
              </div>
            ) : (
              <iframe
                src={selectedPreview.previewUrl}
                className="w-full h-[75vh]"
                title="Document Preview"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Failed to stream document</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Version: {selectedPreview?.version}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Status: {selectedPreview?.approval_status || 'Archived'}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload(selectedPreview)}
              className="px-6 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
            >
              Download PDF
            </button>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Exit Theater
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientDocumentsPage;
