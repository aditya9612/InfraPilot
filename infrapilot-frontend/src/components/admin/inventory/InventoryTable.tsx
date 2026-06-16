import { Edit2, PlusCircle, MinusCircle, Trash2 } from "lucide-react";
import type { Material } from "../../../types/material";
import { formatCurrency } from "../../../utils/currencyUtils";

interface InventoryTableProps {
  materials: Material[];
  projects: Record<number, string>;
  onEdit: (material: Material) => void;
  onPurchase: (material: Material) => void;
  onUsage: (material: Material) => void;
  onDelete: (id: number) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  materials,
  projects,
  onEdit,
  onPurchase,
  onUsage,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
            <th className="px-6 py-4">Site & Material (ID)</th>
            <th className="px-6 py-4">Inventory Ledger (Bought/Used)</th>
            <th className="px-6 py-4">Rate & Value</th>
            <th className="px-6 py-4">Financials (Paid/Pending)</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          {materials.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  <span className="font-semibold text-slate-600 text-xs">
                    {projects[item.project_id] || "Unknown Site"}
                  </span>
                </div>
                <p className="font-bold text-slate-800">
                  {item.material_name}{" "}
                  <span className="text-slate-400 font-medium">#{item.material_code}</span>
                </p>
                <p className="text-slate-500 text-[10px] font-bold tracking-tight uppercase mt-0.5">
                  {item.category} • {item.supplier_name}
                </p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-base font-bold ${item.remaining_stock < item.minimum_stock_level ? "text-rose-500" : "text-emerald-600"
                      }`}
                  >
                    {item.remaining_stock.toLocaleString()} {item.unit}
                  </span>
                  {item.remaining_stock < item.minimum_stock_level && (
                    <span
                      className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      title="Low Inventory Alert"
                    />
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium flex gap-2">
                  <span>Bought: {item.quantity_purchased}</span>
                  <span>|</span>
                  <span>Used: {item.quantity_used}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="font-bold text-slate-700">
                  {formatCurrency(item.purchase_rate)}{" "}
                  <span className="text-xs font-normal text-slate-400">/ {item.unit}</span>
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Total Value: {formatCurrency(item.remaining_stock * item.purchase_rate)}
                </p>
              </td>
              <td className="px-6 py-4">
                <p className="text-xs font-bold text-emerald-600 mb-1">
                  Paid: {formatCurrency(item.payment_given)}
                </p>
                <p className={`text-xs font-bold ${item.payment_pending > 0 ? "text-amber-500" : "text-slate-400"}`}>
                  Pending: {formatCurrency(item.payment_pending)}
                </p>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                    title="Edit Material"
                  >
                    <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onPurchase(item)}
                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-all duration-200"
                    title="Log Purchase (Stock In)"
                  >
                    <PlusCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onUsage(item)}
                    className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                    title="Log Usage (Stock Out)"
                  >
                    <MinusCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {materials.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400">
                No inventory records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
