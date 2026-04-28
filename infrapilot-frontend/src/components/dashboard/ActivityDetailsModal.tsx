import React from 'react';
import Modal from '../common/Modal';

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any | null;
}

const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({ isOpen, onClose, activity }) => {
  if (!activity) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Activity Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden shrink-0 text-white">
               <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                {activity.name.substring(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{activity.name}</h3>
                <span className={`px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  activity.status === 'Completed' ? 'text-emerald-300' : 'text-slate-200'
                }`}>
                  {activity.status}
                </span>
              </div>
              <p className="text-white font-bold flex items-center justify-center md:justify-start gap-2">
                Project: {activity.project}
              </p>
              <div className="text-white/70 text-sm font-medium">Type: <span className="text-white font-bold">{activity.type}</span></div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          
          {/* Activity Information */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} title="Activity Information">
            <InfoItem label="Activity Name" value={activity.name} />
            <InfoItem label="Category/Type" value={activity.type} />
            <InfoItem label="Project Name" value={activity.project} />
          </Section>

          {/* Execution Status */}
          <Section icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} title="Execution Status">
            <InfoItem label="Current Status" value={activity.status} valueClass={
              activity.status === 'Completed' ? 'text-emerald-600' : 
              activity.status === 'In Progress' ? 'text-primary' : 'text-slate-500'
            } />
            <InfoItem label="Last Updated" value="Just now" />
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
    <p className={`text-sm font-bold text-slate-800 ${valueClass}`}>{value || '—'}</p>
  </div>
);

export default ActivityDetailsModal;
