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
            // Map UI filter to API params
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

            const params: any = {
                page: currentPage,
                page_size: recordsPerPage,
                time_filter: time_filter
            };

            const data = await dashboardService.getLabourPayments(params);
            if (data) {
                const items = data.items || (Array.isArray(data) ? data : []);
                setPayments(items);
                setTotalRecords(data.meta?.total || items.length);
                
                setSummaryStats({
                    total_payout: data.summary?.total_payout || items.reduce((acc: number, curr: any) => acc + (curr.total_earned || curr.amount || 0), 0),
                    high_payouts: data.summary?.high_payouts || items.filter((i: any) => (i.total_earned || i.amount || 0) > 5000).length,
                    ot_intensive: data.summary?.ot_intensive || items.filter((i: any) => (i.ot_hours || 0) > 2).length,
                    advance_adjusted: data.summary?.advance_adjusted || 0
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
            const dateStr = d.date || d.created_at || new Date().toISOString();
            const dateObj = new Date(dateStr);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[dateObj.getMonth()];
            
            return {
                period: d.period || `${day} ${month}`,
                skill: d.skill || d.designation || 'Labour',
                dailyWage: d.daily_wage || d.rate || 0,
                otHours: d.ot_hours || 0,
                totalEarned: d.total_earned || d.amount || 0,
                remarks: d.remarks || d.description || '—',
                status: d.status || 'Pending',
                id: d.id
            };
        });
    }, [payments]);

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
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">View Mode</span>
                            <div className="relative">
                                <select value={filterPeriod} onChange={(e) => { setFilterPeriod(e.target.value); setCurrentPage(1); }} className="appearance-none pl-6 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer min-w-[200px]">
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
                                {displayData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
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
                                {displayData.length === 0 && !isLoading && (
                                    <tr><td colSpan={6} className="px-10 py-24 text-center"><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No payment records found</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default PaymentsPage;
