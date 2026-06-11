import React from 'react';
import {
    Wallet,
    TrendingUp,
    ArrowDownLeft,
    ChevronRight,
    Search,
    Download,
    CreditCard,
    ArrowUpRight,
    Clock,
    FileText
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';

const PaymentsPage: React.FC = () => {
    const paymentHistory = [
        { id: 'PAY-892', date: '2026-05-25', amount: 4500, status: 'Credited', method: 'Bank Transfer', site: 'Urban Heights', transactionId: 'TXN-992810' },
        { id: 'PAY-881', date: '2026-05-18', amount: 3800, status: 'Credited', method: 'Cash', site: 'Urban Heights', transactionId: 'CSH-0220' },
        { id: 'ADV-012', date: '2026-05-15', amount: 1000, status: 'Advance', method: 'UPI', site: 'Urban Heights', transactionId: 'UPI-44029' },
        { id: 'PAY-865', date: '2026-05-11', amount: 4200, status: 'Credited', method: 'Bank Transfer', site: 'Urban Heights', transactionId: 'TXN-881029' },
    ];

    const stats = [
        { label: 'Total Earnings', value: '₹24,500', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Pending Wages', value: '₹3,200', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Total Settled', value: '₹21,300', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    return (
        <>
            <Navbar
                title="Payments"
                breadcrumb={['InfraPilot', 'Dashboard', 'Payments']}
            />
            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-20">
                {/* ── Summary Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payment Ledger</h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Track your site wages and advances</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:justify-end gap-3">
                        <button
                            onClick={() => toast.success("Generating report...")}
                            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => toast.success("Payment request sent to site engineer!")}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Request Payment
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Main Content ── */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-300" />
                            Recent Transactions
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search by ID or Site..."
                                className="pl-11 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all min-w-[300px]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Site</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paymentHistory.map((pay, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pay.status === 'Advance' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    {pay.status === 'Advance' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{pay.id}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pay.transactionId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-slate-800">{pay.date}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pay.site}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {pay.method}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${pay.status === 'Credited' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-lg font-black text-slate-800">₹{pay.amount.toLocaleString()}</p>
                                            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-slate-50/50 text-center border-t border-slate-50">
                        <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.3em] transition-colors">
                            View Full Transaction History
                        </button>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default PaymentsPage;
