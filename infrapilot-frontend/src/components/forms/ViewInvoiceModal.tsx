import React from "react";
import Modal from "../common/Modal";

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partial";

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xs shadow-xl">
                  INV
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {invoice.invoice_number}
                  </h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                    Dated: {invoice.billing_date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border ${
                isPaid ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" : 
                isPartial ? "bg-amber-500/20 border-amber-500/30 text-amber-100" : 
                "bg-rose-500/20 border-rose-500/30 text-rose-100"
              }`}>
                {invoice.status}
              </span>
              <p className="text-white/60 text-[10px] font-bold">Due: {invoice.due_date}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Entity Information */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Project & Client"
          >
            <InfoItem label="Client Name" value={invoice.client_name} />
            <InfoItem label="Project Name" value={invoice.project_name} />
          </Section>

          {/* Work Description */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Work Details"
          >
            <div className="md:col-span-2">
                <InfoItem label="Description" value={invoice.work_description} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <InfoItem label="Quantity" value={invoice.quantity.toLocaleString()} />
                <InfoItem label="Unit Rate" value={`₹${invoice.rate.toLocaleString()}`} />
            </div>
          </Section>

          {/* Financial Breakdown */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Financial Summary"
            fullWidth
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <InfoItem
                label="Base Amount"
                value={`₹${invoice.amount?.toLocaleString()}`}
                valueClass="text-lg text-slate-800"
              />
              <InfoItem
                label={`GST (${invoice.gst_percent}%)`}
                value={`₹${(invoice.total_with_gst - invoice.amount).toLocaleString()}`}
                valueClass="text-lg text-emerald-600"
              />
              <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
                <InfoItem
                    label="Total Amount"
                    value={`₹${invoice.total_with_gst.toLocaleString()}`}
                    valueClass="text-2xl text-primary font-black"
                />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}> = ({ icon, title, children, fullWidth }) => (
  <div className={`space-y-4 ${fullWidth ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-primary">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">
      {label}
    </p>
    <p className={`text-sm font-bold text-slate-700 ${valueClass ?? ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default ViewInvoiceModal;
