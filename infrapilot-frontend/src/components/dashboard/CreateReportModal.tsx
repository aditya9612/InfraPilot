import { useState } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { PROJECT_EXPENSES, MILESTONES } from "../../config/projectSeed";
import { exportToCSV } from "../../utils/csvExport";
import type { Project } from "../../types/project";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onReportCreated?: (report: any) => void;
}

const REPORT_TYPES = [
  {
    id: "financial",
    label: "Financial Summary",
    description: "Revenue, expenses, GST, profit/loss across projects",
    icon: "💰",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    selectedColor: "bg-emerald-500 border-emerald-500 text-white",
  },
  {
    id: "progress",
    label: "Site Progress",
    description: "Task completion, milestone status, team performance",
    icon: "📊",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    selectedColor: "bg-blue-500 border-blue-500 text-white",
  },
  {
    id: "material",
    label: "Material & Inventory",
    description: "Stock levels, usage, supplier payments, low-stock items",
    icon: "📦",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    selectedColor: "bg-amber-500 border-amber-500 text-white",
  },
  {
    id: "contractor",
    label: "Contractor Performance",
    description: "Bills raised, dues outstanding, ratings by contractor",
    icon: "🏗️",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    selectedColor: "bg-violet-500 border-violet-500 text-white",
  },
  {
    id: "audit",
    label: "Compliance Audit",
    description: "User activity, approvals, document trail, compliance checks",
    icon: "🔍",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    selectedColor: "bg-rose-500 border-rose-500 text-white",
  },
];

const CreateReportModal = ({ isOpen, onClose, projects, onReportCreated }: CreateReportModalProps) => {
  const [selectedType, setSelectedType] = useState("");
  const [projectScope, setProjectScope] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportName, setReportName] = useState("");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedType) newErrors.type = "Please select a report type.";
    if (!reportName.trim()) newErrors.reportName = "Please enter a report name.";
    if (!dateFrom) newErrors.dateFrom = "Start date is required.";
    if (!dateTo) newErrors.dateTo = "End date is required.";
    else if (dateFrom && dateTo < dateFrom) newErrors.dateTo = "End date cannot be before start date.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const downloadReport = (type: string, scope: string, name: string) => {
    const scopeProjects = scope === "all" ? projects : projects.filter((p) => p.id === parseInt(scope));
    const filename = name.toLowerCase().replace(/\s+/g, "_");

    if (type === "financial") {
      const data = scopeProjects.map((p) => ({
        "Project ID": p.id,
        "Project Name": p.project_name,
        "Status": p.status,
        "Start Date": p.start_date,
        "End Date": p.end_date,
        "Budget (₹)": p.budget || "N/A",
        "Description": p.description,
      }));
      exportToCSV(data, `${filename}.csv`);
    } else if (type === "progress") {
      const data = scopeProjects.map((p) => {
        const milestones = (MILESTONES[p.id] || []);
        const completed = milestones.filter((m: any) => m.status === "Completed").length;
        return {
          "Project ID": p.id,
          "Project Name": p.project_name,
          "Status": p.status,
          "Total Milestones": milestones.length,
          "Completed Milestones": completed,
          "Completion %": milestones.length > 0 ? Math.round((completed / milestones.length) * 100) + "%" : "N/A",
          "Start Date": p.start_date,
          "End Date": p.end_date,
        };
      });
      exportToCSV(data, `${filename}.csv`);
    } else if (type === "material") {
      const allExpenses: any[] = [];
      scopeProjects.forEach((p) => {
        const expenses = PROJECT_EXPENSES[p.id] || [];
        expenses.forEach((e: any) => {
          allExpenses.push({
            "Project": p.project_name,
            "Category": e.category,
            "Description": e.description,
            "Amount (₹)": e.amount,
            "Date": e.date,
          });
        });
      });
      exportToCSV(allExpenses.length > 0 ? allExpenses : [{ Note: "No expense data found for selected scope" }], `${filename}.csv`);
    } else if (type === "contractor") {
      const data = scopeProjects.map((p) => ({
        "Project ID": p.id,
        "Project Name": p.project_name,
        "Status": p.status,
        "Start Date": p.start_date,
        "End Date": p.end_date,
      }));
      exportToCSV(data, `${filename}.csv`);
    } else {
      // audit / default: export project summary
      const data = scopeProjects.map((p) => ({
        "Project ID": p.id,
        "Project Name": p.project_name,
        "Status": p.status,
        "Description": p.description,
        "Start Date": p.start_date,
        "End Date": p.end_date,
      }));
      exportToCSV(data, `${filename}.csv`);
    }
  };

  const handleGenerate = () => {
    if (!validate()) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setGenerationProgress(100);

      const selectedTypeObj = REPORT_TYPES.find((t) => t.id === selectedType);
      const newReport = {
        id: Math.floor(Math.random() * 10000),
        name: reportName,
        type: selectedTypeObj?.label || selectedType,
        date: new Date().toISOString().split("T")[0],
        project: projectScope === "all" ? "All Projects" : projects.find((p) => p.id === parseInt(projectScope))?.project_name || "N/A",
        status: "Generated",
        dateFrom,
        dateTo,
        includeCharts,
        includeRawData,
      };

      setTimeout(() => {
        setIsGenerating(false);
        if (onReportCreated) onReportCreated(newReport);
        // Trigger actual CSV download
        downloadReport(selectedType, projectScope, reportName);
        toast.success(`Report "${reportName}" downloaded successfully!`, {
          style: { borderRadius: "12px", background: "#333", color: "#fff" },
          icon: "📥",
        });
        handleClose();
      }, 600);
    }, 2500);
  };

  const handleClose = () => {
    setSelectedType("");
    setProjectScope("all");
    setDateFrom("");
    setDateTo("");
    setReportName("");
    setIncludeCharts(true);
    setIncludeRawData(false);
    setIsGenerating(false);
    setGenerationProgress(0);
    setErrors({});
    onClose();
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={handleClose}
        disabled={isGenerating}
        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Report" footer={modalFooter} maxWidth="max-w-2xl">
      <div className="space-y-6">

        {/* Generation Progress */}
        {isGenerating && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-primary">Generating Report...</p>
                <p className="text-xs text-slate-500 mt-0.5">Compiling data across all modules</p>
              </div>
              <span className="text-2xl font-black text-primary">{Math.min(generationProgress, 100)}%</span>
            </div>
            <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                style={{ width: `${Math.min(generationProgress, 100)}%` }}
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Fetching project data", "Compiling financials", "Building charts", "Finalizing PDF"].map((step, i) => (
                <span
                  key={step}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    generationProgress > i * 25
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Report Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedType(type.id);
                  if (!reportName) setReportName(type.label + " Report");
                  if (errors.type) setErrors((p) => ({ ...p, type: "" }));
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selectedType === type.id ? type.selectedColor : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="text-xl leading-none mt-0.5">{type.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${selectedType === type.id ? "text-white" : "text-slate-700"}`}>
                    {type.label}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 leading-snug ${selectedType === type.id ? "text-white/80" : "text-slate-400"}`}>
                    {type.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {errors.type && <p className="text-[10px] text-red-500 mt-2">{errors.type}</p>}
        </div>

        {/* Report Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Report Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => { setReportName(e.target.value); if (errors.reportName) setErrors((p) => ({ ...p, reportName: "" })); }}
            placeholder="e.g. Q1 Financial Audit 2026"
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.reportName ? "border-red-400" : "border-slate-200"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
          />
          {errors.reportName && <p className="text-[10px] text-red-500 mt-1">{errors.reportName}</p>}
        </div>

        {/* Project Scope & Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Project Scope</label>
            <select
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); if (errors.dateFrom) setErrors((p) => ({ ...p, dateFrom: "" })); }}
              className={`w-full px-3 py-2.5 bg-slate-50 border ${errors.dateFrom ? "border-red-400" : "border-slate-200"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
            />
            {errors.dateFrom && <p className="text-[10px] text-red-500 mt-1">{errors.dateFrom}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              To <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); if (errors.dateTo) setErrors((p) => ({ ...p, dateTo: "" })); }}
              className={`w-full px-3 py-2.5 bg-slate-50 border ${errors.dateTo ? "border-red-400" : "border-slate-200"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
            />
            {errors.dateTo && <p className="text-[10px] text-red-500 mt-1">{errors.dateTo}</p>}
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <p className="text-xs font-bold text-slate-700">Include Charts & Graphs</p>
              <p className="text-[10px] text-slate-400">Visual data representations</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={includeRawData}
              onChange={(e) => setIncludeRawData(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <p className="text-xs font-bold text-slate-700">Include Raw Data Tables</p>
              <p className="text-[10px] text-slate-400">Full CSV data appended</p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default CreateReportModal;
