import React from "react";
import { ArrowRight, CheckCircle, XCircle, Eye } from "lucide-react";
import type { Transfer } from "../../../types/material";

interface TransferTableProps {
  transfers: Transfer[];
  onStatusUpdate?: (id: number, status: Transfer["status"]) => void;
  onView?: (transfer: Transfer) => void;
}

const TransferTable: React.FC<TransferTableProps> = ({
  transfers,
  onStatusUpdate,
  onView,
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-50 text-emerald-600";
      case "PENDING": return "bg-amber-50 text-amber-600";
      case "CANCELLED": return "bg-rose-50 text-rose-600";
      default: return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
            <th className="px-6 py-4">Transfer ID</th>
            <th className="px-6 py-4">Material</th>
            <th className="px-6 py-4">From Site → To Site</th>
            <th className="px-6 py-4">Quantity</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transfers.map((tr) => (
            <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-800">TR-{tr.id.toString().padStart(4, '0')}</p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                {tr.material.name}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-500">{tr.from_project.name}</span>
                  <ArrowRight size={14} className="text-primary" />
                  <span className="text-primary">{tr.to_project.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">
                {tr.quantity} units
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(tr.status)}`}>
                  {tr.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {tr.status === "PENDING" && onStatusUpdate ? (
                    <>
                      <button
                        onClick={() => onStatusUpdate(tr.id, "COMPLETED")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                        title="Complete Transfer"
                      >
                        <CheckCircle size={14} /> Complete
                      </button>
                      <button
                        onClick={() => onStatusUpdate(tr.id, "CANCELLED")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                        title="Cancel Transfer"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onView?.(tr)}
                      className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {transfers.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                No transfer history found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransferTable;
