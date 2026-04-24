import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

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
  const [records] = useState(MOCK_FIXED_ASSETS);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.toLowerCase());
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const filtered = activeTab === "All" 
    ? records 
    : records.filter(t => t.type === activeTab || (activeTab === 'depreciation' && t.depreciation_rate > 0) || (activeTab === 'register'));

  const formatTitle = (tab: string) => {
    switch(tab) {
        case 'register': return 'Asset Register';
        case 'depreciation': return 'Depreciation Schedule';
        default: return 'Fixed Assets Management';
    }
  };

  return (
    <>
      <Navbar title="Fixed Assets" breadcrumb={["Accountant", "Assets", "Register"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Track company machinery, equipment, and calculate depreciation.</p>
          </div>
          <button 
            onClick={() => toast.success("Asset addition modal coming soon!")}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add Asset
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Asset Name & Category</th>
                            <th className="px-6 py-5">Location</th>
                            <th className="px-6 py-5 text-right">Purchase Details</th>
                            <th className="px-6 py-5 text-right">Depreciation Details</th>
                            <th className="px-6 py-5 text-right">Current Value</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{record.asset_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.category}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <p className="text-sm font-bold text-slate-600">{record.location}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-700">₹{record.cost.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date: {record.purchase_date}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                            {record.depreciation_rate}% P.A.
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">Accumulated: ₹{(record.cost - record.current_value).toLocaleString()}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-emerald-600">₹{record.current_value.toLocaleString()}</p>
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

export default FixedAssetsPage;
