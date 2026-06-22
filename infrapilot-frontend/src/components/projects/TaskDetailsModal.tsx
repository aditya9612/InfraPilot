import { useState, useEffect, useCallback } from "react";
import type { Task, TaskProgress, TaskComment } from "../../types/project";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";
import {
  X,
  Calendar,
  User,
  Clock,
  AlertCircle,
  History,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Music,
  Image as ImageIcon,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { getFullImageUrl } from "../../utils/imageUtils";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdateProgress?: (percentage: number, remarks: string) => void;
  onAddComment?: (content: string) => void;
}

const TaskDetailsModal = ({ task, onClose, onUpdateProgress, onAddComment }: TaskDetailsModalProps) => {
  const [taskDetails, setTaskDetails] = useState<Task>(task);
  const [history, setHistory] = useState<TaskProgress[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [updatePercentage, setUpdatePercentage] = useState(task.completion_percentage);
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "comments">("overview");

  const fetchData = useCallback(async () => {
    try {
      const [tData, hData, cData] = await Promise.all([
        projectService.getTask(task.project_id, task.id),
        projectService.getTaskProgressHistory(task.project_id, task.id),
        projectService.getTaskComments(task.project_id, task.id)
      ]);
      setTaskDetails(tData);
      setUpdatePercentage(tData.completion_percentage);
      setHistory(Array.isArray(hData) ? hData : (hData.items || hData.data || []));
      setComments(Array.isArray(cData) ? cData : (cData.items || cData.data || []));
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    }
  }, [task.id, task.project_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use taskDetails instead of task for rendering
  const displayTask = taskDetails;

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await projectService.createTaskComment(task.project_id, task.id, { content: newComment });
      setNewComment("");
      if (onAddComment) onAddComment(newComment);
      toast.success("Comment posted");
      fetchData();
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    setIsSubmitting(true);
    try {
      await projectService.updateTaskProgress(task.project_id, task.id, {
        percentage: updatePercentage,
        remarks: updateRemarks || "Status update"
      });
      setUpdateRemarks("");
      if (onUpdateProgress) onUpdateProgress(updatePercentage, updateRemarks);
      toast.success(`Progress updated to ${updatePercentage}%`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: number) => {
    if (p >= 3) return "bg-rose-100 text-rose-600";
    if (p === 2) return "bg-amber-100 text-amber-600";
    return "bg-emerald-100 text-emerald-600";
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Completed": return "bg-emerald-100 text-emerald-600";
      case "In Progress": return "bg-blue-100 text-blue-600";
      case "Planned": return "bg-slate-100 text-slate-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const audioUrl = task.audio_instruction_url || task.audio_file;
  const imageUrl = task.instruction_image_url || task.instruction_image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-in duration-300 border border-white/20">

        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 px-8 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full bg-white animate-pulse`} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Activity ID: {displayTask.id}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 ${getStatusColor(task.status).replace('bg-', 'bg-white/').replace('text-', 'text-white')}`}>
                  {displayTask.status}
                </div>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{displayTask.title}</h2>
              <div className="flex items-center gap-4 text-blue-100/80">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <User className="w-3.5 h-3.5" />
                  Assignee ID: {displayTask.assigned_user_id}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${displayTask.completion_percentage}%` }} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 border-b border-slate-100 bg-white">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "history", label: "Progress History", icon: History },
            { id: "comments", label: "Internal Chat", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "overview" && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics & Progress */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Quick Progress Section */}
                  <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Current Progress
                      </h3>
                      <span className="text-2xl font-black text-blue-600">{updatePercentage}%</span>
                    </div>
                    <div className="space-y-6">
                      <div className="relative h-3 bg-white rounded-full border border-slate-200 p-0.5">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${updatePercentage}%` }} />
                        <input
                          type="range" min="0" max="100" value={updatePercentage}
                          onChange={(e) => setUpdatePercentage(parseInt(e.target.value))}
                          disabled={isSubmitting}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="text" placeholder="Update status description..." value={updateRemarks}
                            onChange={(e) => setUpdateRemarks(e.target.value)}
                            className="w-full bg-white px-5 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all pl-12"
                          />
                          <MessageSquare className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                          onClick={handleUpdateProgress} disabled={isSubmitting}
                          className="px-8 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? "Updating..." : "Update"}
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Description Section */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Detailed Scope
                    </h3>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 leading-relaxed text-slate-600 text-sm font-medium">
                      {displayTask.description || "No description provided for this activity."}
                    </div>
                  </section>

                  {/* Performance Metrics Grid */}
                  <section className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Financial Summary</span>
                        <DollarSign className="w-4 h-4 text-emerald-600 group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">₹{displayTask.actual_cost || 0}</span>
                        <span className="text-xs font-bold text-slate-400">/ ₹{displayTask.planned_cost || 0}</span>
                      </div>
                      <div className="mt-3 w-full h-1.5 bg-emerald-200/30 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, ((displayTask.actual_cost || 0) / (displayTask.planned_cost || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Efficiency Metrics</span>
                        <AlertCircle className="w-4 h-4 text-rose-600 group-hover:shake transition-transform" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{displayTask.delay_days || 0}d</span>
                        <span className="text-xs font-bold text-slate-400">Delay</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 italic flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Total duration: {displayTask.execution_duration || 0} days
                      </p>
                    </div>
                  </section>

                </div>

                {/* Right Column: Site Instructions & Media */}
                <div className="space-y-8">

                  {/* Site Instructions Card */}
                  <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Site Engineer Instructions
                    </h3>

                    <div className="space-y-6">
                      {/* Audio Playback */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Music className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-bold">Audio Briefing</span>
                        </div>
                        {audioUrl ? (
                          <audio src={getFullImageUrl(audioUrl)} controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                        ) : (
                          <p className="text-[10px] text-white/40 italic">No audio instruction provided.</p>
                        )}
                      </div>

                      {/* Image Preview */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-bold">Visual Guide</span>
                        </div>
                        {imageUrl ? (
                          <div className="aspect-video rounded-xl overflow-hidden group relative cursor-pointer">
                            <img src={getFullImageUrl(imageUrl)} alt="Instruction" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-wider border border-white px-3 py-1">View Full</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-white/40 italic">No visual guide provided.</p>
                        )}
                      </div>

                      {/* Links Card */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <h4 className="text-[10px] font-black text-white/40 uppercase mb-3 pr-2">Linked Assets</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-[10px] font-bold">
                            <span className="text-white/60">Milestone</span>
                            <span className="text-white">#{displayTask.milestone_id || "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-[10px] font-bold">
                            <span className="text-white/60">BOQ Ref</span>
                            <span className="text-white">#{displayTask.boq_id || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-8 pl-8 border-l-2 border-slate-100 relative">
                {history.map((h, idx) => (
                  <div key={h.id} className="relative group">
                    <div className={`absolute -left-[45px] top-1 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center z-10 border-2 ${idx === 0 ? 'border-blue-500 scale-110' : 'border-slate-100'}`}>
                      <span className="text-[9px] font-black text-slate-800">{h.percentage}%</span>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group-hover:bg-white group-hover:shadow-lg transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Revision {(history.length - idx).toString().padStart(2, '0')}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(h.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{h.remarks}</p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Initial records pending</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="flex flex-col h-[500px] animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {comments.map((c) => (
                  <div key={c.id} className="flex flex-col max-w-[80%] even:self-end">
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.author_name}</span>
                      <span className="text-[8px] font-bold text-slate-300">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div className={`p-4 rounded-3xl text-sm font-medium leading-snug ${c.author_name?.toLowerCase() === 'system'
                      ? "bg-slate-100 text-slate-500 rounded-bl-none"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-500/10 rounded-br-none"
                      }`}>
                      {c.content}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No active discussion</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <input
                  type="text" placeholder="Type a message..." value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  className="flex-1 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
                <button
                  onClick={handlePostComment} disabled={isSubmitting || !newComment.trim()}
                  className="px-8 py-4 bg-blue-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
