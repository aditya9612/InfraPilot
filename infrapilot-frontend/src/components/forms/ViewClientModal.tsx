import React from "react";
import Modal from "../common/Modal";

interface ViewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
}

const ViewClientModal: React.FC<ViewClientModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  if (!client) return null;

  const isActive = client.status === "Active";
  const billingPending =
    client.billing?.includes("Pending") || client.billing?.includes("Overdue");

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Profile
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Profile"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Profile Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-16 -mb-16" />

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0 transition-transform group-hover:scale-105 duration-500">
                <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                  {client.name?.charAt(0) ?? "?"}
                </span>
              </div>
              {/* Active indicator */}
              <div
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-primary flex items-center justify-center ${isActive ? "bg-emerald-500" : "bg-amber-500"
                  }`}
              >
                <div className="w-2 h-2 rounded-full bg-white opacity-40 animate-pulse" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">
                  {client.name}
                </h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">
                  {client.status}
                </span>
              </div>
              {client.company && client.company !== "N/A" && (
                <p className="text-white/90 text-sm font-semibold pt-1">{client.company}</p>
              )}
              {client.project && client.project !== "No Project Linked" && (
                <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Project</span>
                    <span className="text-xs font-bold">{client.project}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">

          {/* Contact Information */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
            title="Contact Information"
          >
            <InfoItem label="Email Address" value={client.email} />
            <InfoItem label="Mobile Number" value={client.mobile} />
          </Section>

          {/* Project & Status */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="Status"
          >
            <InfoItem
              label="Account Status"
              value={client.status}
              valueClass={isActive ? "text-emerald-600" : "text-amber-600"}
            />
          </Section>

          {/* Financial Summary — full width */}
          <Section
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Financial Summary"
            fullWidth
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <InfoItem
                label="Billing Status"
                value={client.billing || "—"}
                valueClass={billingPending ? "text-rose-500" : "text-emerald-600"}
              />
              <InfoItem
                label="Payments Received"
                value={client.payments || "—"}
                valueClass="text-sky-600"
              />
            </div>
          </Section>

        </div>
      </div>
    </Modal>
  );
};

/* ── Shared helpers (same pattern as UserDetailsModal) ── */

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

export default ViewClientModal;
