import { useState, useEffect, useCallback } from "react";
import type { Task, TaskProgress, TaskComment } from "../../types/project";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdateProgress?: (percentage: number, remarks: string) => void;
  onAddComment?: (content: string) => void;
}

const TaskDetailsModal = ({ task, onClose, onUpdateProgress, onAddComment }: TaskDetailsModalProps) => {
  const [history, setHistory] = useState<TaskProgress[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);


  const [newComment, setNewComment] = useState("");
  const [updatePercentage, setUpdatePercentage] = useState(task.completion_percentage);
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hData, cData] = await Promise.all([
        projectService.getTaskProgressHistory(task.project_id, task.id),
        projectService.getTaskComments(task.project_id, task.id)
      ]);
      setHistory(Array.isArray(hData) ? hData : (hData.items || hData.data || []));
      setComments(Array.isArray(cData) ? cData : (cData.items || cData.data || []));
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    } finally {
    }
  }, [task.id, task.project_id]);

  useEffect(() => {
    fetchData();
    // Sync local state if task details change (e.g., after an update)
    setUpdatePercentage(task.completion_percentage);
  }, [fetchData, task.completion_percentage]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-in duration-300">
        <div className="bg-primary px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Task Details</span>
              <span className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="text-[10px] font-mono text-blue-200">TASK-{task.id}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white hover:bg-blue-600 rounded-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Progress Slider (New Quick Update) */}
          <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Quick Progress Update</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0" max="100" value={updatePercentage}
                  onChange={(e) => setUpdatePercentage(parseInt(e.target.value))}
                  disabled={isSubmitting}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-sm font-bold text-slate-700 min-w-[40px]">{updatePercentage}%</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Add a status remark..." value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleUpdateProgress} disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white text-[10px] font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {task.description}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-8">
            {/* Progress History */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Progress History</h3>
              <div className="space-y-6 max-h-[300px] overflow-y-auto pl-5 pr-2 custom-scrollbar">
                {history.map((h) => (
                  <div key={h.id} className="relative pl-10 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0">
                    {/* Progress Circle Implementation */}
                    <div className="absolute -left-[17px] -top-1 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center z-10">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                        {/* Background Circle */}
                        <circle
                          cx="16" cy="16" r="14"
                          stroke="#F1F5F9" strokeWidth="3" fill="none"
                        />
                        {/* Progress Arc */}
                        <circle
                          cx="16" cy="16" r="14"
                          stroke="#2563EB" strokeWidth="3" fill="none"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * (h.percentage || 0)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-[8px] font-black text-primary">
                        {h.percentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                        Record Update
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {new Date(h.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-snug">{h.remarks}</p>
                  </div>
                ))}
                {history.length === 0 && <p className="text-xs text-slate-400 italic">No progress recorded yet.</p>}
              </div>
            </section>

            {/* Comments */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Comments</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-primary uppercase">{c.author_name}</p>
                      <span className="text-[8px] font-bold text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-xs text-slate-400 italic">Be the first to comment.</p>}
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <input
            type="text" placeholder="Type a comment..." value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            className="flex-1 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handlePostComment} disabled={isSubmitting || !newComment.trim()}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
