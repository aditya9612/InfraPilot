import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { accountingService } from "../../services/accountingService";
import { projectService } from "../../services/projectService";
import { PROJECTS } from "../../config/projectSeed";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight, FileText, Pencil, Eye, FileImage, Trash2, AlertTriangle } from "lucide-react";
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
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    accountingService.getGstSummary().then(res => {
      setSummary(res?.data || res || {});
    }).catch(() => {
      // toast.error("Failed to fetch GST summary");
    });
  }, []);


  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taxation</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">GST DASHBOARD</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-100/50 text-emerald-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Input GST</p>
          <p className="text-xl font-bold text-slate-800">{summary?.input_gst || "₹0"}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-rose-100/50 text-rose-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Output GST</p>
          <p className="text-xl font-bold text-slate-800">{summary?.output_gst || "₹0"}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net GST</p>
          <p className="text-xl font-bold text-slate-800">{summary?.net_gst || "₹0"}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-purple-100/50 text-purple-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TDS Collected</p>
          <p className="text-xl font-bold text-slate-800">{summary?.tds_collected || "₹0"}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-amber-100/50 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Return</p>
          <p className="text-xl font-bold text-slate-800">{summary?.upcoming_return || "20th Jun"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Monthly GST Graph</h3>
          <div className="flex-1 min-h-[300px]">
            {summary?.monthly_trend && summary.monthly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}L`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`₹${value} Lakh`, '']} />
                  <Bar dataKey="input" name="Input GST" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="output" name="Output GST" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p>No trend data available yet.</p>
              </div>
            )}
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
              {summary?.return_status && summary.return_status.length > 0 ? (
                summary.return_status.map((status: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{status.return_type || status.type}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Due: {status.due_date} {status.filing_period ? `| Period: ${status.filing_period}` : ''}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${status.status?.toLowerCase() === 'filed' ? 'bg-emerald-100 text-emerald-700' : status.status?.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                      {status.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No return status data available.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Recent Filing</h3>
            <div className="space-y-4">
              {summary?.recent_filings && summary.recent_filings.length > 0 ? (
                summary.recent_filings.map((filing: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-0.5"><div className={`w-5 h-5 rounded-full flex items-center justify-center ${filing.filing_date ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{filing.return_type || filing.type} ({filing.filing_period || filing.period})</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Filed on {filing.filing_date || filing.filed_on || 'N/A'}{filing.arn ? `. ARN: ${filing.arn}` : ''}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No recent filings.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. GST Invoices
// 2. GST Invoices
const GSTInvoiceModal = ({
  isOpen,
  onClose,
  type,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  onSuccess?: (newInv: any) => void;
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    party_name: "",
    gstin: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    project_name: "",
    project_id: "",
    taxable_amount: 0,
    gst_rate: "18%",
    cgst: 0,
    sgst: 0,
    igst: 0,
    total_gst: 0,
    invoice_total: 0,
  });

  useEffect(() => {
    projectService
      .getProjects(200)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setProjects(list.length > 0 ? list : PROJECTS);
      })
      .catch(() => {
        setProjects(PROJECTS);
      });
  }, []);

  // Compute taxes whenever taxable_amount or gst_rate changes
  useEffect(() => {
    const amt = Number(formData.taxable_amount) || 0;
    const ratePct =
      formData.gst_rate === "Exempt" ? 0 : parseFloat(formData.gst_rate) || 0;
    const totalGst = (amt * ratePct) / 100;
    const halfGst = totalGst / 2;
    setFormData((prev) => ({
      ...prev,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      total_gst: totalGst,
      invoice_total: amt + totalGst,
    }));
  }, [formData.taxable_amount, formData.gst_rate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "project_name") {
      const selected = projects.find(
        (p: any) =>
          (p.name || p.project_name) === value ||
          String(p.id || p.project_id) === value
      );
      setFormData((prev) => ({
        ...prev,
        project_name: value,
        project_id: selected
          ? String(selected.id || selected.project_id)
          : prev.project_id,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name) {
      toast.error("Please select a Project");
      return;
    }
    const newRecord = {
      id: Date.now(),
      invoice_date: formData.invoice_date,
      date: formData.invoice_date,
      invoice_number:
        formData.invoice_number ||
        `INV-${Math.floor(100 + Math.random() * 900)}`,
      invoice_no:
        formData.invoice_number ||
        `INV-${Math.floor(100 + Math.random() * 900)}`,
      type: type,
      party_name: formData.party_name || "Unknown Party",
      gstin: formData.gstin || "N/A",
      project_name: formData.project_name,
      project_id: formData.project_id,
      taxable_amount: Number(formData.taxable_amount) || 0,
      total_gst: formData.total_gst,
      invoice_total: formData.invoice_total,
      total_amount: formData.invoice_total,
    };
    if (onSuccess) onSuccess(newRecord);
    toast.success(`${type} Invoice Recorded!`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create ${type} Invoice`}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
          >
            Save Record
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">
                1
              </span>
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Client / Vendor Name *
                </label>
                <input
                  type="text"
                  name="party_name"
                  value={formData.party_name}
                  onChange={handleChange}
                  placeholder="Select Party"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Party GSTIN *
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="27ABCDE1234F1Z5"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  placeholder="INV-001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Project Name *
                </label>
                <select
                  name="project_name"
                  required
                  value={formData.project_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-medium text-slate-700"
                >
                  <option value="">Select Project</option>
                  {projects.map((p: any) => {
                    const pName =
                      p.name || p.project_name || `Project #${p.id || p.project_id}`;
                    const pId = p.id || p.project_id;
                    return (
                      <option key={pId} value={pName}>
                        {pName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">
                2
              </span>
              Tax Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Taxable Amount (₹) *
                </label>
                <input
                  type="number"
                  name="taxable_amount"
                  value={formData.taxable_amount || ""}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  GST Rate (%) *
                </label>
                <select
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="18%">18%</option>
                  <option value="12%">12%</option>
                  <option value="5%">5%</option>
                  <option value="28%">28%</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  CGST
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.cgst ? formData.cgst.toFixed(2) : "0"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-semibold text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  SGST
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.sgst ? formData.sgst.toFixed(2) : "0"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-semibold text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  IGST
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.igst ? formData.igst.toFixed(2) : "0"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-semibold text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total GST
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.total_gst ? formData.total_gst.toFixed(2) : "0"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-indigo-50 text-indigo-700 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">
                3
              </span>
              Attachment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Invoice Copy
                </label>
                <input
                  type="file"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  GST Document
                </label>
                <input
                  type="file"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Invoice Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Taxable Amount</span>
                <span className="font-semibold text-slate-700">
                  ₹{Number(formData.taxable_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xs text-indigo-500">
                <span>Total GST ({formData.gst_rate})</span>
                <span className="font-semibold">
                  ₹{Number(formData.total_gst || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-3">
                <span>Invoice Total</span>
                <span className="text-primary font-black">
                  ₹{Number(formData.invoice_total || 0).toLocaleString("en-IN")}
                </span>
              </div>
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await accountingService.getGstInvoiceRegister();
      setInvoices(res.data || res || []);
    } catch (err) {
      console.error("Failed to fetch GST invoices", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openModal = (type: "Sales" | "Purchase") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const blob = await accountingService.exportGst();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "GST_Invoices.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("GST Invoices exported successfully!");
    } catch (err) {
      toast.error("Failed to export GST Invoices");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await accountingService.importGst(file);
        toast.success("GST Invoices imported successfully!");
        fetchInvoices();
      } catch (err) {
        toast.error("Failed to import GST Invoices");
      }
    }
  };

  const totalPages = Math.ceil(invoices.length / recordsPerPage);
  const paginatedInvoices = invoices.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">Invoice Register</h2>
          <p className="text-xs text-slate-500">View and manage all GST invoices</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">
            Export
          </button>
          <label className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
            Import
            <input type="file" className="hidden" onChange={handleImport} accept=".csv,.xlsx" />
          </label>
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
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">Loading Invoices...</td></tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No GST invoices found.</td></tr>
              ) : (
                paginatedInvoices.map((inv: any, idx: number) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.date || inv.invoice_date}</td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{inv.invoice_no || inv.invoice_number}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${inv.type?.toLowerCase() === 'sales' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {inv.type || "Sales"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{inv.party_name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{inv.gstin || "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-right">₹{Number(inv.taxable_amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-right">₹{Number(inv.total_gst || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{Number(inv.invoice_total || inv.total_amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Invoice Copy">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="GST Document">
                          <FileImage className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {invoices.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} – {Math.min(currentPage * recordsPerPage, invoices.length)} of {invoices.length} records
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <GSTInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        onSuccess={(newInv) => setInvoices(prev => [newInv, ...prev])}
      />
    </div>
  );
};

const CreateGstReturnModal = ({ isOpen, onClose, onSuccess, initialReturnType, initialData }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialReturnType: string; initialData?: any }) => {
  const [formData, setFormData] = useState({
    filing_period: "",
    filing_date: new Date().toISOString().split('T')[0],
    status: "Draft",
    taxable_value: 0,
    gst_liability: 0,
    itc_available: 0,
    net_gst_payable: 0,
    return_type: initialReturnType
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!formData.filing_period) {
      toast.error("Please enter a Filing Period first (YYYY-MM)");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await accountingService.generateGstReturn(formData.filing_period, formData.return_type);
      const data = res.data || res;
      if (data) {
        setFormData(prev => ({
          ...prev,
          taxable_value: data.taxable_value || 0,
          gst_liability: data.gst_liability || 0,
          itc_available: data.itc_available || 0,
          net_gst_payable: data.net_gst_payable || ((data.gst_liability || 0) - (data.itc_available || 0))
        }));
        toast.success("GST Return values auto-calculated!");
      }
    } catch (err) {
      toast.error("Failed to generate GST Return data");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(prev => ({ ...prev, return_type: initialReturnType, filing_period: "", filing_date: new Date().toISOString().split('T')[0], status: "Draft", taxable_value: 0, gst_liability: 0, itc_available: 0, net_gst_payable: 0 }));
    }
  }, [initialReturnType, isOpen, initialData]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      net_gst_payable: (prev.gst_liability || 0) - (prev.itc_available || 0)
    }));
  }, [formData.gst_liability, formData.itc_available]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await accountingService.updateGstReturn(initialData.id, formData);
        toast.success("GST Return updated successfully!");
      } else {
        await accountingService.createGstReturn(formData);
        toast.success("GST Return created successfully!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(initialData?.id ? "Failed to update GST Return" : "Failed to create GST Return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Edit GST Return" : "Create GST Return"} maxWidth="max-w-2xl" footer={
      <>
        <button type="button" onClick={handleGenerate} disabled={isGenerating || !formData.filing_period} className="mr-auto px-6 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50">
          {isGenerating ? "Generating..." : "⚡ Auto-Generate Values"}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? "Saving..." : (initialData?.id ? "Update GST Return" : "Create GST Return")}
        </button>
      </>
    }>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">filing_period *</label>
            <input type="month" required value={formData.filing_period} onChange={(e) => setFormData({ ...formData, filing_period: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">return_type</label>
            <select value={formData.return_type} onChange={(e) => setFormData({ ...formData, return_type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">Select Return Type...</option>
              <option value="GSTR-1">GSTR-1</option>
              <option value="GSTR-3B">GSTR-3B</option>
              <option value="GSTR-2A Recon">GSTR-2A Recon</option>
              <option value="GSTR-2B Recon">GSTR-2B Recon</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">taxable_value *</label>
            <input type="number" required value={formData.taxable_value || ""} onChange={(e) => setFormData({ ...formData, taxable_value: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">gst_liability *</label>
            <input type="number" required value={formData.gst_liability || ""} onChange={(e) => setFormData({ ...formData, gst_liability: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">itc_available *</label>
            <input type="number" required value={formData.itc_available || ""} onChange={(e) => setFormData({ ...formData, itc_available: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">net_gst_payable</label>
            <input type="number" value={formData.net_gst_payable} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-indigo-50 font-bold text-indigo-700 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">status *</label>
            <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none font-bold text-amber-600">
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Filed">Filed</option>
              <option value="Rejected">Rejected</option>
              <option value="Revised">Revised</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">filing_date *</label>
            <input type="date" required value={formData.filing_date} onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
      </form>
    </Modal>
  );
};

const GstReturnViewModal = ({ returnId, onClose }: { returnId: number | string | null, onClose: () => void }) => {
  const [detail, setDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!returnId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await accountingService.getGstReturn(returnId);
        setDetail(data);
      } catch (err: any) {
        toast.error("Failed to fetch GST return details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [returnId]);

  return (
    <Modal isOpen={!!returnId} onClose={onClose} title="GST Return Details" maxWidth="max-w-3xl">
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : detail ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Period</p><p className="font-bold text-slate-800">{detail.filing_period || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return Type</p><p className="font-bold text-slate-800">{detail.return_type || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Value</p><p className="font-bold text-slate-800">₹{detail.taxable_value?.toLocaleString("en-IN") || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Liability</p><p className="font-bold text-slate-800">₹{detail.gst_liability?.toLocaleString("en-IN") || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ITC Available</p><p className="font-bold text-slate-800">₹{detail.itc_available?.toLocaleString("en-IN") || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p><p className="font-bold text-indigo-700">₹{detail.net_gst_payable?.toLocaleString("en-IN") || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Date</p><p className="font-bold text-slate-800">{detail.filing_date || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p><p className="font-bold text-slate-800">{detail.status || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</p><p className="font-bold text-slate-800">{detail.created_at ? new Date(detail.created_at).toLocaleString() : "N/A"}</p></div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">Details not found.</div>
        )}
      </div>
    </Modal>
  );
};

// 3. GST Returns
const GSTReturnsWrapperSection = () => {

  const [returnsList, setReturnsList] = useState<GSTReturn[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<GSTReturn | null>(null);
  const [viewReturnId, setViewReturnId] = useState<number | string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await accountingService.getGstReturns();
      if (res.data) setReturnsList(res.data);
      else if (Array.isArray(res)) setReturnsList(res);
    } catch (err) {
      console.error("Failed to fetch GST returns", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    try {
      await accountingService.deleteGstReturn(deleteModalId);
      toast.success("GST Return deleted!");
      fetchReturns();
    } catch (err) {
      toast.error("Failed to delete GST Return");
    } finally {
      setIsDeleting(false);
      setDeleteModalId(null);
    }
  };

  const handleSuccess = async () => {
    fetchReturns();
  };

  const totalPages = Math.ceil(returnsList.length / recordsPerPage);
  const paginatedReturns = returnsList.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div></div>
        <button onClick={() => { setEditData(null); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 transition-all">
          Create GST Return
        </button>
      </div>

      <CreateGstReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        initialReturnType=""
        initialData={editData}
      />

      <GstReturnViewModal
        returnId={viewReturnId}
        onClose={() => setViewReturnId(null)}
      />

      <Modal isOpen={!!deleteModalId} onClose={() => setDeleteModalId(null)} title="Delete GST Return" maxWidth="max-w-md" footer={
        <div className="flex w-full justify-center gap-4">
          <button type="button" onClick={() => setDeleteModalId(null)} disabled={isDeleting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={isDeleting} className="px-6 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Confirm Deletion"}
          </button>
        </div>
      }>
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 text-sm">Are you sure you want to delete this record?</p>
        </div>
      </Modal>

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
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedReturns
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
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${ret.status === "Filed"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 tabular-nums text-right">{ret.filing_date}</td>
                      <td className="px-5 py-3.5 text-center flex justify-center gap-2">
                        <button onClick={() => setViewReturnId(ret.id)} className="w-7 h-7 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View"><Eye size={14} /></button>
                        <button onClick={() => { setEditData(ret); setIsModalOpen(true); }} className="w-7 h-7 flex items-center justify-center text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteModalId(ret.id)} className="w-7 h-7 flex items-center justify-center text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                {returnsList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">
                      No returns found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {returnsList.length > 0 && !isLoading && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-4 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {(currentPage - 1) * recordsPerPage + 1} – {Math.min(currentPage * recordsPerPage, returnsList.length)} of {returnsList.length} records
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Input GST (Purchases)
// 5. Output GST (Sales)
// 6. TDS Management
const TdsDeductionModal = ({ isOpen, onClose, onSuccess, initialData }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialData?: any }) => {
  const [formData, setFormData] = useState({
    party_name: "", pan_number: "", invoice_number: "", payment_amount: 0, tds_section: "", tds_rate: 0, tds_amount: 0, deposit_date: new Date().toISOString().split('T')[0], status: "Pending", vendor_bill_id: null as number | null, ra_bill_id: null as number | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        party_name: "", pan_number: "", invoice_number: "", payment_amount: 0, tds_section: "", tds_rate: 0, tds_amount: 0, deposit_date: new Date().toISOString().split('T')[0], status: "Pending", vendor_bill_id: null, ra_bill_id: null
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await accountingService.updateTdsDeduction(initialData.id, formData);
        toast.success("TDS Deduction Updated!");
      } else {
        await accountingService.createTdsDeduction(formData);
        toast.success("TDS Deduction Created!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(initialData?.id ? "Failed to update TDS Deduction" : "Failed to create TDS Deduction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Edit TDS Deduction" : "Create TDS Deduction"} maxWidth="max-w-3xl" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? "Saving..." : (initialData?.id ? "Update TDS Deduction" : "Record TDS Deduction")}
        </button>
      </>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">party_name *</label><input type="text" required value={formData.party_name} onChange={(e) => setFormData({ ...formData, party_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">pan_number *</label><input type="text" required value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">invoice_number</label>
            <select value={formData.invoice_number || ""} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option value="">Select Invoice</option>
              <option value="INV-2026-001">INV-2026-001</option>
              <option value="INV-2026-002">INV-2026-002</option>
              <option value="INV-2026-003">INV-2026-003</option>
              <option value="INV-2026-004">INV-2026-004</option>
              {initialData?.invoice_number && !["INV-2026-001", "INV-2026-002", "INV-2026-003", "INV-2026-004"].includes(initialData.invoice_number) && <option value={initialData.invoice_number}>{initialData.invoice_number}</option>}
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">payment_amount</label><input type="number" required value={formData.payment_amount || ""} onChange={(e) => setFormData({ ...formData, payment_amount: Number(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">tds_section *</label>
            <select required value={formData.tds_section} onChange={(e) => setFormData({ ...formData, tds_section: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option value="">Select Section</option>
              <option value="194C">194C - Contractor Payments</option>
              <option value="194J">194J - Professional Fees</option>
              <option value="194I">194I - Equipment Rental</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">tds_rate (%)</label><input type="number" required value={formData.tds_rate || ""} onChange={(e) => setFormData({ ...formData, tds_rate: Number(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">tds_amount</label><input type="number" required value={formData.tds_amount || ""} onChange={(e) => setFormData({ ...formData, tds_amount: Number(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-amber-50 text-amber-700 font-bold" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">deposit_date</label><input type="date" value={formData.deposit_date || ""} onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value="Pending">Pending</option><option value="Deposited">Deposited</option></select></div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">vendor bill</label>
            <select value={formData.vendor_bill_id || ""} onChange={(e) => setFormData({ ...formData, vendor_bill_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option value="">Select Vendor Bill</option>
              <option value="1">ABC Corp</option>
              <option value="2">XYZ Steel</option>
              <option value="3">L&T</option>
              <option value="4">GHI Tech</option>
              {initialData?.vendor_bill_id && !["1", "2", "3", "4"].includes(String(initialData.vendor_bill_id)) && <option value={initialData.vendor_bill_id}>Vendor Bill {initialData.vendor_bill_id}</option>}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ra bill</label>
            <select value={formData.ra_bill_id || ""} onChange={(e) => setFormData({ ...formData, ra_bill_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option value="">Select RA Bill</option>
              <option value="1">Excavation</option>
              <option value="2">Concreting</option>
              <option value="9">Finishing</option>
              {initialData?.ra_bill_id && !["1", "2", "9"].includes(String(initialData.ra_bill_id)) && <option value={initialData.ra_bill_id}>RA Bill {initialData.ra_bill_id}</option>}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const TdsViewModal = ({ tdsId, onClose }: { tdsId: number | string | null, onClose: () => void }) => {
  const [tdsDetail, setTdsDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tdsId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await accountingService.getTdsDeduction(tdsId);
        setTdsDetail(data);
      } catch (err: any) {
        toast.error("Failed to fetch TDS details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [tdsId]);

  return (
    <Modal isOpen={!!tdsId} onClose={onClose} title="TDS Deduction Details" maxWidth="max-w-3xl">
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : tdsDetail ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Name</p><p className="font-bold text-slate-800">{tdsDetail.party_name || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Number</p><p className="font-bold text-slate-800 font-mono">{tdsDetail.pan_number || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p><p className="font-bold text-slate-800">{tdsDetail.invoice_number || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount</p><p className="font-bold text-slate-800">₹{tdsDetail.payment_amount || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Section</p><p className="font-bold text-slate-800">{tdsDetail.tds_section || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Rate</p><p className="font-bold text-slate-800">{tdsDetail.tds_rate || 0}%</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Amount</p><p className="font-bold text-amber-600">₹{tdsDetail.tds_amount || 0}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Date</p><p className="font-bold text-slate-800">{tdsDetail.deposit_date || "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p><p className="font-bold text-slate-800">{tdsDetail.status || "N/A"}</p></div>
            {tdsDetail.vendor_bill_name && <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Bill</p><p className="font-bold text-slate-800">{tdsDetail.vendor_bill_name}</p></div>}
            {tdsDetail.ra_bill_name && <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RA Bill</p><p className="font-bold text-slate-800">{tdsDetail.ra_bill_name}</p></div>}
            {tdsDetail.created_by_name && <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</p><p className="font-bold text-slate-800">{tdsDetail.created_by_name}</p></div>}
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</p><p className="font-bold text-slate-800">{tdsDetail.created_at ? new Date(tdsDetail.created_at).toLocaleString() : "N/A"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated At</p><p className="font-bold text-slate-800">{tdsDetail.updated_at ? new Date(tdsDetail.updated_at).toLocaleString() : "N/A"}</p></div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">Details not found.</div>
        )}
      </div>
    </Modal>
  );
};

const TDSManagementSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTdsId, setViewTdsId] = useState<number | string | null>(null);
  const [tdsList, setTdsList] = useState<any[]>([]);
  const [editData, setEditData] = useState<any>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const fetchTdsList = async () => {
    try {
      const data = await accountingService.getTdsDeductions();
      setTdsList(data?.items || data?.data || data || []);
    } catch (err) {
      toast.error("Failed to fetch TDS deductions");
    }
  };

  useEffect(() => {
    fetchTdsList();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    try {
      await accountingService.deleteTdsDeduction(deleteModalId);
      toast.success("TDS Deduction deleted!");
      fetchTdsList();
    } catch (err) {
      toast.error("Failed to delete TDS deduction");
    } finally {
      setIsDeleting(false);
      setDeleteModalId(null);
    }
  };

  const totalPages = Math.ceil(tdsList.length / recordsPerPage);
  const paginatedTdsList = tdsList.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const showVendorBill = tdsList.some(r => r.vendor_bill_name);
  const showRABill = tdsList.some(r => r.ra_bill_name);
  const showCreatedBy = tdsList.some(r => r.created_by_name);

  const headers = ["Party Name", "PAN Number", "Invoice Number", "Payment Amount", "TDS Section", "TDS Rate", "TDS Amount", "Deposit Date", "Status"];
  if (showVendorBill) headers.push("Vendor Bill");
  if (showRABill) headers.push("RA Bill");
  if (showCreatedBy) headers.push("Created By");
  headers.push("Actions");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">TDS Management</h2>
          <p className="text-xs text-slate-500">Manage TDS deductions and payments</p>
        </div>
        <button onClick={() => { setEditData(null); setIsModalOpen(true); }} className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm">
          + Create TDS Deduction
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Recent TDS Deductions</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {headers.map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTdsList.length > 0 ? paginatedTdsList.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-800 font-bold whitespace-nowrap">{row.party_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap font-mono">{row.pan_number}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.invoice_number || "N/A"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap font-bold">₹{row.payment_amount}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.tds_section}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.tds_rate}%</td>
                  <td className="px-4 py-3 text-xs text-amber-600 whitespace-nowrap font-bold">₹{row.tds_amount}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.deposit_date}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap"><span className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase ${row.status === 'Deposited' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span></td>
                  {showVendorBill && <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.vendor_bill_name}</td>}
                  {showRABill && <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.ra_bill_name}</td>}
                  {showCreatedBy && <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.created_by_name}</td>}
                  <td className="px-4 py-3 text-xs whitespace-nowrap flex gap-2">
                    <button onClick={() => setViewTdsId(row.id)} className="w-7 h-7 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View"><Eye size={14} /></button>
                    <button onClick={() => { setEditData(row); setIsModalOpen(true); }} className="w-7 h-7 flex items-center justify-center text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteModalId(row.id)} className="w-7 h-7 flex items-center justify-center text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan={headers.length} className="text-center py-8 text-sm text-slate-500">No recent deductions found.</td></tr>}
            </tbody>
          </table>
        </div>
        {tdsList.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {(currentPage - 1) * recordsPerPage + 1} – {Math.min(currentPage * recordsPerPage, tdsList.length)} of {tdsList.length} records
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-bold shadow-sm">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <TdsDeductionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={fetchTdsList}
        initialData={editData}
      />
      <TdsViewModal
        tdsId={viewTdsId}
        onClose={() => setViewTdsId(null)}
      />

      <Modal isOpen={!!deleteModalId} onClose={() => setDeleteModalId(null)} title="Delete TDS Deduction" maxWidth="max-w-md" footer={
        <div className="flex w-full justify-center gap-4">
          <button type="button" onClick={() => setDeleteModalId(null)} disabled={isDeleting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={isDeleting} className="px-6 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Confirm Deletion"}
          </button>
        </div>
      }>
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 text-sm">Are you sure you want to delete this record?</p>
        </div>
      </Modal>
    </div>
  );
};

// 7. GST Reconciliation
const TaxReconciliationSection = () => {
  const [isReconciling, setIsReconciling] = useState(false);

  const handleReconcile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsReconciling(true);
      try {
        await accountingService.reconcileGst(file);
        toast.success("GST Reconciliation started!");
      } catch (err) {
        toast.error("Failed to reconcile GST");
      } finally {
        setIsReconciling(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800">GST Reconciliation</h3>
          <p className="text-xs text-slate-500 mt-0.5">Match ERP data with Portal (2A/2B)</p>
        </div>
        <div className="flex gap-2">
          <label className={`bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${isReconciling ? 'opacity-50 pointer-events-none' : 'hover:bg-emerald-100'}`}>
            {isReconciling ? "Reconciling..." : "Reconcile Gst (Upload JSON)"}
            <input type="file" className="hidden" onChange={handleReconcile} accept=".json,.zip" />
          </label>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">Download Mismatch Report</button>
        </div>
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
};

// 8. Reports Wrapper
// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "gst" | "tds" | "returns" | "reconciliation";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "gst", label: "GST" },
  { key: "tds", label: "TDS" },
  { key: "returns", label: "Returns" },
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
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
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
        {activeTab === "dashboard" && <DashboardSection />}
        {activeTab === "gst" && <GSTInvoicesWrapperSection />}
        {activeTab === "tds" && <TDSManagementSection />}
        {activeTab === "returns" && <GSTReturnsWrapperSection key={subTab || "gstr1"} />}
        {activeTab === "reconciliation" && <TaxReconciliationSection />}
      </PageTransition>
    </>
  );
};

export default TaxationPage;
