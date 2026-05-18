import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateAssetModal from "../../components/forms/CreateAssetModal";
import ViewAssetModal from "../../components/forms/ViewAssetModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";


const MOCK_FIXED_ASSETS = [
  { 
    id: 1, 
    type: "register", 
    asset_name: "JCB Excavator 3DX",
    category: "Heavy Machinery", 
    purchase_date: "2023-01-15", 
    cost: 3200000,
    depreciation_rate: 15, // percentage
    current_value: 2720000,
    location: "Site Alpha - Mumbai"
  },
  { 
    id: 2, 
    type: "depreciation", 
    asset_name: "Office Laptops (x5)",
    category: "IT Equipment", 
    purchase_date: "2023-06-10", 
    cost: 450000,
    depreciation_rate: 33.33, // percentage
    current_value: 300000,
    location: "Head Office"
  },
  { 
    id: 3, 
    type: "register", 
    asset_name: "Concrete Mixer",
    category: "Construction Equipment", 
    purchase_date: "2024-02-20", 
    cost: 150000,
    depreciation_rate: 10, // percentage
    current_value: 150000, // No depreciation applied yet
    location: "Site Beta - Pune"
  }
];

const FixedAssetsPage = () => {
  const { category } = useParams<{ category: string }>();
  const [records, setRecords] = useState(MOCK_FIXED_ASSETS);
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

  const handleCreateAsset = (data: any) => {
    if (selectedRecord && !isViewModalOpen) {
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r));
        toast.success("Asset record updated!");
    } else {
        const newRecord = {
            ...data,
            id: records.length + 1,
        };
        setRecords(prev => [newRecord, ...prev]);
        toast.success("Asset registered successfully!");
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
      toast.success("Asset record deleted successfully");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const filtered = activeTab === "All" 
    ? records 
    : records.filter(t => t.type === activeTab || (activeTab === 'depreciation' && t.depreciation_rate > 0) || (activeTab === 'register'));

  const formatTitle = (tab: string) => {
    switch(tab) {
        case 'register': return 'Asset Registry';
        case 'depreciation': return 'Depreciation Schedule';
        default: return 'Fixed Assets Management';
    }
  };

  return (
    <>
      <Navbar title="Fixed Assets" breadcrumb={["Accountant", "Assets", "Register"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Track company machinery, equipment, and calculate depreciation.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add Asset
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-6 py-5">Asset Details</th>
                            <th className="px-6 py-5">Location</th>
                            <th className="px-6 py-5 text-right">Purchase Details</th>
                            <th className="px-6 py-5 text-right">Depreciation</th>
                            <th className="px-6 py-5 text-right">Current Value</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center font-black text-[10px] shadow-sm">AST</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{record.asset_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <p className="text-xs font-bold">{record.location}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-700">₹{record.cost.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{record.purchase_date}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-wider border border-rose-100">
                                            {record.depreciation_rate}% P.A.
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-400">Acc: ₹{(record.cost - record.current_value).toLocaleString()}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-emerald-600">₹{record.current_value.toLocaleString()}</p>
                                </td>
                                 <td className="px-6 py-5 text-right">
                                     <div className="flex items-center justify-end gap-2 opacity-100">
                                         <button 
                                           onClick={() => handleViewRecord(record)}
                                           className="p-1.5 text-slate-400 hover:text-primary transition-all"
                                           title="View Details"
                                         >
                                             <Eye className="w-4 h-4" />
                                         </button>
                                         <button 
                                           onClick={() => handleEditRecord(record)}
                                           className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                                           title="Edit Record"
                                         >
                                             <Edit2 className="w-4 h-4" />
                                         </button>
                                         <button 
                                           onClick={() => handleDeleteRecord(record.id)}
                                           className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                                           title="Delete Asset"
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

      <CreateAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAsset}
      />

      <ViewAssetModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Asset Record"
        message="Are you sure you want to delete this asset from the registry? This will remove all depreciation history associated with it."
        confirmText="Delete Asset"
        type="danger"
      />
    </>
  );
};

export default FixedAssetsPage;
