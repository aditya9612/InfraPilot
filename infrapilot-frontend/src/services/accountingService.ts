import api from "./api";
import type { ChartAccount } from "../types/accounting";

export const accountingService = {
  /**
   * Fetch hierarchical Chart of Accounts
   * GET /api/v1/accounting/coa
   */
  async getCOA(): Promise<ChartAccount[]> {
    try {
      const response = await api.get("/accounting/coa");
      return response.data;
    } catch (error: any) {
      console.error("Fetch COA Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new GL Account
   * POST /api/v1/accounting/coa
   */
  async createAccount(accountData: Partial<ChartAccount>): Promise<ChartAccount> {
    try {
      const response = await api.post("/accounting/coa", accountData);
      return response.data;
    } catch (error: any) {
      console.error("Create Account Error:", error.response?.data || error.message);
      throw error;
    }
  }
};
