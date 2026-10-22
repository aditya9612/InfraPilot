import React, { useState, useEffect } from "react";
import { X, Save, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Document, DocumentUpdateParams } from "../../types/document";

interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: any) => Promise<void>;
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

        const trimmedTitle = (formData.title || "").trim();
        const isDrawing = formData.document_type === "Drawing" || (document as any).document_type === "Drawing";
        const fieldLabel = document.is_folder ? "Folder Name" : (isDrawing ? "Drawing Name" : "Document Title");

        if (!trimmedTitle) {
            toast.error(`${fieldLabel} is required.`);
            return;
        }

        const MAX_TITLE_LENGTH = 100;
        if (trimmedTitle.length > MAX_TITLE_LENGTH) {
            toast.error(`${fieldLabel} cannot exceed ${MAX_TITLE_LENGTH} characters.`);
            return;
        }

        const trimmedVersion = (formData.version || "").trim();
        if (isDrawing) {
            if (!trimmedVersion) {
                toast.error("Version is required.");
                return;
            }
            if (trimmedVersion.length > 30) {
                toast.error("Version cannot exceed 30 characters.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (selectedFile) {
                const fd = new FormData();
                fd.append("title", trimmedTitle);
                fd.append("document_type", formData.document_type || "");
                fd.append("remarks", (formData.remarks || "").trim());
                fd.append("status", formData.status || "");
                fd.append("version", trimmedVersion || "1.0");
                if (formData.date) {
                    fd.append("date", formData.date);
                }
                fd.append("file", selectedFile);
                await onSubmit(document.id, fd);
            } else {
                await onSubmit(document.id, {
                    ...formData,
                    title: trimmedTitle,
                    version: trimmedVersion || "1.0",
                    remarks: (formData.remarks || "").trim()
                });
            }
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
                        <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
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
                        className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Core Document Identity</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {document.is_folder ? "Folder Name" : (formData.document_type === "Drawing" ? "Drawing Name" : "Document Title")} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                placeholder={formData.document_type === "Drawing" ? "e.g., Structural Plan A1" : "e.g., Site Contract"}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                onBlur={() => setFormData(prev => ({ ...prev, title: (prev.title || "").trim() }))}
                            />
                        </div>

                        {!document.is_folder && (
                            <>
                                {formData.document_type !== "Drawing" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                Document Type <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer text-slate-800"
                                                value={formData.document_type || "General"}
                                                onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                                            >
                                                <option value="General">General</option>
                                                <option value="Drawing">Drawing</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Invoice">Invoice</option>
                                                <option value="Report">Report</option>
                                                <option value="Blueprint">Blueprint</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                Status <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer text-slate-800"
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`space-y-1.5 ${formData.document_type === "Drawing" ? "col-span-1" : "col-span-1"}`}>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Version <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={30}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                            value={formData.version || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                            onBlur={() => setFormData(prev => ({ ...prev, version: (prev.version || "").trim() }))}
                                        />
                                    </div>

                                    {formData.document_type === "Drawing" ? (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                Engineering Release Date <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                                value={formData.date || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            />
                                        </div>
                                    ) : (
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
                                                    className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm cursor-pointer hover:bg-slate-100 transition-all font-bold text-slate-800"
                                                >
                                                    <span className="text-slate-500 font-bold truncate">
                                                        {selectedFile ? selectedFile.name : "Choose file..."}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Technical Specifications</h3>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Remarks
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none text-slate-800"
                                    value={formData.remarks || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.title}
                                className="flex-[2] px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDocumentModal;
