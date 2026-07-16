import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { journalService } from "../../services/journalService";
import { accountingService } from "../../services/accountingService";

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

const JournalEntryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    entry_date: "",
    description: "",
    lines: [
      { account_id: 1, debit: 0, credit: 0 },
      { account_id: 2, debit: 0, credit: 0 }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountingService.getAccounts({ limit: 100 }).then(res => {
        setAccounts(Array.isArray(res) ? res : res?.items || res?.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineChange = (index: number, field: string, value: number) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({ ...formData, lines: [...formData.lines, { account_id: 1, debit: 0, credit: 0 }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        description: formData.description,
        lines: formData.lines.map(line => ({
          account_id: line.account_id,
          debit: line.debit,
          credit: line.credit
        }))
      };
      await accountingService.createJournalEntry(payload);
      toast.success("Journal Entry Submitted Successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to create journal entry");
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = formData.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
  const totalCredit = formData.lines.reduce((acc, line) => acc + (line.credit || 0), 0);

  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Create Journal Entry"
    maxWidth="max-w-5xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">{loading ? "Submitting..." : "Submit Entry"}</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Entry Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date *</label><input type="date" name="entry_date" value={formData.entry_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description *</label><input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="e.g. Purchase of cement" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formData.lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-2 py-2">
                    <select value={line.account_id} onChange={(e) => handleLineChange(index, "account_id", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50">
                      <option value="">Select Account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2"><input type="number" value={line.debit || ""} onChange={(e) => handleLineChange(index, "debit", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs font-bold text-emerald-600 border border-slate-200 rounded-lg bg-slate-50" /></td>
                  <td className="px-2 py-2"><input type="number" value={line.credit || ""} onChange={(e) => handleLineChange(index, "credit", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs font-bold text-rose-500 border border-slate-200 rounded-lg bg-slate-50" /></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-sm">
              <tr>
                <td className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-emerald-600">₹{totalDebit}</td>
                <td className="px-4 py-3 text-rose-500">₹{totalCredit}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" onClick={addLine} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Line Item</button>
      </div>
    </form>
  </Modal>
  );
};

const ViewJournalDetailsModal = ({ isOpen, onClose, details }: { isOpen: boolean; onClose: () => void; details: any }) => {
  if (!details) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Journal Details" maxWidth="max-w-4xl" footer={
      <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Close</button>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Journal No</p><p className="font-bold text-slate-800 text-sm">{details.journal_number || `JE-${details.id}`}</p></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Entry Date</p><p className="font-bold text-slate-800 text-sm">{details.entry_date ? new Date(details.entry_date).toLocaleDateString() : "N/A"}</p></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Status</p><p className="font-bold text-slate-800 text-sm">{details.status || "N/A"}</p></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Entry Type</p><p className="font-bold text-slate-800 text-sm">{details.entry_type || "N/A"}</p></div>
          <div className="col-span-2 md:col-span-4"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Description</p><p className="font-bold text-slate-800 text-sm">{details.description || "N/A"}</p></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Created By</p><p className="font-bold text-slate-800 text-sm">{details.created_by || "N/A"}</p></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Created At</p><p className="font-bold text-slate-800 text-sm">{details.created_at ? new Date(details.created_at).toLocaleString() : "N/A"}</p></div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account ID</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (₹)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(details.lines || []).map((line: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{line.account_id || line.account_name || "-"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">{line.debit || 0}</td>
                  <td className="px-4 py-3 text-sm font-bold text-rose-500 text-right">{line.credit || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

const AdjustmentJournalModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    entry_date: "",
    description: "",
    lines: [
      { account_id: 1, debit: 0, credit: 0 },
      { account_id: 2, debit: 0, credit: 0 }
    ]
  });
  const [loading, setLoading] = useState(false);

  const mockAccounts = [
    { id: 1, name: "Material Expense A/c" },
    { id: 2, name: "HDFC Bank A/c" },
    { id: 3, name: "Cash A/c" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineChange = (index: number, field: string, value: number) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({ ...formData, lines: [...formData.lines, { account_id: 1, debit: 0, credit: 0 }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entry_date || !formData.description) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      await journalService.createAdjustmentJournal(formData);
      toast.success("Adjustment Journal Submitted Successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to create adjustment journal");
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = formData.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
  const totalCredit = formData.lines.reduce((acc, line) => acc + (line.credit || 0), 0);

  return (
  <Modal isOpen={isOpen} onClose={onClose} title="Create Adjustment Journal" maxWidth="max-w-5xl" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50">{loading ? "Submitting..." : "Submit Adjustment"}</button>
      </>
    }>
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Entry Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date *</label><input type="date" name="entry_date" value={formData.entry_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description *</label><input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="e.g. Depreciation Entry" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formData.lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-2 py-2">
                    <select value={line.account_id} onChange={(e) => handleLineChange(index, "account_id", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50">
                      {mockAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2"><input type="number" value={line.debit || ""} onChange={(e) => handleLineChange(index, "debit", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs font-bold text-emerald-600 border border-slate-200 rounded-lg bg-slate-50" /></td>
                  <td className="px-2 py-2"><input type="number" value={line.credit || ""} onChange={(e) => handleLineChange(index, "credit", Number(e.target.value))} className="w-full px-2 py-1.5 text-xs font-bold text-rose-500 border border-slate-200 rounded-lg bg-slate-50" /></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-sm">
              <tr>
                <td className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-emerald-600">₹{totalDebit}</td>
                <td className="px-4 py-3 text-rose-500">₹{totalCredit}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" onClick={addLine} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Line Item</button>
      </div>
    </form>
  </Modal>
  );
};

const ManualEntriesWrapper = () => {
  const [journals, setJournals] = useState<any[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await accountingService.getJournal();
        setJournals(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        toast.error("Failed to load journal entries");
      }
    };
    fetchJournals();
  }, []);

  const viewDetails = async (id: string | number) => {
    try {
      const data = await journalService.getManualJournalDetails(id);
      setSelectedDetails(data);
      setDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch journal details");
    }
  };

  const tableData = journals.map(j => [
    j.journal_number || `JE-${j.id}`,
    j.entry_date ? new Date(j.entry_date).toLocaleDateString() : "-",
    j.description || "-",
    j.status || "Posted",
    j.entry_type || "-",
    j.created_at ? new Date(j.created_at).toLocaleString() : "-",
    <button key={j.id} onClick={() => viewDetails(j.id)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View Details">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    </button>
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800">Manual Journal Entries</h3>
      </div>
      <GenericTableSection 
        title="Recent Manual Entries" 
        columns={["Journal Number", "Entry Date", "Description", "Status", "Entry Type", "Created At", "Action"]} 
        data={tableData.length > 0 ? tableData : [["-", "-", "No entries found", "-", "-", "-", "-"]]} 
      />
      <ViewJournalDetailsModal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} details={selectedDetails} />
    </div>
  );
};

const AdjustmentRegisterSection = () => {
  const [journals, setJournals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  const fetchJournals = async () => {
    try {
      const params = {
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate })
      };
      const data = await journalService.getAdjustmentJournals(params);
      setJournals(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load adjustment journals");
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleFilter = () => {
    fetchJournals();
  };

  const viewDetails = async (id: string | number) => {
    try {
      const data = await journalService.getAdjustmentJournalDetails(id);
      setSelectedDetails(data);
      setDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch adjustment journal details");
    }
  };

  // Removed local filtering since it's server-side now via fetchJournals

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">All Adjustment Registers</span>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full justify-end">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="text"
            placeholder="Status..."
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
          />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
              title="From Date"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
              title="To Date"
            />
          </div>
          <button onClick={handleFilter} className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["JOURNAL NUMBER", "ENTRY DATE", "DESCRIPTION", "STATUS", "ENTRY TYPE", "CREATED AT", "ACTION"].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {journals.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">{row.journal_number || `ADJ-${row.id}`}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{row.entry_date ? new Date(row.entry_date).toLocaleDateString() : "-"}</td>
                <td className="px-5 py-3.5 text-xs text-slate-700">{row.description || "-"}</td>
                <td className="px-5 py-3.5 text-xs">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">{row.status || "Posted"}</span>
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{row.entry_type || "-"}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                <td className="px-5 py-3.5 text-xs">
                  <button onClick={() => viewDetails(row.id)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View Details">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {journals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No adjustment journals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ViewJournalDetailsModal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} details={selectedDetails} />
    </div>
  );
};

const RecurringJournalsSection = () => {
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await journalService.getRecurringJournals();
        setJournals(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        toast.error("Failed to load recurring journals");
      }
    };
    fetchJournals();
  }, []);

  const toggleStatus = async (id: string | number) => {
    try {
      await journalService.toggleRecurringJournal(id);
      toast.success("Toggled recurring journal successfully");
      const data = await journalService.getRecurringJournals();
      setJournals(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to toggle journal");
    }
  };

  const tableData = journals.map(j => [
    j.template_name || "-",
    j.frequency || "-",
    j.next_run_date ? new Date(j.next_run_date).toLocaleDateString() : "-",
    j.status || "Active",
    <button key={j.id} onClick={() => toggleStatus(j.id)} className="px-3 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 font-bold text-xs">Toggle Status</button>
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800">Recurring Entries</h3>
      </div>
      <GenericTableSection 
        title="Active Recurring Journals" 
        columns={["Template Name", "Frequency", "Next Run Date", "Status", "Action"]} 
        data={tableData.length > 0 ? tableData : [["-", "-", "-", "-", "-"]]} 
      />
    </div>
  );
};

const RecurringJournalModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    template_name: "",
    frequency: "",
    next_run_date: "",
    template_data: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_name || !formData.frequency || !formData.next_run_date || !formData.template_data) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await journalService.createRecurringJournal(formData);
      toast.success("Recurring Journal Created!");
      onClose();
    } catch (err) {
      toast.error("Failed to create recurring journal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Recurring Journal" maxWidth="max-w-2xl" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">{loading ? "Saving..." : "Save Template"}</button>
      </>
    }>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Template Name</label>
            <input type="text" name="template_name" value={formData.template_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Frequency</label>
            <input type="text" name="frequency" value={formData.frequency} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Next Run Date</label>
            <input type="date" name="next_run_date" value={formData.next_run_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Template Data (String)</label>
            <textarea name="template_data" value={formData.template_data} onChange={handleChange} rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"></textarea>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// --- MAIN PAGE ---
type TabKey = "journal" | "recurring" | "adjustment";

const TABS: { key: TabKey; label: string }[] = [
  { key: "journal",    label: "Journal Entry" },
  { key: "recurring",  label: "Recurring" },
  { key: "adjustment", label: "Adjustment Register" },
];

const JournalEntriesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();


  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;
    const map: Record<string, TabKey> = {
      "journal":    "journal",
      "recurring":  "recurring",
      "adjustment": "adjustment",
    };
    return map[currentSub || ""] || "journal";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/journal/${key}`, { replace: true });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAdjustment = async () => {
    try {
      await journalService.exportAdjustmentJournals();
      toast.success("Adjustment journals exported successfully!");
    } catch (e) {
      toast.error("Failed to export adjustment journals");
    }
  };

  const handleExportJournals = async () => {
    try {
      await journalService.exportJournals();
      toast.success("Journals exported successfully!");
    } catch (e) {
      toast.error("Failed to export journals");
    }
  };

  const handleExportRecurring = async () => {
    try {
      await journalService.exportRecurringJournals();
      toast.success("Recurring journals exported successfully!");
    } catch (e) {
      toast.error("Failed to export recurring journals");
    }
  };

  const handleRunDueRecurring = async () => {
    try {
      await journalService.runDueRecurringJournals();
      toast.success("Ran due recurring journals successfully!");
      // Optionally trigger a re-fetch of the recurring list here if needed
    } catch (e) {
      toast.error("Failed to run due recurring journals");
    }
  };

  const handleImportAdjustment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      await journalService.importAdjustmentJournals(formData);
      toast.success("Adjustment journals imported successfully!");
    } catch (err) {
      toast.error("Failed to import adjustment journals");
    }
  };

  // Per-tab config
  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    journal: {
      title: "Journal Entries",
      subtitle: "Record and manage manual journal entries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExportJournals} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> New Entry
          </button>
        </div>
      ),
    },
    recurring: {
      title: "Recurring Entries",
      subtitle: "Manage recurring and automated journal entries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleRunDueRecurring} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-emerald-100 transition-all active:scale-95">
            <span className="text-lg">🚀</span> Run Due
          </button>
          <button onClick={handleExportRecurring} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => setIsRecurringModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            New Recurring
          </button>
        </div>
      ),
    },
    adjustment: {
      title: "Adjustment Register",
      subtitle: "Manage accounting adjustments and corrections.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportAdjustment} className="hidden" accept=".csv,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📥</span> Import
          </button>
          <button onClick={handleExportAdjustment} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            New Adjustment
          </button>
        </div>
      ),
    },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Journal Entries" breadcrumb={["Accountant", "Journal Entries"]} />

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
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "journal"    && <ManualEntriesWrapper />}
        {activeTab === "recurring"  && <RecurringJournalsSection />}
        {activeTab === "adjustment" && <AdjustmentRegisterSection />}
      </PageTransition>

      <JournalEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AdjustmentJournalModal isOpen={isAdjModalOpen} onClose={() => setIsAdjModalOpen(false)} />
      <RecurringJournalModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} />
    </>
  );
};

export default JournalEntriesPage;

