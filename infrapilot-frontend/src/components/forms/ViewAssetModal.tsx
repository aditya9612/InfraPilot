import React from "react";
import Modal from "../common/Modal";

interface ViewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

const ViewAssetModal: React.FC<ViewAssetModalProps> = ({
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
      Close Register
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Registry Information"
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
                  AST
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {record.asset_name}
                  </h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    Category: {record.category}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-sm font-bold text-white/60">Location</p>
                <div className="flex items-center gap-2 text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-sm font-black uppercase tracking-widest">{record.location}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Purchase Details */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Acquisition Summary"
          >
            <InfoItem label="Purchase Cost" value={`₹${record.cost?.toLocaleString()}`} />
            <InfoItem label="Date of Purchase" value={record.purchase_date} />
            <InfoItem label="Asset Status" value="Active / In-Use" valueClass="text-emerald-600" />
          </Section>

          {/* Depreciation Breakdown */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            title="Depreciation Schedule"
          >
            <div className="flex items-center justify-between group">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Depreciation Rate</p>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded uppercase">{record.depreciation_rate}% P.A.</span>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Accumulated</p>
                    <p className="text-sm font-bold text-rose-600">₹{(record.cost - record.current_value).toLocaleString()}</p>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Book Value (Current)</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₹{record.current_value?.toLocaleString()}</p>
            </div>
          </Section>

          {/* Site Impact */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Operational Details"
            fullWidth
          >
            <div className="w-full bg-slate-50 p-6 rounded-[28px] border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ownership Type</p>
                    <p className="text-sm font-bold text-slate-700">Company Owned / Fully Capitalized</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Maintenance Period</p>
                    <p className="text-sm font-bold text-slate-700">Quarterly Service Active</p>
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

export default ViewAssetModal;
