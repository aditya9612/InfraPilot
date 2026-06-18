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
    { label: "Total Entries", value: "1,245", icon: "📚", accent: "from-blue-500 to-indigo-500", sub: "This Financial Year" },
    { label: "Today's Entries", value: "32", icon: "📝", accent: "from-emerald-500 to-teal-500", sub: "12 Manual, 20 Auto" },
    { label: "Pending Approval", value: "8", icon: "⚖️", accent: "from-amber-500 to-orange-500", sub: "Needs Review" },
    { label: "Posted Entries", value: "1,237", icon: "✅", accent: "from-emerald-500 to-green-500", sub: "Fully reconciled" },
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-5">Monthly Journal Summary</h3>
        <div className="h-48 flex items-end justify-between px-2 gap-2">
          {[40, 60, 35, 80, 50, 90, 70, 85, 45, 65, 55, 75].map((h, i) => (
            <div key={i} className="w-full bg-slate-100 rounded-t-lg relative group">
              <div className="absolute bottom-0 w-full bg-indigo-400 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-400 uppercase">
          <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
        </div>
      </div>
    </div>
  );
};

const JournalEntryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Create Journal Entry"
    maxWidth="max-w-5xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Journal Entry Submitted for Approval!"); onClose(); }} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Submit Entry</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Entry Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Journal Number *</label><input type="text" readOnly value="JE-2024-1045" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number</label><input type="text" placeholder="e.g. INV-889" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Location</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
          Accounting Entry
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Account *</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Debit (₹)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit (₹)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Narration *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-2 py-2"><select className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"><option>Material Expense A/c</option></select></td>
                <td className="px-2 py-2"><input type="number" defaultValue="50000" className="w-full px-2 py-1.5 text-xs font-bold text-emerald-600 border border-slate-200 rounded-lg bg-slate-50" /></td>
                <td className="px-2 py-2"><input type="number" placeholder="0" disabled className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-100" /></td>
                <td className="px-2 py-2"><input type="text" defaultValue="Purchase of cement" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" /></td>
              </tr>
              <tr>
                <td className="px-2 py-2"><select className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"><option>HDFC Bank A/c</option></select></td>
                <td className="px-2 py-2"><input type="number" placeholder="0" disabled className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-100" /></td>
                <td className="px-2 py-2"><input type="number" defaultValue="50000" className="w-full px-2 py-1.5 text-xs font-bold text-rose-500 border border-slate-200 rounded-lg bg-slate-50" /></td>
                <td className="px-2 py-2"><input type="text" defaultValue="Paid via NEFT" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" /></td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-sm">
              <tr>
                <td className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-emerald-600">₹50,000</td>
                <td className="px-4 py-3 text-rose-500">₹50,000</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Line Item</button>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Attachments</h3>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-white transition-colors cursor-pointer bg-white">
          <div className="text-2xl mb-2">📎</div>
          <p className="text-xs font-bold text-slate-600">Upload Supporting Documents</p>
          <p className="text-[10px] text-slate-400 mt-1">Invoices, Receipts, Bills (PDF/JPG)</p>
        </div>
      </div>
    </form>
  </Modal>
);

const ManualEntriesWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800">Manual Journal Entries</h3>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Create Journal Entry
        </button>
      </div>
      <JournalEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <GenericTableSection 
        title="Recent Manual Entries" 
        columns={["Date", "Journal No", "Narration", "Amount", "Status"]} 
        data={[
          ["2024-11-01", "JE-2024-1045", "Purchase of cement", "₹50,000", "Pending Approval"]
        ]} 
      />
    </div>
  );
};

const AutoEntriesWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "bills");
  const tabs = [
    { key: "invoices", label: "Invoices" },
    { key: "bills", label: "Vendor Bills" },
    { key: "payroll", label: "Payroll" },
    { key: "payments", label: "Payments" },
    { key: "gst", label: "GST Entries" }
  ];

  const examples: Record<string, any[][]> = {
    "bills": [
      ["Material Expense A/c", "Dr", "₹1,00,000"],
      ["Input GST A/c", "Dr", "₹18,000"],
      ["Vendor Payable A/c", "Cr", "₹1,18,000"]
    ],
    "payroll": [
      ["Salary Expense A/c", "Dr", "₹5,00,000"],
      ["Salary Payable A/c", "Cr", "₹5,00,000"]
    ],
    "invoices": [
      ["Client Receivable A/c", "Dr", "₹5,90,000"],
      ["Project Revenue A/c", "Cr", "₹5,00,000"],
      ["Output GST A/c", "Cr", "₹90,000"]
    ]
  };

  const data = examples[activeSubTab] || examples["bills"];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Auto-Generated Entries: {tabs.find(t=>t.key===activeSubTab)?.label}</h3></div>
        <div className="p-6 bg-slate-50">
          <p className="text-xs text-slate-500 mb-4">Example mapping generated by the system when a {tabs.find(t=>t.key===activeSubTab)?.label.toLowerCase()} is processed:</p>
          <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-sm shadow-sm max-w-2xl">
            {data.map((row, i) => (
              <div key={i} className={`flex justify-between py-1.5 ${row[1] === "Cr" ? "pl-12 text-slate-600" : "text-slate-800 font-bold"}`}>
                <span>{row[0]} <span className="text-slate-400 ml-2">{row[1]}</span></span>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdjustmentEntriesWrapper = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-4">Year End Adjustments</h3>
      <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-600">
        <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Retained Earnings A/c</span><span>Dr</span></div>
        <div className="flex justify-between pl-8"><span>To P&L Summary A/c</span><span>Cr</span></div>
      </div>
      <button className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-all">Create Entry</button>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-4">Depreciation Entries</h3>
      <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-600">
        <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Depreciation Exp A/c</span><span>Dr</span></div>
        <div className="flex justify-between pl-8"><span>To Machinery A/c</span><span>Cr</span></div>
      </div>
      <button className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-all">Create Entry</button>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-4">Accrual Entries</h3>
      <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-600">
        <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Accrued Expenses A/c</span><span>Dr</span></div>
        <div className="flex justify-between pl-8"><span>To Outstanding Exp A/c</span><span>Cr</span></div>
      </div>
      <button className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-all">Create Entry</button>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-4">Salary Provision</h3>
      <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-600">
        <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Salary Expense A/c</span><span>Dr</span></div>
        <div className="flex justify-between pl-8"><span>To Salary Payable A/c</span><span>Cr</span></div>
      </div>
      <button className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-all">Create Entry</button>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-4">GST Provision</h3>
      <div className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-600">
        <div className="flex justify-between font-bold text-slate-800 mb-2"><span>GST Expense A/c</span><span>Dr</span></div>
        <div className="flex justify-between pl-8"><span>To GST Payable A/c</span><span>Cr</span></div>
      </div>
      <button className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-all">Create Entry</button>
    </div>
  </div>
);

const JournalApprovalSection = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Pending Approvals</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">8 Pending</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{["Journal No", "Date", "Amount", "Created By", "Status", "Actions"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50/50">
              <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">JE-2024-1088</td><td className="px-4 py-3 text-xs text-slate-600">2024-11-05</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">₹45,000</td><td className="px-4 py-3 text-xs text-slate-600">Amit Kumar</td>
              <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[10px] uppercase">Pending</span></td>
              <td className="px-4 py-3 text-xs flex gap-3">
                <button className="text-blue-600 font-bold hover:underline">View</button>
                <button className="text-emerald-600 font-bold hover:underline">Approve</button>
                <button className="text-rose-600 font-bold hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Approved Entries</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">12 Approved</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{["Journal No", "Date", "Amount", "Created By", "Status", "Actions"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50/50">
              <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">JE-2024-1085</td><td className="px-4 py-3 text-xs text-slate-600">2024-11-04</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">₹1,20,000</td><td className="px-4 py-3 text-xs text-slate-600">Rohan Das</td>
              <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Approved</span></td>
              <td className="px-4 py-3 text-xs flex gap-3">
                <button className="text-blue-600 font-bold hover:underline">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Rejected Entries</h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-bold text-xs">3 Rejected</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{["Journal No", "Date", "Amount", "Created By", "Status", "Actions"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50/50">
              <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">JE-2024-1082</td><td className="px-4 py-3 text-xs text-slate-600">2024-11-03</td><td className="px-4 py-3 text-xs font-bold text-rose-600">₹15,000</td><td className="px-4 py-3 text-xs text-slate-600">Amit Kumar</td>
              <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px] uppercase">Rejected</span></td>
              <td className="px-4 py-3 text-xs flex gap-3">
                <button className="text-blue-600 font-bold hover:underline">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const JournalRegisterSection = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-wrap gap-4 items-end">
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label><input type="date" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg" /></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg min-w-[150px]"><option>All Projects</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</label><input type="text" placeholder="Search account..." className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg" /></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Type</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Types</option><option>Manual</option><option>Auto</option></select></div>
      <button className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Filter</button>
    </div>
    <GenericTableSection 
      title="Journal Register" 
      columns={["Date", "Journal No", "Debit Account", "Credit Account", "Amount", "Type"]} 
      data={[
        ["2024-11-01", "JE-2024-1045", "Material Expense", "Vendor Payable", "₹50,000", "Auto"],
        ["2024-11-01", "JE-2024-1046", "Salary Expense", "Salary Payable", "₹2,50,000", "Auto"]
      ]} 
    />
  </div>
);

const AuditTrailSection = () => (
  <GenericTableSection 
    title="Audit Trail" 
    columns={["Journal No", "Created By", "Created Date", "Modified By", "Modified Date", "Approval Status"]} 
    data={[
      ["JE-2024-1045", "System", "2024-11-01 10:30 AM", "-", "-", "Approved"],
      ["JE-2024-1088", "Amit Kumar", "2024-11-05 14:15 PM", "Neha Sharma", "2024-11-05 15:00 PM", "Pending"]
    ]} 
  />
);

const ReportsWrapperSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "journal");
  const tabs = [
    { key: "journal", label: "Journal Report" },
    { key: "ledger", label: "Ledger Report" },
    { key: "trial", label: "Trial Balance" },
    { key: "audit", label: "Audit Trail Report" }
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
              <tr>{["Date", "Account", "Description", "Debit", "Credit", "Balance"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <tr className="hover:bg-slate-50/50"><td className="px-4 py-3 text-xs text-slate-500">2024-11-01</td><td className="px-4 py-3 text-xs font-semibold text-slate-800">Material Expense</td><td className="px-4 py-3 text-xs text-slate-600">Purchase of Cement</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">₹50,000</td><td className="px-4 py-3 text-xs text-slate-400">-</td><td className="px-4 py-3 text-xs font-bold text-slate-800">₹50,000 Dr</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
type TabKey = "dashboard" | "manual" | "auto" | "recurring" | "adjustments" | "reversing" | "approval" | "register" | "audit" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",   label: "Dashboard",       icon: "📊" },
  { key: "manual",      label: "Manual Entry",    icon: "✏️" },
  { key: "auto",        label: "Auto Entries",    icon: "⚙️" },
  { key: "recurring",   label: "Recurring",       icon: "🔁" },
  { key: "adjustments", label: "Adjustments",     icon: "🎛️" },
  { key: "reversing",   label: "Reversing",       icon: "↩️" },
  { key: "approval",    label: "Approval",        icon: "✅" },
  { key: "register",    label: "Register",        icon: "📖" },
  { key: "audit",       label: "Audit Trail",     icon: "🛡️" },
  { key: "reports",     label: "Reports",         icon: "📈" },
];

const JournalEntriesPage = () => {
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
      "manual": "manual",
      "auto": "auto",
      "recurring": "recurring",
      "adjustments": "adjustments",
      "reversing": "reversing",
      "approval": "approval",
      "register": "register",
      "audit": "audit",
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
    navigate(`/accountant/journal/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Journal Entries" breadcrumb={["Accountant", "Journal Entries"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Core Accounting</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Journal Entries</h1>
            <p className="text-slate-500 text-sm mt-1">Manage manual entries, adjustments, auto-generated journals, and approvals.</p>
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Journal Entries</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"      && <DashboardSection />}
        {activeTab === "manual"         && <ManualEntriesWrapper />}
        {activeTab === "auto"           && <AutoEntriesWrapper initialSubTab={subTab} key={subTab || "bills"} />}
        {activeTab === "recurring"      && <GenericTableSection title="Recurring Entries" columns={["Template Name", "Frequency", "Next Run Date", "Amount", "Status"]} data={[["Office Rent", "Monthly", "2024-12-01", "₹1,50,000", "Active"]]} />}
        {activeTab === "adjustments"    && <AdjustmentEntriesWrapper />}
        {activeTab === "reversing"      && <GenericTableSection title="Reversing Entries" columns={["Original Journal", "Reversal Date", "Reason", "Status"]} data={[["JE-2024-0995", "2024-11-01", "Accrual Reversal", "Completed"]]} />}
        {activeTab === "approval"       && <JournalApprovalSection />}
        {activeTab === "register"       && <JournalRegisterSection />}
        {activeTab === "audit"          && <AuditTrailSection />}
        {activeTab === "reports"        && <ReportsWrapperSection initialSubTab={subTab} key={subTab || "journal"} />}
      </PageTransition>
    </>
  );
};

export default JournalEntriesPage;
