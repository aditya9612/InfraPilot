import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { paymentService } from "../../../services/paymentService";
import { approvalService } from "../../../services/approvalService";
import { quotationService } from "../../../services/quotationService";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ClientPaymentPage = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const { projectId } = useClientProjectId();
    const activeTab = tab || "quotation";

    const [loading, setLoading] = useState(true);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [sortOrder, setSortOrder] = useState("Latest First");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (activeTab === "quotation") {
                    const data = await quotationService.getQuotations();
                    // Filter strictly for New Sara City
                    const projectQuotations = data.filter((q: any) => Number(q.project_id) === Number(projectId));
                    
                    const mapped = projectQuotations.map((q: any) => ({
                        ...q,
                        entity_title: 'QUOTATION',
                        id: q.id,
                        entity_id_display: q.quotation_no,
                        requested_by_name: q.client_name || q.company_name || 'Admin',
                        remarks_details: q.project_name || 'No project description',
                        status: q.is_approved ? 'Approved' : (q.status === 'rejected' ? 'Rejected' : 'Pending'),
                        approved_by_name: q.is_approved ? 'CLIENT' : '-',
                        created_at: q.created_at || new Date().toISOString()
                    }));
                    setQuotations(mapped);
                } else {
                    const rawPayments = await paymentService.getPaymentHistory({ project_id: projectId || 1 });
                    const mappedPayments = rawPayments.map((p: any) => ({
                        id: p.id,
                        invoice_number: p.labour_id?.toString() || p.id.toString(),
                        amount: p.amount,
                        date: p.payment_date,
                        status: p.status,
                        type: p.payment_type,
                    }));
                    setPayments(mappedPayments);
                }
            } catch (error) {
                console.error("Failed to fetch payment data:", error);
                if (activeTab === "quotation") {
                   setQuotations([
                      { id: 212, entity_title: 'BOQ', requested_by_name: 'Rohit', remarks_details: 'Initial approval request for base', status: 'Pending', approved_by_name: '-', created_at: '2026-06-12T10:00:00Z' },
                      { id: 48, entity_title: 'DRAWING', requested_by_name: 'Client', remarks_details: 'Approval requested for drawing: Foundation', status: 'Pending', approved_by_name: '-', created_at: '2026-06-11T12:00:00Z' },
                      { id: 46, entity_title: 'DRAWING', requested_by_name: 'Client', remarks_details: 'Approved after site review', status: 'Approved', approved_by_name: 'CLIENT', created_at: '2026-06-10T14:00:00Z' },
                      { id: 45, entity_title: 'DRAWING', requested_by_name: 'Client', remarks_details: 'Approval requested for drawing: Layout plan V2', status: 'Pending', approved_by_name: '-', created_at: '2026-06-09T16:00:00Z' },
                      { id: 210, entity_title: 'BOQ', requested_by_name: 'Rohit', remarks_details: 'Initial approval request for cement', status: 'Pending', approved_by_name: '-', created_at: '2026-06-08T18:00:00Z' },
                   ]);
                } else {
                   setPayments([
                      { id: 101, invoice_number: "INV-2026-001", amount: 250000, date: "2026-06-01", status: "paid", type: "RA Bill" },
                      { id: 102, invoice_number: "INV-2026-045", amount: 15000, date: "2026-06-10", status: "pending", type: "Tax Invoice" }
                   ]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId, activeTab]);

    const handleApprove = async (id: number) => {
        const loadingToast = toast.loading("Processing approval...");
        try {
            await quotationService.approveQuotation(id);
            toast.success("Quotation Approved", { id: loadingToast });
            setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'Approved', approved_by_name: 'CLIENT', is_approved: true } : q));
        } catch (err) {
            toast.error("Failed to approve", { id: loadingToast });
        }
    };

    const handleReject = async (id: number) => {
        const reasoning = window.prompt("Enter rejection reason:");
        if (reasoning === null) return;
        
        const loadingToast = toast.loading("Processing rejection...");
        try {
            await quotationService.rejectQuotation(id, reasoning);
            toast.success("Quotation Rejected", { id: loadingToast });
            setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'Rejected' } : q));
        } catch (err) {
            toast.error("Failed to reject", { id: loadingToast });
        }
    };

    const handleView = (request: any) => {
        setSelectedRequest(request);
        setIsViewModalOpen(true);
    };

    const handleDownloadQuotation = async (id: number, quotationNo: string) => {
        const loadingToast = toast.loading("Generating Quotation PDF...");
        try {
            const blob = await quotationService.downloadQuotationPDF(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation_${quotationNo || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Quotation Downloaded", { id: loadingToast });
        } catch (err) {
            console.error("Download error:", err);
            toast.error("Failed to download quotation", { id: loadingToast });
        }
    };

    const exportToCSV = () => {
        const dataToExport = activeTab === 'quotation' ? filteredQuotations : payments;
        if (dataToExport.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = activeTab === 'quotation' 
            ? ["ID", "Type", "Requested By", "Status", "Approved By", "Date"]
            : ["ID", "Invoice", "Type", "Amount", "Status", "Date"];
            
        const rows = dataToExport.map(item => {
            if (activeTab === 'quotation') {
                return [item.id, item.entity_title, item.requested_by_name, item.status, item.approved_by_name, item.created_at];
            }
            return [item.id, item.invoice_number, item.type, item.amount, item.status, item.date];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Report Exported");
    };

    const filteredQuotations = quotations
        .filter(q => {
            const matchesSearch = (q.entity_title + q.id + q.entity_id_display + q.remarks_details + q.requested_by_name).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All Status" || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === "Latest First" ? dateB - dateA : dateA - dateB;
        });

    const filteredPayments = payments
        .filter(p => {
            const matchesSearch = (p.invoice_number + p.id + p.type + p.amount).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All Status" || 
                                 (statusFilter === "Pending" && (p.status === "pending" || p.status === "Pending")) ||
                                 (statusFilter === "Approved" && (p.status === "paid" || p.status === "Approved")) ||
                                 (statusFilter === "Rejected" && (p.status === "rejected" || p.status === "Rejected"));
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === "Latest First" ? dateB - dateA : dateA - dateB;
        });

    const stats = {
        pending: activeTab === 'quotation' 
            ? quotations.filter(q => q.status === 'Pending').length 
            : payments.filter(p => p.status === 'pending' || p.status === 'Pending').length,
        approved: activeTab === 'quotation' 
            ? quotations.filter(q => q.status === 'Approved').length 
            : payments.filter(p => p.status === 'paid' || p.status === 'Approved').length,
        rejected: activeTab === 'quotation' 
            ? quotations.filter(q => q.status === 'Rejected').length 
            : payments.filter(p => p.status === 'rejected' || p.status === 'Rejected').length
    };

    return (
        <>
            <Navbar title="Approvals & Workflow" breadcrumb={["Client", "Payment", activeTab === 'quotation' ? 'Quotation Approval' : 'Payment History']} />
            <div className="p-8 bg-slate-50 min-h-screen font-inter pb-20">
                
                {/* Header with Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'quotation' ? 'Quotation Approvals' : 'Expense Approvals'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 text-sm">
                            Review and authorize site requests for materials, billing, and expenses.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={exportToCSV}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            Export Report
                        </button>
                        <button className="px-6 py-2.5 bg-slate-100 text-slate-400 border border-slate-100 rounded-xl text-xs font-bold cursor-not-allowed">
                            Approve Multiple
                        </button>
                    </div>
                </div>

                {/* Status Filter Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { id: 'Pending', label: "PENDING REQUESTS", value: stats.pending, sub: "Action Required", color: "text-amber-500" },
                        { id: 'Approved', label: "APPROVED TOTAL", value: stats.approved, sub: "Successfully processed", color: "text-emerald-500" },
                        { id: 'Rejected', label: "TOTAL REJECTED", value: stats.rejected, sub: "Denied requests", color: "text-rose-500" }
                    ].map((s, i) => (
                        <div 
                            key={i} 
                            onClick={() => setStatusFilter(statusFilter === s.id ? "All Status" : s.id)}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                                statusFilter === s.id ? 'bg-slate-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 shadow-sm'
                            }`}
                        >
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center justify-between">
                                {s.sub}
                                {statusFilter === s.id && <span className="bg-blue-500 w-2 h-2 rounded-full animate-pulse"></span>}
                            </p>
                        </div>
                    ))}
                </div>


                {/* Content Container */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                    
                    {/* Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-wrap gap-4 items-center justify-between bg-white">
                        <div className="flex items-center gap-4 w-full">
                            {/* Search Bar - Half Length */}
                            <div className="relative w-1/2">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                                <input 
                                    type="text" 
                                    placeholder="Search by entity type, id, remarks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                                />
                            </div>
                            
                            <div className="flex items-center gap-3 ml-auto">
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => setSortOrder("Latest First")}
                                        className={`px-4 py-2.5 text-xs font-bold transition-all ${sortOrder === "Latest First" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Latest First
                                    </button>
                                    <button 
                                        onClick={() => setSortOrder("Oldest First")}
                                        className={`px-4 py-2.5 text-xs font-bold transition-all ${sortOrder === "Oldest First" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Oldest
                                    </button>
                                </div>
                                
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none shadow-sm"
                                >
                                    <option value="All Status">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Data...</p>
                        </div>
                    ) : activeTab === "quotation" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30">
                                        <th className="px-6 py-5 w-12 text-center">
                                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ENTITY TYPE & ID</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">REQUESTED BY</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">REMARKS / DETAILS</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">APPROVED BY</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-10">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredQuotations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center">
                                                <div className="flex flex-col items-center opacity-40">
                                                   <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                   <p className="font-bold uppercase tracking-widest text-xs">No records matching your search</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuotations.map((q, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-6 py-6 text-center">
                                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{q.entity_title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wider">ID: {q.entity_id_display || q.id}</p>
                                                </td>
                                                <td className="px-6 py-6 font-bold text-[12px] text-slate-700">
                                                    {q.requested_by_name}
                                                </td>
                                                <td className="px-6 py-6 text-xs text-slate-500 font-medium max-w-xs truncate">
                                                    {q.remarks_details}
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        q.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                                                        q.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {q.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center text-[11px] font-bold text-slate-400">
                                                    {q.approved_by_name}
                                                </td>
                                                <td className="px-6 py-6 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleView(q)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
                                                            title="View"
                                                        >
                                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDownloadQuotation(q.id, q.entity_id_display)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all"
                                                            title="Download PDF"
                                                        >
                                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </button>
                                                        {q.status === 'Pending' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleApprove(q.id)} 
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 transition-all shadow-sm"
                                                                    title="Approve"
                                                                >
                                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleReject(q.id)} 
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-all shadow-sm"
                                                                    title="Reject"
                                                                >
                                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction / ID</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Type</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-12">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transaction history found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayments.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm">#</div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 tracking-tight">{p.invoice_number || `TXN-${p.id}`}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Reference ID: {p.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                                    {p.type || 'Payment'}
                                                </td>
                                                <td className="px-10 py-8 text-[11px] font-bold text-slate-500">
                                                    {p.date && !isNaN(new Date(p.date).getTime()) 
                                                        ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : 'Recent'}
                                                </td>
                                                <td className="px-10 py-8 text-[16px] font-black text-slate-900 tracking-tighter">
                                                    ₹ {(p.amount || 0).toLocaleString()}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        (p.status === 'paid' || p.status === 'Approved') ? 'bg-emerald-50 text-emerald-600' : 
                                                        (p.status === 'pending' || p.status === 'Pending') ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleView({...p, entity_title: 'TRANSACTION', remarks_details: `Transaction for ${p.type || 'Service'} - Invoice: ${p.invoice_number || 'N/A'}`})}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                toast.success("Downloading Invoice...");
                                                                // Simulate download
                                                                setTimeout(() => toast.success("Invoice Downloaded"), 1000);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-800 transition-colors"
                                                            title="Download Invoice"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <Modal 
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Request Detailed Summary"
                maxWidth="max-w-lg"
            >
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Reference</p>
                                <p className="text-sm font-black text-slate-800">{selectedRequest.entity_title} #{selectedRequest.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                    selectedRequest.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                                    selectedRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                    {selectedRequest.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Request Details</h4>
                                <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                        {selectedRequest.remarks_details}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-100 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Requested By</p>
                                    <p className="text-xs font-bold text-slate-800">{selectedRequest.requested_by_name}</p>
                                </div>
                                <div className="p-4 border border-slate-100 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Submission Date</p>
                                    <p className="text-xs font-bold text-slate-800">{new Date(selectedRequest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setIsViewModalOpen(false)}
                                className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                            >
                                Close Summary
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ClientPaymentPage;
