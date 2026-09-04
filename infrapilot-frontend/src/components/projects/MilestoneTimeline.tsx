import { useState } from "react";
import type { Milestone, Task, ProjectMember } from "../../types/project";
import CreateMilestoneModal from "./CreateMilestoneModal";
import EditMilestoneModal from "./EditMilestoneModal";
import MilestoneDetailsModal from "./MilestoneDetailsModal";
import { projectService } from "../../services/projectService";

interface MilestoneTimelineProps {
  milestones: Milestone[];
  projectId: number;
  tasks?: Task[];
  members?: ProjectMember[];
  onCreateMilestone?: (data: any) => void;
  onEditMilestone?: (data: any) => void;
  onDeleteMilestone?: (id: number) => void;
}

const MilestoneTimeline = ({
  milestones,
  projectId,
  tasks = [],
  members = [],
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone
}: MilestoneTimelineProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(null);

  const handleEditClick = async (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setIsEditModalOpen(true);
    // Optionally fetch full details for editing if needed, but standard is just use local
  };

  const handleViewClick = async (milestone: Milestone) => {
    // Open immediately with local data for snappy UI
    setViewingMilestone(milestone);
    setIsViewModalOpen(true);

    // Fetch full data in background to update modal
    try {
      const fullMilestone = await projectService.getMilestone(projectId, milestone.id);
      if (fullMilestone) {
        setViewingMilestone((prev: any) => ({ ...prev, ...fullMilestone }));
      }
    } catch (error) {
      console.warn("Failed to fetch full milestone details", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-slate-800">Project Milestones</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-1.5 bg-primary/5 text-primary rounded-lg text-xs font-bold hover:bg-primary/10 transition-all border border-primary/10"
        >
          + New Milestone
        </button>
      </div>

      <CreateMilestoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        onSubmit={onCreateMilestone}
      />

      <EditMilestoneModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMilestone(null);
        }}
        milestone={editingMilestone}
        onSubmit={onEditMilestone}
      />

      {isViewModalOpen && viewingMilestone && (
        <MilestoneDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingMilestone(null);
          }}
          milestone={viewingMilestone}
          tasks={tasks.filter((t) => t.milestone_id === viewingMilestone.id)}
          members={members}
        />
      )}

      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {milestones.map((milestone) => {
          const statusLower = (milestone.status || "").toLowerCase();
          const isCompleted = statusLower === "completed";
          const isInProgress = statusLower === "in progress" || statusLower === "ongoing";
          const isDelayed = statusLower === "delayed";

          return (
            <div key={milestone.id} className="relative group">
              {/* Dot */}
              <div className={`absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-white z-10 transition-all ${isCompleted ? 'bg-emerald-500' :
                  isInProgress ? 'bg-blue-500 animate-pulse' :
                    isDelayed ? 'bg-rose-500' :
                      'bg-slate-300'
                }`} />

              <div className={`p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-50/20 border-emerald-100/50' :
                  isInProgress ? 'bg-blue-50/20 border-blue-100/50 shadow-sm' :
                    isDelayed ? 'bg-rose-50/20 border-rose-100/50 shadow-sm' :
                      'bg-slate-50/50 border-slate-200/50'
                }`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-800' :
                        isDelayed ? 'text-rose-800' :
                          'text-slate-800'
                      }`}>
                      {milestone.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isCompleted ? 'bg-emerald-100 text-emerald-700' :
                        isInProgress ? 'bg-blue-100 text-blue-700' :
                          isDelayed ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                      }`}>
                      {milestone.status || 'Pending'}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleViewClick(milestone)}
                        className="p-1 text-slate-400 hover:text-primary hover:bg-white rounded transition-all"
                        title="View Milestone Details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditClick(milestone)}
                        className="p-1 text-slate-400 hover:text-primary hover:bg-white rounded transition-all"
                        title="Edit Milestone"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteMilestone && onDeleteMilestone(milestone.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-white rounded transition-all"
                        title="Delete Milestone"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{milestone.description}</p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(milestone.start_date || "").toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    <span className="text-slate-300 mx-1">→</span>
                    {new Date(milestone.end_date || "").toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📍</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Milestones Defined</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
