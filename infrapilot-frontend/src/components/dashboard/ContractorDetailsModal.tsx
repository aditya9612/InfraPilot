import React, { useState } from 'react';
import Modal from '../common/Modal';
import { PROJECTS } from '../../config/projectSeed';

interface ContractorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: any | null;
}

const ContractorDetailsModal: React.FC<ContractorDetailsModalProps> = ({ isOpen, onClose, contractor }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'payments'>('overview');

  if (!contractor) return null;

  const assignedProject = PROJECTS.find(p => p.id === contractor.project_id);

  // Financial Calculations
  const totalBilled = contractor.bills?.reduce((acc: number, bill: any) => acc + (bill.status === 'approved' ? bill.amount : 0), 0) || 0;
  const totalPaid = contractor.payments?.reduce((acc: number, pay: any) => acc + pay.amount, 0) || 0;
  const pendingDues = totalBilled - totalPaid;

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
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 pb-4">
        {/* Premium Company Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-6 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl shadow-xl overflow-hidden shrink-0">
               <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                {contractor.company.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>

            <div className="text-center md:text-left space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-xl font-black tracking-tight">{contractor.company}</h3>
                <span className={`px-2.5 py-0.5 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest ${contractor.status === 'Active' ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {contractor.status || 'Active'}
                </span>
              </div>
              <p className="text-white text-sm font-bold flex items-center justify-center md:justify-start gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {contractor.rating || 5.0} Performance Score
              </p>
              <div className="text-white/70 text-xs font-medium">Primary Contact: <span className="text-white font-bold">{contractor.name}</span></div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'bills', label: 'Billing History', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
            { id: 'payments', label: 'Payment Records', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 justify-center ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content View */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Contract Value" value={contractor.total_work_assigned || 0} icon="₹" color="text-slate-600" />
                <SummaryCard label="Total Billed" value={totalBilled} icon="🧾" color="text-blue-600" />
                <SummaryCard label="Total Paid" value={totalPaid} icon="💸" color="text-emerald-600" />
                <SummaryCard label="Pending Dues" value={pendingDues} icon="⏳" color="text-rose-600" isHighlight />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m0 4h.01" /></svg>} title="Assignment Profile">
                  <InfoItem label="Assigned Site" value={assignedProject?.project_name || 'Not Linked'} valueClass="text-primary" />
                  <InfoItem label="Work Description" value={contractor.work_type || contractor.projects} />
                </Section>

                <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} title="Contact Directory">
                  <InfoItem label="Direct Phone" value={contractor.mobile || contractor.contact_number} />
                  <InfoItem label="Corporate Email" value={contractor.email} />
                </Section>

                <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} title="Finance Details" fullWidth>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <InfoItem label="GST Registration" value={contractor.gst || contractor.gst_number} valueClass="font-mono text-slate-900" />
                    <InfoItem label="Banking / IFSC Reference" value={contractor.bank || contractor.bank_details} />
                  </div>
                </Section>
              </div>
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contractor.bills?.length > 0 ? contractor.bills.map((bill: any) => (
                    <tr key={bill.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-600">{new Date(bill.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-500">{bill.memo}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${bill.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-700">₹{bill.amount.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold italic">No billing records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method / Ref</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contractor.payments?.length > 0 ? contractor.payments.map((pay: any) => (
                    <tr key={pay.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-600">{new Date(pay.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{pay.method}</span>
                          <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{pay.reference || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">₹{pay.amount.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold italic">No payment records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const SummaryCard: React.FC<{ label: string, value: number, icon: string, color: string, isHighlight?: boolean }> = ({ label, value, icon, color, isHighlight }) => (
  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all hover:shadow-md ${isHighlight ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-white border-slate-100'}`}>
    <span className="text-sm">{icon}</span>
    <p className={`text-[9px] font-black uppercase tracking-widest ${isHighlight ? 'text-rose-400' : 'text-slate-400'}`}>{label}</p>
    <p className={`text-sm font-black ${color}`}>₹{value.toLocaleString()}</p>
  </div>
);

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, fullWidth?: boolean }> = ({ icon, title, children, fullWidth }) => (
  <div className={`space-y-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
      <div className="text-emerald-600">{icon}</div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-3 pt-1">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string, value: string, valueClass?: string }> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-emerald-600 transition-colors">{label}</p>
    <p className={`text-xs font-bold text-slate-800 line-clamp-2 ${valueClass}`}>{value || '—'}</p>
  </div>
);

export default ContractorDetailsModal;
