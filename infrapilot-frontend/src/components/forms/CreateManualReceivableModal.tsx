import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { ownerService } from '../../services/ownerService';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateManualReceivableModal = ({ onClose, onSuccess }: Props) => {
  const [formData, setFormData] = useState({
    client_id: 0,
    amount: 0,
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await ownerService.getOwners();
        const clientsList = ((response as any)?.items || response || []).map((owner: any) => ({
          id: owner.id,
          name: owner.name || owner.company_name || `Client ${owner.id}`,
        }));
        setClients(clientsList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || formData.amount <= 0) {
      return toast.error("Client and positive amount are required.");
    }
    
    setIsSubmitting(true);
    try {
      await financeService.createManualReceivable(formData);
      toast.success("Manual receivable created successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create manual receivable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-800">Add Manual Receivable</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClasses}>Select Client *</label>
            <select
              required
              value={formData.client_id || ""}
              onChange={e => setFormData({ ...formData, client_id: Number(e.target.value) })}
              className={inputClasses}
            >
              <option value="" disabled>-- Select a Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={labelClasses}>Amount *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Description</label>
            <input
              type="text"
              placeholder="E.g. Opening Balance or Custom Fee"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Due Date</label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Reference (Optional)</label>
            <input
              type="text"
              placeholder="E.g. REF-1029"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Receivable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManualReceivableModal;
