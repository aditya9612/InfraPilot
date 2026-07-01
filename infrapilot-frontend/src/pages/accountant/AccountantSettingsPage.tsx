import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

// Generic Wrapper Generator for Settings
const createWrapper = (categoryTabs: {key: string, label: string, icon?: string}[], formsGenerators: Record<string, () => React.ReactNode>) => {
  return ({ initialSubTab }: { initialSubTab?: string }) => {
    const navigate = useNavigate();
    const sub = initialSubTab || categoryTabs[0].key;
    
    return (
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto w-full md:w-auto">
            {categoryTabs.map(t => (
              <button key={t.key} onClick={() => navigate(`?sub=${t.key}`, { replace: true })}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  sub === t.key ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                {t.icon && <span>{t.icon}</span>}
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
  { key: "profile", label: "Company Profile", icon: "🏢" }, { key: "branches", label: "Branches", icon: "📍" }, 
  { key: "departments", label: "Departments", icon: "👥" }, { key: "documents", label: "Company Documents", icon: "📁" }
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
  { key: "year", label: "Financial Year", icon: "📅" }, { key: "currency", label: "Currency", icon: "💱" }, 
  { key: "periods", label: "Fiscal Periods", icon: "⏱️" }, { key: "numbering", label: "Account Numbering", icon: "🔢" }, { key: "balances", label: "Opening Balances", icon: "⚖️" }
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
  { key: "gst", label: "GST Configuration", icon: "🏛️" }, { key: "tds", label: "TDS Configuration", icon: "✂️" }, 
  { key: "rates", label: "Tax Rates", icon: "📊" }, { key: "rules", label: "Tax Rules", icon: "📜" }
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
  { key: "format", label: "Invoice Format", icon: "📄" }, { key: "series", label: "Invoice Number Series", icon: "🔢" }, 
  { key: "rabill", label: "RA Bill Format", icon: "🏗️" }, { key: "credit", label: "Credit Note Format", icon: "💳" }, { key: "templates", label: "PDF Templates", icon: "🖨️" }
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

const ApprovalWorkflowWrapper = createWrapper([
  { key: "expense", label: "Expense Approval", icon: "📉" }, { key: "purchase", label: "Purchase Approval", icon: "🛍️" }, 
  { key: "payroll", label: "Payroll Approval", icon: "👥" }, { key: "payment", label: "Payment Approval", icon: "💸" }, { key: "journal", label: "Journal Approval", icon: "📓" }
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
  { key: "roles", label: "Role Management", icon: "🎭" }, { key: "permissions", label: "User Permissions", icon: "🔐" }, 
  { key: "access", label: "Access Control", icon: "🚧" }, { key: "audit", label: "Audit Logs", icon: "📋" }
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

// --- MAIN PAGE ---
type TabKey = "company" | "financial" | "tax" | "invoice" | "users" | "approvals";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "company",   label: "Company",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
  { key: "financial", label: "Finance",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { key: "tax",       label: "Tax",       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  { key: "invoice",   label: "Invoice",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
  { key: "users",     label: "Users",     icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
  { key: "approvals", label: "Approvals", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
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
      "users": "users",
      "approvals": "approvals",
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage financial rules, tax settings, numbering formats, and company preferences.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">💾</span> Save Changes
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
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
        {activeTab === "users"         && <UsersRolesWrapper initialSubTab={subTab} key={subTab || "roles"} />}
        {activeTab === "approvals"     && <ApprovalWorkflowWrapper initialSubTab={subTab} key={subTab || "expense"} />}
      </PageTransition>
    </>
  );
};

export default AccountantSettingsPage;
