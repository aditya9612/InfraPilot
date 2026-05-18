import React from "react";
import Modal from "../common/Modal";

interface ViewBankingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

const ViewBankingRecordModal: React.FC<ViewBankingRecordModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const isCash = record.type === "cash";
  const isRecon = record.type === "reconciliation";

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
      title="Account Information"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl ${isCash ? "bg-amber-600" : isRecon ? "bg-slate-700" : "bg-blue-600"}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xs shadow-xl">
                  {isCash ? "CSH" : "BNK"}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {record.account_name}
                  </h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    {record.bank_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border bg-white/20 border-white/30 text-white">
                {record.type}
              </span>
              <p className="text-white/60 text-[10px] font-bold">
                {record.account_number !== "-" ? `A/C: ${record.account_number}` : "Petty Cash Ledger"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Account Details */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Entity Information"
          >
            <InfoItem label="Financial Institution" value={record.bank_name} />
            <InfoItem label="IFSC / Routing Code" value={record.ifsc || "-"} />
            <InfoItem label="Audit History" value={record.last_transaction} valueClass={isRecon ? "text-rose-600" : "text-slate-500"} />
          </Section>

          {/* Balance Breakdown */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Balance Summary"
          >
            <InfoItem label="Opening Balance" value={`₹${record.opening_balance?.toLocaleString()}`} />
            <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Liquidity</p>
                <p className="text-2xl font-black text-slate-900">₹{record.current_balance?.toLocaleString()}</p>
            </div>
          </Section>

          {/* Reconciliation Impact */}
          {isRecon && (
            <Section
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                }
                title="Reconciliation Status"
                fullWidth
            >
                <div className="w-full bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-black text-rose-900">Unreconciled Variance</p>
                            <p className="text-xs font-bold text-rose-600">Difference detected between Ledger and Bank Statement</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Variance Amount</p>
                        <p className="text-xl font-black text-rose-600">₹{(record.current_balance - record.opening_balance).toLocaleString()}</p>
                    </div>
                </div>
            </Section>
          )}
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

export default ViewBankingRecordModal;
