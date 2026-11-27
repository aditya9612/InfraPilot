import React, { useState, useEffect } from "react";
import { Sliders, X, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { Material } from "../../../types/material";

interface MaterialThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  projectName?: string;
  onSave: (materialId: number, newThreshold: number) => Promise<void>;
}

const MaterialThresholdConfigModal: React.FC<MaterialThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  material,
  projectName,
  onSave,
}) => {
  const [threshold, setThreshold] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (material) {
      setThreshold(Number(material.minimum_stock_level) || 0);
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const stock = Number(material.remaining_stock) || 0;
  const previewStatus =
    stock <= 0 ? "OUT_OF_STOCK" : stock <= threshold ? "LOW_STOCK" : "IN_STOCK";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (threshold < 0) return;
    setSaving(true);
    try {
      await onSave(material.id, Number(threshold));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Min Stock Threshold</h2>
              <p className="text-xs text-slate-500">{material.material_name} ({projectName || "Site"})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Stock Balance</p>
              <p className="text-2xl font-black text-slate-900">{stock.toLocaleString()} {material.unit_name || material.unit}</p>
            </div>
            <div>
              {previewStatus === "OUT_OF_STOCK" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">
                  <XCircle className="w-3.5 h-3.5" /> Out of Stock
                </span>
              )}
              {previewStatus === "LOW_STOCK" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alert
                </span>
              )}
              {previewStatus === "IN_STOCK" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Minimum Threshold Level <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              required
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-primary outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Admin alert triggers automatically whenever remaining stock drops at or below {threshold}.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Threshold"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialThresholdConfigModal;
