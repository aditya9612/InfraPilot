import React, { useState, useEffect, useMemo } from "react";
import { PackagePlus, X, AlertTriangle, Paperclip } from "lucide-react";
import type { PurchaseOrder, Supplier, Material, CreateInwardPayload, InwardReceiptItem } from "../../../types/material";

interface CreateInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPO?: PurchaseOrder | null;
  pos: PurchaseOrder[];
  suppliers: Supplier[];
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  inventory: Material[];
  onSubmit: (payload: CreateInwardPayload) => Promise<void>;
}

const CreateInwardModal: React.FC<CreateInwardModalProps> = ({
  isOpen,
  onClose,
  initialPO = null,
  pos,
  suppliers,
  projects,
  inventory,
  onSubmit,
}) => {
  const [isDirectInward, setIsDirectInward] = useState(false);
  const [justification, setJustification] = useState("");
  const [selectedPOId, setSelectedPOId] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [receivingProjectId, setReceivingProjectId] = useState<number>(0);
  const [challanNo, setChallanNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporter, setTransporter] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [inspectionStatus, setInspectionStatus] = useState<"PENDING" | "PASSED" | "PARTIAL" | "REJECTED">("PASSED");
  const [allowOverDelivery, setAllowOverDelivery] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [items, setItems] = useState<InwardReceiptItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activePOs = useMemo(
    () =>
      pos.filter(
        (p) => p.status !== "CANCELLED" && p.status !== "FULLY_RECEIVED" && p.status !== "COMPLETED" && p.status !== "CLOSED"
      ),
    [pos]
  );

  const selectedPO = useMemo(() => pos.find((p) => p.id === selectedPOId) || null, [pos, selectedPOId]);
  const isSiteLocked = Boolean(selectedPO && selectedPO.po_type !== "COMMON" && selectedPO.project_id);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg("");
    setAllowOverDelivery(false);
    setChallanNo("");
    setVehicleNo("");
    setTransporter("");
    setDriverContact("");
    setAttachmentName("");
    setJustification("");

    if (initialPO) {
      setIsDirectInward(false);
      setSelectedPOId(initialPO.id);
    } else {
      setIsDirectInward(false);
      setSelectedPOId(0);
      setSupplierId(suppliers[0]?.id || 0);
      setReceivingProjectId(projects[0]?.id || 0);
      setItems([]);
    }
  }, [isOpen, initialPO]);

  useEffect(() => {
    if (isDirectInward) {
      setSelectedPOId(0);
      if (items.length === 0 && inventory.length > 0) {
        const m = inventory[0];
        setItems([
          {
            material_id: m.id,
            material_name: m.material_name,
            material_code: m.material_code,
            unit: m.unit_name || m.unit || "Units",
            received_qty: 1,
            rate: Number(m.purchase_rate || 0),
            total: Number(m.purchase_rate || 0),
          },
        ]);
      }
      return;
    }

    if (selectedPO) {
      setSupplierId(selectedPO.supplier_id);
      if (selectedPO.po_type !== "COMMON" && selectedPO.project_id) {
        setReceivingProjectId(selectedPO.project_id);
      } else {
        setReceivingProjectId(projects[0]?.id || 0);
      }

      const poItems =
        selectedPO.items && selectedPO.items.length > 0
          ? selectedPO.items
          : [
              {
                material_id: selectedPO.material_id,
                material_name: selectedPO.material_name,
                unit: "Units",
                ordered_qty: selectedPO.quantity,
                received_qty: 0,
                pending_balance_qty: selectedPO.quantity,
                rate: selectedPO.rate,
              },
            ];

      setItems(
        poItems.map((li) => ({
          material_id: li.material_id,
          material_name: li.material_name,
          unit: li.unit || "Units",
          ordered_qty: li.ordered_qty,
          pending_qty: li.pending_balance_qty ?? li.ordered_qty,
          received_qty: li.pending_balance_qty ?? li.ordered_qty,
          rate: li.rate,
          total: Number(((li.pending_balance_qty ?? li.ordered_qty) * li.rate).toFixed(2)),
        }))
      );
    }
  }, [selectedPO, isDirectInward]);

  if (!isOpen) return null;

  const hasOverDelivery = !isDirectInward && items.some((it) => it.pending_qty !== undefined && it.received_qty > it.pending_qty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!challanNo.trim()) {
      setErrorMsg("Invoice / Challan Number is required.");
      return;
    }
    if (!receivingProjectId) {
      setErrorMsg("Receiving Project Site is required.");
      return;
    }
    if (isDirectInward && !justification.trim()) {
      setErrorMsg("Mandatory justification is required for Direct Inward without a PO.");
      return;
    }
    if (!isDirectInward && !selectedPOId) {
      setErrorMsg("Please select an active Purchase Order or toggle Direct Inward.");
      return;
    }
    if (hasOverDelivery && !allowOverDelivery) {
      setErrorMsg("Received quantity exceeds PO pending balance. Enable 'Authorize Over-Delivery' to proceed.");
      return;
    }
    const validItems = items.filter((it) => it.material_id > 0 && it.received_qty > 0);
    if (validItems.length === 0) {
      setErrorMsg("Please enter a valid received quantity for at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        po_id: isDirectInward ? null : selectedPOId,
        supplier_id: supplierId,
        receiving_project_id: receivingProjectId,
        challan_no: challanNo.trim(),
        delivery_date: deliveryDate,
        vehicle_no: vehicleNo.trim() || undefined,
        transporter: transporter.trim() || undefined,
        driver_contact: driverContact.trim() || undefined,
        inspection_status: inspectionStatus,
        is_direct_inward: isDirectInward,
        justification: isDirectInward ? justification.trim() : undefined,
        allow_over_delivery: allowOverDelivery,
        attachment_name: attachmentName || undefined,
        items: validItems,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to post inward receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Record Goods Inward Receipt</h2>
              <p className="text-xs text-slate-500">PO-linked receipt or justified direct inward with atomic stock increment</p>
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

          {/* Direct Inward Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Direct Inward (Without PO)</p>
              <p className="text-[11px] text-slate-500">Emergency site procurement bypassing PO (requires justification reason)</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDirectInward}
                onChange={(e) => setIsDirectInward(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="ml-2 text-xs font-bold text-slate-700">Enable Direct Inward</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!isDirectInward ? (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Select Active PO <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPOId || ""}
                  onChange={(e) => setSelectedPOId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                >
                  <option value="">Select PO...</option>
                  {activePOs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.po_number || `PO-${String(p.id).padStart(4, "0")}`} ({p.po_type === "COMMON" || !p.project_id ? "Common" : "Site"}) — {p.material_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId || ""}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Receiving Site <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isSiteLocked}
                value={receivingProjectId || ""}
                onChange={(e) => setReceivingProjectId(Number(e.target.value))}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 ${
                  isSiteLocked ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Site...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
              {isSiteLocked && <p className="text-[10px] text-slate-500 mt-0.5">Locked to Site-wise PO project</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Invoice / Challan No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CHL-2026-089"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Vehicle No. & Transporter</label>
              <input
                type="text"
                placeholder="MH-12-AB-1234 / Transporter"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Quality Inspection</label>
              <select
                value={inspectionStatus}
                onChange={(e) => setInspectionStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                <option value="PASSED">Passed (Accepted)</option>
                <option value="PARTIAL">Partial Pass</option>
                <option value="PENDING">Pending Lab Check</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {isDirectInward && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Justification Reason (Mandatory for Direct Inward) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Explain urgent site need or why PO was bypassed..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
          )}

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Material</th>
                  {!isDirectInward && <th className="px-4 py-3 text-right">Pending PO Qty</th>}
                  <th className="px-4 py-3 w-32 text-right">Receiving Qty *</th>
                  <th className="px-4 py-3 w-28 text-right">Rate (₹)</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {isDirectInward ? (
                        <select
                          value={it.material_id}
                          onChange={(e) => {
                            const mat = inventory.find((m) => m.id === Number(e.target.value));
                            if (!mat) return;
                            setItems((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      material_id: mat.id,
                                      material_name: mat.material_name,
                                      unit: mat.unit_name || mat.unit || "Units",
                                      rate: Number(mat.purchase_rate || 0),
                                      total: r.received_qty * Number(mat.purchase_rate || 0),
                                    }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                        >
                          {inventory.map((m) => (
                            <option key={m.id} value={m.id}>{m.material_name}</option>
                          ))}
                        </select>
                      ) : (
                        `${it.material_name} (${it.unit || "Units"})`
                      )}
                    </td>
                    {!isDirectInward && (
                      <td className="px-4 py-2.5 text-right font-bold text-amber-600">{it.pending_qty ?? it.ordered_qty}</td>
                    )}
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={it.received_qty}
                        onChange={(e) => {
                          const qty = Math.max(0, Number(e.target.value));
                          setItems((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, received_qty: qty, total: Number((qty * r.rate).toFixed(2)) } : r))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-right"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">₹{Number(it.rate).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-black text-slate-900">
                      ₹{Number(it.total).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">
                      Select an active PO to load pending items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Paperclip className="w-4 h-4 text-primary" />
              <span>{attachmentName || "Attach Delivery Challan Scan"}</span>
              <input type="file" className="hidden" onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || "")} />
            </label>

            {hasOverDelivery && (
              <label className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverDelivery}
                  onChange={(e) => setAllowOverDelivery(e.target.checked)}
                />
                Authorize Over-Delivery Override
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Posting Receipt..." : "Post Inward & Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInwardModal;
