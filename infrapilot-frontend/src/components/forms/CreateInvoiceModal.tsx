import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { Invoice, InvoiceType, InvoiceStatus, InvoiceCreateData } from "../../types/invoice";
import type { Project } from "../../types/project";
import { ownerService } from "../../services/ownerService";
import { projectService } from "../../services/projectService";
import type { Owner } from "../../types/owner";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: any) => void;
  projects?: Project[];
  initialData?: Invoice | null;
  initialType?: InvoiceType;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  initialData,
  initialType,
}) => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [formData, setFormData] = useState({
    invoice_number: "",
    client_name: "",
    project_id: "",
    type: "owner" as InvoiceType,
    billing_date: new Date().toISOString().split('T')[0],
    due_date: "",
    work_description: "",
    quantity: 1,
    rate: 0,
    amount: 0,
    gst_percent: 18,
    status: "pending" as InvoiceStatus | "partial",
    attachment: null as File | null,
    owner_id: "",
    reference_id: "",
    tax_percent: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  const [calculated, setCalculated] = useState({
    base_total: 0,
    gst_amount: 0,
    tax_amount: 0,
    total_with_gst: 0,
  });

  const [internalProjects, setInternalProjects] = useState<Project[]>([]);
  const resolvedProjects = projects && projects.length > 0 ? projects : internalProjects;

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, type: initialType || "owner" }));
      if (initialType === "labour") {
        ownerService.getOwners().then(setOwners).catch(console.error);
      }
      // Fetch projects internally if not provided via props
      if (!projects || projects.length === 0) {
        projectService.getProjects(100, 0).then((res: any) => {
          const list = Array.isArray(res) ? res : res.items || res.data || [];
          setInternalProjects(list);
        }).catch(console.error);
      }
    }
  }, [isOpen, initialType]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        invoice_number: initialData.invoice_number || "",
        client_name: initialData.client_name || "",
        project_id: String(initialData.project_id),
        type: initialData.type,
        billing_date: initialData.created_at ? initialData.created_at.split('T')[0] : "",
        due_date: initialData.due_date || "",
        work_description: initialData.description || "",
        quantity: initialData.quantity || 1,
        rate: initialData.rate || 0,
        amount: initialData.amount || 0,
        gst_percent: initialData.gst_percent || 18,
        status: initialData.status as any,
        attachment: null,
        owner_id: initialData.owner_id ? String(initialData.owner_id) : "",
        reference_id: initialData.reference_id ? String(initialData.reference_id) : "",
        tax_percent: initialData.tax_percent || 5,
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    let base = 0;
    if (formData.type === "labour") {
      base = Number(formData.amount) || 0;
    } else {
      base = formData.quantity * formData.rate;
    }

    const gst = (base * formData.gst_percent) / 100;
    let tax = 0;
    if (formData.type === "labour") {
      tax = (base * formData.tax_percent) / 100;
    }

    setCalculated({
      base_total: base,
      gst_amount: gst,
      tax_amount: tax,
      total_with_gst: base + gst + tax,
    });

    if (formData.type !== "labour") {
      setFormData(prev => ({ ...prev, amount: base }));
    }
  }, [formData.quantity, formData.rate, formData.amount, formData.gst_percent, formData.tax_percent, formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.type === "labour") {
      if (!formData.project_id) newErrors.project_id = "Project is required.";
      if (!formData.owner_id) newErrors.owner_id = "Owner is required.";
      if (!formData.reference_id) newErrors.reference_id = "Reference ID is required.";
      if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0.";
      if (!formData.work_description.trim()) newErrors.work_description = "Description is required.";
    } else {
      if (!formData.invoice_number.trim()) newErrors.invoice_number = "Invoice number is required.";
      if (!formData.client_name.trim()) newErrors.client_name = "Client name is required.";
      if (!formData.project_id) newErrors.project_id = "Project is required.";
      if (!formData.work_description.trim()) newErrors.work_description = "Description is required.";
      if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0.";
      if (formData.rate <= 0) newErrors.rate = "Rate must be greater than 0.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (formData.type === "labour") {
      const submissionData: InvoiceCreateData = {
        project_id: Number(formData.project_id),
        owner_id: Number(formData.owner_id),
        type: "labour",
        reference_id: Number(formData.reference_id),
        amount: Number(formData.amount),
        gst_percent: formData.gst_percent,
        gst_amount: calculated.gst_amount,
        tax_percent: formData.tax_percent,
        tax_amount: calculated.tax_amount,
        total_amount: calculated.total_with_gst,
        description: formData.work_description,
      };
      onSubmit(submissionData);
    } else {
      const submissionData = {
        ...formData,
        amount: calculated.base_total,
        total_with_gst: calculated.total_with_gst,
        project_id: Number(formData.project_id),
      };
      onSubmit(submissionData);
    }
    onClose();
  };

  const isLabour = formData.type === "labour";
  const titleMap = {
    owner: "Create Owner Billing",
    labour: "Create Labour Invoice",
    material: "Create Material Supply",
    expense: "Create Site Expense"
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Invoice" : (titleMap[formData.type] || "Create Invoice")}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {!isLabour && (
              <>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Invoice Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="invoice_number"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.invoice_number ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    placeholder="INV-2024-001"
                    value={formData.invoice_number}
                    onChange={handleChange}
                  />
                  {errors.invoice_number && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.invoice_number}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Client Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="client_name"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.client_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    placeholder="e.g. Aditya Enterprises"
                    value={formData.client_name}
                    onChange={handleChange}
                  />
                  {errors.client_name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.client_name}</p>}
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Project <span className="text-red-500">*</span></label>
              <select
                name="project_id"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.project_id ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                value={formData.project_id}
                onChange={handleChange}
              >
                <option value="">Select Project</option>
                {resolvedProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
              {errors.project_id && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.project_id}</p>}
            </div>

            {isLabour && (
              <>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Owner <span className="text-red-500">*</span></label>
                  <select
                    name="owner_id"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.owner_id ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    value={formData.owner_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Owner</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  {errors.owner_id && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.owner_id}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Reference ID <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="reference_id"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.reference_id ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    placeholder="e.g. 1"
                    value={formData.reference_id}
                    onChange={handleChange}
                  />
                  {errors.reference_id && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.reference_id}</p>}
                </div>
              </>
            )}

            {!isLabour && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Billing Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.billing_date}
                    onChange={e => setFormData({ ...formData, billing_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Description <span className="text-red-500">*</span></label>
              <textarea
                name="work_description"
                rows={isLabour ? 3 : 2}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.work_description ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all resize-none`}
                placeholder={isLabour ? "e.g. Construction invoice for Wing A" : "e.g. Civil construction work..."}
                value={formData.work_description}
                onChange={handleChange}
              />
              {errors.work_description && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.work_description}</p>}
            </div>

            {isLabour ? (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Base Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.amount ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all font-bold text-slate-800`}
                  value={formData.amount}
                  onChange={e => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }));
                  }}
                />
                {errors.amount && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.amount}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.quantity ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    value={formData.quantity}
                    onChange={e => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }));
                    }}
                  />
                  {errors.quantity && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.quantity}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Rate (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="rate"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.rate ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                    value={formData.rate}
                    onChange={e => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }));
                    }}
                  />
                  {errors.rate && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.rate}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">GST (%)</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.gst_percent}
                  onChange={e => setFormData({ ...formData, gst_percent: parseInt(e.target.value) })}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              {isLabour ? (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.tax_percent}
                    onChange={e => setFormData({ ...formData, tax_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Status</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              )}
            </div>

            {!isLabour && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Attachment (BOQ/PDF)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-xs text-slate-500 font-bold">Click to upload file</p>
                      </div>
                      <input type="file" className="hidden" onChange={e => setFormData({ ...formData, attachment: e.target.files ? e.target.files[0] : null })} />
                  </label>
                </div>
                {formData.attachment && <p className="text-[10px] text-primary font-bold mt-1">Attached: {formData.attachment.name}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-slate-900 rounded-[28px] p-8 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="grid grid-cols-3 gap-8">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Amount</p>
                    <p className="text-xl font-bold text-white">₹{calculated.base_total.toLocaleString()}</p>
                </div>
                <div className="space-y-1 border-x border-white/5 px-8">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GST ({formData.gst_percent}%)</p>
                    <p className="text-xl font-bold text-emerald-400">+ ₹{calculated.gst_amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {isLabour ? "Total w/ Tax&GST" : "Total with GST"}
                    </p>
                    <p className="text-3xl font-black text-primary">₹{calculated.total_with_gst.toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
          >
            {initialData ? "Save Changes" : "Generate Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
