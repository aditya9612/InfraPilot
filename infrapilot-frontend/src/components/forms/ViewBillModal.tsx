import React from "react";
import Modal from "../common/Modal";

interface ViewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
}

const ViewBillModal: React.FC<ViewBillModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  if (!bill) return null;

  const isPaid = bill.status === "paid";
  const isPartial = bill.status === "partial";

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
      title="Bill Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-slate-800 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs shadow-xl">
                  {bill.category === "vendor" ? "VND" : "CON"}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {bill.vendor_name}
                  </h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                    Ref: {bill.bill_number}
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
                {bill.status}
              </span>
              <p className="text-white/60 text-[10px] font-bold">Due: {bill.due_date}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Item Information */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title="Material / Service"
          >
            <div className="md:col-span-2">
                <InfoItem label="Description" value={bill.item} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <InfoItem label="Quantity" value={bill.quantity?.toLocaleString()} />
                <InfoItem label="Unit Rate" value={`₹${bill.rate?.toLocaleString()}`} />
            </div>
          </Section>

          {/* Additional Info */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Category & Status"
          >
            <InfoItem label="Account Category" value={bill.category === "vendor" ? "Material Vendor" : "Sub-Contractor"} />
            <InfoItem label="Payment Status" value={bill.status?.toUpperCase()} />
          </Section>

          {/* Financial Breakdown */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Financial Breakdown"
            fullWidth
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <InfoItem
                label="Base Total"
                value={`₹${bill.total_amount?.toLocaleString()}`}
                valueClass="text-lg text-slate-800"
              />
              <InfoItem
                label="GST Component"
                value={`₹${bill.gst?.toLocaleString()}`}
                valueClass="text-lg text-emerald-600"
              />
              <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
                <InfoItem
                    label="Payable Amount"
                    value={`₹${bill.payable_amount?.toLocaleString()}`}
                    valueClass="text-2xl text-slate-900 font-black"
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
      <div className="text-slate-500">{icon}</div>
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

export default ViewBillModal;
