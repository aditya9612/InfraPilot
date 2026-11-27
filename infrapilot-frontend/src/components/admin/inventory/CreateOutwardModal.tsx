import React, { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, X, AlertTriangle } from "lucide-react";
import type { Material, CreateOutwardPayload } from "../../../types/material";

interface CreateOutwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  inventory: Material[];
  onSubmit: (payload: CreateOutwardPayload) => Promise<void>;
}

const CreateOutwardModal: React.FC<CreateOutwardModalProps> = ({
  isOpen,
  onClose,
  projects,
  inventory,
  onSubmit,
}) => {
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
  const [materialId, setMaterialId] = useState<number>(0);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [workLocation, setWorkLocation] = useState<string>("");
  const [issueSlipNo, setIssueSlipNo] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setProjectId(projects[0]?.id || 0);
      setMaterialId(0);
      setIssueQty(1);
      setIssuedTo("");
      setPurpose("");
      setWorkLocation("");
      setIssueSlipNo("");
      setRemarks("");
    }
  }, [isOpen]);

  const siteMaterials = useMemo(
    () => inventory.filter((m) => !projectId || m.project_id === projectId),
    [inventory, projectId]
  );

  const selectedMaterial = useMemo(
    () => siteMaterials.find((m) => m.id === materialId) || null,
    [siteMaterials, materialId]
  );

  const availableStock = Number(selectedMaterial?.remaining_stock || 0);
  const isOverStock = selectedMaterial !== null && issueQty > availableStock;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!projectId || !selectedMaterial) {
      setErrorMsg("Please select both site and material.");
      return;
    }
    if (issueQty <= 0) {
      setErrorMsg("Issue quantity must be greater than zero.");
      return;
    }
    if (issueQty > availableStock) {
      setErrorMsg(`Insufficient stock! Only ${availableStock} ${selectedMaterial.unit_name || selectedMaterial.unit} available.`);
      return;
    }
    if (!issuedTo.trim() || !purpose.trim()) {
      setErrorMsg("Issued To (Contractor/Dept) and Purpose are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        project_id: projectId,
        issue_date: issueDate,
        issued_to: issuedTo.trim(),
        purpose: purpose.trim(),
        work_location: workLocation.trim() || undefined,
        issue_slip_no: issueSlipNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
        items: [
          {
            material_id: selectedMaterial.id,
            material_name: selectedMaterial.material_name,
            material_code: selectedMaterial.material_code,
            unit: selectedMaterial.unit_name || selectedMaterial.unit,
            available_stock: availableStock,
            issue_qty: Number(issueQty),
            rate: Number(selectedMaterial.purchase_rate || 0),
          },
        ],
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to record outward issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Record Outward Material Issue</h2>
              <p className="text-xs text-slate-500">Issue site stock with real-time negative balance protection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Project Site <span className="text-rose-500">*</span>
              </label>
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
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Material <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={materialId || ""}
                onChange={(e) => setMaterialId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                <option value="">Select Material...</option>
                {siteMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.material_name} (Avail: {m.remaining_stock} {m.unit_name || m.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMaterial && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${isOverStock ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
              <span>Current Available Stock: {availableStock} {selectedMaterial.unit_name || selectedMaterial.unit}</span>
              <span>Rate: ₹{Number(selectedMaterial.purchase_rate || 0).toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Issue Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={issueQty}
                onChange={(e) => setIssueQty(Math.max(0, Number(e.target.value)))}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none ${isOverStock ? "border-rose-400 text-rose-700" : "border-slate-200 text-slate-800"}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Issued To (Contractor / Dept) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RCC Contractor / Block A Team"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Issue Slip / Gate Pass No.
              </label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={issueSlipNo}
                onChange={(e) => setIssueSlipNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Purpose / Task Ref <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2nd Floor Slab Pouring"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Work Location</label>
              <input
                type="text"
                placeholder="e.g. Wing B - Level 3"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional site supervisor notes..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isOverStock}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Posting Issue..." : "Post Outward Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOutwardModal;
