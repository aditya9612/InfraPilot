import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

import { masterService, type MasterEntity } from '../../services/masterService';

interface EditBoqItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: any;
}

const EditBoqItemModal: React.FC<EditBoqItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = React.useState({
    item_name: '',
    description: '',
    quantity: '',
    unit_cost: '',
    status: 'Active',
    is_completed: false,
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
        item_name: initialData.item_name || '',
        description: initialData.description || '',
        quantity: initialData.quantity?.toString() || '',
        unit_cost: initialData.unit_cost?.toString() || '',
        status: initialData.status || 'Active',
        is_completed: !!initialData.is_completed,
        activity_type_id: initialData.activity_type_id?.toString() || '',
      });
    } else {
      setFormData({
        item_name: '',
        description: '',
        quantity: '',
        unit_cost: '',
        status: 'Active',
        is_completed: false,
        activity_type_id: '',
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: string, value: any) => {
    let error = '';
    switch (name) {
      case 'item_name':
        if (!value.trim()) error = 'Name is required.';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters.';
        break;
      case 'quantity':
        if (value && isNaN(Number(value))) error = 'Enter a valid quantity.';
        break;
      case 'unit_cost':
        if (value && isNaN(Number(value))) error = 'Enter a valid unit cost.';
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
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: finalValue };
      return updated;
    });

    const error = validateField(name, finalValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        unit_cost: formData.unit_cost ? Number(formData.unit_cost) : 0,
        activity_type_id: formData.activity_type_id ? Number(formData.activity_type_id) : 0,
      };

      await onSubmit(dataToSubmit);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update BOQ Item');
    } finally {
      setIsLoading(false);
    }
  };


  const modalTitle = "Update Item";
  const submitLabel = 'Update Item';

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Activity Type Dropdown */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <select
              name="activity_type_id"
              value={formData.activity_type_id}
              onChange={handleChange}
              className={`w-full bg-slate-50 border ${errors.activity_type_id ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-primary/20'} text-slate-900 text-sm font-medium rounded-xl focus:ring-4 outline-none transition-all py-3 px-4`}
            >
              <option value="">-- Select Activity Type --</option>
              {activityTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.activity_type_id && <p className="text-xs text-red-500 font-medium">{errors.activity_type_id}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g. Concrete Work"
              className={`w-full bg-slate-50 border ${errors.item_name ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-primary/20'} text-slate-900 text-sm font-medium rounded-xl focus:ring-4 outline-none transition-all py-3 px-4`}
            />
            {errors.item_name && <p className="text-xs text-red-500 font-medium">{errors.item_name}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Item details..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all py-3 px-4 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 100"
              className={`w-full bg-slate-50 border ${errors.quantity ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-primary/20'} text-slate-900 text-sm font-medium rounded-xl focus:ring-4 outline-none transition-all py-3 px-4`}
            />
            {errors.quantity && <p className="text-xs text-red-500 font-medium">{errors.quantity}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Unit Rate (₹)
            </label>
            <input
              type="number"
              step="any"
              name="unit_cost"
              value={formData.unit_cost}
              onChange={handleChange}
              placeholder="e.g. 1500"
              className={`w-full bg-slate-50 border ${errors.unit_cost ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-primary/20'} text-slate-900 text-sm font-medium rounded-xl focus:ring-4 outline-none transition-all py-3 px-4`}
            />
            {errors.unit_cost && <p className="text-xs text-red-500 font-medium">{errors.unit_cost}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-4 focus:ring-primary/20 outline-none transition-all py-3 px-4"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="space-y-1.5 flex items-center h-full pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_completed"
                checked={formData.is_completed}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-slate-700">Is Completed</span>
            </label>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default EditBoqItemModal;
