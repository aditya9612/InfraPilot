import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Layers, History, RotateCcw } from "lucide-react";
import type { Material, StockLedgerEntry, InwardReceipt, ValuationMethod } from "../../../types/material";
import { computeMaterialValuation, formatValuationCurrency } from "../../../utils/stockValuationUtils";

interface StockLedgerTableProps {
  materials: Material[];
  entries: StockLedgerEntry[];
  projectMap: Record<number, string>;
  inwards?: InwardReceipt[];
  valuationMethod?: ValuationMethod;
  maskPrices?: boolean;
}

const StockLedgerTable: React.FC<StockLedgerTableProps> = ({
  materials,
  entries,
  projectMap,
  inwards = [],
  valuationMethod = "WAC",
  maskPrices = false,
}) => {
  const [viewMode, setViewMode] = useState<"consolidated" | "chronological">("chronological");
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  const formatIST = (dateStr: string) => {
    try {
      let str = String(dateStr).trim();
      if (!str.endsWith("Z") && !str.includes("+")) {
        str = str.includes("T") ? `${str}Z` : `${str.replace(" ", "T")}Z`;
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return dateStr;
    }
  };

  // Group materials by name across all sites for Company-Wide Consolidated View
  const consolidatedRows = useMemo(() => {
    const groups: Record<
      string,
      {
        key: string;
        material_name: string;
        material_code: string;
        unit: string;
        totalStock: number;
        totalValue: number;
        sites: Array<{ project_id: number; siteName: string; stock: number; rate: number; value: number }>;
      }
    > = {};

    materials.forEach((m) => {
      const key = (m.material_name || "Unknown").trim().toLowerCase();
      const val = computeMaterialValuation(m, inwards, valuationMethod);
      if (!groups[key]) {
        groups[key] = {
          key,
          material_name: m.material_name,
          material_code: m.material_code || `MAT-${m.id}`,
          unit: m.unit_name || m.unit || "Units",
          totalStock: 0,
          totalValue: 0,
          sites: [],
        };
      }
      groups[key].totalStock += Number(m.remaining_stock || 0);
      groups[key].totalValue += val.totalValue;
      groups[key].sites.push({
        project_id: m.project_id,
        siteName: projectMap[m.project_id] || `Site #${m.project_id}`,
        stock: Number(m.remaining_stock || 0),
        rate: val.unitRate,
        value: val.totalValue,
      });
    });

    return Object.values(groups);
  }, [materials, inwards, valuationMethod, projectMap]);

  const getTxBadge = (type: StockLedgerEntry["tx_type"]) => {
    switch (type) {
      case "INWARD":
      case "TRANSFER_IN":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "OUTWARD":
      case "TRANSFER_OUT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REVERSAL":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("chronological")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "chronological" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Chronological Audit Ledger
          </button>
          <button
            type="button"
            onClick={() => setViewMode("consolidated")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "consolidated" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Company-Wide Consolidated ({consolidatedRows.length})
          </button>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          Immutable ledger — cancellations append equal and opposite reversal records
        </span>
      </div>

      {viewMode === "chronological" ? (
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-4 font-bold text-slate-800">Date & Time (IST)</th>
                <th className="px-5 py-4 font-bold text-slate-800">Site</th>
                <th className="px-5 py-4 font-bold text-slate-800">Material</th>
                <th className="px-5 py-4 font-bold text-slate-800">Tx Type</th>
                <th className="px-5 py-4 font-bold text-slate-800">Ref No.</th>
                <th className="px-5 py-4 text-right font-bold text-slate-800">In Qty</th>
                <th className="px-5 py-4 text-right font-bold text-slate-800">Out Qty</th>
                <th className="px-5 py-4 text-right font-bold text-slate-800">Running Balance</th>
                <th className="px-5 py-4 font-bold text-slate-800">User</th>
                <th className="px-5 py-4 font-bold text-slate-800">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {entries.map((e) => (
                <tr key={e.id} className={e.is_reversal ? "bg-rose-50/30" : "hover:bg-slate-50/70"}>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{formatIST(e.created_at)}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{projectMap[e.project_id] || e.project_name || `Site #${e.project_id}`}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{e.material_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getTxBadge(e.tx_type)}`}>
                      {e.is_reversal && <RotateCcw className="w-3 h-3" />}
                      {e.tx_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">{e.ref_no}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{e.in_qty > 0 ? `+${e.in_qty}` : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-rose-600">{e.out_qty > 0 ? `-${e.out_qty}` : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-black text-slate-900">
                    {e.running_balance} <span className="text-[10px] font-normal text-slate-400">{e.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{e.user_name || "Admin"}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[220px] truncate" title={e.notes}>
                    {e.notes || "—"}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                    No ledger entries recorded yet. Post an Inward or Outward transaction to begin audit trail.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-4 w-10"></th>
                <th className="px-5 py-4 font-bold text-slate-800">Material</th>
                <th className="px-5 py-4 font-bold text-slate-800">Code</th>
                <th className="px-5 py-4 font-bold text-slate-800">Sites Count</th>
                <th className="px-5 py-4 text-right font-bold text-slate-800">Consolidated Stock</th>
                <th className="px-5 py-4 text-right font-bold text-slate-800">Total Valuation ({valuationMethod})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {consolidatedRows.map((row) => {
                const isExpanded = expandedMaterial === row.key;
                return (
                  <React.Fragment key={row.key}>
                    <tr
                      onClick={() => setExpandedMaterial(isExpanded ? null : row.key)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{row.material_name}</td>
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">{row.material_code}</td>
                      <td className="px-5 py-4 text-xs font-bold text-primary">{row.sites.length} Sites</td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">
                        {row.totalStock.toLocaleString()} <span className="text-xs font-normal text-slate-400">{row.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-primary">
                        {formatValuationCurrency(row.totalValue, maskPrices)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-10 py-3">
                          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                                <tr>
                                  <th className="px-4 py-2">Site / Project</th>
                                  <th className="px-4 py-2 text-right">Site Stock</th>
                                  <th className="px-4 py-2 text-right">Unit Rate</th>
                                  <th className="px-4 py-2 text-right">Site Valuation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {row.sites.map((s, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 font-bold text-slate-800">{s.siteName}</td>
                                    <td className="px-4 py-2 text-right font-bold">{s.stock.toLocaleString()} {row.unit}</td>
                                    <td className="px-4 py-2 text-right">{formatValuationCurrency(s.rate, maskPrices)}</td>
                                    <td className="px-4 py-2 text-right font-bold text-primary">{formatValuationCurrency(s.value, maskPrices)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {consolidatedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No consolidated materials available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockLedgerTable;
