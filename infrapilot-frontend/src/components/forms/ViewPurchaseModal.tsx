import React, { useState, useEffect } from "react";
import { X, FileText, Calendar, Tag, IndianRupee, Package, AlertCircle, Clock, Building, ShieldCheck } from "lucide-react";
import { equipmentService } from "../../services/equipmentService";
import { useProject } from "../../context/ProjectContext";
import toast from "react-hot-toast";

interface ViewPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseId: number | null;
    projectName: string;
}

const ViewPurchaseModal: React.FC<ViewPurchaseModalProps> = ({
    isOpen,
    onClose,
    purchaseId,
    projectName,
}) => {
    const { assignedProjects } = useProject();
    const [purchase, setPurchase] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [boqName, setBoqName] = useState<string>("None");
    const [resolvedProjectName, setResolvedProjectName] = useState<string>(projectName);

    useEffect(() => {
        if (projectName && projectName !== "Unknown Project") {
            setResolvedProjectName(projectName);
        }
    }, [projectName]);

    useEffect(() => {
        if (isOpen && purchaseId) {
            fetchPurchase();
        } else {
            setPurchase(null);
            setBoqName("None");
        }
    }, [isOpen, purchaseId]);

    const fetchPurchase = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentService.getPurchase(purchaseId!);
            setPurchase(data);

            // Resolve Project Name from backend response or project list
            let pName = "";
            const pId = data.project_id;
            if (pId) {
                const assigned = assignedProjects.find(p => p.id === pId);
                if (assigned?.project_name) {
                    pName = assigned.project_name;
                } else if (projectName && projectName !== "Unknown Project") {
                    pName = projectName;
                } else {
                    try {
                        const { projectService } = await import("../../services/projectService");
                        const res = await projectService.getProjects(100);
                        const pList = Array.isArray(res) ? res : (res?.items || res?.data || []);
                        const match = pList.find((p: any) => (p.id || p.project_id) === pId);
                        if (match?.project_name) pName = match.project_name;
                    } catch (e) {
                        console.error("Failed to resolve project name:", e);
                    }
                }
            } else if (projectName && projectName !== "Unknown Project") {
                pName = projectName;
            }
            setResolvedProjectName(pName || (pId ? `Project #${pId}` : (projectName || "Unknown Project")));

            // Fetch BOQ Name if boq_item_id exists
            if (data.project_id && data.boq_item_id) {
                const { boqService } = await import("../../services/boqService");
                const boqs = await boqService.getBoqsByProject(data.project_id);
                const item = boqs.find(b => b.id === data.boq_item_id);
                if (item) setBoqName(item.item_name);
            }
        } catch (error) {
            console.error("Failed to fetch purchase details:", error);
            toast.error("Could not load purchase details.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr || dateStr === "null") return "N/A";
        try {
            const normalized = dateStr.includes("Z") || dateStr.includes("+") ? dateStr : dateStr.replace(" ", "T") + "Z";
            const d = new Date(normalized);
            if (isNaN(d.getTime())) return dateStr.replace("T", " ");
            return d.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch {
            return dateStr.replace("T", " ");
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr || dateStr === "null") return "N/A";
        try {
            const parts = dateStr.split("T")[0].split("-");
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const formatPurchaseType = (type?: string) => {
        if (!type || type === "null") return "N/A";
        const map: Record<string, string> = {
            RENT: "Rental",
            NEW: "New Equipment",
            USED: "Used Equipment",
            SPARE_PART: "Spare Part",
            PURCHASE: "Purchase"
        };
        return map[type.toUpperCase()] || (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());
    };

    const getCleanNotes = (notes?: string) => {
        if (!notes || notes === "null" || notes.trim() === "" || notes.trim().toLowerCase() === "none") {
            return null;
        }
        return notes;
    };

    if (!isOpen) return null;

    const cleanNotes = purchase ? getCleanNotes(purchase.notes) : null;

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex justify-center min-h-full p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-300 relative self-center my-8">
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[2rem]">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                    Purchase Details
                                </h3>
                                {purchase?.purchase_type && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        {formatPurchaseType(purchase.purchase_type)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                View complete procurement record for Order #{purchaseId}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 sm:p-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : !purchase ? (
                            <div className="text-center py-16 text-slate-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-semibold">No details found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Details Grid - Perfectly Symmetrical 2 Columns (5 balanced pairs = 10 cells) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 1. Asset Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 truncate" title={purchase.asset_name || `Asset #${purchase.asset_id}`}>
                                            {purchase.asset_name || `Asset #${purchase.asset_id}`}
                                        </p>
                                    </div>

                                    {/* 2. Project Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Building className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 truncate" title={resolvedProjectName}>
                                            {resolvedProjectName}
                                        </p>
                                    </div>

                                    {/* 3. BOQ Item Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">BOQ Item Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 truncate" title={boqName}>
                                            {boqName}
                                        </p>
                                    </div>

                                    {/* 4. Purchase Type */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purchase Type</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {formatPurchaseType(purchase.purchase_type)}
                                        </p>
                                    </div>

                                    {/* 5. Vendor Name */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vendor Name</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 truncate" title={purchase.vendor_name || "N/A"}>
                                            {purchase.vendor_name || "N/A"}
                                        </p>
                                    </div>

                                    {/* 6. Created At (IST) */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Created At</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {formatDateTime(purchase.created_at)}
                                        </p>
                                    </div>

                                    {/* 7. Purchase Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Purchase Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {formatDate(purchase.purchase_date)}
                                        </p>
                                    </div>

                                    {/* 8. Warranty End Date */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Warranty End Date</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {formatDate(purchase.warranty_end_date)}
                                        </p>
                                    </div>

                                    {/* 9. Quantity & Unit Price */}
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="w-4 h-4 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qty & Unit Price</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {purchase.quantity} × ₹{Number(purchase.unit_price || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* 10. Total Amount */}
                                    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="w-4 h-4 text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Total Amount</p>
                                        </div>
                                        <p className="text-lg font-black text-primary">
                                            ₹{Number(purchase.total_amount || (purchase.quantity * purchase.unit_price) || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Full-Width Notes Section */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</p>
                                    </div>
                                    {cleanNotes ? (
                                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{cleanNotes}</p>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-400 italic">No additional notes provided.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer with Primary Close Button */}
                    <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-[2rem]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchaseModal;
