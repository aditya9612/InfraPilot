import { useState, useEffect, useRef } from 'react';
import { Calendar, Search, Building2, UserCircle, Briefcase, FileText, Filter as FilterIcon, Check, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { projectService } from '../../../services/projectService';
import { labourService } from '../../../services/labourService';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number | null;
    onSuccess: () => void;
}

const CreateTaskDrawer = ({ isOpen, onClose, projectId, onSuccess }: CreateTaskModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [project, setProject] = useState('None');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterDepartment, setFilterDepartment] = useState('All Departments');
    const [showAllDepartments, setShowAllDepartments] = useState(false);
    const [searchEmployee, setSearchEmployee] = useState('');

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
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setStartDate('');
            setDeadline('');
            setProject('None');
            setFilterRole('All Roles');
            setFilterDepartment('All Departments');
            setSearchEmployee('');
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
        if (isOpen && projectId) {
            fetchMembers();
        }
    }, [isOpen, projectId]);

    const fetchMembers = async () => {
        if (!projectId) return;
        try {
            const data = await labourService.getLabours(projectId, { limit: 100 });
            setEmployees(data.items || []);
        } catch (error) {
            console.error("Failed to load labours", error);
        }
    };

    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    const handleSelectAll = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(e => e.id));
        }
    };

    const toggleEmployee = (id: number) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
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

        const targetProjectId = project !== 'None' ? Number(project) : projectId;
        if (!targetProjectId) {
            toast.error("Please select a project");
            return;
        }

        try {
            const priorityMap: Record<string, number> = { 'Low': 3, 'Medium': 2, 'High': 1 };

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("priority", String(priorityMap[priority]));
            formData.append("status", "Planned");
            
            if (startDate) formData.append("start_date", startDate);
            if (deadline) formData.append("end_date", deadline);
            
            if (selectedEmployees.length > 0) {
                formData.append("assigned_user_ids", selectedEmployees.join(","));
            }

            if (audioBlob) {
                formData.append("audio_file", audioBlob, "voice_note.webm");
            }

            await projectService.createTask(targetProjectId, formData);

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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                <Briefcase className="w-3 h-3 text-primary" />
                                Priority
                            </label>
                            <select
                                className={inputClasses}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
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

                {/* Assignment Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">Task Assignment</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                <FilterIcon className="w-3 h-3 text-primary" />
                                Filter Role
                            </label>
                            <select
                                className={inputClasses}
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="All Roles">All Roles</option>
                                <option value="Team Lead">Team Lead</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>
                                <Building2 className="w-3 h-3 text-primary" />
                                Filter Department
                            </label>
                            <select
                                className={inputClasses}
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                            >
                                <option value="All Departments">All Departments</option>
                                <option value="Engineering">Engineering</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelClasses}>
                                <UserCircle className="w-3 h-3 text-primary" />
                                Assign To
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showAllDepartments ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}
                                    onClick={() => setShowAllDepartments(!showAllDepartments)}
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium text-slate-500">Show All Departments</span>
                            </div>
                        </div>

                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search employees by name, ID or email..."
                                className={`${inputClasses} pl-9`}
                                value={searchEmployee}
                                onChange={(e) => setSearchEmployee(e.target.value)}
                            />
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div
                                className="flex items-center justify-between p-3 border-b border-slate-100 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                onClick={handleSelectAll}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedEmployees.length === employees.length ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Select All Visible</span>
                                </div>
                                {selectedEmployees.length > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md">
                                        {selectedEmployees.length} Selected
                                    </span>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {employees
                                    .filter(emp =>
                                        !searchEmployee ||
                                        emp.labour_name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                                        emp.worker_code?.toLowerCase().includes(searchEmployee.toLowerCase())
                                    )
                                    .map(emp => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center justify-between p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => toggleEmployee(emp.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-slate-800">{emp.labour_name || emp.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                                                            {emp.worker_code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {emp.skill_type || 'Labour'}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTaskDrawer;
