import React from "react";
import Modal from "../common/Modal";

interface ViewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

const ViewTransactionModal: React.FC<ViewTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  const isReceipt = transaction.type === "Receipt";

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl ${isReceipt ? "bg-emerald-600" : "bg-rose-600"}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xs shadow-xl">
                  {isReceipt ? "RCT" : "PMT"}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {transaction.party_name}
                  </h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                    Date: {transaction.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border bg-white/20 border-white/30 text-white">
                {transaction.type}
              </span>
              <p className="text-white/60 text-[10px] font-bold">Ref: {transaction.reference}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Party & Remarks */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Party & Remarks"
          >
            <InfoItem label="Entity Name" value={transaction.party_name} />
            <InfoItem label="Transaction Remarks" value={transaction.remarks || "No remarks provided"} />
          </Section>

          {/* Payment Details */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="Payment Method"
          >
            <InfoItem label="Payment Mode" value={transaction.mode} />
            <InfoItem label="Reference ID" value={transaction.reference} />
            <InfoItem label="Linked Document" value={transaction.linked_id || "None"} />
          </Section>

          {/* Amount Summary */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Financial Impact"
            fullWidth
          >
            <div className="w-full bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Value</p>
                <p className={`text-3xl font-black tracking-tight ${isReceipt ? "text-emerald-600" : "text-rose-600"}`}>
                    {isReceipt ? "+" : "-"} ₹{transaction.amount?.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
                <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-slate-700">Cleared & Posted</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isReceipt ? "bg-emerald-500" : "bg-rose-500"}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                </div>
              </div>
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

export default ViewTransactionModal;
