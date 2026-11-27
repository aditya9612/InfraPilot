import React from "react";
import { Edit2, Eye, CheckCircle2, PackagePlus, ShieldAlert, Globe, Building2 } from "lucide-react";
import type { PurchaseOrder } from "../../../types/material";

interface PurchaseOrderTableProps {
  pos: PurchaseOrder[];
  projectMap?: Record<number, string>;
  supplierMap?: Record<number, string>;
  onEdit: (po: PurchaseOrder) => void;
  onView?: (po: PurchaseOrder) => void;
  onApprove?: (po: PurchaseOrder) => void;
  onCreateInward?: (po: PurchaseOrder) => void;
  onCancelWithOTP?: (po: PurchaseOrder) => void;
  onDelete: (id: number) => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  pos,
  projectMap = {},
  supplierMap = {},
  onEdit,
  onView,
  onApprove,
  onCreateInward,
  onCancelWithOTP,
  onDelete,
}) => {
  const getStatusStyle = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "FULLY_RECEIVED":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "APPROVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PARTIALLY_RECEIVED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "SUBMITTED":
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <th className="px-5 py-4 font-bold text-slate-800">PO # & Type</th>
            <th className="px-5 py-4 font-bold text-slate-800">Site / Scope</th>
            <th className="px-5 py-4 font-bold text-slate-800">Materials</th>
            <th className="px-5 py-4 font-bold text-slate-800">Supplier</th>
            <th className="px-5 py-4 font-bold text-slate-800">Inward Progress</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Total Amount</th>
            <th className="px-5 py-4 font-bold text-slate-800">Status</th>
            <th className="px-5 py-4 font-bold text-slate-800">Order Date</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {pos.map((po) => {
            const isCommon = po.po_type === "COMMON" || !po.project_id;
            const orderedTotal = po.items && po.items.length > 0
              ? po.items.reduce((s, i) => s + (Number(i.ordered_qty) || 0), 0)
              : Number(po.quantity) || 0;
            const receivedTotal = po.items && po.items.length > 0
              ? po.items.reduce((s, i) => s + (Number(i.received_qty) || 0), 0)
              : po.status === "FULLY_RECEIVED" || po.status === "COMPLETED"
                ? orderedTotal
                : 0;
            const progressPct = orderedTotal > 0 ? Math.min(100, Math.round((receivedTotal / orderedTotal) * 100)) : 0;
            const canApprove = po.status === "DRAFT" || po.status === "SUBMITTED" || po.status === "PENDING" || po.status === "CREATED";
            const canInward = po.status !== "CANCELLED" && po.status !== "FULLY_RECEIVED" && po.status !== "COMPLETED" && po.status !== "CLOSED";

            return (
              <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-mono text-xs font-black text-slate-900">
                    {po.po_number || `PO-${String(po.id).padStart(4, "0")}`}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCommon ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isCommon ? <Globe className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {isCommon ? "Common PO" : "Site-wise"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-700">
                    {isCommon
                      ? "Company-wide Pool"
                      : (po.project_id && projectMap[po.project_id]) || po.project_name || `Site #${po.project_id}`}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-900">{po.material_name}</p>
                  {po.items && po.items.length > 1 && (
                    <p className="text-[11px] font-semibold text-primary">{po.items.length} line items</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-700">
                    {po.supplier_name || (po.supplier_id && supplierMap[po.supplier_id]) || `Supplier #${po.supplier_id}`}
                  </p>
                </td>
                <td className="px-5 py-4 min-w-[140px]">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>{receivedTotal} / {orderedTotal}</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressPct === 100 ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-black text-slate-900">
                  ₹{(Number(po.total_amount) || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(po.status)}`}>
                    {(po.status || "SUBMITTED").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                  {po.created_at
                    ? new Date(po.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onView && (
                      <button
                        onClick={() => onView(po)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="View PO Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onApprove && canApprove && (
                      <button
                        onClick={() => onApprove(po)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Approve PO"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {onCreateInward && canInward && (
                      <button
                        onClick={() => onCreateInward(po)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Record Inward Against PO"
                      >
                        <PackagePlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(po)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit PO"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onCancelWithOTP && po.status !== "CANCELLED" && (
                      <button
                        onClick={() => onCancelWithOTP(po)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Cancel PO (Requires Admin OTP)"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                    {!onCancelWithOTP && (
                      <button
                        onClick={() => onDelete(po.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete PO"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {pos.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                No purchase orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrderTable;
