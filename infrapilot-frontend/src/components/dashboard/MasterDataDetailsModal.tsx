import React from "react";
import Modal from "../common/Modal";

interface MasterDataDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
}

const MasterDataDetailsModal: React.FC<MasterDataDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Master Entity Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl shadow-xl">
              {item.name.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{item.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/20 border border-white/10`}>
                  {item.type}
                </span>
              </div>
              <p className="text-white/80 font-medium mt-1">Code: {item.code}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          <Section title="Basic Information">
            <InfoItem label="Entity Name" value={item.name} />
            <InfoItem label="System Tag" value={item.type} />
          </Section>

          <Section title="Classification">
            <InfoItem label="Unique Code" value={item.code} isMono />
            <InfoItem label="Category Group" value={item.category} />
          </Section>

          <Section title="System Metadata" fullWidth>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Entity ID" value={`#MD-${item.id.toString().padStart(4, '0')}`} isMono />
              <InfoItem label="Creation Status" value="Verified Master Entry" />
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; fullWidth?: boolean }> = ({ 
  title, 
  children, 
  fullWidth 
}) => (
  <div className={`space-y-4 ${fullWidth ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string; isMono?: boolean }> = ({ 
  label, 
  value, 
  isMono 
}) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
      {label}
    </p>
    <p className={`text-sm font-bold text-slate-800 ${isMono ? "font-mono" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default MasterDataDetailsModal;
