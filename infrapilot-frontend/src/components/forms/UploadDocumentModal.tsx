import React, { useState, useEffect } from "react";
import { X, Upload, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    parentId?: number | null;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    parentId = null,
}) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        project_id: "",
        title: "",
        document_type: "General",
        remarks: "",
    });

    useEffect(() => {
        if (isOpen) {
            const fetchProjects = async () => {
                try {
                    const response = await projectService.getProjects(100);
                    setProjects(Array.isArray(response) ? response : response.items || []);
                } catch (error) {
                    console.error("Failed to fetch projects", error);
                }
            };
            fetchProjects();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            if (!formData.title) {
                // Auto-fill title from filename
                const fileName = e.target.files[0].name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({ ...prev, title: fileName }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        if (!formData.project_id) {
            toast.error("Please select a project.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("file", selectedFile);
            data.append("project_id", formData.project_id);
            data.append("title", formData.title);
            data.append("document_type", formData.document_type);
            if (parentId) data.append("parent_id", parentId.toString());
            if (formData.remarks) data.append("remarks", formData.remarks);

            await onSubmit(data);
            onClose();
            setSelectedFile(null);
            setFormData({
                project_id: "",
                title: "",
                document_type: "General",
                remarks: "",
            });
        } catch (error) {
            console.error("Upload Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 scale-in-center">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                            <Upload size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                Upload Document
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                Secure Document Repository
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Project Link <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                                value={formData.project_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Document Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                                value={formData.document_type}
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
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Document Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Structural Design - Wing A"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            File Selection <span className="text-rose-500">*</span>
                        </label>
                        <div
                            className={`relative border-2 border-dashed rounded-[1.5rem] p-8 transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${selectedFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/40"
                                }`}
                            onClick={() => document.getElementById('file-upload-input')?.click()}
                        >
                            <input
                                id="file-upload-input"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${selectedFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                }`}>
                                {selectedFile ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                            </div>
                            <p className={`text-sm font-bold ${selectedFile ? "text-emerald-700" : "text-slate-600"}`}>
                                {selectedFile ? selectedFile.name : "Click to select or drag & drop"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF, Images, CAD files (Max 50MB)"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Remarks (Optional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Any additional notes or version information..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none"
                            value={formData.remarks}
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
                            disabled={isSubmitting || !selectedFile || !formData.project_id || !formData.title}
                            className="flex-[2] px-8 py-4 bg-slate-800 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Upload size={18} strokeWidth={3} />
                                    Initiate Upload
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
