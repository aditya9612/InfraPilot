import { useState, useEffect, useRef } from 'react';
import { Calendar, UserCircle, Briefcase, FileText, Check, Mic, Square, Play, Pause, Trash2, Search, ChevronDown } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import { labourService } from '../../../services/labourService';
import { boqService } from '../../../services/boqService';
import { masterService } from '../../../services/masterService';
import { useProject } from '../../../context/ProjectContext';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number | null;
    onSuccess: () => void;
}

const CreateTaskDrawer = ({ isOpen, onClose, projectId, onSuccess }: CreateTaskModalProps) => {
    const { assignedProjects } = useProject();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [project, setProject] = useState('None');

    const [status, setStatus] = useState('Planned');
    const [activityTypeId, setActivityTypeId] = useState('None');
    const [milestoneId, setMilestoneId] = useState('None');
    const [boqId, setBoqId] = useState('None');
    const [instructionImage, setInstructionImage] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);

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
    const [assignedProjectsLocal] = useState<any[]>([]); // replaced by context

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
        if (isOpen) {
            // Reset form state
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
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && targetProjectId) {
            fetchMembers();
        } else {
            setEmployees([]);
        }
    }, [isOpen, targetProjectId]);

    const fetchMembers = async () => {
        if (!targetProjectId) return;
        try {
            const data = await projectService.getProjectMembers(targetProjectId);
            setEmployees(Array.isArray(data) ? data : data.items || []);
        } catch (error) {
            console.error("Failed to load members", error);
        }
    };

    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    // Custom Dropdown State
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredEmployees = employees.filter((emp: any) => {
        const s = userSearchQuery.toLowerCase();
        return (emp.full_name || emp.name || '').toLowerCase().includes(s) ||
            (emp.email || '').toLowerCase().includes(s) ||
            (emp.role || '').toLowerCase().includes(s);
    });

    const isAllVisibleSelected = filteredEmployees.length > 0 && filteredEmployees.every((emp: any) => selectedEmployees.includes(emp.user_id || emp.id));

    const toggleEmployee = (id: number) => {
        setSelectedEmployees(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
    };

    const toggleAllVisible = () => {
        if (isAllVisibleSelected) {
            setSelectedEmployees(prev => prev.filter(id => !filteredEmployees.find((e: any) => (e.user_id || e.id) === id)));
        } else {
            const newSelected = [...selectedEmployees];
            filteredEmployees.forEach((emp: any) => {
                const eid = emp.user_id || emp.id;
                if (!newSelected.includes(eid)) newSelected.push(eid);
            });
            setSelectedEmployees(newSelected);
        }
    };

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

        const targetProjectIdVal = project !== 'None' ? Number(project) : projectId;
        if (!targetProjectIdVal) {
            toast.error("Please select a project");
            return;
        }

        try {
            const priorityMap: Record<string, number> = { 'Low': 3, 'Medium': 2, 'High': 1 };

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

            if (!priority) {
                toast.error("Priority is required");
                return;
            }
            if (activityTypeId && activityTypeId !== 'None') formData.append('activity_type_id', String(activityTypeId));
            if (milestoneId && milestoneId !== 'None') formData.append('milestone_id', String(milestoneId));
            if (boqId && boqId !== 'None') formData.append('boq_id', String(boqId));

            if (audioFile) {
                formData.append('audio_file', audioFile);
            } else if (audioBlob) {
                const audioBlobFile = new File([audioBlob], 'audio_instruction.webm', { type: 'audio/webm' });
                formData.append('audio_file', audioBlobFile);
            }
            if (instructionImage && instructionImage.size > 0) {
                formData.append('instruction_image', instructionImage);
            }

            await projectService.createTask(targetProjectIdVal, formData);

            toast.success("Task created successfully");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to create task");
            console.error(error);
        }
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300";

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
                Create Task
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
            <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Task Details Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">Task Information</h3>

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
                                    <span className="text-sm text-slate-400">Click to record a voice note</span>
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

                        <div>
                            <label className={labelClasses}>
                                Audio File
                            </label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                                className={inputClasses + " p-2 h-[66px]"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                <Briefcase className="w-3 h-3 text-primary" />
                                Priority <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className={inputClasses}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                required
                            >
                                <option value="">Select Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <Check className="w-3 h-3 text-primary" />
                                Status
                            </label>
                            <select
                                className={inputClasses}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <FileText className="w-3 h-3 text-primary" />
                                Project <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className={inputClasses}
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                required
                            >
                                <option value="None">None</option>
                                {assignedProjects.map((p: any) => (
                                    <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <FileText className="w-3 h-3 text-primary" />
                                Activity Type
                            </label>
                            <select
                                className={inputClasses}
                                value={activityTypeId}
                                onChange={(e) => setActivityTypeId(e.target.value)}
                            >
                                <option value="None">None</option>
                                {activities.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.name || a.activity_name || a.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <FileText className="w-3 h-3 text-primary" />
                                Milestone
                            </label>
                            <select
                                className={inputClasses}
                                value={milestoneId}
                                onChange={(e) => setMilestoneId(e.target.value)}
                            >
                                <option value="None">None</option>
                                {milestones.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <FileText className="w-3 h-3 text-primary" />
                                BOQ
                            </label>
                            <select
                                className={inputClasses}
                                value={boqId}
                                onChange={(e) => setBoqId(e.target.value)}
                            >
                                <option value="None">None</option>
                                {boqs.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.item_name || b.name || b.item_description || `BOQ Item`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <label className={labelClasses}>
                                <UserCircle className="w-3 h-3 text-primary" />
                                Assigned User
                            </label>

                            <div
                                className={`${inputClasses} flex items-center justify-between cursor-pointer ${isUserDropdownOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            >
                                <span className="text-slate-600 truncate flex-1">
                                    {selectedEmployees.length === 0
                                        ? "Select users..."
                                        : `${selectedEmployees.length} user${selectedEmployees.length > 1 ? 's' : ''} selected`}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isUserDropdownOpen && (
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[300px]">
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search employees by name, ID or email..."
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                                        <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border-b border-slate-100 mb-2">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllVisibleSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                                {isAllVisibleSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">Select All Visible</span>
                                            {/* Invisible checkbox so label works */}
                                            <input type="checkbox" className="hidden" checked={isAllVisibleSelected} onChange={toggleAllVisible} />
                                        </label>

                                        {filteredEmployees.map((emp: any) => (
                                            <label key={emp.user_id || emp.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedEmployees.includes(emp.user_id || emp.id) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                                    {selectedEmployees.includes(emp.user_id || emp.id) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800">{emp.full_name || emp.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-slate-200 truncate max-w-[120px]">{emp.email || 'No email'}</p>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-1 rounded-md group-hover:bg-white transition-colors border border-slate-200 group-hover:border-slate-300 shadow-sm">
                                                    {emp.role || 'USER'}
                                                </span>
                                                <input type="checkbox" className="hidden" checked={selectedEmployees.includes(emp.user_id || emp.id)} onChange={() => toggleEmployee(emp.user_id || emp.id)} />
                                            </label>
                                        ))}

                                        {filteredEmployees.length === 0 && (
                                            <div className="p-4 text-center text-sm text-slate-500">No employees found</div>
                                        )}
                                    </div>
                                </div>
                            )}
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
