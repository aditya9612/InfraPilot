import { useState, useEffect, useCallback, useRef } from "react";
import type { Task, TaskProgress, TaskComment } from "../../types/project";
import { projectService } from "../../services/projectService";
import { userService } from "../../services/userService";
import toast from "react-hot-toast";
import {
  X, Calendar, User, Clock, AlertCircle, Paperclip, Send, CheckCircle, FileText
} from "lucide-react";
import { getFullImageUrl } from "../../utils/imageUtils";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdateProgress?: (percentage: number, remarks: string) => void;
  onAddComment?: (content: string) => void;
}

const TaskDetailsModal = ({ task, onClose, onUpdateProgress: _onUpdateProgress, onAddComment }: TaskDetailsModalProps) => {
  const [taskDetails, setTaskDetails] = useState<Task>(task);
  const [history, setHistory] = useState<TaskProgress[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalTab, setModalTab] = useState<"Details" | "Activity" | "Comments">("Details");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Resolved name state
  const [projectName, setProjectName] = useState<string>((task as any).projectName || "");
  const [milestoneName, setMilestoneName] = useState<string>((task as any).milestoneName || "");
  const [boqName, setBoqName] = useState<string>((task as any).boqName || "");
  const [creatorName, setCreatorName] = useState<string>((task as any).creatorName || "");
  const [assignedNames, setAssignedNames] = useState<string>(() => {
    // Safely resolve initial assignedNames — could be string[], object[], or string
    const raw = (task as any).assignedNames;
    if (!raw) return "";
    if (Array.isArray(raw)) {
      return raw.map((u: any) =>
        typeof u === "object" ? (u.name || u.full_name || `User ${u.id || u.user_id}`) : String(u)
      ).join(", ");
    }
    return String(raw);
  });

  const fetchData = useCallback(async () => {
    setIsFetchingDetails(true);
    try {
      const [tData, hData, cData, members, allUsersRes] = await Promise.all([
        projectService.getTask(task.project_id, task.id),
        projectService.getTaskProgressHistory(task.project_id, task.id),
        projectService.getTaskComments(task.project_id, task.id),
        projectService.getProjectMembers(task.project_id).catch(() => []),
        userService.getAllUsers(100, 0).catch(() => [])
      ]);
      setTaskDetails(tData);
      setHistory(Array.isArray(hData) ? hData : (hData.items || hData.data || []));
      setComments(Array.isArray(cData) ? cData : (cData.items || cData.data || []));

      const allUsers = Array.isArray(allUsersRes) ? allUsersRes : (allUsersRes.items || allUsersRes.data || allUsersRes.users || []);
      const list = Array.isArray(members) ? members : (members.items || members.data || []);
      const map: Record<string, string> = {};

      allUsers.forEach((u: any) => {
        const id = String(u.user_id || u.id);
        const name = u.full_name || u.name || u.first_name || u.username;
        if (id && name) map[id] = name;
      });

      list.forEach((m: any) => {
        const id = String(m.user_id || m.id);
        const name = m.full_name || m.name || m.first_name || m.username;
        if (id && name) map[id] = name;
      });
      setUserMap(map);

      // Resolve names from IDs if not already set
      const t = tData as any;

      // Project name
      if (!projectName) {
        try {
          const proj = await projectService.getProjectById(t.project_id);
          if (proj?.project_name) setProjectName(proj.project_name);
        } catch { /* ignore */ }
      }

      // Milestone name
      const milestoneId = t.milestone_id;
      if (milestoneId && !milestoneName) {
        try {
          const milestones = await projectService.getMilestones(t.project_id);
          const list = Array.isArray(milestones) ? milestones : (milestones.items || milestones.data || []);
          const found = list.find((m: any) => m.id === milestoneId);
          if (found) setMilestoneName(found.name || found.title || `Milestone ${milestoneId}`);
        } catch { /* ignore */ }
      }

      // BOQ name
      const boqId = t.boq_id;
      if (boqId && !boqName) {
        try {
          const { boqService } = await import("../../services/boqService");
          const boqItem = await boqService.getBoqById(Number(boqId));
          if (boqItem) setBoqName(boqItem.item_name || (boqItem as any).name || `BOQ ${boqId}`);
        } catch { /* ignore */ }
      }

      // Assigned user names — always re-resolve from fresh API data
      const users: any[] = t.assigned_users || [];
      if (users.length > 0) {
        const names = users.map((u: any) =>
          typeof u === "object" ? (u.name || u.full_name || `User ${u.id || u.user_id}`) : `User ${u}`
        );
        setAssignedNames(names.join(", "));
      } else if (t.assigned_user_id) {
        try {
          const members = await projectService.getProjectMembers(t.project_id);
          const mList = Array.isArray(members) ? members : (members.items || members.data || []);
          const found = mList.find((m: any) => m.user_id === t.assigned_user_id || m.id === t.assigned_user_id);
          setAssignedNames(found ? found.full_name : `User ${t.assigned_user_id}`);
        } catch { setAssignedNames(`User ${t.assigned_user_id}`); }
      }

      // Creator name from created_by_user_id
      if (t.created_by_user_id) {
        try {
          const members = await projectService.getProjectMembers(t.project_id);
          const mList = Array.isArray(members) ? members : (members.items || members.data || []);
          const found = mList.find((m: any) => m.user_id === t.created_by_user_id || m.id === t.created_by_user_id);
          if (found) setCreatorName(found.full_name);
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    } finally {
      setIsFetchingDetails(false);
    }
  }, [task.id, task.project_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedTask = taskDetails;

  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const cData = await projectService.getTaskComments(task.project_id, task.id);
      const list = Array.isArray(cData)
        ? cData
        : (cData?.items || cData?.data || cData?.comments || []);
      setComments(list);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [task.project_id, task.id]);

  // Refresh comments every time the Comments tab is opened
  useEffect(() => {
    if (modalTab === "Comments") {
      fetchComments();
    }
  }, [modalTab, fetchComments]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (modalTab === "Comments") {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [comments, modalTab]);

  // Dynamically resolve missing user names from comments
  useEffect(() => {
    const missingIds = comments
      .map(c => c.author_user_id)
      .filter(id => id && !userMap[String(id)] && id !== 1);

    if (missingIds.length === 0) return;

    const uniqueMissingIds = Array.from(new Set(missingIds));

    const fetchMissingUsers = async () => {
      try {
        const fetchedUsers = await Promise.all(
          uniqueMissingIds.map(id => userService.getUserById(id).catch(() => null))
        );

        setUserMap(prev => {
          const newMap = { ...prev };
          fetchedUsers.forEach(u => {
            if (u) {
              const id = String(u.user_id || u.id);
              const name = u.full_name || u.name || u.first_name || u.username;
              if (id && name) newMap[id] = name;
            }
          });
          return newMap;
        });
      } catch (error) {
        console.error("Failed to fetch missing users:", error);
      }
    };

    fetchMissingUsers();
  }, [comments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !commentAttachment) return;
    setIsSubmitting(true);
    try {
      await projectService.createTaskComment(task.project_id, task.id, { content: newComment });
      setNewComment("");
      setCommentAttachment(null);
      if (onAddComment) onAddComment(newComment);
      toast.success("Comment posted");
      fetchComments(); // refresh comment list after posting
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-primary py-5 px-6 flex items-center justify-between relative overflow-hidden font-inter border-b border-primary/20 shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-4 flex-1 min-w-0 mr-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-primary text-xl font-bold border border-white/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight break-words pr-2">{selectedTask.title}</h2>
              <p className="text-blue-100 text-xs font-medium tracking-wide">Detailed view of task assignments and progress</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex bg-white border-b border-slate-200 px-6 pt-4 gap-4 overflow-x-auto custom-scrollbar shrink-0">
          <button
            onClick={() => setModalTab("Details")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Details' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Details
          </button>
          <button
            onClick={() => setModalTab("Activity")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Activity' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Activity
          </button>
          <button
            onClick={() => setModalTab("Comments")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${modalTab === 'Comments' ? 'border-slate-800 text-slate-800 bg-slate-100 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Comments
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {modalTab === "Details" && (
            <div className="space-y-4 font-inter">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Task Title</p>
                  <p className="text-sm font-bold text-slate-800">{selectedTask.title}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Description</p>
                </div>
                <p className="text-sm text-slate-600 pl-9">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                      <User className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Assigned By</p>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-slate-600">{creatorName || (selectedTask as any).creatorName || 'System / Admin'}</p>
                    <p className="text-xs text-slate-400">Manager</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                      <User className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Assigned To</p>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-slate-600">{assignedNames || 'Unassigned'}</p>
                    <p className="text-xs text-slate-400">Labour</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Priority</p>
                  </div>
                  <div className="pl-9">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${(String(selectedTask.priority) === 'HIGH' || selectedTask.priority === 1) ? 'bg-rose-500 text-white' :
                      (String(selectedTask.priority) === 'MEDIUM' || selectedTask.priority === 2) ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                      {(String(selectedTask.priority) === 'HIGH' || selectedTask.priority === 1) ? 'HIGH' :
                        (String(selectedTask.priority) === 'MEDIUM' || selectedTask.priority === 2) ? 'MEDIUM' :
                          'LOW'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Deadline</p>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-slate-600">{selectedTask.end_date ? new Date(selectedTask.end_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Start Date</p>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-slate-600">{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Status</p>
                </div>
                <div className="pl-9 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <p className="text-sm text-slate-600">{selectedTask.status}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Project Classification</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Project</p>
                  <p className="text-sm font-bold text-slate-800">{projectName || (selectedTask as any).projectName || `Project ${selectedTask.project_id}`}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Milestone</p>
                  <p className="text-sm font-bold text-slate-800">
                    {milestoneName || (selectedTask as any).milestoneName || ((selectedTask as any).milestone_id ? `Milestone ${(selectedTask as any).milestone_id}` : 'N/A')}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">BOQ</p>
                  <p className="text-sm font-bold text-slate-800">
                    {boqName || (selectedTask as any).boqName || ((selectedTask as any).boq_id ? `BOQ ${(selectedTask as any).boq_id}` : 'N/A')}
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Execution & Delays</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Actual Start</p>
                  <p className="text-sm font-bold text-slate-800">{(selectedTask as any).actual_start_date ? new Date((selectedTask as any).actual_start_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Actual End</p>
                  <p className="text-sm font-bold text-slate-800">{(selectedTask as any).actual_end_date ? new Date((selectedTask as any).actual_end_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-800">{(selectedTask as any).execution_duration || 0} days</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Delay Status</p>
                  <p className={`text-sm font-bold ${(selectedTask as any).is_delayed ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {(selectedTask as any).is_delayed ? `${(selectedTask as any).delay_days || 0} Days Delayed` : 'On Track'}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Completion</p>
                  <p className="text-sm font-bold text-blue-500">{(selectedTask as any).completion_percentage || 0}%</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Financials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Planned Cost</p>
                  <p className="text-sm font-bold text-slate-800">₹{(selectedTask as any).planned_cost || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-1">Actual Cost</p>
                  <p className="text-sm font-bold text-slate-800">₹{(selectedTask as any).actual_cost || 0}</p>
                </div>
              </div>

              {((selectedTask as any).instruction_image_url || (selectedTask as any).audio_data || (selectedTask as any).audio_instruction_url || (selectedTask as any).task_icon) && (
                <>
                  <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">Media & Instructions</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {(selectedTask as any).task_icon && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 mb-3">Task Icon</p>
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                          <img src={String((selectedTask as any).task_icon)} alt="Task Icon" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                    {(selectedTask as any).instruction_image_url && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 mb-3">Instruction Image</p>
                        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm aspect-video max-w-sm">
                          <img src={getFullImageUrl(String((selectedTask as any).instruction_image_url)) || ''} alt="Instruction" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {((selectedTask as any).audio_data || (selectedTask as any).audio_instruction_url) && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 mb-3">Audio Instruction</p>
                        <audio controls src={(selectedTask as any).audio_data ? (getFullImageUrl((selectedTask as any).audio_data) || '') : (getFullImageUrl(String((selectedTask as any).audio_instruction_url)) || '')} className="w-full max-w-sm" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {modalTab === "Comments" && (
            <div className="flex flex-col h-[500px]">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-purple-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Task Discussion</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Chat with team members about this task</p>
              </div>

              <div className="flex-1 bg-[#F4F1E9] rounded-xl border border-slate-200 flex flex-col p-4 mb-4 overflow-y-auto custom-scrollbar">
                {isLoadingComments ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No comments yet</h3>
                    <p className="text-sm text-slate-500">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...comments].reverse().map((c: any, i) => (
                      <div key={i} className="flex flex-col bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-max max-w-[80%]">
                        <span className="text-xs font-bold text-slate-800 mb-1">
                          {c.author_name || userMap[String(c.author_user_id)] || (c.author_user_id === 1 ? 'Clients' : `User ${c.author_user_id}`)}
                        </span>
                        <p className="text-sm text-slate-700 mb-2">{c.content || c.comment || c.text || ""}</p>
                        <span className="text-[10px] text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex flex-col gap-2 relative">
                {commentAttachment && (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg w-max mb-1">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-700">{commentAttachment.name}</span>
                    <button type="button" onClick={() => setCommentAttachment(null)} className="ml-2 text-indigo-400 hover:text-indigo-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Attach a file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setCommentAttachment(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={(!newComment.trim() && !commentAttachment) || isSubmitting}
                    className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {modalTab === "Activity" && (
            <div className="flex flex-col h-full min-h-[300px]">
              {isFetchingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="text-slate-400 mb-2">
                    <Clock className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No activity yet</h3>
                  <p className="text-sm text-slate-500">History and audit logs will appear here.</p>
                </div>
              ) : (
                <div className="relative space-y-6 pl-4 md:pl-0 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-5 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                  {history.map((activity: any, i) => (
                    <div key={i} className="relative flex items-start gap-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border-4 border-white shadow-sm text-indigo-500 z-10 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-slate-800">Progress Updated</h4>
                          <span className="text-[10px] font-bold text-slate-500">{new Date(activity.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">Progress moved to {activity.percentage ?? activity.progress_percentage ?? 0}%</p>
                        {activity.remarks && (
                          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                            <span className="font-bold text-slate-700 block mb-1">Remarks:</span>
                            {activity.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
