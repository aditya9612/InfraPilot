import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { accountingService } from "../../services/accountingService";
import { projectService } from "../../services/projectService";
import { ChevronLeft, ChevronRight, Eye, QrCode } from "lucide-react";

// --- GENERIC COMPONENTS ---


const PaginatedTableSection = ({ title, columns, data }: { title: string; columns: string[]; data: any[][] }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState(10);
  const totalPages = Math.ceil(data.length / recordsPerPage);
  const paginatedData = data.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">{title}</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{columns.map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.length > 0 ? paginatedData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {row.map((cell: any, j: number) => <td key={j} className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">No data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
            <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Showing {(currentPage - 1) * recordsPerPage + 1} – {Math.min(currentPage * recordsPerPage, data.length)} of {data.length} records</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{currentPage}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- RESOLUTION HELPERS ---
const resolveUsefulLife = (a: any) => {
  if (a.useful_life !== undefined && a.useful_life !== null && Number(a.useful_life) > 0) {
    return `${a.useful_life} Years`;
  }
  if (a.useful_life_years && Number(a.useful_life_years) > 0) {
    return `${a.useful_life_years} Years`;
  }
  if (a.life_years && Number(a.life_years) > 0) {
    return `${a.life_years} Years`;
  }
  const rate = Number(a.depreciation_rate || 0);
  if (rate > 0) {
    return `${Math.round(100 / rate)} Years`;
  }
  return "10 Years";
};

const resolveMethod = (a: any) => {
  return a.depreciation_method || a.method || a.depreciation_type || "SLM";
};

const resolveSalvageValue = (a: any) => {
  if (a.salvage_value !== undefined && a.salvage_value !== null && Number(a.salvage_value) > 0) {
    return `₹${Number(a.salvage_value).toLocaleString("en-IN")}`;
  }
  if (a.residual_value !== undefined && a.residual_value !== null && Number(a.residual_value) > 0) {
    return `₹${Number(a.residual_value).toLocaleString("en-IN")}`;
  }
  if (a.scrap_value !== undefined && a.scrap_value !== null && Number(a.scrap_value) > 0) {
    return `₹${Number(a.scrap_value).toLocaleString("en-IN")}`;
  }
  const cost = Number(a.purchase_value || a.cost || 0);
  if (cost > 0) {
    return `₹${Math.round(cost * 0.05).toLocaleString("en-IN")}`;
  }
  return "₹0";
};

// --- SECTIONS ---

const AddAssetModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    purchase_value: 0,
    purchase_date: new Date().toISOString().split("T")[0],
    depreciation_rate: 10,
    useful_life: 10,
    depreciation_method: "SLM",
    salvage_value: 0,
    project_id: 0
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      projectService.getProjects().then(res => {
        const items = Array.isArray(res) ? res : res.items || res.data || [];
        setProjects(items);
        if (items.length > 0 && formData.project_id === 0) {
          setFormData(prev => ({ ...prev, project_id: items[0].id }));
        }
      }).catch(() => { });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "purchase_value") {
      const pVal = Number(value) || 0;
      setFormData(prev => ({
        ...prev,
        purchase_value: pVal,
        salvage_value: Math.round(pVal * 0.05)
      }));
    } else if (name === "depreciation_rate") {
      const dRate = Number(value) || 0;
      setFormData(prev => ({
        ...prev,
        depreciation_rate: dRate,
        useful_life: dRate > 0 ? Math.round(100 / dRate) : 10
      }));
    } else {
      const val = name === "project_id" || name === "useful_life" || name === "salvage_value" ? Number(value) : value;
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Asset name is required");
    setLoading(true);
    try {
      await accountingService.createAsset(formData);
      toast.success("Asset added to Register!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to create asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Asset"
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">{loading ? "Saving..." : "Create Asset"}</button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
            Asset Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Asset name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Value *</label>
              <input type="number" name="purchase_value" value={formData.purchase_value || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label>
              <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Rate (%) *</label>
              <input type="number" name="depreciation_rate" value={formData.depreciation_rate || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Useful Life (Years)</label>
              <input type="number" name="useful_life" value={formData.useful_life || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Method</label>
              <select name="depreciation_method" value={formData.depreciation_method} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                <option value="SLM">Straight Line Method (SLM)</option>
                <option value="WDV">Written Down Value (WDV)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salvage Value (₹)</label>
              <input type="number" name="salvage_value" value={formData.salvage_value || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project ID *</label>
              <select name="project_id" value={formData.project_id || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                <option value="" disabled>Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const AssetViewModal = ({ assetId, onClose }: { assetId: number | string | null, onClose: () => void }) => {
  const [assetDetail, setAssetDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!assetId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await accountingService.getAssetDetail(assetId);
        setAssetDetail(data);
      } catch (err: any) {
        toast.error("Failed to fetch asset details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [assetId]);

  return (
    <Modal isOpen={!!assetId} onClose={onClose} title="Asset Details" maxWidth="max-w-2xl">
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : assetDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name</p>
                <p className="font-bold text-slate-800">{assetDetail.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</p>
                <p className="font-bold text-slate-800">{assetDetail.project_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Value</p>
                <p className="font-bold text-slate-800">₹{assetDetail.purchase_value || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</p>
                <p className="font-bold text-slate-800">{assetDetail.purchase_date || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Rate</p>
                <p className="font-bold text-slate-800">{assetDetail.depreciation_rate || 0}%</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Value</p>
                <p className="font-bold text-indigo-600">₹{assetDetail.current_value || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</p>
                <p className="font-bold text-slate-800">{assetDetail.created_at || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated At</p>
                <p className="font-bold text-slate-800">{assetDetail.updated_at || "N/A"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">Asset details not found.</div>
        )}
      </div>
    </Modal>
  );
};


const AssetRegisterWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewAssetId, setViewAssetId] = useState<number | string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterPurchaseDate, setFilterPurchaseDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ project: "", purchaseDate: "" });

  const tabs = [{ key: "list", label: "Asset List", icon: "📋" }, { key: "details", label: "Asset Details", icon: "ℹ️" }];

  const fetchAssets = async () => {
    try {
      const data = await accountingService.getAssets();
      setAssets(Array.isArray(data) ? data : data?.items || data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch assets");
    }
  };

  useEffect(() => {
    projectService.getProjects().then(res => setProjects(res.items || res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (activeSubTab === 'list' || activeSubTab === 'details') {
      fetchAssets();
    }
  }, [activeSubTab]);

  const filteredAssets = assets.filter(a => {
    if (appliedFilters.project && String(a.project_id) !== String(appliedFilters.project)) return false;
    if (appliedFilters.purchaseDate && a.purchase_date !== appliedFilters.purchaseDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
        </div>
        {activeSubTab !== "transfer" && (
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
            Add Asset
          </button>
        )}
      </div>

      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchAssets} />
      <AssetViewModal assetId={viewAssetId} onClose={() => setViewAssetId(null)} />
      {activeSubTab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 mr-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">🔍</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Filter By:</span>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option value="">All</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>Active</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</label><input type="date" value={filterPurchaseDate} onChange={(e) => setFilterPurchaseDate(e.target.value)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-600" /></div>
            <button onClick={() => setAppliedFilters({ project: filterProject, purchaseDate: filterPurchaseDate })} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold mt-5 hover:bg-slate-700 transition-colors">Apply</button>
          </div>
          <PaginatedTableSection 
            title="Asset List" 
            columns={["Asset ID", "Name", "Category", "Purchase Value", "Purchase Date", "Current Value", "Project / Location", "Status", "Action"]} 
            data={filteredAssets.length > 0 ? filteredAssets.map(a => [
              a.asset_id || `AST-${a.id}`,
              a.name || a.asset_name || "N/A",
              a.category || a.asset_type || "General",
              `₹${Number(a.purchase_value || a.cost || 0).toLocaleString("en-IN")}`,
              a.purchase_date ? String(a.purchase_date).split("T")[0] : "N/A",
              `₹${Number(a.current_value || a.purchase_value || a.cost || 0).toLocaleString("en-IN")}`,
              a.project_name || a.location || a.site_location || "Head Office",
              a.status || "Active",
              <div key={a.id} className="flex gap-2">
                <button title="View" onClick={() => setViewAssetId(a.id)} className="w-7 h-7 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Eye size={14}/></button>
                <button title="QR Code" onClick={async () => {
                  try {
                    toast.loading("Generating QR...", { id: "qr" });
                    const blob = await accountingService.generateAssetQR(a.id);
                    const url = URL.createObjectURL(blob);
                    const aTag = document.createElement("a");
                    aTag.href = url;
                    aTag.download = `AST-${a.id}_QR.png`;
                    document.body.appendChild(aTag);
                    aTag.click();
                    document.body.removeChild(aTag);
                    URL.revokeObjectURL(url);
                    toast.success("QR Generated!", { id: "qr" });
                  } catch(e) {
                    toast.error("Failed to generate QR", { id: "qr" });
                  }
                }} className="w-7 h-7 flex items-center justify-center text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><QrCode size={14}/></button>
              </div>
            ]) : [["No assets found.", "", "", "", "", "", "", "", ""]]} 
          />
        </div>
      )}
      {activeSubTab === "details" && (
        <PaginatedTableSection
          title="Asset Details Lookup"
          columns={["Asset ID", "Name", "Project Name", "Purchase Value", "Depr. Rate", "Current Value"]}
          data={filteredAssets.length > 0 ? filteredAssets.map(a => [
            a.asset_id || `AST-${a.id}`,
            a.name || a.asset_name || "N/A",
            a.project_name || "-",
            `₹${Number(a.purchase_value || a.cost || 0).toLocaleString("en-IN")}`,
            `${a.depreciation_rate || 0}%`,
            `₹${Number(a.current_value || a.purchase_value || a.cost || 0).toLocaleString("en-IN")}`
          ]) : [["No assets found.", "", "", "", "", ""]]}
        />
      )}
    </div>
  );
};

const DepreciationWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "monthly");
  const [assets, setAssets] = useState<any[]>([]);
  const tabs = [
    { key: "setup", label: "Depreciation Setup", icon: "⚙️" },
    { key: "monthly", label: "Monthly Depreciation", icon: "📅" },
    { key: "annual", label: "Annual Depreciation", icon: "🗓️" },
    { key: "history", label: "Depreciation History", icon: "⏳" }
  ];

  const fetchAssets = async () => {
    try {
      const data = await accountingService.getAssets();
      setAssets(Array.isArray(data) ? data : data?.items || data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch assets for depreciation");
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
      </div>

      {activeSubTab === "setup" && <PaginatedTableSection title="Depreciation Methods Configured" columns={["Asset Category", "Method", "Rate (%)", "Status"]} data={[["Vehicles", "SLM", "15", "Active"], ["Machinery", "WDV", "20", "Active"]]} />}

      {activeSubTab === "monthly" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Depreciation Processing</h3>
              <p className="text-xs text-slate-500 mt-1">Review and process depreciation for current month</p>
            </div>
            <button onClick={() => toast.success("Depreciation Journal Entries Created!")} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">Process & Auto Journal Entry</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Auto Journal Entry Preview</h3>
            <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 max-w-2xl">
              <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Depreciation Expense A/c</span><span>Dr</span><span>₹1,25,000</span></div>
              <div className="flex justify-between pl-8"><span>To Accumulated Depreciation A/c</span><span>Cr</span><span>₹1,25,000</span></div>
            </div>
          </div>
          <PaginatedTableSection
            title="Monthly Depreciation Schedule"
            columns={["Asset", "Purchase Cost", "Depreciation Rate", "Current Value", "Monthly Depreciation", "Action"]}
            data={assets.length > 0 ? assets.map(a => [
              a.name || a.asset_name || "N/A",
              `₹${Number(a.purchase_value || a.cost || 0).toLocaleString("en-IN")}`,
              `${a.depreciation_rate || 10}% (${resolveMethod(a)})`,
              `₹${Number(a.current_value || a.purchase_value || 0).toLocaleString("en-IN")}`,
              `₹${Math.round(((Number(a.current_value || a.purchase_value || 0)) * (Number(a.depreciation_rate || 10))) / 100 / 12).toLocaleString("en-IN")}`,
              <button key={a.id} onClick={async () => { try { await accountingService.depreciateAsset(a.id, {}); toast.success("Asset Depreciated!"); } catch (e) { toast.error("Failed to depreciate"); } }} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">Depreciate</button>
            ]) : [["No assets found.", "", "", "", "", ""]]}
          />
        </div>
      )}

      {activeSubTab === "annual" && <PaginatedTableSection title="Annual Depreciation Summary" columns={["Financial Year", "Total Gross Block", "Depreciation Claimed", "Net Block"]} data={[["2023-24", "₹4,50,00,000", "₹45,20,000", "₹4,04,80,000"]]} />}
      {activeSubTab === "history" && <PaginatedTableSection title="Depreciation Entry History" columns={["Date", "Journal No", "Amount", "Period", "Status"]} data={[["2024-10-31", "JE-DEP-010", "₹1,25,000", "October 2024", "Posted"]]} />}
    </div>
  );
};

const AssetMaintenanceWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "schedule");
  const tabs = [
    { key: "schedule", label: "Maintenance Schedule", icon: "📅" },
    { key: "history", label: "Service History", icon: "⏳" },
    { key: "cost", label: "Repair Cost", icon: "💸" },
    { key: "amc", label: "AMC Tracking", icon: "🛡️" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
      </div>

      {activeSubTab === "schedule" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Log Maintenance</h3>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>CAT 320 Excavator</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Vendor</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance Cost (₹) *</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Service Date</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="e.g. Engine overhaul" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <button onClick={() => toast.success("Maintenance logged!")} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">Log Service</button>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
            <PaginatedTableSection title="Upcoming Maintenance" columns={["Asset", "Due Date", "Service Type", "Status"]} data={[["Concrete Mixer 2", "2024-12-02", "Oil change", "Pending"]]} />
          </div>
        </div>
      )}

      {activeSubTab === "history" && <PaginatedTableSection title="Service History Log" columns={["Date", "Asset", "Vendor", "Cost", "Next Due", "Remarks"]} data={[["2024-10-15", "CAT 320 Excavator", "ABC Heavy Machinery Repair", "₹45,000", "2025-04-15", "Routine servicing"]]} />}
      {activeSubTab === "cost" && <PaginatedTableSection title="Repair Cost Analysis" columns={["Asset Category", "YTD Maintenance Cost", "Avg Cost/Asset"]} data={[["Construction Machinery", "₹1,20,000", "₹24,000"], ["Vehicles", "₹45,000", "₹15,000"]]} />}
      {activeSubTab === "amc" && <PaginatedTableSection title="AMC Tracking" columns={["Vendor", "Asset Covered", "AMC Start", "AMC End", "Amount"]} data={[["Reliable IT Services", "Office Computers (x20)", "2024-01-01", "2024-12-31", "₹50,000"]]} />}
    </div>
  );
};




// --- MAIN PAGE ---
type TabKey = "assets" | "depreciation" | "maintenance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "assets", label: "Assets" },
  { key: "depreciation", label: "Depreciation" },
  { key: "maintenance", label: "Maintenance" },
];

const FixedAssetsPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "assets": "assets",
      "depreciation": "depreciation",
      "maintenance": "maintenance",
    };
    return map[currentSub || ""] || "assets";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/assets/${key}`, { replace: true });
  };

  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    assets: {
      title: "Assets Register",
      subtitle: "Manage and track all company fixed assets.",
      actions: null,
    },
    depreciation: {
      title: "Depreciation",
      subtitle: "Calculate and manage asset depreciation.",
      actions: null,
    },
    maintenance: {
      title: "Maintenance",
      subtitle: "Log and track asset maintenance activities.",
      actions: null,
    },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Fixed Assets Management" breadcrumb={["Accountant", "Fixed Assets"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

        {/* ── Section Header ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentConfig.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{currentConfig.subtitle}</p>
          </div>
          {currentConfig.actions}
        </div>

        {/* ── Tab Navigation ─────────────────────────────── */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "assets" && <AssetRegisterWrapper />}
        {activeTab === "depreciation" && <DepreciationWrapper />}
        {activeTab === "maintenance" && <AssetMaintenanceWrapper />}
      </PageTransition>
    </>
  );
};

export default FixedAssetsPage;
