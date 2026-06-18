import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

// Generic Wrapper Generator for Settings
const createWrapper = (categoryTabs: {key: string, label: string}[], formsGenerators: Record<string, () => React.ReactNode>) => {
  return ({ initialSubTab }: { initialSubTab?: string }) => {
    const navigate = useNavigate();
    const sub = initialSubTab || categoryTabs[0].key;
    
    return (
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto w-full md:w-auto">
            {categoryTabs.map(t => (
              <button key={t.key} onClick={() => navigate(`?sub=${t.key}`, { replace: true })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  sub === t.key ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search settings..." className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-white" />
          </div>
        </div>
        
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 max-w-4xl">
          {formsGenerators[sub] ? formsGenerators[sub]() : (
            <div className="p-12 text-center">
              <p className="text-slate-500">Settings configuration for {categoryTabs.find(t=>t.key===sub)?.label} is configured here.</p>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
             <button onClick={() => toast.success("Settings saved successfully!")} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Save Configuration</button>
          </div>
        </div>
      </div>
    );
  };
};

const CompanySettingsWrapper = createWrapper([
  { key: "profile", label: "Company Profile" }, { key: "branches", label: "Branches" }, 
  { key: "departments", label: "Departments" }, { key: "documents", label: "Company Documents" }
], {
  "profile": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Company Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name *</label><input type="text" defaultValue="InfraPilot Construction Ltd" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Logo</label><input type="file" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN *</label><input type="text" defaultValue="27AADCB2230M1Z2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Number *</label><input type="text" defaultValue="AADCB2230M" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CIN Number</label><input type="text" defaultValue="L45200MH1999PLC012345" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</label><input type="text" defaultValue="+91 98765 43210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Address</label><textarea rows={3} defaultValue="123, Infra Tower, Business Park, Mumbai, Maharashtra 400001" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"></textarea></div>
        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label><input type="email" defaultValue="accounts@infrapilot.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
      </div>
    </div>
  )
});

const FinancialSettingsWrapper = createWrapper([
  { key: "year", label: "Financial Year" }, { key: "currency", label: "Currency" }, 
  { key: "periods", label: "Fiscal Periods" }, { key: "numbering", label: "Account Numbering" }, { key: "balances", label: "Opening Balances" }
], {
  "year": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Financial Year Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Financial Year</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option>2026-2027</option></select></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option>INR (₹)</option></select></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year Start Date</label><input type="date" defaultValue="2026-04-01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year End Date</label><input type="date" defaultValue="2027-03-31" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decimal Precision</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option>2 Decimal Places</option></select></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Ledger Accounts</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option>Standard Construction Chart of Accounts</option></select></div>
      </div>
    </div>
  )
});

const TaxSettingsWrapper = createWrapper([
  { key: "gst", label: "GST Configuration" }, { key: "tds", label: "TDS Configuration" }, 
  { key: "rates", label: "Tax Rates" }, { key: "rules", label: "Tax Rules" }
], {
  "gst": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">GST Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN</label><input type="text" defaultValue="27AADCB2230M1Z2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default CGST Rate (%)</label><input type="number" defaultValue="9" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default SGST Rate (%)</label><input type="number" defaultValue="9" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default IGST Rate (%)</label><input type="number" defaultValue="18" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
      </div>
    </div>
  ),
  "tds": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">TDS Configuration</h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Section</label><input type="text" defaultValue="194C (Contractors)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Percentage</label><input type="text" defaultValue="1% (Individual) / 2% (Company)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicable On</label><input type="text" defaultValue="Contractor Bills" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Section</label><input type="text" defaultValue="194J (Professionals)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Percentage</label><input type="text" defaultValue="10%" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicable On</label><input type="text" defaultValue="Consultancy Fees" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        </div>
      </div>
    </div>
  )
});

const InvoiceSettingsWrapper = createWrapper([
  { key: "format", label: "Invoice Format" }, { key: "series", label: "Invoice Number Series" }, 
  { key: "rabill", label: "RA Bill Format" }, { key: "credit", label: "Credit Note Format" }, { key: "templates", label: "PDF Templates" }
], {
  "series": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Numbering Series</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Prefix</label><input type="text" defaultValue="INV" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Starting Number</label><input type="text" defaultValue="INV-2026-0001" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RA Bill Prefix</label><input type="text" defaultValue="RA" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RA Bill Starting Number</label><input type="text" defaultValue="RA-2026-0001" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Note Prefix</label><input type="text" defaultValue="CN" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
      </div>
    </div>
  ),
  "format": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Invoice Print Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Logo for Invoice</label><input type="file" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Footer Notes (T&C)</label><textarea rows={4} defaultValue="1. Payment due within 30 days.\n2. Interest @ 18% p.a. applies for delayed payment.\n3. Subject to Mumbai Jurisdiction." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"></textarea></div>
      </div>
    </div>
  )
});

const PaymentSettingsWrapper = createWrapper([
  { key: "terms", label: "Payment Terms" }, { key: "banks", label: "Bank Accounts" }, 
  { key: "modes", label: "Payment Modes" }, { key: "auto", label: "Auto Payment Rules" }
], {
  "terms": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Payment Terms</h3>
      <div className="space-y-4">
        {[
          { name: "Immediate", days: "0 Days", desc: "Payment due upon receipt" },
          { name: "Net 15", days: "15 Days", desc: "Payment due within 15 days" },
          { name: "Net 30", days: "30 Days", desc: "Payment due within 30 days" },
          { name: "Net 45", days: "45 Days", desc: "Payment due within 45 days" },
          { name: "Net 60", days: "60 Days", desc: "Payment due within 60 days" }
        ].map(term => (
          <div key={term.name} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2 md:items-center">
            <div className="font-bold text-sm text-slate-800">{term.name}</div>
            <div className="text-sm font-semibold text-slate-600">{term.days}</div>
            <div className="text-xs text-slate-500">{term.desc}</div>
          </div>
        ))}
        <button onClick={() => toast.success("Custom term added!")} className="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">+ Add Custom Term</button>
      </div>
    </div>
  ),
  "modes": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Payment Modes</h3>
      <div className="flex flex-wrap gap-3">
        {["Cash", "Bank Transfer", "UPI", "Cheque", "RTGS", "NEFT"].map(m => (
          <div key={m} className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700">{m}</div>
        ))}
      </div>
    </div>
  )
});

const ApprovalWorkflowWrapper = createWrapper([
  { key: "expense", label: "Expense Approval" }, { key: "purchase", label: "Purchase Approval" }, 
  { key: "payroll", label: "Payroll Approval" }, { key: "payment", label: "Payment Approval" }, { key: "journal", label: "Journal Approval" }
], {
  "expense": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Expense Approval Workflow</h3>
      <div className="flex flex-col items-center">
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Employee</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-slate-400">↓</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Manager</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-slate-400">↓</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Accountant</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-emerald-500 font-black">↓</div>
        <div className="w-64 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-center font-black text-sm mt-2">Approved</div>
      </div>
    </div>
  ),
  "payment": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Vendor Payment Approval Workflow</h3>
      <div className="flex flex-col items-center">
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Accountant</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-slate-400">↓</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Finance Manager</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-slate-400">↓</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-sm">Director</div>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-xs text-indigo-500 font-black">↓</div>
        <div className="w-64 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl p-4 text-center font-black text-sm mt-2">Payment Release</div>
      </div>
    </div>
  )
});

const UsersRolesWrapper = createWrapper([
  { key: "roles", label: "Role Management" }, { key: "permissions", label: "User Permissions" }, 
  { key: "access", label: "Access Control" }, { key: "audit", label: "Audit Logs" }
], {
  "roles": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">System Roles</h3>
      <div className="flex flex-wrap gap-3">
        {["Admin", "Accountant", "Finance Manager", "Project Manager", "Purchase Manager", "HR", "Director", "Auditor"].map(r => (
          <div key={r} className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700">{r}</div>
        ))}
      </div>
    </div>
  ),
  "permissions": () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Permissions Matrix (Accountant)</h3>
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[600px] text-left border border-slate-200 rounded-xl overflow-hidden table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Module</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">View</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Create</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Edit</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Delete</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Approve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {[
              { m: "Journal Entries", v: true, c: true, e: true, d: false, a: false },
              { m: "Payables", v: true, c: true, e: true, d: false, a: false },
              { m: "Receivables", v: true, c: true, e: true, d: false, a: false },
              { m: "Payroll", v: true, c: true, e: true, d: false, a: false },
              { m: "Bank Reconciliations", v: true, c: true, e: true, d: false, a: false },
              { m: "Financial Reports", v: true, c: false, e: false, d: false, a: false },
            ].map(row => (
              <tr key={row.m}>
                <td className="px-4 py-3 font-bold text-slate-700">{row.m}</td>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={row.v} readOnly className="rounded text-indigo-600" /></td>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={row.c} readOnly className="rounded text-indigo-600" /></td>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={row.e} readOnly className="rounded text-indigo-600" /></td>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={row.d} readOnly className="rounded text-indigo-600" /></td>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={row.a} readOnly className="rounded text-indigo-600" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
});

const NotificationSettingsWrapper = createWrapper([
  { key: "email", label: "Email Notifications" }, { key: "sms", label: "SMS Notifications" }, 
  { key: "alerts", label: "Due Date Alerts" }, { key: "approvals", label: "Approval Alerts" }
], {});

const DocumentSettingsWrapper = createWrapper([
  { key: "rules", label: "Attachment Rules" }, { key: "size", label: "File Size Limits" }, { key: "categories", label: "Document Categories" }
], {});

const SystemSettingsWrapper = createWrapper([
  { key: "backup", label: "Backup Settings" }, { key: "import", label: "Data Import" }, 
  { key: "export", label: "Data Export" }, { key: "preferences", label: "System Preferences" }
], {});


// --- MAIN PAGE ---
type TabKey = "company" | "financial" | "tax" | "invoice" | "payment" | "approval" | "users" | "notifications" | "documents" | "system";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "company",       label: "Company",       icon: "🏢" },
  { key: "financial",     label: "Financial",     icon: "💵" },
  { key: "tax",           label: "Tax",           icon: "⚖️" },
  { key: "invoice",       label: "Invoice",       icon: "📄" },
  { key: "payment",       label: "Payment",       icon: "💳" },
  { key: "approval",      label: "Approval Workflow", icon: "✅" },
  { key: "users",         label: "User & Roles",  icon: "👥" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
  { key: "documents",     label: "Documents",     icon: "📁" },
  { key: "system",        label: "System",        icon: "⚙️" },
];

const AccountantSettingsPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "company": "company",
      "financial": "financial",
      "tax": "tax",
      "invoice": "invoice",
      "payment": "payment",
      "approval": "approval",
      "users": "users",
      "notifications": "notifications",
      "documents": "documents",
      "system": "system",
    };
    return map[currentSub || ""] || "company";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/settings/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Settings & Configuration" breadcrumb={["Accountant", "Settings"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Configuration</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage financial rules, tax settings, numbering formats, and company preferences.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "company"       && <CompanySettingsWrapper initialSubTab={subTab} key={subTab || "profile"} />}
        {activeTab === "financial"     && <FinancialSettingsWrapper initialSubTab={subTab} key={subTab || "year"} />}
        {activeTab === "tax"           && <TaxSettingsWrapper initialSubTab={subTab} key={subTab || "gst"} />}
        {activeTab === "invoice"       && <InvoiceSettingsWrapper initialSubTab={subTab} key={subTab || "format"} />}
        {activeTab === "payment"       && <PaymentSettingsWrapper initialSubTab={subTab} key={subTab || "terms"} />}
        {activeTab === "approval"      && <ApprovalWorkflowWrapper initialSubTab={subTab} key={subTab || "expense"} />}
        {activeTab === "users"         && <UsersRolesWrapper initialSubTab={subTab} key={subTab || "roles"} />}
        {activeTab === "notifications" && <NotificationSettingsWrapper initialSubTab={subTab} key={subTab || "email"} />}
        {activeTab === "documents"     && <DocumentSettingsWrapper initialSubTab={subTab} key={subTab || "rules"} />}
        {activeTab === "system"        && <SystemSettingsWrapper initialSubTab={subTab} key={subTab || "backup"} />}
      </PageTransition>
    </>
  );
};

export default AccountantSettingsPage;
