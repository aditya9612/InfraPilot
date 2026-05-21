import React from "react";
import Modal from "../common/Modal";
import { CheckCircle, XCircle, Clock, User, Briefcase, Calendar } from "lucide-react";

interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: any | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const ApprovalDetailsModal: React.FC<ApprovalDetailsModalProps> = ({
  isOpen,
  onClose,
  approval,
  onApprove,
  onReject,
}) => {
  if (!approval) return null;

  const footer = (
    <div className="flex gap-3 w-full sm:w-auto">
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
      >
        Close
      </button>
      {approval.status === "Pending" && (
        <>
          <button
            onClick={() => {
              onReject(approval.id);
              onClose();
            }}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={16} strokeWidth={2.5} />
            Reject
          </button>
          <button
            onClick={() => {
              onApprove(approval.id);
              onClose();
            }}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} strokeWidth={2.5} />
            Approve
          </button>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approval Request Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Status Header */}
        <div className={`relative overflow-hidden rounded-2xl p-8 shadow-xl transition-all ${
          approval.status === "Approved" ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" :
          approval.status === "Rejected" ? "bg-gradient-to-br from-rose-500 to-red-600 text-white" :
          "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              {approval.status === "Approved" ? <CheckCircle size={32} strokeWidth={2.5} /> :
               approval.status === "Rejected" ? <XCircle size={32} strokeWidth={2.5} /> :
               <Clock size={32} strokeWidth={2.5} />}
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{approval.type}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {approval.status}
                </span>
              </div>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2 justify-center md:justify-start">
                <Calendar size={14} />
                Submitted on {approval.date}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          <Section icon={<User size={16} />} title="Requester Info">
            <InfoItem label="Requested By" value={approval.requestedBy} />
            <InfoItem label="Project Site" value={approval.project} />
          </Section>

          <Section icon={<Briefcase size={16} />} title="Request Details">
            <InfoItem label="Amount / Quantity" value={approval.detail} />
            <InfoItem label="Category" value={approval.type} />
          </Section>

          <Section icon={<CheckCircle size={16} />} title="Workflow History" fullWidth>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-700">Current Status</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                  approval.status === "Approved" ? "text-emerald-600 bg-emerald-100" :
                  approval.status === "Rejected" ? "text-rose-600 bg-rose-100" :
                  "text-amber-600 bg-amber-100"
                }`}>
                  {approval.status}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                <span className="text-sm font-bold text-slate-700">Reviewed By</span>
                <span className="text-sm font-medium text-slate-500">{approval.approvedBy}</span>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; fullWidth?: boolean }> = ({ 
  icon, 
  title, 
  children, 
  fullWidth 
}) => (
  <div className={`space-y-4 ${fullWidth ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-400">
      {icon}
      <h4 className="text-xs font-black uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ 
  label, 
  value, 
}) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800">
      {value || "—"}
    </p>
  </div>
);

export default ApprovalDetailsModal;
