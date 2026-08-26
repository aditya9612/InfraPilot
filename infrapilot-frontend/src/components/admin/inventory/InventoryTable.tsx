import { Edit2, PlusCircle, MinusCircle, Trash2, Eye, History, TrendingUp } from "lucide-react";
import type { Material } from "../../../types/material";
import { formatCurrency } from "../../../utils/currencyUtils";

interface InventoryTableProps {
  materials: Material[];
  projects: Record<number, string>;
  onView: (material: Material) => void;
  onTransactions: (material: Material) => void;
  onPriceHistory: (material: Material) => void;
  onEdit: (material: Material) => void;
  onPurchase: (material: Material) => void;
  onUsage: (material: Material) => void;
  onDelete: (id: number) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  materials,
  projects,
  onView,
  onTransactions,
  onPriceHistory,
  onEdit,
  onPurchase,
  onUsage,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto min-h-[300px] border border-slate-100 shadow-sm rounded-2xl bg-white">
      <table className="w-full text-left whitespace-nowrap">
        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest sticky top-0 border-b border-slate-50">
          <tr>
            <th className="px-6 py-4">Name & Site</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Unit</th>
            <th className="px-6 py-4 text-center">Stock</th>
            <th className="px-6 py-4 text-center">Min Level</th>
            <th className="px-6 py-4 text-right">Rate</th>
            <th className="px-6 py-4">Alert</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          {materials.map((item) => {
            const currentAlert = item.alert_type || (item.remaining_stock <= 0 ? 'OUT_OF_STOCK' : item.remaining_stock < item.minimum_stock_level ? 'LOW_STOCK' : 'IN_STOCK');
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800">{item.material_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{projects[item.project_id] || "Unknown Site"}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.unit}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center">{item.remaining_stock?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-center">{item.minimum_stock_level?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatCurrency(item.purchase_rate)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${currentAlert === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : currentAlert === 'LOW_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {currentAlert.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.supplier_name || 'N/A'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-all duration-200"
                      title="View Material Details"
                    >
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onTransactions(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="Material Transactions"
                    >
                      <History className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onPriceHistory(item)}
                      className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      title="Price History"
                    >
                      <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all duration-200"
                      title="Edit Material"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onPurchase(item)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                      title="Log Purchase (Stock In)"
                    >
                      <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onUsage(item)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Log Usage (Stock Out)"
                    >
                      <MinusCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {materials.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-400">
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
