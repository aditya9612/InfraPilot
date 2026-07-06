import React, { useState, useEffect, useRef } from "react";
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        project_id: "",
        title: "",
        document_type: preSelectedType,
        remarks: "",
        version: "v1.0",
        date: new Date().toISOString().split('T')[0],
        approved_by: "Site Engineer",
        parent_id: ""
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                project_id: "",
                title: "",
                document_type: preSelectedType,
                remarks: "",
                version: "v1.0",
                date: new Date().toISOString().split('T')[0],
                approved_by: "Site Engineer",
                parent_id: parentId ? parentId.toString() : ""
            });
            setSelectedFile(null);

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
    }, [isOpen, parentId, preSelectedType]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            if (!formData.title) {
                const fileName = file.name.split('.').slice(0, -1).join('.');
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

            const resolvedParentId = formData.parent_id.trim() !== ""
                ? formData.parent_id
                : parentId ? parentId.toString() : "";
            if (resolvedParentId) {
                data.append("parent_id", resolvedParentId);
            }

            if (formData.remarks) {
                data.append("remarks", formData.remarks);
            }

            if (formData.document_type === "Drawing") {
                data.append("version", formData.version);
                data.append("date", formData.date);
                data.append("approved_by", formData.approved_by);
            }

            await onSubmit(data);
            onClose();
        } catch (error) {
            console.error("Upload Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800";
    const labelCls = "text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block";

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

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div>
                        <label className={labelCls}>Project <span className="text-rose-500">*</span></label>
                        <select
                            required
                            value={formData.project_id}
                            onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                            className={inputCls}
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>
                            ))}
                        </select>
                    </div>

                    {formData.document_type === "Drawing" ? (
                        <>
                            <div>
                                <label className={labelCls}>Drawing Name <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Foundation Drawing Rev-2"
                                    className={inputCls}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Version <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        value={formData.version}
                                        onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                        placeholder="e.g. v1.0"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Remarks</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Optional notes..."
                                    rows={2}
                                    className={inputCls + " resize-none"}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className={labelCls}>Document Title</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Site Contract 2026"
                                    className={inputCls}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Document Type</label>
                                    <select
                                        value={formData.document_type}
                                        onChange={e => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                                        className={inputCls}
                                    >
                                        <option value="General">General</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Invoice">Invoice</option>
                                        <option value="Report">Report</option>
                                        <option value="Blueprint">Blueprint</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Parent Folder ID</label>
                                    <input
                                        type="number"
                                        value={formData.parent_id}
                                        onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                        placeholder="Optional folder ID"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Remarks</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Optional notes..."
                                    rows={2}
                                    className={inputCls + " resize-none"}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className={labelCls}>File <span className="text-rose-500">*</span></label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                        className="ml-auto p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-500">Click to select file</p>
                                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DWG, Images supported</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="pt-4 flex gap-4 bg-white sticky bottom-0">
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
