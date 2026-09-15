import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { 
  User, Bell, Ruler, Folder, Building, DollarSign, Receipt, BookOpen, Search 
} from "lucide-react";

type TabKey = "profile" | "notifications" | "units" | "default_project" | "general" | "financial" | "billing" | "ledger";

const SIDEBAR_NAV = [
  {
    group: "My Settings",
    items: [
      { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
      { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
      { key: "units", label: "Units", icon: <Ruler className="w-4 h-4" /> },
      { key: "default_project", label: "Default Project", icon: <Folder className="w-4 h-4" /> },
    ]
  },
  {
    group: "Company Settings",
    items: [
      { key: "general", label: "General", icon: <Building className="w-4 h-4" /> },
      { key: "financial", label: "Financial", icon: <DollarSign className="w-4 h-4" /> },
      { key: "billing", label: "Billing", icon: <Receipt className="w-4 h-4" /> },
      { key: "ledger", label: "Ledger", icon: <BookOpen className="w-4 h-4" /> },
    ]
  }
];

// --- Form Components ---

const ProfileForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const res = await api.post("/settings/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onChange({ ...data, profile_image: res.data?.url || "" });
      toast.success("Profile image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Profile Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Full Name <span className="text-rose-500">*</span></label><input type="text" value={data.full_name || ""} onChange={(e) => onChange({...data, full_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Email <span className="text-rose-500">*</span></label><input type="email" value={data.email || ""} onChange={(e) => onChange({...data, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Mobile Number</label><input type="text" value={data.mobile_number || data.phone_number || ""} onChange={(e) => onChange({...data, mobile_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Role</label><input type="text" value={data.role || "Accountant"} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" /></div>
        
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">PAN Number</label><input type="text" value={data.pan_number || ""} onChange={(e) => onChange({...data, pan_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Aadhaar Number</label><input type="text" value={data.aadhaar_number || ""} onChange={(e) => onChange({...data, aadhaar_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Profile Image</label>
          <div className="flex gap-2 items-center">
            <input type="file" onChange={handleImageUpload} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            {uploadingImage && <div className="px-4 py-2 text-sm text-slate-500 flex items-center">Uploading...</div>}
            {data.profile_image && <img src={data.profile_image} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black text-slate-800 mb-6">Notification Preferences</h3>
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
          <p className="text-xs text-slate-500 mt-1">Receive daily summaries and alerts via email.</p>
        </div>
        <input type="checkbox" checked={data.email_notifications ?? true} onChange={(e) => onChange({...data, email_notifications: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <h4 className="text-sm font-bold text-slate-800">In-App Notifications</h4>
          <p className="text-xs text-slate-500 mt-1">Show push notifications within the application.</p>
        </div>
        <input type="checkbox" checked={data.in_app_notifications ?? true} onChange={(e) => onChange({...data, in_app_notifications: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Approval Alerts</h4>
          <p className="text-xs text-slate-500 mt-1">Get notified immediately when an item requires your approval.</p>
        </div>
        <input type="checkbox" checked={data.approval_alerts ?? true} onChange={(e) => onChange({...data, approval_alerts: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
      </div>
    </div>
  </div>
);

const UnitsForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black text-slate-800 mb-6">Unit Preferences</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Primary Currency</label>
        <select value={data.primary_currency || "INR"} onChange={(e) => onChange({...data, primary_currency: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Date Format</label>
        <select value={data.date_format || "DD/MM/YYYY"} onChange={(e) => onChange({...data, date_format: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Number System</label>
        <select value={data.number_system || "Indian"} onChange={(e) => onChange({...data, number_system: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <option value="Indian">Indian (Lakhs, Crores)</option>
          <option value="International">International (Millions, Billions)</option>
        </select>
      </div>
    </div>
  </div>
);

const DefaultProjectForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectService.getProjects(100, 0);
        setProjects(Array.isArray(res) ? res : (res as any).items || []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">Default Project Settings</h3>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Default Project Workspace</label>
        <select value={data.default_project || ""} onChange={(e) => onChange({...data, default_project: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <option value="">-- Select Default Project --</option>
          {projects.map((p) => (
            <option key={p.id || p.project_id} value={String(p.id || p.project_id)}>
              {p.project_name || p.name || p.title || `Project ${p.id || p.project_id}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-2">This project will be pre-selected in forms and dashboards.</p>
      </div>
    </div>
  );
};

const GeneralCompanyForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploadingLogo(true);
    try {
      const res = await api.post("/settings/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onChange({ ...data, company_logo_url: res.data?.url || "" });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-800 mb-6">General Company Details</h3>
      
      {/* Company Information */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Company Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Company Name <span className="text-rose-500">*</span></label><input type="text" value={data.company_name || ""} onChange={(e) => onChange({...data, company_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Company Logo</label>
            <div className="flex gap-2 items-center">
              <input type="file" onChange={handleLogoUpload} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              {uploadingLogo && <div className="px-4 py-2 text-sm text-slate-500 flex items-center">Uploading...</div>}
              {data.company_logo_url && <img src={data.company_logo_url} alt="Logo" className="w-10 h-10 object-contain border border-slate-200 rounded bg-white" />}
            </div>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">CIN Number</label><input type="text" value={data.cin_number || ""} onChange={(e) => onChange({...data, cin_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Website</label><input type="text" value={data.website || ""} onChange={(e) => onChange({...data, website: e.target.value})} placeholder="e.g. www.example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Contact Number</label><input type="text" value={data.contact_number || ""} onChange={(e) => onChange({...data, contact_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Contact Email</label><input type="email" value={data.contact_email || ""} onChange={(e) => onChange({...data, contact_email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Registered Address</label><textarea rows={3} value={data.registered_address || ""} onChange={(e) => onChange({...data, registered_address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"></textarea></div>
        </div>
      </div>

    </div>
  );
};

const FinancialForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black text-slate-800 mb-6">Financial Settings</h3>
    
    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Currency & Precision</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Base Currency</label>
          <select value={data.currency || "INR"} onChange={(e) => onChange({...data, currency: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Decimal Precision</label>
          <select value={data.decimal_precision || 2} onChange={(e) => onChange({...data, decimal_precision: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <option value={0}>0 Decimal Places</option>
            <option value={2}>2 Decimal Places</option>
            <option value={3}>3 Decimal Places</option>
          </select>
        </div>
      </div>
    </div>

    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Financial Year</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Financial Year Name</label>
          <input type="text" value={data.financial_year || ""} onChange={(e) => onChange({...data, financial_year: e.target.value})} placeholder="e.g. 2026-2027" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
        </div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Start Date</label><input type="date" value={data.financial_year_start || ""} onChange={(e) => onChange({...data, financial_year_start: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">End Date</label><input type="date" value={data.financial_year_end || ""} onChange={(e) => onChange({...data, financial_year_end: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
      </div>
    </div>

    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Tax / GST Details</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Default GST Rate (%)</label><input type="number" value={data.default_gst_rate || ""} onChange={(e) => onChange({...data, default_gst_rate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tax Setup</label>
          <select value={data.tax_setup || "Inclusive"} onChange={(e) => onChange({...data, tax_setup: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <option value="Inclusive">Inclusive (Tax included in price)</option>
            <option value="Exclusive">Exclusive (Tax added on top)</option>
          </select>
        </div>
      </div>
    </div>

    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Invoice Format</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Invoice Prefix</label><input type="text" value={data.invoice_prefix || ""} onChange={(e) => onChange({...data, invoice_prefix: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Invoice Starting Number</label><input type="text" value={data.invoice_starting_number || ""} onChange={(e) => onChange({...data, invoice_starting_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">RA Bill Prefix</label><input type="text" value={data.ra_bill_prefix || ""} onChange={(e) => onChange({...data, ra_bill_prefix: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">RA Bill Starting Number</label><input type="text" value={data.ra_bill_starting_number || ""} onChange={(e) => onChange({...data, ra_bill_starting_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
      </div>
    </div>
    
    <div>
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Payment Terms</h4>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Default Payment Terms</label>
          <select value={data.default_payment_terms || "Net 30"} onChange={(e) => onChange({...data, default_payment_terms: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Net 15">Net 15 Days</option>
            <option value="Net 30">Net 30 Days</option>
            <option value="Net 45">Net 45 Days</option>
            <option value="Net 60">Net 60 Days</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

const BillingForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black text-slate-800 mb-6">Billing & Invoicing</h3>
    
    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Tax Identification</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">GST Number (GSTIN) <span className="text-rose-500">*</span></label><input type="text" value={data.gstin || ""} onChange={(e) => onChange({...data, gstin: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">PAN Number <span className="text-rose-500">*</span></label><input type="text" value={data.pan_number || ""} onChange={(e) => onChange({...data, pan_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
      </div>
    </div>

    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Bank Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Bank Name</label><input type="text" value={data.bank_name || ""} onChange={(e) => onChange({...data, bank_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Account Name</label><input type="text" value={data.account_name || ""} onChange={(e) => onChange({...data, account_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Account Number</label><input type="text" value={data.account_number || ""} onChange={(e) => onChange({...data, account_number: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">IFSC Code</label><input type="text" value={data.ifsc_code || ""} onChange={(e) => onChange({...data, ifsc_code: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Branch Name</label><input type="text" value={data.branch_name || ""} onChange={(e) => onChange({...data, branch_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
      </div>
    </div>

    <div className="mb-6">
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">UPI Payments</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">UPI ID / VPA</label><input type="text" value={data.upi_id || ""} onChange={(e) => onChange({...data, upi_id: e.target.value})} placeholder="e.g. merchant@bank" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Terms & Conditions</h4>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Default Terms & Conditions (Footer)</label><textarea rows={4} value={data.terms_conditions || data.footer_notes || ""} onChange={(e) => onChange({...data, terms_conditions: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"></textarea></div>
      </div>
    </div>
  </div>
);

const LedgerForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black text-slate-800 mb-6">Ledger Account Mappings</h3>
    <p className="text-xs text-slate-500 mb-6">Map default ledger accounts for automated journal entries.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Primary Cash Account</label>
        <input type="text" value={data.primary_cash_account || ""} onChange={(e) => onChange({...data, primary_cash_account: e.target.value})} placeholder="e.g. Petty Cash HQ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">TDS Payable Account</label>
        <input type="text" value={data.tds_payable_account || ""} onChange={(e) => onChange({...data, tds_payable_account: e.target.value})} placeholder="e.g. TDS on Contractor" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Wages Account</label>
        <input type="text" value={data.wages_account || ""} onChange={(e) => onChange({...data, wages_account: e.target.value})} placeholder="e.g. Labour Wages Payable" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Petty Cash Account</label>
        <input type="text" value={data.petty_cash_account || ""} onChange={(e) => onChange({...data, petty_cash_account: e.target.value})} placeholder="e.g. Site Petty Cash" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Retention Payable Account</label>
        <input type="text" value={data.retention_payable_account || ""} onChange={(e) => onChange({...data, retention_payable_account: e.target.value})} placeholder="e.g. Contractor Retention" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Other Ledger Mappings</label>
        <input type="text" value={data.other_ledger_mappings || ""} onChange={(e) => onChange({...data, other_ledger_mappings: e.target.value})} placeholder="e.g. Suspense A/C" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function AccountantSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [profileData, setProfileData] = useState<any>({});
  const [companyData, setCompanyData] = useState<any>({});
  const [appSettingsData, setAppSettingsData] = useState<any>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabKey;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch logic based on active tab category
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "profile") {
          const res = await api.get("/settings/profile");
          setProfileData(res.data);
        } else if (["general", "financial", "billing", "ledger"].includes(activeTab)) {
          const res = await api.get("/settings/company");
          setCompanyData(res.data);
        } else if (["notifications", "units", "default_project"].includes(activeTab)) {
          const res = await api.get("/settings");
          setAppSettingsData(res.data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [activeTab]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`?tab=${key}`, { replace: true });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "profile") {
        await api.put("/settings/profile", profileData);
      } else if (["general", "financial", "billing", "ledger"].includes(activeTab)) {
        await api.put("/settings/company", companyData);
      } else if (["notifications", "units", "default_project"].includes(activeTab)) {
        await api.put("/settings", appSettingsData);
      }
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.detail || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center p-20 text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Configuration...</div>;
    }

    switch (activeTab) {
      case "profile": return <ProfileForm data={profileData} onChange={setProfileData} />;
      case "notifications": return <NotificationsForm data={appSettingsData} onChange={setAppSettingsData} />;
      case "units": return <UnitsForm data={appSettingsData} onChange={setAppSettingsData} />;
      case "default_project": return <DefaultProjectForm data={appSettingsData} onChange={setAppSettingsData} />;
      case "general": return <GeneralCompanyForm data={companyData} onChange={setCompanyData} />;
      case "financial": return <FinancialForm data={companyData} onChange={setCompanyData} />;
      case "billing": return <BillingForm data={companyData} onChange={setCompanyData} />;
      case "ledger": return <LedgerForm data={companyData} onChange={setCompanyData} />;
      default: return <ProfileForm data={profileData} onChange={setProfileData} />;
    }
  };

  return (
    <>
      <Navbar title="Settings" breadcrumb={["Accountant", "Settings"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-inter pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8 w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your profile, preferences, and company configurations.</p>
          </div>
          <div className="relative font-inter shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search settings..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-6">
            {SIDEBAR_NAV.map((group) => (
              <div key={group.group}>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">
                  {group.group}
                </h4>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleTabChange(item.key as TabKey)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          isActive 
                            ? "bg-white text-primary shadow-sm border border-slate-200" 
                            : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm hover:border-slate-200 border border-transparent"
                        }`}
                      >
                        <span className={isActive ? "text-primary" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
              <div className="p-6 md:p-8 flex-1">
                {renderContent()}
              </div>
              
              {/* Bottom Actions */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 rounded-b-2xl">
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
