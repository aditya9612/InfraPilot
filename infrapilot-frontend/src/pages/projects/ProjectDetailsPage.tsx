import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import { sitePhotoService } from "../../services/sitePhotoService";
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
import ScheduleProjectModal from "../../components/projects/ScheduleProjectModal";

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id) : 0;

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get("tab") as any) || "Overview";

  // State for tabs
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Schedule" | "Members" | "Progress" | "Profit & Loss" | "Photos" | "Logs"
  >(initialTab);

  // State for data
  const [project, setProject] = useState<Project | null>(null);
  const [schedule, setSchedule] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    completion_percentage: number;
    status: string;
  } | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteMilestoneModalOpen, setIsDeleteMilestoneModalOpen] =
    useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<number | null>(
    null,
  );
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  // Profit & Loss and Expenses (Still partially mock/local for and, but connected to stats)
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [expenses, _setExpenses] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);

      // Stage 1: Load essential project metadata first
      const pData = await projectService.getProjectById(projectId).catch((err) => {
        console.error("Critical Project Meta Load Failure:", err);
        return null;
      });

      if (pData) {
        setProject(pData);
        // Important: Stop the global loading state as soon as we have core data
        setLoading(false);
      }

      // Stage 2: Load secondary data modules in parallel
      // We don't await this entire block before showing the page
      const loadSecondaryData = async () => {
        const [mData, msData, tData, sData, prData, plData, phData, lData] = await Promise.all([
          projectService.getProjectMembers(projectId).catch((err) => {
            console.warn("Members Load Failure:", err);
            return [];
          }),
          projectService.getMilestones(projectId).catch((err) => {
            console.warn("Milestones Load Failure:", err);
            return [];
          }),
          projectService.getTasks(projectId).catch((err) => {
            console.warn("Tasks Load Failure:", err);
            return [];
          }),
          projectService.getProjectSchedule(projectId).catch(() => null),
          projectService.getProjectProgress(projectId).catch(() => null),
          projectService.getProjectProfitLoss(projectId).catch(() => null),
          sitePhotoService.getPhotos({ project_id: projectId }).catch(() => ({ items: [] })),
          projectService.getProjectLogs(projectId).catch(() => []),
        ]);

        // Process Members
        const rawMembers = Array.isArray(mData) ? mData : mData.items || mData.data || [];
        const mappedMembers = rawMembers.map((m: any) => ({
          user_id: m.user_id || m.user?.id || m.user?.user_id || m.id,
          full_name: m.full_name || m.user?.full_name || m.user?.name || `User ${m.user_id || m.id || "Unknown"}`,
          email: m.email || m.user?.email || "",
          role: m.role || m.user?.role || "Member"
        }));
        setMembers(mappedMembers);

        // Process Milestones
        setMilestones(Array.isArray(msData) ? msData : msData.items || msData.data || []);

        // Process Tasks
        setTasks(Array.isArray(tData) ? tData : tData.items || tData.data || []);

        // Process Schedule, Progress & Finance
        setSchedule(sData);
        setProgress(prData);
        setProfitLoss(plData);
        // Process Photos & Logs defensively
        const normalizedPhotos = Array.isArray(phData) ? phData : ((phData as any)?.items || (phData as any)?.data || []);
        const normalizedLogs = Array.isArray(lData) ? lData : ((lData as any)?.items || (lData as any)?.data || []);

        setPhotos(normalizedPhotos);
        setLogs(normalizedLogs);

        // Fallback or process expenses if plData contains them (demo items handled by component)
        // If plData has a list of items, we would use it here.
        if (plData && plData.expenses) {
          _setExpenses(plData.expenses);
        }
      };

      loadSecondaryData();

    } catch (error) {
      console.error("Unexpected fetch error:", error);
      toast.error("Failed to load project details");
    } finally {
      // Ensure loading state is off if Stage 1 failed or caught an error
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
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || "Failed to create task";
      toast.error(errorDetail);
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
  const displayProgress = useMemo(() => {
    if (progress?.completion_percentage !== undefined)
      return progress.completion_percentage;
    if (project?.completion_percentage !== undefined)
      return project.completion_percentage;
    if (!tasks || tasks.length === 0) return 0;
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(
      (t) => t.status === "Completed",
    ).length;
    return Math.round((completedTasksCount / totalTasks) * 100);
  }, [tasks, project, progress]);

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

  const handleRemoveMemberClick = (memberId: number) => {
    setMemberToDelete(memberId);
    setIsDeleteMemberModalOpen(true);
  };

  const handleRemoveMemberConfirm = async () => {
    if (memberToDelete) {
      try {
        await projectService.removeMember(projectId, memberToDelete);
        toast.success("Member removed from project");
        setIsDeleteMemberModalOpen(false);
        setMemberToDelete(null);
        fetchProjectData();
      } catch (error) {
        toast.error("Failed to remove member");
      }
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
                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${project.status === "Ongoing"
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
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              Edit
            </button>

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
            ["Overview", "Schedule", "Members", "Progress", "Profit & Loss", "Photos", "Logs"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${activeTab === tab
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="px-3 py-1 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all border border-primary/10"
                      >
                        Update Schedule
                      </button>
                      <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                          Active Phase: {currentPhase}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Start Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {new Date(
                          schedule?.start_date || project.start_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        End Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {new Date(
                          schedule?.end_date || project.end_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Site Progress
                      </p>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                        {displayProgress}% Calculated
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Task Completion Progress</span>
                      <span className="text-slate-700 font-black">
                        {displayProgress}%
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Project Identity & Location Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    Project Identity & Location
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Project Type</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 inline-block w-full text-center">
                        {project.type || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Location Category</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 inline-block w-full text-center">
                        {project.location_type || "N/A"}
                      </p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Site Address</p>
                      <p className="text-sm font-medium text-slate-600 italic">
                        {project.site_address ? `${project.site_address}, ${project.city}, ${project.pincode}` : "Address not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /><path d="m16.24 7.76-8.48 8.48" /><path d="m7.76 7.76 8.48 8.48" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">GPS Navigation</p>
                        <div className="flex gap-4 mt-1">
                          <div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase block">Lat</span>
                            <span className="text-sm font-mono font-bold text-slate-800">{project.latitude || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase block">Long</span>
                            <span className="text-sm font-mono font-bold text-slate-800">{project.longitude || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Region</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">
                          {project.state}, {project.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {profitLoss && <ProfitLossCard data={profitLoss} />}
              </div>

              <div className="space-y-8">
                <TeamMembersList
                  members={members}
                  onAssignClick={() => setIsAssignModalOpen(true)}
                  onRemoveMember={handleRemoveMemberClick}
                />
              </div>
            </div>
          )}

          {activeTab === "Progress" && (
            <div className="space-y-6 h-[calc(100vh-280px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Calculated Completion</p>
                  <p className="text-2xl font-black text-primary">{progress?.completion_percentage || displayProgress}%</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-2xl font-black text-slate-700">{progress?.status || project.status}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Tasks</p>
                  <p className="text-2xl font-black text-slate-700">{tasks.length}</p>
                </div>
              </div>
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

          {activeTab === "Schedule" && (
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</p>
                    <p className="text-lg font-black text-slate-700">{new Date(schedule?.start_date || project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target End Date</p>
                    <p className="text-lg font-black text-slate-700">{new Date(schedule?.end_date || project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
              </div>
              <MilestoneTimeline
                milestones={milestones}
                projectId={projectId}
                onCreateMilestone={handleCreateMilestone}
                onEditMilestone={handleEditMilestone}
                onDeleteMilestone={handleDeleteMilestoneClick}
              />
            </div>
          )}

          {activeTab === "Profit & Loss" && (
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
                  <div className="flex flex-wrap gap-4">
                    <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <p className="text-[9px] font-bold uppercase text-white/50 mb-1">
                        Total Invoiced
                      </p>
                      <p className="text-xl font-black">
                        ₹{profitLoss?.total_invoice?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <p className="text-[9px] font-bold uppercase text-white/50 mb-1">
                        Total Expenses
                      </p>
                      <p className="text-xl font-black">
                        ₹{(profitLoss?.total_expense || expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-4 py-3 backdrop-blur-md rounded-xl border ${profitLoss?.status === 'profit' ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-red-500/20 border-red-400/30'}`}>
                      <p className="text-[9px] font-bold uppercase text-white/50 mb-1">
                        Net {profitLoss?.status || 'Position'}
                      </p>
                      <p className="text-xl font-black">
                        ₹{profitLoss?.profit?.toLocaleString() || "0"}
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
                onRemoveMember={handleRemoveMemberClick}
              />
            </div>
          )}

          {activeTab === "Photos" && (
            <div className="w-full">
              {/* Photo Gallery mapping placeholder */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <img src={sitePhotoService.resolveUrl(photo.url) || ""} alt={photo.description} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {photos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 italic text-slate-400">
                  <p>No site photos uploaded yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Logs" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-widest text-xs">Project Activity Logs</h3>
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all p-2 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700">{log.message || log.action || "Activity logged"}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(log.created_at || log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    No logs found for this project.
                  </div>
                )}
              </div>
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

      <ConfirmModal
        isOpen={isDeleteMemberModalOpen}
        onClose={() => {
          setIsDeleteMemberModalOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleRemoveMemberConfirm}
        title="Remove Team Member"
        message="Are you sure you want to remove this member from the project? They will lose access to all project-related tasks and reports."
        confirmText="Remove"
        type="danger"
      />

      <AssignMemberModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignMember}
        existingMemberIds={members.map((m) => m.user_id)}
      />

      <ScheduleProjectModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        projectId={projectId}
        initialStartDate={schedule?.start_date || project?.start_date}
        initialEndDate={schedule?.end_date || project?.end_date}
        onSuccess={fetchProjectData}
      />
    </>
  );
};

export default ProjectDetailsPage;
