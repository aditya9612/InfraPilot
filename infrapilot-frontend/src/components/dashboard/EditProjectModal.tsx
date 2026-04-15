import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import type { Project } from "../../types/project";

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onSubmit?: (projectData: any) => void;
}

const EditProjectModal = ({ isOpen, onClose, project, onSubmit }: EditProjectModalProps) => {
    const [formData, setFormData] = useState({
        project_name: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "" as any,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                project_name: project.project_name,
                description: project.description,
                start_date: project.start_date,
                end_date: project.end_date,
                status: project.status,
            });
        }
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.project_name.trim()) newErrors.project_name = "Project name is required.";
        if (!formData.description.trim()) newErrors.description = "Description is required.";
        if (!formData.start_date) newErrors.start_date = "Start date is required.";
        if (!formData.end_date) newErrors.end_date = "End date is required.";
        else if (formData.start_date && formData.end_date < formData.start_date) {
            newErrors.end_date = "End date cannot be before start date.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !project) return;

        setIsLoading(true);
        // Simulate API call based on USER provided request/response
        setTimeout(() => {
            const requestBody = {
                project_id: project.id, // required field as per user
                ...formData
            };

            console.log("Updating project (Request Body):", requestBody);

            if (onSubmit) onSubmit(requestBody);
            setIsLoading(false);

            toast.success(`Project "${formData.project_name}" updated successfully!`, {
                style: {
                    borderRadius: '12px',
                    background: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600'
                },
            });
            onClose();
        }, 1000);
    };

    const modalFooter = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
                Cancel
            </button>
            <button
                form="edit-project-form"
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
                {isLoading ? "Updating..." : "Update Project"}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Project"
            footer={modalFooter}
        >
            <form id="edit-project-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Project Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Project Name <span className="text-red-500">*</span></label>
                            <input
                                required type="text" name="project_name" value={formData.project_name} onChange={handleChange} placeholder="e.g. SARA CITY"
                                className={`w-full px-3 py-2 bg-slate-50 border ${errors.project_name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
                            />
                            {errors.project_name && <p className="text-[10px] text-red-500 mt-1">{errors.project_name}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Project Status</label>
                            <select
                                name="status" value={formData.status} onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                <option value="Planned">Planned</option>
                                <option value="Active">Active</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea
                                required name="description" value={formData.description} onChange={handleChange} placeholder="Project Details" rows={3}
                                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300 resize-none`}
                            />
                            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                            <input
                                type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                                className={`w-full px-3 py-2 bg-slate-50 border ${errors.start_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all text-slate-700`}
                            />
                            {errors.start_date && <p className="text-[10px] text-red-500 mt-1">{errors.start_date}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                            <input
                                type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                                className={`w-full px-3 py-2 bg-slate-50 border ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all text-slate-700`}
                            />
                            {errors.end_date && <p className="text-[10px] text-red-500 mt-1">{errors.end_date}</p>}
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EditProjectModal;
