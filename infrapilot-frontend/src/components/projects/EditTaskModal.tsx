import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";
import { masterService, type MasterEntity } from "../../services/masterService";
import type { BoqItem } from "../../types/boq";
import type { Task, TaskStatus, ProjectMember } from "../../types/project";
import { Mic, Square, Trash, Music, Image as ImageIcon, AlertCircle } from "lucide-react";
import { getFullImageUrl } from "../../utils/imageUtils";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  members: ProjectMember[];
  onSubmit?: (taskData: any) => void;
}

const EditTaskModal = ({
  isOpen,
  onClose,
  task,
  members,
  onSubmit,
}: EditTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    status: "Planned" as TaskStatus,
    start_date: "",
    end_date: "",
    assigned_user_id: 0 as string | number,
    completion_percentage: 0,
    boq_id: "" as string | number,
    milestone_id: "" as string | number,
    activity_type_id: "" as string | number,
  });

  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<MasterEntity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // File State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [instructionImage, setInstructionImage] = useState<File | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        start_date: task.start_date,
        end_date: task.end_date,
        assigned_user_id: task.assigned_user_id || "",
        completion_percentage: task.completion_percentage,
        boq_id: task.boq_id ? String(task.boq_id) : "",
        milestone_id: task.milestone_id ? String(task.milestone_id) : "",
        activity_type_id: task.activity_type_id ? String(task.activity_type_id) : "",
      });
      // Clear files/recordings when task changes
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioFile(null);
      setInstructionImage(null);
      setRecordingDuration(0);
    }
  }, [task]);

  useEffect(() => {
    const fetchData = async () => {
      if (!task) return;
      try {
        const [boqRes, milestoneRes, activityRes] = await Promise.all([
          boqService.getBoqs({ project_id: task.project_id }),
          projectService.getMilestones(task.project_id),
          masterService.getEntities("activity-types")
        ]);
        setBoqItems(boqRes.items || []);
        setMilestones(milestoneRes || []);
        setActivityTypes(activityRes || []);
      } catch (error) {
        console.error("Failed to fetch data for task editing:", error);
      }
    };
    if (isOpen && task) {
      fetchData();
    }
  }, [isOpen, task]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 100) return;
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["priority", "assigned_user_id", "completion_percentage", "boq_id", "milestone_id", "activity_type_id"].includes(name)
        ? (value ? parseInt(value) : "")
        : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    if (!formData.end_date) newErrors.end_date = "End date is required.";
    if (!formData.assigned_user_id) newErrors.assigned_user_id = "Assigned user is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !task) return;

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("task_id", String(task.id));
      form.append("project_id", String(task.project_id));
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("priority", String(formData.priority));
      form.append("status", formData.status);
      form.append("start_date", formData.start_date);
      form.append("end_date", formData.end_date);
      form.append("assigned_user_id", String(formData.assigned_user_id));
      form.append("completion_percentage", String(formData.completion_percentage));
      form.append("percentage", String(formData.completion_percentage));

      if (formData.boq_id) form.append("boq_id", String(formData.boq_id));
      if (formData.milestone_id) form.append("milestone_id", String(formData.milestone_id));
      if (formData.activity_type_id) form.append("activity_type_id", String(formData.activity_type_id));

      // Audio
      if (audioBlob) {
        form.append("audio_file", audioBlob, "recording.webm");
      } else if (audioFile) {
        form.append("audio_file", audioFile);
      }

      // Image
      if (instructionImage) {
        form.append("instruction_image", instructionImage);
      }

      // Redundant compatibility fields
      form.append("activity_name", formData.title);
      form.append("engineer_id", String(formData.assigned_user_id));
      form.append("assigned_to", String(formData.assigned_user_id));
      form.append("user_id", String(formData.assigned_user_id));

      if (onSubmit) {
        await onSubmit(form);
      }

      toast.success("Task updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
      >
        Cancel
      </button>
      <button
        form="edit-task-form"
        type="submit"
        disabled={isLoading}
        className="px-8 py-2.5 text-xs font-black text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Task Details"
      footer={modalFooter}
      maxWidth="max-w-4xl"
    >
      <form id="edit-task-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-6">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Basic Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Task Title</label>
                  <input
                    required type="text" name="title" value={formData.title} onChange={handleChange}
                    className={`w-full px-4 py-2 bg-white border ${errors.title ? 'border-red-500' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all font-medium`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    required name="description" value={formData.description} onChange={handleChange} rows={3}
                    className={`w-full px-4 py-2 bg-white border ${errors.description ? 'border-red-500' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all resize-none font-medium`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Existing Instructions</h3>
              <div className="grid grid-cols-2 gap-4">
                {task?.audio_file ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Previous Audio</p>
                    <audio src={getFullImageUrl(task.audio_file)} controls className="w-full h-8" />
                  </div>
                ) : (
                  <div className="p-3 bg-white/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Music className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">No audio</span>
                  </div>
                )}
                {task?.instruction_image ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Previous Image</p>
                    <img src={getFullImageUrl(task.instruction_image)} alt="Task Instruction" className="w-full h-20 object-cover rounded-lg" />
                  </div>
                ) : (
                  <div className="p-3 bg-white/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">No image</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Status & Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    name="status" value={formData.status} onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                  <select
                    name="priority" value={formData.priority} onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value={1}>High</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-500" /> Replace Audio Instruction
              </h3>
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isRecording ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-white border-slate-200'}`}>
                  <span className="text-sm font-black mono tracking-tighter">{formatDuration(recordingDuration)}</span>
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-lg"><Mic className="w-5 h-5" /></button>
                  ) : (
                    <button type="button" onClick={stopRecording} className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-lg"><Square className="w-4 h-4" /></button>
                  )}
                </div>
                {audioUrl && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <audio key={audioUrl} src={audioUrl} controls preload="auto" className="h-8 flex-1" />
                    <button type="button" onClick={() => setAudioUrl(null)} className="p-2 text-rose-500"><Trash className="w-4 h-4" /></button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Or Upload File</label>
                  <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="w-full text-xs file:bg-slate-100 file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:mr-3" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Assignment & Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned To</label>
                  <select name="assigned_user_id" value={formData.assigned_user_id} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Milestone</label>
                    <select name="milestone_id" value={formData.milestone_id} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium">
                      <option value="">Select</option>
                      {milestones.map(m => <option key={m.id} value={m.id}>{m.title || m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Activity Type</label>
                    <select name="activity_type_id" value={formData.activity_type_id} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium">
                      <option value="">Select</option>
                      {activityTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Link to BOQ Activity</label>
                  <select name="boq_id" value={formData.boq_id} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium">
                    <option value="">Optional</option>
                    {boqItems.map(item => <option key={item.id} value={item.id}>{item.item_name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Global Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
                  <span className="text-xs font-black text-primary">{formData.completion_percentage}%</span>
                </div>
                <input type="range" name="completion_percentage" min="0" max="100" value={formData.completion_percentage} onChange={handleChange} className="w-full h-1.5 bg-white border border-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Adjust slider to update task progress globally.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
