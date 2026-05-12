import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateAccountModal from "../../components/forms/accounting/CreateAccountModal";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import toast from "react-hot-toast";
import type { ChartAccount, AccountType } from "../../types/accounting";
import { expenseService } from "../../services/expenseService";
import { Eye, Edit2, Trash2, Plus } from "lucide-react";
import ViewAccountModal from "../../components/forms/accounting/ViewAccountModal";
import ConfirmModal from "../../components/common/ConfirmModal";

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
  const [viewingAccount, setViewingAccount] = useState<ChartAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<ChartAccount | null>(null);

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
    if (editingAccount) {
      setCoa(prev => prev.map(acc => acc.id === editingAccount.id ? { ...acc, ...newAccountData } : acc));
      toast.success("Account updated successfully!");
    } else {
      const newAccount: ChartAccount = {
        ...newAccountData,
        id: Math.random().toString(36).substr(2, 9),
        current_balance: newAccountData.opening_balance || 0,
        is_active: true,
      };
      setCoa((prev) => [...prev, newAccount]);
      toast.success("Account created successfully!");
    }
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    if (accountToDelete) {
      const recursiveDeleteAndPromote = (accounts: ChartAccount[], targetId: string): ChartAccount[] => {
        let newAccounts: ChartAccount[] = [];

        for (const acc of accounts) {
          if (acc.id === targetId) {
            // If this is the account to delete, promote its children
            if (acc.children) {
              newAccounts = [...newAccounts, ...acc.children];
            }
          } else {
            // Otherwise, keep it and process its children
            newAccounts.push({
              ...acc,
              children: acc.children ? recursiveDeleteAndPromote(acc.children, targetId) : undefined
            });
          }
        }
        return newAccounts;
      };

      setCoa(prev => recursiveDeleteAndPromote(prev, accountToDelete.id));
      toast.success("Account removed. Sub-accounts have been promoted.");
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    }
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
          <div className="w-10 shrink-0">
            {hasChildren && (
              <span
                className={`text-slate-300 transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-6">
            <div className="w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100 text-center">
              {acc.account_code}
            </div>
            <div>
              <p className="text-sm font-black text-slate-700 tracking-tight">
                {acc.account_name}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${
                  acc.account_type === 'Asset' ? 'text-emerald-500' :
                  acc.account_type === 'Liability' ? 'text-rose-500' :
                  acc.account_type === 'Income' ? 'text-primary' : 'text-amber-500'
              }`}>
                {acc.account_type}
              </p>
            </div>
          </div>
          <div className="w-48 text-right">
            <p className="text-sm font-black text-slate-800 tracking-tight">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
              }).format(acc.current_balance)}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Valuation</p>
          </div>
          <div className="w-32 text-right opacity-100 flex justify-end gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setViewingAccount(acc);
              }}
              className="p-1.5 text-slate-400 hover:text-primary transition-all"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setEditingAccount(acc);
                setIsModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
              title="Edit Account"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setAccountToDelete(acc);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"
              title="Delete Account"
            >
              <Trash2 className="w-4 h-4" />
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

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "All"
                ? "Full Ledger Hierarchy"
                : `${activeTab} Accounts`}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Accounting structure and General Ledger hierarchy for the entire organization.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xl">+</span>
            {activeTab === "Expense"
              ? "Record New Expense"
              : "Create New Account"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <div className="w-10"></div>
            <div className="flex-1 flex gap-6">
              <div className="w-20 text-center">GL Code</div>
              <div>Account Name & Category</div>
            </div>
            <div className="w-48 text-right">Current Valuation</div>
            <div className="w-32 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="py-32 text-center">
              <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-6 shadow-sm" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Synchronizing Ledger...
              </p>
            </div>
          ) : filteredCOA.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredCOA.map((acc) => renderAccountRow(acc))}
            </div>
          ) : (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
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
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
          }}
          onSuccess={() => {}}
          parentAccounts={coa}
          onSubmitMock={handleCreateAccount}
          initialData={editingAccount}
        />
      )}

      <ViewAccountModal 
        isOpen={!!viewingAccount}
        onClose={() => setViewingAccount(null)}
        account={viewingAccount}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Ledger Account"
        message={`Are you sure you want to remove "${accountToDelete?.account_name}"? This action cannot be undone and may affect financial reports.`}
        confirmText="Delete Account"
        type="danger"
      />
    </>
  );
};

export default ChartOfAccountsPage;
