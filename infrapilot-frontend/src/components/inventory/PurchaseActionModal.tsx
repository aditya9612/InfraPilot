import { useState, useEffect } from "react";
import type { IssueType } from "../../types/material";
import { boqService } from "../../services/boqService";

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
    amount_paid: 0,
    project_id: material?.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
    issue_type: "SYSTEM" as IssueType,
    supplier_id: material?.supplier_id || "",
    material_id: material?.id || "",
    boq_item_id: 0,
  });

  const [boqItems, setBoqItems] = useState<any[]>([]);

  // Sync formData when modal opens or material changes
  useEffect(() => {
    if (isOpen && material) {
      setFormData({
        quantity: 0,
        rate: material.purchase_rate || 0,
        amount_paid: 0,
        project_id: material.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
        issue_type: "SYSTEM",
        supplier_id: material.supplier_id || (suppliers && suppliers.length > 0 ? suppliers[0].id : ""),
        material_id: material.id,
        boq_item_id: 0,
      });
    }
  }, [isOpen, material, projects, suppliers]);

  useEffect(() => {
    if (formData.project_id && isOpen) {
      boqService.getBoqItems(formData.project_id).then(setBoqItems).catch(() => { });
    }
  }, [formData.project_id, isOpen]);

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
    const submitData = { ...formData, actionType };
    if (!submitData.boq_item_id) delete (submitData as any).boq_item_id;
    onSubmit(submitData);
    setFormData({
      quantity: 0,
      rate: material?.purchase_rate || 0,
      amount_paid: 0,
      project_id: material?.project_id || (projects && projects.length > 0 ? projects[0].id : ""),
      issue_type: "SYSTEM",
      supplier_id: material?.supplier_id || (suppliers && suppliers.length > 0 ? suppliers[0].id : ""),
      material_id: material?.id || "",
      boq_item_id: 0,
    });
  };

  const isUsage = actionType === "usage";
  const title = isUsage ? "Log Material Usage" : "Record Purchase";
  const qtyLabel = isUsage ? "Quantity Used *" : "Quantity *";

  const newStock = isUsage
    ? material.remaining_stock - (formData.quantity || 0)
    : material.remaining_stock + (formData.quantity || 0);

  const currentRate = isUsage ? material.purchase_rate : (formData.rate || 0);
  const newTotalAmount = isUsage
    ? material.total_amount
    : material.total_amount + ((formData.quantity || 0) * currentRate);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100`}>
          <h2 className={`text-lg font-bold text-slate-800 tracking-tight`}>{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!isUsage ? (
            <div className="border border-slate-200 rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-5">New Purchase Request</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Project <span className="text-rose-500">*</span></label>
                  <select
                    required
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  >
                    <option value="">Select Site</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Issue Type <span className="text-rose-500">*</span></label>
                  <select
                    required
                    name="issue_type"
                    value={formData.issue_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  >
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="SITE">SITE</option>
                    <option value="VENDOR">VENDOR</option>
                    <option value="PURCHASE">PURCHASE</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">BOQ Item</label>
                  <select
                    name="boq_item_id"
                    value={formData.boq_item_id || 0}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  >
                    <option value={0}>Select BOQ Item (Optional)</option>
                    {boqItems.map((b) => (
                      <option key={b.id} value={b.id}>{b.item_name || b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Quantity <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="number"
                    name="quantity"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Rate <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="number"
                    name="rate"
                    min="0.01"
                    step="0.01"
                    value={formData.rate || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Amount Paid <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="number"
                    name="amount_paid"
                    min="0"
                    step="0.01"
                    value={formData.amount_paid === 0 && formData.quantity === 0 ? "" : formData.amount_paid}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{qtyLabel}</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    name="quantity"
                    min="0.01"
                    step="0.01"
                    max={material.remaining_stock}
                    value={formData.quantity || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                    {material.unit}
                  </span>
                </div>
                {formData.quantity > material.remaining_stock && (
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1 ml-1">Cannot exceed remaining inventory ({material.remaining_stock})</p>
                )}
              </div>

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
              </div>
            </div>
          )}

          <div className="flex items-center justify-center sm:justify-end gap-4 mt-2">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isUsage && formData.quantity > material.remaining_stock}
              className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 ${isUsage ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isUsage ? "Submit Usage" : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
