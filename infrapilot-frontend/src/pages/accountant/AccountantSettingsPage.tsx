import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const AccountantSettingsPage = () => {
  const [formData, setFormData] = useState({
    financialYear: "2024-2025",
    currency: "INR (₹)",
    taxSettings: "GST Enabled",
    invoiceFormat: "INV-YYYY-####",
    paymentTerms: "Net 30 Days"
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully!");
  };

  return (
    <>
      <Navbar 
        title="Accountant Settings" 
        breadcrumb={["Accountant", "Finance", "Settings"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configuration</h1>
            <p className="text-slate-500 text-sm font-medium">Adjust financial year settings, tax rates, and account defaults.</p>
          </div>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* General Settings Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-800">General Preferences</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Financial Year</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={formData.financialYear}
                            onChange={(e) => setFormData({...formData, financialYear: e.target.value})}
                        >
                            <option value="2023-2024">2023 - 2024</option>
                            <option value="2024-2025">2024 - 2025</option>
                            <option value="2025-2026">2025 - 2026</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Base Currency</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={formData.currency}
                            onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        >
                            <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                            <option value="USD ($)">US Dollar (USD $)</option>
                            <option value="EUR (€)">Euro (EUR €)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Tax Compliance Settings</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={formData.taxSettings}
                            onChange={(e) => setFormData({...formData, taxSettings: e.target.value})}
                        >
                            <option value="GST Enabled">GST Enabled (India)</option>
                            <option value="VAT Enabled">VAT Enabled</option>
                            <option value="No Tax">No Default Tax</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Document Settings Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Document Defaults</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Default Invoice Format</label>
                        <input 
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={formData.invoiceFormat}
                            onChange={(e) => setFormData({...formData, invoiceFormat: e.target.value})}
                            placeholder="e.g. INV-YYYY-####"
                        />
                        <p className="text-[10px] text-slate-400 font-medium ml-1 mt-1.5">Use YYYY for year and # for auto-incrementing numbers.</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Standard Payment Terms</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={formData.paymentTerms}
                            onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                        >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15 Days">Net 15 Days</option>
                            <option value="Net 30 Days">Net 30 Days</option>
                            <option value="Net 45 Days">Net 45 Days</option>
                            <option value="Net 60 Days">Net 60 Days</option>
                        </select>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl mt-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                Changes made here will apply to all newly generated invoices and reports. Existing documents will retain their original formatting and terms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </PageTransition>
    </>
  );
};

export default AccountantSettingsPage;
