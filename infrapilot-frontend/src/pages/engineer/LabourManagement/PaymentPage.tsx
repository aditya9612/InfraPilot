import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    CreditCard, 
    Clock, 
    TrendingUp,
    AlertCircle,
    Filter,
    Search
} from "lucide-react";
import { paymentService } from '../../../services/paymentService';
import { labourService } from '../../../services/labourService';
import { projectService } from '../../../services/projectService';
import PaySalaryModal from '../../../components/payment/PaySalaryModal';
import AdvancePaymentModal from '../../../components/payment/AdvancePaymentModal';
import toast from 'react-hot-toast';

const PaymentPage: React.FC = () => {
    const [labours, setLabours] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [pendingDues, setPendingDues] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'payroll' | 'history' | 'dues' | 'weekly' | 'monthly'>('payroll');
    const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
    const [monthlyReports, setMonthlyReports] = useState<any[]>([]);

    // Modal States
    const [payTarget, setPayTarget] = useState<any | null>(null);
    const [advanceTarget, setAdvanceTarget] = useState<any | null>(null);

    useEffect(() => {
        const initializeProject = async () => {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                const user = userStr ? JSON.parse(userStr) : {};
                const storedPId = user?.project_id || user?.user?.project_id;
                
                if (storedPId) {
                    console.log("Payments: Using Stored Project ID:", storedPId);
                    setProjectId(Number(storedPId));
                } else {
                    console.log("Payments: Project discovery via server...");
                    const projectsResponse = await projectService.getProjects(1, 0);
                    const projects = Array.isArray(projectsResponse) ? projectsResponse : ((projectsResponse as any).items || []);
                    
                    if (projects && projects.length > 0) {
                        const firstPId = projects[0].project_id || projects[0].id;
                        console.log("Payments: Auto-discovered Project ID:", firstPId);
                        setProjectId(Number(firstPId));
                    } else {
                        console.warn("Payments: No projects found. Defaulting to 1.");
                        setProjectId(1);
                    }
                }
            } catch (err) {
                console.error("Payments: Discovery failed:", err);
                setProjectId(1);
            }
        };
        initializeProject();
    }, []);

    const fetchData = async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            console.log(`Payments: Syncing Vault for Project: ${projectId}`);
            const [labourRes, historyRes, duesRes] = await Promise.all([
                labourService.getLabours(projectId),
                paymentService.getPaymentHistory({ project_id: projectId, limit: 20, offset: 0 }),
                paymentService.getPendingDues({ project_id: projectId, limit: 20, offset: 0 })
            ]);
            console.log("Payroll Roster Sync Success:", labourRes);
            console.log("Payment History Sync Success (200 OK):", historyRes);
            console.log("Pending Dues Sync Success (200 OK):", duesRes);
            
            setLabours(labourRes.items || []);
            setHistory(Array.isArray(historyRes) ? historyRes : ((historyRes as any).items || []));
            setPendingDues(Array.isArray(duesRes) ? duesRes : ((duesRes as any).items || []));

            // Fetch reports for the first worker as a summary if they exist
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
            console.error("Payment Sync Failure:", error.response?.data || error.message);
            toast.error('Failed to load payment data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId, activeTab]);

    const stats = useMemo(() => {
        const totalPaid = history.reduce((acc, curr) => acc + curr.amount, 0);
        const totalPending = pendingDues.reduce((acc, curr) => acc + curr.pending_amount, 0);
        return { totalPaid, totalPending };
    }, [history, pendingDues]);

    return (
        <>
            <Navbar title="Financial Operations" breadcrumb={["Engineer", "Human Resources", "Payroll Management"]} />
            
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Payroll & Disbursements</h1>
                        <p className="text-slate-500 text-sm italic-none">Secure wage distribution and advance request management.</p>
                    </div>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Paid This Month"
                        value={`₹${(stats.totalPaid / 1000).toFixed(1)}k`}
                        sub="Total Disbursed"
                        accent="text-emerald-500"
                        icon={<CreditCard className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Due"
                        value={`₹${(stats.totalPending / 1000).toFixed(1)}k`}
                        sub="Outstanding Dues"
                        accent="text-rose-500"
                        icon={<AlertCircle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Monthly Budget"
                        value="₹2.8L"
                        sub="Allocated Capital"
                        accent="text-primary"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Advance Requests"
                        value="12"
                        sub="Pending Approval"
                        accent="text-amber-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                </div>

                {/* ── Navigation Tabs ───────────────────────────────────────────── */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'payroll', label: 'Active Payroll' },
                        { id: 'history', label: 'Payment History' },
                        { id: 'dues', label: 'Contractor Dues' },
                        { id: 'weekly', label: 'Weekly Summary' },
                        { id: 'monthly', label: 'Monthly Report' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer">
                                <option>All Contractors</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing payroll vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        {(activeTab === 'payroll' || activeTab === 'history') && <th className="px-6 py-4">Worker Details</th>}
                                        {activeTab === 'payroll' && (
                                            <>
                                                <th className="px-6 py-4 text-center">Days Present</th>
                                                <th className="px-6 py-4 text-center">Hours/OT</th>
                                                <th className="px-6 py-4 text-center">Daily Wage</th>
                                                <th className="px-6 py-4 text-center">Net Salary</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Direct Actions</th>
                                            </>
                                        )}
                                        {activeTab === 'history' && (
                                            <>
                                                <th className="px-6 py-4 text-center">Type</th>
                                                <th className="px-6 py-4 text-center">Method</th>
                                                <th className="px-6 py-4 text-center">Amount</th>
                                                <th className="px-6 py-4 text-center">Date</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                            </>
                                        )}
                                        {activeTab === 'dues' && (
                                            <>
                                                <th className="px-6 py-4">Contractor</th>
                                                <th className="px-6 py-4 text-center">Total Due</th>
                                                <th className="px-6 py-4 text-center">Paid</th>
                                                <th className="px-6 py-4 text-center">Pending</th>
                                                <th className="px-6 py-4 text-center">Last Payment</th>
                                            </>
                                        )}
                                        {(activeTab === 'weekly' || activeTab === 'monthly') && (
                                            <>
                                                <th className="px-6 py-4">{activeTab === 'weekly' ? 'Week' : 'Month'}</th>
                                                <th className="px-6 py-4 text-center">Total Days</th>
                                                <th className="px-6 py-4 text-center">Present</th>
                                                <th className="px-6 py-4 text-center">Man Hours</th>
                                                <th className="px-6 py-4 text-center">OT Hours</th>
                                                <th className="px-6 py-4 text-center">Total Wage</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {activeTab === 'payroll' && labours.map((labour) => (
                                        <tr key={labour.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                                        {labour.labour_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{labour.labour_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{labour.worker_code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">24 Days</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-slate-700 tabular-nums">192h</span>
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">+8h OT</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">₹{labour.daily_wage_rate}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums">₹14,200</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setAdvanceTarget(labour)}
                                                        className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                                                    >
                                                        Request Advance
                                                    </button>
                                                    <button 
                                                        onClick={() => setPayTarget(labour)}
                                                        className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                                    >
                                                        Pay Now
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'history' && history.map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums">{h.payment_date}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{h.worker_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{h.contractor_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums">₹{h.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${h.payment_type === 'salary' ? 'bg-emerald-100 text-success' : 'bg-blue-100 text-primary'}`}>
                                                    {h.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h.payment_method}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Confirmed ✓</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'dues' && pendingDues.map((d, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">{d.contractor_name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums">₹{d.total_due.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums">₹{d.paid_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-rose-500 tabular-nums">₹{d.pending_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-bold text-slate-400 tabular-nums">{d.last_payment_date}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'weekly' && weeklyReports.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">Week {r.month || i + 1}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{r.total_days} Days</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600">{r.present_days}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{r.total_hours}h</td>
                                            <td className="px-6 py-4 text-center font-bold text-amber-500">{r.overtime_hours}h</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">₹{r.total_wage}</td>
                                        </tr>
                                    ))}

                                    {activeTab === 'monthly' && monthlyReports.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{r.month === 4 ? 'April 2026' : `Month ${r.month}`}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{r.total_days} Days</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600">{r.present_days}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{r.total_hours}h</td>
                                            <td className="px-6 py-4 text-center font-bold text-amber-500">{r.overtime_hours}h</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">₹{r.total_wage}</td>
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
