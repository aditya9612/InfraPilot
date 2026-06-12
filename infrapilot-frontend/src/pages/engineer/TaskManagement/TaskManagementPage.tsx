import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import toast from 'react-hot-toast';
import {
    Filter, Search, Plus, Eye, Calendar, User,
    CheckCircle, Clock, AlertCircle, XCircle, List, Grid,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Folder,
    Paperclip, Send, X, FileText, Edit2, Trash2, Play, Pause, Mic, TrendingUp, Forward
} from 'lucide-react';
import ConfirmModal from "../../../components/common/ConfirmModal";
import CreateTaskDrawer from './CreateTaskDrawer';
import AudioRecordModal from './AudioRecordModal';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import type { Task, ProjectMember, ProjectStatus } from '../../../types/project';

interface FrontendTask extends Omit<Task, 'priority'> {
    priority: "LOW" | "MEDIUM" | "HIGH";
    assignedBy: { name: string; role: string };
    assignedTo: { name: string; role: string };
    hasHistory: boolean;
    projectName?: string;
    audio_data?: string;
}



const priorityBadges: Record<string, string> = {
    LOW: "bg-emerald-500 text-white",
    MEDIUM: "bg-blue-500 text-white",
    HIGH: "bg-rose-500 text-white",
};

const mapPriority = (priority: number | string): "LOW" | "MEDIUM" | "HIGH" => {
    if (priority === 1 || priority === "High" || priority === "HIGH") return "HIGH";
    if (priority === 2 || priority === "Medium" || priority === "MEDIUM") return "MEDIUM";
    return "LOW";
};
const AudioButton = ({ audioData }: { audioData: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => console.error('Audio play failed:', err));
            setIsPlaying(true);
        }
    };

    return (
        <button
            onClick={togglePlay}
            className={`p-2 rounded-xl transition-all ${isPlaying ? 'text-emerald-600 bg-emerald-100 ring-2 ring-emerald-500/20' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
            title={isPlaying ? "Pause Audio" : "Play Audio"}
        >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            <audio
                ref={audioRef}
                src={audioData}
                className="hidden"
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
            />
        </button>
    );
};

const TaskManagementPage = () => {
    const [projectId, setProjectId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<FrontendTask[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");
    const [ownershipFilter, setOwnershipFilter] = useState("Entire View");

    const [activeTab, setActiveTab] = useState("All Tasks");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    // Project Accordion State
    const [expandedProjects, setExpandedProjects] = useState<number[]>([]);

    // Modal State
    const [selectedTask, setSelectedTask] = useState<FrontendTask | null>(null);
    const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");

    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditTask, setSelectedEditTask] = useState<FrontendTask | null>(null);

    // Audio recording for existing task
    const [recordingTaskId, setRecordingTaskId] = useState<number | null>(null);

    // Detail Modal states
    const [taskComments, setTaskComments] = useState<any[]>([]);
    const [taskActivity, setTaskActivity] = useState<any[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Progress Modal State
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedProgressTask, setSelectedProgressTask] = useState<FrontendTask | null>(null);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [progressRemark, setProgressRemark] = useState("");

    // Pass Task Modal State
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [selectedPassTask, setSelectedPassTask] = useState<FrontendTask | null>(null);
    const [passNewUserId, setPassNewUserId] = useState<number | "">("");
    const [passRemark, setPassRemark] = useState("");
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    useEffect(() => {
        if (projectId) {
            projectService.getProjectMembers(projectId).then(res => {
                setProjectMembers(Array.isArray(res) ? res : (res.items || res.data || []));
            }).catch(() => { });
        }
    }, [projectId]);

    useEffect(() => {
        if (!selectedTask || !projectId) return;
        const fetchDetails = async () => {
            setIsFetchingDetails(true);
            try {
                if (modalTab === "Comments") {
                    const res = await projectService.getTaskComments(selectedTask.project_id || projectId, selectedTask.id);
                    setTaskComments(Array.isArray(res) ? res : (res.items || res.data || []));
                } else if (modalTab === "Activity") {
                    const res = await projectService.getTaskProgressHistory(selectedTask.project_id || projectId, selectedTask.id);
                    setTaskActivity(Array.isArray(res) ? res : (res.items || res.data || []));
                }
            } catch (error) {
                console.error("Failed to fetch details", error);
            } finally {
                setIsFetchingDetails(false);
            }
        };
        fetchDetails();
    }, [selectedTask, modalTab, projectId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && !commentAttachment) || !selectedTask || !projectId) return;

        let finalContent = newComment;
        if (commentAttachment) {
            finalContent += finalContent.trim() ? `\n\n[Attached: ${commentAttachment.name}]` : `[Attached: ${commentAttachment.name}]`;
        }

        try {
            await projectService.createTaskComment(selectedTask.project_id || projectId, selectedTask.id, { content: finalContent });
            setNewComment("");
            setCommentAttachment(null);
            const res = await projectService.getTaskComments(selectedTask.project_id || projectId, selectedTask.id);
            setTaskComments(Array.isArray(res) ? res : (res.items || res.data || []));
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        try {
            const [fetchedTasks, fetchedMembers] = await Promise.all([
                projectService.getTasks(projectId),
                projectService.getProjectMembers(projectId)
            ]);

            const membersList: ProjectMember[] = Array.isArray(fetchedMembers) ? fetchedMembers : (fetchedMembers.items || fetchedMembers.data || []);

            const userStr = localStorage.getItem("infrapilot_user");
            let pName = "Unknown Project";
            if (userStr) {
                const user = JSON.parse(userStr);
                const assignedProjects = user.assigned_projects || [];
                const matched = assignedProjects.find((p: any) => p.id === projectId);
                if (matched) pName = matched.name;
            }

            const mappedTasks: FrontendTask[] = (Array.isArray(fetchedTasks) ? fetchedTasks : (fetchedTasks.items || fetchedTasks.data || [])).map((t: Task & { audio_data?: string }) => {
                const assignee = membersList.find(m => m.user_id === t.assigned_user_id);
                const assigner = { name: "System / Admin", role: "Manager" };

                // Map the exact project name
                let taskProjectName = pName;
                if (t.project_id) {
                    const matched = (userStr ? JSON.parse(userStr).assigned_projects || [] : []).find((p: any) => p.id === t.project_id);
                    if (matched) taskProjectName = matched.name;
                }

                return {
                    ...t,
                    priority: mapPriority(t.priority),
                    assignedBy: assigner,
                    assignedTo: {
                        name: assignee?.full_name || "Unassigned",
                        role: assignee?.role || "Engineer"
                    },
                    hasHistory: false,
                    projectName: taskProjectName,
                    audio_data: t.audio_data
                };
            });
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch task data:", error);
            toast.error("Failed to load tasks");
        }
    }, [projectId]);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    setProjectId(Number(pId));
                } else {
                    setProjectId(92);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
            }
        }
    }, []);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId, activeTab, fetchData]);

    const openEditModal = (task: FrontendTask) => {
        setSelectedEditTask(task);
        setIsEditModalOpen(true);
    };

    const handleEditFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!projectId || !selectedEditTask) return;
        const formData = new FormData(e.currentTarget);

        try {
            const targetProjectId = Number(formData.get('project_id')) || projectId;

            const updatedTaskData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as string,
                status: formData.get('status') as string,
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string,
                assigned_user_ids: [parseInt(formData.get('assigned_user_id') as string) || 1],
                project_id: targetProjectId
            };

            const updatedTaskResponse = await projectService.updateTask(targetProjectId, selectedEditTask.id, updatedTaskData);

            // Optimistic UI Update
            setTasks(prevTasks => prevTasks.map(t => {
                if (t.id === selectedEditTask.id) {
                    const selectEl = document.querySelector('select[name="assigned_user_id"]') as HTMLSelectElement;
                    const assignedName = selectEl ? selectEl.options[selectEl.selectedIndex].text : t.assignedTo.name;
                    return {
                        ...t,
                        ...updatedTaskData,
                        ...updatedTaskResponse,
                        priority: mapPriority(updatedTaskData.priority),
                        status: updatedTaskData.status as any,
                        assigned_user_id: updatedTaskData.assigned_user_ids[0],
                        assignedTo: {
                            ...t.assignedTo,
                            name: assignedName
                        }
                    };
                }
                return t;
            }));

            toast.success("Task updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };



    const toggleProject = (id: number) => {
        setExpandedProjects(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const openTaskModal = async (task: FrontendTask) => {
        if (!projectId) return;
        try {
            const fetchedTask = await projectService.getTask(projectId, task.id);
            setSelectedTask({
                ...task,
                ...fetchedTask,
                priority: task.priority
            });
            setModalTab("Details");
        } catch (error) {
            toast.error("Failed to fetch task details");
        }
    };

    const handleDeleteTask = (taskId: number) => {
        setDeleteId(taskId);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteTask = async () => {
        if (!projectId || !deleteId) return;
        setIsSubmitting(true);
        try {
            await projectService.deleteTask(projectId, deleteId);
            toast.success("Task deleted successfully");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to delete task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!projectId) return;

        // Optimistic UI Update for instant feedback
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

        try {
            await projectService.updateTaskStatus(projectId, taskId, newStatus);
            toast.success(`Task status updated to ${newStatus}`);
            fetchData();
        } catch (error) {
            setTasks(previousTasks);
            toast.error("Failed to update status on server");
        }
    };

    const handleUpdateProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgressTask || !projectId) return;

        try {
            await projectService.updateTaskProgress(projectId, selectedProgressTask.id, {
                percentage: progressPercentage,
                remarks: progressRemark
            });
            toast.success("Progress updated successfully!");
            setIsProgressModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update progress.");
        }
    };

    const handlePassTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPassTask || !projectId || !passNewUserId) return;

        try {
            await projectService.passTask(projectId, selectedPassTask.id, {
                new_user_id: passNewUserId,
                remark: passRemark
            });
            toast.success("Task passed successfully!");
            setIsPassModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to pass task.");
        }
    };

    const handleSaveAudio = async (audioBase64: string) => {
        if (!projectId || !recordingTaskId) return;

        try {
            // Find task to get other fields, as updateTask usually requires full body. 
            // If the API supports partial updates, we could just send audio_data. 
            // We'll send it as a partial update, assuming the backend can handle it, or we fetch the full task.
            const task = tasks.find(t => t.id === recordingTaskId);
            if (!task) return;

            const updatedTaskData = {
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                start_date: task.start_date,
                end_date: task.end_date,
                assigned_user_ids: [task.assigned_user_id],
                project_id: task.project_id || projectId,
                audio_data: audioBase64
            };

            await projectService.updateTask(task.project_id || projectId, recordingTaskId, updatedTaskData);
            toast.success("Audio added successfully!");
            fetchData();
        } catch (error) {
            console.error("Failed to save audio", error);
            throw error; // Let the modal catch it
        }
    };

    const filteredTasks = useMemo(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        let currentUserId = null;
        if (userStr) {
            try { currentUserId = JSON.parse(userStr).id || JSON.parse(userStr).user?.id; } catch (e) { }
        }

        return tasks.filter(t => {
            let match = true;
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
            if (statusFilter !== "All Status" && t.status !== statusFilter) match = false;

            // Ownership filter fixed: "My Projects" should filter for tasks where current user is assigned
            if (ownershipFilter === "My Projects") {
                if (t.assigned_user_id !== currentUserId) match = false;
            }

            // Department logic (mocking, since we don't have department data directly)
            if (departmentFilter !== "All Departments") {
                // Example: if engineering, we might check role
                if (t.assignedTo.role !== "Engineer") match = false;
            }
            return match;
        });
    }, [tasks, searchQuery, statusFilter, ownershipFilter]);

    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTasks, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, ownershipFilter, activeTab, departmentFilter]);

    return (
        <>
            <Navbar title="Task Management" breadcrumb={["Engineer", "Task Management"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

                {/* ─── Header Section ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Task Management
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Efficiently organize, track, and manage all your tasks in one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeTab !== "Project Tasks" && (
                            <button
                                onClick={() => setIsCreateDrawerOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Create Task
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Tabs Section ──────────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 md:mb-8 max-w-full overflow-x-auto scrollbar-none font-inter">
                    <button
                        onClick={() => setActiveTab("All Tasks")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "All Tasks"
                            ? "bg-slate-100 text-slate-800 shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                            }`}
                    >
                        All Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab("Project Tasks")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "Project Tasks"
                            ? "bg-slate-100 text-slate-800 shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                            }`}
                    >
                        Project Tasks
                    </button>
                </div>

                {/* ─── Stats Cards Section ──────────────────────────────────────────────────────── */}
                {activeTab === "All Tasks" ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div onClick={() => setStatusFilter("All Status")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "All Status" ? 'border-primary ring-1 ring-primary shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "All Status" ? 'text-primary' : 'text-slate-400'}`}>Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Planned")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Planned" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Planned" ? 'text-slate-600' : 'text-slate-400'}`}>Planned</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Planned').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("In Progress")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "In Progress" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "In Progress" ? 'text-blue-500' : 'text-slate-400'}`}>In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Completed")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Completed" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Completed" ? 'text-emerald-500' : 'text-slate-400'}`}>Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Completed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Cancelled")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Cancelled" ? 'border-rose-500 ring-1 ring-rose-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Cancelled" ? 'text-rose-500' : 'text-slate-400'}`}>Cancelled</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Cancelled').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div onClick={() => setStatusFilter("All Status")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "All Status" ? 'border-primary ring-1 ring-primary shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "All Status" ? 'text-primary' : 'text-slate-400'}`}>Total Tasks</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                                <List className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Planned")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Planned" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Planned" ? 'text-slate-600' : 'text-slate-400'}`}>To Do</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Planned').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("In Progress")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "In Progress" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "In Progress" ? 'text-blue-500' : 'text-slate-400'}`}>In Progress</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Completed")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Completed" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Completed" ? 'text-emerald-500' : 'text-slate-400'}`}>Completed</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Completed').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div onClick={() => setStatusFilter("Cancelled")} className={`bg-white p-5 rounded-2xl border ${statusFilter === "Cancelled" ? 'border-rose-500 ring-1 ring-rose-500 shadow-md' : 'border-slate-200 shadow-sm'} flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer`}>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Cancelled" ? 'text-rose-500' : 'text-slate-400'}`}>Cancelled</p>
                                <h3 className="text-2xl font-black text-slate-800">{tasks.filter(t => t.status === 'Cancelled').length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Filters Section ──────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">

                    {activeTab === "All Tasks" ? (
                        <>
                            {/* All Tasks Filters Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-6 text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                            <Filter className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">All Tasks Filters</span>
                                    </div>

                                    <div className="relative font-inter flex-1 max-w-md">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Search className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                        >
                                            <option>All Status</option>
                                            <option>Planned</option>
                                            <option>In Progress</option>
                                            <option>Completed</option>
                                            <option>Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Filter</span>
                                        <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                                            <option>All Tasks</option>
                                            <option>Created Tasks</option>
                                            <option>Received Tasks</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Department</span>
                                        <select
                                            value={departmentFilter}
                                            onChange={(e) => setDepartmentFilter(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                        >
                                            <option>All Departments</option>
                                            <option>Engineering</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-xl transition-colors border ${viewMode === 'list' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-xl transition-colors border ${viewMode === 'grid' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* All Tasks Content */}
                            <div className="p-6 bg-slate-50 flex-1">
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedTasks.map(task => (
                                            <div key={task.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${task.status === 'Cancelled' ? 'border-rose-200' : 'border-slate-200'}`}>
                                                <div className="p-5 flex-1">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                            {task.status === "Cancelled" && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white">
                                                                    CANCELLED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Cancelled' ? 'bg-rose-500' : task.status === 'Planned' ? 'bg-slate-400' : 'bg-blue-500'}`} />
                                                    </div>

                                                    <h3 className="text-base font-bold text-slate-800 mb-1">{task.title}</h3>
                                                    <p className="text-xs text-slate-500 mb-5 min-h-[32px] line-clamp-2">{task.description}</p>



                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">To:</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-800">{task.assignedTo.name}</p>
                                                                <p className="text-[10px] text-slate-500">{task.assignedTo.role}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">By:</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-800">{task.assignedBy.name}</p>
                                                                <p className="text-[10px] text-slate-500">{task.assignedBy.role}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-500">Due:</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-800">{new Date(task.end_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProgressTask(task);
                                                                setProgressPercentage(task.completion_percentage || 0);
                                                                setProgressRemark("");
                                                                setIsProgressModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                            title="Update Progress"
                                                        >
                                                            <TrendingUp className="w-3.5 h-3.5" />
                                                            Progress
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPassTask(task);
                                                                setPassNewUserId("");
                                                                setPassRemark("");
                                                                setIsPassModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                            title="Pass/Delegate Task"
                                                        >
                                                            <Forward className="w-3.5 h-3.5" />
                                                            Pass
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {task.audio_data ? (
                                                            <AudioButton audioData={task.audio_data} />
                                                        ) : (
                                                            <button onClick={() => setRecordingTaskId(task.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Add Audio">
                                                                <Mic className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                                        <table className="w-full text-left font-inter min-w-[1000px] block md:table">
                                            <thead className="hidden md:table-header-group">
                                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Project</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned By</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Assignment</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="block md:table-row-group">
                                                {paginatedTasks.map((task) => (
                                                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors block md:table-row">
                                                        <td className="p-4 block md:table-cell">
                                                            <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{task.description}</p>

                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 whitespace-nowrap">
                                                                {task.projectName}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <User className="w-3 h-3" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{task.assignedBy.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{task.assignedBy.role}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <User className="w-3 h-3" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{task.assignedTo.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{task.assignedTo.role}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${task.assignedTo.name === 'Unassigned' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {task.assignedTo.name === 'Unassigned' ? 'UNASSIGNED' : 'ASSIGNED'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                {new Date(task.end_date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 block md:table-cell">
                                                            <div className="relative inline-block w-full min-w-[130px]">
                                                                <select
                                                                    value={task.status}
                                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                                                                >
                                                                    <option value="Planned">Planned</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Cancelled">Cancelled</option>
                                                                </select>
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'Cancelled' ? 'bg-rose-500' :
                                                                        task.status === 'Completed' ? 'bg-emerald-500' :
                                                                            task.status === 'In Progress' ? 'bg-blue-500' :
                                                                                'bg-slate-400'
                                                                        }`}></div>
                                                                </div>
                                                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {task.audio_data ? (
                                                                    <AudioButton audioData={task.audio_data} />
                                                                ) : (
                                                                    <button onClick={() => setRecordingTaskId(task.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Add Audio">
                                                                        <Mic className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedProgressTask(task);
                                                                        setProgressPercentage(task.completion_percentage || 0);
                                                                        setProgressRemark("");
                                                                        setIsProgressModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                                    title="Update Progress"
                                                                >
                                                                    <TrendingUp className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPassTask(task);
                                                                        setPassNewUserId("");
                                                                        setPassRemark("");
                                                                        setIsPassModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                                    title="Pass/Delegate Task"
                                                                >
                                                                    <Forward className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="Edit">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            {/* Pagination Block */}
                            {filteredTasks.length > 0 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white font-inter rounded-b-2xl mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} records
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {(() => {
                                            const totalItems = filteredTasks.length;
                                            const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                            const pages = [];
                                            if (totalPages <= 5) {
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                if (currentPage <= 3) {
                                                    pages.push(1, 2, 3, 4, '...', totalPages);
                                                } else if (currentPage >= totalPages - 2) {
                                                    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                                } else {
                                                    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                                }
                                            }
                                            return pages.map((page, index) => {
                                                if (page === '...') return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                                const pageNum = page as number;
                                                const isActive = currentPage === pageNum;
                                                return (
                                                    <button
                                                        key={`page-${pageNum}`}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            });
                                        })()}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredTasks.length / itemsPerPage), prev + 1))}
                                            disabled={currentPage === Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage)) || filteredTasks.length === 0}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Project Tasks Filters Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-6 text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                                            <Filter className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Filter Projects</span>
                                    </div>

                                    <div className="relative font-inter flex-1 max-w-md">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Search className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search projects or task..."
                                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Status</span>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                        >
                                            <option value="All Status">All Status</option>
                                            <option value="Planned">Planned</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Ownership</span>
                                        <select
                                            value={ownershipFilter}
                                            onChange={(e) => setOwnershipFilter(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                                        >
                                            <option value="Entire View">Entire View</option>
                                            <option value="My Projects">My Projects</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Project List */}
                            <div className="p-6 bg-slate-50 flex-1 space-y-4">
                                {[{ id: projectId || 92, name: 'Current Project', tasksCount: filteredTasks.length, status: 'Planned' as ProjectStatus, tasks: filteredTasks }].map(project => {
                                    const isExpanded = expandedProjects.includes(project.id);
                                    return (
                                        <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div
                                                onClick={() => toggleProject(project.id)}
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        <Folder className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{project.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-500 text-[10px] font-bold">
                                                                <Calendar className="w-3 h-3" />
                                                                {project.tasksCount} Tasks
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${project.status === 'Planned' ? 'border-slate-200 text-slate-500' : 'border-emerald-200 text-emerald-500 bg-emerald-50'
                                                                }`}>
                                                                {project.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-slate-400">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-slate-200">
                                                    <div className="overflow-x-auto custom-scrollbar">
                                                        <table className="w-full text-left border-collapse min-w-[800px] block md:table">
                                                            <thead className="hidden md:table-header-group">
                                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Task Intelligence</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned To</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Deadline</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800">Priority</th>
                                                                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="block md:table-row-group">
                                                                {project.tasks.length > 0 ? (
                                                                    project.tasks.map((task) => (
                                                                        <tr key={task.id} className="block md:table-row border-b border-slate-100 hover:bg-slate-50/50 transition-colors p-4 md:p-0">
                                                                            <td className="p-4 block md:table-cell">
                                                                                <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                                                <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{task.description}</p>
                                                                                {task.audio_data ? (
                                                                                    <div className="mt-2 flex items-center gap-2 max-w-[160px] bg-slate-100/80 rounded-full p-1 pr-3 border border-slate-200/50">
                                                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer" onClick={(e) => {
                                                                                            const audio = e.currentTarget.parentElement?.querySelector('audio');
                                                                                            if (audio) { audio.paused ? audio.play() : audio.pause(); }
                                                                                        }}>
                                                                                            <Play className="w-3 h-3 ml-0.5" />
                                                                                        </div>
                                                                                        <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden flex items-center">
                                                                                            <div className="h-full bg-emerald-500 w-1/3"></div>
                                                                                        </div>
                                                                                        <audio src={task.audio_data} className="hidden" />
                                                                                        <span className="text-[10px] font-bold text-slate-400">0:00</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => setRecordingTaskId(task.id)}
                                                                                        className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-colors w-max"
                                                                                    >
                                                                                        <Mic className="w-3 h-3" /> Add Audio
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-4 block md:table-cell">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                                                                        <User className="w-3 h-3" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs font-bold text-slate-800">{task.assignedTo.name}</p>
                                                                                        <p className="text-[10px] text-slate-500">{task.assignedTo.role}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4 block md:table-cell">
                                                                                <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                                                    {new Date(task.end_date).toLocaleDateString()}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4 block md:table-cell">
                                                                                <div className="relative inline-block w-full min-w-[130px]">
                                                                                    <select
                                                                                        value={task.status}
                                                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                                                                                    >
                                                                                        <option value="Planned">Planned</option>
                                                                                        <option value="In Progress">In Progress</option>
                                                                                        <option value="Completed">Completed</option>
                                                                                        <option value="Cancelled">Cancelled</option>
                                                                                    </select>
                                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Cancelled' ? 'bg-rose-500' :
                                                                                            task.status === 'Completed' ? 'bg-emerald-500' :
                                                                                                task.status === 'In Progress' ? 'bg-blue-500' :
                                                                                                    'bg-slate-400'
                                                                                            }`}></div>
                                                                                    </div>
                                                                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                                                                                        <ChevronDown className="w-4 h-4" />
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4 block md:table-cell">
                                                                                <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority]}`}>
                                                                                    {task.priority}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-4 text-center block md:table-cell">
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <button onClick={() => openTaskModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View Details">
                                                                                        <Eye className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr className="block md:table-row">
                                                                        <td colSpan={6} className="p-12 text-center text-sm font-bold text-slate-800 bg-white block md:table-cell">
                                                                            No matching tasks found in this project.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </PageTransition>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-primary p-6 md:p-8 flex items-start justify-between relative overflow-hidden font-inter border-b border-primary/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                            <div className="relative z-10 flex items-center gap-4 md:gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary text-2xl font-bold border border-white/20">
                                        <FileText className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">{selectedTask.title}</h2>
                                    </div>
                                    <p className="text-primary-50 text-xs md:text-sm font-medium tracking-wide">Detailed view of task assignments and progress</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedTask(null)}
                                className="relative z-10 p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-white border-b border-slate-200 px-6 pt-4 gap-4 overflow-x-auto custom-scrollbar">
                            <button
                                onClick={() => setModalTab("Details")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Details' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setModalTab("Activity")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Activity' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Activity
                            </button>
                            <button
                                onClick={() => setModalTab("Comments")}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Comments' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Comments
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {modalTab === "Details" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Description</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.description || "No description provided."}</p>

                                        {selectedTask.audio_data && (
                                            <div className="mt-4 ml-8 flex items-center gap-3 max-w-sm bg-slate-50 rounded-full p-2 pr-4 border border-slate-200 shadow-sm">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:bg-emerald-600 transition-colors" onClick={(e) => {
                                                    const audio = e.currentTarget.parentElement?.querySelector('audio');
                                                    if (audio) { audio.paused ? audio.play() : audio.pause(); }
                                                }}>
                                                    <Play className="w-4 h-4 ml-0.5" />
                                                </div>
                                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex items-center">
                                                    <div className="h-full bg-emerald-500 w-1/3"></div>
                                                </div>
                                                <audio src={selectedTask.audio_data} className="hidden" />
                                                <span className="text-xs font-bold text-slate-400">0:00</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Assigned By</span>
                                        </div>
                                        <div className="pl-8">
                                            <p className="text-sm text-slate-600">{selectedTask.assignedBy.name}</p>
                                            <p className="text-xs text-slate-500">{selectedTask.assignedBy.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Assigned To</span>
                                        </div>
                                        <div className="pl-8">
                                            <p className="text-sm text-slate-600">{selectedTask.assignedTo.name}</p>
                                            <p className="text-xs text-slate-500">{selectedTask.assignedTo.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Priority</span>
                                        </div>
                                        <div className="pl-8">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityBadges[selectedTask.priority]}`}>
                                                {selectedTask.priority.charAt(0) + selectedTask.priority.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Deadline</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{new Date(selectedTask.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Start Date</span>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-8">{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : "Not available"}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-500">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">Status</span>
                                        </div>
                                        <div className="pl-8 flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${selectedTask.status === 'Cancelled' ? 'bg-rose-500' : selectedTask.status === 'Completed' ? 'bg-emerald-500' : selectedTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                            <p className="text-sm text-slate-600 font-medium">{selectedTask.status}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === "Comments" && (
                                <div className="flex flex-col h-full min-h-[400px]">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-purple-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800">Task Discussion</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Chat with team members about this task</p>
                                    </div>

                                    <div className="flex-1 bg-[#F4F1E9] rounded-xl border border-slate-200 flex flex-col p-4 mb-4 overflow-y-auto custom-scrollbar">
                                        {isFetchingDetails ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : taskComments.length === 0 ? (
                                            <div className="flex-1 flex flex-col justify-center items-center">
                                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-500">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">No comments yet</h3>
                                                <p className="text-sm text-slate-500">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {taskComments.map((c: any, i) => {
                                                    const messageContent = c.content || c.comment || c.text || "";

                                                    // Basic parsing to extract the attachment if we added it via text
                                                    const attachmentMatch = messageContent.match(/\[Attached:\s*(.*?)\]/);
                                                    const attachmentName = attachmentMatch ? attachmentMatch[1] : null;
                                                    const cleanText = messageContent.replace(/\[Attached:\s*(.*?)\]/g, '').trim();

                                                    const member = projectMembers.find(m => m.user_id === c.author_user_id);
                                                    const authorName = c.author_name || member?.full_name || "User";

                                                    return (
                                                        <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 w-max max-w-[80%]">
                                                            <p className="text-xs font-bold text-slate-700 mb-1">{authorName}</p>

                                                            {cleanText && (
                                                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{cleanText}</p>
                                                            )}

                                                            {attachmentName && (
                                                                <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                                                                        <Paperclip className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-xs font-bold text-slate-700 truncate">{attachmentName}</p>
                                                                        <p className="text-[10px] text-slate-400">Attached File</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <p className="text-[10px] text-slate-400 mt-2">
                                                                {c.created_at ? new Date(c.created_at).toLocaleString() : "Just now"}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <form onSubmit={handleAddComment} className="flex flex-col gap-2 relative">
                                        {commentAttachment && (
                                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg w-max mb-1">
                                                <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-xs font-bold text-indigo-700">{commentAttachment.name}</span>
                                                <button type="button" onClick={() => setCommentAttachment(null)} className="ml-2 text-indigo-400 hover:text-indigo-600">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                                                title="Attach a file"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        setCommentAttachment(e.target.files[0]);
                                                    }
                                                    e.target.value = ''; // Reset input
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="flex-1 bg-white border border-slate-300 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newComment.trim() && !commentAttachment}
                                                className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                                            >
                                                <Send className="w-4 h-4 ml-0.5" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {modalTab === "Activity" && (
                                <div className="flex flex-col h-full min-h-[300px]">
                                    {isFetchingDetails ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : taskActivity.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center flex-1">
                                            <div className="text-slate-400 mb-2">
                                                <Clock className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">No activity yet</h3>
                                            <p className="text-sm text-slate-500">History and audit logs will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {taskActivity.map((activity: any, i) => (
                                                <div key={i} className="flex gap-4 items-start relative before:absolute before:left-[19px] before:top-10 before:bottom-[-20px] before:w-0.5 before:bg-slate-200 last:before:hidden">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-500 z-10">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 shadow-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-sm font-bold text-slate-800">{activity.action || "Progress Updated"}</h4>
                                                            <span className="text-[10px] font-bold text-slate-400">{new Date(activity.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">{activity.description || activity.remarks || `Progress moved to ${activity.percentage ?? activity.progress_percentage ?? 0}%`}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Task"
                maxWidth="max-w-3xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            form="edit-task-form"
                            type="submit"
                            className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95"
                        >
                            Update Task
                        </button>
                    </>
                }
            >
                <form id="edit-task-form" onSubmit={handleEditFormSubmit} className="space-y-6 font-inter">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
                            Basic Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    defaultValue={selectedEditTask?.title}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    defaultValue={selectedEditTask?.description}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Assign To
                                    </label>
                                    <select
                                        name="assigned_user_id"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value={selectedEditTask?.assigned_user_id || 1}>{selectedEditTask?.assignedTo?.name || "Select User"}</option>
                                        <option value="1">Suresh Chaudhari</option>
                                        <option value="2">Vishal Sathe</option>
                                        <option value="3">Amit Khare</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        defaultValue={selectedEditTask?.priority}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Project <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="project_id"
                                        defaultValue={selectedEditTask?.project_id || projectId || 1}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        {(() => {
                                            const userStr = localStorage.getItem("infrapilot_user");
                                            const projects = userStr ? (JSON.parse(userStr).assigned_projects || []) : [];
                                            return projects.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={selectedEditTask?.status}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        defaultValue={selectedEditTask?.start_date ? new Date(selectedEditTask.start_date).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Deadline
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        defaultValue={selectedEditTask?.end_date ? new Date(selectedEditTask.end_date).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Create Task Drawer */}
            <CreateTaskDrawer
                isOpen={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                projectId={projectId}
                onSuccess={() => {
                    fetchData();
                    setIsCreateDrawerOpen(false);
                }}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDeleteTask}
                title="Discard Task Entry"
                message="Are you sure you want to delete this task record? This action will permanently remove the entry and all its progress history."
                confirmText="Archive Record"
                type="danger"
                isLoading={isSubmitting}
            />

            <AudioRecordModal
                isOpen={recordingTaskId !== null}
                onClose={() => setRecordingTaskId(null)}
                onSave={handleSaveAudio}
            />

            {/* Update Progress Modal */}
            <Modal
                isOpen={isProgressModalOpen}
                onClose={() => setIsProgressModalOpen(false)}
                title="Update Progress"
                maxWidth="max-w-md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsProgressModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateProgress}
                            disabled={!progressRemark.trim()}
                            className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                            Save Progress
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">
                            Completion Percentage: {progressPercentage}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progressPercentage}
                            onChange={(e) => setProgressPercentage(Number(e.target.value))}
                            className="w-full h-3.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md"
                            style={{
                                background: `linear-gradient(to right, #2563eb ${progressPercentage}%, #e2e8f0 ${progressPercentage}%)`
                            }}
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Remarks</label>
                        <textarea
                            value={progressRemark}
                            onChange={(e) => setProgressRemark(e.target.value)}
                            placeholder="e.g. 10 percent remaining"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Pass Task Modal */}
            <Modal
                isOpen={isPassModalOpen}
                onClose={() => setIsPassModalOpen(false)}
                title="Pass Task"
                maxWidth="max-w-md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsPassModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePassTask}
                            disabled={!passNewUserId || !passRemark.trim()}
                            className="px-6 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
                        >
                            Pass Task
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Select New User <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <select
                                value={passNewUserId}
                                onChange={(e) => setPassNewUserId(Number(e.target.value))}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                required
                            >
                                <option value="">-- Select Team Member --</option>
                                {projectMembers.map(m => (
                                    <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role})</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Reason / Remarks</label>
                        <textarea
                            value={passRemark}
                            onChange={(e) => setPassRemark(e.target.value)}
                            placeholder="e.g. passed to user 2 due to shift end"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-amber-500/20 focus:border-amber-500 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none"
                            required
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TaskManagementPage;
