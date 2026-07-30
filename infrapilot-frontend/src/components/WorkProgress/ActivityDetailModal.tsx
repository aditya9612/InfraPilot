import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { ActivityItem } from "../../types/workProgress";
import { projectService } from "../../services/projectService";
import api from "../../services/api";

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  onEdit?: () => void;
}

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-600",
  "Delay": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-blue-600",
  "Not Started": "bg-slate-100 text-slate-500"
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
      if (existingBoqName) {
        setBoqName(existingBoqName);
      } else if (activity.boq_code) {
        // boq_code is the BOQ ID – fetch its name
        api.get(`/boq/${activity.boq_code}`)
          .then((res: any) => {
            const data = res.data;
            const name = data.item_name || data.title || data.name || data.boq_name || data.description || `BOQ ${activity.boq_code}`;
            setBoqName(name);
          })
          .catch(() => {
            setBoqName(`BOQ ${activity.boq_code}`);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Details" maxWidth="max-w-lg">
      <div className="p-0 overflow-hidden">
        {/* Blue Header Section */}
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black">{activity.activity_name}</h3>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">BOQ: {boqName}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Completion Intensity</span>
              <span className="text-2xl font-black">{(activity.completion_percentage || 0).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${activity.completion_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-sm font-bold text-slate-700">{activity.created_at ? new Date(activity.created_at).toLocaleString() : "-"}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Completed</p>
              <p className="text-sm font-bold text-slate-700">{activity.total_completed} {activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Updated At</p>
              <p className="text-sm font-bold text-slate-700">{activity.updated_at ? new Date(activity.updated_at).toLocaleString() : "-"}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Quantity</p>
              <p className="text-sm font-bold text-slate-700">{activity.remaining_quantity} {activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Name</p>
              <p className="text-sm font-bold text-slate-700">{activity.activity_name}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">BOQ Name / Code</p>
              <p className="text-sm font-bold text-slate-700">{boqName}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion Percentage</p>
              <p className="text-sm font-bold text-slate-700">{(activity.completion_percentage || 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Planned Quantity</p>
              <p className="text-sm font-bold text-slate-700">{activity.planned_quantity} {activity.unit}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit</p>
              <p className="text-sm font-bold text-slate-700">{activity.unit}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${statusBadge[activity.status] || "bg-slate-100 text-slate-500"}`}>
                {activity.status}
              </span>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
              <p className="text-sm font-bold text-slate-700">{activity.start_date}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
              <p className="text-sm font-bold text-slate-700">{activity.end_date}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Order</p>
              <p className="text-sm font-bold text-slate-700">{workOrderName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engineer Name</p>
              <p className="text-sm font-bold text-slate-700">{isLoadingEngineer ? <span className="animate-pulse">Loading...</span> : engineerName}</p>
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
