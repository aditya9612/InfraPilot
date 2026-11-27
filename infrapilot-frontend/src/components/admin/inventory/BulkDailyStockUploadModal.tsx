import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, AlertTriangle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import type { Material, DailyStockRecord } from "../../../types/material";

interface BulkDailyStockUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  inventory: Material[];
  existingRecords: DailyStockRecord[];
  onImport: (rows: Array<Omit<DailyStockRecord, "id" | "closing_stock" | "closing_value" | "created_at">>) => Promise<void>;
}

interface ParsedDailyRow {
  rowNum: number;
  material_id: number;
  material_name: string;
  unit: string;
  opening_stock: number;
  expected_opening: number;
  inward_qty: number;
  outward_qty: number;
  closing_stock: number;
  rate: number;
  mismatch: boolean;
  valid: boolean;
  error?: string;
}

const BulkDailyStockUploadModal: React.FC<BulkDailyStockUploadModalProps> = ({
  isOpen,
  onClose,
  projects,
  inventory,
  existingRecords,
  onImport,
}) => {
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedDailyRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const data = [
      ["material_name", "opening_stock", "inward_qty", "outward_qty"],
      [inventory[0]?.material_name || "OPC Cement 53 Grade", inventory[0]?.remaining_stock || 100, 20, 15],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DailyStock");
    XLSX.writeFile(wb, "daily_stock_template.xlsx");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const siteMats = inventory.filter((m) => !projectId || m.project_id === projectId);

    const parsed: ParsedDailyRow[] = json.map((raw, idx) => {
      const mName = String(raw.material_name || raw["Material Name"] || "").trim();
      const mat = siteMats.find((m) => m.material_name.toLowerCase() === mName.toLowerCase());
      const open = Number(raw.opening_stock ?? raw["Opening"] ?? 0);
      const inw = Number(raw.inward_qty ?? raw["Inward"] ?? 0);
      const out = Number(raw.outward_qty ?? raw["Outward"] ?? 0);

      const prior = mat
        ? existingRecords
            .filter((r) => r.project_id === projectId && r.material_id === mat.id && r.date < date)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [];
      const expectedOpen = prior.length > 0 ? prior[0].closing_stock : Number(mat?.remaining_stock || 0);
      const mismatch = mat ? open !== expectedOpen : false;

      return {
        rowNum: idx + 1,
        material_id: mat?.id || 0,
        material_name: mName,
        unit: mat?.unit_name || mat?.unit || "Units",
        opening_stock: open,
        expected_opening: expectedOpen,
        inward_qty: inw,
        outward_qty: out,
        closing_stock: Math.max(0, open + inw - out),
        rate: Number(mat?.purchase_rate || 0),
        mismatch,
        valid: Boolean(mat) && open >= 0 && inw >= 0 && out >= 0,
        error: !mat ? "Material not found in site catalog" : undefined,
      };
    });

    setRows(parsed);
  };

  const validRows = rows.filter((r) => r.valid);

  const handleCommit = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    try {
      await onImport(
        validRows.map((r) => ({
          date,
          project_id: projectId,
          material_id: r.material_id,
          material_name: r.material_name,
          unit: r.unit,
          opening_stock: r.opening_stock,
          inward_qty: r.inward_qty,
          outward_qty: r.outward_qty,
          adjustment_qty: 0,
          rate: r.rate,
          entry_source: "BULK_UPLOAD",
          notes: r.mismatch ? `Opening variance vs expected (${r.expected_opening})` : `Bulk upload (${fileName})`,
        }))
      );
      setRows([]);
      setFileName("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Bulk Daily Stock Upload</h2>
              <p className="text-xs text-slate-500">Validates opening balances against carried-forward closing balances</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Site</label>
              <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Stock Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
            </div>
            <button type="button" onClick={downloadTemplate} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>

          <label className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50">
            <Upload className="w-7 h-7 text-primary mb-2" />
            <p className="text-sm font-bold text-slate-800">{fileName || "Upload Daily Stock Sheet (.xlsx / .csv)"}</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          </label>

          {rows.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">Material</th>
                    <th className="px-3 py-2.5 text-right">Opening</th>
                    <th className="px-3 py-2.5 text-right">+In</th>
                    <th className="px-3 py-2.5 text-right">-Out</th>
                    <th className="px-3 py-2.5 text-right">Closing</th>
                    <th className="px-3 py-2.5">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.rowNum} className={!r.valid ? "bg-rose-50/50" : r.mismatch ? "bg-amber-50/50" : "bg-emerald-50/30"}>
                      <td className="px-3 py-2 font-bold text-slate-900">{r.material_name}</td>
                      <td className="px-3 py-2 text-right font-bold">{r.opening_stock}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-bold">{r.inward_qty}</td>
                      <td className="px-3 py-2 text-right text-rose-700 font-bold">{r.outward_qty}</td>
                      <td className="px-3 py-2 text-right font-black">{r.closing_stock}</td>
                      <td className="px-3 py-2">
                        {!r.valid ? (
                          <span className="text-rose-700 font-bold">{r.error}</span>
                        ) : r.mismatch ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Mismatch vs expected {r.expected_opening}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold">
            Cancel
          </button>
          <button
            type="button"
            disabled={validRows.length === 0 || submitting}
            onClick={handleCommit}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? "Importing..." : `Import ${validRows.length} Daily Records`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDailyStockUploadModal;
