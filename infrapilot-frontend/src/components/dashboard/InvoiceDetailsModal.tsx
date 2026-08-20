import React from "react";
import Modal from "../common/Modal";
import type { Invoice } from "../../types/invoice";
import type { Project } from "../../types/project";
import type { Owner } from "../../types/owner";

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  projects: Project[];
  owners?: Owner[];
  onMarkPaid: (id: number) => void;
  onDownloadPDF: (id: number) => void;
  onSendInvoice?: (id: number) => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  projects,
  owners = [],
  onMarkPaid,
  onDownloadPDF,
  onSendInvoice,
}) => {
  if (!invoice) return null;

  const project = projects.find((p) => p.id === invoice.project_id);
  const owner = owners.find((o) => String(o.id) === String(invoice.owner_id));
  // quotation removed as it is not used in the UI directly

  const statusColors = {
    pending: "bg-amber-100 text-amber-600 border-amber-200",
    paid: "bg-emerald-100 text-emerald-600 border-emerald-200",
    overdue: "bg-rose-100 text-rose-600 border-rose-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Specifications"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        {/* Premium Header Card */}
        <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex items-center gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center font-black text-2xl tracking-tighter text-slate-300 border border-slate-700 shadow-inner shrink-0 italic">
            INV
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black tracking-tight uppercase">
                INV-{String(invoice.id).padStart(3, "0")}
              </h2>
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColors[invoice.status]}`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase">
              {invoice.type} Invoice
            </p>
            <p className="text-sm font-medium text-slate-400">
              Issue Date:{" "}
              <span className="text-white font-bold">
                {invoice.created_at?.split("T")[0]}
              </span>
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Project Details */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Bill To / Project Details
                </h3>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>

              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Project Name
                </p>
                <p className="text-lg font-black text-slate-800 tracking-tight">
                  {project?.project_name || "N/A"}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Wing A Construction - Premium Residential Complex
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                  Reference ID
                </p>
                <p className="text-sm font-bold text-slate-700 ml-1">
                  #REF-{invoice.reference_id}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                  Description
                </p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/30 p-4 rounded-2xl border border-slate-50/50 italic">
                  "{invoice.description}"
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Financial Breakdown
                </h3>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-bold text-slate-500">
                    Base Amount
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    ₹{(invoice.amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-bold text-slate-500">
                    GST ({invoice.gst_percent ?? 0}%)
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    ₹{(invoice.gst_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-bold text-slate-500">
                    Tax ({invoice.tax_percent ?? 0}%)
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    ₹{(invoice.tax_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="h-px bg-slate-100 w-full my-2"></div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-bold text-slate-500">
                    Paid Amount
                  </span>
                  <span className="text-sm font-black text-emerald-600">
                    ₹{(invoice.paid_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-bold text-slate-500">
                    Pending Amount
                  </span>
                  <span className="text-sm font-black text-amber-600">
                    ₹{(invoice.pending_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-4 flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Invoice Amount
                  </span>
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    ₹{(invoice.total_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Type</p>
                <p className="text-[13px] font-bold text-slate-700 capitalize">{invoice.source_type && invoice.source_type !== "null" ? invoice.source_type : "Manual Entry"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client / Owner</p>
                <p className="text-xs font-bold text-slate-600">{owner ? owner.name : invoice.owner_id ? `Owner #${invoice.owner_id}` : "N/A"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                <p className="text-xs font-bold text-slate-600">{invoice.created_at?.split("T")[0]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
          {invoice.status !== "paid" && (
            <button
              onClick={() => onMarkPaid(invoice.id)}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
            >
              Mark as Paid
            </button>
          )}
          {onSendInvoice && (
            <button
              onClick={() => onSendInvoice(invoice.id)}
              className="px-8 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl text-sm font-black shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              Send Invoice
            </button>
          )}
          <button
            onClick={() => onDownloadPDF(invoice.id)}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-slate-500 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailsModal;
