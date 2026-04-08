import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

interface Material {
  id: number;
  name: string;
  unit: string;
  opening: number;
  received: number;
  used: number;
  supplier: string;
  bill: string;
  location: "Store" | "Site";
}

interface RecordForm {
  materialId: number;
  qty: string;
  supplier: string;
  bill: string;
  location: "Store" | "Site";
  date: string;
}

const initMaterials: Material[] = [
  { id: 1, name: "OPC 53 Cement", unit: "Bag", opening: 200, received: 150, used: 180, supplier: "UltraTech Ltd.", bill: "INV-2024-101", location: "Store" },
  { id: 2, name: "TMT Steel Rods", unit: "Ton", opening: 8, received: 5, used: 6, supplier: "SAIL Dealers", bill: "INV-2024-102", location: "Site" },
  { id: 3, name: "River Sand", unit: "Ton", opening: 30, received: 20, used: 28, supplier: "Local Quarry", bill: "INV-2024-103", location: "Store" },
  { id: 4, name: "Coarse Aggregate", unit: "Ton", opening: 25, received: 0, used: 15, supplier: "—", bill: "—", location: "Store" },
  { id: 5, name: "Bricks (Class A)", unit: "Nos", opening: 5000, received: 3000, used: 4200, supplier: "Brick Kiln Co.", bill: "INV-2024-104", location: "Site" },
];

const UNITS = ["Bag", "Kg", "Ton", "m³", "Nos", "Litre", "Rmt"];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const MaterialManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tab = location.pathname.includes("/receipt") ? "receipt"
    : location.pathname.includes("/consumption") ? "consumption"
      : "stock";

  const [materials, setMaterials] = useState<Material[]>(initMaterials);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<"receipt" | "consumption">("receipt");

  const [form, setForm] = useState<RecordForm>({
    materialId: 0, qty: "", supplier: "", bill: "", location: "Store",
    date: new Date().toISOString().split("T")[0],
  });

  const [newItem, setNewItem] = useState({
    name: "", unit: "Bag", opening: "", location: "Store" as "Store" | "Site"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");


  const openModal = (type: "receipt" | "consumption") => {
    setModalType(type); setShowModal(true);
    setForm({ materialId: 0, qty: "", supplier: "", bill: "", location: "Store", date: new Date().toISOString().split("T")[0] });
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.materialId) errs.materialId = "Material select karo";
    const q = parseFloat(form.qty);
    if (!form.qty) errs.qty = "Quantity required hai";
    else if (isNaN(q) || q <= 0) errs.qty = "Valid positive quantity dalo";
    else if (modalType === "consumption") {
      const mat = materials.find(m => m.id === form.materialId);
      const closing = mat ? mat.opening + mat.received - mat.used : 0;
      if (q > closing) errs.qty = `Stock mein sirf ${closing} ${mat?.unit} available hai`;
    }
    if (modalType === "receipt" && !form.supplier.trim()) errs.supplier = "Supplier naam required hai";
    if (!form.date) errs.date = "Date required hai";
    return errs;
  };

  const handleAddMaterial = () => {
    if (!newItem.name.trim()) { setErrors({ name: "Material name required" }); return; }
    if (!newItem.opening || isNaN(Number(newItem.opening))) { setErrors({ opening: "Valid opening stock required" }); return; }

    const id = Math.max(0, ...materials.map(m => m.id)) + 1;
    setMaterials(prev => [...prev, {
      id, name: newItem.name, unit: newItem.unit,
      opening: Number(newItem.opening), received: 0, used: 0,
      supplier: "—", bill: "—", location: newItem.location
    }]);
    setShowAddModal(false);
    setNewItem({ name: "", unit: "Bag", opening: "", location: "Store" });
    setSuccess("New material added successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSubmit = () => {

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const qty = parseFloat(form.qty);
    setMaterials(prev => prev.map(m => {
      if (m.id !== form.materialId) return m;
      return modalType === "receipt"
        ? { ...m, received: m.received + qty, supplier: form.supplier || m.supplier, bill: form.bill || m.bill, location: form.location }
        : { ...m, used: m.used + qty };
    }));
    setShowModal(false);
    setSuccess(`${modalType === "receipt" ? "Receipt" : "Consumption"} successfully recorded!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <DashboardLayout>
      <Navbar title="Material Management" breadcrumb={["InfraPilot", "Engineer", "Materials"]} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Items", value: materials.length, icon: "📦", color: "bg-blue-50 text-blue-600" },
            { label: "Low Stock", value: materials.filter(m => (m.opening + m.received - m.used) < 10).length, icon: "⚠️", color: "bg-orange-50 text-orange-600" },
            { label: "At Site", value: materials.filter(m => m.location === "Site").length, icon: "🏗️", color: "bg-purple-50 text-purple-600" },
            { label: "Receipts", value: materials.filter(m => m.received > 0).length, icon: "🚚", color: "bg-green-50 text-green-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-base`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3 mb-5">
          <button onClick={() => setShowAddModal(true)}
            className="flex-1 py-3 bg-white text-primary border border-primary rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-50">
            + Add New Item
          </button>
          <button onClick={() => openModal("receipt")}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all">
            📥 Record Receipt
          </button>
          <button onClick={() => openModal("consumption")}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
            📤 Record Usage
          </button>
        </div>


        {success && (
          <div className="bg-green-50 border border-green-200 text-success text-sm font-semibold px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            ✅ {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "📊 Stock", path: "/engineer/materials/stock" },
            { label: "📥 Receipt", path: "/engineer/materials/receipt" },
            { label: "📤 Consumption", path: "/engineer/materials/consumption" },
          ].map(t => (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === (t.path.includes("receipt") ? "receipt" : t.path.includes("consumption") ? "consumption" : "stock")
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Material list */}
        <div className="space-y-3">
          {materials.map(m => {
            const closing = m.opening + m.received - m.used;
            const isLow = closing < 10;
            return (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {m.unit} · {m.location} {m.supplier !== "—" ? `· ${m.supplier}` : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${isLow ? "bg-red-50 text-danger" : "bg-green-50 text-success"}`}>
                    {isLow ? "⚠️ Low" : "✅ OK"}
                  </span>
                </div>

                {/* Show based on tab */}
                {tab === "stock" && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Opening", val: m.opening, cls: "" },
                      { label: "Received", val: `+${m.received}`, cls: "text-success" },
                      { label: "Used", val: `-${m.used}`, cls: "text-danger" },
                      { label: "Closing", val: closing, cls: isLow ? "text-danger font-black" : "text-primary font-bold" },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className={`text-xs font-bold ${s.cls || "text-slate-700"}`}>{s.val}</p>
                        <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "receipt" && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Received", val: `${m.received} ${m.unit}`, cls: "text-success" },
                      { label: "Bill No.", val: m.bill !== "—" ? m.bill : "—" },
                      { label: "Supplier", val: m.supplier !== "—" ? m.supplier : "—" },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className={`text-xs font-bold truncate ${s.cls || "text-slate-700"}`}>{s.val}</p>
                        <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "consumption" && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Used", val: `${m.used} ${m.unit}`, cls: "text-danger" },
                      { label: "Closing", val: `${closing} ${m.unit}`, cls: isLow ? "text-danger" : "text-primary" },
                      { label: "Location", val: m.location },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className={`text-xs font-bold ${s.cls || "text-slate-700"}`}>{s.val}</p>
                        <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {modalType === "receipt" ? "📥 Material Receipt" : "📤 Material Usage"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Material */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Material Name *</label>
                <select className={`${inp} ${errors.materialId ? "!border-danger" : ""}`}
                  value={form.materialId}
                  onChange={e => { setForm(f => ({ ...f, materialId: Number(e.target.value) })); setErrors(f => ({ ...f, materialId: "" })); }}>
                  <option value={0}>Material select karo</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                {errors.materialId && <p className={errMsg}>⚠ {errors.materialId}</p>}
              </div>
              {/* Qty */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                  {modalType === "receipt" ? "Received Quantity *" : "Used Quantity *"}
                </label>
                <input type="number" min="0.01" step="0.01"
                  className={`${inp} ${errors.qty ? "!border-danger" : ""}`}
                  placeholder="e.g. 50"
                  value={form.qty}
                  onChange={e => { setForm(f => ({ ...f, qty: e.target.value })); setErrors(f => ({ ...f, qty: "" })); }} />
                {errors.qty && <p className={errMsg}>⚠ {errors.qty}</p>}
              </div>
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Date *</label>
                <input type="date" className={`${inp} ${errors.date ? "!border-danger" : ""}`}
                  value={form.date} max={new Date().toISOString().split("T")[0]}
                  onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(f => ({ ...f, date: "" })); }} />
                {errors.date && <p className={errMsg}>⚠ {errors.date}</p>}
              </div>
              {/* Receipt-only fields */}
              {modalType === "receipt" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Supplier Name *</label>
                    <input className={`${inp} ${errors.supplier ? "!border-danger" : ""}`}
                      placeholder="Supplier firm name"
                      value={form.supplier}
                      onChange={e => { setForm(f => ({ ...f, supplier: e.target.value })); setErrors(f => ({ ...f, supplier: "" })); }} />
                    {errors.supplier && <p className={errMsg}>⚠ {errors.supplier}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Bill Number</label>
                    <input className={inp} placeholder="e.g. INV-2024-105"
                      value={form.bill}
                      onChange={e => setForm(f => ({ ...f, bill: e.target.value }))} />
                  </div>
                </>
              )}
              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Location</label>
                <div className="flex gap-3">
                  {(["Store", "Site"] as const).map(loc => (
                    <button key={loc} type="button" onClick={() => setForm(f => ({ ...f, location: loc }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.location === loc ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                      {loc === "Store" ? "🏪 Store" : "🏗️ Site"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSubmit}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">+ Add New Material</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Material Name *</label>
                <input className={`${inp} ${errors.name ? "!border-danger" : ""}`}
                  placeholder="e.g. White Cement"
                  value={newItem.name}
                  onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Unit</label>
                  <select className={inp} value={newItem.unit}
                    onChange={e => setNewItem(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Opening Stock *</label>
                  <input type="number" className={`${inp} ${errors.opening ? "!border-danger" : ""}`}
                    placeholder="e.g. 100"
                    value={newItem.opening}
                    onChange={e => setNewItem(f => ({ ...f, opening: e.target.value }))} />
                  {errors.opening && <p className={errMsg}>⚠ {errors.opening}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Default Location</label>
                <div className="flex gap-3">
                  {(["Store", "Site"] as const).map(loc => (
                    <button key={loc} type="button" onClick={() => setNewItem(f => ({ ...f, location: loc }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${newItem.location === loc ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                      {loc === "Store" ? "🏪 Store" : "🏗️ Site"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddMaterial}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>

  );
};

export default MaterialManagementPage;
