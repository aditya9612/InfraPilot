import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateTaxRecordModal from "../../components/forms/CreateTaxRecordModal";
import ViewTaxRecordModal from "../../components/forms/ViewTaxRecordModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_TAX_RECORDS = [
  { 
    id: 1, 
    type: "gst-invoices", 
    gstin: "27AADCB2230M1Z2",
    invoice_number: "INV-2024-001", 
    taxable_amount: 100000, 
    cgst: 9000,
    sgst: 9000,
    igst: 0,
    tds: 0,
    status: "Filed",
    date: "2024-03-31"
  },
  { 
    id: 2, 
    type: "tds", 
    gstin: "29BBENP1234N1Z5",
    invoice_number: "BILL/2024/401", 
    taxable_amount: 500000, 
    cgst: 0,
    sgst: 0,
    igst: 90000,
    tds: 10000,
    status: "Pending",
    date: "2024-04-05"
  },
  { 
    id: 3, 
    type: "gst-returns", 
    gstin: "27AADCB2230M1Z2",
    invoice_number: "GSTR-3B-MAR", 
    taxable_amount: 1500000, 
    cgst: 135000,
    sgst: 135000,
    igst: 50000,
    tds: 0,
    status: "Draft",
    date: "2024-04-15"
  }
];

const TaxationPage = () => {
  const { category } = useParams<{ category: string }>();
  const [records, setRecords] = useState(MOCK_TAX_RECORDS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.toLowerCase());
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleCreateRecord = (data: any) => {
    if (selectedRecord) {
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r));
        toast.success("Tax record updated!");
    } else {
        const newRecord = {
            ...data,
            id: records.length + 1,
        };
        setRecords(prev => [newRecord, ...prev]);
        toast.success("Tax record added successfully!");
    }
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      toast.success("Record deleted successfully");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const filtered = activeTab === "All" 
    ? records 
    : records.filter(t => t.type === activeTab);

  const formatTitle = (tab: string) => {
    switch(tab) {
        case 'gst-invoices': return 'GST Invoices';
        case 'gst-returns': return 'GST Returns';
        case 'tds': return 'TDS Records';
        default: return 'Taxation Records';
    }
  };

  return (
    <>
      <Navbar title="GST & Taxation" breadcrumb={["Accountant", "Compliance", "Taxation"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage GST compliance, returns, and statutory deductions.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add Tax Record
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Document Details</th>
                            <th className="px-6 py-5">GSTIN</th>
                            <th className="px-6 py-5 text-right">Taxable Value</th>
                            <th className="px-6 py-5 text-right">Taxes (C/S/I)</th>
                            <th className="px-6 py-5 text-right">TDS</th>
                            <th className="px-6 py-5">Filing Status</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{record.invoice_number}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.date}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 tracking-wider">
                                        {record.gstin}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-bold text-slate-700">₹{record.taxable_amount.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-0.5 text-[10px] font-black">
                                        <span className="text-slate-500">C: ₹{record.cgst.toLocaleString()}</span>
                                        <span className="text-slate-500">S: ₹{record.sgst.toLocaleString()}</span>
                                        <span className="text-primary">I: ₹{record.igst.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-rose-600">
                                        {record.tds > 0 ? `₹${record.tds.toLocaleString()}` : "-"}
                                    </p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shadow-sm ${
                                            record.status === "Filed" ? "bg-emerald-500 shadow-emerald-500/50" : 
                                            record.status === "Draft" ? "bg-amber-500 shadow-amber-500/50" : "bg-rose-500 shadow-rose-500/50"
                                        }`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            record.status === "Filed" ? "text-emerald-600" : 
                                            record.status === "Draft" ? "text-amber-600" : "text-rose-600"
                                        }`}>
                                            {record.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => handleViewRecord(record)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                          title="View Record"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleEditRecord(record)}
                                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                          title="Edit Record"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteRecord(record.id)}
                                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                          title="Delete Record"
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

      <CreateTaxRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRecord}
        initialData={selectedRecord}
      />

      <ViewTaxRecordModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this tax record? This action cannot be undone."
        confirmText="Delete Record"
        type="danger"
      />
    </>
  );
};

export default TaxationPage;
