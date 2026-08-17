import { useState, useEffect } from "react";
import type { IssueType } from "../../types/material";

interface PurchaseActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  material: any;
  actionType: "purchase" | "usage";
  projects: any[];
  suppliers: any[];
  allMaterials: any[];
}

export default function PurchaseActionModal({ isOpen, onClose, onSubmit, material, actionType, projects, suppliers, allMaterials }: PurchaseActionModalProps) {

  const [formData, setFormData] = useState({
    quantity: 0,
    rate: material?.purchase_rate || 0,
    project_id: material?.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
    issue_type: "SYSTEM" as IssueType,
    supplier_id: material?.supplier_id || "",
    material_id: material?.id || "",
  });

  // Sync formData when modal opens or material changes
  useEffect(() => {
    if (isOpen && material) {
      setFormData({
        quantity: 0,
        rate: material.purchase_rate || 0,
        project_id: material.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
        issue_type: "SYSTEM",
        supplier_id: material.supplier_id || (suppliers && suppliers.length > 0 ? suppliers[0].id : ""),
        material_id: material.id,
      });
    }
  }, [isOpen, material, projects, suppliers]);


  if (!isOpen || !material) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "issue_type" ? value : Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, actionType });
    setFormData({
      quantity: 0,
      rate: material?.purchase_rate || 0,
      project_id: material?.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
      issue_type: "SYSTEM",
      supplier_id: material?.supplier_id || (suppliers && suppliers.length > 0 ? suppliers[0].id : ""),
      material_id: material?.id || "",
    });
  };

  const isUsage = actionType === "usage";
  const title = isUsage ? "Log Material Usage" : "Record New Purchase";
  const qtyLabel = isUsage ? "Quantity Used *" : "Quantity Purchased *";

  // Predict new state
  const newStock = isUsage
    ? material.remaining_stock - (formData.quantity || 0)
    : material.remaining_stock + (formData.quantity || 0);

  // Note: For usage, total value doesn't change on the spot. For purchase, the new value is old value + (quantity * rate).
  const currentRate = isUsage ? material.purchase_rate : (formData.rate || 0);
  const newTotalAmount = isUsage
    ? material.total_amount
    : material.total_amount + ((formData.quantity || 0) * currentRate);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-between px-8 py-6 border-b border-slate-100 ${isUsage ? 'bg-amber-50/50' : 'bg-emerald-50/50'}`}>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isUsage ? 'text-amber-900' : 'text-emerald-900'}`}>{title}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isUsage ? 'text-amber-600' : 'text-emerald-600'}`}>
              {material.material_name} ({material.unit})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{qtyLabel}</label>
              <div className="relative">
                <input
                  required
                  type="number"
                  name="quantity"
                  min="0.01"
                  step="0.01"
                  max={isUsage ? material.remaining_stock : undefined}
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                  {material.unit}
                </span>
              </div>
              {isUsage && formData.quantity > material.remaining_stock && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1 ml-1">Cannot exceed remaining inventory ({material.remaining_stock})</p>
              )}
            </div>

            {!isUsage && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material *</label>
                  <select
                    name="material_id"
                    value={formData.material_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold outline-none"
                  >
                    <option value="">Select Material</option>
                    {allMaterials.map((m) => (
                      <option key={m.id} value={m.id}>{m.material_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier *</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || s.supplier_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Rate *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                    <input
                      required
                      type="number"
                      name="rate"
                      min="0.01"
                      step="0.01"
                      value={formData.rate || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                      / {material.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project *</label>
              <select
                required
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold outline-none"
              >
                <option value="">Select Site</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Type</label>
                <select
                  name="issue_type"
                  value={formData.issue_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold outline-none"
                >
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="SITE">SITE</option>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="LOSS">LOSS</option>
                  <option value="VENDOR">VENDOR</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="PURCHASE">PURCHASE</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[28px] p-6 relative overflow-hidden shadow-xl space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />

              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Forecast</span>
                <span className={`text-sm font-black ${newStock < 10 ? 'text-rose-400' : 'text-primary'}`}>
                  {newStock.toLocaleString()} {material.unit}
                </span>
              </div>

              {!isUsage && (
                <div className="pt-4 border-t border-white/10 relative z-10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjusted Valuation</span>
                    <span className="text-sm font-black text-white">₹{newTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isUsage && formData.quantity > material.remaining_stock}
              className={`flex-1 px-8 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all ${isUsage ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
            >
              {isUsage ? "Submit Usage" : "Record Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

