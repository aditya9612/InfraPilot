import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, FileText, Briefcase, User } from "lucide-react";
import { quotationService } from "../../services/quotationService";
import type { Quotation } from "../../types/quotation";
import toast from "react-hot-toast";

interface ImportEstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (quotation: Quotation) => void;
}

const ImportEstimateModal = ({ isOpen, onClose, onSelect }: ImportEstimateModalProps) => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchQuotations();
        }
    }, [isOpen]);

    const fetchQuotations = async () => {
        try {
            setIsLoading(true);
            const data = await quotationService.getQuotations();
            setQuotations(data);
        } catch (error) {
            console.error("Failed to fetch quotations", error);
            toast.error("Failed to load estimates");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "approved": return "bg-emerald-100 text-emerald-600";
            case "pending":
            case "sent": return "bg-amber-100 text-amber-600";
            case "draft": return "bg-slate-100 text-slate-600";
            case "declined": return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const filteredQuotations = quotations.filter(q =>
        q.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quotation_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Select Estimate to Import</h2>
                            <p className="text-sm text-slate-500 font-medium font-inter">Choose an existing quotation to populate the invoice details.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Client Name or Project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-white">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Fetching Estimates...</p>
                        </div>
                    ) : filteredQuotations.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <FileText className="w-16 h-16 opacity-20" />
                            <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">No estimates found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredQuotations.map((q) => (
                                <div
                                    key={q.id}
                                    onClick={() => onSelect(q)}
                                    className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {q.quotation_no || `QTN-${q.id}`}
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getStatusColor(q.status || "draft")}`}>
                                            {q.status || "draft"}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight text-sm truncate">{q.client_name}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-bold text-slate-500 truncate">{q.project_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                                            <p className="text-lg font-black text-indigo-600">₹{q.grand_total?.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                            <p className="text-xs font-bold text-slate-600">
                                                {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImportEstimateModal;
