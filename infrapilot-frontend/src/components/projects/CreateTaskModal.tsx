import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";
import { masterService, type MasterEntity } from "../../services/masterService";
import type { BoqItem } from "../../types/boq";
import type { TaskStatus, ProjectMember } from "../../types/project";
import { Mic, Square, Trash, Music, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: ProjectMember[];
  onSubmit?: (taskData: any) => void;
}

const CreateTaskModal = ({
  isOpen,
  onClose,
  projectId,
  members,
  onSubmit,
}: CreateTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    status: "Planned" as TaskStatus,
    start_date: "",
    end_date: "",
    assigned_user_id: members[0]?.user_id || "",
    boq_id: "",
    milestone_id: "",
    activity_type_id: "",
    completion_percentage: 0,
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

  // Sync default assigned user when members load
  useEffect(() => {
    if (members.length > 0 && !formData.assigned_user_id) {
      setFormData(prev => ({ ...prev, assigned_user_id: members[0].user_id }));
    }
  }, [members, formData.assigned_user_id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boqRes, milestoneRes, activityRes] = await Promise.all([
          boqService.getBoqs({ project_id: projectId }),
          projectService.getMilestones(projectId),
          masterService.getEntities("activity-types")
        ]);
        setBoqItems(boqRes.items || []);
        setMilestones(milestoneRes || []);
        setActivityTypes(activityRes || []);
      } catch (error) {
        console.error("Failed to fetch data for task creation:", error);
      }
    };
    if (isOpen && projectId) {
      fetchData();
    }
  }, [isOpen, projectId]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
          ? "audio/ogg;codecs=opus"
          : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        console.log("Recorded Audio Blob Size:", blob.size);
        if (blob.size < 100) {
          toast.error("Recording failed: Audio data is too small. Please try again.");
          return;
        }
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // Collect data every 200ms
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
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
      [name]: ["priority", "assigned_user_id", "boq_id", "milestone_id", "activity_type_id", "completion_percentage"].includes(name)
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
    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    if (!formData.end_date) newErrors.end_date = "End date is required.";
    if (!formData.assigned_user_id) newErrors.assigned_user_id = "Assigned user is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("project_id", String(projectId));
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("priority", String(formData.priority));
      form.append("status", formData.status);
      form.append("start_date", formData.start_date);
      form.append("end_date", formData.end_date);
      form.append("assigned_user_id", String(formData.assigned_user_id));
      form.append("completion_percentage", String(formData.completion_percentage));

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

      toast.success(`Task "${formData.title}" created successfully!`);
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: 1,
        status: "Planned",
        start_date: "",
        end_date: "",
        assigned_user_id: members[0]?.user_id || "",
        boq_id: "",
        milestone_id: "",
        activity_type_id: "",
        completion_percentage: 0,
      });
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioFile(null);
      setInstructionImage(null);
    } catch (error) {
      console.error("Task Creation Error:", error);
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
        form="create-task-form"
        type="submit"
        disabled={isLoading}
        className="px-8 py-2.5 text-xs font-black text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Creating...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Create Task</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Site Task"
      footer={modalFooter}
      maxWidth="max-w-3xl"
    >
      <form id="create-task-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Details */}
          <div className="space-y-6">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">Activity Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Task Title <span className="text-red-500">*</span></label>
                  <input
                    required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Site Cleaning"
                    className={`w-full px-4 py-2.5 bg-white border ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 font-medium`}
                  />
                  {errors.title && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange} placeholder="Detailed instructions for the site team" rows={3}
                    className={`w-full px-4 py-2.5 bg-white border ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 resize-none font-medium`}
                  />
                  {errors.description && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Activity Type</label>
                    <select
                      name="activity_type_id" value={formData.activity_type_id} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    >
                      <option value="">Select Type</option>
                      {activityTypes.map(at => (
                        <option key={at.id} value={at.id}>{at.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Priority (1-5)</label>
                    <input
                      type="number" name="priority" min="1" max="5" value={formData.priority} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">Attachments</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Instruction Image</label>
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary/50 hover:bg-white transition-all cursor-pointer group">
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => setInstructionImage(e.target.files?.[0] || null)}
                    />
                    <div className="text-center">
                      <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                      <p className="text-xs font-bold text-slate-500">{instructionImage ? instructionImage.name : "Click to upload image"}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Audio & Assignment */}
          <div className="space-y-6">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">Audio Instruction</h3>
              </div>

              <div className="space-y-4">
                {/* Visualizer/Timer */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isRecording ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                    <span className={`text-sm font-black mono tracking-tighter ${isRecording ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button" onClick={startRecording}
                        className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button" onClick={stopRecording}
                        className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-full hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {audioUrl && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                      <Music className="w-4 h-4" />
                    </div>
                    <audio key={audioUrl} src={audioUrl} controls preload="auto" className="h-8 flex-1 custom-audio-player" />
                    <button
                      type="button" onClick={clearRecording}
                      className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300 tracking-widest"><span className="bg-slate-50/50 px-2">OR</span></div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Upload Audio File</label>
                  <input
                    type="file" accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">Assignment & Schedule</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned To</label>
                  <select
                    name="assigned_user_id" value={formData.assigned_user_id || ""} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  >
                    <option value="">Select a team member</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Link to Milestone</label>
                    <select
                      name="milestone_id" value={formData.milestone_id} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    >
                      <option value="">Select Milestone</option>
                      {milestones.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Link to BOQ Activity</label>
                    <select
                      name="boq_id" value={formData.boq_id || ""} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    >
                      <option value="">Optional</option>
                      {boqItems.map(item => (
                        <option key={item.id} value={item.id}>{item.item_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                    <input
                      type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-white border ${errors.start_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all font-medium`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                    <input
                      type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-white border ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all font-medium`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
