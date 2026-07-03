import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

import type { Project } from '../../types/project';
import type { BoqItem } from '../../types/boq';

import { masterService, type MasterEntity } from '../../services/masterService';

interface CreateBOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boqData: any) => Promise<void>;
  projects: Project[];
  initialData?: BoqItem | null;
}

const CreateBOQModal: React.FC<CreateBOQModalProps> = ({ isOpen, onClose, onSubmit, projects, initialData }) => {
  const [formData, setFormData] = React.useState({
    project_id: '',
    item_name: '',
    category: '',
    description: '',
    quantity: '',
    unit: '',
    unit_cost: '',
    status: 'Active',
    activity_type_id: '',
  });

  const [activityTypes, setActivityTypes] = useState<MasterEntity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const types = await masterService.getEntities('activity-types');
        setActivityTypes(types);
      } catch (error) {
        console.error("Failed to fetch master data:", error);
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id?.toString() || '',
        item_name: initialData.item_name || '',
        category: initialData.category || '',
        description: initialData.description || '',
        quantity: initialData.quantity?.toString() || '',
        unit: initialData.unit || '',
        unit_cost: initialData.unit_cost?.toString() || '',
        status: initialData.status || 'Active',
        activity_type_id: (initialData as any).activity_type_id?.toString() || '',
      });
    } else {
      setFormData({
        project_id: '',
        item_name: '',
        category: '',
        description: '',
        quantity: '',
        unit: '',
        unit_cost: '',
        status: 'Active',
        activity_type_id: '',
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: string, value: any) => {
    let error = '';
    switch (name) {
      case 'project_id':
        if (!value) error = 'Project selection is required.';
        break;
      case 'item_name':
        if (!value.trim()) error = 'Item name is required.';
        else if (value.trim().length < 2) error = 'Item name must be at least 2 characters.';
        break;
      case 'description':
        // Optional
        break;
      case 'quantity':
        if (value && isNaN(Number(value))) error = 'Enter a valid quantity.';
        else if (value && !/^\d+$/.test(value.toString())) error = 'Quantity must be a whole number.';
        break;
      case 'unit_cost':
        if (value && isNaN(Number(value))) error = 'Enter a valid unit cost.';
        else if (value && !/^\d+$/.test(value.toString())) error = 'Unit cost must be a whole number.';
        break;
      case 'activity_type_id':
        if (!value) error = 'Activity Type is required.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    if (name === 'quantity' || name === 'unit_cost') {
      value = value.replace(/[^\d]/g, '');
    }

    if (name === 'activity_type_id') {
      const selectedType = activityTypes.find(t => t.id.toString() === value);
      if (selectedType) {
        setFormData((prev) => ({
          ...prev,
          activity_type_id: value,
          category: selectedType.category || '',
          unit: selectedType.unit || '',
        }));
        setErrors((prev) => ({
          ...prev,
          activity_type_id: '',
          category: '',
          unit: '',
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setIsLoading(true);
      try {
        const submissionData = {
          project_id: Number(formData.project_id),
          item_name: formData.item_name,
          description: formData.description || undefined,
          quantity: formData.quantity ? Number(formData.quantity) : undefined,
          unit_cost: formData.unit_cost ? Number(formData.unit_cost) : undefined,
          status: formData.status,
          activity_type_id: Number(formData.activity_type_id),
        };
        await onSubmit(submissionData);
        setFormData({
          project_id: '',
          item_name: '',
          category: '',
          description: '',
          quantity: '',
          unit: '',
          unit_cost: '',
          status: 'Active',
          activity_type_id: '',
        });
      } catch (error) {
        // Error handling is mostly in parent via toast
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please fix the errors in the form.");
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="boq-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          initialData ? 'Update BOQ Item' : 'Add BOQ Item'
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update BOQ Item" : "Create New BOQ Item"}
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="boq-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Project <span className="text-rose-500">*</span></label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-white border ${errors.project_id ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all appearance-none`}
            >
              <option value="">Select a Project</option>
              {projects?.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
            {errors.project_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.project_id}</p>}
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Item Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g. Cement Bags"
              className={`w-full px-4 py-2.5 bg-white border ${errors.item_name ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all`}
            />
            {errors.item_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.item_name}</p>}
          </div>


          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about the material or labor..."
              className={`w-full px-4 py-2.5 bg-white border ${errors.description ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all resize-none`}
            />
            {errors.description && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Quantity</label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
              className={`w-full px-4 py-2.5 bg-white border ${errors.quantity ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all`}
            />
            {errors.quantity && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.quantity}</p>}
          </div>


          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Unit Cost (₹)</label>
            <input
              type="text"
              name="unit_cost"
              value={formData.unit_cost}
              onChange={handleChange}
              placeholder="0"
              className={`w-full px-4 py-2.5 bg-white border ${errors.unit_cost ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all`}
            />
            {errors.unit_cost && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.unit_cost}</p>}
          </div>


          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Activity Type <span className="text-rose-500">*</span></label>
            <select
              name="activity_type_id"
              value={formData.activity_type_id}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-white border ${errors.activity_type_id ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all appearance-none`}
            >
              <option value="">Select Activity Type</option>
              {activityTypes?.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.activity_type_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.activity_type_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Estimated Total Cost</p>
              <p className="text-lg font-black text-slate-800">
                ₹{((Number(formData.quantity) || 0) * (Number(formData.unit_cost) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBOQModal;
