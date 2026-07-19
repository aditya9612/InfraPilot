import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import LedgerModal from "../../components/forms/accounting/LedgerModal";
import toast from "react-hot-toast";
import { accountingService } from "../../services/accountingService";

// --- UI COMPONENTS ---

type TabKey = "accounts" | "cash" | "bank-book" | "reconciliation";

const BankingHeader = ({ activeTab, onAddAccount, tabsNode, onImportSuccess }: { activeTab: TabKey, onAddAccount: () => void, tabsNode?: React.ReactNode, onImportSuccess?: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateRows, setTemplateRows] = useState<any[]>([]);

  const getTemplateColumns = () => {
    switch (activeTab) {
      case "cash": return ["Date", "Description", "Amount", "Type"];
      case "bank-book": return ["Date", "Description", "Amount", "Type"];
      case "reconciliation": return ["Date", "Description", "Withdrawal", "Deposit"];
      case "accounts":
      default: return ["Bank Name", "Account No", "IFSC"];
    }
  };

  const cols = getTemplateColumns();

  useEffect(() => {
    if (activeTab === "accounts") {
      setTemplateRows([
        { "Bank Name": "HDFC Bank", "Account No": "554000000000", "IFSC": "HDFC0001234" },
        { "Bank Name": "ICICI Bank", "Account No": "999000000000", "IFSC": "ICIC0005678" },
        { "Bank Name": "SBI Bank", "Account No": "112000000000", "IFSC": "SBIN0009101" }
      ]);
    } else if (activeTab === "cash" || activeTab === "bank-book") {
      setTemplateRows([
        { "Date": "2026-07-16", "Description": "Opening Balance", "Amount": "10000", "Type": "Cr" },
        { "Date": "2026-07-16", "Description": "Payment", "Amount": "5000", "Type": "Dr" }
      ]);
    } else {
      setTemplateRows([
        { "Date": "2026-07-16", "Description": "Bank Charges", "Withdrawal": "150", "Deposit": "" }
      ]);
    }
  }, [activeTab]);

  useEffect(() => {
    accountingService.getBankSummary().then(res => {
      setSummary(res?.data || res || {});
    }).catch(() => {
      // Ignore error for now
    });
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case "accounts": return "BANK ACCOUNTS";
      case "cash": return "CASH BOOK";
      case "bank-book": return "BANK BOOK";
      case "reconciliation": return "BANK RECONCILIATION";
      default: return "";
    }
  };

  const handleExport = async () => {
    try {
      const isCash = activeTab === "cash";
      const isBankBook = activeTab === "bank-book";
      const isRecon = activeTab === "reconciliation";

      let blob;
      let filename = "";
      if (isCash) {
        blob = await accountingService.exportCashBook();
        filename = "cash_book_export.xlsx";
      } else if (isBankBook) {
        blob = await accountingService.exportBankBook();
        filename = "bank_book_export.xlsx";
      } else if (isRecon) {
        blob = await accountingService.exportReconciliationCsv();
        filename = "reconciliation_export.csv";
      } else {
        blob = await accountingService.exportBankAccounts();
        filename = "bank_accounts_export.xlsx";
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful!");
    } catch (error) {
      toast.error("Failed to export");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isCash = activeTab === "cash";
      const isBankBook = activeTab === "bank-book";
      const isRecon = activeTab === "reconciliation";
      toast.loading("Importing...", { id: "import" });
      if (isCash) {
        await accountingService.importCashBook(file);
      } else if (isBankBook) {
        await accountingService.importBankBook(file);
      } else if (isRecon) {
        await accountingService.importBankTransactions(file);
      } else {
        await accountingService.importBankAccounts(file);
      }
      toast.success(`${isCash ? "Cash book" : (isBankBook ? "Bank book" : (isRecon ? "Bank transactions" : "Bank accounts"))} imported successfully!`, { id: "import" });
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      toast.error(`Failed to import`, { id: "import" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveTemplate = () => {
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(templateRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      const filename = `${activeTab === 'cash' ? 'Cash_Book' : activeTab === 'bank-book' ? 'Bank_Book' : activeTab === 'reconciliation' ? 'Bank_Transactions' : 'Bank_Accounts'}_Template.csv`;
      XLSX.writeFile(wb, filename);
      toast.success("Template saved and downloaded!");
      setIsTemplateModalOpen(false);
    }).catch(() => {
      toast.error("Failed to generate template");
    });
  };

  return (
    <div className="mb-6 space-y-6 mt-6">
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Fill Excel Template"
      >
        <div className="p-4 flex flex-col h-full">
          <p className="text-sm text-slate-500 mb-4">Add your bank details below. This will be saved as an Excel file which you can then import.</p>
          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse select-none">
              <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                <tr>
                  <th className="w-10 border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]"></th>
                  {cols.map((col, i) => (
                    <th key={col} className="border border-slate-300 p-1.5 text-center text-xs font-normal text-slate-600 bg-[#f8f9fa] min-w-[120px]">
                      {String.fromCharCode(65 + i)} ({col})
                    </th>
                  ))}
                  <th className="border border-slate-300 p-1.5 text-center text-xs font-normal text-slate-600 bg-[#f8f9fa] w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]">1</td>
                  {cols.map(col => (
                    <td key={col} className="border border-slate-300 p-1 text-sm font-semibold text-slate-800 bg-white">{col}</td>
                  ))}
                  <td className="border border-slate-300 bg-white"></td>
                </tr>
                {templateRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]">{idx + 2}</td>
                    {cols.map(col => (
                      <td key={col} className="border border-slate-300 bg-white p-0 relative">
                        <input
                          className="w-full h-full absolute inset-0 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-transparent"
                          value={row[col] || ""}
                          onChange={(e) => {
                            const newRows = [...templateRows];
                            newRows[idx][col] = e.target.value;
                            setTemplateRows(newRows);
                          }}
                        />
                        <div className="px-2 py-1.5 invisible text-sm">H</div>
                      </td>
                    ))}
                    <td className="border border-slate-300 bg-white p-0 text-center">
                      <button onClick={() => setTemplateRows(templateRows.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 transition-colors w-full h-full flex items-center justify-center p-1.5">
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const newRow: any = {};
              cols.forEach(c => newRow[c] = "");
              setTemplateRows([...templateRows, newRow]);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2 self-start flex items-center gap-1"
          >
            + Add Row
          </button>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm transition-all">Cancel</button>
            <button onClick={handleSaveTemplate} className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-sm shadow-sm transition-all">Save Template</button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your {activeTab.replace('-', ' ')} records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📄</span> Template
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".xlsx,.xls,.csv" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📥</span> {activeTab === "cash" ? "Import Cash Book" : (activeTab === "bank-book" ? "Import Bank Book" : (activeTab === "reconciliation" ? "Import Bank Transactions" : "Import Bank Accounts"))}
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> {activeTab === "cash" ? "Export Cash Book" : (activeTab === "bank-book" ? "Export Bank Book" : (activeTab === "reconciliation" ? "Export Reconciliation CSV" : "Export Bank Accounts"))}
          </button>
          {activeTab === "accounts" && (
            <button onClick={onAddAccount} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> Add Account
            </button>
          )}
        </div>
      </div>

      {tabsNode}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m-9-2h4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL BANK BALANCE</p>
            <p className="text-xl font-bold text-slate-800">{summary?.total_bank_balance || "₹0"}</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AVAILABLE CASH</p>
            <p className="text-xl font-bold text-slate-800">{summary?.available_cash || "₹0"}</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7l10 10M17 7v10H7"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TODAY'S DEPOSIT</p>
            <p className="text-xl font-bold text-slate-800">{summary?.todays_deposit || "₹0"}</p>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M7 7h10v10"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TODAY'S WITHDRAWAL</p>
            <p className="text-xl font-bold text-slate-800">{summary?.todays_withdrawal || "₹0"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddBankAccountModal = ({ isOpen, onClose, onSuccess, initialData }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialData?: any | null }) => {
  const [formData, setFormData] = useState({
    account_id: 0, bank_name: "", account_number: "", ifsc_code: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountingService.getAccounts({ limit: 200 }).then(res => {
        setAccountsList(Array.isArray(res) ? res : res?.items || res?.data || []);
      }).catch(() => { });

      if (initialData) {
        setFormData({
          account_id: initialData.account_id || 0,
          bank_name: initialData.bank_name || "",
          account_number: initialData.account_number || "",
          ifsc_code: initialData.ifsc_code || ""
        });
      } else {
        setFormData({ account_id: 0, bank_name: "", account_number: "", ifsc_code: "" });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialData && initialData.id) {
        await accountingService.updateBankAccount(initialData.id, formData);
        toast.success("Bank Account Updated!");
      } else {
        await accountingService.createBankAccount(formData);
        toast.success("Bank Account Added!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(initialData ? "Failed to update bank account" : "Failed to create bank account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank Account"
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Account"}
          </button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account *</label>
              <select required value={formData.account_id || ""} onChange={e => setFormData({ ...formData, account_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
                <option value="">Select an Account</option>
                {accountsList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} {acc.code ? `(${acc.code})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name *</label><input type="text" required value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} placeholder="e.g. HDFC Bank" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number *</label><input type="text" required value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} placeholder="0000 0000 0000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code *</label><input type="text" required value={formData.ifsc_code} onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })} placeholder="HDFC0001234" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono uppercase" /></div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const BankAccountList = ({ refreshKey }: { refreshKey: number }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingData, setEditingData] = useState<any | null>(null);

  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any[] | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await accountingService.getBankAccounts();
      setAccounts(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch bank accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshKey]);

  const handleEdit = async (id: number | string) => {
    try {
      const detail = await accountingService.getBankAccount(id);
      setEditingData(detail);
      setIsEditOpen(true);
    } catch (err) {
      toast.error("Failed to fetch account details");
    }
  };

  const handleViewLedger = async (acc: any) => {
    setLedgerAccount({ account_name: acc.bank_name, account_code: acc.account_number });
    setLedgerData(null);
    setIsLedgerOpen(true);
    try {
      const res = await accountingService.getBankAccountLedger(acc.id);
      setLedgerData(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch ledger");
      setIsLedgerOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Bank Accounts</h3>
        <button onClick={fetchAccounts} className="text-xs font-bold text-blue-600 hover:text-blue-700">Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Account Name", "Bank Name", "Account No", "IFSC", "Balance", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-6 text-sm text-slate-400">Loading accounts...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-sm text-slate-400">No bank accounts found. Click "Add Account" to create one.</td></tr>
            ) : accounts.map(acc => (
              <tr key={acc.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-xs font-bold text-slate-800">{acc.account_name || "Primary Current"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{acc.bank_name}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{acc.account_number}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{acc.ifsc_code}</td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-600">₹{Number(acc.balance || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleViewLedger(acc)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">View Ledger</button>
                    <button onClick={() => handleEdit(acc.id)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddBankAccountModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingData(null); }}
        onSuccess={fetchAccounts}
        initialData={editingData}
      />

      <LedgerModal
        isOpen={isLedgerOpen}
        onClose={() => { setIsLedgerOpen(false); setLedgerAccount(null); }}
        account={ledgerAccount}
        ledgerData={ledgerData}
      />
    </div>
  );
};

// --- BANK RECONCILIATION ---
const BankReconciliationDashboard = ({ dashboardData }: { dashboardData: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Pending Items</h3>
      <p className="text-3xl font-black text-amber-500">{dashboardData?.pending_count || 0}</p>
      <p className="text-xs text-slate-500 mt-2">Unmatched ERP transactions</p>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Matched Today</h3>
      <p className="text-3xl font-black text-emerald-500">{dashboardData?.matched_today || 0}</p>
      <p className="text-xs text-slate-500 mt-2">Successfully reconciled</p>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Discrepancy</h3>
      <p className="text-3xl font-black text-rose-500">₹{dashboardData?.discrepancy_amount || 0}</p>
      <p className="text-xs text-slate-500 mt-2">Bank vs ERP Difference</p>
    </div>
  </div>
);

const CreateBankTransactionModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    bank_account_id: 0,
    transaction_date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: "Deposit",
    description: "",
    reference_number: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountingService.getBankAccounts().then(res => {
        setAccountsList(Array.isArray(res) ? res : res?.data || []);
      }).catch(() => { });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await accountingService.createBankTransaction(formData);
      toast.success("Transaction Created!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to create transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Bank Transaction"
      maxWidth="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? "Creating..." : "Create Transaction"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account *</label>
          <select required value={formData.bank_account_id || ""} onChange={e => setFormData({ ...formData, bank_account_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select a Bank Account</option>
            {accountsList.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date *</label>
          <input type="date" required value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount *</label>
          <input type="number" required value={formData.amount || ""} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type *</label>
          <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description *</label>
          <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number *</label>
          <input type="text" required value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
      </form>
    </Modal>
  );
};

const AutoRunReconModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [bankAccountId, setBankAccountId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountingService.getBankAccounts().then(res => setAccountsList(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await accountingService.autoRunBankReconciliation(bankAccountId);
      toast.success("Auto Reconciliation completed!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to run auto reconciliation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auto Run Reconciliation" maxWidth="max-w-md" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isLoading || !bankAccountId} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
          {isLoading ? "Running..." : "Run Recon"}
        </button>
      </>
    }>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Bank Account *</label>
          <select required value={bankAccountId || ""} onChange={e => setBankAccountId(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select a Bank Account</option>
            {accountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
};

const MatchTransactionModal = ({ isOpen, onClose, onSuccess, initialTransactionId, pendingTransactions }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialTransactionId: string | number; pendingTransactions: any[] }) => {
  const [transactionId, setTransactionId] = useState<string | number>(initialTransactionId);
  const [journalId, setJournalId] = useState<string | number>("");
  const [isLoading, setIsLoading] = useState(false);
  const [journalsList, setJournalsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTransactionId(initialTransactionId);
      accountingService.getJournal().then(res => setJournalsList(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
    }
  }, [isOpen, initialTransactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await accountingService.matchBankTransaction(transactionId, journalId);
      toast.success("Transaction Matched!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to match transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Transaction" maxWidth="max-w-md" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isLoading || !transactionId || !journalId} className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
          {isLoading ? "Matching..." : "Match"}
        </button>
      </>
    }>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Transaction *</label>
          <select required value={transactionId || ""} onChange={e => setTransactionId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select a Transaction</option>
            {pendingTransactions.map(txn => <option key={txn.id} value={txn.id}>{txn.description} - ₹{txn.amount}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Journal Entry *</label>
          <select required value={journalId || ""} onChange={e => setJournalId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select a Journal Entry</option>
            {journalsList.map(j => <option key={j.id} value={j.id}>{j.entry_number || j.id} - {j.description}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
};

const BankReconciliationWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "dashboard");
  const tabs = [{ key: "dashboard", label: "Dashboard" }, { key: "pending", label: "Pending" }, { key: "matched", label: "Matched" }, { key: "history", label: "History" }];

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingData, setPendingData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAutoRunModalOpen, setIsAutoRunModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatchTxn, setSelectedMatchTxn] = useState<string | number>("");

  const fetchReconData = () => {
    accountingService.getReconciliationDashboard().then(res => setDashboardData(res?.data || res || {})).catch(() => { });
    accountingService.getPendingReconciliations().then(res => setPendingData(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
    accountingService.getReconciliationHistory().then(res => setHistoryData(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
  };

  useEffect(() => {
    fetchReconData();
  }, []);

  const openMatchModal = (transactionId: string | number) => {
    setSelectedMatchTxn(transactionId);
    setIsMatchModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => setIsTransactionModalOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">+ Add Bank Txn</button>
          <button onClick={() => setIsAutoRunModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">Auto Run Recon</button>
        </div>
      </div>

      {activeSubTab === "dashboard" && <BankReconciliationDashboard dashboardData={dashboardData} />}

      {activeSubTab === "pending" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-5">
          <h3 className="font-bold text-slate-800 mb-4">Pending Reconciliation</h3>
          {pendingData.length === 0 ? <p className="text-sm text-slate-500">No pending transactions.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Date", "Description", "Amount", "Reference", "Action"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-600">{row.transaction_date || "-"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{row.description || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{row.amount || "-"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.reference_number || "-"}</td>
                      <td className="px-4 py-3 text-xs">
                        <button onClick={() => openMatchModal(row.id)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100">Match</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "matched" && <GenericTableSection title="Matched Transactions" columns={["Date", "Bank Entry", "ERP Entry", "Match Date", "Status"]} data={[["2024-11-01", "₹1,45,000 (Cr)", "₹1,45,000", "2024-11-01", "Matched"]]} />}

      {activeSubTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Reconciliation History</h3>
            <button onClick={async () => { try { await accountingService.exportReconciliationCsv(); toast.success("Exported!"); } catch (e) { toast.error("Export failed"); } }} className="text-xs font-bold text-blue-600 hover:text-blue-700">Export CSV</button>
          </div>
          {historyData.length === 0 ? <p className="text-sm text-slate-500">No history available.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Period", "Account", "Opening Bal", "Closing Bal", "Status"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-600">{row.period || "-"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{row.account || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{row.opening_balance || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{row.closing_balance || "-"}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600 font-bold">{row.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CreateBankTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={fetchReconData}
      />
      <AutoRunReconModal
        isOpen={isAutoRunModalOpen}
        onClose={() => setIsAutoRunModalOpen(false)}
        onSuccess={fetchReconData}
      />
      <MatchTransactionModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onSuccess={fetchReconData}
        initialTransactionId={selectedMatchTxn}
        pendingTransactions={pendingData}
      />
    </div>
  );
};



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






const PettyCashLedgerTable = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    accountingService.getPettyCashLedger().then(res => {
      setData(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => {
      toast.error("Failed to fetch petty cash ledger");
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Petty Cash Register</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Voucher No", "Expense", "Amount", "Approved By"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-5 text-sm text-slate-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-5 text-sm text-slate-500">No petty cash entries found.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.voucher_no || row.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{row.expense || row.details}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{row.amount || row.debit || row.credit}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.approved_by || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BankBookLedgerTable = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    accountingService.getBankBookLedger().then(res => {
      setData(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => {
      toast.error("Failed to fetch bank book ledger");
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Bank Book Ledger</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Ref", "Details", "Withdrawal", "Deposit", "Balance"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">No bank book entries found.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.ref || row.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{row.details || row.description}</td>
                  <td className="px-4 py-3 text-xs font-bold text-rose-600">{row.withdrawal ? `₹${row.withdrawal}` : "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-600">{row.deposit ? `₹${row.deposit}` : "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{row.balance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BankBookWrapper = () => (
  <div className="space-y-6">
    <BankBookLedgerTable />
  </div>
);

// --- WRAPPERS ---
const BankAccountsWrapper = ({ initialSubTab, refreshKey }: { initialSubTab?: string, refreshKey: number }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");

  const tabs = [{ key: "list", label: "Bank Accounts" }, { key: "statements", label: "Statements" }, { key: "details", label: "Account Details" }];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>

      {activeSubTab === "list" && <BankAccountList refreshKey={refreshKey} />}
      {(activeSubTab === "statements" || activeSubTab === "details") && <GenericTableSection title={tabs.find(t => t.key === activeSubTab)?.label || ""} columns={["Date", "Description", "Ref", "Amount"]} data={[["2024-11-01", "Opening Balance", "-", "₹0"]]} />}
    </div>
  );
};

const CashLedgerTable = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    accountingService.getCashBookLedger().then(res => {
      setData(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => {
      toast.error("Failed to fetch cash book ledger");
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Cash Ledger</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Voucher No", "Type", "Debit", "Credit", "Balance"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">No ledger entries found.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500">{row.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.voucher_no || row.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.type}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-600">{row.debit ? `₹${row.debit}` : "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-rose-600">{row.credit ? `₹${row.credit}` : "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{row.balance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CashBookWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "ledger");

  const tabs = [{ key: "ledger", label: "Cash Ledger" }, { key: "petty", label: "Petty Cash" }];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>

      {activeSubTab === "petty" && <PettyCashLedgerTable />}
      {activeSubTab === "ledger" && <CashLedgerTable />}
    </div>
  );
};

// --- MAIN PAGE ---

const TABS: { key: TabKey; label: string }[] = [
  { key: "accounts", label: "Bank Accounts" },
  { key: "cash", label: "Cash Book" },
  { key: "bank-book", label: "Bank Book" },
  { key: "reconciliation", label: "Bank Reconciliation" },
];

const BankingPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "accounts": "accounts",
      "cash": "cash",
      "bank-book": "bank-book",
      "reconciliation": "reconciliation",
    };
    return map[currentSub || ""] || "accounts";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/banking/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Bank & Cash Management" breadcrumb={["Accountant", "Banking"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Main Header (Title + Buttons + Tabs + Stat Cards) */}
        <BankingHeader activeTab={activeTab} onAddAccount={() => setIsAddAccountModalOpen(true)} onImportSuccess={() => setRefreshKey(prev => prev + 1)} tabsNode={
          <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
                  }`}>
                {tab.label}
              </button>
            ))}
          </div>
        } />

        <AddBankAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        {/* Content Rendering */}
        <div className="mt-6">
          {activeTab === "accounts" && <BankAccountsWrapper initialSubTab={subTab} key={subTab || "add"} refreshKey={refreshKey} />}
          {activeTab === "cash" && <CashBookWrapper initialSubTab={subTab} key={subTab || "receipts"} />}
          {activeTab === "reconciliation" && <BankReconciliationWrapper initialSubTab={subTab} key={subTab || "dashboard"} />}
          {activeTab === "bank-book" && <BankBookWrapper />}
        </div>
      </PageTransition>
    </>
  );
};

export default BankingPage;
