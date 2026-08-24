import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../../../components/common/Navbar';
import { useProject } from '../../../context/ProjectContext';
import PageTransition from '../../../components/common/PageTransition';
import toast from 'react-hot-toast';
import {
    Filter, Search, Plus, Eye, Calendar, User,
    CheckCircle, Clock, XCircle, List, Grid,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Folder,
    Paperclip, Send, X, FileText, Edit2, Trash2, Play, Pause, Mic, TrendingUp, Forward, Square, AlertCircle, Loader2
} from 'lucide-react';
import ConfirmModal from "../../../components/common/ConfirmModal";
// import ConfirmModal from "../../../components/common/ConfirmModal";
import CreateTaskDrawer from './CreateTaskDrawer';
import AudioRecordModal from './AudioRecordModal';
import TaskRequestModal from '../../../components/projects/TaskRequestModal';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import { boqService } from '../../../services/boqService';
import { workProgressService } from '../../../services/workProgressService';
import type { Task, ProjectMember } from '../../../types/project';

interface FrontendTask extends Omit<Task, 'priority'> {
    priority: "LOW" | "MEDIUM" | "HIGH";
    assignedBy: { name: string; role: string };
    assignedTo: { name: string; role: string };
    hasHistory: boolean;
    projectName?: string;
    audio_data?: string;
    milestoneName?: string;
    boqName?: string;
    creatorName?: string;
    assignedNames?: string[];
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

const getFullUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace(/\/+$/, '') : 'http://127.0.0.1:8000';
    return `${baseUrl}/${path.replace(/^\/+/, '')}`;
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
    const { } = useProject();
    const [projectId, setProjectId] = useState<number | 'all' | null>('all');
    const [tasks, setTasks] = useState<FrontendTask[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Delete Modal State (Commented out as delete button is hidden)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    // const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [departmentFilter, setDepartmentFilter] = useState("All Departments");
    const [ownershipFilter, setOwnershipFilter] = useState("Entire View");

    const [activeTab, setActiveTab] = useState("All Tasks");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    // Project Accordion State
    const [expandedProjects, setExpandedProjects] = useState<number[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
    const [projectTasksMap, setProjectTasksMap] = useState<Record<number, FrontendTask[]>>({});
    const [projectLoadingMap, setProjectLoadingMap] = useState<Record<number, boolean>>({});

    const [projectMilestones, setProjectMilestones] = useState<any[]>([]);
    const [projectBoqs, setProjectBoqs] = useState<any[]>([]);
    const [projectActivities, setProjectActivities] = useState<any[]>([]);

    // Modal State
    const [selectedTask, setSelectedTask] = useState<FrontendTask | null>(null);
    const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");

    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    // Generate BOQ to Task Modal State
    const [isGenerateBoqModalOpen, setIsGenerateBoqModalOpen] = useState(false);
    const [generateBoqId, setGenerateBoqId] = useState<number | "">("");
    const [generateMilestoneId, setGenerateMilestoneId] = useState<number | "">("");
    const [isGeneratingBoq, setIsGeneratingBoq] = useState(false);

    const handleGenerateBoqToTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!generateBoqId) return;
        setIsGeneratingBoq(true);
        try {
            await boqService.generateTasksFromBoq(Number(generateBoqId), generateMilestoneId ? Number(generateMilestoneId) : undefined);
            toast.success("Tasks generated successfully from BOQ");
            setIsGenerateBoqModalOpen(false);
            setGenerateBoqId("");
            setGenerateMilestoneId("");
            fetchData();
        } catch (err) {
            toast.error("Failed to generate tasks from BOQ");
        } finally {
            setIsGeneratingBoq(false);
        }
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditTask, setSelectedEditTask] = useState<FrontendTask | null>(null);
    const [editModalActivities, setEditModalActivities] = useState<any[]>([]);

    // Audio recording for existing task
    const [recordingTaskId, setRecordingTaskId] = useState<number | null>(null);

    // Audio Recording State for Edit Modal
    const [editIsRecording, setEditIsRecording] = useState(false);
    const [editAudioBlob, setEditAudioBlob] = useState<Blob | null>(null);
    const [editRecordingTime, setEditRecordingTime] = useState(0);
    const [editIsPlaying, setEditIsPlaying] = useState(false);
    const editMediaRecorderRef = useRef<MediaRecorder | null>(null);
    const editAudioChunksRef = useRef<Blob[]>([]);
    const editTimerRef = useRef<any>(null);
    const editAudioRef = useRef<HTMLAudioElement | null>(null);

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

    // Image Viewer Modal State
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [viewImageSrc, setViewImageSrc] = useState<string | null>(null);

    // Pass Task Modal State
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [selectedPassTask, setSelectedPassTask] = useState<FrontendTask | null>(null);
    const [passNewUserId, setPassNewUserId] = useState<number | "">("");
    const [passRemark, setPassRemark] = useState("");
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    // Task Request Modal State
    const [isTaskRequestModalOpen, setIsTaskRequestModalOpen] = useState(false);
    const [taskRequests, setTaskRequests] = useState<any[]>([]);
    const [selectedTaskRequest, setSelectedTaskRequest] = useState<any | null>(null);
    const [isLoadingTaskRequests, setIsLoadingTaskRequests] = useState(false);

    useEffect(() => {
        if (projectId && projectId !== ('all' as any)) {
            projectService.getProjectMembers(projectId as any).then(res => {
                setProjectMembers(Array.isArray(res) ? res : (res.items || res.data || []));
            }).catch(() => { });
        }
    }, [projectId]);

    useEffect(() => {
        if (!selectedTask || !projectId) return;
        const fetchDetails = async () => {
            setIsFetchingDetails(true);
            try {
                const pid = selectedTask.project_id || (projectId === ('all' as any) ? 0 : projectId);

                // Dynamically fetch project members for the task's project if currently unresolvable
                if (pid && (projectId === ('all' as any) || projectMembers.length === 0)) {
                    try {
                        const resM = await projectService.getProjectMembers(pid as number);
                        const m = Array.isArray(resM) ? resM : (resM.items || resM.data || []);
                        if (m.length > 0) setProjectMembers(m);
                    } catch (e) { }
                }

                if (modalTab === "Comments") {
                    const res = await projectService.getTaskComments(pid as number, selectedTask.id);
                    setTaskComments(Array.isArray(res) ? res : (res.items || res.data || []));
                } else if (modalTab === "Activity") {
                    const res = await projectService.getTaskProgressHistory(pid as number, selectedTask.id);
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

    // Fetch Task Requests when Project Tasks tab is active
    useEffect(() => {
        if (activeTab === "Project Tasks" && projectId && projectId !== ('all' as any)) {
            fetchTaskRequests();
        }
    }, [activeTab, projectId]);

    const fetchTaskRequests = async () => {
        if (!projectId || projectId === ('all' as any)) return;
        setIsLoadingTaskRequests(true);
        try {
            const requests = await projectService.getTaskRequests(projectId as any);
            setTaskRequests(Array.isArray(requests) ? requests : (requests?.items || requests?.data || []));
        } catch (error) {
            console.error("Failed to fetch task requests:", error);
            setTaskRequests([]);
        } finally {
            setIsLoadingTaskRequests(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && !commentAttachment) || !selectedTask || !projectId) return;

        let finalContent = newComment;
        if (commentAttachment) {
            finalContent += finalContent.trim() ? `\n\n[Attached: ${commentAttachment.name}]` : `[Attached: ${commentAttachment.name}]`;
        }

        try {
            const pid = selectedTask.project_id || (projectId === ('all' as any) ? 0 : projectId);
            await projectService.createTaskComment(pid as number, selectedTask.id, { content: finalContent });
            setNewComment("");
            setCommentAttachment(null);
            const res = await projectService.getTaskComments(pid as number, selectedTask.id);
            setTaskComments(Array.isArray(res) ? res : (res.items || res.data || []));
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const fetchData = useCallback(async () => {
        if (!projectId && projectId !== ('all' as any)) return;
        setLoading(true);
        try {
            let fetchedTasks: any = { items: [] };
            let fetchedMembers: any = { items: [] };
            let fetchedMilestones: any = [];
            let fetchedBoqs: any = [];
            let fetchedActivities: any = [];
            let fetchedProjects: any = [];

            if (projectId === ('all' as any)) {
                const projectIdsToFetch = assignedProjects.map(p => p.id || p.project_id);
                if (projectIdsToFetch.length > 0) {
                    const taskPromises = projectIdsToFetch.map(id => projectService.getTasks(id));
                    const allResponses = await Promise.all(taskPromises);

                    let allItems: any[] = [];
                    allResponses.forEach(res => {
                        const items = Array.isArray(res) ? res : (res.items || res.data || []);
                        allItems = [...allItems, ...items];
                    });
                    fetchedTasks = { items: allItems };
                }
            } else {
                const results = await Promise.all([
                    projectService.getTasks(projectId as any),
                    projectService.getProjectMembers(projectId as any),
                    projectService.getMilestones(projectId as any).catch(() => []),
                    boqService.getBoqItems(projectId as any).catch(() => []),
                    workProgressService.listActivities(projectId as any).catch(() => []),
                    projectService.getProjects(100, 0).catch(() => [])
                ]);
                fetchedTasks = results[0];
                fetchedMembers = results[1];
                fetchedMilestones = results[2];
                fetchedBoqs = results[3];
                fetchedActivities = results[4];
                fetchedProjects = results[5];
            }

            const membersList: ProjectMember[] = Array.isArray(fetchedMembers) ? fetchedMembers : (fetchedMembers.items || fetchedMembers.data || []);
            const milestonesList = Array.isArray(fetchedMilestones) ? fetchedMilestones : ((fetchedMilestones as any).items || (fetchedMilestones as any).data || []);
            const boqsList = Array.isArray(fetchedBoqs) ? fetchedBoqs : ((fetchedBoqs as any).items || (fetchedBoqs as any).data || []);
            const activitiesList = Array.isArray(fetchedActivities) ? fetchedActivities : ((fetchedActivities as any).items || (fetchedActivities as any).data || []);
            const projectsList = fetchedProjects ? (Array.isArray(fetchedProjects) ? fetchedProjects : (fetchedProjects.items || fetchedProjects.data || [])) : [];

            setProjectMilestones(milestonesList);
            setProjectBoqs(boqsList);
            setProjectActivities(activitiesList);

            const userStr = localStorage.getItem("infrapilot_user");
            let pName = "Unknown Project";
            if (userStr) {
                const user = JSON.parse(userStr);
                const assignedProjects = user?.assigned_projects || user?.user?.assigned_projects || [];
                const matched = projectsList.find((p: any) => (p.id || p.project_id) === projectId) ||
                    assignedProjects.find((p: any) => (p.id || p.project_id) === projectId);
                if (matched) pName = matched.project_name || matched.name;
            }

            const mappedTasks: FrontendTask[] = (Array.isArray(fetchedTasks) ? fetchedTasks : (fetchedTasks.items || fetchedTasks.data || [])).map((t: Task & { audio_data?: string }) => {
                const rawAssignedId = (t as any).assigned_user || t.assigned_user_id;
                const actualAssignedId = (typeof rawAssignedId === 'object' && rawAssignedId !== null)
                    ? (rawAssignedId.user_id || rawAssignedId.id)
                    : rawAssignedId;
                const assignee = membersList.find(m => m.user_id === actualAssignedId);
                const assigner = { name: "System / Admin", role: "Manager" };

                // Map the exact project name
                let taskProjectName = pName;
                if (t.project_id) {
                    const matched = projectsList.find((p: any) => (p.id || p.project_id) === t.project_id) ||
                        assignedProjects.find((p: any) => (p.id || p.project_id) === t.project_id);
                    if (matched) taskProjectName = matched.project_name || matched.name;
                    else taskProjectName = "Project " + t.project_id;
                }

                let actualCreatedId = undefined;
                if ((t as any).created_by) {
                    actualCreatedId = (typeof (t as any).created_by === 'object' && (t as any).created_by !== null)
                        ? (((t as any).created_by as any).user_id || ((t as any).created_by as any).id)
                        : (t as any).created_by;
                }
                const creator = actualCreatedId ? membersList.find(m => m.user_id === actualCreatedId) : undefined;
                if (creator) {
                    assigner.name = creator.full_name || (creator as any).name;
                    assigner.role = creator.role || "Manager";
                } else if (typeof (t as any).created_by === 'object' && (t as any).created_by !== null) {
                    assigner.name = ((t as any).created_by as any).full_name || ((t as any).created_by as any).name || "Unknown";
                    assigner.role = ((t as any).created_by as any).role || "Manager";
                }

                const creatorName = assigner.name;

                const assignedNames = Array.isArray((t as any).assigned_users)
                    ? (t as any).assigned_users.map((item: any) => {
                        // Handle both numeric IDs and user objects
                        const userId = typeof item === 'number' ? item : (typeof item === 'object' && item !== null ? (item.user_id || item.id) : item);
                        const userName = typeof item === 'object' && item !== null ? (item.full_name || item.name) : null;

                        if (userName) return userName;
                        const m = membersList.find(member => member.user_id === userId);
                        return m ? m.full_name : (userId || "Unknown");
                    }).filter((name: string) => name && name !== "Unknown" && name !== "[object Object]")
                    : [];

                const milestone = milestonesList.find((m: any) => m.id === (t as any).milestone_id);
                const milestoneName = milestone ? milestone.name : "None";

                const boq = boqsList.find((b: any) => b.id === (t as any).boq_id);
                const boqName = boq ? boq.name : "None";

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
                    audio_data: getFullUrl(t.audio_data || (t as any).audio_instruction_url || (t as any).audio_url),
                    instruction_image_url: getFullUrl((t as any).instruction_image_url || (t as any).image_url),
                    milestoneName,
                    boqName,
                    creatorName,
                    assignedNames
                };
            });
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch task data:", error);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, [projectId, assignedProjects]);

    // Intentionally removed synchronization with selectedProjectId so 'all' is preserved by default

    useEffect(() => {
        const fetchUserAssignedProjects = async () => {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (!userStr) {
                    console.warn("No user data in localStorage");
                    return;
                }

                const user = JSON.parse(userStr);
                const userId = user.id || user.user_id;

                if (!userId) {
                    console.warn("No user ID found");
                    return;
                }

                console.log(`Fetching assigned projects for user ${userId}`);
                const projects = await projectService.getAssignedProjects(userId);
                console.log("Assigned projects fetched:", projects);
                setAssignedProjects(Array.isArray(projects) ? projects : ((projects as any)?.items || (projects as any)?.data || []));
            } catch (error) {
                console.error("Failed to fetch assigned projects:", error);
                setAssignedProjects([]);
            }
        };

        fetchUserAssignedProjects();
    }, []);

    useEffect(() => {
        if (!projectId && projectId !== ('all' as any) && assignedProjects.length > 0) {
            setProjectId('all');
        }
    }, [projectId, assignedProjects]);

    useEffect(() => {
        if (projectId || projectId === ('all' as any)) {
            fetchData();
        } else {
            setLoading(false);
            setTasks([]);
        }
    }, [projectId, activeTab, fetchData]);

    const startEditRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            editMediaRecorderRef.current = mediaRecorder;
            editAudioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    editAudioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(editAudioChunksRef.current, { type: 'audio/webm' });
                setEditAudioBlob(audioBlob);
            };

            mediaRecorder.start();
            setEditIsRecording(true);
            setEditRecordingTime(0);
            editTimerRef.current = setInterval(() => {
                setEditRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Microphone access denied or not available");
        }
    };

    const stopEditRecording = () => {
        if (editMediaRecorderRef.current && editIsRecording) {
            editMediaRecorderRef.current.stop();
            editMediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setEditIsRecording(false);
            clearInterval(editTimerRef.current);
        }
    };

    const deleteEditRecording = () => {
        setEditAudioBlob(null);
        setEditRecordingTime(0);
        if (editAudioRef.current) {
            editAudioRef.current.pause();
            editAudioRef.current.src = "";
        }
    };

    const toggleEditPlay = () => {
        if (!editAudioRef.current) return;

        if (editIsPlaying) {
            editAudioRef.current.pause();
            setEditIsPlaying(false);
        } else {
            if (!editAudioRef.current.src && editAudioBlob) {
                editAudioRef.current.src = URL.createObjectURL(editAudioBlob);
                editAudioRef.current.onended = () => setEditIsPlaying(false);
            }
            editAudioRef.current.play().catch(() => { });
            setEditIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const openEditModal = async (task: FrontendTask) => {
        setSelectedEditTask(task);
        setEditAudioBlob(null);
        setIsEditModalOpen(true);

        const targetProjId = task.project_id || (projectId === ('all' as any) ? null : projectId);
        if (targetProjId) {
            try {
                const activities = await workProgressService.listActivities(targetProjId);
                setEditModalActivities(Array.isArray(activities) ? activities : activities.items || activities.data || []);
            } catch (err) {
                console.error(err);
                setEditModalActivities([]);
            }
        } else {
            setEditModalActivities([]);
        }
    };

    const handleEditFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedEditTask) return;

        const formElement = e.currentTarget;
        const formData = new FormData(formElement);

        const targetProjectId = Number(formData.get('project_id')) || (projectId === ('all' as any) ? 0 : projectId) || 0;
        const assignedUserIds = formData.get('assigned_user_ids') as string;
        const assignedUserIdNum = assignedUserIds && assignedUserIds !== "" && assignedUserIds !== "None" ? Number(assignedUserIds.toString().split(',')[0]) : null;

        const instructionImage = formData.get('instruction_image') as File;

        let payload: any;
        payload = new FormData();
        const titleStr = (formData.get('title') as string) || selectedEditTask.title || 'Updated Task';
        payload.append('title', titleStr);
        payload.append('activity_name', titleStr);

        const descStr = formData.get('description') as string;
        if (descStr) payload.append('description', descStr);

        const priorityRaw = formData.get('priority') as string;
        const PMAP: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, Critical: 1, High: 2, Medium: 3, Low: 4 };
        const priorityNum = parseInt(priorityRaw);
        const safePriority = !isNaN(priorityNum) ? priorityNum : (PMAP[priorityRaw] ?? 4);
        payload.append('priority', String(safePriority));

        const startDateStr = formData.get('start_date') as string;
        if (startDateStr) payload.append('start_date', startDateStr);

        const endDateStr = formData.get('end_date') as string;
        if (endDateStr) payload.append('end_date', endDateStr);

        const statusStr = formData.get('status') as string;
        if (statusStr) payload.append('status', statusStr);

        if (assignedUserIds) payload.append('assigned_user_ids', assignedUserIds.toString());
        if (assignedUserIdNum) {
            payload.append('assigned_user_id', String(assignedUserIdNum));
            payload.append('engineer_id', String(assignedUserIdNum));
            payload.append('assigned_to', String(assignedUserIdNum));
            payload.append('user_id', String(assignedUserIdNum));
            payload.append('lead_id', String(assignedUserIdNum));
            payload.append('assigned_to_id', String(assignedUserIdNum));
        }

        const activityTypeId = formData.get('activity_type_id');
        if (activityTypeId) payload.append('activity_type_id', String(activityTypeId));

        const milestoneId = formData.get('milestone_id');
        if (milestoneId) payload.append('milestone_id', String(milestoneId));

        const boqId = formData.get('boq_id');
        if (boqId) payload.append('boq_id', String(boqId));

        if (formData.get('remove_audio') === 'true') {
            payload.append('remove_audio', 'true');
        }
        if (formData.get('remove_image') === 'true') {
            payload.append('remove_image', 'true');
        }

        if (editAudioBlob) {
            const audioFile = new File([editAudioBlob], 'audio_instruction.webm', { type: 'audio/webm' });
            payload.append('audio_file', audioFile);
        } else {
            const audioUploadFile = formData.get('audio_upload') as File;
            if (audioUploadFile && audioUploadFile.size > 0) {
                payload.append('audio_file', audioUploadFile);
            }
        }

        if (instructionImage && instructionImage.size > 0) {
            payload.append('instruction_image', instructionImage);
        }

        try {
            await projectService.updateTask(targetProjectId as number, selectedEditTask.id, payload);

            toast.success("Task updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };



    const toggleProject = (id: number) => {
        const willExpand = !expandedProjects.includes(id);
        setExpandedProjects(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
        if (willExpand) {
            // load tasks for project if not already loaded
            if (!projectTasksMap[id]) {
                fetchProjectTasks(id).catch(err => console.error('Failed to load project tasks', err));
            }
        }
    };

    const fetchProjectTasks = async (projId: number) => {
        try {
            setProjectLoadingMap(prev => ({ ...prev, [projId]: true }));
            const [fetchedTasks, fetchedMembers] = await Promise.all([
                projectService.getTasks(projId).catch(() => []),
                projectService.getProjectMembers(projId).catch(() => [])
            ]);

            const membersList: any[] = Array.isArray(fetchedMembers) ? fetchedMembers : (fetchedMembers?.items || fetchedMembers?.data || []);
            const rawTasks = Array.isArray(fetchedTasks) ? fetchedTasks : (fetchedTasks.items || fetchedTasks.data || []);
            // Enforce frontend filtering to guarantee only tasks belonging to the currently selected project are mapped and displayed (unless 'all' is selected)
            const safeTasks = rawTasks.filter((t: any) => projectId === ('all' as any) || !t.project_id || String(t.project_id) === String(projectId));

            const mapped = safeTasks.map((t: any) => {
                const rawAssignedId = (t as any).assigned_user || t.assigned_user_id;
                const actualAssignedId = (typeof rawAssignedId === 'object' && rawAssignedId !== null)
                    ? (rawAssignedId.user_id || rawAssignedId.id)
                    : rawAssignedId;
                const assignee = membersList.find(m => m.user_id === actualAssignedId);
                const assigner = { name: "System / Admin", role: "Manager" };

                let actualCreatedId = undefined;
                if ((t as any).created_by) {
                    actualCreatedId = (typeof (t as any).created_by === 'object' && (t as any).created_by !== null)
                        ? (((t as any).created_by as any).user_id || ((t as any).created_by as any).id)
                        : (t as any).created_by;
                }
                const creator = actualCreatedId ? membersList.find((m: any) => m.user_id === actualCreatedId) : undefined;
                if (creator) {
                    assigner.name = creator.full_name;
                    assigner.role = creator.role || "Manager";
                } else if (typeof (t as any).created_by === 'object' && (t as any).created_by !== null) {
                    assigner.name = ((t as any).created_by as any).full_name || ((t as any).created_by as any).name || "Unknown";
                    assigner.role = ((t as any).created_by as any).role || "Manager";
                }

                const assignedNames = Array.isArray((t as any).assigned_users)
                    ? (t as any).assigned_users.map((item: any) => {
                        const userId = typeof item === 'number' ? item : (typeof item === 'object' && item !== null ? (item.user_id || item.id) : item);
                        const userName = typeof item === 'object' && item !== null ? (item.full_name || item.name) : null;
                        if (userName) return userName;
                        const m = membersList.find(member => member.user_id === userId);
                        return m ? m.full_name : (userId || "Unknown");
                    }).filter((name: string) => name && name !== "Unknown" && name !== "[object Object]")
                    : [];

                return {
                    ...t,
                    priority: mapPriority(t.priority),
                    assignedBy: assigner,
                    assignedTo: {
                        name: assignee?.full_name || "Unassigned",
                        role: assignee?.role || "Engineer"
                    },
                    hasHistory: false,
                    projectName: (t as any).project_name || (`Project ${t.project_id || projId}`),
                    audio_data: getFullUrl(t.audio_data || (t as any).audio_instruction_url || (t as any).audio_url),
                    instruction_image_url: getFullUrl((t as any).instruction_image_url || (t as any).image_url),
                    milestoneName: undefined,
                    boqName: undefined,
                    creatorName: assigner.name,
                    assignedNames
                } as FrontendTask;
            });

            setProjectTasksMap(prev => ({ ...prev, [projId]: mapped }));
        } catch (error) {
            console.error('Error fetching project tasks for', projId, error);
            setProjectTasksMap(prev => ({ ...prev, [projId]: [] }));
        } finally {
            setProjectLoadingMap(prev => ({ ...prev, [projId]: false }));
        }
    };

    // handleApproveTaskRequest removed as it is unused and invalidates projectService

    const openTaskModal = async (task: FrontendTask) => {
        if (!projectId && projectId !== ('all' as any)) return;
        try {
            const pid = task.project_id || (projectId === ('all' as any) ? 0 : projectId);
            const fetchedTask = await projectService.getTask(pid as number, task.id || (task as any).task_id);
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
        if ((!projectId && projectId !== ('all' as any)) || !deleteId) return;
        try {
            const taskObj = tasks.find(t => t.id === deleteId);
            const pid = taskObj?.project_id || (projectId === ('all' as any) ? 0 : projectId);
            const res = await projectService.deleteTask(pid as number, deleteId);
            toast.success(res?.message || "Task deleted successfully");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete task");
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!projectId && projectId !== ('all' as any)) return;

        const taskObj = tasks.find(t => t.id === taskId);
        const pid = taskObj?.project_id || (projectId === ('all' as any) ? 0 : projectId);
        if (!pid) return;

        // Optimistic UI Update for instant feedback
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

        try {
            await projectService.updateTaskStatus(pid as number, taskId, newStatus);
            toast.success(`Task status updated to ${newStatus}`);
            fetchData();
        } catch (error) {
            setTasks(previousTasks);
            toast.error("Failed to update status on server");
        }
    };

    const handleUpdateProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgressTask || (!projectId && projectId !== ('all' as any))) return;

        const pid = selectedProgressTask.project_id || (projectId === ('all' as any) ? 0 : projectId);

        try {
            await projectService.updateTaskProgress(pid as number, selectedProgressTask.id, {
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
        if (!selectedPassTask || (!projectId && projectId !== ('all' as any)) || !passNewUserId) return;

        const pid = selectedPassTask.project_id || (projectId === ('all' as any) ? 0 : projectId);

        try {
            await projectService.passTask(pid as number, selectedPassTask.id, {
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

    // Task Request Handlers
    const handleSaveTaskRequest = async (formData: any) => {
        if (!projectId && projectId !== ('all' as any)) return;

        try {
            if (selectedTaskRequest) {
                // Update existing task request
                await projectService.updateTaskRequest(projectId as any, selectedTaskRequest.id, formData);
                toast.success("Task request updated successfully!");
            } else {
                // Create new task request
                await projectService.createTaskRequest(projectId as any, formData);
                toast.success("Task request created successfully!");
            }
            setSelectedTaskRequest(null);
            fetchTaskRequests();
        } catch (error) {
            toast.error("Failed to save task request.");
            console.error("Error:", error);
        }
    };

    const handleDeleteTaskRequest = async (requestId: number) => {
        if (!projectId && projectId !== ('all' as any)) return;

        if (confirm("Are you sure you want to delete this task request?")) {
            try {
                await projectService.deleteTaskRequest(projectId as any, requestId);
                toast.success("Task request deleted successfully!");
                fetchTaskRequests();
            } catch (error) {
                toast.error("Failed to delete task request.");
                console.error("Error:", error);
            }
        }
    };

    const handleEditTaskRequest = (request: any) => {
        setSelectedTaskRequest(request);
        setIsTaskRequestModalOpen(true);
    };

    const handleNewTaskRequest = () => {
        setSelectedTaskRequest(null);
        setIsTaskRequestModalOpen(true);
    };

    const handleCloseTaskRequestModal = () => {
        setIsTaskRequestModalOpen(false);
        setSelectedTaskRequest(null);
    };

    const handleSaveAudio = async (audioBase64: string) => {
        if (!projectId || !recordingTaskId) return;

        try {
            const task = tasks.find(t => t.id === recordingTaskId);
            if (!task) return;

            const pid = task.project_id || (projectId === ('all' as any) ? 0 : projectId);

            // Convert base64 audio to Blob for FormData upload
            const base64Data = audioBase64.split(',')[1] || audioBase64;
            const byteChars = atob(base64Data);
            const byteArr = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteArr[i] = byteChars.charCodeAt(i);
            }
            const audioBlob = new Blob([byteArr], { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'audio_instruction.webm', { type: 'audio/webm' });

            // Build FormData with all required task fields
            const fd = new FormData();
            fd.append('title', task.title || '');
            fd.append('description', task.description || '');
            fd.append('priority', String(task.priority ?? 1));
            fd.append('status', task.status || 'todo');
            if (task.start_date) fd.append('start_date', task.start_date);
            if (task.end_date) fd.append('end_date', task.end_date);
            if (task.assigned_user_id) fd.append('assigned_user_ids', String(task.assigned_user_id));
            fd.append('project_id', String(pid));
            // Append audio as file — backend field name: audio_instruction
            fd.append('audio_instruction', audioFile);

            await projectService.updateTask(pid as number, recordingTaskId, fd);
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
            <Navbar title="Task Management" breadcrumb={["Manager", "Task Management"]} />

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
                    <div className="flex flex-wrap items-center gap-2">
                        {activeTab !== "Project Tasks" && (
                            <>
                                <button
                                    onClick={() => setIsGenerateBoqModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    Generate BOQ to Task
                                </button>
                                <button
                                    onClick={() => setIsCreateDrawerOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Task
                                </button>
                            </>
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
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusFilter === "Planned" ? 'text-slate-600' : 'text-slate-400'}`}>Planned</p>
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col relative min-h-[400px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-slate-600 font-bold animate-pulse">Syncing Task Registry...</p>
                        </div>
                    )}

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
                                        <span className="text-[10px] font-black text-slate-800 mb-1">Project</span>
                                        <select
                                            value={projectId || ""}
                                            onChange={(e) => setProjectId(e.target.value === "all" ? "all" : e.target.value ? Number(e.target.value) : null)}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter w-[200px] truncate"
                                        >
                                            <option value="all">All Projects</option>
                                            {assignedProjects.map((p: any) => (
                                                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                                    {p.project_name || p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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

                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                                                        <Folder className="w-3 h-3 text-indigo-500" />
                                                        <span>{task.projectName}</span>
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
                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Task">
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

                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Project</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Title</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Priority</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Status</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Start / End Date</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Actual Start / End</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Created By</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Assigned Users</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Completion %</th>

                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Delay Days</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Actual Cost</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Planned Cost</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Audio Instruction</th>
                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800">Instruction Image</th>

                                                    <th className="p-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-800 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="block md:table-row-group">
                                                {paginatedTasks.map((task) => (
                                                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors block md:table-row">

                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{task.projectName || 'null'}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-800 block md:table-cell">{task.title}</td>
                                                        <td className="p-4 text-center block md:table-cell">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority] || 'bg-slate-500 text-white'}`}>
                                                                {task.priority || 'LOW'}
                                                            </span>
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
                                                        <td className="p-4 whitespace-nowrap block md:table-cell">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] text-slate-500">Start: <span className="text-xs font-bold text-slate-800">{task.start_date || 'NA'}</span></span>
                                                                <span className="text-[10px] text-slate-500">End: <span className="text-xs font-bold text-slate-800">{task.end_date || 'NA'}</span></span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap block md:table-cell">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] text-slate-500">Start: <span className="text-xs font-bold text-slate-800">{(task as any).actual_start_date || 'NA'}</span></span>
                                                                <span className="text-[10px] text-slate-500">End: <span className="text-xs font-bold text-slate-800">{(task as any).actual_end_date || 'NA'}</span></span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{task.creatorName && task.creatorName !== '[object Object]' ? task.creatorName : 'NA'}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{task.assignedNames?.length && task.assignedNames.some(n => n && n !== '[object Object]') ? task.assignedNames.filter(n => n && n !== '[object Object]').join(', ') : 'Unassigned'}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{(task as any).completion_percentage || 0}</td>

                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{(task as any).delay_days || 0}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{(task as any).actual_cost || 0}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{(task as any).planned_cost || 0}</td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">
                                                            {task.audio_data || (task as any).audio_instruction_url ? (
                                                                <audio controls src={task.audio_data ? getFullUrl(task.audio_data) || '' : getFullUrl(String((task as any).audio_instruction_url)) || ''} className="h-8 w-32" />
                                                            ) : 'null'}
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">
                                                            {(task as any).instruction_image_url ? (
                                                                <img
                                                                    src={String((task as any).instruction_image_url) || ''}
                                                                    alt="Instruction"
                                                                    className="h-10 w-10 object-cover rounded shadow-sm border border-slate-200 cursor-pointer transition-opacity hover:opacity-80"
                                                                    onClick={() => {
                                                                        setViewImageSrc(String((task as any).instruction_image_url));
                                                                        setIsImageModalOpen(true);
                                                                    }}
                                                                />
                                                            ) : 'null'}
                                                        </td>

                                                        <td className="p-4 text-center block md:table-cell">
                                                            <div className="flex items-center justify-center gap-1">

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
                                                                <button
                                                                    onClick={() => openTaskModal(task)}
                                                                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="Edit">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Task">
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
                                    <button
                                        onClick={handleNewTaskRequest}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Task Request
                                    </button>
                                </div>
                            </div>

                            {/* Project List */}
                            <div className="p-6 bg-slate-50 flex-1 space-y-4">
                                {assignedProjects
                                    .filter((p: any) => {
                                        if (!searchQuery) return true;
                                        const name = (p.project_name || p.name || '').toString().toLowerCase();
                                        return name.includes(searchQuery.toLowerCase());
                                    })
                                    .map((p: any) => {
                                        const projectIdKey = (p.id || p.project_id) as number;
                                        const projectName = p.project_name || p.name || `Project ${projectIdKey}`;
                                        const projectTasks = projectTasksMap[projectIdKey] || [];
                                        const projectTasksGlobal = tasks.filter(t => (t.project_id && (t.project_id === projectIdKey)) || t.projectName === projectName);
                                        const tasksCount = Math.max(projectTasks.length, projectTasksGlobal.length, p.tasks_count || 0, p.total_tasks || 0);
                                        const isExpanded = expandedProjects.includes(projectIdKey);
                                        const isProjLoading = !!projectLoadingMap[projectIdKey];
                                        const projectStatus = p.status || p.project_status || 'Planned';
                                        const project = { id: projectIdKey, name: projectName, tasksCount: tasksCount, status: projectStatus, tasks: projectTasks };
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
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${project.status?.toLowerCase() === 'completed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                                                                    project.status?.toLowerCase() === 'ongoing' ? 'border-blue-200 text-blue-600 bg-blue-50' :
                                                                        project.status?.toLowerCase() === 'delayed' ? 'border-rose-200 text-rose-600 bg-rose-50' :
                                                                            project.status?.toLowerCase() === 'on hold' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                                                                'border-slate-200 text-slate-600 bg-slate-50'
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
                                                                    {isProjLoading ? (
                                                                        <tr className="block md:table-row">
                                                                            <td colSpan={6} className="p-12 text-center text-sm font-bold text-slate-800 bg-white block md:table-cell">
                                                                                <div className="flex items-center justify-center gap-2">
                                                                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                                                    <span>Loading tasks...</span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ) : project.tasks.length > 0 ? (
                                                                        project.tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((task) => (
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
                                                                                            <p className="text-xs font-bold text-slate-800">{task.assignedTo?.name || 'Unassigned'}</p>
                                                                                            <p className="text-[10px] text-slate-500">{task.assignedTo?.role || 'Engineer'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-4 block md:table-cell">
                                                                                    <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                                                        {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'NA'}
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
                                                                                        <button onClick={() => openTaskModal(task)} className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="View Details">
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

                                                        {/* Pagination Controls */}
                                                        {project.tasks.length > 0 && (
                                                            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white font-inter">
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, project.tasks.length)} of {project.tasks.length} tasks
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                        disabled={currentPage === 1}
                                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                                                    >
                                                                        <ChevronLeft className="w-4 h-4" />
                                                                    </button>
                                                                    {(() => {
                                                                        const totalPages = Math.ceil(project.tasks.length / itemsPerPage);
                                                                        return Array.from({ length: totalPages }).map((_, idx) => {
                                                                            const page = idx + 1;
                                                                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                                                return (
                                                                                    <button
                                                                                        key={page}
                                                                                        onClick={() => setCurrentPage(page)}
                                                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shadow-sm ${currentPage === page
                                                                                            ? 'bg-primary text-white border-primary'
                                                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary bg-white'
                                                                                            }`}
                                                                                    >
                                                                                        {page}
                                                                                    </button>
                                                                                );
                                                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                                                return <span key={page} className="text-slate-400 text-xs px-1">...</span>;
                                                                            }
                                                                            return null;
                                                                        });
                                                                    })()}
                                                                    <button
                                                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(project.tasks.length / itemsPerPage), prev + 1))}
                                                                        disabled={currentPage === Math.max(1, Math.ceil(project.tasks.length / itemsPerPage))}
                                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                                                    >
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Task Requests Section */}
                                                        <div className="border-t border-slate-200 p-6">
                                                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                                                                    <FileText className="w-4 h-4 text-amber-600" />
                                                                </div>
                                                                Task Requests ({taskRequests.length})
                                                            </h4>

                                                            {isLoadingTaskRequests ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                                </div>
                                                            ) : taskRequests.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {taskRequests.map((request) => (
                                                                        <div
                                                                            key={request.id}
                                                                            className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-start justify-between"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <h5 className="font-bold text-sm text-slate-800 mb-1">{request.title}</h5>
                                                                                <p className="text-xs text-slate-500 mb-2 line-clamp-2">{request.description}</p>
                                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${request.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                                                                        request.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                                                                            'bg-emerald-100 text-emerald-700'
                                                                                        }`}>
                                                                                        {request.priority || 'MEDIUM'}
                                                                                    </span>
                                                                                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                                                        request.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                                                            'bg-rose-100 text-rose-700'
                                                                                        }`}>
                                                                                        {request.status || 'PENDING'}
                                                                                    </span>
                                                                                    {request.due_date && (
                                                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                                            <Calendar className="w-3 h-3" />
                                                                                            {new Date(request.due_date).toLocaleDateString()}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 ml-4">
                                                                                <button
                                                                                    onClick={() => handleEditTaskRequest(request)}
                                                                                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                                                    title="Edit"
                                                                                >
                                                                                    <Edit2 className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteTaskRequest(request.id)}
                                                                                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                                                    title="Delete"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 text-slate-500">
                                                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                                    <p className="text-sm font-bold">No task requests yet</p>
                                                                    <p className="text-xs mt-1">Create your first task request to get started</p>
                                                                </div>
                                                            )}
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

            {/* Task Request Modal */}
            <TaskRequestModal
                isOpen={isTaskRequestModalOpen}
                onClose={handleCloseTaskRequestModal}
                onSubmit={handleSaveTaskRequest}
                projectMembers={projectMembers}
                editingRequest={selectedTaskRequest}
                isLoading={isLoadingTaskRequests}
                projectId={projectId === 'all' ? undefined : (Number(projectId) || undefined)}
                assignedProjects={assignedProjects}
            />

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-primary py-5 px-6 flex items-center justify-between relative overflow-hidden font-inter border-b border-primary/20 shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                            <div className="relative z-10 flex items-center gap-4 flex-1 min-w-0 mr-4">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-primary text-xl font-bold border border-white/20">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight break-words pr-2">{selectedTask.title}</h2>
                                    <p className="text-blue-100 text-xs font-medium tracking-wide">Detailed view of task assignments and progress</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedTask(null)}
                                className="relative z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-white border-b border-slate-200 px-6 pt-4 gap-4 overflow-x-auto custom-scrollbar shrink-0">
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
                                <div className="space-y-4 font-inter">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Task Title</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedTask.title}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">Description</p>
                                        </div>
                                        <p className="text-sm text-slate-600 pl-9">
                                            {selectedTask.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Assigned By</p>
                                            </div>
                                            <div className="pl-9">
                                                <p className="text-sm text-slate-600">{selectedTask.creatorName || 'System / Admin'}</p>
                                                <p className="text-xs text-slate-400">Manager</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Assigned To</p>
                                            </div>
                                            <div className="pl-9">
                                                <p className="text-sm text-slate-600">{selectedTask.assignedNames?.length ? selectedTask.assignedNames.join(', ') : 'Unassigned'}</p>
                                                <p className="text-xs text-slate-400">Labour</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Priority</p>
                                            </div>
                                            <div className="pl-9">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedTask.priority === 'HIGH' ? 'bg-rose-500 text-white' : selectedTask.priority === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                    {selectedTask.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Deadline</p>
                                            </div>
                                            <div className="pl-9">
                                                <p className="text-sm text-slate-600">{selectedTask.end_date ? new Date(selectedTask.end_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Start Date</p>
                                            </div>
                                            <div className="pl-9">
                                                <p className="text-sm text-slate-600">{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">Status</p>
                                        </div>
                                        <div className="pl-9 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                            <p className="text-sm text-slate-600">{selectedTask.status}</p>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Project Classification</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Project</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedTask.projectName || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Milestone</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedTask.milestoneName || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">BOQ</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedTask.boqName || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Execution & Delays</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Actual Start</p>
                                            <p className="text-sm font-bold text-slate-800">{(selectedTask as any).actual_start_date ? new Date((selectedTask as any).actual_start_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Actual End</p>
                                            <p className="text-sm font-bold text-slate-800">{(selectedTask as any).actual_end_date ? new Date((selectedTask as any).actual_end_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Duration</p>
                                            <p className="text-sm font-bold text-slate-800">{(selectedTask as any).execution_duration || 0} days</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Delay Status</p>
                                            <p className={`text-sm font-bold ${(selectedTask as any).is_delayed ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {(selectedTask as any).is_delayed ? `${(selectedTask as any).delay_days || 0} Days Delayed` : 'On Track'}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Completion</p>
                                            <p className="text-sm font-bold text-blue-500">{(selectedTask as any).completion_percentage || 0}%</p>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Financials</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Planned Cost</p>
                                            <p className="text-sm font-bold text-slate-800">₹{(selectedTask as any).planned_cost || 0}</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Actual Cost</p>
                                            <p className="text-sm font-bold text-slate-800">₹{(selectedTask as any).actual_cost || 0}</p>
                                        </div>
                                    </div>

                                    {((selectedTask as any).instruction_image_url || selectedTask.audio_data || (selectedTask as any).audio_instruction_url || (selectedTask as any).task_icon) && (
                                        <>
                                            <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Media & Instructions</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {(selectedTask as any).task_icon && (
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                        <p className="text-xs font-bold text-slate-400 mb-3">Task Icon</p>
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                                                            <img src={String((selectedTask as any).task_icon)} alt="Task Icon" className="w-full h-full object-contain" />
                                                        </div>
                                                    </div>
                                                )}
                                                {(selectedTask as any).instruction_image_url && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instruction Image</span>
                                                        <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200">
                                                            <img
                                                                src={getFullUrl(String((selectedTask as any).instruction_image_url)) || ''}
                                                                alt="Instruction"
                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => {
                                                                    setViewImageSrc(getFullUrl(String((selectedTask as any).instruction_image_url)));
                                                                    setIsImageModalOpen(true);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {(selectedTask.audio_data || (selectedTask as any).audio_instruction_url) && (
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                        <p className="text-xs font-bold text-slate-400 mb-3">Audio Instruction</p>
                                                        <audio controls src={selectedTask.audio_data ? (getFullUrl(selectedTask.audio_data) || '') : (getFullUrl(String((selectedTask as any).audio_instruction_url)) || '')} className="w-full max-w-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
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
                                                {taskComments.map((c: any, i) => (
                                                    <div key={i} className="flex flex-col bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-max max-w-[80%]">
                                                        <span className="text-xs font-bold text-slate-800 mb-1">
                                                            {c.author_user_id === 1 ? 'Clients' : (c.author_name || c.user_name || c.full_name || c.author_full_name || projectMembers.find(m => m.user_id === c.author_user_id)?.full_name || `User ${c.author_user_id}`)}
                                                        </span>
                                                        <p className="text-sm text-slate-700 mb-2">{c.content || c.comment || c.text || ""}</p>
                                                        <span className="text-[10px] text-slate-400">Just now</span>
                                                    </div>
                                                ))}
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
                                        <div className="relative space-y-6 pl-4 md:pl-0 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-5 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                                            {taskActivity.map((activity: any, i) => (
                                                <div key={i} className="relative flex items-start gap-6">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border-4 border-white shadow-sm text-indigo-500 z-10 shrink-0">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                            <h4 className="text-sm font-bold text-slate-800">Progress Updated</h4>
                                                            <span className="text-[10px] font-bold text-slate-500">{new Date(activity.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 mb-3">Progress moved to {activity.percentage ?? activity.progress_percentage ?? 0}%</p>
                                                        {activity.remarks && (
                                                            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                                                                <span className="font-bold text-slate-700 block mb-1">Remarks:</span>
                                                                {activity.remarks}
                                                            </div>
                                                        )}
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
                                    Project <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    name="project_id"
                                    defaultValue={selectedEditTask?.project_id || projectId || 1}
                                    onChange={async (e) => {
                                        const projId = Number(e.target.value);
                                        if (projId && !isNaN(projId)) {
                                            try {
                                                const activities = await workProgressService.listActivities(projId);
                                                setEditModalActivities(Array.isArray(activities) ? activities : (activities as any).items || (activities as any).data || []);
                                            } catch (err) {
                                                setEditModalActivities([]);
                                            }
                                        } else {
                                            setEditModalActivities([]);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="None">None</option>
                                    {assignedProjects.map((p: any) => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Voice Note
                                </label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    {!editIsRecording && !editAudioBlob && !selectedEditTask?.audio_data && (
                                        <button
                                            type="button"
                                            onClick={startEditRecording}
                                            className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    )}

                                    {editIsRecording && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={stopEditRecording}
                                                className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors animate-pulse"
                                            >
                                                <Square className="w-5 h-5 fill-current" />
                                            </button>
                                            <div className="flex items-center gap-2 text-rose-500 font-medium">
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                                {formatTime(editRecordingTime)}
                                            </div>
                                        </>
                                    )}

                                    {editAudioBlob && !editIsRecording && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={toggleEditPlay}
                                                className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            >
                                                {editIsPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                            </button>
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full opacity-30"></div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={deleteEditRecording}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <audio ref={editAudioRef} className="hidden" />
                                        </>
                                    )}

                                    {!editIsRecording && !editAudioBlob && selectedEditTask?.audio_data && (
                                        <div className="flex items-center gap-3 w-full">
                                            <AudioButton audioData={selectedEditTask.audio_data} />
                                            <span className="text-sm text-slate-600 font-medium">Existing Audio</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    name="remove_audio"
                                                    id="remove_audio_inline"
                                                    value="true"
                                                    className="w-4 h-4 text-primary rounded border-slate-300"
                                                />
                                                <label htmlFor="remove_audio_inline" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer">
                                                    Remove
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {!editIsRecording && !editAudioBlob && !selectedEditTask?.audio_data && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm text-slate-400">Click to record a new voice note</span>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center my-1">OR</span>
                                            <input
                                                type="file"
                                                name="audio_upload"
                                                accept="audio/*"
                                                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer font-inter"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Instruction Image
                                </label>
                                {selectedEditTask && (selectedEditTask as any).instruction_image_url && (
                                    <div className="mb-3 flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <img src={String((selectedEditTask as any).instruction_image_url)} alt="Existing Instruction" className="h-16 w-16 object-cover rounded shadow-sm border border-slate-200" />
                                        <div className="flex-1">
                                            <span className="text-sm text-slate-600 font-medium">Existing Image</span>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    name="instruction_image"
                                    accept="image/*"
                                    className="w-full px-4 py-2 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Task Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    defaultValue={selectedEditTask?.title}
                                    required
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
                                        Priority <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="priority"
                                        required
                                        defaultValue={selectedEditTask?.priority === "HIGH" ? 1 : selectedEditTask?.priority === "MEDIUM" ? 2 : selectedEditTask?.priority === "LOW" ? 3 : 1}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value={4}>Low</option>
                                        <option value={3}>Medium</option>
                                        <option value={2}>High</option>
                                        <option value={1}>Critical</option>
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
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        defaultValue={selectedEditTask?.end_date ? new Date(selectedEditTask.end_date).toISOString().split('T')[0] : ''}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    />
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
                                        Assigned User
                                    </label>
                                    <select
                                        name="assigned_user_ids"
                                        defaultValue={selectedEditTask?.assigned_user_id || ""}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select User</option>
                                        {projectMembers.map((m: any) => (
                                            <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Activity Type
                                    </label>
                                    <select
                                        name="activity_type_id"
                                        defaultValue={selectedEditTask?.activity_type_id || ""}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {editModalActivities.map((a: any) => (
                                            <option key={a.id} value={a.id}>{a.activity_name || a.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Milestone
                                    </label>
                                    <select
                                        name="milestone_id"
                                        defaultValue={selectedEditTask?.milestone_id || ""}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {projectMilestones.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        BOQ
                                    </label>
                                    <select
                                        name="boq_id"
                                        defaultValue={selectedEditTask?.boq_id || ""}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {projectBoqs.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.item_name || b.name || b.item_description || `BOQ Item`}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 mt-2 py-2">
                                    <input
                                        type="checkbox"
                                        name="remove_audio"
                                        id="remove_audio"
                                        value="true"
                                        className="w-4 h-4 text-primary rounded border-slate-300"
                                    />
                                    <label htmlFor="remove_audio" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        Remove Audio
                                    </label>
                                </div>

                                <div className="flex items-center gap-2 mt-2 py-2">
                                    <input
                                        type="checkbox"
                                        name="remove_image"
                                        id="remove_image"
                                        value="true"
                                        className="w-4 h-4 text-primary rounded border-slate-300"
                                    />
                                    <label htmlFor="remove_image" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        Remove Image
                                    </label>
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
                projectId={projectId === 'all' ? null : projectId}
                onSuccess={() => {
                    fetchData();
                    setIsCreateDrawerOpen(false);
                }}
            />

            {/* <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDeleteTask}
                title="Discard Task Entry"
                message="Are you sure you want to delete this task record? This action will permanently remove the entry and all its progress history."
                confirmText="Archive Record"
                type="danger"
                isLoading={isSubmitting}
            /> */}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteId(null); }}
                onConfirm={executeDeleteTask}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                type="danger"
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

            {/* Image Viewer Modal */}
            <Modal
                isOpen={isImageModalOpen}
                onClose={() => {
                    setIsImageModalOpen(false);
                    setViewImageSrc(null);
                }}
                title="Instruction Image"
            >
                <div className="flex justify-center items-center overflow-hidden bg-slate-50 rounded-xl border border-slate-200 p-2">
                    {viewImageSrc && (
                        <img
                            src={viewImageSrc}
                            alt="Full Instruction"
                            className="max-h-[70vh] max-w-full object-contain rounded-lg rounded-xl shadow-sm"
                        />
                    )}
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
                    <button
                        onClick={() => {
                            setIsImageModalOpen(false);
                            setViewImageSrc(null);
                        }}
                        className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* Generate BOQ to Task Modal */}
            <Modal
                isOpen={isGenerateBoqModalOpen}
                onClose={() => setIsGenerateBoqModalOpen(false)}
                title="Generate Tasks from BOQ"
                maxWidth="max-w-md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsGenerateBoqModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                            disabled={isGeneratingBoq}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerateBoqToTask}
                            disabled={!generateBoqId || isGeneratingBoq}
                            className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50"
                        >
                            {isGeneratingBoq ? "Generating..." : "Generate Tasks"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">BOQ <span className="text-rose-500">*</span></label>
                        <select
                            value={generateBoqId}
                            onChange={(e) => setGenerateBoqId(e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                            required
                        >
                            <option value="">Select BOQ</option>
                            {projectBoqs.map((b: any) => (
                                <option key={b.id || b.boq_id} value={b.id || b.boq_id}>
                                    {b.item_name || b.name || b.title || b.boq_name || `BOQ #${b.id || b.boq_id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Milestone <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <select
                            value={generateMilestoneId}
                            onChange={(e) => setGenerateMilestoneId(e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 appearance-none cursor-pointer"
                        >
                            <option value="">Select Milestone</option>
                            {projectMilestones.map((m: any) => (
                                <option key={m.id || m.milestone_id} value={m.id || m.milestone_id}>
                                    {m.name || m.title || m.milestone_name || `Milestone #${m.id || m.milestone_id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TaskManagementPage;
