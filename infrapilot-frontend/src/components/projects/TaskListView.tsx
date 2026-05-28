import type { Task, ProjectMember } from "../../types/project";

interface TaskListViewProps {
  tasks: Task[];
  members: ProjectMember[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onView: (task: Task) => void;
}

const TaskListView = ({ tasks, members, onEdit, onDelete, onView }: TaskListViewProps) => {
  const getMemberName = (task: any) => {
    // 1. Check for direct name fields
    const directName = task.assigned_to_name ||
      task.engineer_name ||
      task.assigned_user?.full_name ||
      task.engineer?.full_name ||
      task.user?.full_name ||
      task.user?.name;
    if (directName) return directName;

    // 2. Check for various possible assignment ID fields
    const id = task.assigned_user_id ||
      task.assigned_to ||
      task.engineer_id ||
      task.lead_id ||
      task.assigned_user?.id ||
      task.engineer?.id;

    // If no ID found at all, then it's truly unassigned
    if (!id && id !== 0) return "Unassigned";

    // Diagnostic: If we have an ID but can't find the member, show the ID
    const member = members.find(m => (m as any).user_id == id || (m as any).id == id);
    if (!member) return `User ${id}`;

    return member.full_name;
  };

  const priorityLabels: Record<number, string> = {
    1: "High",
    2: "Medium",
    3: "Low",
  };

  const priorityColors: Record<number, string> = {
    1: "text-rose-600 bg-rose-50 border-rose-100",
    2: "text-amber-600 bg-amber-50 border-amber-100",
    3: "text-blue-600 bg-blue-50 border-blue-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-2">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <th className="px-6 py-4">Task Information</th>
              <th className="px-6 py-4 text-center">Priority</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Progress</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{task.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || priorityColors[3]}`}>
                      {priorityLabels[task.priority] || "Low"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200 ring-2 ring-white shadow-sm">
                      {getMemberName(task).split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="text-xs font-bold text-slate-600">{getMemberName(task)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-600">{new Date(task.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Deadline</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400">{task.completion_percentage}% Done</span>
                      {task.is_delayed && <span className="text-rose-500 animate-pulse">DELAYED</span>}
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${task.is_delayed ? 'bg-rose-500' : 'bg-success'}`}
                        style={{ width: `${task.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-primary' :
                      task.status === 'Delayed' ? 'bg-rose-100 text-rose-600' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onView(task)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Task"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Task"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No activities found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskListView;
