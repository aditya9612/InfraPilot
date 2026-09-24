import { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { Calendar, UserCircle, Briefcase, FileText, Check, Mic, Square, Play, Pause, Trash2, ListTodo, Activity } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { CustomSelect, CustomMultiSelect } from '../../../components/common/CustomDropdown';
import { projectService } from '../../../services/projectService';
import { boqService } from '../../../services/boqService';
import { masterService } from '../../../services/masterService';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number | null;
    onSuccess: () => void;
}

const CreateTaskDrawer = ({ isOpen, onClose, projectId, onSuccess }: CreateTaskModalProps) => {
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success'; message: string; fields?: string[] } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [project, setProject] = useState('None');

    const [status, setStatus] = useState('Planned');
    const [activityTypeId, setActivityTypeId] = useState('None');
    const [milestoneId, setMilestoneId] = useState('None');
    const [boqId, setBoqId] = useState('None');
    const [instructionImage, setInstructionImage] = useState<File | null>(null);

    const [milestones, setMilestones] = useState<any[]>([]);
    const [boqs, setBoqs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    const targetProjectId = project !== 'None' ? Number(project) : projectId;

    const [employees, setEmployees] = useState<any[]>([]);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!targetProjectId) {
                setMilestones([]);
                setBoqs([]);
                setActivities([]);
                return;
            }
            try {
                const [ms, bq, act] = await Promise.all([
                    projectService.getMilestones(targetProjectId).catch(() => []),
                    boqService.getBoqItems(targetProjectId).catch(() => []),
                    masterService.getEntities('activity-types').catch(() => [])
                ]);
                setMilestones(Array.isArray(ms) ? ms : (ms as any).items || (ms as any).data || []);
                setBoqs(Array.isArray(bq) ? bq : (bq as any).items || (bq as any).data || []);
                setActivities(Array.isArray(act) ? act : (act as any).items || (act as any).data || []);
            } catch (err) {
                console.error("Failed to load project-specific data", err);
            }
        };
        fetchProjectData();
    }, [targetProjectId]);

    useEffect(() => {
        let localProjects: any[] = [];
        const userStr = localStorage.getItem('infrapilot_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                localProjects = user?.assigned_projects || user?.user?.assigned_projects || [];
            } catch (e) { }
        }

        if (isOpen) {
            // Reset form state
            setFormNotification(null);
            setErrors({});
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setStartDate('');
            setDeadline('');
            setProject('None');
            setStatus('Planned');
            setActivityTypeId('None');
            setMilestoneId('None');
            setBoqId('None');
            setInstructionImage(null);
            setSelectedEmployees([]);
            deleteRecording();

            projectService.getProjects(100, 0)
                .then(data => {
                    const apiProjects = Array.isArray(data) ? data : (data.items || []);
                    setAssignedProjects(apiProjects.length > 0 ? apiProjects : localProjects);
                })
                .catch(err => {
                    console.error("Failed to load projects", err);
                    setAssignedProjects(localProjects);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && targetProjectId) {
            fetchMembers();
        }
    }, [isOpen, targetProjectId]);

    const fetchMembers = async () => {
        if (!targetProjectId) return;
        try {
            const data = await projectService.getProjectMembers(targetProjectId);
            setEmployees(data.items || data || []);
        } catch (error) {
            console.error("Failed to load project members", error);
        }
    };

    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    // Custom Dropdown State handled by CustomMultiSelect


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Microphone access denied or not available");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !audioBlob) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current.src) {
                audioRef.current.src = URL.createObjectURL(audioBlob);
                audioRef.current.onended = () => setIsPlaying(false);
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormNotification(null);
        setErrors({});

        const newErrors: Record<string, string> = {};
        const missingFields: string[] = [];

        if (!title.trim()) { newErrors.title = "Required"; missingFields.push("Task Title"); }
        
        const targetProjectIdVal = project !== 'None' ? Number(project) : null;
        if (!targetProjectIdVal) { newErrors.project = "Required"; missingFields.push("Project"); }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setFormNotification({ type: 'error', message: `Mandatory fields required: ${missingFields.join(', ')}`, fields: missingFields });
            return;
        }

        try {
            const priorityMap: Record<string, number> = { 'Low': 3, 'Medium': 2, 'High': 1, 'Critical': 4 };

            const formData = new FormData();
            formData.append('title', title);
            formData.append('activity_name', title);

            if (description) formData.append('description', description);
            formData.append('priority', String(priorityMap[priority]));
            formData.append('status', status);

            if (selectedEmployees.length > 0) {
                const assignedIdsStr = selectedEmployees.join(",");
                formData.append('assigned_user_ids', assignedIdsStr);
                const assignedUserIdNum = String(selectedEmployees[0]);
                formData.append('assigned_user_id', assignedUserIdNum);
                formData.append('engineer_id', assignedUserIdNum);
                formData.append('assigned_to', assignedUserIdNum);
                formData.append('user_id', assignedUserIdNum);
                formData.append('lead_id', assignedUserIdNum);
                formData.append('assigned_to_id', assignedUserIdNum);
            }

            if (startDate) formData.append('start_date', startDate);
            if (deadline) formData.append('end_date', deadline);

            if (activityTypeId && activityTypeId !== 'None') formData.append('activity_type_id', String(activityTypeId));
            if (milestoneId && milestoneId !== 'None') formData.append('milestone_id', String(milestoneId));
            if (boqId && boqId !== 'None') formData.append('boq_id', String(boqId));

            if (audioBlob) {
                const audioFile = new File([audioBlob], 'audio_instruction.webm', { type: 'audio/webm' });
                formData.append('audio_file', audioFile);
            }
            if (instructionImage && instructionImage.size > 0) {
                formData.append('instruction_image', instructionImage);
            }

            await projectService.createTask(targetProjectIdVal as number, formData);

            toast.success("Task created successfully");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to create task");
            console.error(error);
        }
    };

    const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1 flex items-center gap-1.5 font-inter";
    const getInputClasses = (hasError?: boolean) => `w-full px-4 py-2.5 bg-white border ${hasError ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all placeholder:text-slate-300`;
    const inputClasses = getInputClasses();

    const modalFooter = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button
                form="create-task-form"
                type="submit"
                className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
            >
                Save Task
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Task"
            footer={modalFooter}
            maxWidth="max-w-3xl"
        >
            {formNotification && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        zIndex: 99999,
                        minWidth: '260px',
                        maxWidth: '380px',
                        animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <style>{`
                        @keyframes slideDownIn {
                            from { opacity: 0; transform: translateY(-16px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    <div
                        className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5"
                        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                            <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                            {formNotification.type === 'error'
                                ? `Mandatory fields required: ${(formNotification.fields || []).join(', ')}`
                                : formNotification.message}
                        </p>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                    </div>
                </div>,
                document.body
            )}
            <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6 font-inter" noValidate>
                {formNotification && formNotification.type === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-600">Validation Error</p>
                            <p className="text-xs font-medium text-red-500 mt-0.5">Mandatory fields required: {formNotification.fields?.join(', ')}</p>
                        </div>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-red-400 hover:text-red-600">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                {/* Task Details Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Task Information</h3>

                    <div>
                        <label className={labelClasses}>
                            Task Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter task title"
                            className={inputClasses}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>
                            Description
                        </label>
                        <textarea
                            placeholder="Enter task description"
                            rows={3}
                            className={`${inputClasses} resize-none`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                Voice Note
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                {!isRecording && !audioBlob && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                )}

                                {isRecording && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors animate-pulse"
                                        >
                                            <Square className="w-5 h-5 fill-current" />
                                        </button>
                                        <div className="flex items-center gap-2 text-rose-500 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                            {formatTime(recordingTime)}
                                        </div>
                                    </>
                                )}

                                {audioBlob && !isRecording && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={togglePlay}
                                            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                        </button>
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-full opacity-30"></div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={deleteRecording}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <audio ref={audioRef} className="hidden" />
                                    </>
                                )}

                                {!isRecording && !audioBlob && (
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('audio-upload')?.click()}
                                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
                                        title="Upload Audio File"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    id="audio-upload" 
                                    className="hidden" 
                                    accept="audio/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setAudioBlob(e.target.files[0]);
                                    }}
                                />

                                {!isRecording && !audioBlob && (
                                    <span className="text-sm text-slate-400 truncate">Click mic or upload voice note</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                Instruction Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setInstructionImage(e.target.files?.[0] || null)}
                                className={inputClasses + " p-2 h-[66px]"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CustomSelect
                                label="Priority"
                                icon={Briefcase}
                                required
                                value={priority}
                                onChange={setPriority}
                                options={[
                                    { id: 'Low', label: 'Low' },
                                    { id: 'Medium', label: 'Medium' },
                                    { id: 'High', label: 'High' },
                                    { id: 'Critical', label: 'Critical' }
                                ]}
                                placeholder="Select priority"
                                searchable={false}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Status"
                                icon={Check}
                                value={status}
                                onChange={setStatus}
                                options={[
                                    { id: 'Planned', label: 'Planned' },
                                    { id: 'In Progress', label: 'In Progress' },
                                    { id: 'Completed', label: 'Completed' },
                                    { id: 'On Hold', label: 'On Hold' }
                                ]}
                                placeholder="Select status"
                                searchable={false}
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Project"
                                icon={FileText}
                                required
                                value={project}
                                onChange={setProject}
                                options={[
                                    { id: 'None', label: 'None' },
                                    ...assignedProjects.map(p => ({ id: p.id || p.project_id, label: p.project_name || p.name }))
                                ]}
                                placeholder="Select project"
                            />
                            {errors.project && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1 uppercase tracking-wider font-inter">REQUIRED</p>}
                        </div>

                        <div>
                            <CustomSelect
                                label="Activity Type"
                                icon={Activity}
                                value={activityTypeId}
                                onChange={setActivityTypeId}
                                options={[
                                    { id: 'None', label: 'None' },
                                    ...activities.map(a => ({ id: a.id, label: a.name || a.activity_name || a.title }))
                                ]}
                                placeholder="Select activity type"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Milestone"
                                icon={ListTodo}
                                value={milestoneId}
                                onChange={setMilestoneId}
                                options={[
                                    { id: 'None', label: 'None' },
                                    ...milestones.map(m => ({ id: m.id, label: m.name }))
                                ]}
                                placeholder="Select milestone"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="BOQ"
                                icon={FileText}
                                value={boqId}
                                onChange={setBoqId}
                                options={[
                                    { id: 'None', label: 'None' },
                                    ...boqs.map(b => ({ id: b.id, label: b.item_name || b.name || b.item_description || 'BOQ Item' }))
                                ]}
                                placeholder="Select BOQ item"
                            />
                        </div>

                        <div className="relative">
                            <CustomMultiSelect
                                label="Assigned User"
                                icon={UserCircle}
                                values={selectedEmployees}
                                onChange={(vals: any[]) => setSelectedEmployees(vals as number[])}
                                options={employees.map((emp: any) => ({
                                    id: emp.id || emp.user_id, 
                                    label: emp.full_name || emp.name || emp.labour_name || `User ${emp.id || emp.user_id}`, 
                                    badge: emp.skill_type || emp.role || 'GENERAL',
                                    searchKey: `${emp.worker_code || ''} ${emp.id || ''} ${emp.role || ''} ${emp.full_name || emp.name || ''}`
                                }))}
                                placeholder="Select users..."
                                placement="top"
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <Calendar className="w-3 h-3 text-primary" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                className={inputClasses}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <Calendar className="w-3 h-3 text-primary" />
                                Deadline
                            </label>
                            <input
                                type="date"
                                className={inputClasses}
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>
                </div>


            </form>
        </Modal>
    );
};

export default CreateTaskDrawer;
