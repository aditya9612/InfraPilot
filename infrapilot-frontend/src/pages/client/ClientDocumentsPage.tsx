import { useState } from "react";
import Navbar from "../../components/common/Navbar";

const docs = [
  { name: "Master Service Agreement - Phase 3", type: "Agreement", uploadDate: "02 Apr 2026", version: "v2.1", size: "2.4 MB" },
  { name: "Architectural Drawing - Floor 4 Layout", type: "Drawing", uploadDate: "28 Mar 2026", version: "v1.4", size: "12.8 MB" },
  { name: "Structural Reinforcement - Slab S3", type: "Drawing", uploadDate: "20 Mar 2026", version: "v1.2", size: "8.5 MB" },
  { name: "Procurement Invoice - Steel & Cement", type: "Invoice", uploadDate: "15 Mar 2026", version: "v1.0", size: "1.1 MB" },
  { name: "Electrical & Plumbing Layout - L3", type: "Drawing", uploadDate: "10 Mar 2026", version: "v1.1", size: "6.2 MB" },
  { name: "Legal Clearance Receipt", type: "Agreement", uploadDate: "05 Mar 2026", version: "v1.0", size: "0.8 MB" },
];

const tabs = ["All", "Agreement", "Drawing", "Invoice"];

// ── PDF generator ─────────────────────────────────────────────────────────────
const downloadDocument = (doc: { name: string; type: string; version: string; uploadDate: string; size: string }) => {
  const generated = new Date().toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
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

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  const docObj = iframe.contentWindow?.document;
  if (!docObj) return;
  docObj.open();
  docObj.write(html);
  docObj.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 600);
};

const ClientDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("All");

  const filteredDocs = activeTab === "All"
    ? docs
    : docs.filter((d) => d.type === activeTab);

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
            {filteredDocs.length === 0 ? (
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
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{doc.size}</p>
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
                      <td className="p-6 pr-10 text-right">
                        <button 
                          onClick={() => downloadDocument(doc)}
                          className="text-primary hover:text-blue-700 text-[10px] font-black uppercase tracking-widest transition-colors active:scale-95 transform"
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
