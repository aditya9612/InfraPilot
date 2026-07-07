import React, { useState, useEffect } from "react";
import { X, Upload, FileText, CheckCircle2, Layers, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    parentId?: number | null;
    preSelectedType?: string;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    parentId = null,
    preSelectedType = "General"
}) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        project_id: "",
        title: "",
        document_type: preSelectedType,
        remarks: "",
        parent_id: parentId ? parentId.toString() : "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                project_id: "",
                title: "",
                document_type: preSelectedType,
                remarks: "",
                parent_id: parentId ? parentId.toString() : "",
            });
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
    }, [isOpen, preSelectedType, parentId]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            if (!formData.title) {
                const fileName = e.target.files[0].name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({ ...prev, title: fileName }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please select a file.");
            return;
        }
        if (!formData.project_id) {
            toast.error("Please select a project.");
            return;
        }
        if (formData.document_type === "Drawing" && !formData.title.trim()) {
            toast.error("Drawing name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("file", selectedFile);
            data.append("project_id", formData.project_id);
            data.append("title", formData.title);
            data.append("document_type", formData.document_type);
            if (formData.parent_id) data.append("parent_id", formData.parent_id);
            if (formData.remarks) data.append("remarks", formData.remarks);

            await onSubmit(data);
            onClose();
            setSelectedFile(null);
            setFormData({
                project_id: "",
                title: "",
                document_type: "General",
                remarks: "",
                parent_id: "",
            });
        } catch (error) {
            console.error("Upload Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 scale-in-center">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                            <Upload size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {formData.document_type === "Drawing" ? "Upload Drawing" : "Upload Document"}
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                Secure Document Repository
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/50 rounded-2xl transition-all text-slate-400 hover:text-slate-650"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Core Document Identity</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Project Context <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                                value={formData.project_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Document Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Structural Design"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Document Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                                    value={formData.document_type}
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Parent ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                    value={formData.parent_id || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    File <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="file-upload-input"
                                    type="file"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-600 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

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
                                rows={2}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none"
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedFile || !formData.project_id || (formData.document_type === "Drawing" && !formData.title.trim())}
                            className="flex-1 px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Upload className="w-4 h-4 text-white" />
                            )}
                            {isSubmitting ? "Uploading..." : "Upload"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
