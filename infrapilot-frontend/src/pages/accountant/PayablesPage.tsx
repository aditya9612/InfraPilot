import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateBillModal from "../../components/forms/CreateBillModal";
import ViewBillModal from "../../components/forms/ViewBillModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";

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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === "All" ? "Outgoing Payables" : `${activeTab} Obligations`}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Track supplier invoices and contractor payment obligations.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedBill(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add New Bill
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-6 py-5">Vendor / Bill Details</th>
                            <th className="px-6 py-5">Material / Service</th>
                            <th className="px-6 py-5 text-right">Base & Tax</th>
                            <th className="px-6 py-5 text-right">Total Payable</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredBills.map(bill => (
                            <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center font-black text-[10px] shadow-sm">
                                            {bill.category === "vendor" ? "VN" : "CT"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{bill.vendor_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bill.bill_number}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-600">{bill.item}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Qty: {bill.quantity} | Rate: ₹{bill.rate}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-xs font-bold text-slate-600">₹{bill.total_amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">GST: ₹{bill.gst.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{bill.payable_amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic mt-1 uppercase">Due: {bill.due_date}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            bill.status === "paid" ? "bg-emerald-500" : 
                                            bill.status === "partial" ? "bg-amber-500" : "bg-rose-500"
                                        }`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            bill.status === "paid" ? "text-emerald-600" : 
                                            bill.status === "partial" ? "text-amber-600" : "text-rose-600"
                                        }`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100">
                                        <button 
                                          onClick={() => handleViewBill(bill)}
                                          className="p-1.5 text-slate-400 hover:text-primary transition-all"
                                          title="View Bill"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleEditBill(bill)}
                                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                                          title="Edit Record"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteBill(bill.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                                          title="Delete Bill"
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
