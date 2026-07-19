import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
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
import PaySalaryModal from '../../../components/payment/PaySalaryModal';
import AdvancePaymentModal from '../../../components/payment/AdvancePaymentModal';
import GeneratePayrollModal from '../../../components/payment/GeneratePayrollModal';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/currencyUtils';
import { useProject } from '../../../context/ProjectContext';

const PaymentPage: React.FC = () => {
    const [labours, setLabours] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [pendingDues, setPendingDues] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;
    const [activeTab, setActiveTab] = useState<'payroll' | 'history' | 'dues' | 'weekly'>('payroll');
    const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [contractorFilter, setContractorFilter] = useState("All");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Paid" | "Pending" | "Advance">("All");

    const [stats, setStats] = useState<any>({
        total_payout: 0,
        high_payouts: 0,
        ot_intensive: 0,
        advance_adjusted: 0
    });

    // Modal States
    const [payTarget, setPayTarget] = useState<any | null>(null);
    const [advanceTarget, setAdvanceTarget] = useState<any | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);



    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, contractorFilter, activeStatFilter]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [payrollRes, statsRes] = await Promise.all([
                paymentService.getAggregateReport({ project_id: projectId }),
                paymentService.getFiscalSummary({ project_id: projectId })
            ]);
            setLabours(Array.isArray(payrollRes) ? payrollRes : ((payrollRes as any).items || []));
            if (statsRes) setStats(statsRes);
        } catch (error: any) {
            toast.error('Failed to load active payroll');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);



    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'history') {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    const res = await paymentService.getPaymentHistory({ project_id: projectId });
                    setHistory(Array.isArray(res) ? res : ((res as any).items || []));
                } catch (err) {
                    toast.error('Failed to load payment history');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        } else if (activeTab === 'dues') {
            const fetchDues = async () => {
                setIsLoading(true);
                try {
                    const res = await paymentService.getPendingDues({ project_id: projectId });
                    setPendingDues(Array.isArray(res) ? res : ((res as any).items || []));
                } catch (err) {
                    toast.error('Failed to load contractor liability');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDues();
        } else if (activeTab === 'weekly') {
            const fetchWeekly = async () => {
                setIsLoading(true);
                try {
                    const res = await paymentService.getWeeklyVelocity({ project_id: projectId });
                    setWeeklyReports(Array.isArray(res) ? res : ((res as any).items || []));
                } catch (err) {
                    toast.error('Failed to load weekly velocity');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchWeekly();
        }
    }, [activeTab, projectId]);



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
        const list: { id: string, name: string }[] = [];
        labours.forEach(l => {
            if (l.contractor_id && !unique.has(l.contractor_id)) {
                unique.add(l.contractor_id);
                list.push({ id: l.contractor_id.toString(), name: `Contractor #${l.contractor_id}` });
            }
        });
        return list;
    }, [labours]);

    const filteredHistory = useMemo(() => {
        return history.filter(h => {
            const search = searchTerm.toLowerCase();
            const workerName = h.labour_name || h.worker_name || "";
            return workerName.toLowerCase().includes(search);
        });
    }, [history, searchTerm]);

    const currentDataLength = useMemo(() => {
        if (activeTab === 'payroll') return filteredLabours.length;
        if (activeTab === 'history') return filteredHistory.length;
        if (activeTab === 'dues') return pendingDues.length;
        if (activeTab === 'weekly') return weeklyReports.length;
        return 0;
    }, [activeTab, filteredLabours, filteredHistory, pendingDues, weeklyReports]);

    return (
        <>
            <Navbar title="Financial Operations" breadcrumb={["Engineer", "Human Resources", "Payroll Management"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Workforce Disbursement Terminal</h1>
                        <p className="text-slate-500 text-sm font-inter">Secure wage distribution and advance request management with full audit trails.</p>
                    </div>
                    <div className="flex items-center gap-3 font-inter flex-wrap">
                        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 font-inter shadow-sm">
                            <Calendar className="w-4 h-4 text-primary font-inter" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-inter">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <button
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Generate Payroll
                        </button>
                    </div>
                </div>

                {/* ── Interactive Stats ───────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    {[
                        {
                            title: "Total Payout",
                            value: formatCurrency(stats.total_payout || 0),
                            sub: "Disbursed Capital",
                            accent: "text-emerald-500",
                            status: "Paid",
                        },
                        {
                            title: "High Payouts",
                            value: (stats.high_payouts || 0).toString(),
                            sub: "Alert Count",
                            accent: "text-rose-500",
                            status: "Pending",
                        },
                        {
                            title: "OT Intensive",
                            value: (stats.ot_intensive || 0).toString(),
                            sub: "High OT Workers",
                            accent: "text-primary",
                            status: "Budget",
                        },
                        {
                            title: "Advance Adjusted",
                            value: formatCurrency(stats.advance_adjusted || 0),
                            sub: "Recovered Capital",
                            accent: "text-amber-500",
                            status: "Advance",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status !== "Budget" && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status !== "Budget" ? "cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group" : ""} ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
                        >
                            <p className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 ${s.status !== "Budget" ? "group-hover:text-primary transition-colors" : ""}`}>
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                {s.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 mb-8 font-inter">
                    {[
                        { id: 'payroll', label: 'Active Payroll' },
                        { id: 'history', label: 'Payment History' },
                        { id: 'dues', label: 'Contractor Payment Pending' },
                        { id: 'weekly', label: 'Weekly Velocity' }
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
                                        {activeTab === 'weekly' && (
                                            <>
                                                <th className="px-6 py-4 font-inter">Interval Velocity</th>
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
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{labour.worker_code} {labour.skill_type ? `| ${labour.skill_type}` : ''}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">-</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <div className="flex flex-col items-center font-inter">
                                                    <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">{Math.round(labour.total_working_hours || 0)}h</span>
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-inter">+{Math.round(labour.total_overtime_hours || 0)}h OT</span>
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
                                                    {labour.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => setAdvanceTarget(labour)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 font-inter"
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

                                    {activeTab === 'history' && filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((h) => {
                                        const workerName = h.labour_name || h.worker_name || `Worker #${h.labour_id || 'N/A'}`;

                                        return (
                                            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{workerName}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{h.reference || "N/A"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${h.payment_type?.toLowerCase() === 'salary' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {h.payment_type || 'SALARY'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter bg-slate-50 text-slate-600 border-slate-100`}>
                                                        {h.mode || 'CASH'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-inter">
                                                    <div className="flex items-center justify-center gap-1 font-inter">
                                                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-sm font-bold text-emerald-600 tabular-nums font-inter">₹{h.amount?.toLocaleString() || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-inter">
                                                    <span className="text-xs font-bold text-slate-500 font-inter tabular-nums">{h.created_at ? new Date(h.created_at).toLocaleDateString() : (h.payment_date || '-')}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-inter">
                                                    <div className="flex items-center justify-end gap-2 text-emerald-500 font-inter">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">Confirmed Audit ✓</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {activeTab === 'dues' && pendingDues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((d, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{d.contractor_name || `Contractor #${d.contractor_id}`}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 tabular-nums font-inter">₹{(d.total_wage || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums font-inter">₹{(d.paid_amount || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-rose-500 tabular-nums font-inter">₹{(d.remaining_amount || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">-</span>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase font-inter">-</span>
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
                                                    <span className="text-sm font-bold text-slate-800 font-inter">Interval Cycle #{r.week_number || i + 1}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-500 font-inter">-</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-emerald-600 font-inter">{r.attendance_count || 0} Verified</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-slate-700 font-inter">-</span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-inter">
                                                <span className="text-sm font-bold text-amber-500 font-inter">-</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <span className="text-base font-bold text-slate-800 font-inter tabular-nums">₹{r.total_wage?.toLocaleString() || 0}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ── Pagination Controls ───────────────────────── */}
                        {!isLoading && currentDataLength > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                                {/* Left: Items per page */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Center: Showing info */}
                                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, currentDataLength)} of {currentDataLength} records
                                </div>

                                {/* Right: Pagination */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {(() => {
                                        const totalItems = currentDataLength;
                                        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                        const pages = [];
                                        if (totalPages <= 5) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                pages.push(1, 2, 3, 4, '...', totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                            }
                                        }

                                        return pages.map((page, index) => {
                                            if (page === '...') {
                                                return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                            }
                                            const pageNum = page as number;
                                            const isActive = currentPage === pageNum;
                                            return (
                                                <button
                                                    key={`page-${pageNum}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        });
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(currentDataLength / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(currentDataLength / itemsPerPage)) || currentDataLength === 0}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
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
                <GeneratePayrollModal
                    isOpen={isGenerateModalOpen}
                    onClose={() => setIsGenerateModalOpen(false)}
                    onSuccess={fetchData}
                />
            </PageTransition>
        </>
    );
};

export default PaymentPage;
