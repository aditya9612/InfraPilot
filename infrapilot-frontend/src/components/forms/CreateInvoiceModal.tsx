import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { PROJECTS } from '../../config/projectSeed';
import type { Invoice, InvoiceType, InvoiceStatus } from '../../types/invoice';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: any) => void;
  initialData?: Invoice | null;
}

const INVOICE_TYPES: InvoiceType[] = ["labour", "material", "owner", "other"];
const STATUSES: InvoiceStatus[] = ["pending", "paid", "overdue", "cancelled"];

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    owner_id: '1', // Default to current user for demo
    type: 'labour' as InvoiceType,
    reference_id: '',
    amount: '',
    gst_percent: '18',
    tax_percent: '2',
    description: '',
    status: 'pending' as InvoiceStatus,
  });

  const [calculated, setCalculated] = useState({
    gst_amount: 0,
    tax_amount: 0,
    total_amount: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id.toString(),
        owner_id: initialData.owner_id.toString(),
        type: initialData.type,
        reference_id: initialData.reference_id.toString(),
        amount: initialData.amount.toString(),
        gst_percent: initialData.gst_percent.toString(),
        tax_percent: initialData.tax_percent.toString(),
        description: initialData.description,
        status: initialData.status,
      });
    } else {
      setFormData({
        project_id: '',
        owner_id: '1',
        type: 'labour',
        reference_id: '',
        amount: '',
        gst_percent: '18',
        tax_percent: '2',
        description: '',
        status: 'pending',
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const baseAmount = parseFloat(formData.amount) || 0;
    const gstPercent = parseFloat(formData.gst_percent) || 0;
    const taxPercent = parseFloat(formData.tax_percent) || 0;

    const gst_amount = baseAmount * (gstPercent / 100);
    const tax_amount = baseAmount * (taxPercent / 100);
    const total_amount = baseAmount + gst_amount + tax_amount;

    setCalculated({ gst_amount, tax_amount, total_amount });
  }, [formData.amount, formData.gst_percent, formData.tax_percent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.amount) {
      toast.error("Please fill in project and amount");
      return;
    }

    const finalData = {
      ...formData,
      project_id: parseInt(formData.project_id),
      owner_id: parseInt(formData.owner_id),
      reference_id: parseInt(formData.reference_id) || 0,
      amount: parseFloat(formData.amount),
      gst_percent: parseFloat(formData.gst_percent),
      tax_percent: parseFloat(formData.tax_percent),
      gst_amount: calculated.gst_amount,
      tax_amount: calculated.tax_amount,
      total_amount: calculated.total_amount,
      created_at: initialData?.created_at || new Date().toISOString()
    };

    onSubmit(finalData);
    toast.success(`Invoice ${initialData ? 'updated' : 'created'} successfully!`);
    onClose();
  };

  const modalFooter = (
    <>
      <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
        Cancel
      </button>
      <button
        form="invoice-form"
        type="submit"
        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-95 transition-all"
      >
        {initialData ? 'Update Invoice' : 'Create Invoice'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Invoice" : "Create New Invoice"}
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Project Selection</label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
            >
              <option value="">Select Project</option>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Invoice Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all capitalize appearance-none"
            >
              {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reference ID</label>
            <input
              type="number"
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
              placeholder="e.g. 101"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Base Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">GST Percentage (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="gst_percent"
                value={formData.gst_percent}
                onChange={handleChange}
                placeholder="18"
                className="w-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <span className="text-xs font-bold text-slate-400">₹{calculated.gst_amount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tax Percentage (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="tax_percent"
                value={formData.tax_percent}
                onChange={handleChange}
                placeholder="2"
                className="w-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <span className="text-xs font-bold text-slate-400">₹{calculated.tax_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all capitalize appearance-none"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a brief description of this invoice..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total Amount</p>
              <h2 className="text-3xl font-black tracking-tight">₹{calculated.total_amount.toLocaleString()}</h2>
            </div>
            
            <div className="flex items-center gap-6 text-right md:pr-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">Subtotal</p>
                <p className="text-sm font-bold">₹{(parseFloat(formData.amount) || 0).toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">Total Taxes</p>
                <p className="text-sm font-bold text-emerald-400">₹{(calculated.gst_amount + calculated.tax_amount).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
