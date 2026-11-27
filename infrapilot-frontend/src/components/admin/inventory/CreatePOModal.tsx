import React, { useState, useMemo, useEffect } from "react";
import type { Material, Supplier, POCreate, POType, POLineItem } from "../../../types/material";
import { boqService } from "../../../services/boqService";
import { Plus, Trash2, X, Building2, Globe, Paperclip } from "lucide-react";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: POCreate) => Promise<void>;
  suppliers: Supplier[];
  projects: any[];
  inventory: Material[];
}

interface DraftLineItem {
  material_id: number;
  material_name: string;
  material_code?: string;
  unit: string;
  boq_item_id: number;
  ordered_qty: number;
  rate: number;
  tax_percent: number;
  discount_percent: number;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  projects,
  inventory,
}) => {
  const [poType, setPoType] = useState<POType>("SITE_WISE");
  const [projectId, setProjectId] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 30 Days");
  const [notes, setNotes] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [lineItems, setLineItems] = useState<DraftLineItem[]>([
    {
      material_id: 0,
      material_name: "",
      unit: "Units",
      boq_item_id: 0,
      ordered_qty: 1,
      rate: 0,
      tax_percent: 18,
      discount_percent: 0,
    },
  ]);

  const resetForm = () => {
    setPoType("SITE_WISE");
    setProjectId(0);
    setSupplierId(0);
    setDeliveryDate("");
    setPaymentTerms("Net 30 Days");
    setNotes("");
    setAttachmentName("");
    setLineItems([
      {
        material_id: 0,
        material_name: "",
        unit: "Units",
        boq_item_id: 0,
        ordered_qty: 1,
        rate: 0,
        tax_percent: 18,
        discount_percent: 0,
      },
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (poType === "SITE_WISE" && projectId > 0) {
      let active = true;
      boqService
        .getBoqItems(projectId)
        .then((res: any) => {
          if (!active) return;
          const list = Array.isArray(res) ? res : res?.items || res?.boq_items || res?.data || [];
          setBoqItems(list);
        })
        .catch(() => {
          if (active) setBoqItems([]);
        });
      return () => {
        active = false;
      };
    } else {
      setBoqItems([]);
    }
  }, [poType, projectId]);

  const availableMaterials = useMemo(() => {
    // Deduplicate catalog materials when Common PO is selected; otherwise filter by project if any exist
    const filtered = inventory.filter((m) => {
      const matchProj = poType === "COMMON" || !projectId || m.project_id === projectId;
      const matchSup = !supplierId || m.supplier_id === supplierId;
      return matchProj && matchSup;
    });
    if (filtered.length > 0) return filtered;
    // Fallback to full inventory list so admin can always pick any catalog material
    return inventory;
  }, [inventory, poType, projectId, supplierId]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    lineItems.forEach((row) => {
      const gross = (Number(row.ordered_qty) || 0) * (Number(row.rate) || 0);
      const disc = gross * ((Number(row.discount_percent) || 0) / 100);
      const taxable = gross - disc;
      const tax = taxable * ((Number(row.tax_percent) || 0) / 100);
      subtotal += gross;
      discountTotal += disc;
      taxTotal += tax;
    });

    const grandTotal = subtotal - discountTotal + taxTotal;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }, [lineItems]);

  if (!isOpen) return null;

  const updateRow = (index: number, patch: Partial<DraftLineItem>) => {
    setLineItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleMaterialPick = (index: number, materialId: number) => {
    const mat = inventory.find((m) => m.id === materialId || m.material_id === materialId);
    if (!mat) return;
    updateRow(index, {
      material_id: mat.id,
      material_name: mat.material_name,
      material_code: mat.material_code,
      unit: mat.unit_name || mat.unit || "Units",
      rate: Number(mat.purchase_rate || mat.avg_rate || 0),
    });
  };

  const addRow = () => {
    setLineItems((prev) => [
      ...prev,
      {
        material_id: 0,
        material_name: "",
        unit: "Units",
        boq_item_id: 0,
        ordered_qty: 1,
        rate: 0,
        tax_percent: 18,
        discount_percent: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (!supplierId) return;
    if (poType === "SITE_WISE" && !projectId) return;

    const validItems = lineItems.filter((r) => r.material_id > 0 && r.ordered_qty > 0);
    if (validItems.length === 0) return;

    setLoading(true);
    try {
      const formattedItems: Omit<POLineItem, "id" | "received_qty" | "pending_balance_qty">[] = validItems.map((r) => {
        const gross = r.ordered_qty * r.rate;
        const disc = gross * (r.discount_percent / 100);
        const tax = (gross - disc) * (r.tax_percent / 100);
        const bItem = boqItems.find((b) => b.id === r.boq_item_id);
        return {
          material_id: r.material_id,
          material_name: r.material_name,
          material_code: r.material_code,
          unit: r.unit,
          boq_item_id: r.boq_item_id || undefined,
          boq_item_name: bItem ? bItem.item_name || bItem.name : undefined,
          ordered_qty: Number(r.ordered_qty),
          rate: Number(r.rate),
          tax_percent: Number(r.tax_percent),
          discount_percent: Number(r.discount_percent),
          line_total: Number((gross - disc + tax).toFixed(2)),
        };
      });

      const primary = validItems[0];
      const payload: POCreate = {
        po_type: poType,
        supplier_id: supplierId,
        project_id: poType === "COMMON" ? null : projectId,
        material_id: primary.material_id,
        boq_item_id: primary.boq_item_id || undefined,
        quantity: validItems.reduce((s, x) => s + Number(x.ordered_qty), 0),
        rate: primary.rate,
        delivery_date: deliveryDate || undefined,
        payment_terms: paymentTerms || undefined,
        notes: attachmentName ? `${notes ? notes + " | " : ""}Attachment: ${attachmentName}` : notes || undefined,
        status: asDraft ? "DRAFT" : "SUBMITTED",
        items: formattedItems,
      };

      await onSubmit(payload);
      resetForm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Purchase Order (PO)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure Common or Site-wise PO with multi-item procurement</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PO Type Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPoType("SITE_WISE")}
              className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                poType === "SITE_WISE" ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Building2 className={`w-5 h-5 mt-0.5 ${poType === "SITE_WISE" ? "text-primary" : "text-slate-400"}`} />
              <div>
                <p className="text-sm font-bold text-slate-900">Site-wise Purchase Order</p>
                <p className="text-xs text-slate-500">Locked to a single site; inwards auto-credit that site.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setPoType("COMMON");
                setProjectId(0);
              }}
              className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                poType === "COMMON" ? "border-indigo-600 bg-indigo-50/60" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Globe className={`w-5 h-5 mt-0.5 ${poType === "COMMON" ? "text-indigo-600" : "text-slate-400"}`} />
              <div>
                <p className="text-sm font-bold text-slate-900">Company-wide Common PO</p>
                <p className="text-xs text-slate-500">Central bulk order; receiving site chosen during Inward receipt.</p>
              </div>
            </button>
          </div>

          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={supplierId || ""}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary"
              >
                <option value="" disabled>Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Project Site {poType === "SITE_WISE" && <span className="text-rose-500">*</span>}
              </label>
              <select
                required={poType === "SITE_WISE"}
                disabled={poType === "COMMON"}
                value={poType === "COMMON" ? "" : projectId || ""}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary ${
                  poType === "COMMON" ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">{poType === "COMMON" ? "Common (Chosen at Inward)" : "Select Project Site"}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Expected Delivery</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary"
              >
                <option value="Advance 100%">Advance 100%</option>
                <option value="50% Advance / 50% Delivery">50% Advance / 50% Delivery</option>
                <option value="On Delivery (COD)">On Delivery (COD)</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>
          </div>

          {/* Multi-Item Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">PO Line Items</h3>
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3">Material *</th>
                    <th className="px-3 py-3">Unit</th>
                    <th className="px-3 py-3 w-24">Qty *</th>
                    <th className="px-3 py-3 w-28">Rate (₹) *</th>
                    <th className="px-3 py-3 w-20">Tax %</th>
                    <th className="px-3 py-3 w-20">Disc %</th>
                    <th className="px-3 py-3 text-right">Line Total</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((row, idx) => {
                    const gross = row.ordered_qty * row.rate;
                    const disc = gross * (row.discount_percent / 100);
                    const tax = (gross - disc) * (row.tax_percent / 100);
                    const lineTotal = gross - disc + tax;

                    return (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 min-w-[200px]">
                          <select
                            required
                            value={row.material_id || ""}
                            onChange={(e) => handleMaterialPick(idx, Number(e.target.value))}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-primary"
                          >
                            <option value="" disabled>Select Material</option>
                            {availableMaterials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.material_name} ({m.material_code || `MAT-${m.id}`})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-600">{row.unit}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={1}
                            required
                            value={row.ordered_qty}
                            onChange={(e) => updateRow(idx, { ordered_qty: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            value={row.rate}
                            onChange={(e) => updateRow(idx, { rate: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.tax_percent}
                            onChange={(e) => updateRow(idx, { tax_percent: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.discount_percent}
                            onChange={(e) => updateRow(idx, { discount_percent: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-slate-900">
                          ₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            disabled={lineItems.length <= 1}
                            onClick={() => removeRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"
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

          {/* Notes & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Terms & Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, unloading notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-primary"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 w-fit">
                <Paperclip className="w-4 h-4 text-primary" />
                <span>{attachmentName || "Attach Quotation / Reference Document"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || "")}
                />
              </label>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>- ₹{totals.discountTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Tax (GST)</span>
                <span>+ ₹{totals.taxTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-900">Grand Total</span>
                <span className="text-xl font-black text-primary">₹{totals.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold">
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, true)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 text-sm font-bold"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePOModal;
