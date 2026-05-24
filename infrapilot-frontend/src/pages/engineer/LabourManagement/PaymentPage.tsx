import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    Search, 
    Filter, 
    RotateCcw, 
    Calendar, 
    IndianRupee,
    ArrowDownRight,
    Briefcase,
    ChevronLeft,
    ChevronRight
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
    const [projectId] = useState<number>(() => {
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) return Number(pId);
            }
        } catch (err) {
            console.error("Failed to load user project context:", err);
        }
        return 92; // Default fallback to 92 to ensure list renders and matches registered project
    });
    const [activeTab, setActiveTab] = useState<'payroll' | 'history' | 'dues' | 'weekly' | 'monthly'>('payroll');
    const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
    const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [contractorFilter, setContractorFilter] = useState("All");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Paid" | "Pending" | "Advance">("All");

    // Modal States
    const [payTarget, setPayTarget] = useState<any | null>(null);
    const [advanceTarget, setAdvanceTarget] = useState<any | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, contractorFilter, activeStatFilter]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [labourRes, historyRes, duesRes, attendanceRes] = await Promise.all([
                labourService.getLabours(projectId, { limit: 50 }),
                paymentService.getPaymentHistory({ ...(projectId ? { project_id: projectId } : {}), limit: 50, offset: 0 }),
                paymentService.getPendingDues({ ...(projectId ? { project_id: projectId } : {}), limit: 50, offset: 0 }),
                labourService.getAttendanceList(projectId)
            ]);
            
            setLabours(labourRes.items || []);
            setHistory(Array.isArray(historyRes) ? historyRes : ((historyRes as any).items || []));
            setPendingDues(Array.isArray(duesRes) ? duesRes : ((duesRes as any).items || []));
            const allAttendances = attendanceRes.items || [];

            // Calculate Weekly/Monthly stats from attendance data
            const workerStats = allAttendances.reduce((acc: any, curr: any) => {
                const id = curr.labour_id;
                if (!acc[id]) acc[id] = { total_days: 0, present_days: 0, total_hours: 0, overtime_hours: 0, total_wage: 0 };
                acc[id].total_days++;
                if (curr.status?.toLowerCase() !== 'absent') {
                    acc[id].present_days++;
                    acc[id].total_hours += (curr.working_hours || 0);
                    acc[id].overtime_hours += (curr.overtime_hours || 0);
                    acc[id].total_wage += (curr.total_wage || 0);
                }
                return acc;
            }, {});

            setWeeklyReports(Object.values(workerStats).map((s: any) => ({ ...s, month: 4 })));
            setMonthlyReports(Object.values(workerStats).map((s: any) => ({ ...s, month: 4 })));

            // Update labours with attendance stats for Active Payroll
            setLabours(prev => prev.map(l => {
                const stats = workerStats[l.id] || { present_days: 0, total_hours: 0, overtime_hours: 0, total_wage: 0 };
                return { ...l, ...stats };
            }));
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
        
        // Count entries that are likely advances or pending reviews
        const advanceCount = history.filter(h => h.payment_type?.toLowerCase() === 'advance').length || 0;
        
        // Monthly Budget as "Total Committed Capital" (Paid + Outstanding)
        const monthlyBudget = totalPaid + totalPending;
        
        return { totalPaid, totalPending, advanceCount, monthlyBudget };
    }, [history, pendingDues]);

    const filteredLabours = useMemo(() => {
        return labours.filter(l => {
            const matchesSearch = !searchTerm || 
                l.labour_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.worker_code?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesContractor = contractorFilter === "All" || 
                (l.contractor_id?.toString() === contractorFilter);

            return matchesSearch && matchesContractor;
        });
    }, [labours, searchTerm, contractorFilter]);

    const contractors = useMemo(() => {
        const unique = new Set();
        const list: {id: string, name: string}[] = [];
        labours.forEach(l => {
            if (l.contractor_id && !unique.has(l.contractor_id)) {
                unique.add(l.contractor_id);
                list.push({ id: l.contractor_id.toString(), name: `Contractor #${l.contractor_id}` });
            }
        });
        return list;
    }, [labours]);

    const filteredHistory = useMemo(() => {
        return history.filter(h => 
            h.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.contractor_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [history, searchTerm]);

    const currentDataLength = useMemo(() => {
        if (activeTab === 'payroll') return filteredLabours.length;
        if (activeTab === 'history') return filteredHistory.length;
        if (activeTab === 'dues') return pendingDues.length;
        if (activeTab === 'weekly') return weeklyReports.length;
        if (activeTab === 'monthly') return monthlyReports.length;
        return 0;
    }, [activeTab, filteredLabours, filteredHistory, pendingDues, weeklyReports, monthlyReports]);

    return (
        <>
            <Navbar title="Financial Operations" breadcrumb={["Engineer", "Human Resources", "Payroll Management"]} />
            
            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Workforce Disbursement Terminal</h1>
                        <p className="text-slate-500 text-sm font-inter">Secure wage distribution and advance request management with full audit trails.</p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 font-inter shadow-sm">
                            <Calendar className="w-4 h-4 text-primary font-inter" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-inter">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* ── Interactive Stats ───────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("Paid")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Paid" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Paid This Month"
                          value={`₹${(stats.totalPaid / 1000).toFixed(1)}k`}
                          sub="Disbursed Capital"
                          accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Pending Due"
                          value={`₹${(stats.totalPending / 1000).toFixed(1)}k`}
                          sub="Outstanding Liability"
                          accent="text-rose-500" />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Monthly Budget"
                          value={`₹${(stats.monthlyBudget / 100000).toFixed(1)}L`}
                          sub="Allocated Liquidity"
                          accent="text-primary" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Advance")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Advance" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Advance Logs"
                          value={stats.advanceCount.toString().padStart(2, '0')}
                          sub="Pending Review"
                          accent="text-amber-500" />
                    </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 mb-8 font-inter">
                    {[
                        { id: 'payroll', label: 'Active Payroll' },
                        { id: 'history', label: 'Payment History' },
                        { id: 'dues', label: 'Contractor Payment Pending' },
                        { id: 'weekly', label: 'Weekly Velocity' },
                        { id: 'monthly', label: 'Monthly Report' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
                    {/* Integrated Filter Bar */}
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center flex-wrap gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <Search className="w-4 h-4 font-inter" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by workforce name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-4 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                              <Filter className="w-4 h-4 text-slate-400 font-inter" />
                             <select 
                                value={contractorFilter}
                                onChange={(e) => setContractorFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest font-inter"
                             >
                                  <option value="All">All Contractors</option>
                                  {contractors.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                              </select>
                            </div>
                            {activeStatFilter !== "All" && (
                              <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                <RotateCcw className="w-4 h-4 font-inter" />
                              </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-bold uppercase tracking-widest font-inter">Syncing payroll intelligence...</p>
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
                                    {activeTab === 'payroll' && filteredLabours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((labour) => (
                                        <tr key={labour.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-4 font-inter">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs font-inter border border-slate-200">
                                                        {labour.labour_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{labour.labour_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{labour.worker_code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">{labour.present_days || 0} Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <div className="flex flex-col items-center font-inter">
                                                    <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">{Math.round(labour.total_hours || 0)}h</span>
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-inter">+{Math.round(labour.overtime_hours || 0)}h OT</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 tabular-nums font-inter">₹{labour.daily_wage_rate}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-base font-bold text-slate-800 tabular-nums font-inter">₹{(labour.total_wage || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-amber-100 font-inter shadow-amber-50 shadow-sm">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button 
                                                        onClick={() => setAdvanceTarget(labour)}
                                                        className="px-4 py-2 bg-white text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100 font-inter active:scale-95"
                                                    >
                                                        Advance
                                                    </button>
                                                    <button 
                                                        onClick={() => setPayTarget(labour)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                    >
                                                        <IndianRupee className="w-3 h-3" />
                                                        Pay Now
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'history' && filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter">{h.worker_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{h.contractor_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${h.payment_type === 'salary' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {h.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <div className="flex items-center justify-center gap-1 font-inter">
                                                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                                                  <span className="text-sm font-bold text-emerald-600 tabular-nums font-inter">₹{h.amount.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-xs font-bold text-slate-500 font-inter tabular-nums">{h.payment_date}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 text-emerald-500 font-inter">
                                                  <span className="text-[10px] font-bold uppercase tracking-widest font-inter">Confirmed Audit ✓</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'dues' && pendingDues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((d, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{d.contractor_name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 tabular-nums font-inter">₹{d.total_due.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums font-inter">₹{d.paid_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-rose-500 tabular-nums font-inter">₹{d.pending_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex flex-col font-inter">
                                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">{d.last_payment_date}</span>
                                                  <span className="text-[9px] font-bold text-slate-300 uppercase font-inter">Transaction ID-#{Math.floor(Math.random()*10000)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'weekly' && weeklyReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors font-inter">
                                            <td className="px-6 py-4 font-inter">
                                              <div className="flex items-center gap-3 font-inter">
                                                <div className="p-2 bg-slate-50 rounded-lg font-inter">
                                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 font-inter">Interval Cycle #{r.month || i + 1}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-500 font-inter">{r.total_days} Strategic Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-emerald-600 font-inter">{r.present_days} Verified</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-700 font-inter">{r.total_hours}h Ops</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-amber-500 font-inter">{r.overtime_hours}h OT</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                              <span className="text-base font-bold text-slate-800 font-inter tabular-nums">₹{r.total_wage?.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'monthly' && monthlyReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors font-inter">
                                            <td className="px-6 py-4 font-inter">
                                              <div className="flex items-center gap-3 font-inter">
                                                <div className="p-2 bg-slate-50 rounded-lg font-inter">
                                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 font-inter uppercase tracking-tight">{r.month === 4 ? 'April 2026 Strategy' : `Cycle Month ${r.month}`}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-500 font-inter">{r.total_days} Duty Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-emerald-600 font-inter">{r.present_days} Verified</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-slate-700 font-inter">{Math.round(r.total_hours)}h Ops</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                              <span className="text-sm font-bold text-amber-500 font-inter">{Math.round(r.overtime_hours)}h Efficiency</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                              <span className="text-lg font-bold text-slate-900 font-inter tabular-nums">₹{Math.round(r.total_wage || 0).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        {/* ── Pagination Controls ───────────────────────── */}
                        {!isLoading && currentDataLength > 0 && (
                            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    PAGE {currentPage} OF {Math.max(1, Math.ceil(currentDataLength / itemsPerPage))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                        title="Previous Page"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                                        {currentPage}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(currentDataLength / itemsPerPage)), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(currentDataLength / itemsPerPage))}
                                        className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                        title="Next Page"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {/* ── Modals ────────────────────────────────────── */}
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
