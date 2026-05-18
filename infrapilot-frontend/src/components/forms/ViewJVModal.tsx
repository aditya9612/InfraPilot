import React from "react";
import Modal from "../common/Modal";

interface ViewJVModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any;
}

const ViewJVModal: React.FC<ViewJVModalProps> = ({
  isOpen,
  onClose,
  entry,
}) => {
  if (!entry) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Entry
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Journal Voucher Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-slate-800 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center font-black text-xs shadow-xl text-primary">
                  JV
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {entry.reference}
                  </h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    Date: {entry.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-3xl font-black text-white tracking-tight">₹{entry.amount?.toLocaleString()}</p>
                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Balanced</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between h-32">
                    <div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-1">Debit Account</span>
                        <p className="text-lg font-black text-emerald-900">{entry.debit_account}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-emerald-600">₹{entry.amount?.toLocaleString()}</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col justify-between h-32">
                    <div>
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] block mb-1">Credit Account</span>
                        <p className="text-lg font-black text-rose-900">{entry.credit_account}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-rose-600">₹{entry.amount?.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Narration / Memo</span>
                <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
                    "{entry.narration}"
                </p>
            </div>
        </div>

        <div className="pt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">AD</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">MN</div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized by Accounts Team</p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entry Posted: {entry.date}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ViewJVModal;
