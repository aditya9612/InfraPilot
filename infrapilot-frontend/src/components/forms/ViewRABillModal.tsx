import React from "react";
import Modal from "../common/Modal";

interface ViewRABillModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

const ViewRABillModal: React.FC<ViewRABillModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const isCertified = record.status === "Certified";
  const isPending = record.status === "Pending";

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Bill
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RA Bill Summary"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-slate-800 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs shadow-xl text-primary">
                  RA
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {record.bill_no}
                  </h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    {record.project}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border ${isCertified ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" :
                  isPending ? "bg-amber-500/20 border-amber-500/30 text-amber-100" :
                    "bg-blue-500/20 border-blue-500/30 text-blue-100"
                }`}>
                {record.status}
              </span>
              <p className="text-white/60 text-[10px] font-bold">Client: {record.client}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Billing Details */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Billing Information"
          >
            <InfoItem label="Submission Date" value={record.date} />
            <InfoItem label="Certifying Body" value={record.certified_by || "Not Applicable"} />
            <InfoItem label="Billing Type" value="Progress / Cumulative" />
          </Section>

          {/* Financial Breakdown */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Financial Summary"
          >
            <div className="w-full bg-slate-50 p-6 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill Amount</p>
                <p className="text-2xl font-black text-slate-900">₹{record.amount?.toLocaleString()}</p>
              </div>
            </div>
          </Section>

          {/* Progress Disclaimer */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Measurement Disclaimer"
            fullWidth
          >
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold text-slate-500 leading-relaxed">
              RA Bills are generated based on site measurements certified by the Project Management Consultant (PMC). Final adjustments may be made at the time of Final Bill settlement.
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}> = ({ icon, title, children, fullWidth }) => (
  <div className={`space-y-4 ${fullWidth ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-slate-500">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">
      {label}
    </p>
    <p className={`text-sm font-bold text-slate-700 ${valueClass ?? ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default ViewRABillModal;
