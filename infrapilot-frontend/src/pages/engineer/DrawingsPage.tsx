import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";


const documents = [
  { id: 1, name: "Foundation Layout Plan", version: "Rev 03", type: "Drawing", approved: "Ar. Sharma", date: "2025-03-15", remarks: "Final approved version", size: "2.4 MB", ext: "pdf" },
  { id: 2, name: "Structural Drawing – Frame", version: "Rev 02", type: "Drawing", approved: "Str. Consultant", date: "2025-03-20", remarks: "Check column spacing", size: "3.1 MB", ext: "dwg" },
  { id: 3, name: "BOQ – Civil Works", version: "Rev 01", type: "Document", approved: "PM Office", date: "2025-03-10", remarks: "Approved for execution", size: "540 KB", ext: "xlsx" },
  { id: 4, name: "Electrical Layout", version: "Rev 01", type: "Drawing", approved: "Electrical Consult.", date: "2025-03-25", remarks: "Pending minor revision", size: "1.8 MB", ext: "pdf" },
  { id: 5, name: "Project Specifications", version: "Rev 04", type: "Document", approved: "Admin Office", date: "2025-02-28", remarks: "Master specification document", size: "1.2 MB", ext: "docx" },
  { id: 6, name: "Plumbing Schematic", version: "Rev 01", type: "Drawing", approved: "MEP Consult.", date: "2025-03-28", remarks: "First issue", size: "900 KB", ext: "pdf" },
];

const extColor: Record<string, string> = { pdf: "bg-red-50 text-red-600", dwg: "bg-blue-50 text-blue-600", xlsx: "bg-green-50 text-green-600", docx: "bg-indigo-50 text-indigo-600" };

const DrawingsPage = () => {
  const [filter, setFilter] = useState<"All" | "Drawing" | "Document">("All");
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = documents.filter(d =>
    (filter === "All" || d.type === filter) &&
    (d.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <Navbar title="Drawings & Documents" breadcrumb={["InfraPilot", "Engineer", "Documents"]}
        action={{ label: "+ Upload", onClick: () => setShowUpload(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Files", value: documents.length, icon: "📁", color: "bg-blue-50 text-blue-600" },
            { label: "Drawings", value: documents.filter(d => d.type === "Drawing").length, icon: "📐", color: "bg-purple-50 text-purple-600" },
            { label: "Documents", value: documents.filter(d => d.type === "Document").length, icon: "📄", color: "bg-green-50 text-green-600" },
            { label: "Latest Rev", value: "Rev 04", icon: "🔄", color: "bg-orange-50 text-orange-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-lg`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" placeholder="Search drawings & documents..." className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 shadow-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(["All", "Drawing", "Document"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white text-slate-400 border border-slate-100"}`}>
              {f === "Drawing" ? "📐" : f === "Document" ? "📄" : "📁"} {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase ${extColor[doc.ext] || "bg-slate-50 text-slate-500"}`}>
                {doc.ext}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{doc.version}</span>
                  <span className="text-[10px] text-slate-400">Approved: {doc.approved}</span>
                  <span className="text-[10px] text-slate-400">{doc.date}</span>
                </div>
                {doc.remarks && <p className="text-[10px] text-slate-400 mt-1 italic">{doc.remarks}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] text-slate-400 font-medium">{doc.size}</span>
                <button className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors">
                  ↓ View
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📁</p>
              <p className="text-sm font-bold">No documents found</p>
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50">
                <p className="text-3xl mb-2">📎</p>
                <p className="text-sm font-bold text-slate-600">Tap to select file</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DWG, XLSX, DOCX</p>
              </div>
              {[
                { label: "Drawing / Document Name", placeholder: "e.g. Foundation Layout Plan" },
                { label: "Version", placeholder: "e.g. Rev 01" },
                { label: "Approved By", placeholder: "Approving authority" },
                { label: "Remarks", placeholder: "Any notes..." },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700" />
                </div>
              ))}
              <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
                onClick={() => setShowUpload(false)}>Upload File</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default DrawingsPage;
