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

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    type: 'labour' as InvoiceType,
    amount: '',
    gst_percent: '18',
    tax_percent: '2',
    description: '',
    reference_id: '',
    owner_id: '1',
    status: 'pending' as InvoiceStatus
  });

  const [calculated, setCalculated] = useState({
    gst_amount: 0,
    tax_amount: 0,
    total_amount: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: String(initialData.project_id),
        type: initialData.type,
        amount: String(initialData.amount),
        gst_percent: String(initialData.gst_percent),
        tax_percent: String(initialData.tax_percent),
        description: initialData.description,
        reference_id: String(initialData.reference_id),
        owner_id: String(initialData.owner_id),
        status: initialData.status
      });
    } else {
      setFormData({
        project_id: '',
        type: 'labour',
        amount: '',
        gst_percent: '18',
        tax_percent: '2',
        description: '',
        reference_id: '',
        owner_id: '1',
        status: 'pending'
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const gstP = parseFloat(formData.gst_percent) || 0;
    const taxP = parseFloat(formData.tax_percent) || 0;

    const gst_amount = (amount * gstP) / 100;
    const tax_amount = (amount * taxP) / 100;
    const total_amount = amount + gst_amount + tax_amount;

    setCalculated({ gst_amount, tax_amount, total_amount });
  }, [formData.amount, formData.gst_percent, formData.tax_percent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    const submissionData = {
      ...formData,
      project_id: Number(formData.project_id),
      amount: parseFloat(formData.amount),
      gst_percent: parseFloat(formData.gst_percent),
      tax_percent: parseFloat(formData.tax_percent),
      gst_amount: calculated.gst_amount,
      tax_amount: calculated.tax_amount,
      total_amount: calculated.total_amount,
      reference_id: formData.reference_id ? Number(formData.reference_id) : 0,
      created_at: initialData ? initialData.created_at : new Date().toISOString()
    };

    onSubmit(submissionData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Invoice" : "Create New Invoice"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          {/* Project Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Project Selection</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none"
            >
              <option value="">Select Project</option>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>

          {/* Type & Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Invoice Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as InvoiceType })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none"
              >
                <option value="owner">Owner</option>
                <option value="labour">Labour</option>
                <option value="material">Material</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reference ID</label>
              <input
                type="text"
                value={formData.reference_id}
                onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                placeholder="e.g. 101"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Base Amount */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Base Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Percentages */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">GST Percentage (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={formData.gst_percent}
                  onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
                <span className="absolute right-4 text-xs font-bold text-slate-400/60">₹{Math.round(calculated.gst_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tax Percentage (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={formData.tax_percent}
                  onChange={(e) => setFormData({ ...formData, tax_percent: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
                <span className="absolute right-4 text-xs font-bold text-slate-400/60">₹{Math.round(calculated.tax_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
              placeholder="Provide a brief description of this invoice..."
            />
          </div>
        </div>

        {/* Totals Summary */}
        <div className="p-5 bg-slate-900 rounded-2xl shadow-inner">
          <div className="flex justify-between items-center text-white">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Amount Payable</p>
              <p className="text-2xl font-black text-primary drop-shadow-sm">₹{calculated.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Net Liability</p>
              <p className="text-base font-bold text-emerald-400">+ ₹{calculated.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-10 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 hover:shadow-primary/30 active:scale-95 transition-all"
          >
            {initialData ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
