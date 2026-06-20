import React from 'react';
import Modal from '../common/Modal';
import type { User } from '../../types/user';
import { getFullImageUrl } from '../../utils/imageUtils';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

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
      title="User Profile"
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
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-3xl shadow-2xl overflow-hidden shrink-0 transition-transform group-hover:scale-105 duration-500">
                {user.profile_image ? (
                  <img src={getFullImageUrl(user.profile_image)} alt={user.full_name || "Unknown"} className="w-full h-full object-cover" />
                ) : (
                  <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                    {(user.full_name || "Unknown").split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-primary flex items-center justify-center ${user.is_active ? 'bg-emerald-500' : 'bg-slate-500 shadow-inner'}`}>
                <div className="w-2 h-2 rounded-full bg-white opacity-40 animate-pulse" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{user.full_name}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">
                  {user.role}
                </span>
              </div>
              <p className="text-white/80 font-medium flex items-center justify-center md:justify-start gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {user.email}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Joined</span>
                  <span className="text-xs font-bold">{user.joining_date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">

          {/* Professional Information */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} title="Professional Info">
            <InfoItem label="Designation" value={user.designation} />
            <InfoItem label="Access Level" value={user.role} />
            <InfoItem label="Status" value={user.is_active ? 'Authorized' : 'Restricted'} valueClass={user.is_active ? 'text-emerald-600' : 'text-rose-500'} />
          </Section>

          {/* Contact Details */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} title="Contact Details">
            <InfoItem label="Mobile" value={user.mobile_number} />
            <InfoItem label="Location" value={user.address} />
          </Section>

          {/* Identity Verification */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} title="Identity Verification" fullWidth>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <InfoItem label="Permanent Account Number (PAN)" value={user.pan_number || 'Not Provided'} valueClass="font-mono text-xs" />
              <InfoItem label="Identity Number (UID)" value={user.aadhaar_number || 'Not Provided'} valueClass="font-mono text-xs tracking-widest" />
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
      <div className="text-primary">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4 pt-1">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string, value: string, valueClass?: string }> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">{label}</p>
    <p className={`text-sm font-bold text-slate-700 ${valueClass}`}>{value || '—'}</p>
  </div>
);

export default UserDetailsModal;
