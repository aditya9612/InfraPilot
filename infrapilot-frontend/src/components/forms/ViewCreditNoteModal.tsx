import React from "react";
import Modal from "../common/Modal";

interface ViewCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

const ViewCreditNoteModal: React.FC<ViewCreditNoteModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Note
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Credit Note Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-rose-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xs shadow-xl text-white">
                  CN
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {record.cn_no}
                  </h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    Reference: {record.ref_invoice}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-3xl font-black text-white tracking-tight">-₹{record.amount?.toLocaleString()}</p>
                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 text-white border border-white/30">Adjustment Applied</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                <div className="space-y-4">
                    <InfoItem label="Client Name" value={record.client} />
                    <InfoItem label="Issuance Date" value={record.date} />
                </div>
                <div className="space-y-4">
                    <InfoItem label="Status" value={record.status} valueClass="text-emerald-600" />
                    <InfoItem label="Adjustment Type" value="Direct Credit to Ledger" />
                </div>
            </div>

            <div className="p-6 rounded-[32px] bg-rose-50 border border-rose-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2">Reason for Credit</span>
                <p className="text-sm font-medium text-rose-900 italic leading-relaxed">
                    "{record.reason}"
                </p>
            </div>
        </div>

        <div className="pt-4 flex items-center justify-between px-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">AD</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">FA</div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized by Financial Controller</p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Issued: {record.date}</p>
        </div>
      </div>
    </Modal>
  );
};

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

export default ViewCreditNoteModal;
