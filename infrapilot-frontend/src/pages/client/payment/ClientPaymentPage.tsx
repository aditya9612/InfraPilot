import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { quotationService } from "../../../services/quotationService";
import { projectService } from "../../../services/projectService";
import { expenseService } from "../../../services/expenseService";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

const ClientPaymentPage = () => {
    const { tab } = useParams();
    const { projectId } = useClientProjectId();
    const [projectName, setProjectName] = useState("NEW SARA CITY");
    const activeTab = tab || "quotation";

    const [loading, setLoading] = useState(true);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [sortOrder, setSortOrder] = useState("Latest First");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showPaymentPortal, setShowPaymentPortal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Check'>('UPI');
    const [checkFile, setCheckFile] = useState<File | null>(null);

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
                    const rawExpenses = await expenseService.getExpensesByProject(projectId || 1, { is_client: true });
                    // Strictly filter for expenses with the "Client" category
                    const clientOnlyExpenses = rawExpenses.filter((e: any) => e.category === 'Client');
                    const mappedPayments = clientOnlyExpenses.map((e: any) => ({
                        id: e.id,
                        invoice_number: e.id.toString(),
                        amount: e.amount,
                        date: e.expense_date,
                        status: 'Approved',
                        payment_method: e.payment_mode || 'UPI',
                        type: e.category,
                        description: e.description
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
            const fetchProjectName = async () => {
                try {
                    const project = await projectService.getProjectById(projectId);
                    if (project?.project_name) setProjectName(project.project_name);
                } catch (e) {
                    console.error("Failed to fetch project name", e);
                }
            };
            fetchProjectName();
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

    const closeModal = () => {
        setIsViewModalOpen(false);
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        setSelectedRequest(null);
    };

    const handleView = async (request: any) => {
        setSelectedRequest(request);
        setIsViewModalOpen(true);

        // If it's a quotation or expense, fetch details
        if (activeTab === 'quotation') {
            try {
                setPdfLoading(true);
                const blob = await quotationService.downloadQuotationPDF(request.id);
                const url = window.URL.createObjectURL(blob);
                setPdfUrl(url);
            } catch (err) {
                console.error("PDF Preview Error:", err);
                toast.error("Failed to load PDF preview");
            } finally {
                setPdfLoading(false);
            }
        } else {
            // Fetch detailed expense info
            try {
                setPdfLoading(true);
                const fullExpense = await expenseService.getExpenseById(request.id);
                setSelectedRequest({
                    ...request,
                    ...fullExpense,
                    entity_title: 'EXPENSE',
                    remarks_details: fullExpense.description || `Expense for ${fullExpense.category}`,
                    requested_by_name: 'System Admin', // Fallback for expenses if requester not in API
                    created_at: fullExpense.expense_date || fullExpense.created_at
                });
            } catch (err) {
                console.error("Expense Detail Error:", err);
            } finally {
                setPdfLoading(false);
            }
        }
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

    const handleDownloadExpense = async (expense: any) => {
        const loadingToast = toast.loading("Generating Expense Voucher...");
        try {
            const doc = new jsPDF() as any;
            
            // Premium Header
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("EXPENDITURE VOUCHER", 105, 25, { align: 'center' });
            
            doc.setFontSize(10);
            doc.text(`REFERENCE ID: ${expense.id}`, 105, 32, { align: 'center' });
            
            // Body Details
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("PROJECT DETAILS", 20, 60);
            doc.line(20, 62, 190, 62);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Project Name: ${projectName}`, 20, 72);
            doc.text(`Entity Group: CLIENT`, 20, 79);
            
            doc.setFont("helvetica", "bold");
            doc.text("TRANSACTION SUMMARY", 20, 95);
            doc.line(20, 97, 190, 97);
            
            doc.setFont("helvetica", "normal");
            autoTable(doc, {
                startY: 105,
                head: [['Field Description', 'Transaction Value']],
                body: [
                    ['Amount (INR)', `Rs. ${expense.amount.toLocaleString()}`],
                    ['Payment Date', new Date(expense.date).toLocaleDateString('en-GB')],
                    ['Payment Mode', expense.payment_method || 'UPI/Cash'],
                    ['Category', expense.type || 'Client Cost'],
                    ['Description', expense.description === 'string' ? 'NA' : (expense.description || 'NA')]
                ],
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 }
            });
            
            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generated on ${new Date().toLocaleString()} | InfraPilot Portal`, 105, pageHeight - 10, { align: 'center' });
            
            doc.save(`Voucher_${expense.id}.pdf`);
            toast.success("Voucher Downloaded", { id: loadingToast });
        } catch (err) {
            console.error("PDF Gen Error:", err);
            toast.error("Failed to generate PDF", { id: loadingToast });
        }
    };

    const handlePay = (expense: any) => {
        setSelectedRequest(expense);
        setShowPaymentPortal(true);
    };

    const processPayment = () => {
        const loadingToast = toast.loading("Processing Secure Payment...");
        // Mock payment processing
        setTimeout(() => {
            toast.success("Payment Received Successfully!", { id: loadingToast });
            setShowPaymentPortal(false);
            // In a real app, we would refresh the list here
        }, 2000);
    };

    const exportToCSV = () => {
        const dataToExport = activeTab === 'quotation' ? filteredQuotations : payments;
        if (dataToExport.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = activeTab === 'quotation' 
            ? ["ID", "Type", "Requested By", "Status", "Approved By", "Date"]
            : ["ID", "Expense ID", "Category", "Amount", "Status", "Date"];
            
        const rows = dataToExport.map(item => {
            if (activeTab === 'quotation') {
                return [item.id, item.entity_title, item.requested_by_name, item.status, item.approved_by_name, item.created_at];
            }
            return [item.id, item.id, item.type, item.amount, item.status, item.date];
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


    if (showPaymentPortal && selectedRequest) {
        return (
            <>
                <Navbar title="Secure Payment Portal" breadcrumb={["Client", "Payment", "Process Transaction"]} />
                <div className="p-8 bg-slate-50 min-h-screen font-inter flex flex-col items-center">
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                        {/* Summary Header */}
                        <div className="p-8 bg-blue-600 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <button 
                                onClick={() => setShowPaymentPortal(false)}
                                className="absolute top-6 left-6 text-blue-100 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                BACK TO HISTORY
                            </button>
                            
                            <div className="mt-12 text-center">
                                <p className="text-blue-200 text-[10px] font-black tracking-[0.2em] uppercase mb-2">Checkout Summary</p>
                                <h1 className="text-5xl font-black tracking-tight mb-2">₹ {selectedRequest.amount.toLocaleString()}</h1>
                                <p className="text-blue-100/60 text-xs font-medium">Transaction Reference: <span className="text-white">#{selectedRequest.id}</span></p>
                            </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="p-10">
                            <div className="grid grid-cols-2 gap-x-8 mb-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Information</h4>
                                    <p className="text-sm font-bold text-slate-800">{projectName}</p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Site: {selectedRequest.id}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Due Date</h4>
                                    <p className="text-sm font-bold text-slate-800">{new Date(selectedRequest.date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-xs text-blue-500 font-bold uppercase mt-1">Status: Pending</p>
                                </div>
                            </div>

                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">Available Payment Channels</h4>

                            <div className="space-y-4">
                                <div 
                                    onClick={() => setPaymentMethod('UPI')}
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                        paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${paymentMethod === 'UPI' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400'}`}>📱</div>
                                        <div>
                                            <p className="font-bold text-slate-800">Unified Payments Interface (UPI)</p>
                                            <p className="text-[11px] text-slate-400 font-medium">Pay via GPay, PhonePe, or BHIM</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 bg-white'}`}>
                                        {paymentMethod === 'UPI' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setPaymentMethod('Check')}
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-6 ${
                                        paymentMethod === 'Check' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${paymentMethod === 'Check' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400'}`}>📄</div>
                                            <div>
                                                <p className="font-bold text-slate-800">Banker's Check</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Deposit physical check to company account</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'Check' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 bg-white'}`}>
                                            {paymentMethod === 'Check' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                    </div>

                                    {paymentMethod === 'Check' && (
                                        <div className="bg-white p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upload Check Copy</h5>
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => setCheckFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                                    <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                                        {checkFile ? checkFile.name : "Click to select or drag check image"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={processPayment}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] mt-10 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                COMPLETE PAYMENT
                            </button>
                        </div>
                    </div>
                    <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Secure Checkout</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar title="Approvals & Workflow" breadcrumb={["Client", "Payment", activeTab === 'quotation' ? 'Quotation Approval' : 'Payment History']} />
            <div className="p-8 bg-slate-50 min-h-screen font-inter pb-20">
                
                {/* Header with Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'quotation' ? 'Quotation Approvals' : 'Payment History'}
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
                    </div>
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
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">QUOTATION ID</th>
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
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{q.entity_id_display || q.id}</p>
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
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Name</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Mode</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-12">Action</th>
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
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">{projectName}</p>
                                                </td>
                                                <td className="px-10 py-8 text-[16px] font-black text-slate-900 tracking-tighter">
                                                    ₹ {(p.amount || 0).toLocaleString()}
                                                </td>
                                                <td className="px-10 py-8 text-[11px] font-bold text-slate-500">
                                                    {p.date && !isNaN(new Date(p.date).getTime()) 
                                                        ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : 'Recent'}
                                                </td>
                                                <td className="px-10 py-8 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                                    {p.payment_method || 'UPI'}
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handlePay(p)}
                                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Process Payment"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleView({...p, entity_title: 'TRANSACTION', remarks_details: `Transaction for ${p.type || 'Service'} - Invoice: ${p.invoice_number || 'N/A'}`})}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="View"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDownloadExpense(p)}
                                                            className="text-slate-400 hover:text-slate-800 transition-colors"
                                                            title="Download PDF"
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
                onClose={closeModal}
                title={pdfUrl ? "Quotation PDF Preview" : "Request Detailed Summary"}
                maxWidth={pdfUrl ? "max-w-4xl" : "max-w-lg"}
            >
                {pdfLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching PDF Document...</p>
                    </div>
                ) : pdfUrl ? (
                    <div className="space-y-4">
                        <div className="h-[75vh] w-full overflow-hidden rounded-2xl border border-slate-100 shadow-inner bg-slate-50">
                            <iframe 
                                src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                                className="w-full h-full border-none"
                                title="Quotation PDF Preview"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={closeModal}
                                className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all"
                            >
                                Close Preview
                            </button>
                            <a 
                                href={pdfUrl}
                                download={`Quotation_${selectedRequest?.entity_id_display || selectedRequest?.id}.pdf`}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center"
                            >
                                Download Copy
                            </a>
                        </div>
                    </div>
                ) : selectedRequest && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Name</p>
                                <p className="text-sm font-black text-slate-800">{projectName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                    selectedRequest.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                                    selectedRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                    {selectedRequest.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Amount</p>
                                    <p className="text-[15px] font-black text-slate-900">₹ {(selectedRequest.amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment Mode</p>
                                    <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">{selectedRequest.payment_method || 'UPI'}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Date</p>
                                <p className="text-xs font-bold text-slate-800">
                                    {new Date(selectedRequest.date || selectedRequest.expense_date || selectedRequest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>

                            {selectedRequest.remarks_details && (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 px-1">Description / Category</h4>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase tracking-wide">
                                            {selectedRequest.remarks_details === 'string' ? 'NA' : (selectedRequest.remarks_details || 'NA')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={closeModal}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all"
                        >
                            Close Summary
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ClientPaymentPage;
