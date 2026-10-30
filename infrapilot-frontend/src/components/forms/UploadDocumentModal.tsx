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
        version: "v1.0",
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                project_id: "",
                title: "",
                document_type: preSelectedType,
                remarks: "",
                parent_id: parentId ? parentId.toString() : "",
                version: "v1.0",
                date: new Date().toISOString().split('T')[0],
            });
            const fetchProjects = async () => {
                try {
                    const response = await projectService.getProjects(100);
                    const rawList = Array.isArray(response) ? response : response.items || [];
                    const deletedClients = JSON.parse(localStorage.getItem("infrapilot_deleted_clients") || "[]");
                    const activeProjects = rawList.filter((p: any) => {
                        if (p.is_deleted) return false;
                        const isDeleted = deletedClients.some((d: any) => {
                            if (p.client_id && String(p.client_id) === String(d.id)) return true;
                            const pMob = (p.client_mobile || p.client_phone || "").replace(/\D/g, "").slice(-10);
                            const dMob = (d.mobile || d.phone || "").replace(/\D/g, "").slice(-10);
                            if (pMob && dMob && pMob === dMob) return true;
                            if (p.client_email && d.email && p.client_email.toLowerCase() === d.email.toLowerCase()) return true;
                            return false;
                        });
                        return !isDeleted;
                    });
                    setProjects(activeProjects);
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

        const trimmedTitle = (formData.title || "").trim();
        const isDrawing = formData.document_type === "Drawing";
        const fieldLabel = isDrawing ? "Drawing Name" : "Document Title";

        if (!trimmedTitle) {
            toast.error(`${fieldLabel} is required.`);
            return;
        }

        const MAX_TITLE_LENGTH = 100;
        if (trimmedTitle.length > MAX_TITLE_LENGTH) {
            toast.error(`${fieldLabel} cannot exceed ${MAX_TITLE_LENGTH} characters.`);
            return;
        }

        const trimmedVersion = (formData.version || "").trim() || "v1.0";
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
            const data = new FormData();
            data.append("file", selectedFile);
            data.append("project_id", formData.project_id);
            data.append("title", trimmedTitle);
            if (formData.document_type) data.append("document_type", formData.document_type);
            if (formData.document_type === "Drawing") {
                data.append("version", trimmedVersion);
                if (formData.date) data.append("date", formData.date);
            }
            if (formData.parent_id) data.append("parent_id", formData.parent_id);
            if (formData.remarks) data.append("remarks", (formData.remarks || "").trim());

            await onSubmit(data);
            onClose();
            setSelectedFile(null);
            setFormData({
                project_id: "",
                title: "",
                document_type: "General",
                remarks: "",
                parent_id: "",
                version: "v1.0",
                date: new Date().toISOString().split('T')[0],
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
                <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 shadow-lg shadow-primary/30 flex items-center justify-center text-white ring-4 ring-primary/10">
                            <Upload size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    {formData.document_type === "Drawing" ? "Upload Drawing" : "Upload Document"}
                                </h2>
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-md">
                                    {formData.document_type === "Drawing" ? "Drawing Form" : "Document Form"}
                                </span>
                            </div>
                            <p className="text-[11px] font-black text-primary uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-500" />
                                Secure Document Repository
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/60 rounded-2xl transition-all text-slate-400 hover:text-slate-700"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                            <Layers className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Core Document Identity</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                Project Context <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer text-slate-800"
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
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                    {formData.document_type === "Drawing" ? "Drawing Name" : "Document Title"} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    placeholder={formData.document_type === "Drawing" ? "e.g., Structural Plan A1" : "e.g., Site Contract"}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    onBlur={() => setFormData(prev => ({ ...prev, title: prev.title.trim() }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                {formData.document_type === "Drawing" ? (
                                    <>
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                            Version <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={30}
                                            placeholder="e.g., v1.0"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                            value={formData.version}
                                            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                            onBlur={() => setFormData(prev => ({ ...prev, version: prev.version.trim() }))}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                            Document Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer text-slate-800"
                                            value={formData.document_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                                        >
                                            <option value="">Select Type (Optional)</option>
                                            <option value="General">General</option>
                                            <option value="Drawing">Drawing</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Invoice">Invoice</option>
                                            <option value="Report">Report</option>
                                            <option value="Blueprint">Blueprint</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </>
                                )}
                            </div>
                        </div>

                        {formData.document_type === "Drawing" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                        value={formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                        Parent ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                        value={formData.parent_id || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {formData.document_type !== "Drawing" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                        Parent ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800"
                                        value={formData.parent_id || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className={`space-y-1.5 ${formData.document_type === "Drawing" ? "col-span-2" : ""}`}>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                    File <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="file-upload-input"
                                    type="file"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Technical Specifications</h3>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                                Remarks
                            </label>
                            <textarea
                                rows={2}
                                maxLength={500}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-800 resize-none"
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
