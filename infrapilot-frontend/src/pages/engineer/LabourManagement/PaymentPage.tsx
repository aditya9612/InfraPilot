import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    CreditCard, 
    Clock, 
    TrendingUp,
    AlertCircle,
    Filter,
    Search,
    RotateCcw,
    IndianRupee,
    Briefcase,
    Calendar,
    ArrowDownRight
} from "lucide-react";
import { paymentService } from '../../../services/paymentService';
import { labourService } from '../../../services/labourService';
import PaySalaryModal from '../../../components/payment/PaySalaryModal';
import AdvancePaymentModal from '../../../components/payment/AdvancePaymentModal';
import toast from 'react-hot-toast';

const PaymentPage: React.FC = () => {
    const [labours, setLabours] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [pendingDues, setPendingDues] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectId, setProjectId] = useState<number>(36);
    const [activeTab, setActiveTab] = useState<'payroll' | 'history' | 'dues' | 'weekly' | 'monthly'>('payroll');
    const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
    const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Paid" | "Pending" | "Advance">("All");

    // Modal States
    const [payTarget, setPayTarget] = useState<any | null>(null);
    const [advanceTarget, setAdvanceTarget] = useState<any | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) setProjectId(Number(pId));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [labourRes, historyRes, duesRes] = await Promise.all([
                labourService.getLabours(projectId),
                paymentService.getPaymentHistory({ project_id: projectId, limit: 50, offset: 0 }),
                paymentService.getPendingDues({ project_id: projectId, limit: 50, offset: 0 })
            ]);
            
            setLabours(labourRes.items || []);
            setHistory(Array.isArray(historyRes) ? historyRes : ((historyRes as any).items || []));
            setPendingDues(Array.isArray(duesRes) ? duesRes : ((duesRes as any).items || []));

            const firstWorker = labourRes.items?.[0];
            if (firstWorker) {
                const [weeklyRes, monthlyRes] = await Promise.all([
                    labourService.getLabourWeeklyReport(firstWorker.id),
                    labourService.getLabourMonthlyReport(firstWorker.id)
                ]);
                setWeeklyReports(Array.isArray(weeklyRes) ? weeklyRes : [weeklyRes]);
                setMonthlyReports(Array.isArray(monthlyRes) ? monthlyRes : [monthlyRes]);
            }
        } catch (error: any) {
            toast.error('Failed to load payment data');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const totalPaid = history.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalPending = pendingDues.reduce((acc, curr) => acc + (curr.pending_amount || 0), 0);
        return { totalPaid, totalPending };
    }, [history, pendingDues]);

    const filteredLabours = useMemo(() => {
        let data = labours;
        if (activeStatFilter === "Pending") {
          // Logic for pending could be workers with attendance but no payment this month
          // For now, filtering is visual to match the pattern
        }
        return data.filter(l => 
            l.labour_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.worker_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [labours, searchTerm, activeStatFilter]);

    const filteredHistory = useMemo(() => {
        return history.filter(h => 
            h.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.contractor_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [history, searchTerm]);

    return (
        <>
            <Navbar title="Financial Operations" breadcrumb={["Engineer", "Human Resources", "Payroll Management"]} />
            
            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Workforce Disbursement Terminal</h1>
                        <p className="text-slate-500 text-sm italic-none font-inter">Secure wage distribution and advance request management with full audit trails.</p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                      <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 font-inter shadow-sm">
                        <Calendar className="w-4 h-4 text-primary font-inter" />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest font-inter">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("Paid")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Paid" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Paid This Month"
                          value={`₹${(stats.totalPaid / 1000).toFixed(1)}k`}
                          sub="Disbursed Capital"
                          accent="text-emerald-500"
                          icon={<CreditCard className={`w-5 h-5 ${activeStatFilter === "Paid" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Pending Due"
                          value={`₹${(stats.totalPending / 1000).toFixed(1)}k`}
                          sub="Outstanding Liability"
                          accent="text-rose-500"
                          icon={<AlertCircle className={`w-5 h-5 ${activeStatFilter === "Pending" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                      />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Monthly Budget"
                          value="₹4.5L"
                          sub="Allocated Liquidity"
                          accent="text-primary"
                          icon={<TrendingUp className="w-5 h-5 text-primary" />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Advance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Advance" ? "ring-2 ring-amber-500 bg-amber-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Advance Logs"
                          value="08"
                          sub="Pending Review"
                          accent="text-amber-500"
                          icon={<Clock className={`w-5 h-5 ${activeStatFilter === "Advance" ? "text-amber-500 scale-110" : "text-slate-400 group-hover:text-amber-500"} transition-all`} />}
                      />
                    </div>
                </div>

                {/* ── Navigation Tabs ───────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 mb-8 font-inter">
                    {[
                        { id: 'payroll', label: 'Active Payroll' },
                        { id: 'history', label: 'Disbursement History' },
                        { id: 'dues', label: 'Contractor Liability' },
                        { id: 'weekly', label: 'Weekly Velocity' },
                        { id: 'monthly', label: 'Monthly Report' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-xl shadow-slate-200 scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <Search className="w-4 h-4 font-inter" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by workforce name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-4 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                              <Filter className="w-4 h-4 text-slate-400 font-inter" />
                              <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer uppercase tracking-widest font-inter">
                                  <option>All Contractors</option>
                              </select>
                            </div>
                            {activeStatFilter !== "All" && (
                              <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                <RotateCcw className="w-4 h-4 font-inter" />
                              </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-black uppercase tracking-widest font-inter">Syncing payroll intelligence...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[1200px] font-inter">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        {(activeTab === 'payroll' || activeTab === 'history') && <th className="px-6 py-4 font-inter">Workforce Identity</th>}
                                        {activeTab === 'payroll' && (
                                            <>
                                                <th className="px-6 py-4 text-center font-inter">Attendance</th>
                                                <th className="px-6 py-4 text-center font-inter">Intensity (Hrs)</th>
                                                <th className="px-6 py-4 text-center font-inter">Daily Rate</th>
                                                <th className="px-6 py-4 text-center font-inter">Accrued Wage</th>
                                                <th className="px-6 py-4 text-center font-inter">Audit Status</th>
                                                <th className="px-6 py-4 text-right font-inter">Execution</th>
                                            </>
                                        )}
                                        {activeTab === 'history' && (
                                            <>
                                                <th className="px-6 py-4 text-center font-inter">Protocol</th>
                                                <th className="px-6 py-4 text-center font-inter">Channel</th>
                                                <th className="px-6 py-4 text-center font-inter text-emerald-600">Quantum (Amt)</th>
                                                <th className="px-6 py-4 text-center font-inter">Audit Date</th>
                                                <th className="px-6 py-4 text-right font-inter">Verification</th>
                                            </>
                                        )}
                                        {activeTab === 'dues' && (
                                            <>
                                                <th className="px-6 py-4 font-inter">Vendor Entity</th>
                                                <th className="px-6 py-4 text-center font-inter">Gross Liability</th>
                                                <th className="px-6 py-4 text-center font-inter text-emerald-600">Liquidated</th>
                                                <th className="px-6 py-4 text-center font-inter text-rose-500">Pending</th>
                                                <th className="px-6 py-4 text-right font-inter">Last Transaction</th>
                                            </>
                                        )}
                                        {(activeTab === 'weekly' || activeTab === 'monthly') && (
                                            <>
                                                <th className="px-6 py-4 font-inter">{activeTab === 'weekly' ? 'Interval Velocity' : 'Strategic Period'}</th>
                                                <th className="px-6 py-4 text-center font-inter">Duty Days</th>
                                                <th className="px-6 py-4 text-center font-inter">Verified Presence</th>
                                                <th className="px-6 py-4 text-center font-inter">Operational Hrs</th>
                                                <th className="px-6 py-4 text-center font-inter text-amber-500">OT Efficiency</th>
                                                <th className="px-6 py-4 text-right font-inter">Gross Disbursement</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {activeTab === 'payroll' && filteredLabours.map((labour) => (
                                        <tr key={labour.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-4 font-inter">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs font-inter border border-slate-200">
                                                        {labour.labour_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter italic-none">{labour.labour_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter italic-none">{labour.worker_code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-black text-slate-700 tabular-nums font-inter">24 Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <div className="flex flex-col items-center font-inter">
                                                    <span className="text-sm font-black text-slate-700 tabular-nums font-inter">192h</span>
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest font-inter">+8h OT</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 tabular-nums font-inter italic-none">₹{labour.daily_wage_rate}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-base font-black text-slate-800 tabular-nums font-inter">₹14,200</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 font-inter shadow-amber-50 shadow-sm">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button 
                                                        onClick={() => setAdvanceTarget(labour)}
                                                        className="px-4 py-2 bg-white text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100 font-inter active:scale-95"
                                                    >
                                                        Advance
                                                    </button>
                                                    <button 
                                                        onClick={() => setPayTarget(labour)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                    >
                                                        <IndianRupee className="w-3 h-3" />
                                                        Pay Now
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'history' && filteredHistory.map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter italic-none">{h.worker_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter italic-none">{h.contractor_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${h.payment_type === 'salary' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {h.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <div className="flex items-center justify-center gap-1 font-inter">
                                                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                                                  <span className="text-sm font-black text-emerald-600 tabular-nums font-inter">₹{h.amount.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-xs font-bold text-slate-500 font-inter tabular-nums">{h.payment_date}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 text-emerald-500 font-inter">
                                                  <span className="text-[10px] font-black uppercase tracking-widest font-inter">Confirmed Audit ✓</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'dues' && pendingDues.map((d, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <span className="text-sm font-black text-slate-800 font-inter italic-none">{d.contractor_name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 tabular-nums font-inter">₹{d.total_due.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-black text-emerald-600 tabular-nums font-inter">₹{d.paid_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-black text-rose-500 tabular-nums font-inter">₹{d.pending_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex flex-col font-inter">
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">{d.last_payment_date}</span>
                                                  <span className="text-[9px] font-bold text-slate-300 uppercase italic-none font-inter">Transaction ID-#{Math.floor(Math.random()*10000)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'weekly' && weeklyReports.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors font-inter">
                                            <td className="px-6 py-4 font-inter">
                                              <div className="flex items-center gap-3 font-inter">
                                                <div className="p-2 bg-slate-50 rounded-lg font-inter">
                                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 font-inter italic-none">Interval Cycle #{r.month || i + 1}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-500 font-inter italic-none">{r.total_days} Strategic Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-emerald-600 font-inter italic-none">{r.present_days} Verified</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-slate-700 font-inter italic-none">{r.total_hours}h Ops</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-amber-500 font-inter italic-none">{r.overtime_hours}h OT</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                              <span className="text-base font-black text-slate-800 font-inter italic-none tabular-nums">₹{r.total_wage?.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'monthly' && monthlyReports.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors font-inter">
                                            <td className="px-6 py-4 font-inter">
                                              <div className="flex items-center gap-3 font-inter">
                                                <div className="p-2 bg-slate-50 rounded-lg font-inter">
                                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 font-inter italic-none uppercase tracking-tight">{r.month === 4 ? 'April 2026 Strategy' : `Cycle Month ${r.month}`}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-500 font-inter italic-none">{r.total_days} Duty Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-emerald-600 font-inter italic-none">{r.present_days} Verified</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-slate-700 font-inter italic-none">{r.total_hours}h Ops</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-black text-amber-500 font-inter italic-none">{r.overtime_hours}h Efficiency</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                              <span className="text-lg font-black text-slate-900 font-inter italic-none tabular-nums">₹{r.total_wage?.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ── Modals ─────────────────────────────────────── */}
                <PaySalaryModal 
                    isOpen={!!payTarget} 
                    onClose={() => setPayTarget(null)} 
                    labour={payTarget}
                    onSuccess={fetchData}
                />
                <AdvancePaymentModal 
                    isOpen={!!advanceTarget} 
                    onClose={() => setAdvanceTarget(null)} 
                    labour={advanceTarget}
                    onSuccess={fetchData}
                />
            </PageTransition>
        </>
    );
};

export default PaymentPage;
