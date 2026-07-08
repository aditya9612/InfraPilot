import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { projectService } from '../../../services/projectService';

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

        setIsSubmitting(true);
        try {
            // We create a FormData object to handle the file upload
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('category', formData.category);
            payload.append('priority', formData.priority);
            payload.append('description', formData.description);
            payload.append('status', formData.status);
            payload.append('assigned_to', String(formData.assigned_to));
            payload.append('is_deleted', String(formData.is_deleted));
            
            if (attachmentFile) {
                payload.append('attachment', attachmentFile);
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

    const labelClasses = "block text-sm font-medium text-gray-600 mb-1";
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
                Save changes
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
            <form id="edit-task-request-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                    <div className="space-y-1">
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

                    <div className="space-y-1">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={labelClasses}>
                                Category
                            </label>
                            <input 
                                type="text" 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={inputClasses}
                                placeholder="Enter category"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>
                                Priority
                            </label>
                            <input 
                                type="text" 
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className={inputClasses}
                                placeholder="Enter priority"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={labelClasses}>
                                Status
                            </label>
                            <input 
                                type="text" 
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClasses}
                                placeholder="Enter status"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>
                                Assigned To (ID)
                            </label>
                            <input 
                                type="number" 
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClasses}>
                            Attachment
                        </label>
                        <input 
                            type="file" 
                            name="attachment"
                            onChange={handleFileChange}
                            className={`${inputClasses} cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`}
                        />
                        {request.attachment_url && !attachmentFile && (
                            <p className="text-xs text-primary mt-1 truncate">
                                Current: <a href={request.attachment_url} target="_blank" rel="noreferrer" className="underline hover:text-blue-600">{request.attachment_url}</a>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="is_deleted"
                            name="is_deleted"
                            checked={formData.is_deleted}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="is_deleted" className="text-sm font-medium text-gray-600 cursor-pointer">
                            Mark as Deleted
                        </label>
                    </div>
                </div>

            </form>
        </Modal>
    );
};

export default EditTaskRequestModal;
