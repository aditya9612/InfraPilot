import React from "react";
import { Truck, FileText, ShieldAlert, X, CheckCircle2 } from "lucide-react";
import type { InwardReceipt } from "../../../types/material";

interface ViewInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: InwardReceipt | null;
  projectMap: Record<number, string>;
  supplierMap: Record<number, string>;
  onCancelWithOTP?: (receipt: InwardReceipt) => void;
}

const ViewInwardModal: React.FC<ViewInwardModalProps> = ({
  isOpen,
  onClose,
  receipt,
  projectMap,
  supplierMap,
  onCancelWithOTP,
}) => {
  if (!isOpen || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{receipt.receipt_no}</h2>
              <p className="text-xs text-slate-500">Challan / Invoice: {receipt.challan_no} • Delivery: {receipt.delivery_date}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Receiving Site</p>
              <p className="font-bold text-slate-900 mt-0.5">{projectMap[receipt.receiving_project_id] || `Site #${receipt.receiving_project_id}`}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Supplier</p>
              <p className="font-bold text-slate-900 mt-0.5">{supplierMap[receipt.supplier_id] || `Supplier #${receipt.supplier_id}`}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Inspection</p>
              <p className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {receipt.inspection_status}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
              <p className={`font-black mt-0.5 ${receipt.status === "CANCELLED" ? "text-rose-600" : "text-emerald-700"}`}>
                {receipt.status}
              </p>
            </div>
          </div>

          {(receipt.vehicle_no || receipt.transporter || receipt.justification) && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-wrap gap-4 items-center">
              <Truck className="w-4 h-4 text-slate-400" />
              {receipt.vehicle_no && <span>Vehicle: <strong>{receipt.vehicle_no}</strong></span>}
              {receipt.transporter && <span>Transporter: <strong>{receipt.transporter}</strong></span>}
              {receipt.justification && <span className="text-amber-700">Direct Inward Reason: <strong>{receipt.justification}</strong></span>}
            </div>
          )}

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3 text-right">Received Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-bold text-slate-900">{it.material_name} ({it.unit || "Units"})</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">{it.received_qty}</td>
                    <td className="px-4 py-3 text-right">₹{Number(it.rate).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right font-bold">₹{Number(it.total).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            {onCancelWithOTP && receipt.status === "POSTED" && (
              <button
                onClick={() => {
                  onClose();
                  onCancelWithOTP(receipt);
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> Cancel Receipt (OTP Required)
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInwardModal;
