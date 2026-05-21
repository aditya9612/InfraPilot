import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { boqService } from "../../services/boqService";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle2, AlertCircle, X, ChevronDown } from "lucide-react";
import type { BoqItem } from "../../types/boq";
import { BOQ_CATEGORIES, BOQ_UNITS } from "../../config/constants";

interface BulkImportBOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess: () => void;
}

const BulkImportBOQModal: React.FC<BulkImportBOQModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [availableBoqs, setAvailableBoqs] = useState<BoqItem[]>([]);
  const [boqName, setBoqName] = useState("");
  const [isLoadingBoqs, setIsLoadingBoqs] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      const loadBoqs = async () => {
        setIsLoadingBoqs(true);
        try {
          const items = await boqService.getBoqsByProject(projectId);
          setAvailableBoqs(items);
          if (items.length > 0) {
            setBoqName(items[0].item_name);
          }
        } catch (error) {
          console.error("Failed to load BOQs", error);
        } finally {
          setIsLoadingBoqs(false);
        }
      };
      loadBoqs();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        parseExcel(selectedFile);
      } else {
        toast.error("Please upload a valid Excel or CSV file");
      }
    }
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);

      // Basic mapping/validation
      const items = json
        .map((row: any) => ({
          project_id: projectId,
          item_name: row["Item Name"] || row["item_name"] || row["Name"],
          category: row["Category"] || row["category"] || BOQ_CATEGORIES[0],
          description: row["Description"] || row["description"] || "",
          quantity: Number(row["Quantity"] || row["qty"] || 0),
          unit: row["Unit"] || row["unit"] || BOQ_UNITS[0],
          unit_cost: Number(row["Unit Cost"] || row["rate"] || 0),
          status: "Active",
        }))
        .filter((item) => item.item_name);

      setParsedItems(items);
      if (items.length > 0) {
        setStep(2);
      } else {
        toast.error(
          "No valid items found in the file. Ensure columns match 'Item Name', 'Category', 'Quantity', etc.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      if (!boqName.trim()) {
        toast.error("Please enter or select a target BOQ name");
        setIsUploading(false);
        return;
      }

      // Check if the name matches an existing BOQ
      const existingBoq = availableBoqs.find(
        (b) => b.item_name.toLowerCase() === boqName.toLowerCase(),
      );

      let targetId: number;

      if (existingBoq) {
        targetId = existingBoq.id;
      } else {
        // Create a new one
        toast.loading("Creating new BOQ group...", { id: "boq-create" });
        const newBoq = await boqService.createBoq({
          project_id: projectId,
          item_name: boqName,
          category: BOQ_CATEGORIES[0], // Using centralized category
          description: "Created via bulk import",
          quantity: 1,
          unit: BOQ_UNITS[6] || "Nos", // Using centralized unit (Nos is usually 6th or 7th)
          unit_cost: 0,
          status: "Draft",
        });
        targetId = newBoq.id;
        toast.success("New BOQ group created", { id: "boq-create" });
      }

      await boqService.bulkAddItems(targetId, parsedItems);
      toast.success(`Successfully imported ${parsedItems.length} items!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to import items. Check server logs.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers =
      "Item Name,Category,Description,Quantity,Unit,Unit Cost\n" +
      "Cement OPC 53 Grade,Material,UltraTech OPC cement,500,bags,380\n" +
      "River Sand,Material,Fine aggregate,20,tons,1200\n" +
      "Steel TMT Bars,Material,Fe500 grade steel,2000,kg,65";
    const blob = new Blob([headers], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "boq_import_template.csv";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setParsedItems([]);
    setStep(1);
    // Don't reset boqName here to keep the context if they change file
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Bulk Import BOQ
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Upload Excel or CSV to populate your project
            </p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
              {/* BOQ Selection Input with Suggestions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    BOQ ID or Name
                  </label>
                  {isLoadingBoqs && (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    list="boq-suggestions"
                    placeholder="Type name or select from suggestions..."
                    value={boqName}
                    onChange={(e) => setBoqName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  />
                  <datalist id="boq-suggestions">
                    {availableBoqs.map((boq) => (
                      <option key={boq.id} value={boq.item_name}>
                        {boq.item_name} (ID: {boq.id})
                      </option>
                    ))}
                  </datalist>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  If the name doesn't exist, a new BOQ group will be created automatically.
                </p>
              </div>

              <div
                className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">
                  Drop your file here or click to browse
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports XLSX, XLS, and CSV formats
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Column Requirements
                  </h5>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Ensure your file contains following headers:{" "}
                    <span className="font-bold">
                      Item Name, Category, Quantity, Unit, Unit Cost
                    </span>
                    . Values will be mapped automatically.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="mt-3 text-[10px] font-bold text-amber-800 bg-amber-200/50 hover:bg-amber-200 px-3 py-1 rounded-lg transition-all uppercase tracking-wider"
                  >
                    Download Template
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-800">
                    {file?.name}
                  </h4>
                  <p className="text-xs text-emerald-600 font-medium">
                    Importing to: <span className="font-bold underline">{boqName}</span> • {parsedItems.length} items
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Change File
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {parsedItems.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          ₹{item.unit_cost}
                        </td>
                      </tr>
                    ))}
                    {parsedItems.length > 10 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-center text-slate-400 italic"
                        >
                          ... and {parsedItems.length - 10} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Import
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportBOQModal;
