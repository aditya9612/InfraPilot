import { Edit2, PlusCircle, MinusCircle, Trash2, Eye, History, TrendingUp, Sliders } from "lucide-react";
import type { Material, InwardReceipt, ValuationMethod } from "../../../types/material";
import { computeMaterialValuation, formatValuationCurrency } from "../../../utils/stockValuationUtils";

interface InventoryTableProps {
  materials: Material[];
  projects: Record<number, string>;
  inwards?: InwardReceipt[];
  valuationMethod?: ValuationMethod;
  maskPrices?: boolean;
  onView: (material: Material) => void;
  onTransactions: (material: Material) => void;
  onPriceHistory: (material: Material) => void;
  onConfigureThreshold?: (material: Material) => void;
  onEdit: (material: Material) => void;
  onPurchase: (material: Material) => void;
  onUsage: (material: Material) => void;
  onDelete: (id: number) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  materials,
  projects,
  inwards = [],
  valuationMethod = "WAC",
  maskPrices = false,
  onView,
  onTransactions,
  onPriceHistory,
  onConfigureThreshold,
  onEdit,
  onPurchase,
  onUsage,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto min-h-[300px] border border-slate-100 shadow-sm rounded-2xl bg-white">
      <table className="w-full text-left whitespace-nowrap">
        <thead className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-bold text-slate-800">Code & Material</th>
            <th className="px-6 py-4 font-bold text-slate-800">Category / Brand</th>
            <th className="px-6 py-4 font-bold text-slate-800">Unit</th>
            <th className="px-6 py-4 text-center font-bold text-slate-800">Stock</th>
            <th className="px-6 py-4 text-center font-bold text-slate-800">Min Level</th>
            <th className="px-6 py-4 text-right font-bold text-slate-800">Rate ({valuationMethod})</th>
            <th className="px-6 py-4 text-right font-bold text-slate-800">Valuation</th>
            <th className="px-6 py-4 font-bold text-slate-800">Alert Status</th>
            <th className="px-6 py-4 font-bold text-slate-800">Supplier</th>
            <th className="px-6 py-4 text-right font-bold text-slate-800">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          {materials.map((item) => {
            const stock = Number(item.remaining_stock) || 0;
            const minLvl = Number(item.minimum_stock_level) || 0;
            const currentAlert =
              stock <= 0 ? "OUT_OF_STOCK" : stock <= minLvl ? "LOW_STOCK" : "IN_STOCK";
            const valuation = computeMaterialValuation(item, inwards, valuationMethod);

            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {item.material_code || `MAT-${item.id}`}
                    </span>
                    <p className="text-sm font-bold text-slate-900">{item.material_name}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {projects[item.project_id] || "Unknown Site"}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">{item.category || "General"}</p>
                  {item.material_master_brand && (
                    <p className="text-[10px] text-slate-400 font-semibold">{item.material_master_brand}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.unit_name || item.unit || "-"}</td>
                <td className="px-6 py-4 text-sm font-black text-slate-900 text-center">
                  {stock.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-semibold text-center">
                  <button
                    type="button"
                    onClick={() => onConfigureThreshold?.(item)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    title="Configure Min Stock Threshold"
                  >
                    <span>{minLvl.toLocaleString()}</span>
                    {onConfigureThreshold && <Sliders className="w-3 h-3 text-slate-400" />}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">
                  {formatValuationCurrency(valuation.unitRate, maskPrices)}
                </td>
                <td className="px-6 py-4 text-sm font-black text-primary text-right">
                  {formatValuationCurrency(valuation.totalValue, maskPrices)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                      currentAlert === "IN_STOCK"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : currentAlert === "LOW_STOCK"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {currentAlert === "IN_STOCK" ? "In Stock" : currentAlert === "LOW_STOCK" ? "Low Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.supplier_name || "N/A"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-all duration-200"
                      title="View Material Details"
                    >
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    {onConfigureThreshold && (
                      <button
                        onClick={() => onConfigureThreshold(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                        title="Configure Threshold"
                      >
                        <Sliders className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
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
                      title="Log Direct Purchase (Stock In)"
                    >
                      <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onUsage(item)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Log Direct Usage (Stock Out)"
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
              <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
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
