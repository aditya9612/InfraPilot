import type { Task } from "../../types/project";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
<<<<<<< HEAD
}

const TaskCard = ({ task, onClick }: TaskCardProps) => {
=======
  onEdit?: (task: Task) => void;
  onDelete?: (id: number) => void;
}

const TaskCard = ({ task, onClick, onEdit, onDelete }: TaskCardProps) => {
>>>>>>> testing
  const isDelayed = task.is_delayed;
  
  const priorityColors: Record<number, string> = {
    1: "bg-red-50 text-red-600 border-red-100",
    2: "bg-amber-50 text-amber-600 border-amber-100",
    3: "bg-blue-50 text-blue-600 border-blue-100",
  };

  const priorityLabels: Record<number, string> = {
    1: "High",
    2: "Medium",
    3: "Low",
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityColors[task.priority] || priorityColors[3]}`}>
          {priorityLabels[task.priority] || "Low"}
        </span>
<<<<<<< HEAD
        <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                U{task.assigned_user_id}
=======
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
                  className="p-1 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded transition-all"
                  title="Edit Task"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task.id); }}
                  className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                  title="Delete Task"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
            </div>
            <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500 ring-2 ring-slate-50 shadow-sm" title={`User ID: ${task.assigned_user_id}`}>
                    U{task.assigned_user_id}
                </div>
>>>>>>> testing
            </div>
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors leading-tight">
        {task.title}
      </h4>
      <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {task.description}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-400">PROGRESS</span>
          <span className="font-bold text-slate-700">{task.completion_percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isDelayed ? 'bg-red-500' : 'bg-success'}`}
            style={{ width: `${task.completion_percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<<<<<<< HEAD
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
=======
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
>>>>>>> testing
          </svg>
          {new Date(task.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </div>
        {isDelayed && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            DELAYED
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
