import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
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
  const [bills, _setBills] = useState(MOCK_PAYABLES);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.charAt(0).toUpperCase() + category.slice(1));
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const filteredBills = activeTab === "All" 
    ? bills 
    : bills.filter(b => b.category === activeTab.toLowerCase());

  return (
    <>
      <Navbar title="Payables (Vendors)" breadcrumb={["Accountant", "Finance", "Payables"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {activeTab === "All" ? "All Outgoing Bills" : `${activeTab} Bills`}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Track supplier invoices and contractor payment obligations.</p>
          </div>
          <button 
            onClick={() => toast.success("Bill generation modal coming soon!")}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add New Bill
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Vendor / Bill Details</th>
                            <th className="px-6 py-5">Material / Service</th>
                            <th className="px-6 py-5 text-right">Financial Breakdown</th>
                            <th className="px-6 py-5 text-right">Payable Amount</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredBills.map(bill => (
                            <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{bill.vendor_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bill.bill_number}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-600">{bill.item}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Qty: {bill.quantity} | Rate: ₹{bill.rate}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-xs font-bold text-slate-600">Base: ₹{bill.total_amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">GST: ₹{bill.gst.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{bill.payable_amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Due: {bill.due_date}</p>
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
                                <td className="px-6 py-5 text-center">
                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
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

export default PayablesPage;
