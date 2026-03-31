import React, { useState, useEffect, useRef } from 'react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

const ROLES = [
  'Admin',
  'Project Manager',
  'Site Engineer',
  'Contractor',
  'Accountant',
  'Client',
];

const MOCK_PROJECTS = [
  'Skyline Residency',
  'Metro Expansion Phase II',
  'Green Valley Infrastructure',
  'Oceanic Bridge Project',
];

const WORK_TYPES = ['Civil', 'Electrical', 'Plumbing'];

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    role: '',
    // Site Engineer / Project Manager
    assignedProject: '',
    experience: '',
    qualification: '',
    // Contractor
    companyName: '',
    workType: '',
    gstNumber: '',
    // Accountant
    department: '',
    // Client
    projectLinked: '',
    address: '',
    // Status
    isActive: true,
    // Optional
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape or Backdrop click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters.';
    }

    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role.';
    }

    // Role specific validation
    if (['Site Engineer', 'Project Manager'].includes(formData.role)) {
      if (!formData.assignedProject) newErrors.assignedProject = 'Project is required.';
    }

    if (formData.role === 'Contractor') {
      if (!formData.companyName) newErrors.companyName = 'Company name is required.';
      if (!formData.workType) newErrors.workType = 'Work type is required.';
      if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
        newErrors.gstNumber = 'Enter a valid GST number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        onSubmit({ ...formData, photo });
        setIsLoading(false);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Basic Information */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 bg-gray-50 border ${errors.fullName ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none`}
                />
                {errors.fullName && <p className="mt-1 text-xs text-danger">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mobile Number <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full px-4 py-2 bg-gray-50 border ${errors.mobile ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none`}
                />
                {errors.mobile && <p className="mt-1 text-xs text-danger">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email <span className="text-gray-400 italic text-xs">(Optional)</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-2 bg-gray-50 border ${errors.email ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none`}
                />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role <span className="text-danger">*</span></label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-50 border ${errors.role ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none appearance-none`}
                >
                  <option value="">Select Role</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <p className="mt-1 text-xs text-danger">{errors.role}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Role-Based Dynamic Fields */}
          {formData.role && formData.role !== 'Admin' && (
            <div className="mb-8 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-warning rounded-full"></div>
                <h3 className="font-semibold text-gray-700">Role Details: {formData.role}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Site Engineer / Project Manager */}
                {['Site Engineer', 'Project Manager'].includes(formData.role) && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Assigned Project <span className="text-danger">*</span></label>
                      <select
                        name="assignedProject"
                        value={formData.assignedProject}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-gray-50 border ${errors.assignedProject ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none`}
                      >
                        <option value="">Select Project</option>
                        {MOCK_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {errors.assignedProject && <p className="mt-1 text-xs text-danger">{errors.assignedProject}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Contractor */}
                {formData.role === 'Contractor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Company Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-gray-50 border ${errors.companyName ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Work Type <span className="text-danger">*</span></label>
                      <select
                        name="workType"
                        value={formData.workType}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-gray-50 border ${errors.workType ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all`}
                      >
                        <option value="">Select Type</option>
                        {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">GST Number</label>
                      <input
                        type="text"
                        name="gstNumber"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-gray-50 border ${errors.gstNumber ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-primary'} rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none uppercase placeholder:normal-case`}
                      />
                      {errors.gstNumber && <p className="mt-1 text-xs text-danger">{errors.gstNumber}</p>}
                    </div>
                  </>
                )}

                {/* Accountant */}
                {formData.role === 'Accountant' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all"
                    />
                  </div>
                )}

                {/* Client */}
                {formData.role === 'Client' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Project Linked</label>
                      <select
                        name="projectLinked"
                        value={formData.projectLinked}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all"
                      >
                        <option value="">Select Project</option>
                        {MOCK_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                      <textarea
                        name="address"
                        rows={2}
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none resize-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Status */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-semibold text-gray-700">Account Status</p>
                <p className="text-xs text-gray-500">Enable or disable user access to the platform</p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${formData.isActive ? 'bg-success' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Optional Fields */}
          <div className="mb-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Profile Photo</label>
              <div 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-primary/50 transition-colors bg-white cursor-pointer group relative overflow-hidden"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photo ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-700 truncate">{photo.name}</p>
                      <p className="text-xs text-gray-400">{(photo.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                      className="text-danger hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Drag & drop or <span className="text-primary font-medium">browse</span></p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Notes / Remarks</label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional details here..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary rounded-xl focus:ring-2 focus:ring-offset-0 focus:outline-none transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 5: Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.fullName || !formData.mobile || !formData.role}
              className={`px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 ${isLoading || !formData.fullName || !formData.mobile || !formData.role ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default CreateUserModal;
