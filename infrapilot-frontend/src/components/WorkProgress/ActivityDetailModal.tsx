import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { ActivityItem } from "../../types/workProgress";
import { projectService } from "../../services/projectService";
import api from "../../services/api";
import { formatDateBySettings, formatDateTimeToIST } from "../../utils/dateUtils";

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  onEdit?: () => void;
}

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-600",
  "ON_TRACK": "bg-emerald-100 text-emerald-600",
  "Delay": "bg-red-100 text-red-600",
  "DELAY": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-blue-600",
  "COMPLETED": "bg-blue-100 text-blue-600",
  "Not Started": "bg-slate-100 text-slate-500",
  "NOT_STARTED": "bg-slate-100 text-slate-500"
};

const ActivityDetailModal = ({ isOpen, onClose, activity, onEdit }: ActivityDetailModalProps) => {
  const [engineerName, setEngineerName] = useState<string>("Unassigned");
  const [isLoadingEngineer, setIsLoadingEngineer] = useState(false);
  const [boqName, setBoqName] = useState<string>("-");
  const [workOrderName, setWorkOrderName] = useState<string>("-");

  useEffect(() => {
    if (activity && isOpen) {
      // ── Engineer Name ──────────────────────────────────────────────
      if ((activity as any).engineer_name) {
        setEngineerName((activity as any).engineer_name);
      } else {
        const engineerId = activity.engineer_id || (activity as any).assigned_to;
        if (engineerId && activity.project_id) {
          setIsLoadingEngineer(true);
          projectService.getProjectMembers(activity.project_id)
            .then((response: any) => {
              const rawMembers = Array.isArray(response) ? response : response.items || response.data || [];
              const member = rawMembers.find((m: any) =>
                m.user_id == engineerId ||
                m.id == engineerId ||
                m.user?.id == engineerId
              );
              if (member) {
                setEngineerName(member.full_name || member.user?.full_name || member.user?.name || `Engineer ${engineerId}`);
              } else {
                setEngineerName(`Engineer ${engineerId} (External)`);
              }
            })
            .catch(() => {
              setEngineerName(`Engineer ${engineerId}`);
            })
            .finally(() => {
              setIsLoadingEngineer(false);
            });
        } else {
          setEngineerName("Unassigned");
        }
      }

      // ── BOQ Name ───────────────────────────────────────────────────
      // If already enriched with a name, use it
      const existingBoqName = (activity as any).boq_name || (activity as any).boq_item_name || (activity as any).boq_title;
      const boqId = (activity as any).boq_item_id || activity.boq_code;
      if (existingBoqName) {
        setBoqName(existingBoqName);
      } else if (boqId) {
        // fetch its name by ID
        api.get(`/boq/${boqId}`)
          .then((res: any) => {
            const data = res.data;
            const name = data.item_name || data.title || data.name || data.boq_name || data.description || `BOQ ${boqId}`;
            setBoqName(name);
          })
          .catch(() => {
            setBoqName(`BOQ ${boqId}`);
          });
      } else {
        setBoqName("-");
      }

      // ── Work Order Name ────────────────────────────────────────────
      const existingWoName = (activity as any).work_order_name || (activity as any).work_order_title || (activity as any).work_order_no;
      if (existingWoName) {
        setWorkOrderName(existingWoName);
      } else if (activity.work_order_id) {
        api.get("/work-orders", { params: { limit: 200 } })
          .then((res: any) => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
            const wo = list.find((w: any) => w.id == activity.work_order_id);
            if (wo) {
              const name = wo.title || wo.name || wo.work_order_no || wo.order_no || wo.work_order_number || `Work Order #${activity.work_order_id}`;
              setWorkOrderName(name);
            } else {
              setWorkOrderName(`Work Order #${activity.work_order_id}`);
            }
          })
          .catch(() => {
            setWorkOrderName(`Work Order #${activity.work_order_id}`);
          });
      } else {
        setWorkOrderName("-");
      }
    }
  }, [activity, isOpen]);

  if (!activity) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Details" maxWidth="max-w-xl">
      <div className="p-0 overflow-hidden">
        {/* Blue Header Section with responsive layout to prevent text overlaps */}
        <div className="bg-blue-600 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-black break-words break-all leading-snug">
                {activity.activity_name}
              </h3>
            </div>
            <span className="self-start shrink-0 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest break-all max-w-full">
              BOQ: {boqName}
            </span>
          </div>
          <div className="space-y-2 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 shrink-0">
                Completion Intensity
              </span>
              <span className="text-xl sm:text-2xl font-black shrink-0">
                {Number(activity.completion_percentage || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, Number(activity.completion_percentage || 0)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Grid with break-all and consistent date formatting */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.created_at ? formatDateTimeToIST(activity.created_at) : "-"}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Completed</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.total_completed} {activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Updated At</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.updated_at ? formatDateTimeToIST(activity.updated_at) : "-"}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Quantity</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.remaining_quantity} {activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Name</p>
              <p className="text-sm font-bold text-slate-700 break-words break-all">{activity.activity_name}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">BOQ Name / Code</p>
              <p className="text-sm font-bold text-slate-700 break-words break-all">{boqName}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion Percentage</p>
              <p className="text-sm font-bold text-slate-700 break-words">{Number(activity.completion_percentage || 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Planned Quantity</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.planned_quantity} {activity.unit}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit</p>
              <p className="text-sm font-bold text-slate-700 break-words">{activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${statusBadge[activity.status] || "bg-slate-100 text-slate-500"}`}>
                {activity.status}
              </span>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
              <p className="text-sm font-bold text-slate-700 break-words">{formatDateBySettings(activity.start_date)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
              <p className="text-sm font-bold text-slate-700 break-words">{formatDateBySettings(activity.end_date)}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Order</p>
              <p className="text-sm font-bold text-slate-700 break-words break-all">{workOrderName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engineer Name</p>
              <p className="text-sm font-bold text-slate-700 break-words break-all">{isLoadingEngineer ? <span className="animate-pulse">Loading...</span> : engineerName}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Close</button>
          {onEdit && (
            <button
              onClick={() => { onClose(); onEdit(); }}
              className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              Edit Activity
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ActivityDetailModal;
