import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import { sitePhotoService } from "../../services/sitePhotoService";
import { expenseService } from "../../services/expenseService";
import type { Project } from "../../types/project";
import MilestoneTimeline from "../../components/projects/MilestoneTimeline";
import TeamMembersList from "../../components/projects/TeamMembersList";
import ProfitLossCard from "../../components/projects/ProfitLossCard";
import ProjectExpensesTable from "../../components/projects/ProjectExpensesTable";
import { generateProjectReport, generateProjectReportPDF } from "../../utils/reportGenerator";
import { formatDateBySettings } from "../../utils/dateUtils";
import { reportService } from "../../services/reportService";
import EditProjectModal from "../../components/dashboard/EditProjectModal";
import AssignMemberModal from "../../components/projects/AssignMemberModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import ScheduleProjectModal from "../../components/projects/ScheduleProjectModal";
import CreateTaskModal from "../../components/projects/CreateTaskModal";
import TaskListView from "../../components/projects/TaskListView";
import TaskRequestListView from "../../components/projects/TaskRequestListView";
import TaskRequestModal from "../../components/projects/TaskRequestModal";
import EditTaskModal from "../../components/projects/EditTaskModal";
import TaskDetailsModal from "../../components/projects/TaskDetailsModal";
import PassTaskModal from "../../components/projects/PassTaskModal";
import UploadPhotoModal from "../../components/forms/UploadPhotoModal";
import { LayoutGrid, List as ListIcon, Upload, Trash2 } from "lucide-react";
import PLPeriodModal from "../../components/dashboard/PLPeriodModal";
import type { PLPeriodSelection } from "../../components/dashboard/PLPeriodModal";

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id) : 0;

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get("tab") as any) || "Overview";

  // State for tabs
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Milestones" | "Members" | "Tasks" | "Task Requests" | "Profit & Loss" | "Photos" | "Logs"
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
  const [taskRequests, setTaskRequests] = useState<any[]>([]);
  const [isLoadingTaskRequests, setIsLoadingTaskRequests] = useState(false);
  const [isTaskRequestModalOpen, setIsTaskRequestModalOpen] = useState(false);
  const [selectedTaskRequest, setSelectedTaskRequest] = useState<any>(null);
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

  // Task modal state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [isPassTaskModalOpen, setIsPassTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [taskRequestToDelete, setTaskRequestToDelete] = useState<number | null>(null);

  // Photo modal state
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

  // Profit & Loss and Expenses (Still partially mock/local for and, but connected to stats)
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [expenses, _setExpenses] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Profit & Loss export modal
  const [isPLPeriodModalOpen, setIsPLPeriodModalOpen] = useState(false);
  const [plPeriodFormat, setPlPeriodFormat] = useState<"PDF" | "Excel">("PDF");
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const [photoViewMode, setPhotoViewMode] = useState<"grid" | "list">("grid");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;

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
        const [mData, msData, tData, sData, prData, plData, fsData, phData, lData, eData] = await Promise.all([
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
          reportService.getFinancialSummary(projectId).catch(() => null),
          sitePhotoService.getPhotos({ project_id: projectId }).catch(() => ({ items: [] })),
          projectService.getProjectLogs(projectId).catch(() => []),
          expenseService.getExpensesByProject(projectId).catch((err) => {
            console.warn("Project Expenses Load Failure:", err);
            return [];
          }),
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
        const mergedFinancial = {
          ...plData,
          ...fsData,
          total_invoice: fsData?.total_invoice ?? plData?.total_invoice ?? 0,
          total_expense: fsData?.total_expense ?? plData?.total_expense ?? 0,
          paid_invoice: fsData?.paid_invoice ?? plData?.paid_invoice ?? 0,
          pending_invoice: fsData?.pending_invoice ?? plData?.pending_invoice ?? 0,
          profit: fsData?.profit ?? plData?.profit ?? ((fsData?.total_invoice ?? plData?.total_invoice ?? 0) - (fsData?.total_expense ?? plData?.total_expense ?? 0)),
          status: fsData?.status ?? plData?.status ?? (((fsData?.total_invoice ?? plData?.total_invoice ?? 0) - (fsData?.total_expense ?? plData?.total_expense ?? 0)) >= 0 ? 'profit' : 'loss'),
        };
        setProfitLoss(mergedFinancial);
        // Process Photos & Logs defensively
        const normalizedPhotos = Array.isArray(phData) ? phData : ((phData as any)?.items || (phData as any)?.data || []);
        const normalizedLogs = Array.isArray(lData) ? lData : ((lData as any)?.items || (lData as any)?.data || []);

        setPhotos(normalizedPhotos);
        setLogs(normalizedLogs);

        // Process granular expenses with normalization for the table
        const rawExpenses = Array.isArray(eData) ? eData : [];
        const mappedExpenses = rawExpenses.map((ex: any) => ({
          ...ex,
          id: ex.id,
          date: ex.expense_date || ex.date || new Date().toISOString(),
          category: ex.category || "Other",
          amount: Number(ex.amount) || 0,
          description: ex.description || "No description",
          status: ex.status || (ex.payment_mode ? "Paid" : "Pending")
        }));

        _setExpenses(mappedExpenses);

        // Fetch task requests independently
        projectService.getTaskRequests({ project_id: projectId }).then(trData => {
          setTaskRequests(Array.isArray(trData) ? trData : trData?.items || trData?.data || []);
        }).catch(err => {
          console.warn("Task Requests Load Failure:", err);
          setTaskRequests([]);
        });
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

  // Re-fetch logs on-demand when Logs tab is activated
  useEffect(() => {
    if (activeTab === "Logs" && projectId) {
      setIsLogsLoading(true);
      projectService.getProjectLogs(projectId)
        .then((data: any) => {
          // API may return a message object instead of an array
          if (Array.isArray(data)) {
            setLogs(data);
          } else if (data?.items || data?.data || data?.logs) {
            setLogs(data.items || data.data || data.logs);
          } else {
            // API returned a message (e.g. logs stored in ELK/file system)
            setLogs(data ? [data] : []);
          }
        })
        .catch(() => setLogs([]))
        .finally(() => setIsLogsLoading(false));
    }
  }, [activeTab, projectId]);

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
      let task_id;
      let payload;

      if (updatedData instanceof FormData) {
        task_id = Number(updatedData.get("task_id"));
        updatedData.delete("task_id");
        updatedData.delete("project_id");
        payload = updatedData;
      } else {
        const { task_id: tId, project_id: _pid, ...cleanData } = updatedData;
        task_id = tId || updatedData.id;
        payload = { ...cleanData };
        delete (payload as any).task_id;
        delete (payload as any).project_id;
      }

      // 1. Update core task info (title, description, etc)
      await projectService.updateTask(projectId, task_id, payload);

      // 2. Explicitly update progress history if percentage is provided.
      const percentageStr = payload instanceof FormData ? payload.get("percentage") : payload.percentage;
      if (percentageStr !== undefined && percentageStr !== null) {
        const percentage = Number(percentageStr);
        await projectService
          .updateTaskProgress(projectId, task_id, {
            task_id: task_id,
            percentage: percentage,
            completion_percentage: percentage,
            remarks: "Updated via edit modal",
          })
          .catch((err) =>
            console.warn("Task progress history sync skipped:", err),
          );
      }

      toast.success("Task updated successfully");
      fetchProjectData();
    } catch (err: any) {
      console.error("Task update failed", err);
      toast.error(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleUploadPhotoSubmit = async (formData: FormData) => {
    try {
      await sitePhotoService.uploadPhoto(formData);
      toast.success("Photo uploaded successfully");
      fetchProjectData();
    } catch (err) {
      toast.error("Failed to upload photo");
      throw err; // throw to modal
    }
  };

  const handleDeletePhotoConfirm = async () => {
    if (!photoToDelete) return;
    try {
      await sitePhotoService.deletePhoto(photoToDelete);
      toast.success("Photo deleted successfully");
      setPhotoToDelete(null);
      fetchProjectData();
    } catch (err) {
      toast.error("Failed to delete photo");
    }
  };

  const handleDeletePhoto = (e: React.MouseEvent, photoId: number) => {
    e.stopPropagation();
    setPhotoToDelete(photoId);
  };

  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await projectService.deleteTask(projectId, taskToDelete);
      toast.success("Task deleted");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await projectService.updateTaskStatus(projectId, taskId, newStatus);
      toast.success("Task status updated");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePassTask = async (data: { new_user_id: number; remark: string }) => {
    if (!selectedTask) return;
    try {
      await projectService.passTask(projectId, selectedTask.id, data);
      toast.success("Task passed successfully");
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to pass task");
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
      (t) => t.status?.toLowerCase() === "completed",
    ).length;
    return Math.round((completedTasksCount / totalTasks) * 100);
  }, [tasks, project, progress]);

  // Timeline Phase Logic
  const currentPhase = useMemo(() => {
    if (!milestones || milestones.length === 0) return "Planning";
    const inProgress = milestones.find((m) => m.status?.toLowerCase() === "in progress");
    if (inProgress) return inProgress.title;
    const completedCount = milestones.filter(
      (m) => m.status?.toLowerCase() === "completed",
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

  const handlePLPeriodConfirm = async (selection: PLPeriodSelection) => {
    const toastId = toast.loading(`Generating ${plPeriodFormat} report...`);
    try {
      const filters = {
        year: selection.year ?? null,
        quarter: selection.type === "quarterly" ? (selection.quarter ?? null) : null,
        start_date: selection.start_date ?? null,
        end_date: selection.end_date ?? null,
      };
      const blob = plPeriodFormat === "PDF"
        ? await reportService.exportProfitLossPdf(projectId, filters)
        : await reportService.exportProfitLossExcel(projectId, filters);

      if (blob && !blob.type?.includes("json")) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.setAttribute("download", `ProfitLoss_${project?.project_name.replace(/\s+/g, '_')}_${selection.type}_${selection.year}.${plPeriodFormat === "PDF" ? "pdf" : "xlsx"}`);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Report exported successfully", { id: toastId });
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- Task Request Handlers ---
  const handleSaveTaskRequest = async (payload: any) => {
    try {
      setIsLoadingTaskRequests(true);
      if (selectedTaskRequest) {
        await projectService.updateTaskRequest(selectedTaskRequest.id, payload);
        toast.success("Task request updated successfully");
      } else {
        await projectService.createTaskRequest(projectId, payload);
        toast.success("Task request created successfully");
      }
      setIsTaskRequestModalOpen(false);
      setSelectedTaskRequest(null);
      const trData = await projectService.getTaskRequests({ project_id: projectId });
      setTaskRequests(Array.isArray(trData) ? trData : trData?.items || trData?.data || []);
    } catch (error) {
      toast.error(selectedTaskRequest ? "Failed to update task request" : "Failed to create task request");
      console.error(error);
    } finally {
      setIsLoadingTaskRequests(false);
    }
  };

  const handleDeleteTaskRequest = (requestId: number) => {
    setTaskRequestToDelete(requestId);
  };

  const handleDeleteTaskRequestConfirm = async () => {
    if (!taskRequestToDelete) return;
    try {
      setIsLoadingTaskRequests(true);
      await projectService.deleteTaskRequest(taskRequestToDelete);
      toast.success("Task request deleted successfully");
      const trData = await projectService.getTaskRequests({ project_id: projectId });
      setTaskRequests(Array.isArray(trData) ? trData : trData?.items || trData?.data || []);
    } catch (error) {
      toast.error("Failed to delete task request");
      console.error(error);
    } finally {
      setIsLoadingTaskRequests(false);
      setTaskRequestToDelete(null);
    }
  };

  const handleEditTaskRequest = (request: any) => {
    setSelectedTaskRequest(request);
    setIsTaskRequestModalOpen(true);
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

          {activeTab === "Overview" && <div className="flex gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              Update Project
            </button>

            <button
              onClick={async () => {
                const toastId = toast.loading("Generating Excel report...");
                try {
                  const blob = await projectService.exportProjectExcel(project.id);
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `SiteReport_${project.project_name.replace(/\s+/g, '_')}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success("Excel report downloaded!", { id: toastId });
                } catch {
                  generateProjectReport(project, members, milestones, expenses, tasks);
                  toast.success("Excel report downloaded!", { id: toastId });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button
              onClick={async () => {
                const toastId = toast.loading("Generating PDF report...");
                try {
                  const blob = await projectService.exportProjectPdf(project.id);
                  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `SiteReport_${project.project_name.replace(/\s+/g, '_')}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success("PDF report downloaded!", { id: toastId });
                } catch {
                  generateProjectReportPDF(project, members, milestones, expenses, tasks);
                  toast.success("PDF report downloaded!", { id: toastId });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>}
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          {(
            ["Overview", "Milestones", "Members", "Tasks", "Task Requests", "Profit & Loss", "Photos", "Logs"] as const
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
            <div className="space-y-6">
              {/* Row 1: Schedule (full width) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-800">Site Schedule & Monitoring</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 hover:bg-white hover:shadow-md transition-all group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</p>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {formatDateBySettings(schedule?.start_date || project.start_date)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 hover:bg-white hover:shadow-md transition-all group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</p>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {formatDateBySettings(schedule?.end_date || project.end_date)}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 hover:bg-white hover:shadow-md transition-all group">
                    <p className="text-[10px] font-bold text-primary/60 uppercase mb-1">Site Progress</p>
                    <p className="text-sm font-bold text-primary">{Number(displayProgress).toFixed(2)}% Calculated</p>
                  </div>
                </div>
              </div>

              {/* Row 2: Left col (Location + Financial) | Right col (Team Members) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: Location + Financial stacked */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Project Identity & Location */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      Project Identity & Location
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Project Type</p>
                        <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 text-center">{project.type || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Location Category</p>
                        <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 text-center">{project.location_type || "N/A"}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Site Address</p>
                        <p className="text-sm font-medium text-slate-600 italic">
                          {project.site_address ? `${project.site_address}, ${project.city}, ${project.pincode}` : "Address not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="p-2 bg-white rounded-lg border border-blue-100 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">GPS Navigation</p>
                          <div className="flex gap-3">
                            <span className="text-xs font-mono font-bold text-slate-700">Lat: {project.latitude || "—"}</span>
                            <span className="text-xs font-mono font-bold text-slate-700">Long: {project.longitude || "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Region</p>
                          <p className="text-xs font-bold text-slate-700">{project.state}, {project.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  {profitLoss && <ProfitLossCard data={profitLoss} />}
                </div>

                {/* Right: Team Members */}
                <div>
                  <TeamMembersList
                    members={members}
                    onAssignClick={() => setIsAssignModalOpen(true)}
                    onRemoveMember={handleRemoveMemberClick}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                  <p className="text-2xl font-black text-slate-800">{tasks.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Planned</p>
                  <p className="text-2xl font-black text-slate-500">{tasks.filter(t => t.status?.toLowerCase() === "planned").length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                  <p className="text-2xl font-black text-primary">{tasks.filter(t => t.status?.toLowerCase() === "in progress").length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-2xl font-black text-emerald-600">{tasks.filter(t => t.status?.toLowerCase() === "completed").length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelled</p>
                  <p className="text-2xl font-black text-rose-500">{tasks.filter(t => t.status?.toLowerCase() === "cancelled").length}</p>
                </div>
              </div>

              {/* Activity Management Section */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">Activity Management</h3>
                    <p className="text-xs text-slate-400">Track and manage site activities in a detailed list view.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search activities..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48"
                      />
                    </div>
                    <select
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                      className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                    >
                      <option value="All">All Status</option>
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setIsCreateTaskModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                      + New Task
                    </button>
                  </div>
                </div>
                <TaskListView
                  tasks={tasks.filter(t => {
                    const matchesSearch = !taskSearchQuery ||
                      t.title?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                      t.description?.toLowerCase().includes(taskSearchQuery.toLowerCase());
                    const matchesStatus = taskStatusFilter === "All" ||
                      t.status === taskStatusFilter;
                    return matchesSearch && matchesStatus;
                  })}
                  members={members}
                  projectName={project?.project_name}
                  onEdit={(task) => { setSelectedTask(task); setIsEditTaskModalOpen(true); }}
                  onDelete={handleDeleteTask}
                  onView={(task) => { setSelectedTask(task); setIsViewTaskModalOpen(true); }}
                  onStatusChange={handleTaskStatusChange}
                  onPassDelegate={(task) => { setSelectedTask(task); setIsPassTaskModalOpen(true); }}
                />
              </div>
            </div>
          )}

          {activeTab === "Milestones" && (
            <div className="space-y-6 w-full">
              {/* Milestone Count Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Total", value: milestones.length, color: "text-slate-800" },
                  { label: "Planned", value: milestones.filter(m => m.status?.toLowerCase() === "planned").length, color: "text-blue-600" },
                  { label: "In Progress", value: milestones.filter(m => m.status?.toLowerCase() === "in progress").length, color: "text-primary" },
                  { label: "Completed", value: milestones.filter(m => m.status?.toLowerCase() === "completed").length, color: "text-emerald-600" },
                  { label: "Delayed", value: milestones.filter(m => m.status?.toLowerCase() === "delayed").length, color: "text-rose-600" },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <MilestoneTimeline
                milestones={milestones}
                projectId={projectId}
                tasks={tasks}
                members={members}
                onCreateMilestone={handleCreateMilestone}
                onEditMilestone={handleEditMilestone}
                onDeleteMilestone={handleDeleteMilestoneClick}
              />
            </div>
          )}

          {activeTab === "Task Requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Task Requests</h3>
                  <p className="text-sm text-slate-500">Manage and track material or labor requests for this project.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTaskRequest(null);
                    setIsTaskRequestModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                >
                  + New Request
                </button>
              </div>

              <TaskRequestListView
                taskRequests={taskRequests}
                isLoading={isLoadingTaskRequests}
                onEdit={handleEditTaskRequest}
                onDelete={handleDeleteTaskRequest}
                members={members}
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
                    {/* Download Buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          setPlPeriodFormat("Excel");
                          setIsPLPeriodModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          setPlPeriodFormat("PDF");
                          setIsPLPeriodModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-all active:scale-95 border border-white/20"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        PDF
                      </button>
                    </div>
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
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-slate-800">Site Photos Gallery</h3>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPhotoViewMode("grid")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center ${photoViewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPhotoViewMode("list")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center ${photoViewMode === "list" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
                      title="List View"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsUploadPhotoModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </button>
                </div>
              </div>

              {photoViewMode === "grid" ? (
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setViewingPhoto(sitePhotoService.resolveUrl(photo.url))}
                      className="aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer relative group"
                    >
                      <img src={sitePhotoService.resolveUrl(photo.url) || ""} alt={photo.description} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => handleDeletePhoto(e, photo.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {photos.map((photo) => (
                    <div key={photo.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                      <div
                        onClick={() => setViewingPhoto(sitePhotoService.resolveUrl(photo.url))}
                        className="w-16 h-16 shrink-0 bg-slate-200 rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/50 cursor-pointer relative group"
                      >
                        <img src={sitePhotoService.resolveUrl(photo.url) || ""} alt={photo.description} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-800">{photo.title || "Photo"}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{photo.description || "No description provided."}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{photo.created_at ? formatDateBySettings(photo.created_at) : 'N/A'}</p>
                        <button
                          onClick={(e) => handleDeletePhoto(e, photo.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 italic text-slate-400">
                  <p>No site photos uploaded yet.</p>
                </div>
              )}

              {/* Fullscreen Photo Viewer Lightbox */}
              {viewingPhoto && (
                <div
                  className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
                  onClick={() => setViewingPhoto(null)}
                >
                  <img
                    src={viewingPhoto}
                    alt="Enlarged"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                  />
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "Logs" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Project Activity Logs</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{logs.length} {logs.length === 1 ? "Entry" : "Entries"}</span>
              </div>
              {isLogsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading logs...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.length > 0 ? (
                    <>
                      {logs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage).map((log: any, i: number) => {
                        // If the entry is a plain message object (not a log entry)
                        const isMessageOnly = log.message && !log.action && !log.created_at && !log.timestamp && Object.keys(log).length <= 3;
                        if (isMessageOnly) {
                          return (
                            <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <div>
                                <p className="text-sm font-semibold text-amber-800">{log.message}</p>
                                {log.project_id && <p className="text-[10px] text-amber-600 mt-1">Project ID: {log.project_id}</p>}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                              {i < logs.length - 1 && <div className="w-px flex-1 bg-slate-100 min-h-[16px]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-slate-800">
                                  {log.message || log.action || log.description || log.event || "Activity logged"}
                                </p>
                                {(log.action_type || log.event_type || log.type) && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0">
                                    {log.action_type || log.event_type || log.type}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {(log.user_name || log.performed_by || log.actor || log.created_by) && (
                                  <span className="text-[10px] font-bold text-primary">
                                    {log.user_name || log.performed_by || log.actor || log.created_by}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {log.created_at || log.timestamp || log.date
                                    ? new Date(log.created_at || log.timestamp || log.date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {logs.length > logsPerPage && (
                        <div className="flex items-center justify-between mt-6 p-4 border-t border-slate-100 bg-slate-50/50 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing {(logPage - 1) * logsPerPage + 1} to {Math.min(logPage * logsPerPage, logs.length)} of {logs.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                              disabled={logPage === 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-xs font-bold text-slate-600 w-8 text-center">{logPage}</span>
                            <button
                              onClick={() => setLogPage((p) => Math.min(Math.ceil(logs.length / logsPerPage), p + 1))}
                              disabled={logPage === Math.ceil(logs.length / logsPerPage)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <p className="text-sm font-bold text-slate-400">No activity logs found for this project.</p>
                    </div>
                  )}
                </div>
              )}
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
        title="Remove Member"
        message="Are you sure you want to remove this member from the project? This action cannot be undone."
        confirmText="Remove Member"
      />

      <ConfirmModal
        isOpen={photoToDelete !== null}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleDeletePhotoConfirm}
        title="Discard Activity Entry"
        message="Are you sure you want to delete this activity record? This action will permanently remove the entry and all its progress history from the project ledger."
        confirmText="Archive Record"
        type="danger"
      />

      <ConfirmModal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task record? This action will permanently remove the entry and all its progress history from the project ledger."
        confirmText="Archive Record"
        type="danger"
      />

      <ConfirmModal
        isOpen={taskRequestToDelete !== null}
        onClose={() => setTaskRequestToDelete(null)}
        onConfirm={handleDeleteTaskRequestConfirm}
        title="Delete Task Request"
        message="Are you sure you want to delete this task request? This action will permanently remove the entry from the project ledger."
        confirmText="Archive Record"
        type="danger"
      />

      <UploadPhotoModal
        isOpen={isUploadPhotoModalOpen}
        onClose={() => setIsUploadPhotoModalOpen(false)}
        onSubmit={handleUploadPhotoSubmit}
        projectId={projectId}
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

      {/* Task Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={projectId}
        members={members}
        onSubmit={handleCreateTask}
      />
      {isEditTaskModalOpen && selectedTask && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => {
            setIsEditTaskModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          members={members}
          onSubmit={handleUpdateTask}
        />
      )}
      {isViewTaskModalOpen && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => {
            setIsViewTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdateProgress={(percentage, remarks) => handleTaskProgressUpdate(selectedTask.id, percentage, remarks)}
        />
      )}
      {isPassTaskModalOpen && selectedTask && (
        <PassTaskModal
          isOpen={isPassTaskModalOpen}
          onClose={() => {
            setIsPassTaskModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          members={members}
          onSubmit={handlePassTask}
        />
      )}

      <PLPeriodModal
        isOpen={isPLPeriodModalOpen}
        onClose={() => setIsPLPeriodModalOpen(false)}
        reportName="Profit & Loss Statement"
        format={plPeriodFormat}
        onConfirm={(selection: PLPeriodSelection) => {
          setIsPLPeriodModalOpen(false);
          handlePLPeriodConfirm(selection);
        }}
      />

      <TaskRequestModal
        isOpen={isTaskRequestModalOpen}
        onClose={() => {
          setIsTaskRequestModalOpen(false);
          setSelectedTaskRequest(null);
        }}
        onSubmit={handleSaveTaskRequest}
        projectMembers={members}
        editingRequest={selectedTaskRequest}
        isLoading={isLoadingTaskRequests}
        projectId={projectId || undefined}
        assignedProjects={[{ id: projectId, project_name: project.project_name }]}
      />
    </>
  );
};

export default ProjectDetailsPage;
