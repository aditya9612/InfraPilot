import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import type { Project } from "../../types/project";
import KanbanBoard from "../../components/projects/KanbanBoard";
import MilestoneTimeline from "../../components/projects/MilestoneTimeline";
import TeamMembersList from "../../components/projects/TeamMembersList";
import ProfitLossCard from "../../components/projects/ProfitLossCard";
import ProjectExpensesTable from "../../components/projects/ProjectExpensesTable";
import EditProjectModal from "../../components/dashboard/EditProjectModal";
import AssignMemberModal from "../../components/projects/AssignMemberModal";
import { generateProjectReport } from "../../utils/reportGenerator";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useEffect, useCallback } from "react";

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id) : 0;

  // State for tabs
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Tasks" | "Milestones" | "Finance" | "Members"
  >("Overview");

  // State for data
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteMilestoneModalOpen, setIsDeleteMilestoneModalOpen] =
    useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<number | null>(
    null,
  );

  // Profit & Loss and Expenses (Still partially mock/local for and, but connected to stats)
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [expenses, _setExpenses] = useState<any[]>([]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [pData, mData, msData, tData, plData] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getProjectMembers(projectId),
        projectService.getMilestones(projectId),
        projectService.getTasks(projectId),
        projectService.getProjectProfitLoss(projectId).catch(() => null),
      ]);

      setProject(pData);
      setMembers(
        Array.isArray(mData) ? mData : mData.items || mData.data || [],
      );
      setMilestones(
        Array.isArray(msData) ? msData : msData.items || msData.data || [],
      );
      setTasks(Array.isArray(tData) ? tData : tData.items || tData.data || []);
      setProfitLoss(plData);

      // Expenses could be fetched from finance API if available,
      // but for now we'll rely on the project data or separate logs
    } catch (error) {
      console.error("Failed to fetch project details:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleCreateMilestone = async (milestoneData: any) => {
    try {
      await projectService.createMilestone(projectId, milestoneData);
      toast.success("Milestone created successfully");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await projectService.createTask(projectId, taskData);
      toast.success("Task created successfully");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (updatedData: any) => {
    try {
      const { task_id, project_id: _pid, ...cleanData } = updatedData;

      // Data scrubbing: Ensure we don't send IDs in the body as they are already in the URL
      // This prevents payload bloat and potential 422/Network errors on strict backends
      const payload = { ...cleanData };
      delete (payload as any).task_id;
      delete (payload as any).project_id;

      // 1. Update core task info (title, description, etc)
      await projectService.updateTask(projectId, task_id, payload);

      // 2. Explicitly update progress history if percentage is provided.
      if (payload.percentage !== undefined) {
        await projectService
          .updateTaskProgress(projectId, task_id, {
            task_id: task_id,
            percentage: payload.percentage,
            completion_percentage: payload.percentage,
            remarks: "Updated via edit modal",
          })
          .catch((err) =>
            console.warn("Task progress history sync skipped:", err),
          );
      }

      toast.success("Task updated successfully");
      fetchProjectData();
    } catch (error) {
      console.error("Task Update Failed:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await projectService.deleteTask(projectId, taskId);
      toast.success("Task deleted");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleTaskProgressUpdate = async (
    taskId: number,
    percentage: number,
    remarks: string,
  ) => {
    try {
      await projectService.updateTaskProgress(projectId, taskId, {
        percentage,
        remarks,
      });
      toast.success("Progress updated");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleTaskCommentAdd = async (taskId: number, content: string) => {
    try {
      await projectService.createTaskComment(projectId, taskId, { content });
      toast.success("Comment added");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleEditMilestone = async (updatedData: any) => {
    try {
      const { milestone_id, ...data } = updatedData;
      await projectService.updateMilestone(projectId, milestone_id, data);
      toast.success("Milestone updated");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to update milestone");
    }
  };

  const handleDeleteMilestoneClick = (id: number) => {
    setMilestoneToDelete(id);
    setIsDeleteMilestoneModalOpen(true);
  };

  const handleDeleteMilestoneConfirm = async () => {
    if (milestoneToDelete) {
      try {
        await projectService.deleteMilestone(projectId, milestoneToDelete);
        toast.success("Milestone removed");
        setIsDeleteMilestoneModalOpen(false);
        setMilestoneToDelete(null);
        fetchProjectData();
      } catch (error) {
        toast.error("Failed to remove milestone");
      }
    }
  };

  // Dynamic Progress Calculation (Fallback to frontend calculation if API progress isn't fetched)
  const calculatedProgress = useMemo(() => {
    if (project?.completion_percentage !== undefined)
      return project.completion_percentage;
    if (!tasks || tasks.length === 0) return 0;
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(
      (t) => t.status === "Completed",
    ).length;
    return Math.round((completedTasksCount / totalTasks) * 100);
  }, [tasks, project]);

  // Timeline Phase Logic
  const currentPhase = useMemo(() => {
    if (!milestones || milestones.length === 0) return "Planning";
    const inProgress = milestones.find((m) => m.status === "In Progress");
    if (inProgress) return inProgress.title;
    const completedCount = milestones.filter(
      (m) => m.status === "Completed",
    ).length;
    if (completedCount === milestones.length) return "Handover";
    return milestones[completedCount]?.title || "Executing";
  }, [milestones]);

  const handleUpdateProject = async (updatedData: any) => {
    try {
      await projectService.updateProject(projectId, updatedData);
      toast.success("Project updated");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const handleAssignMember = async (newMembers: any[]) => {
    try {
      // API currently takes one member at a time
      await Promise.all(
        newMembers.map((m) =>
          projectService.assignMember(projectId, m.user_id),
        ),
      );
      toast.success("Team member(s) assigned!");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to assign members");
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await projectService.removeMember(projectId, memberId);
      toast.success("Member removed from project");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          Syncing site data...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <>
        <Navbar
          title="Project Not Found"
          breadcrumb={["InfraPilot", "Projects", "Error"]}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
          <p className="text-slate-500 mb-6">
            The project you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
          >
            Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar
        title={project.project_name}
        breadcrumb={["InfraPilot", "Projects", project.project_name]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm">
                PRJ-{project.id}
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                  project.status === "Active"
                    ? "bg-green-100 text-success"
                    : project.status === "Delayed"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {project.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              {project.project_name}
            </h1>
            <p className="text-slate-500 text-sm max-w-xl">
              {project.description}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all border-r border-slate-100"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  const toastId = toast.loading("Downloading PDF report...");
                  try {
                    const blob =
                      await projectService.exportProjectPdf(projectId);
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute(
                      "download",
                      `Project_${projectId}_Report.pdf`,
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success("PDF Downloaded", { id: toastId });
                  } catch (error) {
                    toast.error("PDF export failed");
                    toast.dismiss(toastId);
                  }
                }}
                className="px-4 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all border-r border-slate-100"
                title="Download PDF"
              >
                PDF
              </button>
              <button
                onClick={async () => {
                  const toastId = toast.loading("Downloading Excel report...");
                  try {
                    const blob =
                      await projectService.exportProjectExcel(projectId);
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute(
                      "download",
                      `Project_${projectId}_Report.xlsx`,
                    );
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success("Excel Downloaded", { id: toastId });
                  } catch (error) {
                    toast.error("Excel export failed");
                    toast.dismiss(toastId);
                  }
                }}
                className="px-4 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                title="Download Excel"
              >
                XLSX
              </button>
            </div>

            <button
              onClick={() => {
                const toastId = toast.loading(
                  "Generating comprehensive site report (CSV)...",
                );
                setTimeout(() => {
                  generateProjectReport(
                    project,
                    members,
                    milestones,
                    expenses,
                    tasks,
                  );
                  toast.success("Site Report downloaded successfully!", {
                    id: toastId,
                  });
                }, 1000);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              Site Report (CSV)
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          {(
            ["Overview", "Tasks", "Milestones", "Finance", "Members"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-800">
                      Site Schedule & Monitoring
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                        Active Phase: {currentPhase}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Start Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {new Date(project.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        End Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {new Date(project.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Site Progress
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {calculatedProgress}% Calculated
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Task Completion Progress</span>
                      <span className="text-slate-700 font-black">
                        {calculatedProgress}%
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${calculatedProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {profitLoss && <ProfitLossCard data={profitLoss} />}
              </div>

              <div className="space-y-8">
                <TeamMembersList
                  members={members}
                  onAssignClick={() => setIsAssignModalOpen(true)}
                  onRemoveMember={handleRemoveMember}
                />
              </div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="h-[calc(100vh-280px)]">
              <KanbanBoard
                tasks={tasks}
                projectId={projectId}
                members={members}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onUpdateProgress={handleTaskProgressUpdate}
                onAddComment={handleTaskCommentAdd}
              />
            </div>
          )}

          {activeTab === "Milestones" && (
            <div className="w-full">
              <MilestoneTimeline
                milestones={milestones}
                projectId={projectId}
                onCreateMilestone={handleCreateMilestone}
                onEditMilestone={handleEditMilestone}
                onDeleteMilestone={handleDeleteMilestoneClick}
              />
            </div>
          )}

          {activeTab === "Finance" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-primary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">
                      Site-wise Expense Tracking
                    </p>
                    <h4 className="text-2xl font-black">
                      Financial Ledger: {project.project_name}
                    </h4>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <p className="text-[9px] font-bold uppercase text-white/50">
                        Total Site Expense
                      </p>
                      <p className="text-lg font-black">
                        ₹
                        {expenses
                          .reduce((acc, curr) => acc + curr.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <ProjectExpensesTable expenses={expenses} />
            </div>
          )}

          {activeTab === "Members" && (
            <div className="w-full">
              <TeamMembersList
                members={members}
                onAssignClick={() => setIsAssignModalOpen(true)}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          )}
        </div>
      </PageTransition>

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project || null}
        onSubmit={handleUpdateProject}
      />

      <ConfirmModal
        isOpen={isDeleteMilestoneModalOpen}
        onClose={() => {
          setIsDeleteMilestoneModalOpen(false);
          setMilestoneToDelete(null);
        }}
        onConfirm={handleDeleteMilestoneConfirm}
        title="Remove Milestone"
        message="Are you sure you want to remove this milestone from the project schedule? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />

      <AssignMemberModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignMember}
        existingMemberIds={members.map((m) => m.user_id)}
      />
    </>
  );
};

export default ProjectDetailsPage;
