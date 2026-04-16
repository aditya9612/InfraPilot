import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import type { RateType } from "../../types/project";
import { PROJECTS } from "../../config/projectSeed";

interface CreateContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (contractorData: any) => void;
  initialData?: any;
}

const CreateContractorModal = ({ isOpen, onClose, onSubmit, initialData }: CreateContractorModalProps) => {
  const [formData, setFormData] = useState({
    contractor_id: "",
    name: "",
    company: "",
    email: "",
    work_type: "",
    contact_number: "",
    gst_number: "",
    rate_type: "lumpsum" as RateType,
    total_work_assigned: 0,
    payment_given: 0,
    bank_details: "",
    project_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contractor_id: initialData.id?.toString() || "",
        name: initialData.name || "",
        company: initialData.company || "",
        email: initialData.email || "",
        work_type: initialData.projects || "",
        contact_number: initialData.mobile || "",
        gst_number: initialData.gst || "",
        rate_type: initialData.rate_type || "lumpsum",
        total_work_assigned: initialData.total_work_assigned || 0,
        payment_given: initialData.payment_given || 0,
        bank_details: initialData.bank || "",
        project_id: initialData.project_id?.toString() || "",
      });
    } else {
      setFormData({
        contractor_id: "",
        name: "",
        company: "",
        email: "",
        work_type: "",
        contact_number: "",
        gst_number: "",
        rate_type: "lumpsum",
        total_work_assigned: 0,
        payment_given: 0,
        bank_details: "",
        project_id: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["total_work_assigned", "payment_given"].includes(name) ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.contractor_id.trim()) newErrors.contractor_id = "Contractor ID is required.";
    if (!formData.name.trim()) newErrors.name = "Contractor name is required.";
    if (!formData.company.trim()) newErrors.company = "Company name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    if (!formData.work_type.trim()) newErrors.work_type = "Work type is required.";
    if (!formData.contact_number.trim()) newErrors.contact_number = "Contact number is required.";
    if (!/^\d{10}$/.test(formData.contact_number)) newErrors.contact_number = "Enter a valid 10-digit number.";
    if (!formData.gst_number.trim()) newErrors.gst_number = "GST number is required.";
    if (!formData.bank_details.trim()) newErrors.bank_details = "Bank details are required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const payload = {
        ...formData,
        total_work_assigned: Number(formData.total_work_assigned),
        payment_given: Number(formData.payment_given)
      };
      
      console.log("Creating new contractor:", payload);
      if (onSubmit) onSubmit(payload);
      
      setIsLoading(false);
      toast.success(`Contractor "${formData.name}" created successfully!`, {
        style: {
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600'
        },
      });
      onClose();
    }, 1000);
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        form="contractor-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create Contractor"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Contractor" : "Add New Contractor"}
      footer={modalFooter}
    >
      <form id="contractor-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Contractor ID <span className="text-red-500">*</span></label>
              <input
                required type="text" name="contractor_id" value={formData.contractor_id} onChange={handleChange} placeholder="e.g. 3"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.contractor_id ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.contractor_id && <p className="text-[10px] text-red-500 mt-1">{errors.contractor_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Contractor Name <span className="text-red-500">*</span></label>
              <input
                required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Sai Infra"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input
                required type="text" name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Sai Constructions"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.company ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.company && <p className="text-[10px] text-red-500 mt-1">{errors.company}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email address <span className="text-red-500">*</span></label>
              <input
                required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. sai@infra.com"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Contact Number <span className="text-red-500">*</span></label>
              <input
                required type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="10-digit number"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.contact_number ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.contact_number && <p className="text-[10px] text-red-500 mt-1">{errors.contact_number}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">GST Number <span className="text-red-500">*</span></label>
              <input
                required type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} placeholder="GSTIN"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.gst_number ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.gst_number && <p className="text-[10px] text-red-500 mt-1">{errors.gst_number}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Assign to Project <span className="text-red-500">*</span></label>
              <select
                name="project_id" value={formData.project_id} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="">Select a project...</option>
                {PROJECTS.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Work & Rate Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Scope of Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Work Type <span className="text-red-500">*</span></label>
              <input
                required type="text" name="work_type" value={formData.work_type} onChange={handleChange} placeholder="e.g. Electrical"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.work_type ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.work_type && <p className="text-[10px] text-red-500 mt-1">{errors.work_type}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Rate Type</label>
              <select
                name="rate_type" value={formData.rate_type} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="lumpsum">Lumpsum</option>
                <option value="measured">Measured</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Total Work Assigned (₹)</label>
              <input
                type="number" name="total_work_assigned" value={formData.total_work_assigned} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Payment Given (₹)</label>
              <input
                type="number" name="payment_given" value={formData.payment_given} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Bank Details</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Bank Information <span className="text-red-500">*</span></label>
            <textarea
              required name="bank_details" value={formData.bank_details} onChange={handleChange} 
              placeholder="e.g. SBI Bank, A/C: 9876543210, IFSC: SBIN0005678" rows={2}
              className={`w-full px-3 py-2 bg-slate-50 border ${errors.bank_details ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300 resize-none`}
            />
            {errors.bank_details && <p className="text-[10px] text-red-500 mt-1">{errors.bank_details}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateContractorModal;
