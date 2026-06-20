import { useState } from "react";

interface TransferMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  inventory: any[];
  projects: any[];
}

export default function TransferMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  inventory,
  projects,
}: TransferMaterialModalProps) {
  const [formData, setFormData] = useState({
    materialId: "",
    fromProjectId: "",
    toProjectId: "",
    quantity: 0,
    transportDetails: "",
  });

  if (!isOpen) return null;

  const selectedMaterial = inventory.find(
    (m) => m.id === Number(formData.materialId),
  );
  const availableStock = selectedMaterial ? selectedMaterial.stock : 0;
  const sourceProject = projects.find((p) => String(p.id) === String(formData.fromProjectId));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Auto-populate source project when material is selected
      if (name === "materialId") {
        const material = inventory.find((m) => m.id === Number(value));
        return {
          ...prev,
          materialId: value, // keep as string
          fromProjectId: material ? String(material.project_id) : "",
          toProjectId: "" // reset destination site
        };
      }

      return {
        ...prev,
        [name]:
          name === "quantity"
            ? Number(value)
            : value, // keep IDs as strings in state
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      materialId: "",
      fromProjectId: "",
      toProjectId: "",
      quantity: 0,
      transportDetails: "",
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-amber-50/50">
          <div>
            <h2 className="text-xl font-black text-amber-900 tracking-tight">
              Transfer Inventory
            </h2>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">
              Internal Stock Redistribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-900/50 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Select Material *
              </label>
              <select
                required
                name="materialId"
                value={formData.materialId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold outline-none appearance-none"
              >
                <option value="" disabled>
                  -- Select Material in Inventory --
                </option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.stock} {item.unit} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-[28px] border border-slate-100 relative">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source Site</label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 shadow-sm truncate h-[42px] flex items-center">
                  {sourceProject ? (sourceProject.name || sourceProject.project_name) : "Select a material first"}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-slate-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destination Site *</label>
                <select
                  required
                  name="toProjectId"
                  value={formData.toProjectId}
                  onChange={handleChange}
                  disabled={!formData.fromProjectId}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-[11px] font-bold outline-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400 h-[42px]"
                >
                  <option value="" disabled>Select Destination Site</option>
                  {projects
                    .filter(p => String(p.id) !== String(formData.fromProjectId))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Transfer Quantity *
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  name="quantity"
                  max={availableStock}
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold outline-none"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                  {selectedMaterial?.unit || "units"}
                </span>
              </div>
              {formData.quantity > availableStock && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1 ml-1">
                  Exceeds available inventory ({availableStock})
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Transport / Logistics Memo
              </label>
              <textarea
                name="transportDetails"
                value={formData.transportDetails}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold outline-none resize-none"
                placeholder="e.g. Vehicle No, Driver Name..."
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !formData.materialId ||
                !formData.toProjectId ||
                !formData.fromProjectId ||
                formData.quantity <= 0 ||
                formData.quantity > availableStock
              }
              className="flex-1 px-8 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95"
            >
              Initiate Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

