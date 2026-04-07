import type { Task } from "../../types/project";
import { TASK_PROGRESS, TASK_COMMENTS } from "../../config/projectSeed";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal = ({ task, onClose }: TaskDetailsModalProps) => {
  const history = TASK_PROGRESS[task.id] || [];
  const comments = TASK_COMMENTS[task.id] || [];

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
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="relative pl-6 pb-4 border-l-2 border-slate-100 last:border-0 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-700">{h.percentage}%</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{h.remarks}</p>
                  </div>
                ))}
                {history.length === 0 && <p className="text-xs text-slate-400 italic">No progress recorded yet.</p>}
              </div>
            </section>

            {/* Comments */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Comments</h3>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold text-primary uppercase">{c.author_name}</p>
                        <span className="text-[8px] font-bold text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
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
             <input type="text" placeholder="Type a comment or update progress..." className="flex-1 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary transition-colors" />
             <button className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20">Send</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
