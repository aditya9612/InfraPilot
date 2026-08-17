import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateAccountModal from "../../components/forms/accounting/CreateAccountModal";
import LedgerModal from "../../components/forms/accounting/LedgerModal";
import ViewAccountModal from "../../components/forms/accounting/ViewAccountModal";
import toast from "react-hot-toast";
import { accountingService } from "../../services/accountingService";
import type { ChartAccount, AccountType } from "../../types/accounting";
import { ChevronLeft, ChevronRight } from "lucide-react";

// We will fetch from API instead of mock
const MOCK_COA: ChartAccount[] = [];


const accountTypeStyle: Record<string, string> = {
  Asset: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Liability: "bg-rose-100 text-rose-700 border-rose-200",
  Income: "bg-blue-100 text-blue-700 border-blue-200",
  Expense: "bg-amber-100 text-amber-700 border-amber-200",
};

// Flatten to show details table
const getFlatAccounts = (accounts: ChartAccount[], parentName = ""): any[] => {
  let flat: any[] = [];
  accounts.forEach(acc => {
    flat.push({
      ...acc,
      parentName: parentName || "—"
    });
    if (acc.children && acc.children.length > 0) {
      flat = [...flat, ...getFlatAccounts(acc.children, acc.account_name)];
    }
  });
  return flat;
};

// Map backend data to frontend ChartAccount format
const mapBackendAccount = (acc: any): ChartAccount => {
  return {
    ...acc,
    id: acc.id?.toString() || Math.random().toString(36).substr(2, 9),
    account_name: acc.name || acc.account_name,
    account_code: acc.code || acc.account_code,
    account_type: (acc.type || acc.account_type || "Asset").charAt(0).toUpperCase() + (acc.type || acc.account_type || "Asset").slice(1),
    is_active: acc.status === "Active" || acc.is_active === true,
    opening_balance: acc.opening_balance || 0,
    current_balance: acc.current_balance || 0,
    created_at: acc.created_at,
    children: acc.children ? acc.children.map(mapBackendAccount) : undefined
  };
};

const sortAccountsDesc = (accounts: ChartAccount[]): ChartAccount[] => {
  return [...accounts].sort((a, b) => {
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  }).map(acc => ({
    ...acc,
    children: acc.children ? sortAccountsDesc(acc.children) : undefined
  }));
};

const ChartOfAccountsPage = () => {
  const { category } = useParams<{ category: string }>();
  const [coa, setCoa] = useState<ChartAccount[]>(MOCK_COA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [activeTab, setActiveTab] = useState<AccountType | "All">("Asset");
  const [searchQuery, setSearchQuery] = useState("");

  // Left side selection
  const [selectedFolder, setSelectedFolder] = useState<ChartAccount | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2", "3", "4", "1-1", "1-2", "2-1"]));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Modals and Data State
  const [isListView, setIsListView] = useState(true);
  
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any[] | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Pagination states
  const [hierarchyPage, setHierarchyPage] = useState(1);
  const [hierarchyItemsPerPage] = useState(10);
  const [tablePage, setTablePage] = useState(1);
  const [tableItemsPerPage] = useState(10);

  // Reset pagination when tab/category changes
  useEffect(() => {
    setHierarchyPage(1);
    setTablePage(1);
  }, [activeTab]);

  const handleExportCOA = async () => {
    try {
      const response = await accountingService.exportAccounts();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'chart_of_accounts.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Chart of Accounts exported successfully!");
    } catch (e) {
      toast.error("Failed to export Chart of Accounts");
    }
  };

  const handleImportCOA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      await accountingService.importAccounts(formData);
      toast.success("Chart of Accounts imported successfully!");
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to import Chart of Accounts");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = isListView ? await accountingService.getAccounts() : await accountingService.getAccountsTree();
      // Ensure backend array format and map it
      const rawArray = Array.isArray(data) ? data : data?.data || [];
      const mappedArray = rawArray.map(mapBackendAccount);
      setCoa(sortAccountsDesc(mappedArray));
    } catch (err) {
      toast.error("Failed to fetch chart of accounts");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [isListView]); // Refetch when toggling List/Tree view

  useEffect(() => {
    if (category) {
      const mapping: Record<string, AccountType> = {
        assets: "Asset",
        liabilities: "Liability",
        income: "Income",
        expenses: "Expense",
      };
      setActiveTab(mapping[category.toLowerCase()] || "Asset");
    } else {
      setActiveTab("Asset");
    }
  }, [category]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateAccount = () => {
    fetchAccounts();
    toast.success(editingAccount ? "Account updated successfully!" : "Account created successfully!");
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const confirmDelete = (id: string) => {
    setAccountToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!accountToDelete) return;
    try {
      await accountingService.deleteAccount(accountToDelete);
      toast.success("Account deleted!");
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to delete account");
    } finally {
      setDeleteModalOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleViewAccount = async (id: string) => {
    setIsViewModalOpen(true);
    setViewData(null);
    try {
      const data = await accountingService.getAccountDetail(id);
      setViewData(data);
    } catch (err) {
      toast.error("Failed to fetch account details");
      setIsViewModalOpen(false);
    }
  };

  const handleViewLedger = async (acc: any) => {
    setLedgerAccount(acc);
    setIsLedgerModalOpen(true);
    setLedgerData(null);
    try {
      const data = await accountingService.getAccountLedger(acc.id);
      setLedgerData(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch ledger");
      setIsLedgerModalOpen(false);
    }
  };

  const filteredCOA = activeTab === "All" ? coa : coa.filter((acc) => acc.account_type === activeTab);

  // Pagination for Left Side (Hierarchy)
  const totalHierarchyItems = filteredCOA.length;
  const paginatedHierarchy = filteredCOA.slice((hierarchyPage - 1) * hierarchyItemsPerPage, hierarchyPage * hierarchyItemsPerPage);

  // For the right side table, if a folder is selected, show its children, otherwise show flattened filtered COA
  const rawTableData = selectedFolder
    ? (selectedFolder.children || [])
    : getFlatAccounts(filteredCOA);

  const tableData = rawTableData.filter(acc =>
    acc.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.account_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination for Right Side (Table)
  const totalTableItems = tableData.length;
  const paginatedTable = tableData.slice((tablePage - 1) * tableItemsPerPage, tablePage * tableItemsPerPage);

  const renderTree = (accounts: ChartAccount[], level = 0) => {
    return (
      <div className="space-y-1" style={{ paddingLeft: level === 0 ? 0 : "1rem" }}>
        {accounts.map(acc => {
          const hasChildren = acc.children && acc.children.length > 0;
          const isExpanded = expandedFolders.has(acc.id);
          const isSelected = selectedFolder?.id === acc.id;

          return (
            <div key={acc.id}>
              <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolder(acc);
                  if (hasChildren && !isExpanded) toggleFolder(acc.id);
                }}
              >
                {hasChildren ? (
                  <button
                    className="p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={(e) => { e.stopPropagation(); toggleFolder(acc.id); }}
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <span className="w-4" /> // Spacing for leaf nodes
                )}
                <span className="truncate">{acc.account_name}</span>
                <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{acc.account_code}</span>
              </div>
              {hasChildren && isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  {renderTree(acc.children!, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Navbar
        title="Chart of Accounts"
        breadcrumb={["Accountant", "Finance", "COA"]}
      />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Chart of Accounts</h1>
            <p className="text-slate-500 text-sm mt-1">Manage hierarchical general ledger accounts for the organization.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
              <input type="checkbox" className="w-4 h-4 rounded text-primary border-slate-300" checked={isListView} onChange={(e) => setIsListView(e.target.checked)} />
              List View
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImportCOA} className="hidden" accept=".csv,.xlsx" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import COA
            </button>
            <button onClick={handleExportCOA} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export COA
            </button>
            <button
              onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
            >
              <span className="text-base leading-none">+</span> Add Account
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {[
            { key: "Asset", label: "Assets", path: "/accountant/chart-of-accounts/assets" },
            { key: "Liability", label: "Liabilities", path: "/accountant/chart-of-accounts/liabilities" },
            { key: "Income", label: "Income", path: "/accountant/chart-of-accounts/income" },
            { key: "Expense", label: "Expenses", path: "/accountant/chart-of-accounts/expenses" },
          ].map(tab => (
            <button key={tab.key} onClick={() => {
              setActiveTab(tab.key as any);
              window.history.pushState(null, "", tab.path);
            }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side: Tree View */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Account Hierarchy</h2>
              {selectedFolder && (
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              {renderTree(paginatedHierarchy)}
            </div>
            
            {/* Pagination Controls for Hierarchy */}
            {totalHierarchyItems > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {Math.min((hierarchyPage - 1) * hierarchyItemsPerPage + 1, totalHierarchyItems)}–{Math.min(hierarchyPage * hierarchyItemsPerPage, totalHierarchyItems)} of {totalHierarchyItems}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setHierarchyPage(p => Math.max(1, p - 1))}
                    disabled={hierarchyPage === 1}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setHierarchyPage(p => Math.min(Math.ceil(totalHierarchyItems / hierarchyItemsPerPage), p + 1))}
                    disabled={hierarchyPage >= Math.ceil(totalHierarchyItems / hierarchyItemsPerPage)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Account Details Table */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h2 className="text-sm font-bold text-slate-800">
                {selectedFolder ? `${selectedFolder.account_name} Accounts` : "All Accounts"}
              </h2>
              <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                Showing {tableData.length} entries
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-slate-50/80">
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Account Code</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Account Name</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Account Type</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Parent Account</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Opening Balance</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Current Balance</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTable.length > 0 ? (
                    paginatedTable.map((acc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <span className="inline-block text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                            {acc.account_code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-700">{acc.account_name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${accountTypeStyle[acc.account_type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                          {acc.parentName || (selectedFolder?.account_name) || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-700 tabular-nums text-right">
                          {acc.opening_balance !== undefined ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(acc.opening_balance) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-700 tabular-nums text-right">
                          {acc.current_balance !== undefined ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          }).format(acc.current_balance) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${acc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {acc.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleViewAccount(acc.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View Detail">👁</button>
                            <button onClick={() => handleViewLedger(acc)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="View Ledger">📒</button>
                            <button onClick={() => { setEditingAccount(acc); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">✏️</button>
                            <button onClick={() => confirmDelete(acc.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                        No sub-accounts found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Table */}
            {totalTableItems > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="text-[11px] font-bold text-slate-500">
                  Showing {Math.min((tablePage - 1) * tableItemsPerPage + 1, totalTableItems)} to {Math.min(tablePage * tableItemsPerPage, totalTableItems)} of {totalTableItems} entries
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 w-8 text-center">{tablePage}</span>
                  <button
                    onClick={() => setTablePage(p => Math.min(Math.ceil(totalTableItems / tableItemsPerPage), p + 1))}
                    disabled={tablePage >= Math.ceil(totalTableItems / tableItemsPerPage)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAccount(null); }}
        onSuccess={handleCreateAccount}
        initialData={editingAccount}
      />

      <LedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        account={ledgerAccount}
        ledgerData={ledgerData}
      />

      <ViewAccountModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        accountData={viewData}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setAccountToDelete(null); }}
        onConfirm={executeDelete}
        title="Delete Account"
        message="Are you sure you want to delete this record?"
        confirmText="Confirm Deletion"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default ChartOfAccountsPage;
