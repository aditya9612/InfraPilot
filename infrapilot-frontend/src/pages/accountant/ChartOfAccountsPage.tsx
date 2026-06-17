import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateAccountModal from "../../components/forms/accounting/CreateAccountModal";
import toast from "react-hot-toast";
import type { ChartAccount, AccountType } from "../../types/accounting";

// Full COA Structure for Construction ERP
const MOCK_COA: ChartAccount[] = [
  {
    id: "1",
    account_name: "Assets",
    account_code: "AST",
    account_type: "Asset",
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    description: "All company assets",
    children: [
      {
        id: "1-1",
        account_name: "Current Assets",
        account_code: "AST-100",
        account_type: "Asset",
        parent_account_id: "1",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: [
          { id: "AST001", account_name: "Cash in Hand", account_code: "AST001", account_type: "Asset", parent_account_id: "1-1", opening_balance: 50000, current_balance: 50000, is_active: true },
          { id: "AST002", account_name: "Petty Cash", account_code: "AST002", account_type: "Asset", parent_account_id: "1-1", opening_balance: 10000, current_balance: 10000, is_active: true },
          { id: "AST003", account_name: "Bank Accounts", account_code: "AST003", account_type: "Asset", parent_account_id: "1-1", opening_balance: 200000, current_balance: 200000, is_active: true },
          { id: "AST004", account_name: "Client Receivables", account_code: "AST004", account_type: "Asset", parent_account_id: "1-1", opening_balance: 150000, current_balance: 150000, is_active: true },
          { id: "AST005", account_name: "GST Receivable", account_code: "AST005", account_type: "Asset", parent_account_id: "1-1", opening_balance: 25000, current_balance: 25000, is_active: true },
          { id: "AST013", account_name: "Advance to Vendors", account_code: "AST013", account_type: "Asset", parent_account_id: "1-1", opening_balance: 0, current_balance: 0, is_active: true }
        ]
      },
      {
        id: "1-2",
        account_name: "Fixed Assets",
        account_code: "AST-200",
        account_type: "Asset",
        parent_account_id: "1",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: [
          { id: "AST006", account_name: "Land", account_code: "AST006", account_type: "Asset", parent_account_id: "1-2", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "AST007", account_name: "Buildings", account_code: "AST007", account_type: "Asset", parent_account_id: "1-2", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "AST008", account_name: "Machinery", account_code: "AST008", account_type: "Asset", parent_account_id: "1-2", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "AST009", account_name: "Vehicles", account_code: "AST009", account_type: "Asset", parent_account_id: "1-2", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "AST010", account_name: "Equipment", account_code: "AST010", account_type: "Asset", parent_account_id: "1-2", opening_balance: 0, current_balance: 0, is_active: true }
        ]
      },
      {
        id: "1-3",
        account_name: "Other Assets",
        account_code: "AST-300",
        account_type: "Asset",
        parent_account_id: "1",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: [
          { id: "AST011", account_name: "Security Deposits", account_code: "AST011", account_type: "Asset", parent_account_id: "1-3", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "AST012", account_name: "Advances Given", account_code: "AST012", account_type: "Asset", parent_account_id: "1-3", opening_balance: 0, current_balance: 0, is_active: true }
        ]
      }
    ]
  },
  {
    id: "2",
    account_name: "Liabilities",
    account_code: "LIA",
    account_type: "Liability",
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    children: [
      {
        id: "2-1",
        account_name: "Current Liabilities",
        account_code: "LIA-100",
        account_type: "Liability",
        parent_account_id: "2",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: [
          { id: "LIA001", account_name: "Vendor Payables", account_code: "LIA001", account_type: "Liability", parent_account_id: "2-1", opening_balance: 150000, current_balance: 150000, is_active: true },
          { id: "LIA002", account_name: "Contractor Payables", account_code: "LIA002", account_type: "Liability", parent_account_id: "2-1", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "LIA003", account_name: "Salary Payable", account_code: "LIA003", account_type: "Liability", parent_account_id: "2-1", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "LIA004", account_name: "GST Payable", account_code: "LIA004", account_type: "Liability", parent_account_id: "2-1", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "LIA005", account_name: "TDS Payable", account_code: "LIA005", account_type: "Liability", parent_account_id: "2-1", opening_balance: 0, current_balance: 0, is_active: true }
        ]
      },
      {
        id: "2-2",
        account_name: "Loans",
        account_code: "LIA-200",
        account_type: "Liability",
        parent_account_id: "2",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: [
          { id: "LIA006", account_name: "Bank Loan", account_code: "LIA006", account_type: "Liability", parent_account_id: "2-2", opening_balance: 0, current_balance: 0, is_active: true },
          { id: "LIA007", account_name: "Director Loan", account_code: "LIA007", account_type: "Liability", parent_account_id: "2-2", opening_balance: 0, current_balance: 0, is_active: true }
        ]
      },
      {
        id: "2-3",
        account_name: "Other Liabilities",
        account_code: "LIA-300",
        account_type: "Liability",
        parent_account_id: "2",
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        children: []
      }
    ]
  },
  {
    id: "3",
    account_name: "Income",
    account_code: "INC",
    account_type: "Income",
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    children: [
      { id: "INC001", account_name: "Project Revenue", account_code: "INC001", account_type: "Income", parent_account_id: "3", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "INC002", account_name: "RA Bill Revenue", account_code: "INC002", account_type: "Income", parent_account_id: "3", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "INC003", account_name: "Material Sales", account_code: "INC003", account_type: "Income", parent_account_id: "3", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "INC004", account_name: "Equipment Rental Income", account_code: "INC004", account_type: "Income", parent_account_id: "3", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "INC006", account_name: "Other Income", account_code: "INC006", account_type: "Income", parent_account_id: "3", opening_balance: 0, current_balance: 0, is_active: true }
    ]
  },
  {
    id: "4",
    account_name: "Expenses",
    account_code: "EXP",
    account_type: "Expense",
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    children: [
      { id: "EXP001", account_name: "Material Expenses", account_code: "EXP001", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP002", account_name: "Labor Expenses", account_code: "EXP002", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP003", account_name: "Contractor Expenses", account_code: "EXP003", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP004", account_name: "Equipment Expenses", account_code: "EXP004", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP005", account_name: "Fuel Expenses", account_code: "EXP005", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP006", account_name: "Office Expenses", account_code: "EXP006", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP007", account_name: "Travel Expenses", account_code: "EXP007", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP008", account_name: "Legal Expenses", account_code: "EXP008", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true },
      { id: "EXP009", account_name: "Miscellaneous Expenses", account_code: "EXP009", account_type: "Expense", parent_account_id: "4", opening_balance: 0, current_balance: 0, is_active: true }
    ]
  }
];

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
    // Only add leaf nodes or specific level nodes to the table based on preference. 
    // Here we'll add all for visibility, or only leaves if they have no children.
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

const ChartOfAccountsPage = () => {
  const { category } = useParams<{ category: string }>();
  const [coa, setCoa] = useState<ChartAccount[]>(MOCK_COA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [activeTab, setActiveTab] = useState<AccountType | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Left side selection
  const [selectedFolder, setSelectedFolder] = useState<ChartAccount | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2", "3", "4", "1-1", "1-2", "2-1"]));

  useEffect(() => {
    if (category) {
      const mapping: Record<string, AccountType> = {
        assets: "Asset",
        liabilities: "Liability",
        income: "Income",
        expenses: "Expense",
      };
      setActiveTab(mapping[category.toLowerCase()] || "All");
    } else {
      setActiveTab("All");
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

  const handleCreateAccount = (newAccountData: any) => {
    const newAccount: ChartAccount = {
      ...newAccountData,
      id: editingAccount ? editingAccount.id : Math.random().toString(36).substr(2, 9),
      current_balance: newAccountData.opening_balance || 0,
      is_active: newAccountData.status === "Active",
    };

    // Recursive update/add logic
    const updateNode = (nodes: ChartAccount[]): ChartAccount[] => {
      // If editing
      if (editingAccount) {
        return nodes.map(node => {
          if (node.id === editingAccount.id) return { ...node, ...newAccount };
          if (node.children) return { ...node, children: updateNode(node.children) };
          return node;
        });
      }

      // If creating
      if (!newAccount.parent_account_id) {
        return [...nodes, newAccount];
      }
      return nodes.map(node => {
        if (node.id === newAccount.parent_account_id) {
          return { ...node, children: [...(node.children || []), newAccount] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setCoa(updateNode(coa));
    toast.success(editingAccount ? "Account updated successfully!" : "Account created successfully!");
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    const deleteNode = (nodes: ChartAccount[]): ChartAccount[] => {
      return nodes.filter(node => node.id !== id).map(node => {
        if (node.children) {
          return { ...node, children: deleteNode(node.children) };
        }
        return node;
      });
    };
    setCoa(deleteNode(coa));
    toast.success("Account deleted!");
  };

  const filteredCOA = activeTab === "All" ? coa : coa.filter((acc) => acc.account_type === activeTab);

  // For the right side table, if a folder is selected, show its children, otherwise show flattened filtered COA
  const rawTableData = selectedFolder
    ? (selectedFolder.children || [])
    : getFlatAccounts(filteredCOA);

  const tableData = rawTableData.filter(acc =>
    acc.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.account_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import COA
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export COA
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📒</span> View Ledger
            </button>
            <button
              onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
            >
              <span className="text-base leading-none">+</span> Add Account
            </button>
          </div>
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
            {renderTree(filteredCOA)}
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
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.length > 0 ? (
                    tableData.map((acc, idx) => (
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
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${acc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {acc.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => toast.success("Viewing Account Details!")} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">👁</button>
                            <button onClick={() => { setEditingAccount(acc); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">✏️</button>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">🗑</button>
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
          </div>
        </div>
      </PageTransition>

      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAccount(null); }}
        onSuccess={() => { }}
        parentAccounts={coa}
        onSubmitMock={handleCreateAccount}
        initialData={editingAccount}
      />
    </>
  );
};

export default ChartOfAccountsPage;
