import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { projectService } from '../../../services/projectService';
import { CustomSelect } from '../../../components/common/CustomDropdown'; // force TS server update
import { UserCircle, Briefcase, Check, Activity } from 'lucide-react';

interface EditTaskRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    request: any | null;
}

const EditTaskRequestModal: React.FC<EditTaskRequestModalProps> = ({ isOpen, onClose, onSuccess, request }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        priority: "",
        description: "",
        status: "",
        assigned_to: 0,
        is_deleted: false
    });
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    useEffect(() => {
        if (request && isOpen) {
            setFormData({
                title: request.title || "",
                category: request.category || "",
                priority: request.priority || "",
                description: request.description || "",
                status: request.status || "",
                assigned_to: request.assigned_to || 0,
                is_deleted: request.is_deleted || false
            });
            setAttachmentFile(null);

            if (request.project_id) {
                projectService.getProjectMembers(request.project_id)
                    .then((res: any) => {
                        const membersList = Array.isArray(res) ? res : (res?.items || res?.data || []);
                        setProjectMembers(membersList);
                    })
                    .catch((err: any) => console.error("Failed to fetch project members:", err));
            }
        }
    }, [request, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'assigned_to') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachmentFile(e.target.files[0]);
        } else {
            setAttachmentFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request) return;

        if (!formData.title?.trim()) { toast.error("Title is required"); return; }
        if (!formData.category) { toast.error("Category is required"); return; }
        if (!formData.priority) { toast.error("Priority is required"); return; }
        if (!formData.status) { toast.error("Status is required"); return; }
        if (!formData.assigned_to) { toast.error("Assigning a user is required"); return; }

        setIsSubmitting(true);
        try {
            const payload = { ...formData };
            if (attachmentFile) {
                // Attachments are typically handled differently on JSON endpoints
                (payload as any).attachment = attachmentFile;
            }

            await projectService.updateTaskRequest(request.id || request.request_id, payload);
            toast.success("Task Request updated successfully");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to update task request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !request) return null;

    const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium";

    const modalFooter = (
        <div className="flex justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
                Cancel
            </button>
            <button
                form="edit-task-request-form"
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Edit Task Request
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Task Request"
            footer={modalFooter}
        >
            <form id="edit-task-request-form" onSubmit={handleSubmit} className="space-y-6 font-inter">

                {/* Basic Information */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClasses}>
                                Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={inputClasses}
                                placeholder="Enter title"
                                required
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Category"
                                icon={Activity}
                                required
                                value={formData.category}
                                onChange={(val: any) => setFormData(prev => ({ ...prev, category: val }))}
                                options={[
                                    { id: 'Civil', label: 'Civil' },
                                    { id: 'Electrical', label: 'Electrical' },
                                    { id: 'Plumbing', label: 'Plumbing' },
                                    { id: 'Safety', label: 'Safety' },
                                    { id: 'Material', label: 'Material' },
                                    { id: 'General', label: 'General' },
                                    { id: 'Other', label: 'Other' }
                                ]}
                                placeholder="Select category"
                                searchable={false}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Priority"
                                icon={Briefcase}
                                required
                                value={formData.priority}
                                onChange={(val: any) => setFormData(prev => ({ ...prev, priority: val }))}
                                options={[
                                    { id: 'LOW', label: 'LOW' },
                                    { id: 'MEDIUM', label: 'MEDIUM' },
                                    { id: 'HIGH', label: 'HIGH' },
                                    { id: 'CRITICAL', label: 'CRITICAL' }
                                ]}
                                placeholder="Select priority"
                                searchable={false}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Status"
                                icon={Check}
                                required
                                value={formData.status}
                                onChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                                options={[
                                    { id: 'PENDING', label: 'PENDING' },
                                    { id: 'APPROVED', label: 'APPROVED' },
                                    { id: 'REJECTED', label: 'REJECTED' }
                                ]}
                                placeholder="Select status"
                                searchable={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Additional Details</h3>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className={labelClasses}>
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className={`${inputClasses} resize-none`}
                                placeholder="Enter description"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <CustomSelect
                                label="Assigned To"
                                icon={UserCircle}
                                required
                                value={formData.assigned_to || 0}
                                onChange={(val: any) => setFormData(prev => ({ ...prev, assigned_to: Number(val) }))}
                                options={[
                                    { id: 0, label: 'Unassigned' },
                                    ...projectMembers.map(m => ({
                                        id: m.user_id || m.id,
                                        label: m.labour_name || m.full_name || m.name || `User ${m.user_id || m.id}`,
                                        badge: m.skill_type || m.role || 'GENERAL',
                                        searchKey: `${m.worker_code || ''} ${m.id || ''} ${m.role || ''} ${m.name || ''}`
                                    }))
                                ]}
                                placeholder="Select User"
                                placement="top"
                            />
                        </div>

                            <div>
                                <label className={labelClasses}>
                                    Attachment
                                </label>
                                <input
                                    type="file"
                                    name="attachment"
                                    onChange={handleFileChange}
                                    className={`${inputClasses} cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_deleted"
                                name="is_deleted"
                                checked={formData.is_deleted}
                                onChange={handleChange}
                                className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="is_deleted" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                Mark as Deleted
                            </label>
                        </div>
                    </div>
                </div>

            </form>
        </Modal>
    );
};

export default EditTaskRequestModal;
