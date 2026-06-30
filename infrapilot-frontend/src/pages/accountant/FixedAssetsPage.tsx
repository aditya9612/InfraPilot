import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
          <tr>{columns.map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
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
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Category *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Construction Machinery</option><option>Vehicles</option><option>Land & Buildings</option><option>Equipment</option><option>Office Assets</option><option>IT Assets</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type *</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Owned</option><option>Leased</option></select></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Serial Number</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono uppercase" /></div>
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
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Value (₹) *</label><input type="number" defaultValue="6500000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
        </div>
      </div>
    </form>
  </Modal>
);

const AssetRegisterWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tabs = [{ key: "list", label: "Asset List", icon: "📋" }, { key: "details", label: "Asset Details", icon: "ℹ️" }, { key: "transfer", label: "Asset Transfer", icon: "🔁" }];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Add Asset
        </button>
      </div>

      <AddAssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeSubTab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 mr-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">🔍</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Filter By:</span>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>Active</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</label><input type="date" className="px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-600" /></div>
            <button className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold mt-5">Apply</button>
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
    { key: "setup", label: "Depreciation Setup", icon: "⚙️" },
    { key: "monthly", label: "Monthly Depreciation", icon: "📅" },
    { key: "annual", label: "Annual Depreciation", icon: "🗓️" },
    { key: "history", label: "Depreciation History", icon: "⏳" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
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
    { key: "schedule", label: "Maintenance Schedule", icon: "📅" },
    { key: "history", label: "Service History", icon: "⏳" },
    { key: "cost", label: "Repair Cost", icon: "💸" },
    { key: "amc", label: "AMC Tracking", icon: "🛡️" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
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
    { key: "site", label: "Site Transfer", icon: "🏗️" },
    { key: "department", label: "Department Transfer", icon: "🏢" },
    { key: "history", label: "Asset Movement History", icon: "⏳" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.icon && <span>{t.icon}</span>}{t.label}</button>)}
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


// --- MAIN PAGE ---
type TabKey = "assets" | "depreciation" | "maintenance" | "transfers";

const TABS: { key: TabKey; label: string }[] = [
  { key: "assets", label: "Assets" },
  { key: "depreciation", label: "Depreciation" },
  { key: "maintenance", label: "Maintenance" },
  { key: "transfers", label: "Transfer" },
];

const FixedAssetsPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "assets": "assets",
      "depreciation": "depreciation",
      "maintenance": "maintenance",
      "transfers": "transfers",
    };
    return map[currentSub || ""] || "assets";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/assets/${key}`, { replace: true });
  };

  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    assets: {
      title: "Assets Register",
      subtitle: "Manage and track all company fixed assets.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button onClick={() => toast.success("Opening New Asset Form...")} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">+</span> New Asset
          </button>
        </div>
      ),
    },
    depreciation: {
      title: "Depreciation",
      subtitle: "Calculate and manage asset depreciation.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button onClick={() => toast.success("Running Depreciation...")} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">🔄</span> Run Depreciation
          </button>
        </div>
      ),
    },
    maintenance: {
      title: "Maintenance",
      subtitle: "Log and track asset maintenance activities.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button onClick={() => toast.success("Opening New Maintenance Log...")} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">+</span> Log Maintenance
          </button>
        </div>
      ),
    },
    transfers: {
      title: "Transfers",
      subtitle: "Manage transfer of assets across branches or projects.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button onClick={() => toast.success("Opening New Transfer...")} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">+</span> New Transfer
          </button>
        </div>
      ),
    },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Fixed Assets Management" breadcrumb={["Accountant", "Fixed Assets"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

        {/* ── Section Header ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentConfig.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{currentConfig.subtitle}</p>
          </div>
          {currentConfig.actions}
        </div>

        {/* ── Tab Navigation ─────────────────────────────── */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "assets" && <AssetRegisterWrapper />}
        {activeTab === "depreciation" && <DepreciationWrapper />}
        {activeTab === "maintenance" && <AssetMaintenanceWrapper />}
        {activeTab === "transfers" && <AssetTransfersWrapper />}
      </PageTransition>
    </>
  );
};

export default FixedAssetsPage;
