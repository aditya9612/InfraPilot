import React from 'react';
import Modal from '../common/Modal';

interface ContractorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: any | null;
}

const ContractorDetailsModal: React.FC<ContractorDetailsModalProps> = ({ isOpen, onClose, contractor }) => {
  if (!contractor) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contractor Profile"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Company Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden shrink-0">
               <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                {contractor.company.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{contractor.company}</h3>
                <span className={`px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest ${contractor.status === 'Active' ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {contractor.status}
                </span>
              </div>
              <p className="text-white font-bold flex items-center justify-center md:justify-start gap-2">
                <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {contractor.rating} Performance Score
              </p>
              <div className="text-white/70 text-sm font-medium">Primary Contact: <span className="text-white font-bold">{contractor.name}</span></div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          
          {/* Company Profile */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m0 4h.01" /></svg>} title="Company Profile">
            <InfoItem label="Legal Name" value={contractor.company} />
            <InfoItem label="Site Manager" value={contractor.name} />
            <InfoItem label="Expertise / Projects" value={contractor.projects} />
          </Section>

          {/* Business & Finance */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} title="Business & Finance">
            <InfoItem label="GST Registration" value={contractor.gst} valueClass="font-mono text-slate-900 border-b border-slate-100 w-fit" />
            <InfoItem label="Banking Reference" value={contractor.bank} />
          </Section>

          {/* Outreach */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} title="Outreach" fullWidth>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <InfoItem label="Direct Phone" value={contractor.mobile} />
              <InfoItem label="Corporate Email" value={contractor.email} />
            </div>
          </Section>

        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, fullWidth?: boolean }> = ({ icon, title, children, fullWidth }) => (
  <div className={`space-y-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-emerald-600">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4 pt-1">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string, value: string, valueClass?: string }> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-emerald-600 transition-colors">{label}</p>
    <p className={`text-sm font-bold text-slate-800 ${valueClass}`}>{value || '—'}</p>
  </div>
);

export default ContractorDetailsModal;
