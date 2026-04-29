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
  const [isLoading] = useState(false);

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
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
    const newInvoice = {
        ...data,
        id: invoices.length + 1,
        project_name: "Selected Project" // In a real app, find project name by ID
    };
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success("Invoice generated successfully!");
  };

  return (
    <>
      <Navbar title="Receivables (Clients)" breadcrumb={["Accountant", "Billing", "Receivables"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Client Receivables</h1>
            <p className="text-slate-500 text-sm font-medium">Generate bills, track collections, and manage client aging.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Generate New Bill
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-5">Invoice Details</th>
                  <th className="px-6 py-5">Project & Client</th>
                  <th className="px-6 py-5">Work Details</th>
                  <th className="px-6 py-5 text-right">Financials</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-black text-[10px] shadow-sm">
                             INV
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700">{inv.invoice_number}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dated: {inv.billing_date}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-bold text-slate-700">{inv.client_name}</p>
                       <p className="text-xs text-slate-400 font-medium italic">{inv.project_name}</p>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-xs text-slate-600 font-medium max-w-xs truncate">{inv.work_description}</p>
                       <p className="text-[10px] text-slate-400 font-bold mt-1">QTY: {inv.quantity} | RATE: ₹{inv.rate}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <p className="text-sm font-black text-slate-800">₹{inv.total_with_gst.toLocaleString()}</p>
                       <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Incl. GST ({inv.gst_percent}%)</p>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                             inv.status === "paid" ? "bg-emerald-500" : 
                             inv.status === "partial" ? "bg-amber-500" : "bg-rose-500"
                          }`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                             inv.status === "paid" ? "text-emerald-600" : 
                             inv.status === "partial" ? "text-amber-600" : "text-rose-600"
                          }`}>
                             {inv.status}
                          </span>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium mt-1">Due: {inv.due_date}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleViewInvoice(inv)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
