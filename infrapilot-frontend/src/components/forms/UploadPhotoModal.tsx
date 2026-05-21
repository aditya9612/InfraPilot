import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import { Upload, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { ACTIVITY_TAGS, LOCATION_TAGS } from '../../pages/engineer/SitePhotosPage';
import { projectService } from '../../services/projectService';

interface UploadPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    projectId: number | null;
}

const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({ isOpen, onClose, onSubmit, projectId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        project_id: "",
        date: new Date().toISOString().split("T")[0],
        activity_tag: "",
        location_tag: "",
        description: "",
    });
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                project_id: "",
                date: new Date().toISOString().split("T")[0],
                activity_tag: "",
                location_tag: "",
                description: "",
            });
            setSelectedFile(null);
            setErrors({});
        } else {
            const fetchProjects = async () => {
                try {
                    const res = await projectService.getProjects(100, 0);
                    const list = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(list);
                } catch (error) {
                    console.error("Failed to fetch projects", error);
                }
            };
            fetchProjects();
        }
    }, [isOpen, projectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            if (errors.photo) setErrors(prev => ({ ...prev, photo: "" }));
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!selectedFile) errs.photo = "Required";
        if (!formData.project_id) errs.project_id = "Required";
        if (!formData.activity_tag) errs.activity_tag = "Required";
        if (!formData.location_tag) errs.location_tag = "Required";
        if (!formData.description.trim()) errs.description = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;
        if (!projectId) {
            toast.error("Project context not found. Please reload.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("project_id", String(formData.project_id));
            data.append("date", formData.date);
            data.append("activity_tag", formData.activity_tag);
            data.append("location_tag", formData.location_tag);
            data.append("description", formData.description);
            if (selectedFile) {
                data.append("file", selectedFile);
            }

            console.log("Submitting Photo Upload with Project:", projectId);
            await onSubmit(data);
            onClose();
        } catch (error) {
            console.error("Upload Form Error:", error);
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Register Site Evidence"
            maxWidth="max-w-4xl"
            footer={
                <>
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        form="site-photo-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? "Uploading..." : "Upload Evidence"}
                    </button>
                </>
            }
        >
            <form id="site-photo-form" onSubmit={handleFormSubmit} className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Visual Artifact</h3>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-primary/40'}`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {selectedFile ? (
                            <div className="text-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-700">{selectedFile.name}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Asset Image</p>
                            </div>
                        )}
                    </div>
                    {errors.photo && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1 uppercase">{errors.photo}</p>}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Contextual Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className={labelClasses}>Project Context *</label>
                            <select name="project_id" value={formData.project_id} onChange={handleChange} className={inputClasses(errors.project_id)}>
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                        {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Observed Date *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses(errors.date)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                            <label className={labelClasses}>Activity Tag *</label>
                            <select name="activity_tag" value={formData.activity_tag} onChange={handleChange} className={inputClasses(errors.activity_tag)}>
                                <option value="">Select Activity</option>
                                {ACTIVITY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Location Zone *</label>
                            <select name="location_tag" value={formData.location_tag} onChange={handleChange} className={inputClasses(errors.location_tag)}>
                                <option value="">Select Location</option>
                                {LOCATION_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Observation Narrative</h3>
                    <div>
                        <label className={labelClasses}>Narrative Insight *</label>
                        <textarea name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Capture milestones or quality observations..." className={`${inputClasses(errors.description)} resize-none`} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default UploadPhotoModal;
