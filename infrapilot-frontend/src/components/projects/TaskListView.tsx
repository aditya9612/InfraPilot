import { useState, useEffect, useMemo } from "react";
import type { Task, ProjectMember } from "../../types/project";
import { ChevronDown, TrendingUp, Forward, Eye, Edit2, Trash2 } from "lucide-react";
import { getFullImageUrl } from "../../utils/imageUtils";

interface TaskListViewProps {
  tasks: Task[];
  members: ProjectMember[];
  projectName?: string;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (taskId: number, status: string) => void;
  onUpdateProgress?: (task: Task) => void;
  onPassDelegate?: (task: Task) => void;
}

const TaskListView = ({ tasks, members, projectName, onEdit, onView, onDelete, onStatusChange, onUpdateProgress, onPassDelegate }: TaskListViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(0);
  }, [tasks.length]);

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const pagedTasks = useMemo(() => {
    return tasks.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  }, [tasks, currentPage]);

  const getMemberName = (task: any) => {
    // 1. Try direct name fields first
    const directName = task.assigned_to_name || task.engineer_name || task.assigned_user?.full_name || task.engineer?.full_name;
    if (directName) return directName;

    // 2. assigned_users array — API returns [{id, name}] or [id]
    if (Array.isArray(task.assigned_users) && task.assigned_users.length > 0) {
      const names = task.assigned_users.map((entry: any) => {
        if (typeof entry === 'object' && entry !== null) {
          // API returns name directly on the object
          if (entry.name || entry.full_name) return entry.name || entry.full_name;
          // fallback: look up in members list by id
          const id = entry.id || entry.user_id;
          const member = members.find(m => (m as any).user_id == id || (m as any).id == id);
          return member ? member.full_name : (id ? `User ${id}` : null);
        }
        // plain id — look up in members list
        const member = members.find(m => (m as any).user_id == entry || (m as any).id == entry);
        return member ? member.full_name : `User ${entry}`;
      }).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }

    // 3. Fallback: single assigned_user_id — look up in members list
    const id = task.assigned_user_id || task.assigned_to || task.engineer_id;
    if (!id) return "Unassigned";
    const member = members.find(m => (m as any).user_id == id || (m as any).id == id);
    return member ? member.full_name : `User ${id}`;
  };

  const priorityBadges: Record<any, string> = {
    HIGH: "bg-rose-500 text-white",
    MEDIUM: "bg-amber-500 text-white",
    LOW: "bg-blue-500 text-white",
    1: "bg-rose-500 text-white",
    2: "bg-amber-500 text-white",
    3: "bg-blue-500 text-white",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-2 font-inter">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left min-w-[1000px] block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
              <th className="p-4 whitespace-nowrap text-slate-800">Project</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Title</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Description</th>
              <th className="p-4 whitespace-nowrap text-slate-800 text-center">Priority</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Status</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Start / End Date</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Actual Start / End</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Assigned Users</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Completion %</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Delay Days</th>
              <th className="p-4 whitespace-nowrap text-slate-800">Instructions</th>
              <th className="p-4 whitespace-nowrap text-slate-800 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {pagedTasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors block md:table-row">
                <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{projectName || (task as any).projectName || `Project ${task.project_id}`}</td>
                <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-800 block md:table-cell">{task.title}</td>
                <td className="p-4 text-xs text-slate-500 truncate max-w-[200px] block md:table-cell">{task.description}</td>
                <td className="p-4 text-center block md:table-cell">
                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityBadges[task.priority] || 'bg-slate-500 text-white'}`}>
                    {typeof task.priority === 'number' ? (task.priority === 1 ? 'HIGH' : task.priority === 2 ? 'MEDIUM' : 'LOW') : (task.priority || 'LOW')}
                  </span>
                </td>
                <td className="p-4 block md:table-cell">
                  <div className="relative inline-block w-full min-w-[130px]">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange ? onStatusChange(task.id, e.target.value) : undefined}
                      disabled={!onStatusChange}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'Cancelled' ? 'bg-rose-500' : task.status === 'Completed' ? 'bg-emerald-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap block md:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500">Start: <span className="text-xs font-bold text-slate-800">{new Date(task.start_date).toLocaleDateString() || 'NA'}</span></span>
                    <span className="text-[10px] text-slate-500">End: <span className="text-xs font-bold text-slate-800">{new Date(task.end_date).toLocaleDateString() || 'NA'}</span></span>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap block md:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500">Start: <span className="text-xs font-bold text-slate-800">{(task as any).actual_start_date ? new Date((task as any).actual_start_date).toLocaleDateString() : 'NA'}</span></span>
                    <span className="text-[10px] text-slate-500">End: <span className="text-xs font-bold text-slate-800">{(task as any).actual_end_date ? new Date((task as any).actual_end_date).toLocaleDateString() : 'NA'}</span></span>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{getMemberName(task)}</td>
                <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">{task.completion_percentage || 0}</td>
                <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell font-bold ${(task as any).is_delayed ? 'text-rose-500' : ''}">{(task as any).delay_days || 0}</td>

                <td className="p-4 whitespace-nowrap text-xs text-slate-800 block md:table-cell">
                  <div className="flex items-center gap-2">
                    {(task.audio_file || (task as any).audio_instruction_url) ? (
                      <audio controls src={getFullImageUrl(task.audio_file || String((task as any).audio_instruction_url)) || ''} className="h-8 max-w-[120px]" />
                    ) : '-'}
                    {(task.instruction_image || (task as any).instruction_image_url) ? (
                      <img src={getFullImageUrl(task.instruction_image || String((task as any).instruction_image_url)) || ''} alt="Instruction" className="h-10 w-10 object-cover rounded shadow-sm border border-slate-200" />
                    ) : null}
                  </div>
                </td>

                <td className="p-4 text-center block md:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {onUpdateProgress && (
                      <button
                        onClick={() => onUpdateProgress(task)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Update Progress"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    )}
                    {onPassDelegate && (
                      <button
                        onClick={() => onPassDelegate(task)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Pass/Delegate Task"
                      >
                        <Forward className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onView(task)}
                      className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this task?")) {
                            onDelete(task.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={12} className="p-12 text-center text-sm font-bold text-slate-800 bg-white block md:table-cell">
                  No matching tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {tasks.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <span className="text-xs text-slate-400 font-medium">
            {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, tasks.length)} of {tasks.length} activities
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
              {currentPage + 1}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskListView;
