import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import type { Supplier } from "../../../types/material";

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
            <th className="px-6 py-4">Supplier Name</th>
            <th className="px-6 py-4">Contact Person</th>
            <th className="px-6 py-4">Phone / Email</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {suppliers.map((sup) => (
            <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-700">{sup.name}</p>
                <p className="text-xs text-slate-400 font-medium">ID: SUP-{sup.id}</p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                {/* Contact person isn't in the new simplified API but we can handle it if present in data */}
                {(sup as any).contactPerson || "N/A"}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                <p className="text-slate-700">{sup.contact}</p>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onEdit(sup)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                    title="Edit Supplier"
                  >
                    <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onDelete(sup.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-slate-400">
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;
