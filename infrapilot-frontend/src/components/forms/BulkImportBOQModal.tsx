import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { boqService } from "../../services/boqService";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle2, AlertCircle, X, ChevronDown } from "lucide-react";
import type { BoqItem } from "../../types/boq";
import { masterService, type MasterEntity } from "../../services/masterService";

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
  const [selectedBoqId, setSelectedBoqId] = useState<string>("");
  const [newBoqName, setNewBoqName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoadingBoqs, setIsLoadingBoqs] = useState(false);
  const [activityTypes, setActivityTypes] = useState<MasterEntity[]>([]);
  const [selectedActivityTypeId, setSelectedActivityTypeId] = useState<string>("");

  useEffect(() => {
    if (isOpen && projectId) {
      const loadBoqs = async () => {
        setIsLoadingBoqs(true);
        try {
          const [items, types] = await Promise.all([
            boqService.getBoqsByProject(projectId),
            masterService.getEntities('activity-types'),
          ]);

          // Step 1: Filter out items belonging to APPROVED BOQ groups
          const nonApproved = items.filter((i: any) =>
            i.approval_status !== 'APPROVED' && i.approval_status !== 'Approved'
          );

          // Step 2: Deduplicate by boq_group_id (true_group_id preferred), keeping first occurrence
          const seenGroupIds = new Set<number>();
          const uniqueGroups: BoqItem[] = [];
          for (const item of nonApproved) {
            const groupId = (item as any).true_group_id ?? item.boq_group_id ?? item.id;
            if (!seenGroupIds.has(Number(groupId))) {
              seenGroupIds.add(Number(groupId));
              uniqueGroups.push(item);
            }
          }

          setAvailableBoqs(uniqueGroups);
          setActivityTypes(types);
          if (uniqueGroups.length > 0) {
            const firstGroupId = (uniqueGroups[0] as any).true_group_id ?? uniqueGroups[0].boq_group_id ?? uniqueGroups[0].id;
            setSelectedBoqId(String(firstGroupId));
            setIsCreatingNew(false);
          } else {
            setIsCreatingNew(true);
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
          category: row["Category"] || row["category"] || "Material",
          description: row["Description"] || row["description"] || "",
          quantity: Number(row["Quantity"] || row["qty"] || 0),
          unit: row["Unit"] || row["unit"] || "nos",
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
      if (!selectedActivityTypeId) {
        toast.error("Please select an Activity Type for the imported items");
        setIsUploading(false);
        return;
      }

      let targetId: number;

      if (isCreatingNew) {
        if (!newBoqName.trim()) {
          toast.error("Please enter a name for the new BOQ group");
          setIsUploading(false);
          return;
        }
        toast.loading("Creating new BOQ group...", { id: "boq-create" });
        const newBoq = await boqService.createBoq({
          project_id: projectId,
          item_name: newBoqName.trim(),
          description: "Created via bulk import",
          quantity: 1,
          unit_cost: 1,
          status: "Draft",
          activity_type_id: Number(selectedActivityTypeId),
        });
        targetId = newBoq.boq_group_id ?? newBoq.id;
        toast.success("New BOQ group created", { id: "boq-create" });
      } else {
        if (!selectedBoqId) {
          toast.error("Please select a BOQ group");
          setIsUploading(false);
          return;
        }
        targetId = Number(selectedBoqId);
      }

      // Stamp current selected activity_type_id onto all items at submission time
      const itemsToSubmit = parsedItems.map((item) => ({
        ...item,
        activity_type_id: Number(selectedActivityTypeId),
      }));

      await boqService.bulkAddItems(targetId, itemsToSubmit);
      toast.success(`Successfully imported ${parsedItems.length} items!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to import items. Check server logs.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    const toastId = toast.loading("Downloading template...");
    try {
      await boqService.downloadTemplate();
      toast.success("Template downloaded successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to download template. Please try again.", { id: toastId });
    }
  };

  const reset = () => {
    setFile(null);
    setParsedItems([]);
    setStep(1);
    setSelectedActivityTypeId("");
    setNewBoqName("");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex justify-center min-h-full p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
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
                {/* BOQ Group Selection Dropdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Select BOQ Group <span className="text-rose-500">*</span>
                    </label>
                    {isLoadingBoqs && (
                      <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="relative group">
                    <select
                      value={isCreatingNew ? "__new__" : selectedBoqId}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setIsCreatingNew(true);
                          setSelectedBoqId("");
                        } else {
                          setIsCreatingNew(false);
                          setSelectedBoqId(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none pr-10 cursor-pointer"
                    >
                      {availableBoqs.length === 0 && !isLoadingBoqs && (
                        <option value="__new__">➕ No BOQs found — Create new group</option>
                      )}
                      {availableBoqs.map((boq) => {
                          const gid = (boq as any).true_group_id ?? boq.boq_group_id ?? boq.id;
                          return (
                            <option key={gid} value={String(gid)}>
                              {boq.item_name}
                            </option>
                          );
                        })}
                      <option value="__new__">➕ Create new BOQ group...</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  {isCreatingNew && (
                    <input
                      type="text"
                      placeholder="Enter new BOQ group name..."
                      value={newBoqName}
                      onChange={(e) => setNewBoqName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-primary/30 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      autoFocus
                    />
                  )}
                </div>

                {/* Activity Type Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Activity Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedActivityTypeId}
                      onChange={(e) => setSelectedActivityTypeId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer hover:border-slate-200"
                    >
                      <option value="">Select Activity Type for all items...</option>
                      {activityTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold px-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-primary/40 rounded-full" />
                    Category and Unit are derived from this selection
                  </p>
                </div>

                <div
                  className="relative border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                  />
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 tracking-tight">
                    Drop your file here or click to browse
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                    Supports XLSX, XLS, and CSV
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
                <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-emerald-900 tracking-tight">
                      {file?.name}
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                      Importing to: <span className="underline decoration-2 underline-offset-4">
                        {isCreatingNew ? newBoqName || "New BOQ Group" : availableBoqs.find(b => String(b.boq_group_id ?? b.id) === selectedBoqId)?.item_name || "Selected BOQ"}
                      </span> • {parsedItems.length} items
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-inner shadow-slate-50/50">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-5 py-4">Item Name</th>
                        <th className="px-5 py-4 text-right">Qty</th>
                        <th className="px-5 py-4 text-right">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedItems.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-700 text-xs">
                            {item.item_name}
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-slate-600 text-xs">
                            {item.quantity} {item.unit || 'pairs'}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-primary text-xs">
                            ₹{Number(item.unit_cost).toLocaleString()}
                          </td>
                        </tr>
                      ))}
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
    </div>
  );
};

export default BulkImportBOQModal;
