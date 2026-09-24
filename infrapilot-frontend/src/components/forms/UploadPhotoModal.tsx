import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import { CustomSelect } from '../common/CustomDropdown';
import { Upload, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { ACTIVITY_TAGS, LOCATION_TAGS } from '../../pages/engineer/SitePhotosPage';
import { projectService } from '../../services/projectService';
import { dsrService } from '../../services/dsrService';

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
        task_id: "",
        dsr_id: "",
    });
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [dsrs, setDsrs] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success', message: string; fields?: string[] } | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                project_id: "",
                date: new Date().toISOString().split("T")[0],
                activity_tag: "",
                location_tag: "",
                description: "",
                task_id: "",
                dsr_id: "",
            });
            setSelectedFile(null);
            setErrors({});
            setFormNotification(null);
        } else {
            if (projectId) {
                setFormData(prev => ({ ...prev, project_id: String(projectId) }));
            }
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

    useEffect(() => {
        const fetchProjectData = async () => {
            if (formData.project_id) {
                const projectIdNum = Number(formData.project_id);

                // Fetch tasks independently
                try {
                    const tasksRes = await projectService.getTasks(projectIdNum);
                    setTasks(Array.isArray(tasksRes) ? tasksRes : (tasksRes.items || tasksRes.data || []));
                } catch (error) {
                    console.error("Failed to fetch tasks for project", error);
                    setTasks([]);
                }

                // Fetch DSRs independently
                try {
                    const dsrRes = await dsrService.getDsrByProject(projectIdNum);
                    const dsrList = Array.isArray(dsrRes) ? dsrRes : (dsrRes.items || []);
                    setDsrs(dsrList);
                } catch (error) {
                    console.error("Failed to fetch DSRs for project", error);
                    setDsrs([]);
                }
            } else {
                setTasks([]);
                setDsrs([]);
            }
        };
        fetchProjectData();
    }, [formData.project_id]);

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
        const missingFields: string[] = [];

        if (!selectedFile) {
            errs.photo = "Required";
            missingFields.push("Visual Artifact");
        }
        if (!formData.project_id) {
            errs.project_id = "Required";
            missingFields.push("Project");
        }
        
        setErrors(errs);
        
        if (missingFields.length > 0) {
            setFormNotification({ type: 'error', message: `Mandatory fields required: ${missingFields.join(", ")}`, fields: missingFields });
            return false;
        }
        setFormNotification(null);
        return true;
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
            if (formData.task_id) data.append("task_id", String(formData.task_id));
            if (formData.dsr_id) data.append("dsr_id", String(formData.dsr_id));
            if (selectedFile) {
                data.append("file", selectedFile);
            }

            console.log("Submitting Photo Upload with Project:", projectId);
            await onSubmit(data);
            setFormNotification({ type: 'success', message: 'Site photo saved successfully!' });
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Upload Form Error:", error);
            setFormNotification({ type: 'error', message: 'Upload failed. Please try again.' });
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClasses = "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1";
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
                        {isSubmitting ? "Saving..." : "Save Site Photo"}
                    </button>
                </>
            }
        >
            <form id="site-photo-form" onSubmit={handleFormSubmit} className="space-y-6">
                {/* Top-right floating toast */}
                {formNotification && (
                    <div
                        style={{
                            position: 'fixed',
                            top: '18px',
                            right: '18px',
                            zIndex: 99999,
                            minWidth: '260px',
                            maxWidth: '380px',
                            animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        <style>{`
                            @keyframes slideDownIn {
                                from { opacity: 0; transform: translateY(-16px); }
                                to   { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                        <div
                            className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5"
                            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                                <span className="text-white text-xs font-bold">
                                    {formNotification.type === 'error' ? '×' : '✓'}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                                {formNotification.type === 'error'
                                    ? `Mandatory fields required: ${(formNotification.fields || []).join(', ')}`
                                    : formNotification.message}
                            </p>
                            <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                        </div>
                    </div>
                )}
                {/* Inline Validation Error Banner */}
                {formNotification && formNotification.type === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-600">Validation Error</p>
                            <p className="text-xs text-red-500 mt-0.5">Mandatory fields required: {(formNotification.fields || []).join(', ')}</p>
                        </div>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                    </div>
                )}
                {formNotification && formNotification.type === 'success' && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-bold text-emerald-700 flex-1">{formNotification.message}</p>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-emerald-300 hover:text-emerald-500 text-base leading-none">×</button>
                    </div>
                )}

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Visual Artifact <span className="text-rose-500">*</span></h3>
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
                    {errors.photo && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-2 ml-0.5">Required</p>}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Contextual Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="z-[66] relative">
                            <CustomSelect
                                label="Project Context"
                                required
                                value={formData.project_id?.toString() || ""}
                                onChange={(val) => setFormData(prev => ({ ...prev, project_id: val }))}
                                options={projects.map((p: any) => ({
                                    id: (p.id || p.project_id).toString(),
                                    label: p.name || p.project_name || `Project #${p.id || p.project_id}`
                                }))}
                                placeholder="Select Project"
                                error={!!errors.project_id}
                            />
                            {errors.project_id && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-0.5">Required</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Observed Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses(errors.date)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="z-[65] relative">
                            <CustomSelect
                                label={<span>Task <span className="normal-case text-slate-300">(optional)</span></span> as any}
                                value={formData.task_id?.toString() || ""}
                                onChange={(val) => setFormData(prev => ({ ...prev, task_id: val }))}
                                options={tasks.map((t: any) => ({
                                    id: t.id.toString(),
                                    label: t.title || `Task #${t.id}`
                                }))}
                                placeholder="Select Task..."
                            />
                        </div>
                        <div className="z-[64] relative">
                            <CustomSelect
                                label={<span>DSR <span className="normal-case text-slate-300">(optional)</span></span> as any}
                                value={formData.dsr_id?.toString() || ""}
                                onChange={(val) => setFormData(prev => ({ ...prev, dsr_id: val }))}
                                options={dsrs.map((d: any) => ({
                                    id: d.id.toString(),
                                    label: `DSR #${d.id}`
                                }))}
                                placeholder="Select DSR..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div className="z-[63] relative">
                            <CustomSelect
                                label="Activity Tag"
                                value={formData.activity_tag}
                                onChange={(val) => setFormData(prev => ({ ...prev, activity_tag: val }))}
                                options={[
                                    { id: '', label: 'Select Activity' },
                                    ...ACTIVITY_TAGS.map(t => ({ id: t, label: t }))
                                ]}
                            />
                        </div>
                        <div className="z-[62] relative">
                            <CustomSelect
                                label="Location Zone"
                                value={formData.location_tag}
                                onChange={(val) => setFormData(prev => ({ ...prev, location_tag: val }))}
                                options={[
                                    { id: '', label: 'Select Location' },
                                    ...LOCATION_TAGS.map(t => ({ id: t, label: t }))
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Observation Narrative</h3>
                    <div>
                        <label className={labelClasses}>Narrative Insight</label>
                        <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className={`${inputClasses(errors.description)} resize-none`} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default UploadPhotoModal;
