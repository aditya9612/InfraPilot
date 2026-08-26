import React from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import type { PurchaseOrder } from "../../../types/material";

interface PurchaseOrderTableProps {
  pos: PurchaseOrder[];
  projectMap?: Record<number, string>;
  onEdit: (po: PurchaseOrder) => void;
  onView?: (po: PurchaseOrder) => void;
  onDelete: (id: number) => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  pos,
  projectMap = {},
  onEdit,
  onView,
  onDelete,
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
            <th className="px-6 py-4">Project</th>
            <th className="px-6 py-4">Material</th>
            <th className="px-6 py-4">Quantity</th>
            <th className="px-6 py-4">Rate (₹)</th>
            <th className="px-6 py-4">Total Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {pos.map((po: any) => (
            <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="text-xs font-bold text-slate-600">
                  {projectMap[po.project_id] || projectMap[po.project?.id] || `Unknown Site (ID: ${po.project_id})`}
                </p>
              </td>
              <td className="px-6 py-4">
                <p className="font-bold text-slate-800">{po.material_name}</p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                {po.quantity} units
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                ₹{po.rate.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">
                ₹{po.total_amount.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(po.status)}`}>
                  {po.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  {onView && (
                    <button
                      onClick={() => onView(po)}
                      className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                      title="View PO"
                    >
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(po)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                    title="Edit PO"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onDelete(po.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                    title="Delete PO"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pos.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-400">
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
