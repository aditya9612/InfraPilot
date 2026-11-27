import React, { useState, useMemo, useEffect } from "react";
import { Calendar, AlertTriangle, X } from "lucide-react";
import type { Material, DailyStockRecord, InwardReceipt, OutwardIssue } from "../../../types/material";

interface CreateDailyStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  inventory: Material[];
  existingRecords: DailyStockRecord[];
  inwards: InwardReceipt[];
  outwards: OutwardIssue[];
  onSubmit: (record: Omit<DailyStockRecord, "id" | "closing_stock" | "closing_value" | "created_at">) => Promise<void>;
}

const CreateDailyStockModal: React.FC<CreateDailyStockModalProps> = ({
  isOpen,
  onClose,
  projects,
  inventory,
  existingRecords,
  inwards,
  outwards,
  onSubmit,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
  const [materialId, setMaterialId] = useState<number>(0);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [inwardQty, setInwardQty] = useState<number>(0);
  const [outwardQty, setOutwardQty] = useState<number>(0);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [isAdjustment, setIsAdjustment] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const siteMaterials = useMemo(
    () => inventory.filter((m) => !projectId || m.project_id === projectId),
    [inventory, projectId]
  );

  const selectedMaterial = useMemo(
    () => siteMaterials.find((m) => m.id === materialId) || null,
    [siteMaterials, materialId]
  );

  // Automatic Carry-Forward: yesterday's closing stock populates today's opening stock
  useEffect(() => {
    if (!selectedMaterial) return;
    const priorRecords = existingRecords
      .filter((r) => r.project_id === projectId && r.material_id === selectedMaterial.id && r.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (priorRecords.length > 0) {
      setOpeningStock(priorRecords[0].closing_stock);
    } else {
      setOpeningStock(Number(selectedMaterial.remaining_stock || 0));
    }
  }, [selectedMaterial, projectId, date, existingRecords]);

  // Double-counting check: warn if PO Inwards / Outwards already logged for same site, material & date
  const overlapWarning = useMemo(() => {
    if (!selectedMaterial || (!inwardQty && !outwardQty)) return "";
    const hasInward =
      inwardQty > 0 &&
      inwards.some(
        (inc) =>
          inc.status === "POSTED" &&
          inc.receiving_project_id === projectId &&
          inc.delivery_date === date &&
          inc.items.some((it) => it.material_id === selectedMaterial.id)
      );
    const hasOutward =
      outwardQty > 0 &&
      outwards.some(
        (out) =>
          out.status === "POSTED" &&
          out.project_id === projectId &&
          out.issue_date === date &&
          out.items.some((it) => it.material_id === selectedMaterial.id)
      );

    if (hasInward || hasOutward) {
      return "Double-Counting Warning: An Inward or Outward transaction is already posted for this material on this date. Mark as ADJUSTMENT if reconciling physical variance.";
    }
    return "";
  }, [selectedMaterial, projectId, date, inwardQty, outwardQty, inwards, outwards]);

  if (!isOpen) return null;

  const closingStock = Math.max(0, Number(openingStock) + Number(inwardQty) - Number(outwardQty) + Number(adjustmentQty));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedMaterial) return;
    if (isAdjustment && !notes.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        date,
        project_id: projectId,
        material_id: selectedMaterial.id,
        material_name: selectedMaterial.material_name,
        material_code: selectedMaterial.material_code,
        unit: selectedMaterial.unit_name || selectedMaterial.unit,
        opening_stock: Number(openingStock),
        inward_qty: Number(inwardQty),
        outward_qty: Number(outwardQty),
        adjustment_qty: Number(adjustmentQty),
        rate: Number(selectedMaterial.purchase_rate || 0),
        entry_source: isAdjustment ? "ADJUSTMENT" : "MANUAL",
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Record Daily Stock Entry</h2>
              <p className="text-xs text-slate-500">Enforces Closing = Opening + Inward - Outward with carry-forward</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {overlapWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{overlapWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Date *</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Project Site *</label>
              <select
                value={projectId || ""}
                onChange={(e) => {
                  setProjectId(Number(e.target.value));
                  setMaterialId(0);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Material *</label>
              <select
                required
                value={materialId || ""}
                onChange={(e) => setMaterialId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                <option value="">Select Material...</option>
                {siteMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.material_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Opening Stock</label>
              <input type="number" min={0} value={openingStock} onChange={(e) => setOpeningStock(Math.max(0, Number(e.target.value)))} className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">+ Inward Qty</label>
              <input type="number" min={0} value={inwardQty} onChange={(e) => setInwardQty(Math.max(0, Number(e.target.value)))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-rose-700 uppercase block mb-1">- Outward Qty</label>
              <input type="number" min={0} value={outwardQty} onChange={(e) => setOutwardQty(Math.max(0, Number(e.target.value)))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-primary uppercase block mb-1">Closing Stock</label>
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-black text-primary">
                {closingStock} {selectedMaterial?.unit || ""}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isAdjustment} onChange={(e) => setIsAdjustment(e.target.checked)} />
              Flag as Explicit Stock Adjustment (Requires Reason)
            </label>
            {isAdjustment && (
              <input
                type="number"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                placeholder="+/- Adj Qty"
                className="w-28 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Notes / Reason {isAdjustment && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              required={isAdjustment}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAdjustment ? "Mandatory physical audit variance reason..." : "Optional daily register note..."}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20">
              {submitting ? "Saving..." : "Save Daily Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDailyStockModal;
