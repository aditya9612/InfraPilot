import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import ViewInvoiceModal from "../../components/forms/ViewInvoiceModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";

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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Receivables</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Generate official tax bills, track collections, and manage organizational aging reports.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedInvoice(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Generate High-Fidelity Bill
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-6">Invoice Lifecycle</th>
                  <th className="px-8 py-6">Project & Counterparty</th>
                  <th className="px-8 py-6">Service Breakdown</th>
                  <th className="px-8 py-6 text-right">Net Financials</th>
                  <th className="px-8 py-6">Settlement Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-black text-[10px] shadow-inner">
                             INV
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{inv.invoice_number}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">DATED: {inv.billing_date}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-slate-700 tracking-tight">{inv.client_name}</p>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{inv.project_name}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs text-slate-600 font-bold max-w-xs truncate">{inv.work_description}</p>
                       <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest flex items-center gap-2">
                            <span>QTY: {inv.quantity}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>RATE: ₹{inv.rate}</span>
                       </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="text-lg font-black text-slate-900 tracking-tight">₹{inv.total_with_gst.toLocaleString("en-IN")}</p>
                       <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">Incl. GST ({inv.gst_percent}%)</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : 
                              inv.status === "partial" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                           }`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                             inv.status === "paid" ? "bg-emerald-500" : 
                             inv.status === "partial" ? "bg-amber-500" : "bg-rose-500"
                          }`} />
                          {inv.status}
                       </div>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 ml-1">DUE: {inv.due_date}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-100">
                        <button 
                          onClick={() => handleViewInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-primary transition-all"
                          title="View Digital Copy"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                          title="Modify Ledger"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                          title="Void Invoice"
                        >
                            <Trash2 className="w-4 h-4" />
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
