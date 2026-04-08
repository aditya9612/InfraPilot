import React from 'react';
import Modal from '../common/Modal';
import type { Invoice } from '../../types/invoice';
import { PROJECTS } from '../../config/projectSeed';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onMarkPaid?: (id: number) => void;
  onDownloadPDF?: (id: number) => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ isOpen, onClose, invoice, onMarkPaid, onDownloadPDF }) => {
  if (!invoice) return null;

  const project = PROJECTS.find(p => p.id === invoice.project_id);

  const footer = (
    <div className="flex gap-3">
      {invoice.status !== 'paid' && (
        <button
          onClick={() => onMarkPaid?.(invoice.id)}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 text-white"
        >
          Mark as Paid
        </button>
      )}
      <button
        onClick={() => onDownloadPDF?.(invoice.id)}
        className="px-6 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg text-white"
      >
        Download PDF
      </button>
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
      >
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Specifications"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Professional Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-3xl shadow-xl italic text-white uppercase tracking-tight">
              INV
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight uppercase">INV-00{invoice.id}</h3>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                  invoice.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2 text-sm uppercase tracking-wider">
                <span className="text-primary tracking-widest text-xs uppercase font-black">{invoice.type.toUpperCase()} INVOICE</span>
              </p>
              <div className="text-white/70 text-sm font-medium">Issue Date: <span className="text-white font-bold">{new Date(invoice.created_at).toLocaleDateString('en-GB')}</span></div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          
          {/* Bill-to Information */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} title="Bill To / Project Details">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Project Name</p>
               <p className="text-sm font-black text-slate-800">{project?.project_name || 'N/A'}</p>
               <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project?.description}</p>
             </div>
             <InfoItem label="Reference ID" value={`#REF-${invoice.reference_id}`} />
             <InfoItem label="Description" value={invoice.description} />
          </Section>

          {/* Pricing Analysis */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Financial Breakdown">
            <div className="space-y-4">
               <BreakdownItem label="Base Amount" value={invoice.amount} />
               <BreakdownItem label={`GST (${invoice.gst_percent}%)`} value={invoice.gst_amount} />
               <BreakdownItem label={`Tax (${invoice.tax_percent}%)`} value={invoice.tax_amount} />
               
               <div className="pt-4 mt-2 border-t border-slate-200">
                 <div className="flex justify-between items-center group">
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Invoice Amount</p>
                   <p className="text-lg font-black text-primary">₹{invoice.total_amount.toLocaleString()}</p>
                 </div>
               </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-primary">{icon}</div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4 pt-1">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-all duration-200">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
  </div>
);

const BreakdownItem: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-slate-700">
    <p className="text-xs font-bold">{label}</p>
    <p className="text-sm font-black tracking-tight text-slate-800">₹{value.toLocaleString()}</p>
  </div>
);

export default InvoiceDetailsModal;
