import React, { useState, useMemo } from 'react';
import {
    Wallet,
    TrendingUp,
    CreditCard,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileMinus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';

const PaymentsPage: React.FC = () => {
    const { user } = useAuth();
    const [filterPeriod, setFilterPeriod] = useState("Daily Analysis");
    const [startDate, setStartDate] = useState("2026-06-01");
    const [endDate, setEndDate] = useState("2026-06-30");
    const [recordsPerPage, setRecordsPerPage] = useState(20);

    const userName = user?.name || 'Gopal Yadav';

    const basePayrollData = [
        { id: 1, date: '2026-06-18', name: userName, skill: 'Mason', dailyWage: 800, otHours: 2, status: 'PAID', remarks: 'Standard Payout' },
        { id: 2, date: '2026-06-17', name: userName, skill: 'Mason', dailyWage: 800, otHours: 4, status: 'PENDING', remarks: 'Bonus Pending' },
        { id: 3, date: '2026-06-16', name: userName, skill: 'Mason', dailyWage: 800, otHours: 2, status: 'PAID', remarks: 'Full Month Payout' },
        { id: 4, date: '2026-06-15', name: userName, skill: 'Mason', dailyWage: 800, otHours: 0, status: 'PENDING', remarks: 'Bank Verification' },
        { id: 5, date: '2026-06-14', name: userName, skill: 'Mason', dailyWage: 800, otHours: 0, status: 'REJECTED', remarks: 'Incorrect Bank Info' },
        { id: 6, date: '2026-06-07', name: userName, skill: 'Mason', dailyWage: 800, otHours: 1, status: 'PAID', remarks: 'Weekly Settlement' },
    ];

    const displayData = useMemo(() => {
        if (filterPeriod === "Weekly Summary") {
            return [
                { period: 'Week 25 (Jun 15 - Jun 21)', skill: 'Mason', dailyWage: 800, otHours: 8, totalEarned: 3800, status: 'PAID', remarks: 'Weekly Aggregate' },
                { period: 'Week 24 (Jun 08 - Jun 14)', skill: 'Mason', dailyWage: 800, otHours: 0, totalEarned: 800, status: 'PAID', remarks: 'Weekly Aggregate' },
            ];
        } else if (filterPeriod === "Monthly Report" || filterPeriod === "3 Months" || filterPeriod === "6 Months" || filterPeriod === "1 Year") {
            const label = filterPeriod === "Monthly Report" ? 'June 2026' : filterPeriod;
            return [
                { period: label, skill: 'Mason', dailyWage: 800, otHours: 45, totalEarned: 24500, status: 'PAID', remarks: `${filterPeriod} Summary` },
                { period: 'Previous Period', skill: 'Mason', dailyWage: 800, otHours: 32, totalEarned: 21000, status: 'PAID', remarks: 'Historical Data' },
            ];
        } else {
            // Daily Analysis
            return basePayrollData.filter(d => {
                if (startDate && d.date < startDate) return false;
                if (endDate && d.date > endDate) return false;
                return true;
            }).map(d => ({
                period: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                ...d
            }));
        }
    }, [filterPeriod, startDate, endDate, basePayrollData]);

    const getStatusStyles = (status: string) => {
        switch(status.toUpperCase()) {
            case 'PAID':
            case 'ACTIVE':
                return 'bg-emerald-50 text-emerald-600';
            case 'PENDING':
                return 'bg-amber-50 text-amber-600';
            case 'REJECTED':
                return 'bg-rose-50 text-rose-600';
            default:
                return 'bg-slate-50 text-slate-500';
        }
    };

    const stats = [
        { label: 'TOTAL PAYOUT', value: '₹0.00', sub: 'All Wage Items', icon: Wallet, color: 'text-indigo-600', borderColor: 'border-indigo-200' },
        { label: 'HIGH PAYOUTS', value: '0', sub: 'Above ₹5k Threshold', icon: TrendingUp, color: 'text-emerald-500', borderColor: 'border-slate-100' },
        { label: 'OT INTENSIVE', value: '0', sub: 'Shifts with Overtime', icon: Clock, color: 'text-amber-500', borderColor: 'border-slate-100' },
        { label: 'ADVANCE ADJUSTED', value: '₹0.00', sub: 'Recovery Target', icon: CreditCard, color: 'text-rose-500', borderColor: 'border-slate-100' },
    ];

    return (
        <>
            <Navbar
                title="Financial Intelligence"
                breadcrumb={['Labour', 'Human Resources', 'Payroll Reports']}
            />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Fiscal Payroll Analysis</h1>
                        <p className="text-sm font-bold text-slate-400">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <button 
                        onClick={() => toast.success("Downloading PDF Report...")}
                        className="bg-[#111827] hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all active:scale-95"
                    >
                        <FileMinus className="w-4 h-4" /> DOWNLOAD PDF
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className={`bg-white p-8 rounded-[32px] border ${stat.borderColor} shadow-sm transition-all hover:shadow-md`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                            <h3 className={`text-3xl font-black text-slate-800 mb-2 tracking-tight`}>{stat.value}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    
                    {/* Filters Bar */}
                    <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">View Mode</span>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select 
                                        value={filterPeriod}
                                        onChange={(e) => setFilterPeriod(e.target.value)}
                                        className="appearance-none pl-6 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer min-w-[200px]"
                                    >
                                        <option>Daily Analysis</option>
                                        <option>Weekly Summary</option>
                                        <option>Monthly Report</option>
                                        <option>3 Months</option>
                                        <option>6 Months</option>
                                        <option>1 Year</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Combined Date Filter Range */}
                        <div className="flex items-center gap-4 ml-auto">
                            <div className="flex items-center gap-2 bg-slate-50 p-2 px-4 rounded-2xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FROM</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[11px] font-black text-slate-600 focus:outline-none cursor-pointer"
                                />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mx-1">TO</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[11px] font-black text-slate-600 focus:outline-none cursor-pointer"
                                />
                            </div>
                            
                            <button 
                                onClick={() => toast.success("Exporting Excel...")}
                                className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                EXCEL
                            </button>
                            <button 
                                onClick={() => toast.success("Exporting PDF...")}
                                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-all"
                            >
                                <FileMinus className="w-4 h-4" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Table Implementation */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {filterPeriod === 'Daily Analysis' ? 'Date' : 'Period'}
                                    </th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Type</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {filterPeriod === 'Daily Analysis' ? 'Daily Wage' : 'Avg. Wage'}
                                    </th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                        {filterPeriod === 'Daily Analysis' ? 'OT Hours' : 'Total OT'}
                                    </th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                    {displayData.map((row, idx) => {
                                        const dailyWage = (row as any).dailyWage || 0;
                                        const otHours = (row as any).otHours || 0;
                                        const earned = (row as any).totalEarned || (dailyWage + (otHours * (dailyWage / 8)));
                                        
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-10 py-6">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.period}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold tracking-tight">
                                                        {row.skill}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-sm font-black text-slate-700">₹{dailyWage}</span>
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    <span className="text-sm font-black text-slate-300">{otHours}h</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-sm font-black text-emerald-500">₹{earned.toLocaleString()}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{(row as any).remarks}</span>
                                                </td>
                                                <td className="px-10 py-6 text-left">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${getStatusStyles((row as any).status || '')}`}>
                                                        {(row as any).status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {displayData.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-10 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Sidebar-style Footer */}
                    <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records per page:</span>
                            <div className="relative">
                                <select 
                                    value={recordsPerPage}
                                    onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                                    className="appearance-none pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-slate-600 outline-none cursor-pointer"
                                >
                                    <option>20</option>
                                    <option>50</option>
                                    <option>100</option>
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90" />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing {displayData.length} records</span>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-indigo-200">
                                    1
                                </button>
                                <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default PaymentsPage;
