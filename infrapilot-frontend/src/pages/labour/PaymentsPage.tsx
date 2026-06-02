import React from 'react';
import {
    Wallet,
    TrendingUp,
    ArrowDownLeft,
    Calendar,
    ChevronRight,
    Search,
    Download
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import PaymentTracker from '../../components/labour/PaymentTracker';
import toast from 'react-hot-toast';

const PaymentsPage: React.FC = () => {
    const paymentHistory = [
        { id: 'PAY-892', date: '2026-05-25', amount: 4500, status: 'Credited', method: 'Bank Transfer', site: 'Urban Heights' },
        { id: 'PAY-881', date: '2026-05-18', amount: 3800, status: 'Credited', method: 'Cash', site: 'Urban Heights' },
        { id: 'ADV-012', date: '2026-05-15', amount: 1000, status: 'Advance', method: 'Cash', site: 'Urban Heights' },
        { id: 'PAY-865', date: '2026-05-11', amount: 4200, status: 'Credited', method: 'Bank Transfer', site: 'Urban Heights' },
    ];

    const stats = [
        { label: 'Total Earned', value: '₹ 24,500', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Pending Payment', value: '₹ 3,200', icon: ArrowDownLeft, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Settled Days', value: '28 Days', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];

    return (
        <>
            <Navbar
                title="Payments & Earnings"
                breadcrumb={['InfraPilot', 'Labour', 'Payments']}
            />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Overview</h1>
                        <p className="text-slate-500 text-sm">Track your wages, advances and payment history</p>
                    </div>
                    <button
                        onClick={() => toast.success("Downloading payment slip...")}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm">Download Last Slip</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{stat.label}</span>
                                <span className="text-xl font-black text-slate-800">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Tracker */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Summary Tracker</h2>
                        <PaymentTracker />
                    </div>

                    {/* Right: Detailed History */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Detailed History</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID..."
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-50">
                                {paymentHistory.map((pay, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pay.status === 'Advance' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-800">{pay.id}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${pay.status === 'Advance' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {pay.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar className="w-3 h-3 text-slate-300" />
                                                    <span>{pay.date}</span>
                                                    <span>·</span>
                                                    <span>{pay.site}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <span className="text-base font-black text-slate-800 block">₹ {pay.amount.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{pay.method}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Load More History</button>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default PaymentsPage;
