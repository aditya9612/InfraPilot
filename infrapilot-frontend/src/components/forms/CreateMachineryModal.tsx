import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

interface CreateMachineryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any | null;
}

const CreateMachineryModal: React.FC<CreateMachineryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [formData, setFormData] = useState({
    equipment_name: '',
    equipment_code: '',
    operator_name: '',
    working_hours: 0,
    fuel_used: 0,
    condition: 'GOOD',
    rental_cost: 0,
    maintenance_date: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        equipment_name: initialData.equipment_name || '',
        equipment_code: initialData.equipment_code || '',
        operator_name: initialData.operator_name || '',
        working_hours: initialData.working_hours || 0,
        fuel_used: initialData.fuel_used || 0,
        condition: initialData.condition || 'GOOD',
        rental_cost: initialData.rental_cost || 0,
        maintenance_date: initialData.maintenance_date || '',
      });
    } else {
      setFormData({
        equipment_name: '',
        equipment_code: '',
        operator_name: '',
        working_hours: 0,
        fuel_used: 0,
        condition: 'GOOD',
        rental_cost: 0,
        maintenance_date: '',
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.equipment_name.trim()) newErrors.equipment_name = "Name is required.";
    if (!formData.equipment_code.trim()) newErrors.equipment_code = "Code is required.";
    if (!formData.operator_name.trim()) newErrors.operator_name = "Operator is required.";
    if (!formData.working_hours || formData.working_hours <= 0) newErrors.working_hours = "Required";
    if (!formData.fuel_used || formData.fuel_used <= 0) newErrors.fuel_used = "Required";
    if (!formData.rental_cost || formData.rental_cost <= 0) newErrors.rental_cost = "Required";
    if (!formData.maintenance_date) newErrors.maintenance_date = "Required";
    if (!formData.condition) newErrors.condition = "Required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: ['working_hours', 'fuel_used', 'rental_cost'].includes(name) ? Number(value) : value 
    }));
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
      title={initialData ? "Edit Equipment Log" : "Register New Equipment"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            form="machinery-form"
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
          >
            {isLoading ? "Saving..." : initialData ? "Update Record" : "Register Log"}
          </button>
        </>
      }
    >
      <form id="machinery-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Asset Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>Equipment Name <span className="text-rose-500">*</span></label>
              <input name="equipment_name" value={formData.equipment_name} onChange={handleChange} placeholder="e.g. JCB Backhoe Loader" className={inputClasses(errors.equipment_name)} />
            </div>
            <div>
              <label className={labelClasses}>Asset Code / ID <span className="text-rose-500">*</span></label>
              <input name="equipment_code" value={formData.equipment_code} onChange={handleChange} placeholder="e.g. MC-001" className={inputClasses(errors.equipment_code)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Operator Name <span className="text-rose-500">*</span></label>
              <input name="operator_name" value={formData.operator_name} onChange={handleChange} placeholder="Full Name" className={inputClasses(errors.operator_name)} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Operational Telemetry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClasses}>Working Hours <span className="text-rose-500">*</span></label>
              <input type="number" name="working_hours" value={formData.working_hours} onChange={handleChange} className={inputClasses(errors.working_hours)} />
              {errors.working_hours && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.working_hours}</p>}
            </div>
            <div>
              <label className={labelClasses}>Fuel Consumed (Ltrs) <span className="text-rose-500">*</span></label>
              <input type="number" name="fuel_used" value={formData.fuel_used} onChange={handleChange} className={inputClasses(errors.fuel_used)} />
              {errors.fuel_used && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.fuel_used}</p>}
            </div>
            <div>
              <label className={labelClasses}>Rental Cost (₹) <span className="text-rose-500">*</span></label>
              <input type="number" name="rental_cost" value={formData.rental_cost} onChange={handleChange} className={inputClasses(errors.rental_cost)} />
              {errors.rental_cost && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.rental_cost}</p>}
            </div>
            <div>
              <label className={labelClasses}>Maintenance Date <span className="text-rose-500">*</span></label>
              <input type="date" name="maintenance_date" value={formData.maintenance_date} onChange={handleChange} className={inputClasses(errors.maintenance_date)} />
              {errors.maintenance_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.maintenance_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>Current Condition <span className="text-rose-500">*</span></label>
              <select name="condition" value={formData.condition} onChange={handleChange} className={inputClasses(errors.condition)}>
                <option value="GOOD">Good / Optimal</option>
                <option value="FAIR">Fair / Functional</option>
                <option value="POOR">Poor / Needs Maintenance</option>
                <option value="REPAIR">Needs Repair</option>
                <option value="SERVICE">Under Service</option>
                <option value="DAMAGED">Damaged</option>
                <option value="MAINTENANCE">Scheduled Maintenance</option>
              </select>
              {errors.condition && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.condition}</p>}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMachineryModal;
