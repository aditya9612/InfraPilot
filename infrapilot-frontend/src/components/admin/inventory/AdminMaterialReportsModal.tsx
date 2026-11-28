import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FileSpreadsheet, FileText, X, BarChart3, RefreshCw, Cloud, Database } from "lucide-react";
import toast from "react-hot-toast";
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
  | "low_stock_alerts"
  | "batch_inventory"
  | "po_report"
  | "inward_report"
  | "outward_report"
  | "daily_stock_variance"
  | "supplier_stock"
  | "daily_movement"
  | "material_lifecycle"
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

const REPORT_DEFS: Array<{ key: AdminReportKey; title: string; subtitle: string; apiReportType: string }> = [
  { key: "overall_stock", title: "1. Stock Summary Report", subtitle: "GET /inventory/reports/stock-summary", apiReportType: "stock-summary" },
  { key: "low_stock_alerts", title: "2. Low Stock Alerts", subtitle: "GET /inventory/reports/low-stock-alerts", apiReportType: "low-stock-alerts" },
  { key: "batch_inventory", title: "3. Batch Inventory", subtitle: "GET /inventory/reports/batch-inventory", apiReportType: "batch-inventory" },
  { key: "po_report", title: "4. PO Fulfillment", subtitle: "GET /inventory/reports/po-fulfillment", apiReportType: "po-fulfillment" },
  { key: "inward_report", title: "5. GRN Register", subtitle: "GET /inventory/reports/grn-register", apiReportType: "grn-register" },
  { key: "outward_report", title: "6. Issue Register", subtitle: "GET /inventory/reports/issue-register", apiReportType: "issue-register" },
  { key: "daily_stock_variance", title: "7. Daily Stock Variance", subtitle: "GET /inventory/reports/daily-stock-variance", apiReportType: "daily-stock-variance" },
  { key: "supplier_stock", title: "8. Supplier Stock Report", subtitle: "GET /inventory/reports/supplier-stock", apiReportType: "supplier-stock" },
  { key: "daily_movement", title: "9. Daily Movement", subtitle: "GET /inventory/reports/daily-movement", apiReportType: "daily-movement" },
  { key: "material_lifecycle", title: "10. Movement Register", subtitle: "GET /inventory/reports/movement-register", apiReportType: "movement-register" },
  { key: "combined_movement", title: "11. Combined Movement", subtitle: "GET /inventory/reports/combined-movement", apiReportType: "combined-movement" },
  { key: "audit_activity", title: "12. Inventory Audit Trail", subtitle: "GET /inventory/reports/audit-trail", apiReportType: "audit-trail" },
];

const extractApiRows = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const candidateKeys = ["items", "data", "rows", "records", "alerts", "materials", "batches", "entries", "report", "results"];
  for (const key of candidateKeys) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  return [];
};

const formatCellValue = (key: string, val: any, maskPrices: boolean): string | number => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "object") return JSON.stringify(val);
  const lowerKey = key.toLowerCase();
  const isMonetary =
    lowerKey.includes("rate") ||
    lowerKey.includes("price") ||
    lowerKey.includes("value") ||
    lowerKey.includes("amount") ||
    lowerKey.includes("cost") ||
    lowerKey.includes("payment");
  if (isMonetary && typeof val === "number") {
    return formatValuationCurrency(val, maskPrices);
  }
  if ((lowerKey.includes("date") || lowerKey.includes("at") || lowerKey.includes("timestamp")) && typeof val === "string" && val.includes("T")) {
    const dt = new Date(val);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }
  }
  return typeof val === "boolean" ? (val ? "Yes" : "No") : val;
};

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
  const normalizedInitial: AdminReportKey = initialReport === "site_stock" ? "overall_stock" : initialReport;
  const [selectedReport, setSelectedReport] = useState<AdminReportKey>(normalizedInitial);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [apiRows, setApiRows] = useState<any[] | null>(null);
  const [apiEndpointUsed, setApiEndpointUsed] = useState<string>("");
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    setSelectedReport(initialReport === "site_stock" ? "overall_stock" : initialReport);
  }, [initialReport]);

  const projectOptions = useMemo(
    () => Object.entries(projectMap).map(([id, name]) => ({ id: Number(id), name })),
    [projectMap]
  );

  const uniqueMaterialOptions = useMemo(() => {
    const seen = new Map<string, number>();
    materials.forEach((m) => {
      if (m.material_name && !seen.has(m.material_name)) {
        seen.set(m.material_name, m.id);
      }
    });
    return Array.from(seen.entries())
      .map(([name, id]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const buildQueryParams = useCallback(() => {
    const selectedMatObj = uniqueMaterialOptions.find((m) => m.name === materialFilter);
    const activeDef = REPORT_DEFS.find((d) => d.key === selectedReport);
    return {
      project_id: siteFilter === "all" ? undefined : Number(siteFilter),
      material_id: materialFilter === "all" ? undefined : selectedMatObj?.id,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      report_type: activeDef?.apiReportType,
    };
  }, [siteFilter, materialFilter, dateFrom, dateTo, selectedReport, uniqueMaterialOptions]);

  const loadLiveReport = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingApi(true);
    try {
      const params = buildQueryParams();
      const { endpoint, data } = await materialService.fetchInventoryReportByKey(selectedReport, params);
      const extracted = extractApiRows(data);
      setApiEndpointUsed(`/api/v1${endpoint}`);
      setApiRows(extracted.length > 0 ? extracted : null);
    } catch {
      setApiRows(null);
    } finally {
      setIsLoadingApi(false);
    }
  }, [isOpen, selectedReport, buildQueryParams]);

  useEffect(() => {
    loadLiveReport();
  }, [loadLiveReport]);

  const fallbackPayload = useMemo((): { title: string; columns: string[]; rows: any[][] } => {
    const pid = siteFilter === "all" ? null : Number(siteFilter);
    const matMatch = (name?: string) => materialFilter === "all" || (name || "").toLowerCase() === materialFilter.toLowerCase();

    switch (selectedReport) {
      case "overall_stock":
      case "site_stock": {
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
          title: "Stock Summary Report",
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

      case "low_stock_alerts":
        return {
          title: "Low Stock Alerts Report",
          columns: ["Site", "Material", "Code", "Remaining", "Min Threshold", "Shortfall", "Status"],
          rows: materials
            .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name) && Number(m.remaining_stock) <= Number(m.minimum_stock_level))
            .map((m) => [
              projectMap[m.project_id] || `Site #${m.project_id}`,
              m.material_name,
              m.material_code || `MAT-${m.id}`,
              m.remaining_stock,
              m.minimum_stock_level,
              Math.max(0, Number(m.minimum_stock_level) - Number(m.remaining_stock)),
              Number(m.remaining_stock) <= 0 ? "OUT OF STOCK" : "LOW STOCK",
            ]),
        };

      case "batch_inventory":
        return {
          title: "Batch Inventory Report",
          columns: ["Site", "Material", "Supplier", "Purchased Qty", "Remaining Qty", "Rate", "Stock Value"],
          rows: materials
            .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name))
            .map((m) => {
              const v = computeMaterialValuation(m, inwards, valuationMethod);
              return [
                projectMap[m.project_id] || `Site #${m.project_id}`,
                m.material_name,
                m.supplier_name || supplierMap[m.supplier_id] || `Supplier #${m.supplier_id}`,
                m.quantity_purchased || 0,
                m.remaining_stock || 0,
                formatValuationCurrency(m.purchase_rate || 0, maskPrices),
                formatValuationCurrency(v.totalValue, maskPrices),
              ];
            }),
        };

      case "po_report":
        return {
          title: "PO Fulfillment Report",
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
          title: "GRN / Inward Register",
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
          title: "Issue / Outward Register",
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

      case "daily_stock_variance":
        return {
          title: "Daily Stock Variance Report",
          columns: ["Date", "Site", "Material", "Opening", "Expected", "Adjustment", "Closing", "Notes"],
          rows: dailyStocks
            .filter((d) => (!pid || d.project_id === pid) && matMatch(d.material_name))
            .map((d) => [
              d.date,
              projectMap[d.project_id] || `Site #${d.project_id}`,
              d.material_name,
              d.opening_stock,
              Number(d.opening_stock) + Number(d.inward_qty) - Number(d.outward_qty),
              d.adjustment_qty || 0,
              d.closing_stock,
              d.notes || "—",
            ]),
        };

      case "supplier_stock": {
        const bySupplier: Record<string, { supplier: string; materials: number; qty: number; val: number; pending: number }> = {};
        materials
          .filter((m) => (!pid || m.project_id === pid) && matMatch(m.material_name))
          .forEach((m) => {
            const sName = m.supplier_name || supplierMap[m.supplier_id] || `Supplier #${m.supplier_id}`;
            if (!bySupplier[sName]) bySupplier[sName] = { supplier: sName, materials: 0, qty: 0, val: 0, pending: 0 };
            const v = computeMaterialValuation(m, inwards, valuationMethod);
            bySupplier[sName].materials += 1;
            bySupplier[sName].qty += Number(m.remaining_stock || 0);
            bySupplier[sName].val += v.totalValue;
            bySupplier[sName].pending += Number((m as any).payment_pending || 0);
          });
        return {
          title: "Supplier Stock Report",
          columns: ["Supplier Name", "Catalog Items", "Total Stock Qty", "Stock Valuation", "Pending Payables"],
          rows: Object.values(bySupplier).map((s) => [
            s.supplier,
            s.materials,
            s.qty,
            formatValuationCurrency(s.val, maskPrices),
            formatValuationCurrency(s.pending, maskPrices),
          ]),
        };
      }

      case "daily_movement":
        return {
          title: "Daily Movement Report",
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
          title: "Movement Register / Lifecycle Report",
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

      case "combined_movement":
        return {
          title: "Combined Movement Reconciliation",
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
          title: "Inventory Audit Trail Report",
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

  const reportPayload = useMemo(() => {
    if (!apiRows || apiRows.length === 0) {
      return { ...fallbackPayload, isLiveApi: false };
    }
    const keys = Object.keys(apiRows[0]);
    const columns = keys.map((k) => k.replace(/_/g, " ").toUpperCase());
    const rows = apiRows.map((row) => keys.map((k) => formatCellValue(k, row[k], maskPrices)));
    return {
      title: fallbackPayload.title,
      columns,
      rows,
      isLiveApi: true,
    };
  }, [apiRows, fallbackPayload, maskPrices]);

  const handleExportExcel = async () => {
    setIsExporting("excel");
    const params = buildQueryParams();
    try {
      await materialService.exportInventoryReportExcelApi(
        params,
        `${reportPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.xlsx`
      );
      toast.success("Excel downloaded from server (/api/v1/inventory/reports/export/excel)");
    } catch {
      materialService.exportAdminReportExcel(reportPayload.title, reportPayload.columns, reportPayload.rows);
      toast.success("Excel exported!");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting("pdf");
    const params = buildQueryParams();
    try {
      await materialService.exportInventoryReportPdfApi(
        params,
        `${reportPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.pdf`
      );
      toast.success("PDF downloaded from server (/api/v1/inventory/reports/export/pdf)");
    } catch {
      materialService.exportAdminReportPdf(reportPayload.title, scopeLabel, reportPayload.columns, reportPayload.rows);
      toast.success("PDF exported!");
    } finally {
      setIsExporting(null);
    }
  };

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
              <h2 className="text-lg font-black text-slate-900">Material & Inventory Report Center (12 Reports)</h2>
              <p className="text-xs text-slate-500">Live Inventory Reports API integration with site/material/date filters & Excel/PDF export</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reportPayload.isLiveApi ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Cloud className="w-3.5 h-3.5" /> Live API: {apiEndpointUsed}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Database className="w-3.5 h-3.5" /> {isLoadingApi ? "Fetching API..." : "Local Preview"}
              </span>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Sidebar list of 12 Inventory Report APIs */}
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
                <p className={`text-[10px] mt-0.5 font-mono truncate ${selectedReport === rep.key ? "text-blue-100" : "text-slate-400"}`}>
                  {rep.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Main preview & export */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
                  {uniqueMaterialOptions.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  title="From Date"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  title="To Date"
                />
                <button
                  type="button"
                  onClick={loadLiveReport}
                  disabled={isLoadingApi}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Reload API Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingApi ? "animate-spin text-primary" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isExporting !== null}
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> {isExporting === "excel" ? "Exporting..." : "Export Excel"}
                </button>
                <button
                  type="button"
                  disabled={isExporting !== null}
                  onClick={handleExportPdf}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> {isExporting === "pdf" ? "Exporting..." : "Export PDF"}
                </button>
              </div>
            </div>

            <div className="flex-1 border border-slate-200 rounded-2xl overflow-auto relative">
              {isLoadingApi && (
                <div className="sticky top-0 left-0 right-0 bg-blue-50/95 border-b border-blue-100 px-4 py-2 text-xs font-bold text-blue-700 flex items-center gap-2 z-20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading live report data from server...
                </div>
              )}
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
                      <td colSpan={Math.max(1, reportPayload.columns.length)} className="py-12 text-center text-slate-400 font-bold">
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
