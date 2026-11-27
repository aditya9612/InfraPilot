import React, { useState, useMemo, useEffect } from "react";
import { Layers, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import type { Material, CreateOutwardPayload, OutwardIssueItem } from "../../../types/material";

interface BulkOutwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  inventory: Material[];
  onSubmit: (payload: CreateOutwardPayload) => Promise<void>;
}

const BulkOutwardModal: React.FC<BulkOutwardModalProps> = ({
  isOpen,
  onClose,
  projects,
  inventory,
  onSubmit,
}) => {
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [rows, setRows] = useState<Array<{ material_id: number; issue_qty: number }>>([{ material_id: 0, issue_qty: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setProjectId(projects[0]?.id || 0);
      setIssuedTo("");
      setPurpose("");
      setRows([{ material_id: 0, issue_qty: 1 }]);
    }
  }, [isOpen]);

  const siteMaterials = useMemo(
    () => inventory.filter((m) => !projectId || m.project_id === projectId),
    [inventory, projectId]
  );

  const aggregateQtyByMaterial = useMemo(() => {
    const map: Record<number, number> = {};
    rows.forEach((r) => {
      if (r.material_id > 0) {
        map[r.material_id] = (map[r.material_id] || 0) + (Number(r.issue_qty) || 0);
      }
    });
    return map;
  }, [rows]);

  const hasStockConflict = useMemo(() => {
    return Object.entries(aggregateQtyByMaterial).some(([mid, totalQty]) => {
      const mat = siteMaterials.find((m) => m.id === Number(mid));
      return mat ? totalQty > (Number(mat.remaining_stock) || 0) : false;
    });
  }, [aggregateQtyByMaterial, siteMaterials]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!projectId || !issuedTo.trim() || !purpose.trim()) {
      setErrorMsg("Project Site, Issued To, and Purpose are mandatory.");
      return;
    }
    if (hasStockConflict) {
      setErrorMsg("One or more items exceed available site stock.");
      return;
    }

    const validItems: OutwardIssueItem[] = [];
    rows.forEach((r) => {
      const mat = siteMaterials.find((m) => m.id === r.material_id);
      if (mat && r.issue_qty > 0) {
        validItems.push({
          material_id: mat.id,
          material_name: mat.material_name,
          material_code: mat.material_code,
          unit: mat.unit_name || mat.unit,
          available_stock: Number(mat.remaining_stock || 0),
          issue_qty: Number(r.issue_qty),
          rate: Number(mat.purchase_rate || 0),
        });
      }
    });

    if (validItems.length === 0) {
      setErrorMsg("Add at least one valid material row.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        project_id: projectId,
        issue_date: issueDate,
        issued_to: issuedTo.trim(),
        purpose: purpose.trim(),
        items: validItems,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to post bulk outward issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Bulk Outward Material Issue</h2>
              <p className="text-xs text-slate-500">Issue multiple materials in one slip with aggregate stock verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Project Site *</label>
              <select
                value={projectId || ""}
                onChange={(e) => {
                  setProjectId(Number(e.target.value));
                  setRows([{ material_id: 0, issue_qty: 1 }]);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Issue Date</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Issued To *</label>
              <input type="text" required placeholder="Contractor/Dept" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
            <div className="sm:col-span-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Purpose / Task Reference *</label>
              <input type="text" required placeholder="e.g. Foundation Concrete & Brickwork Phase 1" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Materials to Issue</h3>
              <button
                type="button"
                onClick={() => setRows((p) => [...p, { material_id: 0, issue_qty: 1 }])}
                className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 w-32 text-right">Issue Qty *</th>
                    <th className="px-4 py-3 text-center">Validation</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, idx) => {
                    const mat = siteMaterials.find((m) => m.id === r.material_id);
                    const avail = Number(mat?.remaining_stock || 0);
                    const aggQty = r.material_id > 0 ? aggregateQtyByMaterial[r.material_id] || 0 : 0;
                    const over = mat ? aggQty > avail : false;

                    return (
                      <tr key={idx} className={over ? "bg-rose-50/50" : ""}>
                        <td className="px-4 py-2.5">
                          <select
                            value={r.material_id || ""}
                            onChange={(e) =>
                              setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, material_id: Number(e.target.value) } : x)))
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                          >
                            <option value="">Select Material...</option>
                            {siteMaterials.map((m) => (
                              <option key={m.id} value={m.id}>{m.material_name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">
                          {mat ? `${avail} ${mat.unit_name || mat.unit}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            value={r.issue_qty}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, issue_qty: Math.max(0, Number(e.target.value)) } : x))
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-right"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold">
                          {!mat ? (
                            <span className="text-slate-400">Select item</span>
                          ) : over ? (
                            <span className="text-rose-600">Exceeds Stock ({aggQty}/{avail})</span>
                          ) : (
                            <span className="text-emerald-600">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            disabled={rows.length <= 1}
                            onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || hasStockConflict}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Posting Bulk Issue..." : "Post All Outward Issues"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkOutwardModal;
