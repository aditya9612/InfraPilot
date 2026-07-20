import { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, ChevronRight, CheckCircle2, FileBarChart, CreditCard, BookOpen, X } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';

const SIDEBAR_TABS = [
  'RA Bills',
  'Payments',
  'Journals'
];

const MOCK_DATA: Record<string, any[]> = {
  'RA Bills': [
    { id: 6, type: 'RA Bill', ref: 'RA-005', vendor: 'BuildTech Pvt Ltd', amount: '₹11,75,000', project: 'Metro', date: '25/05/26', icon: <FileBarChart className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50 border-orange-100' },
  ],
  'Payments': [
    { id: 7, type: 'Payment', ref: 'PAY-REQ-01', vendor: 'Aditya Equipment', amount: '₹5,00,000', project: 'Metro', date: '28/05/26', icon: <CreditCard className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
  ],
  'Journals': [
    { id: 8, type: 'Journal', ref: 'ADJ-001', vendor: 'Depreciation Entry', amount: '₹6,50,000', project: 'Corporate', date: '31/05/26', icon: <BookOpen className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50 border-purple-100' },
  ],
};

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState('RA Bills');
  const [search, setSearch] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

  const approvals = MOCK_DATA[activeTab] || [];
  const filteredApprovals = approvals.filter(a => {
    if (search && !a.ref.toLowerCase().includes(search.toLowerCase()) && !a.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (actionName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    alert(`${actionName} action triggered successfully!`);
    setSelectedApproval(null);
  };

  return (
    <>
      <Navbar title="Approval Center" breadcrumb={['InfraPilot', 'Accountant', 'Approval Center']} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        
        {/* Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-6 md:mb-8 border border-slate-200/50 flex-wrap">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); setSelectedApproval(null); }}
              className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === tab ? 'bg-white text-primary shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {(MOCK_DATA[tab]?.length > 0) && (
                <span className={`${activeTab === tab ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-700'} text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors`}>
                  {MOCK_DATA[tab].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-6 relative">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pending {activeTab}</h1>
              <p className="text-slate-500 text-sm mt-1">Review and manage pending {activeTab.toLowerCase()} requiring your approval.</p>
            </div>
            {filteredApprovals.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => handleAction(`Approve All ${activeTab}`)} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
                  <CheckCircle className="w-4 h-4" /> Approve All
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter flex flex-col flex-1 min-h-[400px]">
            <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white font-inter">
              <div className="relative flex-1 max-w-md font-inter">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                />
              </div>
              <button onClick={() => handleAction('Filter')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"><Filter className="w-4 h-4" /> Filter</button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {filteredApprovals.length > 0 ? (
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                  {filteredApprovals.map(approval => (
                    <div key={approval.id} onClick={() => setSelectedApproval(approval)} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${approval.bg}`}>
                          {approval.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                            {approval.vendor} <span className="text-slate-400 text-xs font-semibold">({approval.ref})</span>
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-1.5">Project: {approval.project} • Date: {approval.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Amount</p>
                          <p className="text-sm font-black text-rose-600">{approval.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => handleAction(`Approve ${approval.ref}`, e)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"><CheckCircle2 className="w-4 h-4" /> Approve</button>
                          <button onClick={(e) => handleAction(`Reject ${approval.ref}`, e)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"><XCircle className="w-4 h-4" /> Reject</button>
                          <button className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg ml-2 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 min-h-[300px]">
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500 opacity-20" />
                  <p className="font-bold text-lg text-slate-600">All Caught Up!</p>
                  <p className="text-sm mt-1 font-semibold">No pending approvals for {activeTab}.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* DETAILS DRAWER */}
        {selectedApproval && (
          <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col transform transition-transform duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Approval Details</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">{selectedApproval.ref}</p>
              </div>
              <button onClick={() => setSelectedApproval(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Type</p><p className="text-sm font-bold text-slate-800">{selectedApproval.type}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Vendor / Party</p><p className="text-sm font-bold text-slate-800">{selectedApproval.vendor}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Project</p><p className="text-sm font-bold text-slate-800">{selectedApproval.project}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Date</p><p className="text-sm font-bold text-slate-800">{selectedApproval.date}</p></div>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</p>
                  <p className="text-lg font-black text-rose-600">{selectedApproval.amount}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button onClick={() => handleAction(`Reject ${selectedApproval.ref}`)} className="px-4 py-2.5 bg-white border border-slate-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors flex-1 text-xs font-bold shadow-sm">Reject</button>
              <button onClick={() => handleAction(`Approve ${selectedApproval.ref}`)} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex-1 text-xs font-bold shadow-sm">Approve</button>
            </div>
          </div>
        )}

        {/* Background Overlay */}
        {selectedApproval && (
          <div className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm" onClick={() => setSelectedApproval(null)} />
        )}

      </PageTransition>
    </>
  );
}
