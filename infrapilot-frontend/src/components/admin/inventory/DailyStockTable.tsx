import React from "react";
import type { DailyStockRecord } from "../../../types/material";
import { formatValuationCurrency } from "../../../utils/stockValuationUtils";

interface DailyStockTableProps {
  records: DailyStockRecord[];
  projectMap: Record<number, string>;
  maskPrices?: boolean;
}

const DailyStockTable: React.FC<DailyStockTableProps> = ({
  records,
  projectMap,
  maskPrices = false,
}) => {
  const getSourceBadge = (source: DailyStockRecord["entry_source"]) => {
    switch (source) {
      case "AUTO_TX":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MANUAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BULK_UPLOAD":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "ADJUSTMENT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <th className="px-5 py-4 font-bold text-slate-800">Date</th>
            <th className="px-5 py-4 font-bold text-slate-800">Site</th>
            <th className="px-5 py-4 font-bold text-slate-800">Material</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Opening</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">+ Inward</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">- Outward</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Adj.</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Closing</th>
            <th className="px-5 py-4 text-right font-bold text-slate-800">Closing Value</th>
            <th className="px-5 py-4 font-bold text-slate-800">Source & Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {records.map((rec) => (
            <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3.5 font-bold text-slate-800 text-xs">{rec.date}</td>
              <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                {projectMap[rec.project_id] || rec.project_name || `Site #${rec.project_id}`}
              </td>
              <td className="px-5 py-3.5">
                <p className="font-bold text-slate-900">{rec.material_name}</p>
                {rec.material_code && <p className="text-[10px] font-mono text-slate-400">{rec.material_code}</p>}
              </td>
              <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{rec.opening_stock}</td>
              <td className="px-5 py-3.5 text-right font-bold text-emerald-600">+{rec.inward_qty}</td>
              <td className="px-5 py-3.5 text-right font-bold text-rose-600">-{rec.outward_qty}</td>
              <td className="px-5 py-3.5 text-right font-semibold text-amber-600">{rec.adjustment_qty || 0}</td>
              <td className="px-5 py-3.5 text-right font-black text-slate-900">
                {rec.closing_stock} <span className="text-[10px] font-normal text-slate-400">{rec.unit}</span>
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-primary">
                {formatValuationCurrency(rec.closing_value, maskPrices)}
              </td>
              <td className="px-5 py-3.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSourceBadge(rec.entry_source)}`}>
                  {rec.entry_source.replace(/_/g, " ")}
                </span>
                {rec.notes && <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] truncate">{rec.notes}</p>}
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                No daily stock entries recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DailyStockTable;
