import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface GSTReturn {
  id: number;
  filing_period: string;
  return_type: string;
  taxable_value: number;
  gst_liability: number;
  itc_available: number;
  net_gst_payable: number;
  status: string;
  filing_date: string;
  created_at: string;
}

// --- SECTIONS ---

// 1. Dashboard
const DashboardSection = () => {
  const chartData = [
    { name: 'Jan', input: 12, output: 18 },
    { name: 'Feb', input: 15, output: 20 },
    { name: 'Mar', input: 18, output: 25 },
    { name: 'Apr', input: 14, output: 22 },
    { name: 'May', input: 21, output: 30 },
    { name: 'Jun', input: 25, output: 35 },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taxation</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">GST DASHBOARD</h2>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-100/50 text-emerald-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Input GST</p>
          <p className="text-xl font-bold text-slate-800">₹1.2 Cr</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-rose-100/50 text-rose-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Output GST</p>
          <p className="text-xl font-bold text-slate-800">₹1.8 Cr</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net GST</p>
          <p className="text-xl font-bold text-slate-800">₹60 Lakh</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-purple-100/50 text-purple-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TDS Collected</p>
          <p className="text-xl font-bold text-slate-800">₹15 Lakh</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-amber-100/50 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Return</p>
          <p className="text-xl font-bold text-slate-800">20th Jun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Monthly GST Graph</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}L`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`₹${value} Lakh`, '']} />
                <Bar dataKey="input" name="Input GST" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="output" name="Output GST" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-slate-500">Input GST</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs font-bold text-slate-500">Output GST</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Return Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div><p className="text-sm font-bold text-slate-800">GSTR-1</p><p className="text-[10px] text-slate-500 mt-0.5">Due: 11th Jun</p></div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] uppercase">Filed</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div><p className="text-sm font-bold text-slate-800">GSTR-3B</p><p className="text-[10px] text-slate-500 mt-0.5">Due: 20th Jun</p></div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md font-bold text-[10px] uppercase">Pending</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div><p className="text-sm font-bold text-slate-800">GSTR-9 (Annual)</p><p className="text-[10px] text-slate-500 mt-0.5">Due: 31st Dec</p></div>
                <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-md font-bold text-[10px] uppercase">Upcoming</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Recent Filing</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5"><div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div></div>
                <div><p className="text-sm font-bold text-slate-800">GSTR-1 (April 2026)</p><p className="text-[10px] text-slate-500 mt-0.5">Filed on 10th May 2026. ARN: AA270526001234F</p></div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5"><div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div></div>
                <div><p className="text-sm font-bold text-slate-800">GSTR-3B (April 2026)</p><p className="text-[10px] text-slate-500 mt-0.5">Filed on 19th May 2026. ARN: AA270526001235G</p></div>
              </div>
            </div>
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
  const [returnsList, setReturnsList] = useState<GSTReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    filing_period: "",
    filing_date: "",
    status: "Draft",
    taxable_value: 0,
    gst_liability: 0,
    itc_available: 0,
    net_gst_payable: 0,
  });

  useEffect(() => {
    // Auto-calculate net_gst_payable
    setFormData(prev => ({
      ...prev,
      net_gst_payable: (prev.gst_liability || 0) - (prev.itc_available || 0)
    }));
  }, [formData.gst_liability, formData.itc_available]);

  useEffect(() => {
    const fetchReturns = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/api/v1/accountant/gst/returns');
        if (res.data) {
          setReturnsList(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch GST returns", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const tabs = [
    { key: "gstr1", label: "GSTR-1" },
    { key: "gstr3b", label: "GSTR-3B" },
    { key: "gstr2a", label: "GSTR-2A Recon" },
    { key: "gstr2b", label: "GSTR-2B Recon" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      return_type: tabs.find((t) => t.key === activeSubTab)?.label || "GSTR-1",
    };

    try {
      await api.post('/api/v1/accountant/gst/returns', payload);
      toast.success("GST Return created successfully!");
      // Reset form
      setFormData({
        filing_period: "",
        filing_date: "",
        status: "Draft",
        taxable_value: 0,
        gst_liability: 0,
        itc_available: 0,
        net_gst_payable: 0,
      });
      // Re-fetch
      const res = await api.get('/api/v1/accountant/gst/returns');
      if (res.data) setReturnsList(res.data);
    } catch (err) {
      toast.error("Failed to create GST Return");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return Type</label>
              <input type="text" value={tabs.find(t=>t.key===activeSubTab)?.label || ""} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Period</label>
              <input type="month" required value={formData.filing_period} onChange={(e) => setFormData({...formData, filing_period: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Date</label>
              <input type="date" required value={formData.filing_date} onChange={(e) => setFormData({...formData, filing_date: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none font-bold text-amber-600">
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Filed">Filed</option>
                <option value="Rejected">Rejected</option>
                <option value="Revised">Revised</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Value</label>
              <input type="number" required value={formData.taxable_value || ""} onChange={(e) => setFormData({...formData, taxable_value: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Liability</label>
              <input type="number" required value={formData.gst_liability || ""} onChange={(e) => setFormData({...formData, gst_liability: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ITC Available</label>
              <input type="number" required value={formData.itc_available || ""} onChange={(e) => setFormData({...formData, itc_available: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable</label>
              <input type="number" value={formData.net_gst_payable} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-indigo-50 font-bold text-indigo-700 outline-none" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Create GST"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          Previous Returns
        </h3>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading GST returns...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Period</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Taxable Value</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">GST Liability</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ITC Available</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Payable</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Filing Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {returnsList
                  .filter((r) => r.return_type.toLowerCase().replace("-", "") === activeSubTab.toLowerCase())
                  .map((ret, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-700">{ret.filing_period}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                          {ret.return_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums text-right">
                        {ret.taxable_value.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums text-right">
                        {ret.gst_liability.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums text-right">
                        {ret.itc_available.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-indigo-700 tabular-nums text-right">
                        {ret.net_gst_payable.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${
                            ret.status === "Filed"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 tabular-nums text-right">{ret.filing_date}</td>
                    </tr>
                  ))}
                {returnsList.filter((r) => r.return_type.toLowerCase().replace("-", "") === activeSubTab.toLowerCase()).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      No returns found for {tabs.find((t) => t.key === activeSubTab)?.label}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Input GST (Purchases)
// 5. Output GST (Sales)
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
// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "gst" | "tds" | "returns" | "reconciliation";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard",      label: "Dashboard" },
  { key: "gst",            label: "GST" },
  { key: "tds",            label: "TDS" },
  { key: "returns",        label: "Returns" },
  { key: "reconciliation", label: "Reconciliation" },
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
      "dashboard": "dashboard",
      "gst": "gst",
      "tds": "tds",
      "returns": "returns",
      "reconciliation": "reconciliation",
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">GST & Taxation</h1>
            <p className="text-slate-500 text-sm mt-1">Manage GST invoices, returns, TDS deductions, and reconciliations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export
            </button>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> New Tax Entry
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
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
        {activeTab === "gst"            && <GSTInvoicesWrapperSection />}
        {activeTab === "tds"            && <TDSManagementSection />}
        {activeTab === "returns"        && <GSTReturnsWrapperSection initialSubTab={subTab} key={subTab || "gstr1"} />}
        {activeTab === "reconciliation" && <TaxReconciliationSection />}
      </PageTransition>
    </>
  );
};

export default TaxationPage;
