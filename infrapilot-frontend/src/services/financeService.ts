import api from "./api";
import type { Invoice, InvoiceCreateData } from "../types/invoice";

// Helper to detect mock/dev user
const isMockUser = () => {
  try {
    const stored = localStorage.getItem("infrapilot_user");
    if (!stored) return false;
    const user = JSON.parse(stored);
    const token = user.token?.access_token || user.token;
    return token === 'mock_test_token_client_transparency';
  } catch {
    return false;
  }
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    project_id: 1,
    owner_id: 1,
    reference_id: 101,
    invoice_number: "INV-2026-001",
    type: "material",
    description: "Structural Phase II — Concrete & Formwork",
    invoice_date: "2026-03-15",
    due_date: "2026-04-15",
    amount: 1200000,
    gst_percent: 18,
    gst_amount: 216000,
    tax_percent: 0,
    tax_amount: 0,
    total_amount: 1416000,
    status: "paid",
    created_at: "2026-03-15T10:00:00",
  },
  {
    id: 2,
    project_id: 1,
    owner_id: 1,
    reference_id: 102,
    invoice_number: "INV-2026-002",
    type: "labour",
    description: "MEP Roughing-In — Electrical & Plumbing Phase III",
    invoice_date: "2026-04-01",
    due_date: "2026-05-01",
    amount: 850000,
    gst_percent: 18,
    gst_amount: 153000,
    tax_percent: 0,
    tax_amount: 0,
    total_amount: 1003000,
    status: "pending",
    created_at: "2026-04-01T09:30:00",
  },
  {
    id: 3,
    project_id: 1,
    owner_id: 1,
    reference_id: 103,
    invoice_number: "INV-2026-003",
    type: "material",
    description: "Roof Slab Rebar & Casting — North Wing",
    invoice_date: "2026-04-16",
    due_date: "2026-05-16",
    amount: 2200000,
    gst_percent: 18,
    gst_amount: 396000,
    tax_percent: 0,
    tax_amount: 0,
    total_amount: 2596000,
    status: "pending",
    created_at: "2026-04-16T11:00:00",
  },
];

export const financeService = {
  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
  async getInvoices(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Invoice[]> {
    // Return mock data for mock/dev user to avoid 401
    if (isMockUser()) {
      console.log('Finance: Returning mock invoice data for dev user.');
      return MOCK_INVOICES;
    }

    try {
      console.log(`🌐 Fetching Invoices... URL: ${api.defaults.baseURL}/invoices`);
      const response = await api.get("/invoices", {
        params: { limit, offset },
      });
      
      console.log(`✅ Invoices Response received. Type: ${typeof response.data}, Content-Type: ${response.headers['content-type']}`);
      
      if (!response.data) return [];
      const data = response.data;
      return Array.isArray(data)
        ? data
        : data.items || data.data || [];
    } catch (error: any) {
      console.error(
        "Get Invoices API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch invoices by type
   * GET /api/v1/invoices/type/{type}
   */
  async getInvoicesByType(type: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/type/${type}`);
      return response.data || [];
    } catch (error: any) {
      console.error(
        `Fetch Invoices By Type (${type}) Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch invoices within a date range
   * GET /api/v1/invoices/date-range?start=...&end=...
   */
  async getInvoicesByDateRange(start: string, end: string): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices/date-range", {
        params: { start, end },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      console.error(`Get Invoices By Date Range (${start} → ${end}) Error:`);
      if (Array.isArray(detail)) {
        detail.forEach((d: any) =>
          console.error(`  [${d.loc?.join(" → ")}] ${d.msg} (type: ${d.type})`)
        );
      } else {
        console.error(error.response?.data || error.message);
      }
      throw error;
    }
  },

  /**
   * Get a single invoice by ID
   * GET /api/v1/invoices/{id}
   */
  async getInvoiceById(id: number): Promise<Invoice> {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Create a new invoice
   * POST /api/v1/invoices/{type}
   */
  async createInvoice(data: InvoiceCreateData): Promise<Invoice> {
    try {
      // The API endpoint expects the type in the URL: /api/v1/invoices/{type}
      const response = await api.post(`/invoices/${data.type}`, data);
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 
                      (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 
                      (error.response?.data?.message || error.message));
      
      console.error(
        `Create Invoice (${data.type}) Error:`,
        error.response?.data || error.message,
      );
      
      // Throw a new error with the extracted detail message
      const enhancedError = new Error(message);
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  },

  /**
   * Update an invoice
   * PUT /api/v1/invoices/{id}
   */
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Mark an invoice as paid
   * POST /api/v1/invoices/{id}/mark-paid
   */
  async markInvoicePaid(id: number): Promise<Invoice> {
    try {
      const response = await api.post(`/invoices/${id}/mark-paid`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Mark Invoice ${id} As Paid Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get pending invoices
   * GET /api/v1/invoices/pending
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    try {
      // Use query parameter to avoid route collision with /invoices/{id}
      const response = await api.get("/invoices", {
        params: { status: "pending" }
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      console.error("Get Pending Invoices API Error:");
      if (Array.isArray(detail)) {
        detail.forEach((d: any) =>
          console.error(`  [${d.loc?.join(" → ")}] ${d.msg} (type: ${d.type})`)
        );
      } else {
        console.error(error.response?.data || error.message);
      }
      throw error;
    }
  },

  /**
   * Generate Invoice PDF
   * GET /api/v1/invoices/{id}/pdf
   */
  async getInvoicePdf(id: number): Promise<void> {
    // Generate PDF locally for mock/dev user
    if (isMockUser()) {
      const invoices = await this.getInvoices();
      const inv = invoices.find(i => i.id === id);
      if (!inv) throw new Error("Invoice not found");

      const fmt = (amount: any) => {
        const val = Number(amount);
        if (isNaN(val)) return '₹0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
      };
      const fmtDate = (d?: string) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return d; }
      };

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 24px; font-weight: 800; color: #1e293b; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; font-weight: 800; margin: 0; color: #2563eb; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.05em; }
    .details p { margin: 2px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .num { text-align: right; }
    .totals { margin-left: auto; width: 250px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
    .total-row.grand { border-top: 2px solid #2563eb; margin-top: 8px; padding-top: 12px; font-weight: 800; font-size: 16px; color: #2563eb; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">InfraPilot</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p style="font-size: 12px; font-weight: 600; color: #64748b;"># ${inv.invoice_number || `INV-${inv.id}`}</p>
    </div>
  </div>

  <div class="grid">
    <div class="details">
      <div class="section-title">Billed To</div>
      <p><strong>Project Owner / Client</strong></p>
      <p>Project ID: ${inv.project_id}</p>
    </div>
    <div class="details" style="text-align: right;">
      <div class="section-title">Invoice Details</div>
      <p>Date: ${fmtDate(inv.invoice_date || inv.created_at)}</p>
      <p>Due Date: ${fmtDate(inv.due_date)}</p>
      <p>Status: <span style="text-transform: uppercase; font-weight: 700;">${inv.status}</span></p>
    </div>
  </div>

  <div class="section-title">Description of Works</div>
  <table>
    <thead>
      <tr>
        <th>Work / Item Description</th>
        <th>Type</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${inv.description || "Project Service Delivery"}</td>
        <td style="text-transform: uppercase;">${inv.type}</td>
        <td class="num">${fmt(inv.amount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${fmt(inv.amount)}</span>
    </div>
    <div class="total-row">
      <span>GST (${inv.gst_percent || 0}%)</span>
      <span>${fmt(inv.gst_amount || 0)}</span>
    </div>
    <div class="total-row grand">
      <span>Total</span>
      <span>${fmt(inv.total_amount)}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is a system-generated document for InfraPilot Project Management.</p>
    <p>© ${new Date().getFullYear()} InfraPilot. All rights reserved.</p>
  </div>
</body>
</html>`;

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) { iframe.remove(); return; }
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 2000);
      }, 600);
      return;
    }

    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(`Get Invoice PDF ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Export all invoices as a styled PDF (client-side, no extra deps)
   * Uses a hidden iframe + window.print() approach.
   */
  async exportInvoicesPdf(invoices: Invoice[]): Promise<void> {
    const fmt = (amount: any) => {
      const val = Number(amount);
      if (isNaN(val)) return '₹0';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };
    const fmtDate = (d?: string) => {
      if (!d) return 'N/A';
      try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch { return d; }
    };
    const statusColor = (s: string) => {
      if (s === 'paid') return '#059669';
      if (s === 'pending') return '#d97706';
      if (s === 'overdue') return '#dc2626';
      return '#64748b';
    };
    const statusBg = (s: string) => {
      if (s === 'paid') return '#d1fae5';
      if (s === 'pending') return '#fef3c7';
      if (s === 'overdue') return '#fee2e2';
      return '#f1f5f9';
    };

    const rows = invoices.map(inv => `
      <tr>
        <td>
          <strong>${inv.invoice_number || `INV-${inv.id}`}</strong><br/>
          <span class="sub">${(inv.type || '').toUpperCase()}</span>
        </td>
        <td>
          ${fmtDate(inv.invoice_date || inv.created_at)}<br/>
          <span class="due">Due: ${fmtDate(inv.due_date)}</span>
        </td>
        <td>${inv.description || 'N/A'}</td>
        <td class="num">${fmt(inv.amount)}</td>
        <td class="num">${fmt(inv.gst_amount)}</td>
        <td class="num bold">${fmt(inv.total_amount)}</td>
        <td class="center">
          <span class="badge" style="color:${statusColor(inv.status)};background:${statusBg(inv.status)}">
            ${(inv.status || '').toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalInvoiced = invoices.reduce((a, i) => a + Number(i.total_amount || 0), 0);
    const totalPaid    = invoices.reduce((a, i) => a + (i.status === 'paid' ? Number(i.total_amount || 0) : 0), 0);
    const totalPending = invoices.reduce((a, i) => a + (i.status !== 'paid' ? Number(i.total_amount || 0) : 0), 0);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>InfraPilot — Invoice Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 36px; height: 36px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 800; }
    .brand-name { font-size: 18px; font-weight: 800; color: #1e293b; }
    .brand-sub  { font-size: 9px; color: #64748b; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; }
    .meta { text-align: right; }
    .meta p { font-size: 9px; color: #64748b; line-height: 1.6; }
    .meta .date { font-size: 11px; font-weight: 700; color: #1e293b; }
    h1 { font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
    .subtitle { font-size: 9px; color: #94a3b8; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 20px; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; }
    .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
    .summary-card.blue { background: #eff6ff; border-color: #bfdbfe; }
    .summary-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .summary-card.amber { background: #fffbeb; border-color: #fde68a; }
    .summary-card label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
    .summary-card .val { font-size: 15px; font-weight: 800; margin-top: 4px; color: #1e293b; }
    .summary-card.green .val { color: #059669; }
    .summary-card.amber .val { color: #d97706; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1e293b; }
    thead th { padding: 8px 10px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; }
    thead th.num, thead th.center { text-align: right; }
    thead th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    td { padding: 8px 10px; vertical-align: top; line-height: 1.5; }
    td strong { font-size: 11px; font-weight: 700; }
    .sub { font-size: 8px; color: #94a3b8; font-weight: 600; letter-spacing: .06em; }
    .due { font-size: 8px; color: #ef4444; font-weight: 700; }
    td.num { text-align: right; }
    td.bold { font-weight: 700; }
    td.center { text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 7px; font-weight: 800; letter-spacing: .08em; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 8px; color: #94a3b8; }
    @media print {
      body { padding: 20px; }
      @page { margin: 10mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">
        <div class="brand-icon">I</div>
        <div>
          <div class="brand-name">InfraPilot</div>
          <div class="brand-sub">Project Transparency Portal</div>
        </div>
      </div>
    </div>
    <div class="meta">
      <p class="date">${today}</p>
      <p>Invoice Summary Report</p>
      <p>Generated automatically · Confidential</p>
    </div>
  </div>

  <h1>Project Invoices</h1>
  <p class="subtitle">All invoices — detailed breakdown</p>

  <div class="summary">
    <div class="summary-card blue">
      <label>Total Invoiced</label>
      <div class="val">${fmt(totalInvoiced)}</div>
    </div>
    <div class="summary-card green">
      <label>Total Paid</label>
      <div class="val">${fmt(totalPaid)}</div>
    </div>
    <div class="summary-card amber">
      <label>Pending / Overdue</label>
      <div class="val">${fmt(totalPending)}</div>
    </div>
    <div class="summary-card">
      <label>Invoice Count</label>
      <div class="val">${invoices.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Inv. No / Type</th>
        <th>Date / Due</th>
        <th>Description</th>
        <th class="num">Base Amount</th>
        <th class="num">GST</th>
        <th class="num">Total</th>
        <th class="center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <p>InfraPilot · Project Transparency Portal</p>
    <p>This is a system-generated report. © ${new Date().getFullYear()} InfraPilot.</p>
  </div>
</body>
</html>`;

    // Write into a hidden iframe and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); return; }
    doc.open();
    doc.write(html);
    doc.close();
    // Wait for fonts/images
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 600);
  },

  /**
   * Export all payments as a styled PDF report
   */
  async exportPaymentsPdf(payments: any[]): Promise<void> {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalPaid = payments.reduce((acc, p) => {
      const val = Number(p.amount.replace(/[^0-9.-]+/g, ""));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const fmt = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const rows = payments.map(pay => `
      <tr>
        <td><strong>${pay.id}</strong></td>
        <td>${pay.invoice}</td>
        <td class="num bold" style="color: #059669;">${pay.amount}</td>
        <td>${pay.date}</td>
        <td><span class="sub">${pay.method.toUpperCase()}</span></td>
        <td class="center">
          <span class="badge" style="color:#059669;background:#d1fae5">
            ${pay.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>InfraPilot — Payment Receipts</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 800; }
    .brand-name { font-size: 18px; font-weight: 800; color: #1e293b; }
    .brand-sub  { font-size: 9px; color: #64748b; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; }
    .meta { text-align: right; }
    .meta p { font-size: 9px; color: #64748b; line-height: 1.6; }
    .meta .date { font-size: 11px; font-weight: 700; color: #1e293b; }
    h1 { font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
    .subtitle { font-size: 9px; color: #94a3b8; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 20px; }
    .summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; display: inline-block; min-width: 200px; }
    .summary-card label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #047857; }
    .summary-card .val { font-size: 18px; font-weight: 800; margin-top: 4px; color: #065f46; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1e293b; }
    thead th { padding: 8px 10px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; }
    thead th.num, thead th.center { text-align: right; }
    thead th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    td { padding: 8px 10px; vertical-align: middle; line-height: 1.5; }
    td strong { font-size: 10px; font-weight: 700; color: #1e293b; }
    .sub { font-size: 8px; color: #94a3b8; font-weight: 600; letter-spacing: .06em; }
    td.num { text-align: right; }
    td.bold { font-weight: 700; }
    td.center { text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 7px; font-weight: 800; letter-spacing: .08em; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 8px; color: #94a3b8; }
    @media print {
      body { padding: 20px; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">
        <div class="brand-icon">I</div>
        <div>
          <div class="brand-name">InfraPilot</div>
          <div class="brand-sub">Project Transparency Portal</div>
        </div>
      </div>
    </div>
    <div class="meta">
      <p class="date">${today}</p>
      <p>Official Payment Receipts</p>
      <p>Generated automatically · Verified</p>
    </div>
  </div>

  <h1>Payment History</h1>
  <p class="subtitle">Log of all successful transactions</p>

  <div class="summary-card">
    <label>Total Amount Paid</label>
    <div class="val">${fmt(totalPaid)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Payment ID</th>
        <th>Linked Invoice</th>
        <th class="num">Amount Paid</th>
        <th>Payment Date</th>
        <th>Method</th>
        <th class="center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <p>InfraPilot · Project Transparency Portal</p>
    <p>This document serves as a valid electronic acknowledgment of payment. © ${new Date().getFullYear()} InfraPilot.</p>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); return; }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 600);
  },

  /**
   * Create Labour Invoice
   * POST /api/v1/invoices/labour
   */
  async createLabourInvoice(data: {
    project_id: number;
    start_date: string;
    end_date: string;
  }): Promise<Invoice> {
    try {
      const response = await api.post("/invoices/labour", data);
      return response.data;
    } catch (error: any) {
      console.error("Create Labour Invoice Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Material Invoice
   * POST /api/v1/invoices/material
   */
  async createMaterialInvoice(data: InvoiceCreateData): Promise<Invoice> {
    try {
      const response = await api.post("/invoices/material", data);
      return response.data;
    } catch (error: any) {
      console.error("Create Material Invoice Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Invoice From Measurement
   * POST /api/v1/invoices/from-measurement/{measurement_id}
   */
  async createInvoiceFromMeasurement(measurementId: number): Promise<Invoice> {
    try {
      const response = await api.post(`/invoices/from-measurement/${measurementId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Create Invoice from Measurement ${measurementId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete an invoice
   * DELETE /api/v1/invoices/{id}
   */
  async deleteInvoice(id: number): Promise<void> {
    try {
      await api.delete(`/invoices/${id}`);
    } catch (error: any) {
      console.error(
        `Delete Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};
