import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateBillModal from "../../components/forms/CreateBillModal";
import ViewBillModal from "../../components/forms/ViewBillModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_PAYABLES = [
  { 
    id: 1, 
    vendor_name: "Mahaveer Cements", 
    bill_number: "BILL/2024/401", 
    category: "vendor",
    item: "OPC 53 Grade Cement", 
    quantity: 500, 
    rate: 380, 
    total_amount: 190000, 
    gst: 34200, 
    payable_amount: 224200, 
    status: "pending", 
    due_date: "2024-04-10" 
  },
  { 
    id: 2, 
    vendor_name: "Ganesh Earthmovers", 
    bill_number: "EXP/MAR/022", 
    category: "contractor",
    item: "Excavation & Shifting", 
    quantity: 1, 
    rate: 45000, 
    total_amount: 45000, 
    gst: 8100, 
    payable_amount: 53100, 
    status: "paid", 
    due_date: "2024-03-25" 
  },
  { 
    id: 3, 
    vendor_name: "TATA Steel Distribution", 
    bill_number: "TATA/FE500/109", 
    category: "vendor",
    item: "Reinforcement Steel", 
    quantity: 5000, 
    rate: 62, 
    total_amount: 310000, 
    gst: 55800, 
    payable_amount: 365800, 
    status: "partial", 
    due_date: "2024-04-15" 
  }
];

const PayablesPage = () => {
  const { category } = useParams<{ category: string }>();
  const [bills, setBills] = useState(MOCK_PAYABLES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billToDelete, setBillToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.charAt(0).toUpperCase() + category.slice(1));
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleCreateBill = (data: any) => {
    if (selectedBill && !isViewModalOpen) {
        setBills(prev => prev.map(b => b.id === selectedBill.id ? { ...b, ...data } : b));
        toast.success("Bill updated successfully!");
    } else {
        const newBill = {
            ...data,
            id: bills.length + 1,
        };
        setBills(prev => [newBill, ...prev]);
        toast.success("Bill recorded successfully!");
    }
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setIsViewModalOpen(true);
  };

  const handleEditBill = (bill: any) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleDeleteBill = (id: number) => {
    setBillToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (billToDelete) {
      setBills(prev => prev.filter(b => b.id !== billToDelete));
      toast.success("Bill deleted successfully");
      setIsDeleteModalOpen(false);
      setBillToDelete(null);
    }
  };

  const filteredBills = activeTab === "All" 
    ? bills 
    : bills.filter(b => b.category === activeTab.toLowerCase());

  return (
    <>
      <Navbar title="Payables (Vendors)" breadcrumb={["Accountant", "Finance", "Payables"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
              {activeTab === "All" ? "Outgoing Payables" : `${activeTab} Obligations`}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track supplier invoices and contractor payment obligations.</p>
          </div>
          <button
            onClick={() => { setSelectedBill(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Add New Bill
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Vendor & Contractor Bills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Outstanding dues and payment obligations</p>
            </div>
            <button
              onClick={() => {
                const rows = filteredBills.map(b => [
                  `"${b.vendor_name}"`, b.bill_number, `"${b.item}"`, b.quantity, b.rate, b.payable_amount, b.status, b.due_date
                ].join(','));
                const csv = ['Vendor,Bill No,Item,Qty,Rate,Payable (INR),Status,Due Date', ...rows].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Payables_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
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
                            <th className="px-6 py-4">Vendor Name</th>
                            <th className="px-6 py-4">Bill Number</th>
                            <th className="px-6 py-4">Material / Service</th>
                            <th className="px-6 py-4 text-right">Quantity</th>
                            <th className="px-6 py-4 text-right">Rate</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-right">GST</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-800">Payable Amount</th>
                            <th className="px-6 py-4">Payment Status</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredBills.map(bill => (
                            <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{bill.vendor_name}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{bill.bill_number}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]" title={bill.item}>{bill.item}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-right">{bill.quantity}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{bill.rate.toLocaleString("en-IN")}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{bill.total_amount.toLocaleString("en-IN")}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{bill.gst.toLocaleString("en-IN")}</td>
                                <td className="px-6 py-4 text-sm font-black text-slate-800 text-right">₹{bill.payable_amount.toLocaleString("en-IN")}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                                        bill.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                                        bill.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                    }`}>{bill.status}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{bill.due_date}</td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleViewBill(bill)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button onClick={() => handleEditBill(bill)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteBill(bill.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
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

      <CreateBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBill}
      />

      <ViewBillModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        bill={selectedBill}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Bill"
        message="Are you sure you want to delete this bill? This action cannot be undone."
        confirmText="Delete Bill"
        type="danger"
      />
    </>
  );
};

export default PayablesPage;
