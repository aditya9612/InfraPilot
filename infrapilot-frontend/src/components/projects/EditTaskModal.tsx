import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";
import { masterService, type MasterEntity } from "../../services/masterService";
import type { BoqItem } from "../../types/boq";
import type { Task, TaskStatus, ProjectMember } from "../../types/project";
import { Mic, Square, Trash } from "lucide-react";
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
      const mimeType = "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill required fields.");
    }
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

      if (audioBlob) {
        form.append("audio_file", audioBlob, "recording.webm");
      } else if (audioFile) {
        form.append("audio_file", audioFile);
      }

      if (instructionImage) {
        form.append("instruction_image", instructionImage);
      }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      maxWidth="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            form="edit-task-form"
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Update Task"}
          </button>
        </>
      }
    >
      <form id="edit-task-form" onSubmit={handleSubmit} noValidate className="space-y-6 font-inter">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Voice Note
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {!isRecording && !audioBlob && !task?.audio_file && !task?.audio_instruction_url && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors animate-pulse shrink-0"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                    <div className="flex items-center gap-2 text-rose-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      {formatDuration(recordingDuration)}
                    </div>
                  </>
                )}

                {audioUrl && !isRecording && (
                  <>
                    <audio src={audioUrl} controls className="h-8 flex-1" />
                    <button
                      type="button"
                      onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </>
                )}

                {!isRecording && !audioBlob && (task?.audio_file || task?.audio_instruction_url) && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <audio preload="none" controls src={getFullImageUrl(task?.audio_file || (task as any)?.audio_instruction_url || "")} className="h-8 max-w-[200px] w-full" />
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Existing Audio</span>
                  </div>
                )}

                {!isRecording && !audioBlob && !task?.audio_file && !task?.audio_instruction_url && (
                  <span className="text-sm text-slate-400">Record a new voice note</span>
                )}
              </div>
              <div className="mt-2">
                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="w-full text-xs font-inter file:bg-slate-100 file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:mr-3 border border-slate-200 rounded-lg p-1 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Instruction Image
              </label>
              {(task?.instruction_image || (task as any)?.instruction_image_url) && (
                <div className="mb-3 flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <img src={getFullImageUrl(task?.instruction_image || (task as any)?.instruction_image_url)} alt="Existing Instruction" className="h-16 w-16 object-cover rounded shadow-sm border border-slate-200 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-slate-600 font-medium">Existing Image</span>
                  </div>
                </div>
              )}
              <input
                type="file"
                name="instruction_image"
                accept="image/*"
                onChange={(e) => setInstructionImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all file:bg-slate-100 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-4 font-inter"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
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
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date ? formData.start_date.split('T')[0] : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date ? formData.end_date.split('T')[0] : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Assigned User <span className="text-rose-500">*</span>
                </label>
                <select
                  name="assigned_user_id"
                  value={formData.assigned_user_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select User</option>
                  {members.map((m) => (
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
                  value={formData.activity_type_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">None</option>
                  {activityTypes.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Milestone
                </label>
                <select
                  name="milestone_id"
                  value={formData.milestone_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">None</option>
                  {milestones.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title || m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  BOQ Link
                </label>
                <select
                  name="boq_id"
                  value={formData.boq_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">None</option>
                  {boqItems.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.item_name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Completion Percentage
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="completion_percentage"
                    min="0"
                    max="100"
                    value={formData.completion_percentage}
                    onChange={handleChange}
                    className="flex-1 h-2 bg-slate-200 rounded-lg cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-bold text-slate-600 min-w-[40px]">{formData.completion_percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
