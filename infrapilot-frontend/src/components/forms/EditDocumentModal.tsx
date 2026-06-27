import React, { useState, useEffect } from "react";
import { X, Save, FileText, CheckCircle2 } from "lucide-react";
import type { Document, DocumentUpdateParams } from "../../types/document";

interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: DocumentUpdateParams) => Promise<void>;
    document: Document | null;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    document,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<DocumentUpdateParams>({
        title: "",
        document_type: "",
        remarks: "",
        status: "PENDING",
        version: "1.0",
        date: new Date().toISOString().split('T')[0],
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title || "",
                document_type: document.document_type || "General",
                remarks: document.remarks || "",
                status: document.status || "PENDING",
                version: document.version || "1.0",
                date: (document as any).date || (document.uploaded_at ? document.uploaded_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            });
            setSelectedFile(null);
        }
    }, [document]);

    if (!isOpen || !document) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!document) return;

        setIsSubmitting(true);
        try {
            const data: any = { ...formData };
            if (selectedFile) {
                data.file = selectedFile;
            }

            await onSubmit(document.id, data);
            onClose();
        } catch (error) {
            console.error("Update Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 scale-in-center">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20 flex items-center justify-center text-white">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                Edit Details
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                {document.is_folder ? "Folder Management" : "Document Metadata"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {!document.is_folder && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Document Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer text-slate-800"
                                    value={formData.document_type || "General"}
                                    onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                                >
                                    <option value="General">General</option>
                                    <option value="Drawing">Drawing</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Report">Report</option>
                                    <option value="Blueprint">Blueprint</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer text-slate-800"
                                    value={formData.status || "PENDING"}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {!document.is_folder && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Version <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 1.0"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-800"
                                    value={formData.version || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Update File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="edit-file-upload"
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    <label
                                        htmlFor="edit-file-upload"
                                        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm cursor-pointer hover:bg-slate-100 transition-all"
                                    >
                                        <span className="text-slate-500 font-bold truncate max-w-[120px]">
                                            {selectedFile ? selectedFile.name : "Choose file..."}
                                        </span>
                                        <div className="bg-amber-500 text-white p-1 rounded-lg transition-transform active:scale-95">
                                            <Save size={14} strokeWidth={3} />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.document_type === "Drawing" && (
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Engineering Release Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-800"
                                value={formData.date || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Remarks (Optional)
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium resize-none text-slate-800"
                            value={formData.remarks || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title}
                            className="flex-[2] px-8 py-4 bg-amber-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} strokeWidth={3} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDocumentModal;
