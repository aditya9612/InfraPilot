import api from "./api";

export const accountingService = {
  getAccounts: async (params?: any) => {
    const response = await api.get("/accountant/accounts", { params });
    return response.data;
  },

  getAccountsTree: async () => {
    const response = await api.get("/accountant/accounts/tree");
    return response.data;
  },

  getAccountDetail: async (id: string | number) => {
    const response = await api.get(`/accountant/accounts/${id}`);
    return response.data;
  },

  createAccount: async (data: any) => {
    const response = await api.post("/accountant/accounts", data);
    return response.data;
  },

  updateAccount: async (id: string | number, data: any) => {
    const response = await api.patch(`/accountant/accounts/${id}`, data);
    return response.data;
  },

  deleteAccount: async (id: string | number) => {
    const response = await api.delete(`/accountant/accounts/${id}`);
    return response.data;
  },

  getAccountLedger: async (id: string | number) => {
    const response = await api.get(`/accountant/accounts/${id}/ledger`);
    return response.data;
  },

  exportAccounts: async () => {
    const response = await api.get("/accountant/accounts/export", { responseType: 'blob' });
    return response.data;
  },

  importAccounts: async (fileData: any) => {
    const response = await api.post("/accountant/accounts/import", fileData);
    return response.data;
  },

  // Receipts
  getReceipts: async (params?: any) => {
    const response = await api.get("/accountant/receipts", { params });
    return response.data;
  },
  getReceiptsSummary: async () => {
    const response = await api.get("/accountant/receipts/summary");
    return response.data;
  },
  createReceipt: async (data: any) => {
    const response = await api.post("/accountant/receipts", data);
    return response.data;
  },

  // Payables
  getPayables: async (params?: any) => {
    const response = await api.get("/accountant/payables", { params });
    return response.data;
  },
  getPayablesSummary: async () => {
    const response = await api.get("/accountant/payables/summary");
    return response.data;
  },
  getPayablesByDateRange: async (start: string, end: string) => {
    const response = await api.get("/accountant/payables/date-range", { params: { start, end } });
    return response.data;
  },
  payContractor: async (ra_id: string | number, data: { amount: number, mode: string, reference?: string }) => {
    const response = await api.post(`/accountant/payables/${ra_id}/pay`, data);
    return response.data;
  },
  
  // Transactions
  getTransactions: async (params?: any) => {
    const response = await api.get("/accountant/transactions", { params });
    return response.data;
  },

  // Bank Accounts
  getBankAccounts: async (params?: any) => {
    const response = await api.get("/accountant/bank-accounts", { params });
    return response.data;
  },
  createBankAccount: async (data: any) => {
    const response = await api.post("/accountant/bank-accounts", data);
    return response.data;
  },
  getBankAccount: async (id: number | string) => {
    const response = await api.get(`/accountant/bank-accounts/${id}`);
    return response.data;
  },
  updateBankAccount: async (id: number | string, data: any) => {
    const response = await api.patch(`/accountant/bank-accounts/${id}`, data);
    return response.data;
  },
  getBankAccountLedger: async (id: number | string, params?: any) => {
    const response = await api.get(`/accountant/bank-accounts/${id}/ledger`, { params });
    return response.data;
  },
  exportBankAccounts: async () => {
    const response = await api.get("/accountant/bank-accounts/export", { responseType: 'blob' });
    return response.data;
  },
  importBankAccounts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post("/accountant/bank-accounts/import", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Cash Book
  getCashBookLedger: async (params?: any) => {
    const response = await api.get("/accountant/cash-book/ledger", { params });
    return response.data;
  },
  exportCashBook: async () => {
    const response = await api.get("/accountant/cash-book/export", { responseType: 'blob' });
    return response.data;
  },
  importCashBook: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post("/accountant/cash-book/import", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Bank Book
  getBankBookLedger: async (params?: any) => {
    const response = await api.get("/accountant/bank-book/ledger", { params });
    return response.data;
  },
  exportBankBook: async () => {
    const response = await api.get("/accountant/bank-book/export", { responseType: 'blob' });
    return response.data;
  },
  importBankBook: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post("/accountant/bank-book/import", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Petty Cash
  getPettyCashLedger: async (params?: any) => {
    const response = await api.get("/accountant/petty-cash/ledger", { params });
    return response.data;
  },

  // Journal
  getJournal: async (params?: any) => {
    const response = await api.get("/accountant/journal", { params });
    return response.data;
  },
  createJournalEntry: async (data: any) => {
    const response = await api.post("/accountant/journal", data);
    return response.data;
  },
  getJournalDetail: async (id: string | number) => {
    const response = await api.get(`/accountant/journal/${id}`);
    return response.data;
  },

  // Summaries
  getGstSummary: async (params?: any) => {
    const response = await api.get("/accountant/gst/summary", { params });
    return response.data;
  },
  getBankSummary: async (params?: any) => {
    const response = await api.get("/accountant/bank/summary", { params });
    return response.data;
  },

  // Assets
  createAsset: async (data: any) => {
    const response = await api.post("/accountant/assets", data);
    return response.data;
  },
  depreciateAsset: async (id: number | string, data: any) => {
    const response = await api.post(`/accountant/assets/${id}/depreciate`, data);
    return response.data;
  },

  // Reports
  getTrialBalance: async (params?: any) => {
    const response = await api.get("/accountant/reports/trial-balance", { params });
    return response.data;
  },
  getBalanceSheet: async (params?: any) => {
    const response = await api.get("/accountant/reports/balance-sheet", { params });
    return response.data;
  },

  // Bank Reconciliation & Transactions
  createBankTransaction: async (data: any) => {
    const response = await api.post("/accountant/bank/transactions", data);
    return response.data;
  },
  importBankTransactions: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/accountant/bank/reconciliation/import", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  autoRunBankReconciliation: async (bank_account_id: number) => {
    const response = await api.post("/accountant/bank/reconciliation/run", null, { params: { bank_account_id } });
    return response.data;
  },
  getPendingReconciliations: async (params?: any) => {
    const response = await api.get("/accountant/bank/reconciliation/pending", { params });
    return response.data;
  },
  matchBankTransaction: async (transaction_id: string | number, journal_id: string | number) => {
    const response = await api.post(`/accountant/bank/reconciliation/${transaction_id}/match/${journal_id}`);
    return response.data;
  },
  getReconciliationHistory: async (params?: any) => {
    const response = await api.get("/accountant/bank/reconciliation/history", { params });
    return response.data;
  },
  exportReconciliationCsv: async () => {
    const response = await api.get("/accountant/bank/reconciliation/export", { responseType: "blob" });
    return response.data;
  },
  getReconciliationDashboard: async () => {
    const response = await api.get("/accountant/bank/reconciliation/dashboard");
    return response.data;
  },

  // Fund Transfers
  getFundTransfers: async (params?: any) => {
    const response = await api.get("/accountant/transfers", { params });
    return response.data;
  },
  createFundTransfer: async (data: any) => {
    const response = await api.post("/accountant/transfers", data);
    return response.data;
  },

  // GST Returns
  getGstReturns: async (params?: any) => {
    const response = await api.get("/accountant/gst/returns", { params });
    return response.data;
  },
  createGstReturn: async (data: any) => {
    const response = await api.post("/accountant/gst/returns", data);
    return response.data;
  },
  getGstInvoiceRegister: async (params?: any) => {
    const response = await api.get("/accountant/gst/invoice-register", { params });
    return response.data;
  },
  generateGstReturn: async (filing_period: string, return_type: string) => {
    const response = await api.get("/accountant/gst/returns/generate", { params: { filing_period, return_type } });
    return response.data;
  },
  reconcileGst: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/accountant/gst/reconciliation/match", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  exportGst: async () => {
    const response = await api.get("/accountant/gst/export", { responseType: "blob" });
    return response.data;
  },
  importGst: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/accountant/gst/import", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  // TDS
  createTdsDeduction: async (data: any) => {
    const response = await api.post("/accountant/tds/deductions", data);
    return response.data;
  }
};
