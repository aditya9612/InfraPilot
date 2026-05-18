import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import type { Role } from '../../types/user';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: any) => void;
  initialData?: Role | null;
}

const PRESET_COLORS = [
  { name: 'Blue', value: 'primary' },
  { name: 'Indigo', value: 'indigo-500' },
  { name: 'Emerald', value: 'emerald-500' },
  { name: 'Amber', value: 'amber-500' },
  { name: 'Rose', value: 'rose-500' },
  { name: 'Slate', value: 'slate-500' },
];

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'primary',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description,
          color: initialData.color,
          is_active: initialData.is_active,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: 'primary',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.length < 3) newErrors.name = 'Role Name must be at least 3 characters.';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        onSubmit({
          ...formData,
          id: initialData?.id || String(Date.now()),
          userCount: initialData?.userCount || 0,
        });
        setIsLoading(false);
        const action = initialData ? 'updated' : 'created';
        toast.success(`Role "${formData.name}" ${action} successfully!`, {
          style: { borderRadius: '12px', background: '#333', color: '#fff' },
        });
        onClose();
      }, 800);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="role-form"
        type="submit"
        disabled={isLoading || !formData.name || !formData.description}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 ${isLoading || !formData.name || !formData.description ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
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
          initialData ? 'Update Role' : 'Create Role'
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Role Details" : "Create New System Role"}
      footer={modalFooter}
      maxWidth="max-w-xl"
    >
      <form id="role-form" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Role Identity</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Role Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Regional Manager"
              className={`w-full px-4 py-2 bg-gray-50 border ${errors.name ? 'border-rose-500 focus:ring-rose-100' : 'border-gray-200 focus:ring-primary/20'} rounded-xl transition-all outline-none`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description <span className="text-rose-500">*</span></label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly describe the responsibilities and access scope of this role..."
              className={`w-full px-4 py-2 bg-gray-50 border ${errors.description ? 'border-rose-500' : 'border-gray-200 focus:ring-primary/20'} rounded-xl transition-all outline-none resize-none`}
            />
            {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Theme Color Accent</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, color: color.value }))}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-${color.value}`} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full">
            <div>
              <p className="font-semibold text-gray-700">Active Status</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">New users can be assigned to this role</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoleModal;
