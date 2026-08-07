import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Wallet,
    TrendingUp,
    CreditCard,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileMinus,
    Calendar,
    Loader2,
    Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { dashboardService } from '../../services/dashboardService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentsPage: React.FC = () => {
    const { user } = useAuth();
    const [filterPeriod, setFilterPeriod] = useState("Daily Analysis");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordsPerPage, setRecordsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [payments, setPayments] = useState<any[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [summaryStats, setSummaryStats] = useState({
        total_payout: 0,
        high_payouts: 0,
        ot_intensive: 0,
        advance_adjusted: 0
    });

    const userName = user?.name || 'Gopal Yadav';

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            let time_filter = "";
            switch (filterPeriod) {
                case "Daily Analysis": time_filter = "today"; break;
                case "Weekly Summary": time_filter = "this_week"; break;
                case "Monthly Report": time_filter = "this_month"; break;
                case "3 Months": time_filter = "last_3_months"; break;
                case "6 Months": time_filter = "last_6_months"; break;
                case "1 Year": time_filter = "last_year"; break;
                default: time_filter = "this_month";
            }

            const savedIdStr = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
            const selectedPid = savedIdStr ? Number(savedIdStr) : undefined;

            const params: any = {
                page: currentPage,
                page_size: recordsPerPage,
                time_filter: time_filter,
                ...(selectedPid ? { project_id: selectedPid } : {})
            };

            const data = await dashboardService.getLabourPayments(params);
            if (data) {
                const items = Array.isArray(data)
                    ? data
                    : (data.items || data.data || data.payments || data.records || []);
                
                setPayments(items);
                setTotalRecords(data.meta?.total || data.total || data.total_count || items.length);
                
                setSummaryStats({
                    total_payout: data.summary?.total_payout ?? data.total_payout ?? items.reduce((acc: number, curr: any) => acc + Number(curr.total_earned || curr.amount || curr.daily_wage || 0), 0),
                    high_payouts: data.summary?.high_payouts ?? data.high_payouts ?? items.filter((i: any) => Number(i.total_earned || i.amount || i.daily_wage || 0) > 5000).length,
                    ot_intensive: data.summary?.ot_intensive ?? data.ot_intensive ?? items.filter((i: any) => Number(i.ot_hours || i.overtime_hours || 0) > 2).length,
                    advance_adjusted: data.summary?.advance_adjusted ?? data.advance_adjusted ?? 0
                });
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payment data');
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, [filterPeriod, currentPage, recordsPerPage]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const displayData = useMemo(() => {
        return payments.map(d => {
            const dateStr = d.date || d.created_at || d.payment_date || new Date().toISOString();
            const dateObj = new Date(dateStr);
            const day = !isNaN(dateObj.getTime()) ? String(dateObj.getDate()).padStart(2, '0') : '';
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = !isNaN(dateObj.getTime()) ? months[dateObj.getMonth()] : '';
            
            return {
                period: (day && month) ? `${day} ${month}` : (d.period || dateStr),
                skill: d.skill || d.skill_type || d.designation || d.labour_type || d.name || 'Labour',
                dailyWage: Number(d.dailyWage ?? d.daily_wage ?? d.rate ?? d.wage ?? 0),
                otHours: Number(d.otHours ?? d.ot_hours ?? d.overtime_hours ?? 0),
                totalEarned: Number(d.totalEarned ?? d.total_earned ?? d.amount ?? d.total_amount ?? 0),
                remarks: d.remarks || d.description || '—',
                status: (d.status || 'Paid').toUpperCase(),
                id: d.id || d.payment_id
            };
        });
    }, [payments]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return displayData;
        const q = searchTerm.toLowerCase();
        return displayData.filter(item =>
            item.skill.toLowerCase().includes(q) ||
            item.period.toLowerCase().includes(q) ||
            item.remarks.toLowerCase().includes(q) ||
            item.status.toLowerCase().includes(q)
        );
    }, [displayData, searchTerm]);

    const generateFrontendPDF = (data: any[]) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(17, 24, 39); // #111827
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("InfraPilot", 14, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Fiscal Payroll Analysis Report", 14, 32);
        
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Labour Payments Summary", 14, 55);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Report Period: ${filterPeriod}`, 14, 62);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 67);

        doc.setDrawColor(229, 231, 235);
        doc.line(14, 75, pageWidth - 14, 75);
        
        doc.setFont('helvetica', 'bold');
        doc.text("TOTAL PAYOUT:", 14, 85);
        doc.text(`₹${summaryStats.total_payout.toLocaleString()}`, 50, 85);
        
        const tableHeaders = [["Period", "Skill Type", "Wage", "OT Hours", "Total Earned", "Status"]];
        const tableBody = data.map(item => [
            item.period,
            item.skill,
            `₹${item.dailyWage}`,
            `${item.otHours}h`,
            `₹${item.totalEarned.toLocaleString()}`,
            item.status
        ]);

        autoTable(doc, {
            startY: 100,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        doc.save(`Labour_Payments_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        const loadingToast = toast.loading(`Preparing ${format.toUpperCase()}...`);
        try {
            let time_filter = "";
            switch (filterPeriod) {
                case "Daily Analysis": time_filter = "today"; break;
                case "Weekly Summary": time_filter = "this_week"; break;
                case "Monthly Report": time_filter = "this_month"; break;
                default: time_filter = "this_month";
            }

            try {
                const blob = await dashboardService.exportLabourPayments(format, { time_filter });
                const isError = blob.type === 'application/json' || blob.size < 500;
                
                if (isError && format === 'pdf') {
                    console.log("Server PDF looks invalid, falling back to local generation");
                    generateFrontendPDF(displayData);
                    toast.success("PDF generated successfully", { id: loadingToast });
                    return;
                }

                const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                const file = new Blob([blob], { type: mimeType });
                const url = window.URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Labour_Payments_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success(`${format.toUpperCase()} exported successfully`, { id: loadingToast });
            } catch (err) {
                if (format === 'pdf') {
                    generateFrontendPDF(displayData);
                    toast.success("PDF generated locally", { id: loadingToast });
                } else {
                    throw err;
                }
            }
        } catch (error: any) {
            console.error(`Error exporting ${format}:`, error);
            toast.error(`Failed to export ${format}`, { id: loadingToast });
        }
    };

    const getStatusStyles = (status: string) => {
        if (!status) return 'bg-slate-50 text-slate-500';
        switch (status.toUpperCase()) {
            case 'PAID': case 'SUCCESS': case 'COMPLETED': return 'bg-emerald-50 text-emerald-600';
            case 'PENDING': case 'PROCESSING': return 'bg-amber-50 text-amber-600';
            case 'REJECTED': case 'FAILED': return 'bg-rose-50 text-rose-600';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    const stats = [
        { label: 'TOTAL PAYOUT', value: `₹${summaryStats.total_payout.toLocaleString()}`, sub: 'All Wage Items', icon: Wallet, color: 'text-indigo-600', borderColor: 'border-indigo-200' },
        { label: 'HIGH PAYOUTS', value: summaryStats.high_payouts.toString(), sub: 'Above ₹5k Threshold', icon: TrendingUp, color: 'text-emerald-500', borderColor: 'border-slate-100' },
        { label: 'OT INTENSIVE', value: summaryStats.ot_intensive.toString(), sub: 'Shifts with Overtime', icon: Clock, color: 'text-amber-500', borderColor: 'border-slate-100' },
        { label: 'ADVANCE ADJUSTED', value: `₹${summaryStats.advance_adjusted.toLocaleString()}`, sub: 'Recovery Target', icon: CreditCard, color: 'text-rose-500', borderColor: 'border-slate-100' },
    ];

    const totalPages = Math.ceil((totalRecords || filteredData.length) / recordsPerPage) || 1;

    return (
        <>
            <Navbar title="Financial Intelligence" breadcrumb={['Labour', 'Human Resources', 'Payroll Reports']} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Fiscal Payroll Analysis</h1>
                        <p className="text-sm font-bold text-slate-400">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <button onClick={() => handleExport('pdf')} className="bg-[#111827] hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all active:scale-95">
                        <FileMinus className="w-4 h-4" /> DOWNLOAD PDF
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className={`bg-white p-8 rounded-[32px] border ${stat.borderColor} shadow-sm transition-all hover:shadow-md`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{stat.value}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* View Mode Filter */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">View Mode</span>
                                <div className="relative">
                                    <select value={filterPeriod} onChange={(e) => { setFilterPeriod(e.target.value); setCurrentPage(1); }} className="appearance-none pl-6 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer min-w-[180px]">
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

                            {/* Search input */}
                            <div className="relative min-w-[220px]">
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search skill, date, status..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                            <button onClick={() => setShowDateFilter(!showDateFilter)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showDateFilter ? 'bg-[#111827] text-white shadow-lg' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                                <Calendar className="w-4 h-4" /> Date
                            </button>
                            <button onClick={() => handleExport('excel')} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all">
                                <FileSpreadsheet className="w-4 h-4" /> EXCEL
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative min-h-[300px]">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Accounts...</p>
                                </div>
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Type</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wage</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">OT Hours</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.period}</span></td>
                                        <td className="px-10 py-6"><span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold tracking-tight">{row.skill}</span></td>
                                        <td className="px-10 py-6"><span className="text-sm font-black text-slate-700">₹{row.dailyWage}</span></td>
                                        <td className="px-10 py-6 text-center"><span className="text-sm font-black text-slate-300">{row.otHours}h</span></td>
                                        <td className="px-10 py-6"><span className="text-sm font-black text-emerald-500">₹{row.totalEarned.toLocaleString()}</span></td>
                                        <td className="px-10 py-6 text-left">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${getStatusStyles(row.status)}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && !isLoading && (
                                    <tr><td colSpan={6} className="px-10 py-24 text-center"><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No payment records found</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!isLoading && (totalRecords > 0 || filteredData.length > 0) && (
                        <div className="px-10 py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
                                <select
                                    value={recordsPerPage}
                                    onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 outline-none cursor-pointer"
                                >
                                    {[10, 20, 50, 100].map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Showing <span className="text-slate-800 font-black">{(currentPage - 1) * recordsPerPage + 1}</span> - <span className="text-slate-800 font-black">{Math.min(currentPage * recordsPerPage, totalRecords || filteredData.length)}</span> of <span className="text-slate-800 font-black">{totalRecords || filteredData.length}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <span className="text-xs font-black text-slate-700 px-3">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

export default PaymentsPage;
