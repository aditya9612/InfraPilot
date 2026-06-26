import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { 
    Upload, 
    Calendar, 
    Clock, 
    MapPin, 
    Send, 
    X,
    ChevronDown,
    FileText,
    History
} from 'lucide-react';
import toast from 'react-hot-toast';

import { projectService } from '../../services/projectService';

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
    const query = new URLSearchParams(useLocation().search);
    const taskId = query.get('taskId');
    const projectId = query.get('projectId') || '92';
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
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState(taskId || '');

    // Fetch tasks if missing
    useEffect(() => {
        const fetchTasks = async () => {
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
        };
        fetchTasks();
    }, [projectId, taskId]);

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
            if (data.remarks !== undefined) setRemarks(data.remarks);
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
            startTime, endTime, category, location, remarks
        };
        localStorage.setItem(persistenceKey, JSON.stringify(dataToSave));
    }, [description, beforePhotos, afterPhotos, workDate, startTime, endTime, category, location, remarks, persistenceKey]);

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

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            return toast.error("Please select an image file");
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error("File size exceeds 5MB");
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            
            // Add to Prior Site History immediately as requested
            const currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            // Avoid duplicates in history
            if (!currentHistory.includes(base64String)) {
                const updatedHistory = [base64String, ...currentHistory].slice(0, 6);
                localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
                setPriorPhotos(updatedHistory);
            }

            if (type === 'before') {
                if (beforePhotos.length >= 4) return toast.error("Max 4 photos allowed");
                setBeforePhotos(prev => {
                    const newPhotos = [...prev, base64String];
                    return newPhotos;
                });
                
                // Sync status to In Progress
                if (taskId) {
                    localStorage.setItem(`task_status_${taskId}`, 'In Progress');
                }
                toast.success("Added to history & attached as Before photo");
            } else {
                if (afterPhotos.length >= 4) return toast.error("Max 4 photos allowed");
                setAfterPhotos(prev => {
                    const newPhotos = [...prev, base64String];
                    return newPhotos;
                });

                // Sync status to Completed
                if (taskId) {
                    localStorage.setItem(`task_status_${taskId}`, 'Completed');
                }
                toast.success("Added to history & attached as After photo");
            }
        };
        reader.readAsDataURL(file);
        
        // Reset input
        event.target.value = '';
    };

    const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') setBeforePhotos(prev => prev.filter((_, i) => i !== index));
        else setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedTaskId) return toast.error("Please select a task first");
        if (!description.trim()) return toast.error("Work description is required");
        if (beforePhotos.length === 0 || afterPhotos.length === 0) return toast.error("Please upload before and after photos");

        setIsSubmitting(true);
        const loadingToast = toast.loading("Updating mission task...");

        try {
            // 1. Update Status (PATCH) — Labour role has permission for this
            await projectService.updateTaskStatus(Number(projectId), Number(selectedTaskId), 'Completed');

            // 2. Best-effort: Update Task Details (PUT) — Labour may get 403, that's acceptable
            try {
                const formData = new FormData();
                formData.append('description', `${description} | ${remarks}`);
                formData.append('category', category);
                formData.append('location', location);
                formData.append('work_date', workDate);
                formData.append('start_time', startTime);
                formData.append('end_time', endTime);

                beforePhotos.forEach((base64, index) => {
                    formData.append('before_images', base64ToFile(base64, `before_${index}.jpg`));
                });
                afterPhotos.forEach((base64, index) => {
                    formData.append('after_images', base64ToFile(base64, `after_${index}.jpg`));
                });

                await projectService.updateTask(Number(projectId), Number(selectedTaskId), formData);
            } catch (putErr: any) {
                // 403/401 = Labour doesn't have task-edit permission — status already updated, safe to continue
                console.warn('PUT task details skipped (permission):', putErr?.response?.status || putErr.message);
            }

            toast.success('Task status updated to Completed!', { id: loadingToast });

            // Save photos to history
            const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const currentUpdatePhotos = [...beforePhotos, ...afterPhotos];
            const filteredOldHistory = existingHistory.filter((p: string) => !currentUpdatePhotos.includes(p));
            const newHistory = [...currentUpdatePhotos, ...filteredOldHistory].slice(0, 8);
            localStorage.setItem(historyKey, JSON.stringify(newHistory));
            setPriorPhotos(newHistory);

            // Finalize status locally
            localStorage.setItem(`task_status_${selectedTaskId}`, 'Completed');
            localStorage.removeItem(`work_update_data_${selectedTaskId}`);

            // Reset fields
            setDescription('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setRemarks('');
            if (!taskId) setSelectedTaskId('');

        } catch (error: any) {
            console.error('Submission Error:', error);
            const errMsg = error?.response?.data?.detail || error?.message || 'Failed to update task status';
            toast.error(errMsg, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Navbar title="Work Update" breadcrumb={['InfraPilot', 'Labour', 'Daily Update', 'Work Update']} />
            <PageTransition className="p-6 md:p-8 bg-[#f5f7fb] min-h-screen font-inter pb-20">
                <div className="max-w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="p-8 pb-4 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-100">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Update Your Work Progress</h1>
                            <p className="text-sm text-slate-500 font-medium">Provide details of work completed along with photos</p>
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
                                            {tasks.map(t => (
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
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{beforePhotos.length} / 4</span>
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
                            </div>

                            {/* After Work Photos */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">After Work Photos <span className="text-red-500">*</span></label>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{afterPhotos.length} / 4</span>
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

                        {/* Remarks Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Remarks (Optional)</label>
                            <div className="relative">
                                <textarea 
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
                                    placeholder="Add any additional remarks..."
                                    className="w-full p-4 min-h-[100px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 text-sm placeholder:text-slate-300"
                                />
                                <div className="absolute right-4 bottom-3">
                                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{remarks.length}/500</span>
                                </div>
                            </div>
                        </div>

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
