import Modal from "../../common/Modal";

interface ViewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: any | null;
}

const ViewAccountModal: React.FC<ViewAccountModalProps> = ({ isOpen, onClose, accountData }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Details"
      maxWidth="max-w-2xl"
      footer={
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {!accountData ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
              <p className="text-sm font-semibold text-slate-800">{accountData.name || accountData.account_name || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Code</p>
              <p className="text-sm font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">{accountData.code || accountData.account_code || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Type</p>
              <p className="text-sm font-semibold text-slate-800">{accountData.type || accountData.account_type || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${accountData.is_active || accountData.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {accountData.is_active || accountData.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-sm font-semibold text-slate-800">
                ₹ {accountData.current_balance ? accountData.current_balance.toLocaleString() : "0.00"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Parent ID</p>
              <p className="text-sm font-semibold text-slate-800">{accountData.parent_id || accountData.parent_account_id || "-"}</p>
            </div>
            {accountData.description && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                <p className="text-sm text-slate-600">{accountData.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewAccountModal;
