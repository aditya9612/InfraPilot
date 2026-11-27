import React from "react";
import type { PurchaseOrder, InwardReceipt } from "../../../types/material";
import { FileText, MapPin, Package, Globe, Building2, CheckCircle2, PackagePlus, ShieldCheck, Clock } from "lucide-react";

interface ViewPOModalProps {
  isOpen: boolean;
  po: PurchaseOrder | null;
  projectMap: Record<number, string>;
  supplierMap?: Record<number, string>;
  inwards?: InwardReceipt[];
  onApprove?: (po: PurchaseOrder) => void;
  onCreateInward?: (po: PurchaseOrder) => void;
  onClose: () => void;
}

const ViewPOModal: React.FC<ViewPOModalProps> = ({
  isOpen,
  po,
  projectMap,
  supplierMap = {},
  inwards = [],
  onApprove,
  onCreateInward,
  onClose,
}) => {
  if (!isOpen || !po) return null;

  const isCommon = po.po_type === "COMMON" || !po.project_id;
  const linkedInwards = inwards.filter((inc) => inc.po_id === po.id);

  const items = po.items && po.items.length > 0
    ? po.items
    : [
        {
          id: 1,
          material_id: po.material_id,
          material_name: po.material_name,
          unit: "Units",
          ordered_qty: po.quantity,
          received_qty: po.status === "COMPLETED" || po.status === "FULLY_RECEIVED" ? po.quantity : 0,
          pending_balance_qty: po.status === "COMPLETED" || po.status === "FULLY_RECEIVED" ? 0 : po.quantity,
          rate: po.rate,
          line_total: po.total_amount,
        },
      ];

  const getStatusStyle = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "FULLY_RECEIVED":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "APPROVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PARTIALLY_RECEIVED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const canApprove = po.status === "DRAFT" || po.status === "SUBMITTED" || po.status === "PENDING" || po.status === "CREATED";
  const canInward = po.status !== "CANCELLED" && po.status !== "FULLY_RECEIVED" && po.status !== "COMPLETED" && po.status !== "CLOSED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {po.po_number || `PO-${po.id.toString().padStart(4, "0")}`}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                    isCommon ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {isCommon ? <Globe className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {isCommon ? "Common PO" : "Site-wise PO"}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getStatusStyle(po.status)}`}>
                  {(po.status || "SUBMITTED").replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Supplier: {po.supplier_name || (po.supplier_id && supplierMap[po.supplier_id]) || `Supplier #${po.supplier_id}`}
                {po.payment_terms ? ` • Terms: ${po.payment_terms}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Site Allocation</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {isCommon ? "Company-wide (Assigned on Inward)" : (po.project_id && projectMap[po.project_id]) || "Unknown Site"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Expected Delivery</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{po.delivery_date || "Standard Schedule"}</p>
            </div>

            <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Valuation</span>
              </div>
              <p className="text-lg font-black text-primary">₹{(Number(po.total_amount) || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Line Items & Balance Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items & Fulfillment Balance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3 text-right">Ordered</th>
                    <th className="px-4 py-3 text-right">Received</th>
                    <th className="px-4 py-3 text-right">Pending Balance</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {it.material_name} <span className="text-slate-400 font-normal">({it.unit || "Units"})</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{it.ordered_qty}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{it.received_qty}</td>
                      <td className="px-4 py-3 text-right font-black text-amber-600">{it.pending_balance_qty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{Number(it.rate).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">₹{Number(it.line_total).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked Inward Receipts */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inward Receipt History ({linkedInwards.length})</h3>
            </div>
            {linkedInwards.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 font-medium text-center">No goods receipts recorded against this PO yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {linkedInwards.map((rec) => (
                  <div key={rec.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{rec.receipt_no} — Challan: {rec.challan_no}</p>
                      <p className="text-slate-500">
                        Site: {projectMap[rec.receiving_project_id] || `Site #${rec.receiving_project_id}`} • Date: {rec.delivery_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">₹{rec.total_amount.toLocaleString("en-IN")}</p>
                      <span className="text-[10px] font-bold uppercase text-emerald-600">{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Created By: <strong className="text-slate-900">{po.created_by || "Admin"}</strong></span>
              {po.approved_by && (
                <span className="ml-3">Approved By: <strong className="text-emerald-700">{po.approved_by}</strong></span>
              )}
            </div>
            {po.notes && <p className="text-slate-500 italic">Notes: {po.notes}</p>}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          {onApprove && canApprove && (
            <button
              onClick={() => {
                onApprove(po);
                onClose();
              }}
              className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve PO
            </button>
          )}
          {onCreateInward && canInward && (
            <button
              onClick={() => {
                onClose();
                onCreateInward(po);
              }}
              className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm flex items-center gap-1.5"
            >
              <PackagePlus className="w-4 h-4" /> Record Inward
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-primary/20 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPOModal;
