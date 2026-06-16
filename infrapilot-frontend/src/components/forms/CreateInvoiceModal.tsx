import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
    start_date: "",
    end_date: "",
  });

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
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === "labour") {
      if (!formData.project_id || !formData.owner_id || !formData.reference_id || !formData.amount) {
        toast.error("Please fill in required fields (Project, Owner, Ref ID, Amount)");
        return;
      }
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
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      onSubmit(submissionData);
    } else {
      if (!formData.project_id || !formData.invoice_number || !formData.client_name) {
        toast.error("Please fill in required fields (Invoice #, Client, Project)");
        return;
      }
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
      title={initialData ? "Edit Invoice" : (titleMap[formData.type] || "Create Invoice")}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button form="invoice-form" type="submit" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">
            {initialData ? "Save Changes" : "Generate Invoice"}
          </button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        
        {/* Basic Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {!isLabour && (
              <>
                <div>
                  <label className={labelClasses}>Invoice Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className={inputClasses()}
                    placeholder="INV-2024-001"
                    value={formData.invoice_number}
                    onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Client Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className={inputClasses()}
                    placeholder="e.g. Aditya Enterprises"
                    value={formData.client_name}
                    onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
              <select
                required
                className={inputClasses()}
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">Select Project</option>
                {resolvedProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            {isLabour && (
              <>
                <div>
                  <label className={labelClasses}>Owner <span className="text-rose-500">*</span></label>
                  <select
                    required
                    className={inputClasses()}
                    value={formData.owner_id}
                    onChange={e => setFormData({ ...formData, owner_id: e.target.value })}
                  >
                    <option value="">Select Owner</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Reference ID <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    className={inputClasses()}
                    placeholder="e.g. 1"
                    value={formData.reference_id}
                    onChange={e => setFormData({ ...formData, reference_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Start Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    className={inputClasses()}
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>End Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    className={inputClasses()}
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </>
            )}

            {!isLabour && (
              <>
                <div>
                  <label className={labelClasses}>Billing Date</label>
                  <input
                    type="date"
                    className={inputClasses()}
                    value={formData.billing_date}
                    onChange={e => setFormData({ ...formData, billing_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Due Date</label>
                  <input
                    type="date"
                    className={inputClasses()}
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Work & Billing Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Work & Billing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className={labelClasses}>Description <span className="text-rose-500">*</span></label>
              <textarea
                rows={isLabour ? 3 : 2}
                required={isLabour}
                className={`${inputClasses()} resize-none`}
                placeholder={isLabour ? "e.g. Construction invoice for Wing A" : "e.g. Civil construction work..."}
                value={formData.work_description}
                onChange={e => setFormData({ ...formData, work_description: e.target.value })}
              />
            </div>

            {isLabour ? (
              <div>
                <label className={labelClasses}>Base Amount (₹) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min="0"
                  className={`${inputClasses()} font-bold text-slate-800`}
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className={labelClasses}>Quantity</label>
                  <input
                    type="number"
                    className={inputClasses()}
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Rate (₹)</label>
                  <input
                    type="number"
                    className={inputClasses()}
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClasses}>GST (%)</label>
              <select
                className={inputClasses()}
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
                <label className={labelClasses}>Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClasses()}
                  value={formData.tax_percent}
                  onChange={e => setFormData({ ...formData, tax_percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <div>
                <label className={labelClasses}>Payment Status</label>
                <select
                  className={inputClasses()}
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}

            {!isLabour && (
              <div className="md:col-span-2">
                <label className={labelClasses}>Attachment (BOQ/PDF)</label>
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

      </form>
    </Modal >
  );
};

export default CreateInvoiceModal;
