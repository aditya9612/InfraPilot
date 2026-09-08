import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { 
    Upload, 
    Calendar, 
    Clock, 
    MapPin, 
    Send, 
    X,
    ChevronDown,
    FileText,
    Download,
    Edit,
    Trash2,
    Plus,
    Search,
    History,
    Eye,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Printer,
    Check,
    FolderKanban,
    Timer,
    Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

import { projectService } from '../../services/projectService';
import { masterService, type MasterEntity } from '../../services/masterService';
import { useLabourProjectId } from '../../hooks/useLabourProjectId';
import type { 
    CreateWorkUpdatePayload, 
    SubmitWorkUpdatePayload,
    WorkUpdateItem
} from '../../services/workUpdateService';
import { workUpdateService } from '../../services/workUpdateService';
import { safeSetItem, compressImageFile } from '../../utils/storageUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACTIVITY_TYPE_MAP: Record<string, number> = {
    "reinforcement": 1,
    "concreting": 2,
    "masonry": 3,
    "brickwork": 3,
    "brick": 3,
    "excavation": 4,
    "plastering": 5,
    "painting": 6,
    "flooring": 7,
    "electrical": 8,
    "plumbing": 9,
    "carpentry": 10
};

const ACTIVITY_TYPE_NAMES: Record<number, string> = {
    1: "Reinforcement",
    2: "Concreting",
    3: "Masonry",
    4: "Excavation",
    5: "Plastering",
    6: "Painting",
    7: "Flooring",
    8: "Electrical",
    9: "Plumbing",
    10: "Carpentry",
    11: "Waterproofing",
};

const getActivityBadgeClass = (categoryName?: string): string => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('reinforce')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (cat.includes('concrete')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (cat.includes('mason') || cat.includes('brick')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cat.includes('excavat')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (cat.includes('plaster')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('paint')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cat.includes('floor')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (cat.includes('electr')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (cat.includes('plumb')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (cat.includes('carpent')) return 'bg-stone-100 text-stone-700 border-stone-200';
    if (cat.includes('waterproof')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
};

const getStatusBadgeClass = (status?: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'done' || s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'submitted') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'in progress' || s === 'in_progress') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'rejected' || s === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getFullUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace(/\/+$/, '')
        : 'http://127.0.0.1:8000';
    return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

const extractUpdateImages = (item: any): { before: string[]; after: string[] } => {
    const before: string[] = [];
    const after: string[] = [];

    // 1. Array of image objects
    if (Array.isArray(item.images)) {
        item.images.forEach((img: any) => {
            const rawUrl = img?.image_url || img?.url || img?.path || (typeof img === 'string' ? img : '');
            const url = getFullUrl(rawUrl);
            if (!url) return;
            const type = String(img?.image_type || img?.type || '').toLowerCase();
            if (type === 'before') before.push(url);
            else if (type === 'after') after.push(url);
            else before.push(url);
        });
    }

    // 2. before_images
    if (Array.isArray(item.before_images)) {
        item.before_images.forEach((img: any) => {
            const rawUrl = typeof img === 'string' ? img : img?.image_url || img?.url || img?.path;
            const url = getFullUrl(rawUrl);
            if (url && !before.includes(url)) before.push(url);
        });
    }

    // 3. after_images
    if (Array.isArray(item.after_images)) {
        item.after_images.forEach((img: any) => {
            const rawUrl = typeof img === 'string' ? img : img?.image_url || img?.url || img?.path;
            const url = getFullUrl(rawUrl);
            if (url && !after.includes(url)) after.push(url);
        });
    }

    // 4. before_photos / after_photos
    if (Array.isArray(item.before_photos)) {
        item.before_photos.forEach((img: any) => {
            const rawUrl = typeof img === 'string' ? img : img?.url;
            const url = getFullUrl(rawUrl);
            if (url && !before.includes(url)) before.push(url);
        });
    }
    if (Array.isArray(item.after_photos)) {
        item.after_photos.forEach((img: any) => {
            const rawUrl = typeof img === 'string' ? img : img?.url;
            const url = getFullUrl(rawUrl);
            if (url && !after.includes(url)) after.push(url);
        });
    }

    return { before, after };
};

const resolveActivityTypeId = (
    cat: string | number | null | undefined, 
    taskObj?: any,
    loadedActivityTypes: MasterEntity[] = []
): number => {
    if (taskObj?.activity_type_id && Number(taskObj.activity_type_id) > 0) {
        return Number(taskObj.activity_type_id);
    }
    if (typeof cat === 'number' && !isNaN(cat) && cat > 0) return cat;
    const str = String(cat || '').trim().toLowerCase();
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed) && String(parsed) === str && parsed > 0) return parsed;

    // Check dynamically loaded master activity types first
    if (loadedActivityTypes.length > 0) {
        const found = loadedActivityTypes.find(at => 
            at.name?.toLowerCase() === str || 
            at.category?.toLowerCase() === str || 
            at.unique_code?.toLowerCase() === str ||
            str.includes(at.name?.toLowerCase() || '') ||
            (at.name && at.name.toLowerCase().includes(str))
        );
        if (found && found.id) return found.id;
    }

    // Check predefined mapping table
    for (const [k, v] of Object.entries(ACTIVITY_TYPE_MAP)) {
        if (str.includes(k)) return v;
    }
    return 1;
};

const formatTimeToHms = (timeStr: string | undefined, defaultTime = "09:00:00"): string => {
    if (!timeStr) return defaultTime;
    const trimmed = timeStr.trim();
    if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        if (parts.length === 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }
        if (parts.length === 3) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].split('.')[0].padStart(2, '0')}`;
        }
    }
    return `${trimmed}:00`;
};

const calculateTotalHoursNumber = (startStr: string | undefined, endStr: string | undefined): number => {
    const s = (startStr || "09:00").split(':').map(Number);
    const e = (endStr || "17:30").split(':').map(Number);
    const startMinutes = (s[0] || 0) * 60 + (s[1] || 0);
    const endMinutes = (e[0] || 0) * 60 + (e[1] || 0);
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const hours = diffMinutes / 60;
    return Number(hours.toFixed(2));
};

const formatApiErrorMessage = (error: any, fallbackMessage = "An error occurred"): string => {
    if (!error) return fallbackMessage;
    if (typeof error === 'string') return error;

    const resData = error?.response?.data;
    
    // FastAPI detail validation handling
    if (resData?.detail) {
        if (typeof resData.detail === 'string') {
            return resData.detail;
        }
        if (Array.isArray(resData.detail)) {
            const messages = resData.detail.map((d: any) => {
                if (typeof d === 'string') return d;
                const locArr = Array.isArray(d?.loc) ? d.loc.filter((l: any) => l !== 'body') : [];
                const fieldName = locArr.join('.');
                const msg = d?.msg || d?.message || 'Field validation error';
                if (fieldName) {
                    const formattedField = fieldName.replace(/_/g, ' ');
                    const capitalizedField = formattedField.charAt(0).toUpperCase() + formattedField.slice(1);
                    return `${capitalizedField} is required (${msg})`;
                }
                return msg;
            }).filter(Boolean);
            if (messages.length > 0) {
                return messages.join(', ');
            }
        }
        if (typeof resData.detail === 'object') {
            try {
                return JSON.stringify(resData.detail);
            } catch (_) {
                return fallbackMessage;
            }
        }
    }

    if (resData?.message && typeof resData.message === 'string') {
        return resData.message;
    }

    if (error?.message && typeof error.message === 'string') {
        return error.message;
    }

    return fallbackMessage;
};

const base64ToFile = (base64String: string, filename: string): File => {
    if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(0, 0, 100, 100);
        }
        const dataUrl = canvas.toDataURL('image/jpeg');
        return base64ToFile(dataUrl, filename);
    }
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const WorkUpdatesPage: React.FC = () => {
    const { user } = useAuth();
    const { projectId: activeProjectId, projectName: activeProjectName, loading: isProjectLoading } = useLabourProjectId();

    const query = new URLSearchParams(useLocation().search);
    const taskId = query.get('taskId');
    const queryProjectId = query.get('projectId');

    // Project resolution: query param -> useLabourProjectId -> localStorage -> user.project_id
    const currentProjectId = useMemo(() => {
        const pid = queryProjectId ||
            (activeProjectId ? String(activeProjectId) : '') ||
            localStorage.getItem("client_selected_project_id") ||
            localStorage.getItem("infrapilot_selected_project_id") ||
            (user as any)?.project_id ||
            '';
        return pid ? Number(pid) : 0;
    }, [queryProjectId, activeProjectId, user]);

    const currentProjectName = useMemo(() => {
        return activeProjectName ||
            localStorage.getItem("client_selected_project_name") ||
            localStorage.getItem("infrapilot_selected_project_name") ||
            (user as any)?.project_name ||
            '';
    }, [activeProjectName, user]);

    const projectId = currentProjectId ? String(currentProjectId) : '';
    const taskName = query.get('taskName');
    const taskCategory = query.get('taskCategory');

    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    // Current date for default
    const today = new Date().toISOString().split('T')[0];

    // Form state
    const [description, setDescription] = useState(taskName ? `Working on: ${taskName}` : '');
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
    const [workDate, setWorkDate] = useState(today);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:30');
    const [category, setCategory] = useState(taskCategory || '');
    const [location, setLocation] = useState('');
    const [beforeRemarks, setBeforeRemarks] = useState('');
    const [afterRemarks, setAfterRemarks] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isUploadingBefore, setIsUploadingBefore] = useState(false);
    const [isUploadingAfter, setIsUploadingAfter] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [activityTypes, setActivityTypes] = useState<MasterEntity[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState(taskId || '');
    const [myUpdates, setMyUpdates] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);

    // History Table States
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
    const [historyDateFilter, setHistoryDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isHistoryRefreshing, setIsHistoryRefreshing] = useState(false);

    // Modal States
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

    // Persistence helpers for completed task IDs
    const getPersistedCompletedTaskIds = (): string[] => {
        try {
            const raw = localStorage.getItem('infrapilot_completed_task_ids');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };

    const persistCompletedTaskId = (tId: string | number) => {
        if (!tId) return;
        const idStr = String(tId);
        safeSetItem(`task_status_${idStr}`, 'Completed');
        try {
            const currentList = getPersistedCompletedTaskIds();
            if (!currentList.includes(idStr)) {
                currentList.push(idStr);
                localStorage.setItem('infrapilot_completed_task_ids', JSON.stringify(currentList));
            }
        } catch (e) {
            console.warn('Error persisting completed task ID:', e);
        }
    };

    // Filter tasks for CURRENT PROJECT, strictly excluding completed tasks
    const displayTasks = useMemo(() => {
        const currentUserName = (user?.name || user?.username || 'Ramesh Sharma').toLowerCase();
        const currentUserId = user?.id ? Number(user.id) : null;

        // 1. Is task completed? (Strictly check rawStatus, localStatus, is_completed, and progress)
        const isNotCompleted = (t: any) => {
            const rawStatus = String(t.status || t.task_status || '').trim().toLowerCase();
            const localStatus = String(localStorage.getItem(`task_status_${t.id}`) || '').trim().toLowerCase();
            
            if (
                rawStatus === 'completed' ||
                rawStatus === 'done' ||
                rawStatus === 'closed' ||
                rawStatus === 'finished' ||
                rawStatus === 'approved' ||
                localStatus === 'completed' ||
                localStatus === 'done'
            ) {
                return false;
            }
            if (t.is_completed === true || Number(t.completion_percentage) >= 100 || Number(t.progress) >= 100) {
                return false;
            }
            return true;
        };

        // 2. User Assignment filter
        const isAssignedToUser = (t: any) => {
            const assignedText = String(
                t.assignedTo ||
                t.assigned_to_name ||
                t.assigned_user_name ||
                t.assigned_user ||
                t.assigned_users_name ||
                (Array.isArray(t.assigned_users) ? t.assigned_users.map((u: any) => u.name || u.full_name || u.username || u).join(' ') : '') ||
                ''
            ).toLowerCase();

            const isNameMatch = assignedText.includes(currentUserName) ||
                (currentUserName.includes('ramesh') && assignedText.includes('ramesh'));

            const isIdMatch = currentUserId && (
                (t.assigned_user_id && Number(t.assigned_user_id) === currentUserId) ||
                (Array.isArray(t.assigned_user_ids) && t.assigned_user_ids.map(Number).includes(currentUserId)) ||
                (Array.isArray(t.assigned_users) && t.assigned_users.some((u: any) => Number(u.id || u) === currentUserId))
            );

            return isNameMatch || isIdMatch;
        };

        const activeTasks = tasks.filter(isNotCompleted);
        const userActiveTasks = activeTasks.filter(isAssignedToUser);

        // 1st priority: active tasks assigned to current user
        if (userActiveTasks.length > 0) {
            return userActiveTasks;
        }

        // 2nd priority: other active tasks in the project
        return activeTasks;
    }, [tasks, user]);

    // Fetch initial data
    const fetchInitialData = useCallback(async (showToast = false) => {
        if (!activeProjectId && isProjectLoading) return;
        const pId = currentProjectId || activeProjectId || (user as any)?.project_id || 2;
        if (showToast) setIsHistoryRefreshing(true);

        const assignedUserId = user?.id ? Number(user.id) : 8;

        try {
            // GET /api/v1/projects/{projectId}/tasks?limit=10&offset=0&assigned_user_id={assigned_user_id}
            const params: any = { 
                limit: 10, 
                offset: 0,
                assigned_user_id: assignedUserId
            };
            const response = await projectService.getTasks(pId, params);
            let items = Array.isArray(response) ? response : (response.items || response.data || []);

            // Fallback: If no tasks returned with assigned_user_id filter, fetch without assigned_user_id
            if (items.length === 0) {
                try {
                    const fallbackRes = await projectService.getTasks(pId, { limit: 10, offset: 0 });
                    const fallbackItems = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes.items || fallbackRes.data || []);
                    if (fallbackItems.length > 0) {
                        items = fallbackItems;
                    }
                } catch (_) {}
            }

            // Fallback: If still no tasks returned for pId, try fetching first available project's tasks
            if (items.length === 0 && (!pId || pId === 0)) {
                try {
                    const projectsRes = await projectService.getProjects(10, 0);
                    const projs = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.items || projectsRes?.data || []);
                    if (projs.length > 0) {
                        const fallbackPid = projs[0].id || projs[0].project_id;
                        if (fallbackPid) {
                            const fallbackTasks = await projectService.getTasks(fallbackPid, { limit: 10, offset: 0, assigned_user_id: assignedUserId });
                            items = Array.isArray(fallbackTasks) ? fallbackTasks : (fallbackTasks.items || []);
                        }
                    }
                } catch (_) {}
            }

            const mappedItems = items.map((t: any) => {
                const assignee = t.assigned_users && t.assigned_users.length > 0
                    ? t.assigned_users.map((u: any) => u.full_name || u.name || u.username).join(', ')
                    : (t.assignedTo || t.assigned_to_name || t.assigned_user_name || 'Unassigned');

                const rawStatus = t.status || t.task_status || 'Planned';
                const localStatus = localStorage.getItem(`task_status_${t.id}`);

                if ((rawStatus === 'Planned' || rawStatus === 'Pending' || rawStatus === 'In Progress') && localStatus === 'Completed') {
                    localStorage.removeItem(`task_status_${t.id}`);
                }

                const effectiveStatus = localStorage.getItem(`task_status_${t.id}`) || rawStatus;

                return {
                    ...t,
                    id: String(t.id),
                    name: t.title || t.name || `Task #${t.id}`,
                    title: t.title || t.name || `Task #${t.id}`,
                    project: t.project_name || t.project?.name || t.project?.title || currentProjectName,
                    project_id: t.project_id || pId,
                    assignedTo: assignee,
                    status: effectiveStatus
                };
            });
            setTasks(mappedItems);
            
            if (taskId && mappedItems.length > 0) {
                const currentTask = mappedItems.find((t: any) => String(t.id) === String(taskId));
                if (currentTask && !category) {
                    setCategory(currentTask.category || currentTask.activity_type || currentTask.description?.split('|')[0]?.trim() || '');
                }
            }
        } catch (error) {
            console.error("Failed to fetch tasks for project", pId, error);
        }

        // Fetch Master Activity Types (GET /api/v1/master/activity-types)
        try {
            const actTypes = await masterService.getEntities("activity-types");
            if (Array.isArray(actTypes) && actTypes.length > 0) {
                setActivityTypes(actTypes);
            }
        } catch (err) {
            console.warn("Failed to fetch master activity types:", err);
        }

        // Fetch My Work Updates (GET /api/v1/work-updates/my)
        try {
            const updates = await workUpdateService.getMyWorkUpdates(pId ? { project_id: pId } : {});
            setMyUpdates(updates);
        } catch (err) {
            console.warn("Failed to fetch my work updates:", err);
        }

        // Fetch Project Work-Update Timeline (GET /api/v1/work-updates/project/{project_id}/timeline)
        if (pId) {
            try {
                const timelineData = await workUpdateService.getProjectTimeline(pId);
                setTimeline(timelineData);
            } catch (err) {
                console.warn("Failed to fetch project timeline:", err);
            }
        }

        if (showToast) {
            setIsHistoryRefreshing(false);
            toast.success("Work updates history refreshed");
        }
    }, [activeProjectId, currentProjectId, currentProjectName, isProjectLoading, user?.id, taskId, category]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Unified History List
    const allHistoryUpdates = useMemo(() => {
        const map = new Map<number | string, any>();

        // 1. Add myUpdates
        myUpdates.forEach(item => {
            if (item && item.id) {
                const taskObj = tasks.find(t => String(t.id) === String(item.task_id));
                const { before, after } = extractUpdateImages(item);
                const actName = item.activity_type_id 
                    ? (activityTypes.find(a => a.id === item.activity_type_id)?.name || ACTIVITY_TYPE_NAMES[item.activity_type_id] || `Activity #${item.activity_type_id}`)
                    : (item.category || item.activity_type || 'General');

                map.set(item.id, {
                    ...item,
                    task_title: item.task_name || item.task_title || taskObj?.title || taskObj?.name || (item.task_id ? `Task #${item.task_id}` : 'General Work Update'),
                    project_name: item.project_name || taskObj?.project || currentProjectName || `Project #${item.project_id || currentProjectId}`,
                    activity_name: actName,
                    before_images_list: before,
                    after_images_list: after,
                    total_images_count: before.length + after.length,
                    display_status: item.status || 'Submitted',
                    raw_hours: typeof item.total_hours === 'number' ? item.total_hours : calculateTotalHoursNumber(item.start_time, item.end_time)
                });
            }
        });

        // 2. Add Timeline entries if not already present
        timeline.forEach(item => {
            if (item && item.id && !map.has(item.id)) {
                const taskObj = tasks.find(t => String(t.id) === String(item.task_id));
                const { before, after } = extractUpdateImages(item);
                const actName = item.activity_type_id 
                    ? (activityTypes.find(a => a.id === item.activity_type_id)?.name || ACTIVITY_TYPE_NAMES[item.activity_type_id] || `Activity #${item.activity_type_id}`)
                    : (item.category || item.activity_type || 'General');

                map.set(item.id, {
                    ...item,
                    task_title: item.task_name || item.task_title || taskObj?.title || taskObj?.name || (item.task_id ? `Task #${item.task_id}` : 'Site Work Update'),
                    project_name: item.project_name || taskObj?.project || currentProjectName || `Project #${item.project_id || currentProjectId}`,
                    activity_name: actName,
                    before_images_list: before,
                    after_images_list: after,
                    total_images_count: before.length + after.length,
                    display_status: item.status || 'Completed',
                    raw_hours: typeof item.total_hours === 'number' ? item.total_hours : calculateTotalHoursNumber(item.start_time, item.end_time)
                });
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.work_date || a.created_at || 0).getTime();
            const dateB = new Date(b.work_date || b.created_at || 0).getTime();
            return dateB - dateA || (b.id - a.id);
        });
    }, [myUpdates, timeline, tasks, activityTypes, currentProjectName, currentProjectId]);

    // Filtered History
    const filteredHistory = useMemo(() => {
        return allHistoryUpdates.filter(item => {
            // Search query filter
            if (historySearch.trim()) {
                const q = historySearch.toLowerCase().trim();
                const titleMatch = (item.task_title || '').toLowerCase().includes(q);
                const descMatch = (item.work_description || item.description || '').toLowerCase().includes(q);
                const actMatch = (item.activity_name || '').toLowerCase().includes(q);
                const locMatch = (item.location || '').toLowerCase().includes(q);
                const remMatch = (item.before_remarks || '').toLowerCase().includes(q) || (item.after_remarks || '').toLowerCase().includes(q);
                const idMatch = String(item.id).includes(q) || String(item.task_id || '').includes(q);
                if (!titleMatch && !descMatch && !actMatch && !locMatch && !remMatch && !idMatch) {
                    return false;
                }
            }

            // Status filter
            if (historyStatusFilter !== 'ALL') {
                const stat = (item.display_status || '').toLowerCase();
                if (stat !== historyStatusFilter.toLowerCase()) {
                    return false;
                }
            }

            // Date filter
            if (historyDateFilter) {
                const itemDate = (item.work_date || item.created_at || '').split('T')[0];
                if (itemDate !== historyDateFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [allHistoryUpdates, historySearch, historyStatusFilter, historyDateFilter]);

    // Pagination calculations
    const totalHistoryPages = Math.ceil(filteredHistory.length / pageSize) || 1;
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredHistory.slice(start, start + pageSize);
    }, [filteredHistory, currentPage, pageSize]);

    // Stats calculations
    const historyStats = useMemo(() => {
        const totalUpdates = allHistoryUpdates.length;
        const totalHours = allHistoryUpdates.reduce((acc, curr) => acc + (curr.raw_hours || 0), 0);
        const totalPhotos = allHistoryUpdates.reduce((acc, curr) => acc + (curr.total_images_count || 0), 0);
        const completedCount = allHistoryUpdates.filter(u => (u.display_status || '').toLowerCase() === 'completed' || (u.display_status || '').toLowerCase() === 'submitted').length;
        return {
            totalUpdates,
            totalHours: totalHours.toFixed(1),
            totalPhotos,
            completedCount
        };
    }, [allHistoryUpdates]);

    // GET /api/v1/work-updates/{work_update_id}
    const handleLoadWorkUpdate = async (id: number) => {
        const loadingToast = toast.loading(`Loading Work Update #${id}...`);
        try {
            const data = await workUpdateService.getWorkUpdate(id);
            setEditingUpdateId(data.id);
            if (data.task_id) setSelectedTaskId(String(data.task_id));
            if (data.work_description || data.description) setDescription(data.work_description || data.description);
            if (data.activity_type_id) {
                const foundType = activityTypes.find(at => at.id === data.activity_type_id);
                setCategory(foundType?.name || ACTIVITY_TYPE_NAMES[data.activity_type_id] || String(data.activity_type_id));
            } else if (data.category) {
                setCategory(data.category);
            }
            if (data.location) setLocation(data.location);
            if (data.work_date) setWorkDate(data.work_date);
            if (data.start_time) setStartTime(data.start_time.slice(0, 5));
            if (data.end_time) setEndTime(data.end_time.slice(0, 5));
            if (data.before_remarks) setBeforeRemarks(data.before_remarks);
            if (data.after_remarks) setAfterRemarks(data.after_remarks);
            
            const { before, after } = extractUpdateImages(data);
            if (before.length > 0) setBeforePhotos(before);
            if (after.length > 0) setAfterPhotos(after);
            
            toast.success(`Loaded Work Update #${id} into editor form`, { id: loadingToast });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error("Failed to fetch work update:", err);
            toast.error(formatApiErrorMessage(err, "Failed to load work update details"), { id: loadingToast });
        }
    };

    // DELETE /api/v1/work-updates/{work_update_id}
    const handleDeleteWorkUpdate = async (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete Work Update #${id}? This action cannot be undone.`)) return;

        const loadingToast = toast.loading(`Deleting Work Update #${id}...`);
        try {
            await workUpdateService.deleteWorkUpdate(id);
            toast.success(`Work Update #${id} deleted successfully`, { id: loadingToast });
            setMyUpdates(prev => prev.filter(u => u.id !== id));
            setTimeline(prev => prev.filter(t => t.id !== id));
            if (editingUpdateId === id) {
                setEditingUpdateId(null);
                setDescription('');
                setBeforePhotos([]);
                setAfterPhotos([]);
            }
            if (selectedHistoryItem?.id === id) {
                setSelectedHistoryItem(null);
            }
        } catch (err: any) {
            console.error("Failed to delete work update:", err);
            toast.error(formatApiErrorMessage(err, "Failed to delete work update"), { id: loadingToast });
        }
    };

    // 1. Create Work Update API
    const getOrCreateWorkUpdateId = async (): Promise<number | null> => {
        if (editingUpdateId) return editingUpdateId;

        const targetTaskId = selectedTaskId || taskId || (displayTasks.length > 0 ? String(displayTasks[0].id) : tasks.length > 0 ? String(tasks[0].id) : '1');
        if (!selectedTaskId) setSelectedTaskId(targetTaskId);

        const currentTask = tasks.find((t: any) => String(t.id) === String(targetTaskId));
        const activityTypeId = resolveActivityTypeId(category, currentTask, activityTypes);

        const payload: CreateWorkUpdatePayload = {
            project_id: Number(projectId || activeProjectId || 0),
            task_id: Number(targetTaskId || 1),
            activity_type_id: activityTypeId,
            work_description: description.trim() || (taskName ? `Working on: ${taskName}` : `Work update for ${category || 'site'}`),
            work_date: workDate || today,
            start_time: formatTimeToHms(startTime, "09:00:00"),
        };
        if (beforeRemarks && beforeRemarks.trim()) {
            payload.before_remarks = beforeRemarks.trim();
        }
        if (location && location.trim()) {
            payload.location = location.trim();
        }

        try {
            setIsCreating(true);
            const res = await workUpdateService.createWorkUpdate(payload);
            const activeId = res?.id ?? res?.data?.id ?? res?.work_update_id ?? res?.work_update?.id ?? null;
            if (activeId) {
                setEditingUpdateId(activeId);
                return activeId;
            }
            throw new Error("Could not retrieve Work Update ID from response");
        } catch (err: any) {
            console.error('[getOrCreateWorkUpdateId] Error creating work update:', err);
            const msg = formatApiErrorMessage(err, "Failed to create work update");
            toast.error(msg);
            return null;
        } finally {
            setIsCreating(false);
        }
    };

    // Upload Before Images
    const uploadBeforeImagesForUpdate = async (activeUpdateId: number): Promise<{ success: number; failed: number }> => {
        let success = 0;
        let failed = 0;
        for (let i = 0; i < beforePhotos.length; i++) {
            const photo = beforePhotos[i];
            try {
                const file = base64ToFile(photo, `before_${i + 1}.jpg`);
                await workUpdateService.uploadBeforeImage(activeUpdateId, file);
                success++;
            } catch (imgErr: any) {
                console.error(`[uploadBeforeImage] Photo #${i + 1} failed:`, imgErr);
                const msg = formatApiErrorMessage(imgErr, 'Server error');
                toast.error(`Before photo #${i + 1} upload failed: ${msg}`);
                failed++;
            }
        }
        return { success, failed };
    };

    // Upload After Images
    const uploadAfterImagesForUpdate = async (activeUpdateId: number): Promise<{ success: number; failed: number }> => {
        let success = 0;
        let failed = 0;
        for (let i = 0; i < afterPhotos.length; i++) {
            const photo = afterPhotos[i];
            try {
                const file = base64ToFile(photo, `after_${i + 1}.jpg`);
                await workUpdateService.uploadAfterImage(activeUpdateId, file);
                success++;
            } catch (imgErr: any) {
                console.error(`[uploadAfterImage] Photo #${i + 1} failed:`, imgErr);
                const msg = formatApiErrorMessage(imgErr, 'Server error');
                toast.error(`After photo #${i + 1} upload failed: ${msg}`);
                failed++;
            }
        }
        return { success, failed };
    };

    // Save Before Work Photos Button
    const handleSaveBeforePhotos = async () => {
        const targetTaskId = selectedTaskId || taskId || (displayTasks.length > 0 ? String(displayTasks[0].id) : tasks.length > 0 ? String(tasks[0].id) : '1');
        if (!selectedTaskId) setSelectedTaskId(targetTaskId);
        if (beforePhotos.length === 0) return toast.error("Please upload at least one Before photo");
        if (!description.trim()) return toast.error("Work description is required");
        
        setIsUploadingBefore(true);
        const loadingToast = toast.loading("Saving Work Update & Before Work images...");
        try {
            const activeUpdateId = await getOrCreateWorkUpdateId();
            if (!activeUpdateId) {
                toast.dismiss(loadingToast);
                return;
            }

            const { success, failed } = await uploadBeforeImagesForUpdate(activeUpdateId);

            try {
                await projectService.updateTaskStatus(Number(projectId), Number(targetTaskId), 'In Progress');
                safeSetItem(`task_status_${targetTaskId}`, 'In Progress');
            } catch (_) {}

            if (failed === 0) {
                toast.success(`Work Update #${activeUpdateId} saved with ${success} Before image(s)!`, { id: loadingToast });
            } else {
                toast.success(`Work Update #${activeUpdateId} saved. (${success} uploaded, ${failed} failed)`, { id: loadingToast });
            }
            fetchInitialData();
        } catch (err: any) {
            console.error('[handleSaveBeforePhotos] Error:', err);
            toast.error(formatApiErrorMessage(err, "Failed to save Before Work details"), { id: loadingToast });
        } finally {
            setIsUploadingBefore(false);
        }
    };

    // Save After Work Photos Button
    const handleSaveAfterPhotos = async () => {
        const targetTaskId = selectedTaskId || taskId || (displayTasks.length > 0 ? String(displayTasks[0].id) : tasks.length > 0 ? String(tasks[0].id) : '1');
        if (!selectedTaskId) setSelectedTaskId(targetTaskId);
        if (afterPhotos.length === 0) return toast.error("Please upload at least one After photo");
        if (!description.trim()) return toast.error("Work description is required");
        
        setIsUploadingAfter(true);
        const loadingToast = toast.loading("Saving Work Update & After Work images...");
        try {
            const activeUpdateId = await getOrCreateWorkUpdateId();
            if (!activeUpdateId) {
                toast.dismiss(loadingToast);
                return;
            }

            const { success, failed } = await uploadAfterImagesForUpdate(activeUpdateId);

            try {
                await projectService.updateTaskStatus(Number(projectId), Number(targetTaskId), 'Completed');
                persistCompletedTaskId(targetTaskId);
            } catch (_) {
                persistCompletedTaskId(targetTaskId);
            }

            if (failed === 0) {
                toast.success(`Work Update #${activeUpdateId} saved with ${success} After image(s)!`, { id: loadingToast });
            } else {
                toast.success(`Work Update #${activeUpdateId} saved. (${success} uploaded, ${failed} failed)`, { id: loadingToast });
            }
            fetchInitialData();
        } catch (err: any) {
            console.error('[handleSaveAfterPhotos] Error:', err);
            toast.error(formatApiErrorMessage(err, "Failed to save After Work details"), { id: loadingToast });
        } finally {
            setIsUploadingAfter(false);
        }
    };

    // Submit Work Update
    const handleSubmit = async () => {
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (!description.trim()) return toast.error("Work description is required");
        if (beforePhotos.length === 0 || afterPhotos.length === 0) {
            return toast.error("Please upload before and after photos");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading(editingUpdateId ? `Submitting work update #${editingUpdateId}...` : "Creating and submitting work update...");

        try {
            const activeUpdateId = await getOrCreateWorkUpdateId();
            if (!activeUpdateId) {
                toast.dismiss(loadingToast);
                return;
            }

            await uploadBeforeImagesForUpdate(activeUpdateId);
            await uploadAfterImagesForUpdate(activeUpdateId);

            const formattedEndTime = formatTimeToHms(endTime, "17:30:00");
            const numericTotalHours = calculateTotalHoursNumber(startTime, endTime);
            const submitPayload: SubmitWorkUpdatePayload = {
                end_time: formattedEndTime,
                total_hours: numericTotalHours,
            };
            if (afterRemarks && afterRemarks.trim()) {
                submitPayload.after_remarks = afterRemarks.trim();
            }

            await workUpdateService.submitWorkUpdate(activeUpdateId, submitPayload);

            try {
                await projectService.updateTaskStatus(Number(projectId), Number(selectedTaskId), 'Completed');
                persistCompletedTaskId(selectedTaskId);
            } catch (statusErr) {
                console.warn("Task status update sync warning:", statusErr);
                persistCompletedTaskId(selectedTaskId);
            }

            toast.success(`Work update #${activeUpdateId} submitted successfully!`, { id: loadingToast });
            setEditingUpdateId(null);
            setSelectedTaskId('');

            localStorage.removeItem(persistenceKey);
            setDescription('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setBeforeRemarks('');
            setAfterRemarks('');

            await fetchInitialData();
        } catch (err: any) {
            console.error("handleSubmit error:", err);
            const errMsg = formatApiErrorMessage(err, "Failed to submit work update");
            toast.error(errMsg, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to reset the form? Any unsaved changes will be cleared.")) {
            localStorage.removeItem(persistenceKey);
            setEditingUpdateId(null);
            setDescription('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setBeforeRemarks('');
            setAfterRemarks('');
            setLocation('');
            toast.success("Form reset");
        }
    };

    const [totalHours, setTotalHours] = useState('8h 30m');
    const persistenceKey = taskId ? `work_update_data_${taskId}` : `work_update_data_last_draft`;

    useEffect(() => {
        const savedData = localStorage.getItem(persistenceKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.description !== undefined) setDescription(data.description);
            if (data.beforePhotos) setBeforePhotos(data.beforePhotos);
            if (data.afterPhotos) setAfterPhotos(data.afterPhotos);
            if (data.workDate) setWorkDate(data.workDate);
            if (data.startTime) setStartTime(data.startTime);
            if (data.endTime) setEndTime(data.endTime);
            if (data.category) setCategory(data.category);
            if (data.location) setLocation(data.location);
            if (data.beforeRemarks !== undefined) setBeforeRemarks(data.beforeRemarks);
            if (data.afterRemarks !== undefined) setAfterRemarks(data.afterRemarks);
        }
    }, [persistenceKey]);

    useEffect(() => {
        const dataToSave = {
            description, beforePhotos, afterPhotos, workDate, 
            startTime, endTime, category, location, beforeRemarks, afterRemarks
        };
        safeSetItem(persistenceKey, JSON.stringify(dataToSave));
    }, [description, beforePhotos, afterPhotos, workDate, startTime, endTime, category, location, beforeRemarks, afterRemarks, persistenceKey]);

    useEffect(() => {
        if (startTime && endTime) {
            const [sH, sM] = startTime.split(':').map(Number);
            const [eH, eM] = endTime.split(':').map(Number);
            let diff = (eH * 60 + eM) - (sH * 60 + sM);
            if (diff < 0) diff += 24 * 60;
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            setTotalHours(`${h}h ${m}m`);
        }
    }, [startTime, endTime]);

    const handleFiles = async (files: FileList | File[] | null, type: 'before' | 'after') => {
        if (!files) return;
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        for (const file of fileArray) {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }
            if (file.size > 15 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 15MB`);
                continue;
            }

            try {
                const base64String = await compressImageFile(file);
                if (type === 'before') {
                    setBeforePhotos(prev => {
                        if (prev.length >= 4) {
                            toast.error("Max 4 Before photos allowed");
                            return prev;
                        }
                        return [...prev, base64String];
                    });
                } else {
                    setAfterPhotos(prev => {
                        if (prev.length >= 4) {
                            toast.error("Max 4 After photos allowed");
                            return prev;
                        }
                        return [...prev, base64String];
                    });
                }
            } catch (err) {
                console.error("Failed to process uploaded image:", err);
            }
        }
    };

    const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') setBeforePhotos(prev => prev.filter((_, i) => i !== index));
        else setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Print / PDF Handler for any Work Update item
    const handlePrintWorkUpdate = (item: any) => {
        const { before, after } = extractUpdateImages(item);
        const printContent = `
            <html>
            <head>
                <title>Work Update #${item.id} - ${item.task_title || 'Report'}</title>
                <style>
                    @page { margin: 15mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; }
                    .header { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; }
                    .header h1 { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
                    .header p { font-size: 11px; opacity: 0.9; }
                    .body { padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
                    .section { margin-bottom: 16px; }
                    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                    .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
                    .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
                    .field span { font-size: 12px; font-weight: 700; color: #0f172a; word-break: break-word; }
                    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; white-space: pre-wrap; font-size: 12px; color: #334155; }
                    .photos-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
                    .photo-box { width: 120px; height: 120px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; background: #000; }
                    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
                    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h1>InfraPilot &mdash; Work Update Report</h1>
                            <p>Update ID: #${item.id} &nbsp;|&nbsp; Project: ${item.project_name || currentProjectName} &nbsp;|&nbsp; Task ID: #${item.task_id || 'N/A'}</p>
                        </div>
                        <span class="status-badge">${item.display_status || 'Submitted'}</span>
                    </div>
                </div>
                <div class="body">
                    <div class="section">
                        <div class="section-title">Task & Activity Details</div>
                        <div class="grid">
                            <div class="field"><label>Task Name</label><span>${item.task_title || 'General Task'}</span></div>
                            <div class="field"><label>Activity Type</label><span>${item.activity_name || 'General'}</span></div>
                            <div class="field"><label>Location / Area</label><span>${item.location || '—'}</span></div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">Time & Schedule</div>
                        <div class="grid">
                            <div class="field"><label>Work Date</label><span>${item.work_date || today}</span></div>
                            <div class="field"><label>Working Hours</label><span>${item.start_time || '09:00'} &mdash; ${item.end_time || '17:30'}</span></div>
                            <div class="field"><label>Total Duration</label><span>${item.raw_hours || 8.5} hours</span></div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">Work Description</div>
                        <div class="desc-box">${item.work_description || item.description || '—'}</div>
                    </div>
                    ${item.before_remarks ? `
                        <div class="section">
                            <div class="section-title">Before Work Remarks</div>
                            <div class="desc-box">${item.before_remarks}</div>
                        </div>
                    ` : ''}
                    ${item.after_remarks ? `
                        <div class="section">
                            <div class="section-title">After Work Remarks</div>
                            <div class="desc-box">${item.after_remarks}</div>
                        </div>
                    ` : ''}
                    <div class="section">
                        <div class="section-title">Before Work Photos (${before.length})</div>
                        ${before.length > 0 ? `
                            <div class="photos-container">
                                ${before.map(url => `<div class="photo-box"><img src="${url}" alt="Before Work" /></div>`).join('')}
                            </div>
                        ` : '<p style="color:#94a3b8; font-size:11px;">No before photos attached</p>'}
                    </div>
                    <div class="section">
                        <div class="section-title">After Work Photos (${after.length})</div>
                        ${after.length > 0 ? `
                            <div class="photos-container">
                                ${after.map(url => `<div class="photo-box"><img src="${url}" alt="After Work" /></div>`).join('')}
                            </div>
                        ` : '<p style="color:#94a3b8; font-size:11px;">No after photos attached</p>'}
                    </div>
                    <div class="footer">
                        <span>Generated on ${new Date().toLocaleString()} by ${user?.name || 'Labour Worker'}</span>
                        <span>InfraPilot Construction Management System &bull; Confidential</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=900,height=750');
        if (!printWindow) return;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // Export PDF of History
    const handleExportPDF = async () => {
        const loadingToast = toast.loading("Generating Work Updates PDF...");
        const activePid = Number(projectId || currentProjectId || activeProjectId || 2);
        
        // 1. Try backend PDF export API (GET /api/v1/work-updates/export?project_id=...&format=pdf)
        try {
            const data = await workUpdateService.exportWorkUpdates({ project_id: activePid, format: 'pdf' });
            if (data instanceof Blob && data.size > 0 && data.type !== 'application/json') {
                const url = URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = `work-updates-history-${activePid || 'all'}-${workDate || today}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Work updates PDF downloaded successfully", { id: loadingToast });
                return;
            }
        } catch (exportErr) {
            console.warn("Backend export PDF API fallback to client PDF generator:", exportErr);
        }

        // 2. Client-side PDF generation fallback with jsPDF & autoTable
        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            
            // Header bar
            doc.setFillColor(37, 99, 235); // Blue #2563eb
            doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("InfraPilot - Work Updates & Progress Report", 14, 15);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Project: ${currentProjectName || `Project #${activePid}`}  |  Generated on: ${new Date().toLocaleDateString()}  |  Total Records: ${filteredHistory.length}`, doc.internal.pageSize.width - 14, 15, { align: 'right' });

            const tableRows = filteredHistory.map((item, idx) => [
                idx + 1,
                item.task_title || `Task #${item.task_id || 'N/A'}`,
                item.activity_name || item.category || 'General',
                item.work_date || today,
                `${item.start_time ? item.start_time.slice(0, 5) : '09:00'} - ${item.end_time ? item.end_time.slice(0, 5) : '17:30'} (${item.raw_hours || 8.5}h)`,
                item.location || '—',
                item.work_description || item.description || '—',
                item.display_status || 'Submitted',
                `B: ${item.before_images_list?.length || 0}, A: ${item.after_images_list?.length || 0}`
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['#', 'Task', 'Activity', 'Date', 'Time & Hours', 'Location', 'Work Summary', 'Status', 'Photos']],
                body: tableRows,
                headStyles: {
                    fillColor: [15, 23, 42], // Slate 900
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                bodyStyles: {
                    fontSize: 8.5,
                    textColor: [30, 41, 59],
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 45, fontStyle: 'bold' },
                    2: { cellWidth: 28 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 'auto' },
                    7: { cellWidth: 24, halign: 'center' },
                    8: { cellWidth: 20, halign: 'center' },
                },
                margin: { left: 14, right: 14, bottom: 15 },
                didDrawPage: (data) => {
                    const str = `Page ${data.pageNumber} | InfraPilot Construction Management System`;
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
                }
            });

            doc.save(`work-updates-history-${activePid || 'report'}-${workDate || today}.pdf`);
            toast.success("Work updates PDF downloaded successfully", { id: loadingToast });
        } catch (pdfErr) {
            console.error("Failed to generate PDF:", pdfErr);
            toast.error("Failed to export PDF", { id: loadingToast });
        }
    };

    return (
        <>
            <Navbar title="Work Update" breadcrumb={['InfraPilot', 'Labour', 'Daily Update', 'Work Update']} />
            <PageTransition className="p-4 md:p-8 bg-[#f8fafc] min-h-screen font-inter pb-24 space-y-8">
                
                {/* ── 1. Top Section: Daily Work Update Submission Form ──────────── */}
                <div className="max-w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    
                    {/* Header Section */}
                    <div className="p-6 md:p-8 pb-4 flex items-center justify-between gap-5 flex-wrap border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {editingUpdateId ? `Edit Work Update #${editingUpdateId}` : 'Update Your Work Progress'}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium">Provide details of work completed along with photo verification</p>
                            </div>
                        </div>

                        {editingUpdateId && (
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-800">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold">Editing Existing Update #{editingUpdateId}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingUpdateId(null);
                                        setDescription('');
                                        setBeforePhotos([]);
                                        setAfterPhotos([]);
                                        setBeforeRemarks('');
                                        setAfterRemarks('');
                                        toast.success("Switched to New Update mode");
                                    }}
                                    className="ml-2 text-xs font-black text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-xs"
                                >
                                    + New Update
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 md:p-8 space-y-8">

                        {/* Task Selection Section */}
                        <div className="space-y-4">
                            {!taskId ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Select Task <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedTaskId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedTaskId(val);
                                                const found = tasks.find((t: any) => String(t.id) === String(val));
                                                if (found) {
                                                    if (!description || description.trim() === '') {
                                                        setDescription(found.description && found.description !== 'NA' ? found.description : (found.title || found.name || ''));
                                                    }
                                                    if (found.category || found.activity_type) {
                                                        setCategory(found.category || found.activity_type);
                                                    }
                                                    if (found.location || found.area || found.site_location) {
                                                        setLocation(found.location || found.area || found.site_location);
                                                    }
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                        >
                                            <option value="">{displayTasks.length > 0 ? "Select an Active Task to Update" : "No Active Tasks Available"}</option>
                                            {displayTasks.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    #{t.id} - {t.title || t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Task</label>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{taskName || 'Selected Task'}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase">Mission Update in Progress</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-1">Task ID</span>
                                            <span className="text-sm font-black text-blue-600">#{taskId}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Work Description Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Work Description <span className="text-red-500">*</span></label>
                            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-all bg-white">
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                    placeholder="Write a detailed description of the work completed on site..."
                                    className="w-full p-4 min-h-[110px] focus:outline-none text-slate-700 text-sm placeholder:text-slate-300 font-medium"
                                />
                                <div className="p-2 px-4 bg-slate-50/50 flex justify-end border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{description.length}/1000</span>
                                </div>
                            </div>
                        </div>

                        {/* Photo Upload Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Before Work Photos */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">Before Work Photos <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveBeforePhotos}
                                            disabled={isUploadingBefore || isCreating || isSubmitting}
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploadingBefore ? 'Saving...' : 'Save'}
                                        </button>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{beforePhotos.length} / 4</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">Upload photos before starting the work (Max 4)</p>
                                <input 
                                    type="file" 
                                    ref={beforeInputRef}
                                    id="before-upload" 
                                    accept="image/*" 
                                    multiple
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files) handleFiles(e.target.files, 'before');
                                        e.target.value = '';
                                    }} 
                                />
                                <div 
                                    onClick={() => beforeInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files, 'before');
                                    }}
                                    className="w-full py-7 border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-2xl flex flex-col items-center justify-center gap-2.5 hover:bg-blue-50/40 hover:border-blue-400 transition-all group cursor-pointer"
                                >
                                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform border border-blue-100">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag &amp; drop Before photos</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to browse files</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 15MB</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Preview</p>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[60px]">
                                        {beforePhotos.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {beforePhotos.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-xs group">
                                                        <img src={url} alt="Before" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePhoto('before', i); }}
                                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 font-medium">No images uploaded yet</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mt-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Before Work Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={beforeRemarks}
                                            onChange={(e) => setBeforeRemarks(e.target.value.slice(0, 500))}
                                            placeholder="Remarks on initial site conditions, materials, or preparations..."
                                            className="w-full p-3 min-h-[75px] border border-slate-200 rounded-xl text-slate-700 text-xs placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all font-medium"
                                        />
                                        <div className="absolute right-3 bottom-2">
                                            <span className="text-[9px] font-bold text-slate-400 tabular-nums">{beforeRemarks.length}/500</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* After Work Photos */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">After Work Photos <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveAfterPhotos}
                                            disabled={isUploadingAfter || isCreating || isSubmitting}
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploadingAfter ? 'Saving...' : 'Save'}
                                        </button>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{afterPhotos.length} / 4</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">Upload photos after completing the work (Max 4)</p>
                                <input 
                                    type="file" 
                                    ref={afterInputRef}
                                    id="after-upload" 
                                    accept="image/*" 
                                    multiple
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files) handleFiles(e.target.files, 'after');
                                        e.target.value = '';
                                    }} 
                                />
                                <div 
                                    onClick={() => afterInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files, 'after');
                                    }}
                                    className="w-full py-7 border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-2xl flex flex-col items-center justify-center gap-2.5 hover:bg-blue-50/40 hover:border-blue-400 transition-all group cursor-pointer"
                                >
                                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform border border-blue-100">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag &amp; drop After photos</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to browse files</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 15MB</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Preview</p>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[60px]">
                                        {afterPhotos.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {afterPhotos.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-xs group">
                                                        <img src={url} alt="After" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePhoto('after', i); }}
                                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 font-medium">No images uploaded yet</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mt-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">After Work Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={afterRemarks}
                                            onChange={(e) => setAfterRemarks(e.target.value.slice(0, 500))}
                                            placeholder="Remarks on completed quality, finishing, or handover status..."
                                            className="w-full p-3 min-h-[75px] border border-slate-200 rounded-xl text-slate-700 text-xs placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all font-medium"
                                        />
                                        <div className="absolute right-3 bottom-2">
                                            <span className="text-[9px] font-bold text-slate-400 tabular-nums">{afterRemarks.length}/500</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date and Time Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Work Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="date" 
                                        value={workDate}
                                        onChange={(e) => setWorkDate(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Start Time <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="time" 
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">End Time <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="time" 
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Total Hours</label>
                                <div className="relative">
                                    <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={totalHours}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dropdowns Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Activity Type <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Activity Type</option>
                                        {activityTypes.length > 0 ? (
                                            activityTypes.map((at) => (
                                                <option key={at.id} value={at.name}>{at.name}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Reinforcement">Reinforcement</option>
                                                <option value="Concreting">Concreting</option>
                                                <option value="Masonry">Masonry</option>
                                                <option value="Excavation">Excavation</option>
                                                <option value="Plastering">Plastering</option>
                                                <option value="Painting">Painting</option>
                                                <option value="Electrical">Electrical</option>
                                                <option value="Plumbing">Plumbing</option>
                                                <option value="Carpentry">Carpentry</option>
                                                <option value="Flooring">Flooring</option>
                                                <option value="Waterproofing">Waterproofing</option>
                                                <option value="General">General</option>
                                            </>
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Location / Area <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Block B, 2nd Floor, Pillar P14"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 flex-wrap gap-4">
                            <button 
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting || isCreating || isUploadingBefore || isUploadingAfter}
                                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Reset Form
                            </button>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isCreating || isUploadingBefore || isUploadingAfter}
                                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-3 hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Submitting...' : isCreating ? 'Creating...' : isUploadingBefore ? 'Uploading Before Photos...' : isUploadingAfter ? 'Uploading After Photos...' : 'Submit Daily Update'}
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>

                {/* ── 2. Bottom Section: Dedicated Previous Tasks & Work Updates History Table ── */}
                <div className="max-w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    
                    {/* Header & Actions Bar */}
                    <div className="p-6 md:p-8 pb-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                                <History className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    Previous Tasks &amp; Work Updates History
                                    <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-full font-black border border-blue-100">
                                        {filteredHistory.length} Record{filteredHistory.length !== 1 ? 's' : ''}
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Review submitted daily progress, past completed tasks, logged hours, and photo verifications
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={() => fetchInitialData(true)}
                                disabled={isHistoryRefreshing}
                                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all active:scale-95 cursor-pointer"
                                title="Refresh History Data"
                            >
                                <RefreshCw className={`w-4 h-4 ${isHistoryRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>Export PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="p-6 pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 bg-white">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search history by task, activity, description, location, or remarks..."
                                value={historySearch}
                                onChange={(e) => {
                                    setHistorySearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
                            />
                            {historySearch && (
                                <button
                                    type="button"
                                    onClick={() => setHistorySearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Status filter */}
                            <select
                                value={historyStatusFilter}
                                onChange={(e) => {
                                    setHistoryStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="Completed">Completed</option>
                                <option value="Submitted">Submitted</option>
                                <option value="In Progress">In Progress</option>
                            </select>

                            {/* Date filter */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={historyDateFilter}
                                    onChange={(e) => {
                                        setHistoryDateFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
                                />
                            </div>

                            {(historySearch || historyStatusFilter !== 'ALL' || historyDateFilter) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHistorySearch('');
                                        setHistoryStatusFilter('ALL');
                                        setHistoryDateFilter('');
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-xl transition-all border border-rose-100 cursor-pointer"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th className="py-4 px-6">Task</th>
                                    <th className="py-4 px-4">Date &amp; Time</th>
                                    <th className="py-4 px-4">Photos Proof</th>
                                    <th className="py-4 px-4 min-w-[200px]">Work Summary</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedHistory.length > 0 ? (
                                    paginatedHistory.map((item) => {
                                        const { before, after } = extractUpdateImages(item);
                                        const isCurrentEditing = editingUpdateId === item.id;

                                        return (
                                            <tr 
                                                key={item.id} 
                                                className={`hover:bg-blue-50/40 transition-colors group ${isCurrentEditing ? 'bg-blue-50/60 font-medium' : ''}`}
                                            >
                                                {/* Task Info */}
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setSelectedHistoryItem(item)}>
                                                        {item.task_title || 'Work Update'}
                                                    </p>
                                                </td>

                                                {/* Date & Time */}
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span>{item.work_date || today}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                                                            <span>{item.start_time ? item.start_time.slice(0, 5) : '09:00'} - {item.end_time ? item.end_time.slice(0, 5) : '17:30'}</span>
                                                            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-700">
                                                                {item.raw_hours || 8.5}h
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Photo Proof */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {before.length > 0 && (
                                                            <div 
                                                                onClick={() => setLightboxImage({ url: before[0], title: `Before Photo - Update #${item.id}` })}
                                                                className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group/img hover:border-blue-500 transition-all shadow-xs"
                                                                title={`Before Work (${before.length} photo${before.length > 1 ? 's' : ''})`}
                                                            >
                                                                <img src={before[0]} alt="Before" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                                                                <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-white text-[8px] font-black text-center py-0.5">
                                                                    B ({before.length})
                                                                </div>
                                                            </div>
                                                        )}
                                                        {after.length > 0 && (
                                                            <div 
                                                                onClick={() => setLightboxImage({ url: after[0], title: `After Photo - Update #${item.id}` })}
                                                                className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group/img hover:border-emerald-500 transition-all shadow-xs"
                                                                title={`After Work (${after.length} photo${after.length > 1 ? 's' : ''})`}
                                                            >
                                                                <img src={after[0]} alt="After" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                                                                <div className="absolute inset-x-0 bottom-0 bg-emerald-900/80 text-white text-[8px] font-black text-center py-0.5">
                                                                    A ({after.length})
                                                                </div>
                                                            </div>
                                                        )}
                                                        {before.length === 0 && after.length === 0 && (
                                                            <span className="text-[11px] text-slate-400 font-medium italic">No media</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Work Summary & Remarks */}
                                                <td className="py-4 px-4">
                                                    <p className="font-semibold text-slate-700 line-clamp-2 leading-relaxed">
                                                        {item.work_description || item.description || 'No detailed description provided'}
                                                    </p>
                                                    {(item.before_remarks || item.after_remarks) && (
                                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                            {item.before_remarks && (
                                                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[150px]" title={`Before: ${item.before_remarks}`}>
                                                                    B: {item.before_remarks}
                                                                </span>
                                                            )}
                                                            {item.after_remarks && (
                                                                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[150px]" title={`After: ${item.after_remarks}`}>
                                                                    A: {item.after_remarks}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(item.display_status)}`}>
                                                        {item.display_status === 'Completed' ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Clock className="w-3 h-3 text-blue-600" />
                                                        )}
                                                        {item.display_status || 'Submitted'}
                                                    </span>
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedHistoryItem(item)}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1"
                                                            title="View Full Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <FolderKanban className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">No work updates match your filter criteria</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or activity filters, or submit a new work update above.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-5 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 bg-white">
                        <div className="flex items-center gap-2">
                            <span>Showing {filteredHistory.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} entries</span>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1.5">
                                <span>Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-bold focus:outline-none cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={8}>8</option>
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-slate-700 cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>
                            
                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1)
                                    .filter(p => p === 1 || p === totalHistoryPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                    .map((pageNum, idx, arr) => (
                                        <React.Fragment key={pageNum}>
                                            {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                                                <span className="px-1 text-slate-400">...</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        </React.Fragment>
                                    ))
                                }
                            </div>

                            <button
                                type="button"
                                disabled={currentPage >= totalHistoryPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalHistoryPages))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-slate-700 cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

            </PageTransition>

            {/* ── 3. Work Update Detail Modal ───────────────────────────────────── */}
            {selectedHistoryItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                                        Update #{selectedHistoryItem.id}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                                        {selectedHistoryItem.work_date || today}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold">{selectedHistoryItem.task_title || 'Work Update Details'}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedHistoryItem(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Activity Type</p>
                                    <p className="text-xs font-black text-slate-800 mt-0.5">{selectedHistoryItem.activity_name || 'General'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Location / Area</p>
                                    <p className="text-xs font-black text-slate-800 mt-0.5">{selectedHistoryItem.location || 'Site'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Time &amp; Hours</p>
                                    <p className="text-xs font-black text-slate-800 mt-0.5">
                                        {selectedHistoryItem.start_time?.slice(0, 5) || '09:00'} - {selectedHistoryItem.end_time?.slice(0, 5) || '17:30'} ({selectedHistoryItem.raw_hours || 8.5}h)
                                    </p>
                                </div>
                            </div>

                            {/* Work Description */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Description</p>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedHistoryItem.work_description || selectedHistoryItem.description || 'No description provided'}
                                </div>
                            </div>

                            {/* Before & After Photos Side-by-Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {/* Before Photos */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                            Before Work Photos
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400">{selectedHistoryItem.before_images_list?.length || 0} attached</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[100px]">
                                        {selectedHistoryItem.before_images_list?.length > 0 ? (
                                            selectedHistoryItem.before_images_list.map((url: string, i: number) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setLightboxImage({ url, title: `Before Work Photo #${i + 1} (Update #${selectedHistoryItem.id})` })}
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-xs"
                                                >
                                                    <img src={url} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                            ))
                                        ) : (
                                            <p className="col-span-2 text-[11px] text-slate-400 font-medium p-4 text-center">No Before photos attached</p>
                                        )}
                                    </div>
                                    {selectedHistoryItem.before_remarks && (
                                        <p className="text-[11px] text-slate-500 bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
                                            <strong className="text-blue-700">Remarks:</strong> {selectedHistoryItem.before_remarks}
                                        </p>
                                    )}
                                </div>

                                {/* After Photos */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                            After Work Photos
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400">{selectedHistoryItem.after_images_list?.length || 0} attached</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[100px]">
                                        {selectedHistoryItem.after_images_list?.length > 0 ? (
                                            selectedHistoryItem.after_images_list.map((url: string, i: number) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setLightboxImage({ url, title: `After Work Photo #${i + 1} (Update #${selectedHistoryItem.id})` })}
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-xs"
                                                >
                                                    <img src={url} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                            ))
                                        ) : (
                                            <p className="col-span-2 text-[11px] text-slate-400 font-medium p-4 text-center">No After photos attached</p>
                                        )}
                                    </div>
                                    {selectedHistoryItem.after_remarks && (
                                        <p className="text-[11px] text-slate-500 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg">
                                            <strong className="text-emerald-700">Remarks:</strong> {selectedHistoryItem.after_remarks}
                                        </p>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => handlePrintWorkUpdate(selectedHistoryItem)}
                                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5 text-slate-500" />
                                <span>Print / Export PDF</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const idToLoad = selectedHistoryItem.id;
                                        setSelectedHistoryItem(null);
                                        handleLoadWorkUpdate(idToLoad);
                                    }}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Load in Editor Form</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── 4. Image Lightbox Modal ───────────────────────────────────────── */}
            {lightboxImage && (
                <div 
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col cursor-default"
                    >
                        <div className="p-4 bg-slate-900/90 text-white flex items-center justify-between border-b border-slate-800">
                            <p className="text-xs font-bold truncate max-w-md">{lightboxImage.title}</p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={lightboxImage.url}
                                    download="work-update-photo.jpg"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                                    title="Open / Download Full Size"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setLightboxImage(null)}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-black/50 overflow-auto max-h-[80vh]">
                            <img 
                                src={lightboxImage.url} 
                                alt={lightboxImage.title} 
                                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WorkUpdatesPage;
