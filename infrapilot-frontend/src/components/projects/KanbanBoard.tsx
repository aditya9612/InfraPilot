import { useState, useEffect } from "react";
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

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(0);

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const paginatedTasks = filteredTasks.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  useEffect(() => {
    // Also reset to 0 if tasks list changes
    setCurrentPage(0);
  }, [tasks.length]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
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
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50">
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
              className="bg-transparent text-xs outline-none w-40 placeholder:text-slate-300 font-medium"
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

      <div className="flex-1">
        <TaskListView
          tasks={paginatedTasks}
          members={members}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={(t) => setSelectedTask(t)}
        />
      </div>

      {/* Pagination Controls (Matching UsersPage style) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredTasks.length)} of {filteredTasks.length} Activities
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter bg-white shadow-sm shadow-slate-100">
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
