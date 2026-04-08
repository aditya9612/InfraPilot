import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Drawing {
  id: number;
  name: string;
  type: "Architectural" | "Structural" | "MEP";
  version: string;
  date: string;
  status: "Latest" | "Old";
  approvedBy: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initDrawings: Drawing[] = [
  { id: 1, name: "Ground Floor Plan", type: "Architectural", version: "V2.1", date: "28 Mar 2025", status: "Latest", approvedBy: "Ar. Sanjay Juneja" },
  { id: 2, name: "Foundation Detail - Sec A", type: "Structural", version: "V1.0", date: "25 Mar 2025", status: "Latest", approvedBy: "Er. Mahendra Singh" },
  { id: 3, name: "Electrical Layout - L1", type: "MEP", version: "V1.4", date: "20 Mar 2025", status: "Latest", approvedBy: "Er. Ramesh Gupta" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Main Page ──────────────────────────────────────────────────────────────
const DrawingsPage = () => {
  const [drawings, setDrawings] = useState<Drawing[]>(initDrawings);
  const [filter, setFilter] = useState<"All" | "Architectural" | "Structural" | "MEP">("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [newDraw, setNewDraw] = useState({ name: "", type: "Architectural" as Drawing["type"], version: "V1.0", approvedBy: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const filtered = drawings.filter(d => {
    const typeMatch = filter === "All" || d.type === filter;
    const searchMatch = d.name.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const handleDownload = (drawing: Drawing) => {
    // Simulated download
    alert(`Downloading: ${drawing.name} (${drawing.version})\nFile: ${drawing.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handleUpload = () => {
    const errs: Record<string, string> = {};
    if (!newDraw.name.trim()) errs.name = "Drawing name required";
    if (!newDraw.version.trim()) errs.version = "Version required";
    if (!newDraw.approvedBy.trim()) errs.approvedBy = "Approver name required";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setDrawings([...drawings, {
        id: Date.now(),
        ...newDraw,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: "Latest"
      }]);
      setShowUpload(false);
      setIsUploading(false);
      setNewDraw({ name: "", type: "Architectural", version: "V1.0", approvedBy: "" });
      setErrors({});
    }, 1200);
  };

  return (
    <DashboardLayout>
      <Navbar title="Drawings & Documents" breadcrumb={["InfraPilot", "Engineer", "Drawings"]}
        action={{ label: "+ Upload Drawing", onClick: () => setShowUpload(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        {/* Search Bar */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" placeholder="Search drawings by name..." className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(["All", "Architectural", "Structural", "MEP"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Drawings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(draw => (
            <div key={draw.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-primary/20 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${draw.type === "Architectural" ? "bg-blue-50 text-blue-600" : draw.type === "Structural" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"}`}>
                    {draw.type}
                  </span>
                  <span className="text-[10px] font-bold text-success uppercase">{draw.status}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors">{draw.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{draw.version} · {draw.date}</p>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Approved By</p>
                  <p className="text-xs font-bold text-slate-700">{draw.approvedBy}</p>
                </div>
              </div>
              <button onClick={() => handleDownload(draw)} className="w-full mt-5 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-primary hover:text-white hover:border-primary transition-all">
                📥 View / Download PDF
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-100">
              <p className="text-4xl mb-4 text-slate-300">📐</p>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching drawings found</h3>
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">+ Upload Drawing</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Drawing Name *</label>
                <input className={`${inp} ${errors.name ? "!border-danger" : ""}`} placeholder="e.g. Ground Floor Plan" value={newDraw.name} onChange={e => setNewDraw({ ...newDraw, name: e.target.value })} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Type</label>
                  <select className={inp} value={newDraw.type} onChange={e => setNewDraw({ ...newDraw, type: e.target.value as any })}>
                    {["Architectural", "Structural", "MEP"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Version *</label>
                  <input className={`${inp} ${errors.version ? "!border-danger" : ""}`} placeholder="e.g. V1.0" value={newDraw.version} onChange={e => setNewDraw({ ...newDraw, version: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Approved By *</label>
                <input className={`${inp} ${errors.approvedBy ? "!border-danger" : ""}`} placeholder="Name of Approver" value={newDraw.approvedBy} onChange={e => setNewDraw({ ...newDraw, approvedBy: e.target.value })} />
                {errors.approvedBy && <p className={errMsg}>⚠ {errors.approvedBy}</p>}
              </div>

              <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center bg-slate-50 cursor-pointer hover:border-primary/20 transition-all">
                <p className="text-2xl mb-2 text-slate-400">📄</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drop PDF here or click to browse</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowUpload(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleUpload} disabled={isUploading}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50">
                  {isUploading ? "Uploading..." : "Confirm Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DrawingsPage;
