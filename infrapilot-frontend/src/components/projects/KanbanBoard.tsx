import { useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs outline-none w-40 placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            + New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <TaskListView
          tasks={tasks.filter(t => 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
          )}
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
        />
      )}
    </div>
  );
};

export default KanbanBoard;
