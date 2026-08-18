import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    History,
    Download,
    FileDown,
    Edit,
    Trash2,
    Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

import { projectService } from '../../services/projectService';
import { masterService, type MasterEntity } from '../../services/masterService';
import type { 
    CreateWorkUpdatePayload, 
    SubmitWorkUpdatePayload 
} from '../../services/workUpdateService';
import { workUpdateService } from '../../services/workUpdateService';
import { safeSetItem, compressImageFile } from '../../utils/storageUtils';

const ACTIVITY_TYPE_MAP: Record<string, number> = {
    "reinforcement": 1,
    "concreting": 2,
    "masonry": 3,
    "brickwork": 3,
    "brick": 3,
    "excavation": 4,
    "plastering": 5,
    "painting": 6,
    "electrical": 7,
    "plumbing": 8,
    "carpentry": 9,
    "flooring": 10,
    "waterproofing": 11,
    "general": 1,
};

const ACTIVITY_TYPE_NAMES: Record<number, string> = {
    1: "Reinforcement",
    2: "Concreting",
    3: "Masonry",
    4: "Excavation",
    5: "Plastering",
    6: "Painting",
    7: "Electrical",
    8: "Plumbing",
    9: "Carpentry",
    10: "Flooring",
    11: "Waterproofing",
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
    
    // Plain string error
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

    const query = new URLSearchParams(useLocation().search);
    const taskId = query.get('taskId');
    const projectId = query.get('projectId') || '4';
    const taskName = query.get('taskName');
    const taskCategory = query.get('taskCategory');

    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    // Current date for default
    const today = new Date().toISOString().split('T')[0];

    // State matching the screenshot fields
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
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [myUpdates, setMyUpdates] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);

    // Filter tasks assigned to current user (e.g. Ramesh Sharma)
    const displayTasks = useMemo(() => {
        const currentUserName = (user?.name || user?.username || 'Ramesh Sharma').toLowerCase();
        const currentUserId = user?.id ? Number(user.id) : null;

        const filtered = tasks.filter((t: any) => {
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
        });

        return filtered;
    }, [tasks, user]);

    // Fetch tasks, activity types, my work updates, and project timeline
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await projectService.getTasks(Number(projectId));
                const items = Array.isArray(response) ? response : (response.items || []);
                setTasks(items);
                
                // If we have a taskName/taskId from query, try to find it in the list to sync category
                if (taskId && items.length > 0) {
                    const currentTask = items.find((t: any) => String(t.id) === String(taskId));
                    if (currentTask && !category) {
                        setCategory(currentTask.category || currentTask.description?.split('|')[0]?.trim() || '');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
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
                const updates = await workUpdateService.getMyWorkUpdates({ project_id: Number(projectId) });
                setMyUpdates(updates);
                
                // Extract photos from my updates to populate prior site history dynamically
                const apiPhotos: string[] = [];
                updates.forEach((u: any) => {
                    if (Array.isArray(u.before_images)) apiPhotos.push(...u.before_images);
                    if (Array.isArray(u.after_images)) apiPhotos.push(...u.after_images);
                    if (Array.isArray(u.images)) {
                        u.images.forEach((img: any) => {
                            const url = img.image_url || img.url || img.path;
                            if (url) apiPhotos.push(url);
                        });
                    }
                });
                if (apiPhotos.length > 0) {
                    setPriorPhotos(prev => [...apiPhotos, ...prev].slice(0, 8));
                }
            } catch (err) {
                console.warn("Failed to fetch my work updates:", err);
            }

            // Fetch Project Work-Update Timeline (GET /api/v1/work-updates/project/{project_id}/timeline)
            try {
                const timelineData = await workUpdateService.getProjectTimeline(Number(projectId));
                setTimeline(timelineData);
            } catch (err) {
                console.warn("Failed to fetch project timeline:", err);
            }
        };
        fetchInitialData();
    }, [projectId, taskId]);

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
            
            if (Array.isArray(data.images) && data.images.length > 0) {
                const beforeImgs = data.images.filter((img: any) => img.image_type === 'before' || img.type === 'before').map((img: any) => img.image_url || img.url || img.path);
                const afterImgs = data.images.filter((img: any) => img.image_type === 'after' || img.type === 'after').map((img: any) => img.image_url || img.url || img.path);
                if (beforeImgs.length > 0) setBeforePhotos(beforeImgs);
                if (afterImgs.length > 0) setAfterPhotos(afterImgs);
            }
            if (Array.isArray(data.before_images) && data.before_images.length > 0) setBeforePhotos(data.before_images);
            if (Array.isArray(data.after_images) && data.after_images.length > 0) setAfterPhotos(data.after_images);
            
            toast.success(`Loaded Work Update #${id}`, { id: loadingToast });
        } catch (err: any) {
            console.error("Failed to fetch work update:", err);
            toast.error(formatApiErrorMessage(err, "Failed to load work update details"), { id: loadingToast });
        }
    };

    // DELETE /api/v1/work-updates/{work_update_id}
    const handleDeleteWorkUpdate = async (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete Work Update #${id}?`)) return;

        const loadingToast = toast.loading(`Deleting Work Update #${id}...`);
        try {
            await workUpdateService.deleteWorkUpdate(id);
            toast.success(`Work Update #${id} deleted`, { id: loadingToast });
            setMyUpdates(prev => prev.filter(u => u.id !== id));
            setTimeline(prev => prev.filter(t => t.id !== id));
            if (editingUpdateId === id) {
                setEditingUpdateId(null);
                setDescription('');
                setBeforePhotos([]);
                setAfterPhotos([]);
            }
        } catch (err: any) {
            console.error("Failed to delete work update:", err);
            toast.error(formatApiErrorMessage(err, "Failed to delete work update"), { id: loadingToast });
        }
    };

    /**
     * 1. Create Work Update API
     * POST /api/v1/work-updates
     * Content-Type: application/json
     * Payload: project_id, task_id, activity_type_id, work_description, before_remarks, work_date, start_time, location
     */
    const getOrCreateWorkUpdateId = async (): Promise<number | null> => {
        if (editingUpdateId) return editingUpdateId;

        const targetTaskId = selectedTaskId || taskId || (displayTasks.length > 0 ? String(displayTasks[0].id) : tasks.length > 0 ? String(tasks[0].id) : '1');
        if (!selectedTaskId) setSelectedTaskId(targetTaskId);

        const currentTask = tasks.find((t: any) => String(t.id) === String(targetTaskId));
        const activityTypeId = resolveActivityTypeId(category, currentTask, activityTypes);

        const payload: CreateWorkUpdatePayload = {
            project_id: Number(projectId || 4),
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

    /**
     * 3. Upload Before Images
     * POST /api/v1/work-updates/{work_update_id}/before-image
     */
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

    /**
     * 4. Upload After Images
     * POST /api/v1/work-updates/{work_update_id}/after-image
     */
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

            // Update status to "In Progress"
            try {
                await projectService.updateTaskStatus(Number(projectId), Number(targetTaskId), 'In Progress');
                safeSetItem(`task_status_${targetTaskId}`, 'In Progress');
            } catch (_) {}

            if (failed === 0) {
                toast.success(`Work Update #${activeUpdateId} saved with ${success} Before image(s)!`, { id: loadingToast });
            } else {
                toast.success(`Work Update #${activeUpdateId} saved. (${success} uploaded, ${failed} failed)`, { id: loadingToast });
            }
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

            // Update status to "Completed"
            try {
                await projectService.updateTaskStatus(Number(projectId), Number(targetTaskId), 'Completed');
                safeSetItem(`task_status_${targetTaskId}`, 'Completed');
            } catch (_) {}

            if (failed === 0) {
                toast.success(`Work Update #${activeUpdateId} saved with ${success} After image(s)!`, { id: loadingToast });
            } else {
                toast.success(`Work Update #${activeUpdateId} saved. (${success} uploaded, ${failed} failed)`, { id: loadingToast });
            }
        } catch (err: any) {
            console.error('[handleSaveAfterPhotos] Error:', err);
            toast.error(formatApiErrorMessage(err, "Failed to save After Work details"), { id: loadingToast });
        } finally {
            setIsUploadingAfter(false);
        }
    };

    /**
     * 5. Submit Work Update
     * POST /api/v1/work-updates/{work_update_id}/submit
     * Content-Type: application/json
     * Payload: { end_time, after_remarks, total_hours }
     */
    const handleSubmit = async () => {
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (!description.trim()) return toast.error("Work description is required");
        if (beforePhotos.length === 0 || afterPhotos.length === 0) {
            return toast.error("Please upload before and after photos");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading(editingUpdateId ? `Submitting work update #${editingUpdateId}...` : "Creating and submitting work update...");

        try {
            // 1. Create or get Work Update ID (POST /api/v1/work-updates with application/json)
            const activeUpdateId = await getOrCreateWorkUpdateId();
            if (!activeUpdateId) {
                toast.dismiss(loadingToast);
                return;
            }

            // 2. Upload Before Images (POST /api/v1/work-updates/{id}/before-image)
            await uploadBeforeImagesForUpdate(activeUpdateId);

            // 3. Upload After Images (POST /api/v1/work-updates/{id}/after-image)
            await uploadAfterImagesForUpdate(activeUpdateId);

            // 4. Submit Work Update (POST /api/v1/work-updates/{id}/submit with application/json)
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

            // 5. Sync Task Status to Completed
            try {
                await projectService.updateTaskStatus(Number(projectId), Number(selectedTaskId), 'Completed');
                safeSetItem(`task_status_${selectedTaskId}`, 'Completed');
            } catch (statusErr) {
                console.warn("Task status update sync warning:", statusErr);
            }

            toast.success(`Work update #${activeUpdateId} submitted successfully!`, { id: loadingToast });
            setEditingUpdateId(null);

            // Save photos to history
            const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const currentUpdatePhotos = [...beforePhotos, ...afterPhotos];
            const filteredOldHistory = existingHistory.filter((p: string) => !currentUpdatePhotos.includes(p));
            const newHistory = [...currentUpdatePhotos, ...filteredOldHistory].slice(0, 8);
            safeSetItem(historyKey, JSON.stringify(newHistory));
            setPriorPhotos(newHistory);

            // Clear draft form
            localStorage.removeItem(persistenceKey);
            setDescription('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setBeforeRemarks('');
            setAfterRemarks('');

            // Refresh My Work Updates & Timeline
            try {
                const [refreshedUpdates, refreshedTimeline] = await Promise.all([
                    workUpdateService.getMyWorkUpdates({ project_id: Number(projectId) }),
                    workUpdateService.getProjectTimeline(Number(projectId))
                ]);
                setMyUpdates(refreshedUpdates);
                setTimeline(refreshedTimeline);
            } catch (e) {
                console.warn("Refresh work updates failed:", e);
            }
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

    const [priorPhotos, setPriorPhotos] = useState<string[]>([
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=200",
        "https://images.unsplash.com/photo-1510673398445-94f476ef2ca9?auto=format&fit=crop&q=80&w=200",
        "https://images.unsplash.com/photo-1590069230002-70cc6945ebd7?auto=format&fit=crop&q=80&w=200",
        "https://images.unsplash.com/photo-1503387762-592dee581106?auto=format&fit=crop&q=80&w=200"
    ]);

    // Calculated state
    const [totalHours, setTotalHours] = useState('8h 30m');

    // Persistence keys
    const persistenceKey = taskId ? `work_update_data_${taskId}` : `work_update_data_last_draft`;
    const historyKey = taskId ? `task_history_photos_${taskId}` : `task_history_photos_global`;

    // Persistence: Load data on mount
    useEffect(() => {
        // Load current update data
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

        // Load Historical Photos
        const savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
            setPriorPhotos(JSON.parse(savedHistory));
        }
    }, [persistenceKey, historyKey]);

    // Persistence: Save data on any change
    useEffect(() => {
        const dataToSave = {
            description, beforePhotos, afterPhotos, workDate, 
            startTime, endTime, category, location, beforeRemarks, afterRemarks
        };
        safeSetItem(persistenceKey, JSON.stringify(dataToSave));
    }, [description, beforePhotos, afterPhotos, workDate, startTime, endTime, category, location, beforeRemarks, afterRemarks, persistenceKey]);

    // Handle time calculation
    useEffect(() => {
        if (startTime && endTime) {
            const [sH, sM] = startTime.split(':').map(Number);
            const [eH, eM] = endTime.split(':').map(Number);
            
            let diff = (eH * 60 + eM) - (sH * 60 + sM);
            if (diff < 0) diff += 24 * 60; // Handle overnight work if needed
            
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
            // Validation
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

                // Add to Prior Site History immediately
                const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
                if (!currentHistory.includes(base64String)) {
                    const updatedHistory = [base64String, ...currentHistory].slice(0, 8);
                    safeSetItem(historyKey, JSON.stringify(updatedHistory));
                    setPriorPhotos(updatedHistory);
                }

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

    // ── Export Handlers ────────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        const selectedTask = tasks.find((t: any) => String(t.id) === String(selectedTaskId));
        const taskLabel = taskName || selectedTask?.title || selectedTask?.name || (selectedTaskId ? `Task #${selectedTaskId}` : 'No Task Selected');

        const printContent = `
            <html>
            <head>
                <title>Work Update Report</title>
                <style>
                    @page { margin: 20mm 15mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 13px; }
                    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 24px 28px; border-radius: 10px 10px 0 0; }
                    .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
                    .header p  { font-size: 12px; opacity: 0.8; }
                    .body { padding: 24px 28px; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
                    .field label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 3px; }
                    .field span { font-size: 13px; font-weight: 700; color: #1e293b; word-break: break-word; }
                    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; min-height: 60px; white-space: pre-wrap; font-size: 13px; color: #334155; line-height: 1.6; }
                    .photo-badge { display: inline-flex; align-items: center; background: #dbeafe; color: #1d4ed8; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
                    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Work Update Report</h1>
                    <p>Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; InfraPilot</p>
                </div>
                <div class="body">
                    <div class="section">
                        <div class="section-title">Task Information</div>
                        <div class="grid">
                            <div class="field"><label>Task</label><span>${taskLabel}</span></div>
                            <div class="field"><label>Category</label><span>${category || '—'}</span></div>
                            <div class="field"><label>Location / Area</label><span>${location || '—'}</span></div>
                            <div class="field"><label>Work Date</label><span>${workDate}</span></div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">Time Details</div>
                        <div class="grid">
                            <div class="field"><label>Start Time</label><span>${startTime}</span></div>
                            <div class="field"><label>End Time</label><span>${endTime}</span></div>
                            <div class="field"><label>Total Hours</label><span>${totalHours}</span></div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">Work Description</div>
                        <div class="desc-box">${description || '—'}</div>
                    </div>
                    ${beforeRemarks ? `<div class="section"><div class="section-title">Before Work Remarks</div><div class="desc-box">${beforeRemarks}</div></div>` : ''}
                    ${afterRemarks  ? `<div class="section"><div class="section-title">After Work Remarks</div><div class="desc-box">${afterRemarks}</div></div>` : ''}
                    <div class="section">
                        <div class="section-title">Photo Attachments</div>
                        <div class="grid">
                            <div class="field"><label>Before Work Photos</label><span class="photo-badge">${beforePhotos.length} / 4 uploaded</span></div>
                            <div class="field"><label>After Work Photos</label><span class="photo-badge">${afterPhotos.length} / 4 uploaded</span></div>
                        </div>
                    </div>
                    <div class="footer">
                        <span>InfraPilot &mdash; Labour Module</span>
                        <span>Confidential</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);
    };

    const handleExportCSV = async () => {
        try {
            const data = await workUpdateService.exportWorkUpdates({ project_id: Number(projectId), format: 'csv' });
            if (data instanceof Blob) {
                const url = URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = `work-updates-${projectId}-${workDate || 'export'}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Exported work updates CSV!");
                return;
            }
        } catch (exportErr) {
            console.warn("Backend export API call skipped/fallback to client CSV:", exportErr);
        }

        // Client-side CSV generator fallback
        const selectedTask = tasks.find((t: any) => String(t.id) === String(selectedTaskId));
        const taskLabel = taskName || selectedTask?.title || selectedTask?.name || (selectedTaskId ? `Task #${selectedTaskId}` : '');

        const escape = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const headers = [
            'Task ID', 'Task Name', 'Work Date', 'Start Time', 'End Time', 'Total Hours',
            'Category', 'Location', 'Work Description', 'Before Work Remarks', 'After Work Remarks',
            'Before Photos Count', 'After Photos Count', 'Generated At'
        ];

        const row = [
            selectedTaskId || taskId || '',
            taskLabel,
            workDate,
            startTime,
            endTime,
            totalHours,
            category,
            location,
            description,
            beforeRemarks,
            afterRemarks,
            String(beforePhotos.length),
            String(afterPhotos.length),
            new Date().toLocaleString()
        ].map(escape);

        const csvContent = [headers.join(','), row.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `work-update-${workDate || 'report'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Downloaded Work Update CSV!");
    };

    return (
        <>
            <Navbar title="Work Update" breadcrumb={['InfraPilot', 'Labour', 'Daily Update', 'Work Update']} />
            <PageTransition className="p-6 md:p-8 bg-[#f5f7fb] min-h-screen font-inter pb-20">
                <div className="max-w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="p-8 pb-4 flex items-center justify-between gap-5 flex-wrap">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-100">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Update Your Work Progress</h1>
                                <p className="text-sm text-slate-500 font-medium">Provide details of work completed along with photos</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">

                        {/* Task Selection Section */}
                        <div className="space-y-4">
                            {!taskId ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Select Task <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedTaskId}
                                            onChange={(e) => setSelectedTaskId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                        >
                                            <option value="">Select a Task to Update</option>
                                            {displayTasks.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.id} - {t.title || t.name}
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
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{taskName || 'Selected Task'}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase">Mission Update in Progress</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-1">Task ID</span>
                                            <span className="text-sm font-black text-blue-600">{taskId}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Work Description Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Work Description <span className="text-red-500">*</span></label>
                            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-all">

                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                    placeholder="Write a detailed description of the work completed..."
                                    className="w-full p-4 min-h-[120px] focus:outline-none text-slate-700 text-sm placeholder:text-slate-300"
                                />
                                <div className="p-2 px-4 bg-slate-50/50 flex justify-end">
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
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="w-full py-8 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-50/50 hover:border-blue-300 transition-all group cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag & drop images here</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to upload</p>
                                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 15MB</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prior Site History</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {priorPhotos.map((url, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => {
                                                    if (beforePhotos.length >= 4) {
                                                        toast.error("Max 4 Before photos allowed");
                                                        return;
                                                    }
                                                    setBeforePhotos(prev => [...prev, url]);
                                                    toast.success("Added photo to Before photos");
                                                }}
                                                title="Click to add to Before Photos"
                                                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 opacity-70 hover:opacity-100 transition-all cursor-pointer shadow-sm relative group"
                                            >
                                                <img src={url} alt="History" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Plus className="w-4 h-4 text-white drop-shadow" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Preview</p>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[60px]">
                                        {beforePhotos.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {beforePhotos.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white shadow-sm group">
                                                        <img src={url} alt="Before" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePhoto('before', i); }}
                                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

                                <div className="space-y-2 mt-4">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Before Work Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={beforeRemarks}
                                            onChange={(e) => setBeforeRemarks(e.target.value.slice(0, 500))}
                                            placeholder="Before work remarks..."
                                            className="w-full p-3 min-h-[85px] border border-slate-200 rounded-2xl text-slate-700 text-xs placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all font-medium"
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
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="w-full py-8 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-50/50 hover:border-blue-300 transition-all group cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag & drop images here</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to upload</p>
                                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 15MB</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prior Site History</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {priorPhotos.map((url, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => {
                                                    if (afterPhotos.length >= 4) {
                                                        toast.error("Max 4 After photos allowed");
                                                        return;
                                                    }
                                                    setAfterPhotos(prev => [...prev, url]);
                                                    toast.success("Added photo to After photos");
                                                }}
                                                title="Click to add to After Photos"
                                                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 opacity-70 hover:opacity-100 transition-all cursor-pointer shadow-sm relative group"
                                            >
                                                <img src={url} alt="History" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Plus className="w-4 h-4 text-white drop-shadow" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Preview</p>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[60px]">
                                        {afterPhotos.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {afterPhotos.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white shadow-sm group">
                                                        <img src={url} alt="After" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePhoto('after', i); }}
                                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

                                <div className="space-y-2 mt-4">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">After Work Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={afterRemarks}
                                            onChange={(e) => setAfterRemarks(e.target.value.slice(0, 500))}
                                            placeholder="After work remarks..."
                                            className="w-full p-3 min-h-[85px] border border-slate-200 rounded-2xl text-slate-700 text-xs placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all font-medium"
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
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={totalHours}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 italic"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dropdowns Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Work Category <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Category</option>
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
                                        placeholder="Enter work location or area"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>



                        {/* Recent Work Updates & Project Timeline */}
                        {(myUpdates.length > 0 || timeline.length > 0) && (
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Recent Work Updates &amp; Timeline</h3>
                                        <p className="text-xs text-slate-400 font-medium">History of submitted work updates for this project</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingUpdateId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingUpdateId(null);
                                                    setDescription('');
                                                    setBeforePhotos([]);
                                                    setAfterPhotos([]);
                                                    toast.success("Switched to New Update mode");
                                                }}
                                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>New Update</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                    {myUpdates.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleLoadWorkUpdate(item.id)}
                                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${editingUpdateId === item.id ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}
                                        >
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span className="truncate flex-1 mr-2">{item.work_description || item.description || `Update #${item.id}`}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">{item.work_date}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => handleDeleteWorkUpdate(item.id, e)} 
                                                        className="text-slate-400 hover:text-red-600 p-0.5"
                                                        title="Delete this work update"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                                                {(item.activity_type_id || item.category) && <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-blue-600">{ACTIVITY_TYPE_NAMES[item.activity_type_id] || item.category}</span>}
                                                {item.location && <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">{item.location}</span>}
                                                {(item.start_time || item.end_time) && <span>{item.start_time || ''} - {item.end_time || ''}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <button 
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting || isCreating || isUploadingBefore || isUploadingAfter}
                                className="px-10 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isCreating || isUploadingBefore || isUploadingAfter}
                                className="px-10 py-3 bg-[#2563eb] text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Submitting...' : isCreating ? 'Creating...' : isUploadingBefore ? 'Uploading Before Photos...' : isUploadingAfter ? 'Uploading After Photos...' : 'Submit Update'}
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default WorkUpdatesPage;
