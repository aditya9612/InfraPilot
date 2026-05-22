import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { drawingService } from "../../services/drawingService";
import { API_BASE_URL } from "../../services/api";
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

// Static fallback docs (non-drawing types)
const staticDocs = [
  { name: "Master Service Agreement - Phase 3", type: "Agreement", uploadDate: "02 Apr 2026", version: "v2.1", size: "2.4 MB", file_url: "" },
  { name: "Procurement Invoice - Steel & Cement", type: "Invoice", uploadDate: "15 Mar 2026", version: "v1.0", size: "1.1 MB", file_url: "" },
  { name: "Legal Clearance Receipt", type: "Agreement", uploadDate: "05 Mar 2026", version: "v1.0", size: "0.8 MB", file_url: "" },
];

// State for latest drawing

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

    /* Header */
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2563EB; padding-bottom:24px; margin-bottom:32px; }
    .logo h1  { font-size:22px; font-weight:900; color:#2563EB; letter-spacing:-0.5px; }
    .logo p   { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta     { text-align:right; }
    .meta .badge { display:inline-block; background:#eff6ff; color:#2563EB; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .meta p   { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }

    /* Title */
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p  { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }

    /* Document Box */
    .doc-box { padding:40px; background:#f8fafc; border-radius:24px; border:1px solid #e2e8f0; margin-bottom:32px; }
    .doc-row { display:flex; justify-content:space-between; margin-bottom:12px; font-size:11px; }
    .doc-row span:first-child { font-weight:900; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; }
    .doc-row span:last-child { font-weight:700; color:#1e293b; }

    /* Content Placeholder */
    .content { font-size:11px; color:#475569; line-height:1.8; font-weight:500; }

    /* Footer */
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>

  <!-- Header -->
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

  <!-- Title -->
  <div class="title-block">
    <h2>${doc.name}</h2>
    <p>Project repository archival record</p>
  </div>

  <!-- Document Meta Box -->
  <div class="doc-box">
    <div class="doc-row"><span>Document Type</span><span>${doc.type}</span></div>
    <div class="doc-row"><span>Version Control</span><span>${doc.version}</span></div>
    <div class="doc-row"><span>Upload Date</span><span>${doc.uploadDate}</span></div>
    <div class="doc-row"><span>File Size</span><span>${doc.size}</span></div>
    <div class="doc-row"><span>Security Hash</span><span>SHA-256: 8a4c...d9f2</span></div>
  </div>

  <!-- Content -->
  <div class="content">
    <strong>Document Status:</strong> Verified & Approved. <br/><br/>
    This document serves as an official record within the InfraPilot Transparency Portal. 
    It is part of the Project Repository Ledger and has been authenticated for accuracy 
    against the physical records submitted on ${doc.uploadDate}. 
    Access to this document is logged and monitored for project transparency and compliance.
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>SECURE ARCHIVE | Page 1 of 1</span>
  </div>

</body>
</html>`;
};

const downloadFromUrl = (fileUrl: string, fileName: string) => {
  // Build full URL for download
  let fullUrl = fileUrl;
  if (!fileUrl.startsWith('http')) {
    // Resolve relative path: /uploads/... or uploads/...
    const basePath = API_BASE_URL?.replace(/\/api\/v1\/?$/, '') || '';
    const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    fullUrl = `${basePath}${cleanPath}`;
  }

  console.log(">>> Downloading file from:", fullUrl);

  const link = document.createElement("a");
  link.href = fullUrl;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadDocument = (doc: { name: string; type: string; version: string; uploadDate: string; size: string }) => {
  const docPdf = new jsPDF();
  const generated = new Date().toLocaleString("en-IN");
  
  // Header
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(22);
  docPdf.setTextColor(37, 99, 235); // #2563EB
  docPdf.text("InfraPilot", 14, 22);
  
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(10);
  docPdf.setTextColor(148, 163, 184); // #94a3b8
  docPdf.text("Project Transparency Portal", 14, 28);
  
  // Meta block right aligned (approximate by X=196)
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(9);
  docPdf.setTextColor(37, 99, 235);
  docPdf.text("OFFICIAL PROJECT DOCUMENT", 196, 22, { align: "right" });
  
  docPdf.setFont("helvetica", "normal");
  docPdf.setTextColor(100, 116, 139);
  docPdf.text(`Generated: ${generated}`, 196, 28, { align: "right" });
  
  // Draw line
  docPdf.setDrawColor(37, 99, 235);
  docPdf.setLineWidth(1);
  docPdf.line(14, 32, 196, 32);
  
  // Title
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.setTextColor(15, 23, 42);
  docPdf.text(doc.name, 14, 46);
  
  docPdf.setFontSize(10);
  docPdf.setTextColor(100, 116, 139);
  docPdf.text("PROJECT REPOSITORY ARCHIVAL RECORD", 14, 52);
  
  // Document Meta Box (Table using jspdf-autotable)
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
    margin: { left: 14, right: 14 },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
  });
  
  const finalY = (docPdf as any).lastAutoTable.finalY + 15;
  
  // Content
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(11);
  docPdf.setTextColor(71, 85, 105);
  docPdf.text("Document Status: Verified & Approved", 14, finalY);
  
  docPdf.setFont("helvetica", "normal");
  const contentText = `This document serves as an official record within the InfraPilot Transparency Portal. It is part of the Project Repository Ledger and has been authenticated for accuracy against the physical records submitted on ${doc.uploadDate}. Access to this document is logged and monitored for project transparency and compliance.`;
  
  const splitText = docPdf.splitTextToSize(contentText, 180);
  docPdf.text(splitText, 14, finalY + 10);
  
  // Footer
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(9);
  docPdf.setTextColor(148, 163, 184);
  docPdf.text("InfraPilot © 2026 — Project Transparency Portal", 14, 285);
  docPdf.text("SECURE ARCHIVE | Page 1 of 1", 196, 285, { align: "right" });
  
  // Save PDF
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestDrawing = async () => {
      try {
        console.log(">>> Fetching latest drawing for project 96...");
        const data = await drawingService.getLatest(96);
        console.log(">>> Latest drawing response:", JSON.stringify(data));
        if (data) {
          // Handle both single object and array responses
          const drawings = Array.isArray(data) ? data : [data];
          setApiDrawings(drawings);
        }
      } catch (err: any) {
        console.error(">>> Failed to fetch latest drawing:", err?.response?.data || err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestDrawing();
  }, []);

  // Convert API drawings to table-compatible format
  const drawingDocs = apiDrawings.map((d) => ({
    name: d.drawing_name,
    type: "Drawing" as const,
    uploadDate: d.date ? new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    version: d.version || "v1",
    size: "—",
    file_url: d.file_url || "",
    approval_status: d.approval_status,
  }));

  // Combine API drawings with static docs
  const allDocs = [...drawingDocs, ...staticDocs.map(d => ({ ...d, approval_status: "" }))];

  const filteredDocs = activeTab === "All"
    ? allDocs
    : allDocs.filter((d) => d.type === activeTab);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Documents & Drawings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Document Vault</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Secure access to all project agreements, drawings, and financial records</p>
        </div>

        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Repository Ledger</h2>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
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
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-black uppercase tracking-widest">Loading documents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <svg className="w-14 h-14 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary text-lg shadow-inner">
                            {doc.type === "Drawing" ? "📐" : doc.type === "Agreement" ? "📜" : "🧾"}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {doc.size !== "—" ? doc.size : doc.approval_status ? `Status: ${doc.approval_status}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                          doc.type === "Agreement" ? "bg-emerald-50 text-emerald-600" :
                          doc.type === "Drawing" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-6 text-center whitespace-nowrap">
                        <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{doc.version}</span>
                      </td>
                      <td className="p-6 text-center whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-500">{doc.uploadDate}</p>
                      </td>
                      <td className="p-6 pr-10">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewDocument(doc)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors active:scale-95 transform"
                            title="View Document"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors active:scale-95 transform"
                            title="Download Document"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
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
    </>
  );
};

export default ClientDocumentsPage;
