import React, { useState, useEffect, useMemo } from 'react';
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
import { workUpdateService } from '../../services/workUpdateService';
import { safeSetItem, compressImageFile } from '../../utils/storageUtils';

const base64ToFile = (base64String: string, filename: string): File => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
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

    // Fetch tasks, my work updates, and project timeline
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

            // Fetch My Work Updates (GET /api/v1/work-updates/my)
            try {
                const updates = await workUpdateService.getMyWorkUpdates({ project_id: Number(projectId) });
                setMyUpdates(updates);
                
                // Extract photos from my updates to populate prior site history dynamically
                const apiPhotos: string[] = [];
                updates.forEach((u: any) => {
                    if (Array.isArray(u.before_images)) apiPhotos.push(...u.before_images);
                    if (Array.isArray(u.after_images)) apiPhotos.push(...u.after_images);
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
            if (data.description) setDescription(data.description);
            if (data.category) setCategory(data.category);
            if (data.location) setLocation(data.location);
            if (data.work_date) setWorkDate(data.work_date);
            if (data.start_time) setStartTime(data.start_time);
            if (data.end_time) setEndTime(data.end_time);
            if (data.before_remarks) setBeforeRemarks(data.before_remarks);
            if (data.after_remarks) setAfterRemarks(data.after_remarks);
            if (Array.isArray(data.before_images)) setBeforePhotos(data.before_images);
            if (Array.isArray(data.after_images)) setAfterPhotos(data.after_images);
            toast.success(`Loaded Work Update #${id}`, { id: loadingToast });
        } catch (err: any) {
            console.error("Failed to fetch work update:", err);
            toast.error(err?.message || "Failed to load work update details", { id: loadingToast });
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
            toast.error(err?.message || "Failed to delete work update", { id: loadingToast });
        }
    };

    // POST /api/v1/work-updates/{work_update_id}/before-image
    const handleSaveBeforePhotos = async () => {
        console.log('[handleSaveBeforePhotos] called', { selectedTaskId, editingUpdateId, beforePhotosCount: beforePhotos.length });
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (beforePhotos.length === 0) return toast.error("Please upload at least one Before photo");
        
        const loadingToast = toast.loading("Uploading Before Work images...");
        try {
            let activeUpdateId = editingUpdateId;

            // If no work update exists yet, create one first via POST /api/v1/work-updates
            if (!activeUpdateId) {
                console.log('[handleSaveBeforePhotos] No activeUpdateId, creating work update...');
                // Try JSON payload first
                try {
                    const initialPayload: any = {
                        project_id: Number(projectId),
                        task_id: Number(selectedTaskId),
                        description: description || `Before Work – ${category || 'General'}`,
                        category: category || undefined,
                        location: location || undefined,
                        work_date: workDate || undefined,
                        start_time: startTime || undefined,
                    };
                    if (beforeRemarks) initialPayload.before_remarks = beforeRemarks;
                    const res = await workUpdateService.createWorkUpdate(initialPayload);
                    console.log('[handleSaveBeforePhotos] createWorkUpdate response:', res);
                    activeUpdateId = res?.id || res?.data?.id || res?.work_update_id || res?.work_update?.id || null;
                } catch (jsonErr: any) {
                    console.warn('[handleSaveBeforePhotos] JSON create failed, trying FormData:', jsonErr?.response?.data || jsonErr?.message);
                    // Fallback: try FormData with images included
                    const formData = new FormData();
                    formData.append('project_id', String(projectId));
                    formData.append('task_id', String(selectedTaskId));
                    formData.append('description', description || `Before Work – ${category || 'General'}`);
                    if (category) formData.append('category', category);
                    if (location) formData.append('location', location);
                    if (workDate) formData.append('work_date', workDate);
                    if (startTime) formData.append('start_time', startTime);
                    if (beforeRemarks) formData.append('before_remarks', beforeRemarks);
                    beforePhotos.forEach((photo, idx) => {
                        if (photo.startsWith('data:')) {
                            formData.append('before_images', base64ToFile(photo, `before_${idx + 1}.jpg`));
                        }
                    });
                    const res = await workUpdateService.createWorkUpdate(formData);
                    console.log('[handleSaveBeforePhotos] FormData create response:', res);
                    activeUpdateId = res?.id || res?.data?.id || res?.work_update_id || res?.work_update?.id || null;
                }
                if (activeUpdateId) {
                    console.log('[handleSaveBeforePhotos] Got activeUpdateId:', activeUpdateId);
                    setEditingUpdateId(activeUpdateId);
                }
            }

            // Upload each before photo individually to POST /api/v1/work-updates/{id}/before-image
            if (activeUpdateId) {
                for (let i = 0; i < beforePhotos.length; i++) {
                    const photo = beforePhotos[i];
                    try {
                        console.log(`[handleSaveBeforePhotos] Uploading before photo #${i + 1} to work_update_id=${activeUpdateId}`);
                        if (photo.startsWith('data:')) {
                            const file = base64ToFile(photo, `before_${i + 1}.jpg`);
                            await workUpdateService.uploadBeforeImage(activeUpdateId, file);
                        } else {
                            await workUpdateService.uploadBeforeImage(activeUpdateId, { image: photo });
                        }
                        console.log(`[handleSaveBeforePhotos] Before photo #${i + 1} uploaded successfully`);
                    } catch (imgErr: any) {
                        console.warn(`[handleSaveBeforePhotos] uploadBeforeImage #${i + 1} failed:`, imgErr?.response?.data || imgErr?.message);
                    }
                }
            } else {
                console.error('[handleSaveBeforePhotos] Could not obtain work_update_id — images not uploaded');
                toast.error("Could not create work update to attach images", { id: loadingToast });
                return;
            }

            // Update status to "In Progress"
            try {
                await projectService.updateTaskStatus(Number(projectId), Number(selectedTaskId), 'In Progress');
                safeSetItem(`task_status_${selectedTaskId}`, 'In Progress');
            } catch (_) {}

            toast.success("Before Work images uploaded!", { id: loadingToast });
        } catch (err: any) {
            console.error('[handleSaveBeforePhotos] Error:', err);
            toast.error(err?.response?.data?.detail || err.message || "Failed to save Before Work details", { id: loadingToast });
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

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            return toast.error("Please select an image file");
        }
        if (file.size > 10 * 1024 * 1024) {
            return toast.error("File size exceeds 10MB");
        }

        try {
            const base64String = await compressImageFile(file);

            // Add to Prior Site History immediately as requested
            const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            if (!currentHistory.includes(base64String)) {
                const updatedHistory = [base64String, ...currentHistory].slice(0, 6);
                safeSetItem(historyKey, JSON.stringify(updatedHistory));
                setPriorPhotos(updatedHistory);
            }

            if (type === 'before') {
                if (beforePhotos.length >= 4) return toast.error("Max 4 photos allowed");
                setBeforePhotos(prev => [...prev, base64String]);
                if (taskId) {
                    safeSetItem(`task_status_${taskId}`, 'In Progress');
                }
                toast.success("Added to history & attached as Before photo");
            } else {
                if (afterPhotos.length >= 4) return toast.error("Max 4 photos allowed");
                setAfterPhotos(prev => [...prev, base64String]);
                if (taskId) {
                    safeSetItem(`task_status_${taskId}`, 'Completed');
                }
                toast.success("Added to history & attached as After photo");
            }
        } catch (err) {
            console.error("Failed to process uploaded image:", err);
            toast.error("Failed to process uploaded image");
        }

        // Reset input
        event.target.value = '';
    };

    const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') setBeforePhotos(prev => prev.filter((_, i) => i !== index));
        else setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // POST /api/v1/work-updates/{work_update_id}/after-image
    const handleSaveAfterPhotos = async () => {
        console.log('[handleSaveAfterPhotos] called', { selectedTaskId, editingUpdateId, afterPhotosCount: afterPhotos.length });
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (afterPhotos.length === 0) return toast.error("Please upload at least one After photo");
        
        const loadingToast = toast.loading("Uploading After Work images...");
        try {
            let activeUpdateId = editingUpdateId;

            // If no work update exists yet, create one first via POST /api/v1/work-updates
            if (!activeUpdateId) {
                console.log('[handleSaveAfterPhotos] No activeUpdateId, creating work update...');
                try {
                    const initialPayload: any = {
                        project_id: Number(projectId),
                        task_id: Number(selectedTaskId),
                        description: description || `After Work – ${category || 'General'}`,
                        category: category || undefined,
                        location: location || undefined,
                        work_date: workDate || undefined,
                        end_time: endTime || undefined,
                    };
                    if (afterRemarks) initialPayload.after_remarks = afterRemarks;
                    const res = await workUpdateService.createWorkUpdate(initialPayload);
                    console.log('[handleSaveAfterPhotos] createWorkUpdate response:', res);
                    activeUpdateId = res?.id || res?.data?.id || res?.work_update_id || res?.work_update?.id || null;
                } catch (jsonErr: any) {
                    console.warn('[handleSaveAfterPhotos] JSON create failed, trying FormData:', jsonErr?.response?.data || jsonErr?.message);
                    const formData = new FormData();
                    formData.append('project_id', String(projectId));
                    formData.append('task_id', String(selectedTaskId));
                    formData.append('description', description || `After Work – ${category || 'General'}`);
                    if (category) formData.append('category', category);
                    if (location) formData.append('location', location);
                    if (workDate) formData.append('work_date', workDate);
                    if (endTime) formData.append('end_time', endTime);
                    if (afterRemarks) formData.append('after_remarks', afterRemarks);
                    afterPhotos.forEach((photo, idx) => {
                        if (photo.startsWith('data:')) {
                            formData.append('after_images', base64ToFile(photo, `after_${idx + 1}.jpg`));
                        }
                    });
                    const res = await workUpdateService.createWorkUpdate(formData);
                    console.log('[handleSaveAfterPhotos] FormData create response:', res);
                    activeUpdateId = res?.id || res?.data?.id || res?.work_update_id || res?.work_update?.id || null;
                }
                if (activeUpdateId) {
                    console.log('[handleSaveAfterPhotos] Got activeUpdateId:', activeUpdateId);
                    setEditingUpdateId(activeUpdateId);
                }
            }

            // Upload each after photo individually to POST /api/v1/work-updates/{id}/after-image
            if (activeUpdateId) {
                for (let i = 0; i < afterPhotos.length; i++) {
                    const photo = afterPhotos[i];
                    try {
                        console.log(`[handleSaveAfterPhotos] Uploading after photo #${i + 1} to work_update_id=${activeUpdateId}`);
                        if (photo.startsWith('data:')) {
                            const file = base64ToFile(photo, `after_${i + 1}.jpg`);
                            await workUpdateService.uploadAfterImage(activeUpdateId, file);
                        } else {
                            await workUpdateService.uploadAfterImage(activeUpdateId, { image: photo });
                        }
                        console.log(`[handleSaveAfterPhotos] After photo #${i + 1} uploaded successfully`);
                    } catch (imgErr: any) {
                        console.warn(`[handleSaveAfterPhotos] uploadAfterImage #${i + 1} failed:`, imgErr?.response?.data || imgErr?.message);
                    }
                }
            } else {
                console.error('[handleSaveAfterPhotos] Could not obtain work_update_id — images not uploaded');
                toast.error("Could not create work update to attach images", { id: loadingToast });
                return;
            }

            toast.success("After Work images uploaded!", { id: loadingToast });
        } catch (err: any) {
            console.error('[handleSaveAfterPhotos] Error:', err);
            toast.error(err?.response?.data?.detail || err.message || "Failed to save After Work details", { id: loadingToast });
        }
    };

    const handleSubmit = async () => {
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (!description.trim()) return toast.error("Work description is required");
        if (beforePhotos.length === 0 || afterPhotos.length === 0) return toast.error("Please upload before and after photos");

        setIsSubmitting(true);
        const loadingToast = toast.loading(editingUpdateId ? `Updating work update #${editingUpdateId}...` : "Submitting work update...");

        try {
            const payload = {
                project_id: Number(projectId),
                task_id: Number(selectedTaskId),
                description,
                category,
                location,
                work_date: workDate,
                start_time: startTime,
                end_time: endTime,
                before_remarks: beforeRemarks,
                after_remarks: afterRemarks,
                before_images: beforePhotos,
                after_images: afterPhotos
            };

            // 1. Submit or Update Work Update (PUT or POST /api/v1/work-updates)
            let currentUpdateId = editingUpdateId;
            try {
                if (editingUpdateId) {
                    await workUpdateService.updateWorkUpdate(editingUpdateId, payload);
                } else {
                    const res = await workUpdateService.createWorkUpdate(payload);
                    currentUpdateId = res?.id || res?.data?.id || res?.work_update_id || null;
                }
            } catch (apiErr: any) {
                console.warn("API attempt failed, trying FormData fallback:", apiErr?.message);
                const formData = new FormData();
                formData.append('project_id', String(projectId));
                formData.append('task_id', String(selectedTaskId));
                formData.append('description', description);
                formData.append('category', category);
                formData.append('location', location);
                formData.append('work_date', workDate);
                formData.append('start_time', startTime);
                formData.append('end_time', endTime);
                if (beforeRemarks) formData.append('before_remarks', beforeRemarks);
                if (afterRemarks) formData.append('after_remarks', afterRemarks);
                beforePhotos.forEach((base64, index) => {
                    formData.append('before_images', base64ToFile(base64, `before_${index}.jpg`));
                });
                afterPhotos.forEach((base64, index) => {
                    formData.append('after_images', base64ToFile(base64, `after_${index}.jpg`));
                });
                if (editingUpdateId) {
                    await workUpdateService.updateWorkUpdate(editingUpdateId, formData);
                } else {
                    const res = await workUpdateService.createWorkUpdate(formData);
                    currentUpdateId = res?.id || res?.data?.id || res?.work_update_id || null;
                }
            }

            // 2. Explicitly Submit Work Update (POST /api/v1/work-updates/{work_update_id}/submit)
            if (currentUpdateId) {
                try {
                    await workUpdateService.submitWorkUpdate(currentUpdateId);
                } catch (subErr) {
                    console.warn("POST /work-updates/{id}/submit sync warning:", subErr);
                }
            }

            // 3. Sync Task Status to Completed
            try {
                await projectService.updateTaskStatus(Number(projectId), Number(selectedTaskId), 'Completed');
            } catch (statusErr) {
                console.warn("Task status update sync warning:", statusErr);
            }

            toast.success(editingUpdateId ? `Work update #${editingUpdateId} updated!` : 'Work update submitted successfully!', { id: loadingToast });
            setEditingUpdateId(null);

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

            // Save photos to history
            const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const currentUpdatePhotos = [...beforePhotos, ...afterPhotos];
            const filteredOldHistory = existingHistory.filter((p: string) => !currentUpdatePhotos.includes(p));
            const newHistory = [...currentUpdatePhotos, ...filteredOldHistory].slice(0, 8);
            safeSetItem(historyKey, JSON.stringify(newHistory));
            setPriorPhotos(newHistory);

            // Finalize status locally
            safeSetItem(`task_status_${selectedTaskId}`, 'Completed');
            localStorage.removeItem(`work_update_data_${selectedTaskId}`);

            // Reset fields
            setDescription('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setBeforeRemarks('');
            setAfterRemarks('');
            if (!taskId) setSelectedTaskId('');

        } catch (error: any) {
            console.error('Submission Error:', error);
            const errMsg = error?.response?.data?.detail || error?.message || 'Failed to submit work update';
            toast.error(errMsg, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
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
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1"
                                        >
                                            Save
                                        </button>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{beforePhotos.length} / 4</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">Upload photos before starting the work (Max 4)</p>
                                <input 
                                    type="file" 
                                    id="before-upload" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handlePhotoUpload(e, 'before')} 
                                />
                                <button 
                                    onClick={() => document.getElementById('before-upload')?.click()}
                                    className="w-full py-8 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag & drop images here</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to upload</p>
                                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                                    </div>
                                </button>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prior Site History</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {priorPhotos.map((url, i) => (
                                            <div key={i} className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-100 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                                <img src={url} alt="History" className="w-full h-full object-cover" />
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
                                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1"
                                        >
                                            Save
                                        </button>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{afterPhotos.length} / 4</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">Upload photos after completing the work (Max 4)</p>
                                <input 
                                    type="file" 
                                    id="after-upload" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handlePhotoUpload(e, 'after')} 
                                />
                                <button 
                                    onClick={() => document.getElementById('after-upload')?.click()}
                                    className="w-full py-8 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-700">Drag & drop images here</p>
                                        <p className="text-[11px] font-bold text-blue-600">or click to upload</p>
                                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                                    </div>
                                </button>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prior Site History</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {priorPhotos.map((url, i) => (
                                            <div key={i} className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-100 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                                <img src={url} alt="History" className="w-full h-full object-cover" />
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
                                        <option value="Reinforcement">Reinforcement</option>
                                        <option value="Concreting">Concreting</option>
                                        <option value="Masonry">Masonry</option>
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
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                            {(myUpdates.length || timeline.length)} Updates
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
                                    {(myUpdates.length > 0 ? myUpdates : timeline).map((item: any, idx: number) => (
                                        <div key={item.id || idx} className={`p-4 bg-slate-50 border ${editingUpdateId === item.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-100'} rounded-xl space-y-2 hover:bg-slate-100/50 transition-colors group relative`}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-800">{item.task_name || item.title || `Update #${item.id || idx + 1}`}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium text-slate-400">{item.work_date || item.created_at?.split('T')[0] || item.date || 'Today'}</span>
                                                    {item.id && (
                                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                title="Edit Work Update"
                                                                onClick={() => handleLoadWorkUpdate(item.id)}
                                                                className="p-1 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete Work Update"
                                                                onClick={(e) => handleDeleteWorkUpdate(item.id, e)}
                                                                className="p-1 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">{item.description || item.remarks || item.content || 'Work update logged'}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pt-1">
                                                {item.category && <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">{item.category}</span>}
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
                                disabled={isSubmitting}
                                className="px-10 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-10 py-3 bg-[#2563eb] text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Update'}
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
