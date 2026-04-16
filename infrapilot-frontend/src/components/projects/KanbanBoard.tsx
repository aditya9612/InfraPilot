import { useState } from "react";
<<<<<<< HEAD
import type { Task, TaskStatus } from "../../types/project";
import TaskCard from "./TaskCard";
import TaskDetailsModal from "./TaskDetailsModal";

interface KanbanBoardProps {
  tasks: Task[];
}

const KanbanBoard = ({ tasks }: KanbanBoardProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns: { title: string; status: TaskStatus; color: string }[] = [
    { title: "Planned", status: "Planned", color: "bg-slate-500" },
    { title: "In Progress", status: "In Progress", color: "bg-primary" },
    { title: "Delayed", status: "Delayed", color: "bg-red-500" },
    { title: "Completed", status: "Completed", color: "bg-success" },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Task Management</h3>
          <p className="text-xs text-slate-500">Visual Kanban flow for site activities.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
             <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <input type="text" placeholder="Search tasks..." className="bg-transparent text-xs outline-none w-32 placeholder:text-slate-300" />
          </div>
          <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            + Add Task
=======
import type { Task, ProjectMember } from "../../types/project";
import TaskDetailsModal from "./TaskDetailsModal";
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import ConfirmModal from "../common/ConfirmModal";
import TaskListView from "./TaskListView";

interface KanbanBoardProps {
  tasks: Task[];
  projectId: number;
  members: ProjectMember[];
  onCreateTask?: (taskData: any) => void;
  onUpdateTask?: (taskData: any) => void;
  onDeleteTask?: (id: number) => void;
  onUpdateProgress?: (taskId: number, percentage: number, remarks: string) => void;
  onAddComment?: (taskId: number, content: string) => void;
}

const KanbanBoard = ({
  tasks,
  projectId,
  members,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateProgress,
  onAddComment,
}: KanbanBoardProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete);
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30 rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">
            Activity Management
          </h3>
          <p className="text-xs text-slate-500">
            Track and manage site activities in a detailed list view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50">
            <svg
              className="w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search activities..."
              className="bg-transparent text-xs outline-none w-40 placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            + New Task
>>>>>>> testing
          </button>
        </div>
      </div>

<<<<<<< HEAD
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          
          return (
            <div key={column.status} className="flex-shrink-0 w-80 flex flex-col group/col">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${column.color}`} />
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    {column.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-100 text-[10px] font-bold text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                </button>
              </div>

              <div className="flex-1 space-y-4 min-h-[500px] p-2 rounded-2xl transition-colors group-hover/col:bg-slate-100/50">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                
                {columnTasks.length === 0 && (
                   <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl group-hover/col:border-slate-200 transition-all">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Empty</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
=======
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <TaskListView
          tasks={tasks}
          members={members}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={(t) => setSelectedTask(t)}
        />
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        members={members}
        onSubmit={onCreateTask}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        members={members}
        onSubmit={onUpdateTask}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Remove Activity"
        message="Are you sure you want to delete this activity? This will permanently remove all progress and comments associated with it."
        confirmText="Delete"
        type="danger"
      />

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateProgress={(percentage, remarks) => onUpdateProgress?.(selectedTask.id, percentage, remarks)}
          onAddComment={(content) => onAddComment?.(selectedTask.id, content)}
>>>>>>> testing
        />
      )}
    </div>
  );
};

export default KanbanBoard;
