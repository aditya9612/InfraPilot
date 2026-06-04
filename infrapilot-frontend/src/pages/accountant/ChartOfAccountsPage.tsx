import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateAccountModal from "../../components/forms/accounting/CreateAccountModal";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import toast from "react-hot-toast";
import type { ChartAccount, AccountType } from "../../types/accounting";
import { expenseService } from "../../services/expenseService";

const MOCK_COA: ChartAccount[] = [
  {
    id: "1",
    account_name: "Current Assets",
    account_code: "1000",
    account_type: "Asset",
    opening_balance: 5000000,
    current_balance: 5240500,
    is_active: true,
    description: "All short-term assets convertible within a year",
    children: [
      {
        id: "1-1",
        account_name: "Bank Accounts",
        account_code: "1100",
        account_type: "Asset",
        parent_account_id: "1",
        opening_balance: 2000000,
        current_balance: 2150000,
        is_active: true,
        description: "Balances held in all bank accounts",
        children: [
          {
            id: "1-1-1",
            account_name: "HDFC Bank - 50100",
            account_code: "1101",
            account_type: "Asset",
            parent_account_id: "1-1",
            opening_balance: 1000000,
            current_balance: 1250000,
            is_active: true,
            description: "HDFC savings account ending 50100",
          },
        ],
      },
      {
        id: "1-2",
        account_name: "Accounts Receivable",
        account_code: "1200",
        account_type: "Asset",
        parent_account_id: "1",
        opening_balance: 3000000,
        current_balance: 3090500,
        is_active: true,
        description: "Amounts due from clients for completed work",
      },
    ],
  },
  {
    id: "2",
    account_name: "Current Liabilities",
    account_code: "2000",
    account_type: "Liability",
    opening_balance: 1500000,
    current_balance: 1450000,
    is_active: true,
    description: "Short-term obligations due within one year",
    children: [
      {
        id: "2-1",
        account_name: "Accounts Payable",
        account_code: "2100",
        account_type: "Liability",
        parent_account_id: "2",
        opening_balance: 1500000,
        current_balance: 1450000,
        is_active: true,
        description: "Amounts owed to vendors and suppliers",
      },
    ],
  },
  {
    id: "3",
    account_name: "Project Revenue",
    account_code: "3000",
    account_type: "Income",
    opening_balance: 0,
    current_balance: 8500000,
    is_active: true,
    description: "Income earned from project contracts",
  },
  {
    id: "4",
    account_name: "Direct Expenses",
    account_code: "4000",
    account_type: "Expense",
    opening_balance: 0,
    current_balance: 4200000,
    is_active: true,
    description: "Costs directly attributable to project execution",
    children: [
      {
        id: "4-1",
        account_name: "Material Cost",
        account_code: "4100",
        account_type: "Expense",
        parent_account_id: "4",
        opening_balance: 0,
        current_balance: 2800000,
        is_active: true,
        description: "Raw material and supply procurement costs",
      },
      {
        id: "4-2",
        account_name: "Labor Charges",
        account_code: "4200",
        account_type: "Expense",
        parent_account_id: "4",
        opening_balance: 0,
        current_balance: 1400000,
        is_active: true,
        description: "Wages and contractor payments on-site",
      },
    ],
  },
];

// Helper: find parent account name by ID
const findAccountName = (accounts: ChartAccount[], id?: string): string => {
  if (!id) return "—";
  for (const acc of accounts) {
    if (acc.id === id) return acc.account_name;
    if (acc.children) {
      const found = findAccountName(acc.children, id);
      if (found !== "—") return found;
    }
  }
  return "—";
};

const accountTypeStyle: Record<string, string> = {
  Asset: "bg-emerald-100 text-emerald-700",
  Liability: "bg-rose-100 text-rose-700",
  Income: "bg-blue-100 text-blue-700",
  Expense: "bg-amber-100 text-amber-700",
};

const ChartOfAccountsPage = () => {
  const { category } = useParams<{ category: string }>();
  const [coa, setCoa] = useState<ChartAccount[]>(MOCK_COA);
  const [isLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountType | "All">("All");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(["1", "2", "4"]),
  );

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

  const toggleExpand = (id: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateAccount = (newAccountData: any) => {
    const newAccount: ChartAccount = {
      ...newAccountData,
      id: Math.random().toString(36).substr(2, 9),
      current_balance: newAccountData.opening_balance || 0,
      is_active: true,
    };
    setCoa((prev) => [...prev, newAccount]);
    toast.success("Account created successfully!");
    setIsModalOpen(false);
  };

  const handleCreateExpense = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        project_id: data.project_id ? Number(data.project_id) : 1,
        category: data.category,
        description: data.remarks || data.description || "",
        amount: Number(data.amount),
        expense_date: data.expense_date,
        payment_mode: data.payment_mode,
        ...(data.boq_item_id ? { boq_item_id: Number(data.boq_item_id) } : {}),
      };
      await expenseService.createExpense(payload);
      toast.success("Expense recorded successfully!");
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Failed to record expense. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCOA =
    activeTab === "All"
      ? coa
      : coa.filter((acc) => acc.account_type === activeTab);

  // Flatten tree for CSV export
  const flattenAccounts = (accounts: ChartAccount[], parentName = ""): any[] => {
    const rows: any[] = [];
    for (const acc of accounts) {
      rows.push({
        account_name: acc.account_name,
        account_code: acc.account_code,
        account_type: acc.account_type,
        parent_account: parentName || "—",
        opening_balance: acc.opening_balance,
        description: (acc as any).description || "—",
      });
      if (acc.children?.length) {
        rows.push(...flattenAccounts(acc.children, acc.account_name));
      }
    }
    return rows;
  };

  const downloadReport = () => {
    const label = activeTab === "All" ? "All Accounts" : `${activeTab} Accounts`;
    const rows = flattenAccounts(filteredCOA);
    const headers = ["Account Name", "Account Code", "Account Type", "Parent Account", "Opening Balance (INR)", "Description"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.account_name}"`,
          r.account_code,
          r.account_type,
          `"${r.parent_account}"`,
          r.opening_balance,
          `"${r.description}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chart_of_Accounts_${label.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${label} report downloaded!`);
  };

  const renderAccountRow = (acc: ChartAccount, level = 0) => {
    const hasChildren = acc.children && acc.children.length > 0;
    const isExpanded = expandedAccounts.has(acc.id);
    const parentName = findAccountName(coa, acc.parent_account_id);

    return (
      <div key={acc.id}>
        <div
          className="grid items-center px-4 py-4 border-b border-slate-50 hover:bg-slate-50/70 transition-colors group cursor-pointer text-sm"
          style={{
            gridTemplateColumns: "2.5rem 1.5fr 1fr 1fr 1fr 1.2fr 1.5fr 5rem",
          }}
          onClick={() => hasChildren && toggleExpand(acc.id)}
        >
          {/* Expand chevron */}
          <div className="flex items-center justify-center">
            {hasChildren && (
              <span
                className={`text-slate-300 transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          {/* Account Name */}
          <div style={{ paddingLeft: `${level * 1.25}rem` }}>
            <p className="text-sm font-bold text-slate-800 leading-snug">{acc.account_name}</p>
          </div>

          {/* Account Code */}
          <div>
            <span className="inline-block text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
              {acc.account_code}
            </span>
          </div>

          {/* Account Type */}
          <div>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-widest ${accountTypeStyle[acc.account_type] || "bg-slate-100 text-slate-500"}`}>
              {acc.account_type}
            </span>
          </div>

          {/* Parent Account */}
          <div>
            <p className="text-xs text-slate-500 font-medium truncate">{parentName}</p>
          </div>

          {/* Opening Balance */}
          <div>
            <p className="text-sm font-bold text-slate-700 tabular-nums">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(acc.opening_balance)}
            </p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-slate-400 truncate">{(acc as any).description || "—"}</p>
          </div>

          {/* Action */}
          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all">
            <button className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all whitespace-nowrap">
              + Sub
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {acc.children?.map((child) => renderAccountRow(child, level + 1))}
          </div>
        )}
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
              Accountant
            </p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
              {activeTab === "All" ? "Full Ledger Hierarchy" : `${activeTab} Accounts`}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Accounting structure and General Ledger hierarchy for the entire organization.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Download Report */}
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:border-primary/30 hover:text-primary transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </button>

            {/* Create / Record */}
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="text-base leading-none">+</span>
              {activeTab === "Expense" ? "Record New Expense" : "Create New Account"}
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Table Header */}
          <div
            className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
            style={{
              display: "grid",
              gridTemplateColumns: "2.5rem 1.5fr 1fr 1fr 1fr 1.2fr 1.5fr 5rem",
              alignItems: "center",
            }}
          >
            <div />
            <div>Account Name</div>
            <div>Account Code</div>
            <div>Account Type</div>
            <div>Parent Account</div>
            <div>Opening Balance</div>
            <div>Description</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Synchronizing Ledger...
              </p>
            </div>
          ) : filteredCOA.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredCOA.map((acc) => renderAccountRow(acc))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                No accounts found in this category.
              </p>
            </div>
          )}
        </div>
      </PageTransition>

      {activeTab === "Expense" ? (
        <CreateExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateExpense}
          projects={[]}
        />
      ) : (
        <CreateAccountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {}}
          parentAccounts={coa}
          onSubmitMock={handleCreateAccount}
        />
      )}
    </>
  );
};

export default ChartOfAccountsPage;
