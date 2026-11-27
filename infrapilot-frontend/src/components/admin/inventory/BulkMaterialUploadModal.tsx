import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, X } from "lucide-react";
import type { Material, Supplier, BulkMaterialRow } from "../../../types/material";

interface BulkMaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMaterials: Material[];
  projects: Array<{ id: number; name?: string; project_name?: string }>;
  suppliers: Supplier[];
  onImport: (rows: BulkMaterialRow[], fileName: string, projectId: number, supplierId: number) => Promise<void>;
}

const BulkMaterialUploadModal: React.FC<BulkMaterialUploadModalProps> = ({
  isOpen,
  onClose,
  existingMaterials,
  projects,
  suppliers,
  onImport,
}) => {
  const [rows, setRows] = useState<BulkMaterialRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projects[0]?.id || 0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = (format: "xlsx" | "csv") => {
    const templateRows = [
      ["material_code", "material_name", "category", "unit", "description", "minimum_stock_level", "purchase_rate"],
      ["MAT-101", "OPC Cement 53 Grade", "Civil", "Bags", "High strength structural cement", 50, 380],
      ["MAT-102", "TMT Steel Bar 12mm", "Steel", "Kg", "Fe550D ductile rebar", 500, 68],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MaterialMaster");
    if (format === "csv") {
      XLSX.writeFile(wb, "material_master_template.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(wb, "material_master_template.xlsx");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: "" });

    const existingCodes = new Set(existingMaterials.map((m) => (m.material_code || "").trim().toLowerCase()));
    const existingNames = new Set(existingMaterials.map((m) => (m.material_name || "").trim().toLowerCase()));
    const seenCodes = new Set<string>();

    const parsed: BulkMaterialRow[] = jsonRows.map((raw, idx) => {
      const code = String(raw.material_code || raw["Material Code"] || `MAT-${100 + idx}`).trim();
      const name = String(raw.material_name || raw["Material Name"] || "").trim();
      const category = String(raw.category || raw["Category"] || "General").trim();
      const unit = String(raw.unit || raw["Unit"] || "").trim();
      const description = String(raw.description || raw["Description"] || "").trim();
      const minLevel = Number(raw.minimum_stock_level ?? raw["Min Stock"] ?? 10);
      const rate = Number(raw.purchase_rate ?? raw["Rate"] ?? 0);

      let status: BulkMaterialRow["status"] = "VALID";
      let error_reason: string | undefined;

      if (!name) {
        status = "ERROR";
        error_reason = "Missing material_name";
      } else if (!unit) {
        status = "ERROR";
        error_reason = "Missing unit";
      } else if (isNaN(minLevel) || minLevel < 0) {
        status = "ERROR";
        error_reason = "Invalid minimum_stock_level";
      } else if (seenCodes.has(code.toLowerCase())) {
        status = "ERROR";
        error_reason = "Duplicate material_code inside file";
      } else if (existingCodes.has(code.toLowerCase()) || existingNames.has(name.toLowerCase())) {
        status = "DUPLICATE";
        error_reason = "Already exists in Material Master";
      }
      seenCodes.add(code.toLowerCase());

      return {
        row_number: idx + 1,
        material_code: code,
        material_name: name,
        category,
        unit,
        description,
        minimum_stock_level: minLevel,
        purchase_rate: isNaN(rate) ? 0 : rate,
        status,
        error_reason,
        conflict_action: status === "DUPLICATE" ? "SKIP" : undefined,
      };
    });

    setRows(parsed);
  };

  const validCount = rows.filter((r) => r.status === "VALID" || (r.status === "DUPLICATE" && r.conflict_action === "OVERWRITE")).length;
  const duplicateCount = rows.filter((r) => r.status === "DUPLICATE").length;
  const errorCount = rows.filter((r) => r.status === "ERROR").length;

  const handleCommit = async () => {
    const pid = selectedProjectId || projects[0]?.id;
    const sid = selectedSupplierId || suppliers[0]?.id;
    if (!pid || !sid || validCount === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(rows, fileName, pid, sid);
      setRows([]);
      setFileName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Bulk Material Master Upload</h2>
              <p className="text-xs text-slate-500">Import unified catalog items via Excel or CSV with duplicate verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Default Project Site</label>
              <select
                value={selectedProjectId || projects[0]?.id || ""}
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Default Supplier</label>
              <select
                value={selectedSupplierId || suppliers[0]?.id || ""}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate("xlsx")}
                className="flex-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> .XLSX Template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate("csv")}
                className="flex-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> .CSV Template
              </button>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 transition-colors">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-bold text-slate-800">{fileName ? `Loaded: ${fileName}` : "Click to select .xlsx or .csv file"}</p>
            <p className="text-xs text-slate-400 mt-1">Columns: material_code, material_name, category, unit, description, minimum_stock_level, purchase_rate</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </label>

          {rows.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</p>
                  <p className="text-xl font-black text-slate-900">{rows.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Ready to Import</p>
                  <p className="text-xl font-black text-emerald-700">{validCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Duplicates</p>
                  <p className="text-xl font-black text-amber-700">{duplicateCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Error Rows</p>
                  <p className="text-xl font-black text-rose-700">{errorCount}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Material Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Status / Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr
                        key={r.row_number}
                        className={
                          r.status === "VALID"
                            ? "bg-emerald-50/40"
                            : r.status === "DUPLICATE"
                              ? "bg-amber-50/50"
                              : "bg-rose-50/50"
                        }
                      >
                        <td className="px-4 py-2.5 font-bold">{r.row_number}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-700">{r.material_code}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{r.material_name || "—"}</td>
                        <td className="px-4 py-2.5">{r.category}</td>
                        <td className="px-4 py-2.5">{r.unit || "—"}</td>
                        <td className="px-4 py-2.5">
                          {r.status === "VALID" && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          )}
                          {r.status === "DUPLICATE" && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" /> Exists
                              </span>
                              <select
                                value={r.conflict_action || "SKIP"}
                                onChange={(e) => {
                                  const act = e.target.value as "SKIP" | "OVERWRITE";
                                  setRows((prev) =>
                                    prev.map((row) => (row.row_number === r.row_number ? { ...row, conflict_action: act } : row))
                                  );
                                }}
                                className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-bold text-amber-900"
                              >
                                <option value="SKIP">Skip</option>
                                <option value="OVERWRITE">Overwrite</option>
                              </select>
                            </div>
                          )}
                          {r.status === "ERROR" && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                              <XCircle className="w-3.5 h-3.5" /> {r.error_reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={validCount === 0 || isSubmitting}
            onClick={handleCommit}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Importing..." : `Commit Import (${validCount} Items)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkMaterialUploadModal;
