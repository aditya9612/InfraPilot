import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// --- GENERIC COMPONENTS ---
const GenericTableSection = ({ title, columns, data }: { title: string; columns: string[]; data: any[][] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">{title}</h3></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{columns.map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- SECTIONS ---
const DashboardSection = () => {
  const kpis = [
    { label: "Total Asset Value", value: "₹4.5 Cr", icon: "🏢", accent: "from-blue-500 to-indigo-500", sub: "Gross Block" },
    { label: "Active Assets", value: "142", icon: "✅", accent: "from-emerald-500 to-teal-500", sub: "Currently Deployed" },
    { label: "Under Maintenance", value: "8", icon: "🔧", accent: "from-amber-500 to-orange-500", sub: "Machinery/Vehicles" },
    { label: "Depreciation Value", value: "₹45.2 L", icon: "📉", accent: "from-rose-500 to-pink-500", sub: "Accumulated YTD" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.accent} flex items-center justify-center text-xl mb-4 shadow-sm text-white`}>{k.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5">Asset Value by Category</h3>
          <div className="space-y-4">
            {[
              { cat: "Construction Machinery", val: "₹2.1 Cr", pct: 45, color: "bg-blue-500" },
              { cat: "Vehicles", val: "₹1.2 Cr", pct: 25, color: "bg-indigo-500" },
              { pos: "Buildings & Land", val: "₹80 L", pct: 20, color: "bg-emerald-500" },
              { cat: "Office & IT Assets", val: "₹40 L", pct: 10, color: "bg-amber-500" }
            ].map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>{c.cat || c.pos}</span><span>{c.val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`${c.color} h-2.5 rounded-full`} style={{ width: `${c.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <GenericTableSection 
          title="Recent Additions" 
          columns={["Asset ID", "Name", "Category", "Cost"]} 
          data={[
            ["AST-2024-088", "Tata Prima Tipper", "Vehicles", "₹35,00,000"],
            ["AST-2024-089", "Concrete Mixer 2", "Machinery", "₹8,50,000"]
          ]} 
        />
      </div>
    </div>
  );
};

const AddAssetModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Add New Asset"
    maxWidth="max-w-4xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Asset added to Register!"); onClose(); }} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Create Asset</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset ID *</label><input type="text" readOnly value="AST-2024-090" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label><input type="text" placeholder="e.g. CAT 320 Excavator" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Construction Machinery</option><option>Vehicles</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Owned</option><option>Leased</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Number / VIN</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono uppercase" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
          Purchase Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Cost (₹)</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Amount (₹)</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost (₹)</label><input type="number" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-bold text-emerald-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
          Asset Location
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Metro Line 3</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Location</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Civil</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</label><input type="text" placeholder="Employee Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
          Depreciation Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Method *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Straight Line Method (SLM)</option><option>Written Down Value (WDV)</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Rate (%) *</label><input type="number" defaultValue="15" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Useful Life (Years) *</label><input type="number" defaultValue="10" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salvage Value (₹) *</label><input type="number" defaultValue="50000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>
    </form>
  </Modal>
);

const AssetRegisterWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tabs = [{ key: "list", label: "Asset List" }, { key: "details", label: "Asset Details" }, { key: "transfer", label: "Asset Transfer" }];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Add Asset
        </button>
      </div>
      
      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeSubTab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>Active</option></select></div>
            <button className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Filter</button>
          </div>
          <GenericTableSection title="Asset List" columns={["Asset ID", "Asset Name", "Category", "Cost", "Current Value", "Location", "Status"]} data={[
            ["AST-2024-001", "CAT 320 Excavator", "Machinery", "₹65,00,000", "₹55,25,000", "Metro Line 3", "Active"],
            ["AST-2024-002", "Tata Prima Tipper", "Vehicles", "₹35,00,000", "₹29,75,000", "Highway Proj", "Active"]
          ]} />
        </div>
      )}
      {activeSubTab === "details" && <GenericTableSection title="Asset Details Lookup" columns={["Asset ID", "Name", "Purchase Date", "Useful Life", "Method", "Salvage Value"]} data={[["AST-2024-001", "CAT 320 Excavator", "2023-01-15", "10 Years", "SLM", "₹5,00,000"]]} />}
      {activeSubTab === "transfer" && <AssetTransferForm />}
    </div>
  );
};

const DepreciationWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "monthly");
  const tabs = [
    { key: "setup", label: "Depreciation Setup" },
    { key: "monthly", label: "Monthly Depreciation" },
    { key: "annual", label: "Annual Depreciation" },
    { key: "history", label: "Depreciation History" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      
      {activeSubTab === "setup" && <GenericTableSection title="Depreciation Methods Configured" columns={["Asset Category", "Method", "Rate (%)", "Status"]} data={[["Vehicles", "SLM", "15", "Active"], ["Machinery", "WDV", "20", "Active"]]} />}
      
      {activeSubTab === "monthly" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Depreciation Processing</h3>
              <p className="text-xs text-slate-500 mt-1">Review and process depreciation for current month</p>
            </div>
            <button onClick={() => toast.success("Depreciation Journal Entries Created!")} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">Process & Auto Journal Entry</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Auto Journal Entry Preview</h3>
            <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 max-w-2xl">
              <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Depreciation Expense A/c</span><span>Dr</span><span>₹1,25,000</span></div>
              <div className="flex justify-between pl-8"><span>To Accumulated Depreciation A/c</span><span>Cr</span><span>₹1,25,000</span></div>
            </div>
          </div>
          <GenericTableSection 
            title="Monthly Depreciation Schedule" 
            columns={["Asset", "Purchase Cost", "Depreciation Rate", "Current Value", "Monthly Depreciation"]} 
            data={[
              ["CAT 320 Excavator", "₹65,00,000", "15% (SLM)", "₹55,25,000", "₹81,250"],
              ["Tata Prima Tipper", "₹35,00,000", "15% (SLM)", "₹29,75,000", "₹43,750"]
            ]} 
          />
        </div>
      )}
      
      {activeSubTab === "annual" && <GenericTableSection title="Annual Depreciation Summary" columns={["Financial Year", "Total Gross Block", "Depreciation Claimed", "Net Block"]} data={[["2023-24", "₹4,50,00,000", "₹45,20,000", "₹4,04,80,000"]]} />}
      {activeSubTab === "history" && <GenericTableSection title="Depreciation Entry History" columns={["Date", "Journal No", "Amount", "Period", "Status"]} data={[["2024-10-31", "JE-DEP-010", "₹1,25,000", "October 2024", "Posted"]]} />}
    </div>
  );
};

const AssetMaintenanceWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "schedule");
  const tabs = [
    { key: "schedule", label: "Maintenance Schedule" },
    { key: "history", label: "Service History" },
    { key: "cost", label: "Repair Cost" },
    { key: "amc", label: "AMC Tracking" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      
      {activeSubTab === "schedule" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Log Maintenance</h3>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>CAT 320 Excavator</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Vendor</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance Cost (₹) *</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Service Date</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="e.g. Engine overhaul" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <button onClick={() => toast.success("Maintenance logged!")} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">Log Service</button>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
            <GenericTableSection title="Upcoming Maintenance" columns={["Asset", "Due Date", "Service Type", "Status"]} data={[["Concrete Mixer 2", "2024-12-02", "Oil change", "Pending"]]} />
          </div>
        </div>
      )}
      
      {activeSubTab === "history" && <GenericTableSection title="Service History Log" columns={["Date", "Asset", "Vendor", "Cost", "Next Due", "Remarks"]} data={[["2024-10-15", "CAT 320 Excavator", "ABC Heavy Machinery Repair", "₹45,000", "2025-04-15", "Routine servicing"]]} />}
      {activeSubTab === "cost" && <GenericTableSection title="Repair Cost Analysis" columns={["Asset Category", "YTD Maintenance Cost", "Avg Cost/Asset"]} data={[["Construction Machinery", "₹1,20,000", "₹24,000"], ["Vehicles", "₹45,000", "₹15,000"]]} />}
      {activeSubTab === "amc" && <GenericTableSection title="AMC Tracking" columns={["Vendor", "Asset Covered", "AMC Start", "AMC End", "Amount"]} data={[["Reliable IT Services", "Office Computers (x20)", "2024-01-01", "2024-12-31", "₹50,000"]]} />}
    </div>
  );
};

const AssetTransferForm = () => (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div className="xl:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Transfer Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>CAT 320 Excavator (AST-2024-001)</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</label><input type="text" readOnly value="Current Location" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Destination *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Select Destination</option></select></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="Reason for transfer" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>
    </div>
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Process Transfer</h3>
        <button onClick={() => toast.success("Asset Transferred!")} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md">
          Execute Transfer
        </button>
      </div>
    </div>
  </div>
);

const AssetTransfersWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "site");
  const tabs = [
    { key: "site", label: "Site Transfer" },
    { key: "department", label: "Department Transfer" },
    { key: "history", label: "Asset Movement History" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      
      {activeSubTab === "site" && (
        <div className="space-y-6">
          <h2 className="font-bold text-slate-800 px-1">Inter-Site Asset Transfer</h2>
          <AssetTransferForm />
        </div>
      )}
      
      {activeSubTab === "department" && (
        <div className="space-y-6">
          <h2 className="font-bold text-slate-800 px-1">Inter-Department Asset Transfer</h2>
          <AssetTransferForm />
        </div>
      )}
      
      {activeSubTab === "history" && <GenericTableSection title="Asset Movement History" columns={["Date", "Asset", "From", "To", "Type", "Approved By"]} data={[["2024-09-01", "CAT 320 Excavator", "Project A", "Metro Line 3", "Site Transfer", "Rahul Verma"]]} />}
    </div>
  );
};

const AssetDisposalWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "sale");
  const tabs = [
    { key: "sale", label: "Asset Sale" },
    { key: "scrap", label: "Asset Scrap" },
    { key: "writeoff", label: "Asset Write-Off" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
              {tabs.find(t=>t.key===activeSubTab)?.label} Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Old Concrete Mixer (AST-2018-012)</option></select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disposal Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              
              {activeSubTab === "sale" && (
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sale Value (₹)</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              )}
              {activeSubTab === "scrap" && (
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Value (₹)</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              )}
              
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gain/Loss (₹)</label><input type="text" readOnly placeholder="Auto-calculated" className="w-full px-3 py-2 text-sm border border-slate-100 rounded-xl bg-slate-50 font-bold" /></div>
              
              <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="Reason for disposal" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5">Process Disposal</h3>
            <button onClick={() => toast.success("Asset Disposed!")} className="w-full bg-rose-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-md">
              Execute {tabs.find(t=>t.key===activeSubTab)?.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportsWrapperSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const tabs = [
    { key: "register", label: "Asset Register Report" },
    { key: "depreciation", label: "Depreciation Report" },
    { key: "valuation", label: "Asset Valuation Report" },
    { key: "maintenance", label: "Maintenance Report" },
    { key: "disposal", label: "Disposal Report" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">{tabs.find(t=>t.key===activeSubTab)?.label}</h3><button className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm">Download PDF</button></div>
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="text-4xl mb-3">📊</div>
          <h4 className="text-sm font-bold text-slate-800">Report Generated</h4>
          <p className="text-xs text-slate-500 mt-1">Data from the current financial year is available in this view.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>{["Asset ID", "Name", "Category", "Cost", "Value"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <tr className="hover:bg-slate-50/50"><td className="px-4 py-3 text-xs text-slate-500 font-mono">AST-2024-001</td><td className="px-4 py-3 text-xs font-semibold text-slate-800">CAT 320 Excavator</td><td className="px-4 py-3 text-xs text-slate-600">Machinery</td><td className="px-4 py-3 text-xs font-bold text-slate-600">₹65,00,000</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">₹55,25,000</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
type TabKey = "dashboard" | "register" | "categories" | "depreciation" | "maintenance" | "transfers" | "disposal" | "ledger" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",    label: "Dashboard",       icon: "📊" },
  { key: "register",     label: "Asset Register",  icon: "🏢" },
  { key: "categories",   label: "Categories",      icon: "🏷️" },
  { key: "depreciation", label: "Depreciation",    icon: "📉" },
  { key: "maintenance",  label: "Maintenance",     icon: "🔧" },
  { key: "transfers",    label: "Transfers",       icon: "🔁" },
  { key: "disposal",     label: "Disposal",        icon: "🗑️" },
  { key: "ledger",       label: "Asset Ledger",    icon: "📖" },
  { key: "reports",      label: "Reports",         icon: "📈" },
];

const FixedAssetsPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "register": "register",
      "categories": "categories",
      "depreciation": "depreciation",
      "maintenance": "maintenance",
      "transfers": "transfers",
      "disposal": "disposal",
      "ledger": "ledger",
      "reports": "reports",
      "dashboard": "dashboard",
    };
    return map[currentSub || ""] || "dashboard";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/assets/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Fixed Assets Management" breadcrumb={["Accountant", "Fixed Assets"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Asset Tracking</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fixed Assets Management</h1>
            <p className="text-slate-500 text-sm mt-1">Track machinery, vehicles, equipment, and their depreciation.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fixed Assets</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"      && <DashboardSection />}
        {activeTab === "register"       && <AssetRegisterWrapper initialSubTab={subTab} key={subTab || "add"} />}
        {activeTab === "categories"     && <GenericTableSection title="Construction Asset Categories" columns={["Category", "Total Assets", "Gross Block Value", "Depreciation Method"]} data={[["Construction Machinery", "45", "₹2.1 Cr", "SLM 15%"], ["Vehicles", "20", "₹1.2 Cr", "SLM 15%"], ["Land & Buildings", "5", "₹80 L", "None/Varies"]]} />}
        {activeTab === "depreciation"   && <DepreciationWrapper initialSubTab={subTab} key={subTab || "monthly"} />}
        {activeTab === "maintenance"    && <AssetMaintenanceWrapper initialSubTab={subTab} key={subTab || "schedule"} />}
        {activeTab === "transfers"      && <AssetTransfersWrapper initialSubTab={subTab} key={subTab || "site"} />}
        {activeTab === "disposal"       && <AssetDisposalWrapper initialSubTab={subTab} key={subTab || "sale"} />}
        {activeTab === "ledger"         && <GenericTableSection title="Asset Ledger (CAT 320)" columns={["Date", "Ref No", "Particulars", "Debit", "Credit", "Balance"]} data={[["2023-01-15", "INV-889", "Purchase", "₹65,00,000", "—", "₹65,00,000 Dr"], ["2024-03-31", "JE-DEP-01", "Depreciation", "—", "₹9,75,000", "₹55,25,000 Dr"]]} />}
        {activeTab === "reports"        && <ReportsWrapperSection initialSubTab={subTab} key={subTab || "register"} />}
      </PageTransition>
    </>
  );
};

export default FixedAssetsPage;
