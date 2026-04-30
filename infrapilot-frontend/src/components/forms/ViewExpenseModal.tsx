import React from "react";
import Modal from "../common/Modal";

interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
}

const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
  if (!expense) return null;

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
      title="Expense Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xs shadow-xl">
                  EXP
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {expense.category}
                  </h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                    Date: {expense.expense_date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border bg-white/20 border-white/30 text-white">
                {expense.expense_type} Expense
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/30 rounded-full border border-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Transaction Info */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Expense Breakdown"
          >
            <div className="md:col-span-2">
                <InfoItem label="Description" value={expense.description} />
            </div>
            <InfoItem label="Expense Category" value={expense.category} />
            <InfoItem label="Expense Type" value={`${expense.expense_type} Cost`} />
          </Section>

          {/* Payment Info */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="Payment Details"
          >
            <InfoItem label="Paid By" value={expense.paid_by} />
            <InfoItem label="Payment Mode" value={expense.payment_mode} />
            <InfoItem label="Transaction Date" value={expense.expense_date} />
          </Section>

          {/* Amount Summary */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Amount Summary"
            fullWidth
          >
            <div className="w-full bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Outflow</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">₹{expense.amount?.toLocaleString()}</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-slate-700">Audit Verified</span>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
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
      <div className="text-emerald-600">{icon}</div>
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
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-emerald-600 transition-colors">
      {label}
    </p>
    <p className={`text-sm font-bold text-slate-700 ${valueClass ?? ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default ViewExpenseModal;
