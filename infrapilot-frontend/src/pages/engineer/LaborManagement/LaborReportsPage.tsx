import React, { useState, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Printer,
  Eye,
  ChevronRight
} from "lucide-react";

interface WageReportEntry {
    id: number;
    worker_name: string;
    id_aadhaar: string;
    contractor_name: string;
    days_present: number;
    working_hours: number;
    overtime_hours: number;
    total_wages: number;
    status: 'Paid' | 'Pending';
}

const LaborReportsPage: React.FC = () => {
    const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Mock data for demonstration
    const mockReports: WageReportEntry[] = [
        {
            id: 1,
            worker_name: "Rajesh Kumar",
            id_aadhaar: "4521-8890-1122",
            contractor_name: "Apex Builders",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 6 : 24),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 48 : 192),
            overtime_hours: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 4 : 15),
            total_wages: reportType === 'Daily' ? 750 : (reportType === 'Weekly' ? 4500 : 18500),
            status: 'Paid'
        },
        {
            id: 2,
            worker_name: "Amit Singh",
            id_aadhaar: "7788-2233-4455",
            contractor_name: "Apex Builders",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 5 : 22),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 40 : 176),
            overtime_hours: reportType === 'Daily' ? 0 : (reportType === 'Weekly' ? 0 : 5),
            total_wages: reportType === 'Daily' ? 600 : (reportType === 'Weekly' ? 3500 : 16000),
            status: 'Pending'
        },
        {
            id: 3,
            worker_name: "Suresh Prajapati",
            id_aadhaar: "1122-3344-5566",
            contractor_name: "Vertex Infra",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 6 : 26),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 52 : 208),
            overtime_hours: reportType === 'Daily' ? 2 : (reportType === 'Weekly' ? 8 : 20),
            total_wages: reportType === 'Daily' ? 900 : (reportType === 'Weekly' ? 5500 : 22000),
            status: 'Paid'
        }
    ];

    const filteredReports = useMemo(() => {
        return mockReports.filter(r => {
            const matchesSearch = r.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.contractor_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [mockReports, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = mockReports.reduce((acc, curr) => acc + curr.total_wages, 0);
        const avgPresent = mockReports.reduce((acc, curr) => acc + curr.days_present, 0) / mockReports.length;
        return { total, avgPresent: avgPresent.toFixed(1) };
    }, [mockReports]);

    return (
        <>
            <Navbar title="Labor Wage Analysis" breadcrumb={["Engineer", "Workforce", "Financial Reports"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Workforce Remuneration Vault</h1>
                        <p className="text-slate-500 text-sm italic-none">Consolidated fiscal records of site labour, attendance and overtime payouts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
                            <Printer className="w-4 h-4" />
                            Print Summary
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Payout"
                        value={`₹${stats.total.toLocaleString()}`}
                        sub="Current Cycle"
                        accent="text-slate-800"
                        icon={<DollarSign className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Avg. Attendance"
                        value={`${stats.avgPresent} Days`}
                        sub="Per Personnel"
                        accent="text-emerald-500"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Active Cycle"
                        value={reportType}
                        sub="Reporting Period"
                        accent="text-blue-500"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Wages"
                        value={`₹${(stats.total * 0.15).toLocaleString()}`}
                        sub="Awaiting Clearance"
                        accent="text-rose-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by personnel name or contractor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-4 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select 
                                    value={reportType} 
                                    onChange={(e) => setReportType(e.target.value as any)} 
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                                >
                                    <option value="Daily">Daily Report</option>
                                    <option value="Weekly">Weekly Report</option>
                                    <option value="Monthly">Monthly Report</option>
                                </select>
                            </div>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option value="All">All Status</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Personnel Detail</th>
                                    <th className="px-6 py-4 font-inter">Working Metrics</th>
                                    <th className="px-6 py-4 font-inter">Remuneration</th>
                                    <th className="px-6 py-4 font-inter">Status</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredReports.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{record.worker_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{record.id_aadhaar} • {record.contractor_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-slate-700 tabular-nums font-inter">{record.days_present} Days Present</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">{record.working_hours} Hrs Base • {record.overtime_hours} Hrs OT</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-black text-slate-800 font-inter">₹{record.total_wages.toLocaleString()}</span>
                                                <span className="text-[9px] text-emerald-500 font-bold font-inter italic-none">Calculated Gross</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${record.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default LaborReportsPage;
