import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { Project } from '../../types/project';
import type { Material, MaterialCreate } from '../../types/material';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaterialCreate) => Promise<void>;
  projects: Project[];
  suppliers: { id: number; name: string }[];
  initialData?: Material | null;
}

const CATEGORIES = [
  'Construction',
  'Civil',
  'Electrical',
  'Plumbing',
  'Landscaping',
  'Structure',
  'Finishing',
];

const UNITS = ['Bags', 'Cum', 'Sqm', 'MT', 'Kg', 'Ft', 'Nos', 'Ltr'];

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects, 
  suppliers,
  initialData 
}) => {
  const [formData, setFormData] = useState<MaterialCreate>({
    project_id: 0,
    material_name: '',
    category: '',
    unit: '',
    supplier_id: 0,
    purchase_rate: 0,
    rate_type: 'FIXED',
    quantity_purchased: 0,
    payment_given: 0,
    minimum_stock_level: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id || 0,
        material_name: initialData.material_name || '',
        category: initialData.category || '',
        unit: initialData.unit || '',
        supplier_id: initialData.supplier_id || 0,
        purchase_rate: initialData.purchase_rate || 0,
        rate_type: initialData.rate_type || 'FIXED',
        quantity_purchased: initialData.quantity_purchased || 0,
        payment_given: initialData.payment_given || 0,
        minimum_stock_level: initialData.minimum_stock_level || 0,
      });
    } else {
      setFormData({
        project_id: 0,
        material_name: '',
        category: '',
        unit: '',
        supplier_id: 0,
        purchase_rate: 0,
        rate_type: 'FIXED',
        quantity_purchased: 0,
        payment_given: 0,
        minimum_stock_level: 0,
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) newErrors.project_id = "Project is required.";
    if (!formData.material_name.trim()) newErrors.material_name = "Material name is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.unit) newErrors.unit = "Unit is required.";
    if (!formData.supplier_id) newErrors.supplier_id = "Supplier is required.";
    if (formData.purchase_rate <= 0) newErrors.purchase_rate = "Rate must be > 0.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name.includes('_id') || name.includes('rate') || name.includes('quantity') || name.includes('level') || name.includes('payment') 
            ? Number(value) 
            : value 
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
      // Parent handles error toast
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
      title={initialData ? "Update Material" : "Add New Material"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            form="material-form"
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
          >
            {isLoading ? "Saving..." : initialData ? "Update Material" : "Add Material"}
          </button>
        </>
      }
    >
      <form id="material-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Material Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className={inputClasses(errors.project_id)}>
                <option value={0}>Select a Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Material Name <span className="text-rose-500">*</span></label>
              <input name="material_name" value={formData.material_name} onChange={handleChange} placeholder="e.g. Cement" className={inputClasses(errors.material_name)} />
            </div>
            <div>
              <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
              <select name="category" value={formData.category} onChange={handleChange} className={inputClasses(errors.category)}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Procurement Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className={labelClasses}>Supplier <span className="text-rose-500">*</span></label>
              <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className={inputClasses(errors.supplier_id)}>
                <option value={0}>Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Unit <span className="text-rose-500">*</span></label>
              <select name="unit" value={formData.unit} onChange={handleChange} className={inputClasses(errors.unit)}>
                <option value="">Unit</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Purchase Rate (₹) <span className="text-rose-500">*</span></label>
              <input type="number" name="purchase_rate" value={formData.purchase_rate} onChange={handleChange} className={inputClasses(errors.purchase_rate)} />
            </div>
            <div>
              <label className={labelClasses}>Initial Quantity</label>
              <input type="number" name="quantity_purchased" value={formData.quantity_purchased} onChange={handleChange} className={inputClasses()} />
            </div>
            <div>
              <label className={labelClasses}>Min Stock Level</label>
              <input type="number" name="minimum_stock_level" value={formData.minimum_stock_level} onChange={handleChange} className={inputClasses()} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Initial Inventory Value</p>
              <p className="text-lg font-black text-slate-800">
                ₹{(formData.quantity_purchased * formData.purchase_rate).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMaterialModal;
