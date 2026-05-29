import React from 'react';
import { IndianRupee, Clock, CheckCircle2 } from 'lucide-react';

const PaymentTracker: React.FC = () => {
    const transactions = [
        { id: 'P-101', date: '2026-05-25', amount: 1500, status: 'Paid', color: 'text-green-500', bgColor: 'bg-green-50' },
        { id: 'P-102', date: '2026-05-28', amount: 800, status: 'Pending', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Premium Expected Payment Card - slightly reduced radius to match 2xl feel */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                {/* Subtle Rupee Pattern */}
                <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-1000 transform -rotate-12">
                    <IndianRupee className="w-48 h-48" />
                </div>

                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.25em] mb-4">Next Expected Payment</p>
                <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-bold tracking-tight italic">₹ 800.00</span>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-inner">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Verification
                </div>
            </div>

            {/* Recent Payments Section - matching Admin standard */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Payments</h4>
                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors">View All</button>
                </div>

                <div className="space-y-6">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-transform">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.bgColor}`}>
                                    <IndianRupee className={`w-4 h-4 ${tx.color}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-base font-bold text-slate-800 tracking-tight">₹{tx.amount}</span>
                                        {tx.status === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
                                        {tx.date} <span className="opacity-25 scale-125">•</span> {tx.id}
                                    </p>
                                </div>
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded ${tx.status === 'Paid' ? 'border-green-100 text-green-500' : 'border-orange-100 text-orange-500'}`}>
                                {tx.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentTracker;
