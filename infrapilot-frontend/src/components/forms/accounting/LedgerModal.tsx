import Modal from "../../common/Modal";

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  ledgerData: any[] | null;
}

const LedgerModal: React.FC<LedgerModalProps> = ({ isOpen, onClose, account, ledgerData }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? `Ledger: ${account.account_name} (${account.account_code})` : "Account Ledger"}
      maxWidth="max-w-4xl"
      footer={
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {!ledgerData ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : ledgerData.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            No ledger entries found for this account.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Debit</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Credit</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">{entry.date || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.description || '-'}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{entry.debit ? entry.debit.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{entry.credit ? entry.credit.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{entry.balance ? entry.balance.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LedgerModal;
