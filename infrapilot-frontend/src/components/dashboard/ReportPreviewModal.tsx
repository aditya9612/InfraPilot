import Modal from "../common/Modal";
import { FileText, Download, Share2, Printer, Package, Calendar, TrendingDown } from "lucide-react";

interface ReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName: string;
    data: any;
    reportId?: string;
    onExport?: (format: "PDF" | "Excel") => void;
    onShare?: () => void;
    exportType?: "PDF" | "Excel" | "Both";
}

// Field order config for known report types
const ASSET_FIELD_ORDER = ["name", "id", "project_id", "purchase_date", "purchase_value", "current_value", "depreciation_rate", "created_at", "updated_at"];

const formatReportCellValue = (val: any, colKey?: string): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") return val.toLocaleString("en-IN");
    if (typeof val === "string") {
        if (/^\d{4}-\d{2}-\d{2}T/.test(val) || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { dateStyle: "medium" });
        }
        return val || "—";
    }
    if (typeof val === "object") {
        if (Array.isArray(val)) {
            if (val.length === 0) return "—";
            return val.map((item) => formatReportCellValue(item, colKey)).join(", ");
        }
        const key = (colKey || "").toLowerCase();

        // 1. Material Master column / entity check
        if (key.includes("material") || "material_name" in val || "material_master_name" in val) {
            const materialName = val.name || val.material_name || val.material_master_name || val.item_name || val.title || val.material_code || val.code;
            if (materialName) return String(materialName);
        }

        // 2. Unit column / entity check
        if (key.includes("unit") || "unit_name" in val || "symbol" in val) {
            const unitName = val.unit_name || val.name || val.symbol || val.unit || val.code || val.label;
            if (unitName) return String(unitName);
        }

        // 3. Supplier / Vendor column / entity check
        if (key.includes("supplier") || key.includes("vendor") || "supplier_name" in val) {
            const supplierName = val.supplier_name || val.name || val.vendor_name || val.company_name || val.contactPerson || val.contact_person;
            if (supplierName) return String(supplierName);
        }

        // 4. General named object properties
        const generalName = val.name || val.supplier_name || val.unit_name || val.material_name || val.title || val.label || val.value || val.description;
        if (generalName) return String(generalName);

        // 5. Look for any string property that isn't a technical identifier
        const displayEntry = Object.entries(val).find(
            ([k, v]) => !["id", "project_id", "company_id", "created_at", "updated_at", "_id"].includes(k.toLowerCase()) && typeof v === "string" && v.trim().length > 0
        );
        if (displayEntry) return String(displayEntry[1]);

        if (val.id !== undefined && val.id !== null) return `#${val.id}`;

        // Fallback: never return "[object Object]"
        return "—";
    }
    return String(val);
};

const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return "—";
    // Format ISO dates
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
    }
    // Format currency fields
    if (["purchase_value", "current_value", "min_value", "max_value"].includes(key)) {
        return `₹${Number(value).toLocaleString("en-IN")}`;
    }
    // Format rate fields
    if (key === "depreciation_rate") return `${value}%`;
    if (typeof value === "object") return formatReportCellValue(value, key);
    return value?.toString() || "—";
};

const ASSET_FIELD_LABELS: Record<string, string> = {
    name: "Asset Name",
    id: "Asset ID",
    project_id: "Project ID",
    purchase_date: "Purchase Date",
    purchase_value: "Purchase Value",
    current_value: "Current Value",
    depreciation_rate: "Depreciation Rate",
    created_at: "Created At",
    updated_at: "Last Updated",
};

const ASSET_FIELD_ICONS: Record<string, React.ReactNode> = {
    name: <Package size={14} />,
    purchase_date: <Calendar size={14} />,
    depreciation_rate: <TrendingDown size={14} />,
};

const ReportPreviewModal = ({
    isOpen,
    onClose,
    reportName,
    data,
    reportId,
    onExport,
    onShare,
    exportType = "Both"
}: ReportPreviewModalProps) => {
    if (!data) return null;

    // Render asset items with reordered fields
    const renderAssets = (items: any[]) => (
        <div className="space-y-6">
            {items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Asset header */}
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                            {idx + 1}
                        </div>
                        <span className="text-sm font-black text-slate-700">{item.name || `Asset #${idx + 1}`}</span>
                    </div>
                    {/* Fields in logical order */}
                    <div className="grid grid-cols-2 gap-px bg-slate-100">
                        {ASSET_FIELD_ORDER.filter(k => k in item).map(key => (
                            <div key={key} className="bg-white px-4 py-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {ASSET_FIELD_ICONS[key] && (
                                        <span className="text-slate-400">{ASSET_FIELD_ICONS[key]}</span>
                                    )}
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {ASSET_FIELD_LABELS[key] || key.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <span className="text-sm font-black text-slate-800">
                                    {formatFieldValue(key, item[key])}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderData = () => {
        if (typeof data === "string") return <p className="text-slate-600 font-mono text-sm whitespace-pre-wrap">{data}</p>;

        // Assets report — data is array or has assets key
        const assetItems = Array.isArray(data) ? data : data?.assets;
        if (reportId === "assets" && Array.isArray(assetItems)) {
            return renderAssets(assetItems);
        }

        return (
            <div className="space-y-6">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="border-b border-slate-50 pb-4 last:border-0">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</h5>
                        {typeof value === "object" && value !== null ? (
                            Array.isArray(value) ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                {value.length > 0 && Object.keys(value[0]).map(k => (
                                                    <th key={k} className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">{k.replace(/_/g, ' ')}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(() => {
                                                const headers = value.length > 0 ? Object.keys(value[0]) : [];
                                                return value.map((item, i) => (
                                                    <tr key={i}>
                                                        {headers.map((k, j) => {
                                                            const cellVal = item[k];
                                                            return (
                                                                <td key={j} className="px-3 py-2 text-slate-600 font-medium">
                                                                    {formatReportCellValue(cellVal, k)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(value).map(([subK, subV]) => (
                                        <div key={subK} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{subK.replace(/_/g, ' ')}</span>
                                            <span className="text-sm font-black text-slate-700">{formatReportCellValue(subV, subK)}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <p className="text-sm font-black text-slate-700">{formatReportCellValue(value, key)}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const footer = (
        <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="p-2.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                    title="Print Report"
                >
                    <Printer size={18} />
                </button>
            </div>
            <div className="flex gap-3">
                {onExport && (
                    <>
                        {(exportType === "PDF" || exportType === "Both") && (
                            <button
                                onClick={() => onExport("PDF")}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <Download size={14} /> PDF
                            </button>
                        )}
                        {(exportType === "Excel" || exportType === "Both") && (
                            <button
                                onClick={() => onExport("Excel")}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
                            >
                                <FileText size={14} /> Excel
                            </button>
                        )}
                    </>
                )}
                <button
                    onClick={onShare}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                >
                    <Share2 size={14} /> Share Report
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={reportName}
            maxWidth="max-w-4xl"
            footer={footer}
        >
            <div className="p-2">
                <div className="bg-slate-900 rounded-2xl p-6 mb-4 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="text-primary" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Official Project Audit</span>
                        </div>
                        <h3 className="text-2xl font-black">{reportName}</h3>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                    </div>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <FileText size={160} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    {renderData()}
                </div>
            </div>
        </Modal>
    );
};

export default ReportPreviewModal;
