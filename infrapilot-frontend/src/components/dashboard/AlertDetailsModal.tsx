import React from "react";
import Modal from "../common/Modal";
import { BellRing, Calendar, Briefcase, User, Info, CheckCircle, Clock } from "lucide-react";

interface AlertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: any | null;
}

const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  isOpen,
  onClose,
  alert,
}) => {
  if (!alert) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
    >
      Dismiss
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alert Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Dynamic Header based on Status */}
        <div className={`relative overflow-hidden rounded-2xl p-8 shadow-xl transition-all ${alert.status === "Critical" ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white" :
            alert.status === "Warning" ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" :
              "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <BellRing size={32} strokeWidth={2.5} />
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{alert.alert_type || alert.type || "System"} Alert</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {alert.status || "Normal"}
                </span>
              </div>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2 justify-center md:justify-start">
                <Calendar size={14} />
                {alert.created_at ? new Date(alert.created_at).toLocaleString("en-IN") : (alert.date || "N/A")}
              </p>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Info size={16} strokeWidth={2.5} />
              <h4 className="text-[11px] font-black uppercase tracking-widest">Alert Message</h4>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <p className="text-slate-800 font-semibold leading-relaxed">
                {alert.message || "No message provided."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Briefcase size={16} strokeWidth={2.5} />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Project ID</h4>
              </div>
              <p className="text-sm font-bold text-slate-700 pl-6">
                {alert.project_id ? `#${alert.project_id}` : "—"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <User size={16} strokeWidth={2.5} />
                <h4 className="text-[11px] font-black uppercase tracking-widest">User ID</h4>
              </div>
              <p className="text-sm font-bold text-slate-700 pl-6">
                {alert.user_id ? `#${alert.user_id}` : "—"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} strokeWidth={2.5} />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Timestamp</h4>
              </div>
              <p className="text-sm font-bold text-slate-700 pl-6">
                {alert.created_at ? new Date(alert.created_at).toLocaleString("en-IN") : "N/A"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle size={16} strokeWidth={2.5} />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Acknowledgment</h4>
              </div>
              <p className="text-sm font-bold text-slate-700 pl-6 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${alert.is_read ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
                {alert.is_read ? "Marked as Read" : "Unread / Pending"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDetailsModal;
