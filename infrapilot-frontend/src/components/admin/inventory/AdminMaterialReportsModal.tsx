import React, { useState, useMemo } from "react";
import { FileSpreadsheet, FileText, X, BarChart3 } from "lucide-react";
import type {
  Material,
  PurchaseOrder,
  InwardReceipt,
  OutwardIssue,
  DailyStockRecord,
  StockLedgerEntry,
  ValuationMethod,
} from "../../../types/material";
import { materialService } from "../../../services/materialService";
import { computeMaterialValuation, formatValuationCurrency } from "../../../utils/stockValuationUtils";

export type AdminReportKey =
  | "overall_stock"
  | "site_stock"
  | "daily_movement"
  | "material_lifecycle"
  | "po_report"
  | "inward_report"
  | "outward_report"
  | "combined_movement"
  | "audit_activity";

interface AdminMaterialReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: AdminReportKey;
  materials: Material[];
  pos: PurchaseOrder[];
  inwards: InwardReceipt[];
  outwards: OutwardIssue[];
  dailyStocks: DailyStockRecord[];
  ledger: StockLedgerEntry[];
  projectMap: Record<number, string>;
  supplierMap: Record<number, string>;
  valuationMethod?: ValuationMethod;
  maskPrices?: boolean;
}

const REPORT_DEFS: Array<{ key: AdminReportKey; title: string; subtitle: string }> = [
  { key: "overall_stock", title: "1. Overall Stock Report", subtitle: "Company-wide balances, site distribution & valuation" },
  { key: "site_stock", title: "2. Site-wise Stock Report", subtitle: "Receipts, issues, current balance & value by project" },
  { key: "daily_movement", title: "3. Daily Stock Movement Report", subtitle: "Opening, inward, outward, adjustments & closing stock" },
  { key: "material_lifecycle", title: "4. Material Lifecycle Report", subtitle: "Chronological movement for a specific material across sites" },
  { key: "po_report", title: "5. Purchase Order (PO) Report", subtitle: "Ordered vs received vs pending fulfillment & amounts" },
  { key: "inward_report", title: "6. Inward Receipt Report", subtitle: "Challan-wise receipts, suppliers & receiving sites" },
  { key: "outward_report", title: "7. Outward Issue Report", subtitle: "Issue slips, contractors, purposes & consumed qty" },
  { key: "combined_movement", title: "8. Combined Movement Reconciliation", subtitle: "PO -> Inward -> Outward -> Remaining Stock view" },
  { key: "audit_activity", title: "9. User Activity & Audit Report", subtitle: "Ledger entries, reversals, creators & IST timestamps" },
];

const AdminMaterialReportsModal: React.FC<AdminMaterialReportsModalProps> = ({
  isOpen,
  onClose,
  initialReport = "overall_stock",
  materials,
  pos,
  inwards,
  outwards,
  dailyStocks,
  ledger,
  projectMap,
  supplierMap,
  valuationMethod = "WAC",
  maskPrices = false,
}) => {
  const [selectedReport, setSelectedReport] = useState<AdminReportKey>(initialReport);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");

  const projectOptions = useMemo(
    () => Object.entries(projectMap).map(([id, name]) => ({ id: Number(id), name })),
    [projectMap]
  );

  const uniqueMaterialNames = useMemo(
    () => Array.from(new Set(materials.map((m) => m.material_name).filter(Boolean))).sort(),
    [materials]
  );

  const reportPayload = useMemo((): { title: string; columns: string[]; rows: any[][] } => {
    const pid = siteFilter === "all" ? null : Number(siteFilter);
    const matMatch = (name?: string) => materialFilter === "all" || (name || "").toLowerCase() === materialFilter.toLowerCase();

    switch (selectedReport) {
      case "overall_stock": {
        const grouped: Record<string, { code: string; name: string; unit: string; sites: Set<string>; qty: number; val: number }> = {};
        materials
          .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name))
          .forEach((m) => {
            const k = (m.material_name || "").toLowerCase();
            const v = computeMaterialValuation(m, inwards, valuationMethod);
            if (!grouped[k]) {
              grouped[k] = {
                code: m.material_code || `MAT-${m.id}`,
                name: m.material_name,
                unit: m.unit_name || m.unit || "Units",
                sites: new Set(),
                qty: 0,
                val: 0,
              };
            }
            grouped[k].sites.add(projectMap[m.project_id] || `Site #${m.project_id}`);
            grouped[k].qty += Number(m.remaining_stock || 0);
            grouped[k].val += v.totalValue;
          });
        return {
          title: "Overall Stock Report",
          columns: ["Code", "Material Name", "Sites", "Unit", "Total Balance", `Avg Rate (${valuationMethod})`, "Total Valuation"],
          rows: Object.values(grouped).map((g) => [
            g.code,
            g.name,
            Array.from(g.sites).join(", "),
            g.unit,
            g.qty,
            formatValuationCurrency(g.qty > 0 ? g.val / g.qty : 0, maskPrices),
            formatValuationCurrency(g.val, maskPrices),
          ]),
        };
      }

      case "site_stock":
        return {
          title: "Site-wise Stock Report",
          columns: ["Site", "Material", "Unit", "Purchased", "Used", "Remaining", "Min Level", "Status", "Valuation"],
          rows: materials
            .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name))
            .map((m) => {
              const v = computeMaterialValuation(m, inwards, valuationMethod);
              const alert = m.remaining_stock <= 0 ? "Out of Stock" : m.remaining_stock <= m.minimum_stock_level ? "Low Stock" : "In Stock";
              return [
                projectMap[m.project_id] || `Site #${m.project_id}`,
                m.material_name,
                m.unit_name || m.unit || "Units",
                m.quantity_purchased || 0,
                m.quantity_used || 0,
                m.remaining_stock || 0,
                m.minimum_stock_level || 0,
                alert,
                formatValuationCurrency(v.totalValue, maskPrices),
              ];
            }),
        };

      case "daily_movement":
        return {
          title: "Daily Stock / Movement Report",
          columns: ["Date", "Site", "Material", "Opening", "Inward", "Outward", "Adjustment", "Closing", "Closing Value", "Source"],
          rows: dailyStocks
            .filter((d) => (!pid || d.project_id === pid) && matMatch(d.material_name))
            .map((d) => [
              d.date,
              projectMap[d.project_id] || `Site #${d.project_id}`,
              d.material_name,
              d.opening_stock,
              d.inward_qty,
              d.outward_qty,
              d.adjustment_qty || 0,
              d.closing_stock,
              formatValuationCurrency(d.closing_value, maskPrices),
              d.entry_source,
            ]),
        };

      case "material_lifecycle":
        return {
          title: "Individual Material Lifecycle Report",
          columns: ["Date & Time (IST)", "Material", "Site", "Transaction", "Ref No.", "In Qty", "Out Qty", "Balance", "Notes"],
          rows: ledger
            .filter((l) => (!pid || l.project_id === pid) && matMatch(l.material_name))
            .map((l) => [
              new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
              l.material_name,
              projectMap[l.project_id] || `Site #${l.project_id}`,
              l.tx_type,
              l.ref_no,
              l.in_qty,
              l.out_qty,
              l.running_balance,
              l.notes || "—",
            ]),
        };

      case "po_report":
        return {
          title: "Purchase Order (PO) Report",
          columns: ["PO #", "Type", "Site", "Supplier", "Materials", "Ordered Qty", "Received Qty", "Total Amount", "Status"],
          rows: pos
            .filter((p) => !pid || p.project_id === pid)
            .map((p) => {
              const recQty = p.items?.reduce((s, it) => s + (it.received_qty || 0), 0) || (p.status === "COMPLETED" ? p.quantity : 0);
              return [
                p.po_number || `PO-${p.id}`,
                p.po_type || (p.project_id ? "SITE_WISE" : "COMMON"),
                p.project_id ? projectMap[p.project_id] || `Site #${p.project_id}` : "Company-wide",
                p.supplier_name || supplierMap[p.supplier_id] || `Supplier #${p.supplier_id}`,
                p.material_name,
                p.quantity,
                recQty,
                formatValuationCurrency(p.total_amount, maskPrices),
                p.status,
              ];
            }),
        };

      case "inward_report":
        return {
          title: "Inward Receipt Report",
          columns: ["Receipt No.", "Challan No.", "Delivery Date", "Site", "Supplier", "Items", "Total Amount", "Inspection", "Status"],
          rows: inwards
            .filter((i) => !pid || i.receiving_project_id === pid)
            .map((i) => [
              i.receipt_no,
              i.challan_no,
              i.delivery_date,
              projectMap[i.receiving_project_id] || `Site #${i.receiving_project_id}`,
              supplierMap[i.supplier_id] || `Supplier #${i.supplier_id}`,
              i.items.map((x) => `${x.material_name} (${x.received_qty})`).join(", "),
              formatValuationCurrency(i.total_amount, maskPrices),
              i.inspection_status,
              i.status,
            ]),
        };

      case "outward_report":
        return {
          title: "Outward Material Issue Report",
          columns: ["Issue Slip", "Date", "Site", "Issued To", "Purpose", "Items Issued", "Total Value", "Status"],
          rows: outwards
            .filter((o) => !pid || o.project_id === pid)
            .map((o) => [
              o.issue_slip_no,
              o.issue_date,
              projectMap[o.project_id] || `Site #${o.project_id}`,
              o.issued_to,
              o.purpose,
              o.items.map((x) => `${x.material_name} (${x.issue_qty})`).join(", "),
              formatValuationCurrency(o.total_value, maskPrices),
              o.status,
            ]),
        };

      case "combined_movement":
        return {
          title: "Combined Movement Reconciliation (PO -> Inward -> Outward -> Balance)",
          columns: ["Site", "Material", "Total Ordered (PO)", "Total Purchased/Inward", "Total Used/Outward", "Remaining Balance", "Valuation"],
          rows: materials
            .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name))
            .map((m) => {
              const poOrdered = pos
                .filter((p) => (p.project_id === m.project_id || !p.project_id) && p.material_id === m.id && p.status !== "CANCELLED")
                .reduce((s, p) => s + Number(p.quantity || 0), 0);
              const val = computeMaterialValuation(m, inwards, valuationMethod);
              return [
                projectMap[m.project_id] || `Site #${m.project_id}`,
                m.material_name,
                poOrdered,
                m.quantity_purchased || 0,
                m.quantity_used || 0,
                m.remaining_stock || 0,
                formatValuationCurrency(val.totalValue, maskPrices),
              ];
            }),
        };

      case "audit_activity":
        return {
          title: "User Activity & Audit Report",
          columns: ["Timestamp (IST)", "User", "Action / Tx", "Ref No.", "Site", "Material", "Notes"],
          rows: ledger
            .filter((l) => (!pid || l.project_id === pid) && matMatch(l.material_name))
            .map((l) => [
              new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
              l.user_name || "Admin",
              l.tx_type,
              l.ref_no,
              projectMap[l.project_id] || `Site #${l.project_id}`,
              l.material_name,
              l.notes || "—",
            ]),
        };
    }
  }, [selectedReport, siteFilter, materialFilter, materials, pos, inwards, outwards, dailyStocks, ledger, projectMap, supplierMap, valuationMethod, maskPrices]);

  if (!isOpen) return null;

  const scopeLabel = siteFilter === "all" ? "All Sites (Company-Wide)" : projectMap[Number(siteFilter)] || `Site #${siteFilter}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Material & Inventory Report Center (9 Reports)</h2>
              <p className="text-xs text-slate-500">Filter by site or material, inspect live preview, and export Excel or PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Sidebar list of 9 reports */}
          <div className="lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-3 overflow-y-auto space-y-1.5">
            {REPORT_DEFS.map((rep) => (
              <button
                key={rep.key}
                type="button"
                onClick={() => setSelectedReport(rep.key)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                  selectedReport === rep.key
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "hover:bg-white text-slate-700"
                }`}
              >
                <p className="text-xs font-bold">{rep.title}</p>
                <p className={`text-[10px] mt-0.5 ${selectedReport === rep.key ? "text-blue-100" : "text-slate-400"}`}>
                  {rep.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Main preview & export */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="all">All Project Sites</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="all">All Materials</option>
                  {uniqueMaterialNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => materialService.exportAdminReportExcel(reportPayload.title, reportPayload.columns, reportPayload.rows)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => materialService.exportAdminReportPdf(reportPayload.title, scopeLabel, reportPayload.columns, reportPayload.rows)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="flex-1 border border-slate-200 rounded-2xl overflow-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    {reportPayload.columns.map((c) => (
                      <th key={c} className="px-4 py-3 font-bold text-slate-800">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportPayload.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 text-slate-700 font-medium">{String(cell ?? "—")}</td>
                      ))}
                    </tr>
                  ))}
                  {reportPayload.rows.length === 0 && (
                    <tr>
                      <td colSpan={reportPayload.columns.length} className="py-12 text-center text-slate-400 font-bold">
                        No records match the current report filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMaterialReportsModal;
