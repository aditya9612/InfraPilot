import Modal from "../../common/Modal";
import type { ChartAccount } from "../../../types/accounting";

interface ViewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: ChartAccount | null;
}

const ViewAccountModal: React.FC<ViewAccountModalProps> = ({
  isOpen,
  onClose,
  account
}) => {
  if (!account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Details"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">General Ledger Code</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{account.account_code}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              account.account_type === 'Asset' ? 'bg-emerald-100 text-emerald-600' :
              account.account_type === 'Liability' ? 'bg-rose-100 text-rose-600' :
              'bg-primary/10 text-primary'
            }`}>
              {account.account_type}
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
          <p className="text-xl font-bold text-slate-700">{account.account_name}</p>
        </div>

        {/* Financials */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
            <p className="text-lg font-bold text-slate-800">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(account.opening_balance || 0)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
            <p className="text-lg font-bold text-primary">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(account.current_balance)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Description</p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
            {account.description || "No description provided for this ledger account."}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Close View
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewAccountModal;
