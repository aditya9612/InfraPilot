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
  },
  {
    id: "4",
    account_name: "Direct Expenses",
    account_code: "4000",
    account_type: "Expense",
    opening_balance: 0,
    current_balance: 4200000,
    is_active: true,
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
      },
    ],
  },
];

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

  // Called when Create button is clicked on the Expenses tab
  // → POST /api/v1/expenses
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

  const renderAccountRow = (acc: ChartAccount, level = 0) => {
    const hasChildren = acc.children && acc.children.length > 0;
    const isExpanded = expandedAccounts.has(acc.id);

    return (
      <div key={acc.id}>
        <div
          className={`flex items-center px-6 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer`}
          style={{ paddingLeft: `${level * 2 + 1.5}rem` }}
          onClick={() => hasChildren && toggleExpand(acc.id)}
        >
          <div className="w-8 shrink-0">
            {hasChildren && (
              <span
                className={`text-slate-400 transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}
              >
                ▶
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-4">
            <div className="w-24 text-xs font-black text-slate-400 uppercase tracking-tighter">
              {acc.account_code}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {acc.account_name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {acc.account_type}
              </p>
            </div>
          </div>
          <div className="w-48 text-right">
            <p className="text-sm font-black text-slate-800">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(acc.current_balance)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Balance</p>
          </div>
          <div className="w-24 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-primary text-xs font-bold hover:underline">
              + Sub
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === "All"
                ? "Full Ledger Hierarchy"
                : `${activeTab} Accounts`}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Accounting structure and General Ledger hierarchy.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-lg">+</span>
            {activeTab === "Expense"
              ? "Record New Expense"
              : "Create New Account"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-8"></div>
            <div className="flex-1 flex gap-4">
              <div className="w-24">GL Code</div>
              <div>Account Name & Category</div>
            </div>
            <div className="w-48 text-right">Current Valuation</div>
            <div className="w-24 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400">
                Synchronizing Ledger...
              </p>
            </div>
          ) : filteredCOA.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredCOA.map((acc) => renderAccountRow(acc))}
            </div>
          ) : (
            <div className="p-20 text-center">
              <p className="text-sm font-bold text-slate-400">
                No accounts found in this category.
              </p>
            </div>
          )}
        </div>
      </PageTransition>

      {/* On Expenses tab → expense modal hitting POST /api/v1/expenses */}
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
