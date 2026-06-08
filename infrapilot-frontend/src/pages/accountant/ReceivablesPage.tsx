import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import ViewInvoiceModal from "../../components/forms/ViewInvoiceModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_INVOICES = [
  { 
    id: 1, 
    invoice_number: "INV-2024-001", 
    client_name: "Aditya Enterprises", 
    project_name: "Project Alpha", 
    billing_date: "2024-03-15", 
    work_description: "Excavation work for site A",
    quantity: 1200,
    rate: 15,
    amount: 18000,
    gst_percent: 18,
    total_with_gst: 21240,
    status: "paid",
    due_date: "2024-04-15"
  },
  { 
    id: 2, 
    invoice_number: "INV-2024-002", 
    client_name: "BuildCorp Solutions", 
    project_name: "Project Beta", 
    billing_date: "2024-03-20", 
    work_description: "PCC work for foundation",
    quantity: 500,
    rate: 200,
    amount: 100000,
    gst_percent: 18,
    total_with_gst: 118000,
    status: "partial",
    due_date: "2024-04-20"
  },
  { 
    id: 3, 
    invoice_number: "INV-2024-003", 
    client_name: "Zenith Infrastructures", 
    project_name: "Skyline Residency", 
    billing_date: "2024-04-01", 
    work_description: "RCC column casting",
    quantity: 250,
    rate: 450,
    amount: 112500,
    gst_percent: 18,
    total_with_gst: 132750,
    status: "pending",
    due_date: "2024-05-01"
  }
];

const ReceivablesPage = () => {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = (id: number) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete));
      toast.success("Invoice deleted successfully");
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCreateInvoice = (data: any) => {
    if (selectedInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, ...data } : inv));
        toast.success("Invoice updated successfully!");
    } else {
        const newInvoice = {
            ...data,
            id: invoices.length + 1,
            project_name: "Selected Project" // In a real app, find project name by ID
        };
        setInvoices(prev => [newInvoice, ...prev]);
        toast.success("Invoice generated successfully!");
    }
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <>
      <Navbar title="Receivables (Clients)" breadcrumb={["Accountant", "Billing", "Receivables"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Client Receivables</h1>
            <p className="text-slate-500 text-sm mt-1">Generate tax bills, track collections and manage aging reports.</p>
          </div>
          <button
            onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Generate Invoice
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Client Invoices</h3>
              <p className="text-xs text-slate-400 mt-0.5">All client billing records and collection status</p>
            </div>
            <button
              onClick={() => {
                const rows = invoices.map(inv => [
                  inv.invoice_number, `"${inv.client_name}"`, `"${inv.project_name}"`, inv.billing_date, inv.total_with_gst, inv.status, inv.due_date
                ].join(','));
                const csv = ['Invoice No,Client,Project,Date,Amount (INR),Status,Due Date', ...rows].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Receivables_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:border-primary/30 hover:text-primary transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50 whitespace-nowrap">
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Billing Date</th>
                  <th className="px-6 py-4">Work Description</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Rate</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">GST (%)</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-800">Total with GST</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Attachment</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{inv.client_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inv.project_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inv.billing_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={inv.work_description}>{inv.work_description}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{inv.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{inv.rate.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{inv.gst_percent}%</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800 text-right">₹{inv.total_with_gst.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                        inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        inv.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inv.due_date}</td>
                    <td className="px-6 py-4 text-center">
                        <button className="text-primary hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-all mx-auto block" title="View Attachment">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      <CreateInvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateInvoice}
        projects={[]} // Need to fetch projects here in a real app
      />

      <ViewInvoiceModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoice={selectedInvoice}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete Invoice"
        type="danger"
      />
    </>
  );
};

export default ReceivablesPage;
