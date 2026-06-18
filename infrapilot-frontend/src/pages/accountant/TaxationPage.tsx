import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// --- SECTIONS ---

// 1. Dashboard
const DashboardSection = () => {
  const kpis = [
    { label: "GST Payable", value: "₹4.5L", icon: "📈", accent: "from-rose-500 to-pink-500", sub: "Output GST" },
    { label: "GST Receivable (ITC)", value: "₹6.2L", icon: "📉", accent: "from-emerald-500 to-teal-500", sub: "Input GST" },
    { label: "TDS Payable", value: "₹1.8L", icon: "✂️", accent: "from-amber-500 to-orange-500", sub: "Due by 7th" },
    { label: "Net GST Liability", value: "₹0", icon: "⚖️", accent: "from-indigo-500 to-blue-500", sub: "ITC > Payable" },
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
          <h3 className="text-base font-bold text-slate-800 mb-5">Pending Returns & Deadlines</h3>
          <div className="space-y-3">
            {[
              { form: "GSTR-1", desc: "Outward Supplies", due: "11th May 2024", status: "Due in 3 Days", color: "text-rose-500" },
              { form: "GSTR-3B", desc: "Summary Return", due: "20th May 2024", status: "Pending", color: "text-amber-500" },
              { form: "TDS Payment", desc: "Non-Salary (Sec 194C)", due: "7th May 2024", status: "Overdue", color: "text-rose-600 font-bold" },
            ].map((t, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">{t.form}</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{t.desc}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Due: {t.due}</p>
                  </div>
                </div>
                <p className={`text-[10px] uppercase tracking-wider ${t.color}`}>{t.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5">Recent Tax Entries</h3>
          <div className="space-y-3">
            {[
              { type: "ITC Claimed", party: "UltraTech Cement", amt: "₹45,000", date: "Today" },
              { type: "TDS Deducted", party: "Ramesh Contractor", amt: "₹10,000", date: "Yesterday" },
              { type: "Output GST", party: "Apex Developers", amt: "₹1,80,000", date: "2 Days Ago" },
            ].map((t, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{t.party}</h4>
                  <p className="text-xs font-semibold text-primary mt-0.5">{t.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{t.amt}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. GST Invoices
const GSTInvoiceModal = ({ isOpen, onClose, type }: { isOpen: boolean; onClose: () => void; type: string }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create ${type} Invoice`}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => { toast.success(`${type} Invoice Recorded!`); onClose(); }} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">
            Save Record
          </button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); toast.success(`${type} Invoice Recorded!`); onClose(); }} className="space-y-6">
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Vendor Name *</label><input type="text" placeholder="Select Party" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party GSTIN *</label><input type="text" placeholder="27ABCDE1234F1Z5" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number *</label><input type="text" placeholder="INV-001" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label><input type="text" placeholder="Select Project" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
          Tax Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Amount (₹) *</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Rate (%) *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option>18%</option><option>12%</option><option>5%</option><option>28%</option><option>Exempt</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CGST</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SGST</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IGST</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total GST</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-indigo-50 text-indigo-700 font-bold" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
          Attachment
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Copy</label>
            <input type="file" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Document</label>
            <input type="file" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
        </div>
      </div>
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Invoice Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500"><span>Taxable Amount</span><span className="font-semibold text-slate-700">—</span></div>
            <div className="flex justify-between text-xs text-indigo-500"><span>Total GST</span><span className="font-semibold">—</span></div>
            <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-3"><span>Invoice Total</span><span>—</span></div>
          </div>
        </div>
      </div>
      </form>
    </Modal>
  );
};

const GSTInvoicesWrapperSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Sales" | "Purchase">("Sales");

  const openModal = (type: "Sales" | "Purchase") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">Invoice Register</h2>
          <p className="text-xs text-slate-500">View and manage all GST invoices</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal("Purchase")} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">
            + Purchase Invoice
          </button>
          <button onClick={() => openModal("Sales")} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all shadow-sm">
            + Sales Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Date", "Invoice No", "Type", "Party Name", "GSTIN", "Taxable Amt", "Total GST", "Invoice Total", "Attachments", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-500">2026-05-12</td>
                <td className="px-4 py-3 text-xs font-bold text-primary">INV-001</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-[10px] uppercase">Sales</span></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">Apex Developers</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">27XYZAQ9876P1Z2</td>
                <td className="px-4 py-3 text-xs text-right">₹10,00,000</td>
                <td className="px-4 py-3 text-xs text-right">₹1,80,000</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹11,80,000</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-slate-500 hover:text-primary cursor-pointer" title="Invoice Copy">📄</span>
                    <span className="flex items-center gap-1 text-slate-500 hover:text-primary cursor-pointer" title="GST Document">📑</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-primary">👁</button>
                    <button className="text-slate-400 hover:text-primary">✏️</button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-500">2026-05-10</td>
                <td className="px-4 py-3 text-xs font-bold text-primary">INV-UTC-991</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Purchase</span></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">UltraTech Cement</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">27ABCDE1234F1Z5</td>
                <td className="px-4 py-3 text-xs text-right">₹5,00,000</td>
                <td className="px-4 py-3 text-xs text-right">₹1,40,000</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹6,40,000</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-slate-500 hover:text-primary cursor-pointer" title="Invoice Copy">📄</span>
                    <span className="flex items-center gap-1 text-slate-400 cursor-not-allowed" title="No GST Document">➖</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-primary">👁</button>
                    <button className="text-slate-400 hover:text-primary">✏️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <GSTInvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
      />
    </div>
  );
};

// 3. GST Returns
const GSTReturnsWrapperSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "gstr1");

  const tabs = [
    { key: "gstr1", label: "GSTR-1" },
    { key: "gstr3b", label: "GSTR-3B" },
    { key: "gstr2a", label: "GSTR-2A Recon" },
    { key: "gstr2b", label: "GSTR-2B Recon" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>
            {t.label}
          </button>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          File / Track {tabs.find(t=>t.key===activeSubTab)?.label}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return Type</label><input type="text" value={tabs.find(t=>t.key===activeSubTab)?.label} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Period</label>
            <input type="month" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Date</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-amber-600">
              <option>Draft</option><option>Pending</option><option>Filed</option><option>Rejected</option><option>Revised</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Value</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Liability</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ITC Available</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-indigo-50 font-bold text-indigo-700" /></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={() => toast.success("Return status updated")} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all">Update Record</button>
        </div>
      </div>
    </div>
  );
};

// 4. Input GST (Purchases)
const InputGSTSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100">
      <h3 className="font-bold text-slate-800">Input GST (Purchase Side)</h3>
      <p className="text-xs text-slate-400 mt-0.5">Material Purchases, Vendor Bills, Equipment</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            {["Date", "Vendor Name", "GSTIN", "Invoice No", "Taxable Amount", "GST Amount", "ITC Eligible", "ITC Claimed"].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs text-slate-500">2024-05-10</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800">UltraTech Cement</td>
            <td className="px-4 py-3 text-xs font-mono text-slate-500">27ABCDE1234F1Z5</td>
            <td className="px-4 py-3 text-xs font-semibold text-primary">INV-UTC-991</td>
            <td className="px-4 py-3 text-xs text-right">₹5,00,000</td>
            <td className="px-4 py-3 text-xs text-indigo-600 text-right font-bold">₹1,40,000</td>
            <td className="px-4 py-3 text-xs text-emerald-600 text-center font-bold">Yes</td>
            <td className="px-4 py-3 text-xs text-center">
              <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Claimed</option>
                <option>Pending</option>
                <option>Hold</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// 5. Output GST (Sales)
const OutputGSTSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100">
      <h3 className="font-bold text-slate-800">Output GST (Sales Side)</h3>
      <p className="text-xs text-slate-400 mt-0.5">Client Invoices, RA Bills, Service Charges</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            {["Date", "Client Name", "GSTIN", "Invoice No", "Taxable Amount", "GST Collected", "Total Invoice"].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs text-slate-500">2024-05-12</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800">Apex Developers</td>
            <td className="px-4 py-3 text-xs font-mono text-slate-500">27XYZAQ9876P1Z2</td>
            <td className="px-4 py-3 text-xs font-semibold text-primary">RA-BILL-009</td>
            <td className="px-4 py-3 text-xs text-right">₹10,00,000</td>
            <td className="px-4 py-3 text-xs text-rose-600 text-right font-bold">₹1,80,000</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹11,80,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// 6. TDS Management
const TDSManagementSection = () => (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div className="xl:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center justify-center">✂️</span>
          TDS Deduction Entry
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Name *</label><input type="text" placeholder="Contractor/Consultant Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Number *</label><input type="text" placeholder="ABCDE1234F" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</label><input type="text" placeholder="INV-001" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
          
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Section (Construction Specific) *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option>194C - Contractor Payments</option>
              <option>194J - Professional Fees</option>
              <option>194J - Consultancy Charges</option>
              <option>194I - Equipment Rental</option>
              <option>194C - Subcontractor Payments</option>
            </select>
          </div>

          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Rate (%)</label><input type="number" placeholder="1 or 2 or 10" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Amount (₹)</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-amber-50 text-amber-700 font-bold" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Date</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>
    </div>
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Summary</h3>
        <button onClick={() => toast.success("TDS Entry Saved!")} className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-md">
          Record TDS Deduction
        </button>
      </div>
    </div>
  </div>
);

// 7. GST Reconciliation
const TaxReconciliationSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div>
        <h3 className="font-bold text-slate-800">GST Reconciliation</h3>
        <p className="text-xs text-slate-500 mt-0.5">Match ERP data with Portal (2A/2B)</p>
      </div>
      <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">Download Mismatch Report</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white border-b border-slate-100">
          <tr>
            {["Invoice No", "Vendor", "GST (ERP)", "GST (Portal)", "Difference", "Status", "Actions"].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs font-bold text-primary">INV-UTC-991</td>
            <td className="px-4 py-3 text-xs text-slate-700">UltraTech Cement</td>
            <td className="px-4 py-3 text-xs text-right font-mono">₹1,40,000</td>
            <td className="px-4 py-3 text-xs text-right font-mono">₹1,40,000</td>
            <td className="px-4 py-3 text-xs text-right font-mono text-emerald-500">₹0</td>
            <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Matched</span></td>
            <td className="px-4 py-3 text-xs">
              <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Select Action</option>
                <option>Match</option>
                <option>Mismatch</option>
                <option>Reconcile</option>
                <option>Download Report</option>
              </select>
            </td>
          </tr>
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs font-bold text-primary">INV-STEEL-44</td>
            <td className="px-4 py-3 text-xs text-slate-700">Jindal Steel</td>
            <td className="px-4 py-3 text-xs text-right font-mono">₹85,000</td>
            <td className="px-4 py-3 text-xs text-right font-mono">₹80,000</td>
            <td className="px-4 py-3 text-xs text-right font-mono text-rose-500 font-bold">-₹5,000</td>
            <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px] uppercase">Mismatch</span></td>
            <td className="px-4 py-3 text-xs">
              <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary" defaultValue="Reconcile">
                <option>Select Action</option>
                <option>Match</option>
                <option>Mismatch</option>
                <option>Reconcile</option>
                <option>Download Report</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// 8. Reports Wrapper
const ReportsWrapperSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "summary");

  const tabs = [
    { key: "summary", label: "GST Summary" },
    { key: "input", label: "Input GST Report" },
    { key: "output", label: "Output GST Report" },
    { key: "tds", label: "TDS Report" },
    { key: "return", label: "GST Return Report" },
    { key: "audit", label: "Tax Audit Report" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <PlaceholderSection title={tabs.find(t=>t.key===activeSubTab)?.label || "Report"} />
    </div>
  );
};

// 9. Placeholder
const PlaceholderSection = ({ title }: { title: string }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
    <div className="text-4xl mb-4">🚧</div><h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm mt-1">This section is being built.</p>
  </div>
);

// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "invoices" | "returns" | "input" | "output" | "tds" | "reconciliation" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",      label: "Dashboard",       icon: "📊" },
  { key: "invoices",       label: "GST Invoices",    icon: "📄" },
  { key: "returns",        label: "GST Returns",     icon: "🔄" },
  { key: "input",          label: "Input GST",       icon: "⬇️" },
  { key: "output",         label: "Output GST",      icon: "⬆️" },
  { key: "tds",            label: "TDS Mgmt",        icon: "✂️" },
  { key: "reconciliation", label: "Reconciliation",  icon: "⚖️" },
  { key: "reports",        label: "Reports",         icon: "📉" },
];

const TaxationPage = () => {
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
      "invoices": "invoices",
      "returns": "returns",
      "input": "input",
      "output": "output",
      "tds": "tds",
      "reconciliation": "reconciliation",
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
    navigate(`/accountant/taxation/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="GST & Taxation" breadcrumb={["Accountant", "Taxation"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Compliance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">GST & Taxation</h1>
            <p className="text-slate-500 text-sm mt-1">Manage GST invoices, returns, TDS deductions, and reconciliations.</p>
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Taxation</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"      && <DashboardSection />}
        {activeTab === "invoices"       && <GSTInvoicesWrapperSection key={subTab || "sales"} />}
        {activeTab === "returns"        && <GSTReturnsWrapperSection initialSubTab={subTab} key={subTab || "gstr1"} />}
        {activeTab === "input"          && <InputGSTSection />}
        {activeTab === "output"         && <OutputGSTSection />}
        {activeTab === "tds"            && <TDSManagementSection />}
        {activeTab === "reconciliation" && <TaxReconciliationSection />}
        {activeTab === "reports"        && <ReportsWrapperSection initialSubTab={subTab} key={subTab || "summary"} />}
      </PageTransition>
    </>
  );
};

export default TaxationPage;
