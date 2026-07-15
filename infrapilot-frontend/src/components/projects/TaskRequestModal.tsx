import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";

interface TaskRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    projectMembers: any[];
    editingRequest?: any | null;
    isLoading?: boolean;
    projectId?: number;
    assignedProjects?: any[];
}

const TaskRequestModal = ({
    isOpen,
    onClose,
    onSubmit,
    projectMembers,
    editingRequest,
    isLoading = false,
    projectId,
    assignedProjects = [],
}: TaskRequestModalProps) => {
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        priority: "MEDIUM",
        description: "",
        attachment_url: "",
        assigned_to: "",
        assigned_project: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [projectMembersForSelectedProject, setProjectMembersForSelectedProject] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (editingRequest) {
            setFormData({
                title: editingRequest.title || "",
                category: editingRequest.category || "",
                priority: editingRequest.priority || "MEDIUM",
                description: editingRequest.description || "",
                attachment_url: editingRequest.attachment_url || "",
                assigned_to: editingRequest.assigned_to || "",
                assigned_project: editingRequest.assigned_project || projectId || "",
            });
        } else {
            setFormData({
                title: "",
                category: "",
                priority: "MEDIUM",
                description: "",
                attachment_url: "",
                assigned_to: "",
                assigned_project: projectId || "",
            });
        }
    }, [editingRequest, isOpen, projectId]);

    // Fetch members when assigned project changes
    useEffect(() => {
        if (formData.assigned_project) {
            const fetchMembers = async () => {
                setLoadingMembers(true);
                try {
                    const members = await projectService.getProjectMembers(Number(formData.assigned_project));
                    setProjectMembersForSelectedProject(Array.isArray(members) ? members : (members?.items || members?.data || []));
                    // Reset assigned_to when project changes
                    setFormData(prev => ({ ...prev, assigned_to: "" }));
                } catch (error) {
                    console.error("Failed to fetch project members:", error);
                    setProjectMembersForSelectedProject([]);
                    toast.error("Failed to load project members");
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchMembers();
        } else {
            setProjectMembersForSelectedProject([]);
        }
    }, [formData.assigned_project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error("Title is required");
            return;
        }

        setSubmitting(true);
        try {
            const submitData = {
                ...formData,
                assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
                assigned_project: formData.assigned_project ? Number(formData.assigned_project) : projectId,
                project_id: projectId,
            };
            await onSubmit(submitData);
            setFormData({
                title: "",
                category: "",
                priority: "MEDIUM",
                description: "",
                attachment_url: "",
                assigned_to: "",
                assigned_project: "",
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingRequest ? "Edit Task Request" : "Create Task Request"}
            maxWidth="max-w-3xl"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="task-request-form"
                        disabled={submitting || isLoading}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : editingRequest ? "Update" : "Create"}
                    </button>
                </>
            }
        >
            <form id="task-request-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                        Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter task request title"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Category</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="e.g. Documentation, Testing, Design"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter task description"
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all cursor-pointer"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Assigned Project</label>
                        <select
                            name="assigned_project"
                            value={formData.assigned_project}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all cursor-pointer"
                        >
                            <option value="">Select Project</option>
                            {assignedProjects.map(p => (
                                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                    {p.name || p.project_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Assign To</label>
                    <select
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        disabled={!formData.assigned_project || loadingMembers}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        <option value="">
                            {loadingMembers ? "Loading members..." : !formData.assigned_project ? "Select a project first" : "Select Team Member"}
                        </option>
                        {projectMembersForSelectedProject.map(m => (
                            <option key={m.user_id} value={m.user_id}>
                                {m.full_name} ({m.role})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Attachment URL</label>
                    <input
                        type="url"
                        name="attachment_url"
                        value={formData.attachment_url}
                        onChange={handleChange}
                        placeholder="https://example.com/attachment"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                    />
                </div>
            </form>
        </Modal>
    );
};

export default TaskRequestModal;
