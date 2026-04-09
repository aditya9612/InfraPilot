import { useState } from "react";

interface TransferMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  inventory: any[];
}

export default function TransferMaterialModal({ isOpen, onClose, onSubmit, inventory }: TransferMaterialModalProps) {
  const [formData, setFormData] = useState({
    materialId: "",
    fromProjectId: 1, // Defaulting for simple mock
    toProjectId: 2,
    quantity: 0,
    transportDetails: ""
  });

  if (!isOpen) return null;

  const selectedMaterial = inventory.find(m => m.id === Number(formData.materialId));
  const availableStock = selectedMaterial ? selectedMaterial.stock : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "quantity" || name === "materialId" || name === "toProjectId" || name === "fromProjectId" ? Number(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      materialId: "",
      fromProjectId: 1,
      toProjectId: 2,
      quantity: 0,
      transportDetails: ""
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Transfer Material</h2>
            <p className="text-xs text-amber-700/70 mt-1">Move inventory between project sites securely.</p>
          </div>
          <button onClick={onClose} className="p-2 text-amber-900/50 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 text-sm">
          <div className="space-y-5">
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Select Material to Transfer *</label>
              <select required name="materialId" value={formData.materialId} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
                <option value="" disabled>-- Select Material in Inventory --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name} (Site Tracking: {item.stock} {item.unit} available)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500">From Site</label>
                  <select required name="fromProjectId" value={formData.fromProjectId} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                    <option value={1}>Site A - City Center Complex</option>
                  </select>
                </div>
                <div className="space-y-1 flex justify-center items-center">
                    <svg className="w-6 h-6 text-amber-500 mt-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500">To Site *</label>
                  <select required name="toProjectId" value={formData.toProjectId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
                    <option value={2}>Site B - Riverside Apartments</option>
                    <option value={3}>Site C - Highway Bridge</option>
                  </select>
                </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 pt-5 mt-2">
              <label className="block text-sm font-semibold text-slate-700">Transfer Quantity *</label>
              <div className="relative">
                <input required type="number" name="quantity" max={availableStock} value={formData.quantity || ""} onChange={handleChange} className="w-full px-4 py-2 pr-16 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm" placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {selectedMaterial?.unit || "units"}
                </span>
              </div>
              {formData.quantity > availableStock && (
                  <p className="text-xs text-rose-500 mt-1">Cannot exceed available inventory ({availableStock})</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Transport Details (Optional)</label>
              <textarea name="transportDetails" value={formData.transportDetails} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm" placeholder="Vehicle No, Driver Name, etc." />
            </div>

          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!formData.materialId || formData.quantity <= 0 || formData.quantity > availableStock} className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-600/20 transition-all">
              Initiate Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
