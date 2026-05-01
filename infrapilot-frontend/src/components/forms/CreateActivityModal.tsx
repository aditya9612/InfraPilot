import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any | null;
}

const CreateActivityModal: React.FC<CreateActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [formData, setFormData] = useState({
    activity_name: '',
    boq_code: '',
    planned_quantity: 0,
    start_date: '',
    end_date: '',
    status: 'On Track',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        activity_name: initialData.activity_name || '',
        boq_code: initialData.boq_code || '',
        planned_quantity: initialData.planned_quantity || 0,
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        status: initialData.status || 'On Track',
      });
    } else {
      setFormData({
        activity_name: '',
        boq_code: '',
        planned_quantity: 0,
        start_date: '',
        end_date: '',
        status: 'On Track',
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.activity_name) newErrors.activity_name = "Name is required.";
    if (!formData.boq_code) newErrors.boq_code = "BOQ code is required.";
    if (!formData.planned_quantity) newErrors.planned_quantity = "Quantity is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'planned_quantity' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Activity" : "Add New Activity"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            form="activity-form"
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
          >
            {isLoading ? "Saving..." : initialData ? "Update Activity" : "Add Activity"}
          </button>
        </>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Activity Definition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>Activity Name <span className="text-rose-500">*</span></label>
              <input name="activity_name" value={formData.activity_name} onChange={handleChange} placeholder="e.g. Foundation Excavation" className={inputClasses(errors.activity_name)} />
            </div>
            <div>
              <label className={labelClasses}>BOQ Code Reference <span className="text-rose-500">*</span></label>
              <input name="boq_code" value={formData.boq_code} onChange={handleChange} placeholder="e.g. BOQ-01" className={inputClasses(errors.boq_code)} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Timeline & Scope</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClasses}>Target Quantity <span className="text-rose-500">*</span></label>
              <input type="number" name="planned_quantity" value={formData.planned_quantity} onChange={handleChange} className={inputClasses(errors.planned_quantity)} />
            </div>
            <div>
              <label className={labelClasses}>Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={inputClasses()} />
            </div>
            <div>
              <label className={labelClasses}>End Date (Target)</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={inputClasses()} />
            </div>
            <div>
              <label className={labelClasses}>Initial Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClasses()}>
                <option value="On Track">On Track</option>
                <option value="Delay">Delay</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateActivityModal;
