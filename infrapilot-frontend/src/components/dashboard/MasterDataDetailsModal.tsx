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
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
      >
        Close details
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Master Entity Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Basic information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Entity name" value={item.name} />
            <InfoItem label="System tag" value={item.type} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Classification</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Unique code" value={item.code} isMono />
            <InfoItem label="Category group" value={item.category} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">System metadata</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Entity ID" value={`#MD-${item.id.toString().padStart(4, '0')}`} isMono />
            <InfoItem label="Creation status" value="Verified Master Entry" />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const InfoItem: React.FC<{ label: string; value: string; isMono?: boolean }> = ({ 
  label, 
  value, 
  isMono 
}) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">
      {label}
    </p>
    <p className={`text-sm font-semibold text-slate-800 ${isMono ? "font-mono" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default MasterDataDetailsModal;
