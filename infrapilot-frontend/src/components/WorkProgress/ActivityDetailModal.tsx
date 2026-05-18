import Modal from "../common/Modal";
import type { ActivityItem } from "../../types/workProgress";

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  onEdit: () => void;
}

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-600",
  "Delay": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-blue-600",
  "Not Started": "bg-slate-100 text-slate-500"
};

const ActivityDetailModal = ({ isOpen, onClose, activity, onEdit }: ActivityDetailModalProps) => {
  if (!activity) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Details" maxWidth="max-w-lg">
      <div className="p-0 overflow-hidden">
        {/* Blue Header Section */}
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black">{activity.activity_name}</h3>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{activity.boq_code || "No BOQ"}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Completion Intensity</span>
              <span className="text-2xl font-black">{activity.completion_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${activity.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Planned</p>
              <p className="text-sm font-black text-slate-800">{activity.planned_quantity} {activity.unit}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Completed</p>
              <p className="text-sm font-black text-blue-600">{activity.total_completed} {activity.unit}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Remaining</p>
              <p className="text-sm font-black text-rose-600">{activity.remaining_quantity} {activity.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-4 border-t border-slate-50">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline</p>
              <p className="text-xs font-bold text-slate-600">{activity.start_date} → {activity.end_date}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${statusBadge[activity.status] || "bg-slate-100 text-slate-500"}`}>
                {activity.status}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Close</button>
          <button
            onClick={() => { onClose(); onEdit(); }}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            Edit Activity
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActivityDetailModal;
