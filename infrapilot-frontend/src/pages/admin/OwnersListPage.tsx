import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import OwnerDetailsModal from "../../components/dashboard/OwnerDetailsModal";
import { ownerService } from "../../services/ownerService";
import type { Owner } from "../../types/owner";
import toast from "react-hot-toast";

// ─── Validation ───────────────────────────────────────────────────────────────
const validate = (form: Omit<Owner, "id">) => {
  const e: Partial<Record<keyof Owner, string>> = {};

  if (!form.name || !form.name.trim()) e.name = "Name cannot be blank.";
  else if (!/^[a-zA-Z\s]+$/.test(form.name)) e.name = "Only alphabets allowed.";
  else if (form.name.trim().length < 3)
    e.name = "Minimum 3 characters required.";

  if (!form.mobile || !form.mobile.trim()) e.mobile = "Mobile cannot be blank.";
  else if (!/^\d{10}$/.test(form.mobile))
    e.mobile = "Must be exactly 10 digits.";

  if (!form.email || !form.email.trim()) e.email = "Email cannot be blank.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "Must be a valid email format.";
  else if (/[A-Z]/.test(form.email))
    e.email = "Email must be in lowercase.";

  if (!form.address || !form.address.trim()) e.address = "Address cannot be blank.";

  if (!form.pan || !form.pan.trim()) e.pan = "PAN cannot be blank.";
  else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan.toUpperCase()))
    e.pan = "Format: ABCDE1234F";

  return e;
};

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  pan: "",
};

// ─── FormField ────────────────────────────────────────────────────────────────
const Field = ({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}) => (
  <div className="space-y-1">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-600 mb-1"
    >
      {label} <span className="text-rose-500">*</span>
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${error
        ? "border-rose-100 focus:ring-rose-50 bg-rose-50/30"
        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
        }`}
    />
    {error && <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>}
  </div>
);

// ─── Avatar initials ──────────────────────────────────────────────────────────
const Avatar = ({ name }: { name: string }) => {
  const initials = (name || "O")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
      {initials}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OwnersListPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Owner | null>(null);
  const [viewTarget, setViewTarget] = useState<Owner | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [form, setForm] = useState<Omit<Owner, "id">>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof Owner, string>>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);

  const fetchOwners = useCallback(async (search = "") => {
    try {
      setLoading(true);
      const data = await ownerService.getOwners(search);
      setOwners(data);
    } catch (error) {
      console.error("Failed to sync owners:", error);
      toast.error("Cloud synchronization failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOwners(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchOwners]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (o: Owner) => {
    setEditTarget(o);
    setForm({
      name: o.name,
      mobile: o.mobile,
      email: o.email,
      address: o.address,
      pan: o.pan,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openView = async (o: Owner) => {
    try {
      toast.loading("Retrieving profile...", { id: "view-load" });
      const fullOwner = await ownerService.getOwnerById(o.id);
      setViewTarget(fullOwner);
      setIsViewOpen(true);
      toast.dismiss("view-load");
    } catch (error) {
      toast.error("Failed to fetch profile details", { id: "view-load" });
    }
  };

  const openDelete = (o: Owner) => {
    setDeleteTarget(o);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      if (editTarget) {
        await ownerService.updateOwner(editTarget.id, form);
        toast.success("Owner profile updated successfully!");
      } else {
        await ownerService.createOwner(form);
        toast.success("Owner profile synchronized successfully!");
      }
      setIsModalOpen(false);
      fetchOwners(searchTerm);
    } catch (error) {
      toast.error("Synchronization failed. Check connectivity.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      toast.loading("Terminating record...", { id: "del-load" });
      await ownerService.deleteOwner(deleteTarget.id);
      toast.success("Stakeholder purged from directory", { id: "del-load" });
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchOwners(searchTerm);
    } catch (error) {
      toast.error("Termination failed", { id: "del-load" });
    }
  };

  const handleChange = (field: keyof Omit<Owner, "id">) => (value: string) => {
    let finalValue = value;
    if (field === "name") {
      finalValue = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (field === "mobile") {
      finalValue = value.replace(/[^\d]/g, "").slice(0, 10);
    } else if (field === "pan") {
      const val = value.toUpperCase();
      let filtered = "";
      for (let i = 0; i < Math.min(val.length, 10); i++) {
        const char = val[i];
        if (i < 5 && /[A-Z]/.test(char)) filtered += char;
        else if (i >= 5 && i < 9 && /[0-9]/.test(char)) filtered += char;
        else if (i === 9 && /[A-Z]/.test(char)) filtered += char;
      }
      finalValue = filtered;
    }
    setForm((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <>
      <Navbar
        title="Owner Management"
        breadcrumb={["Admin", "Owners", "Live Sync"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
              System Owners
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage property stakeholders and broadcast documentation.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/25 hover:bg-blue-600 transition-all active:scale-[0.98]"
          >
            + Register New Owner
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>
            {loading && (
              <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 px-4 py-2 rounded-xl">
                <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accessing Cloud Directory...</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-5">Stakeholder Details</th>
                  <th className="px-8 py-5 text-center">Reference Code</th>
                  <th className="px-8 py-5">Document Identity</th>
                  <th className="px-8 py-5">Permanent Address</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && owners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing Records...</p>
                      </div>
                    </td>
                  </tr>
                ) : owners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm font-medium">
                      Zero stakeholders detected in live directory.
                    </td>
                  </tr>
                ) : (
                  owners.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/40 transition-colors group">
                      {/* Owner Details */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar name={o.name} />
                          <div>
                            <p className="font-black text-slate-700 group-hover:text-primary transition-colors tracking-tight leading-none mb-1.5">
                              {o.name}
                            </p>
                            <p className="text-slate-400 text-xs font-semibold leading-none mb-1">
                              {o.email}
                            </p>
                            <p className="text-slate-400 text-[10px] font-black tracking-tight uppercase">
                              {o.mobile}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Reference Code */}
                      <td className="px-8 py-5 text-center">
                        <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-widest font-mono shadow-sm">
                          {o.owner_code || "GEN-01"}
                        </span>
                      </td>
                      {/* Document Identity */}
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-300 uppercase leading-none">PAN Identifier</span>
                          <span className="text-sm font-black text-slate-700 font-mono tracking-tighter leading-none">{o.pan}</span>
                        </div>
                      </td>
                      {/* Address */}
                      <td className="px-8 py-5 text-xs text-slate-400 font-bold max-w-[200px] truncate" title={o.address}>
                        {o.address}
                      </td>
                      {/* Actions */}
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.location.href = `/admin/owners/ledger?owner_id=${o.id}`}
                            className="p-2.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                            title="View Ledger"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openView(o)}
                            className="p-2.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/10"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEdit(o)}
                            className="p-2.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100"
                            title="Edit Owner"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDelete(o)}
                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Delete Owner"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.35em]">
              System Status: Cloud Synchronization Active
            </p>
          </div>
        </div>
      </PageTransition>

      {/* Details Modal */}
      <OwnerDetailsModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        owner={viewTarget}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 font-inter scale-in-center">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight leading-none">
                    {editTarget ? "Update Owner Record" : "Register New Owner"}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1.5">
                    Stakeholder Directory Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-gray-700">Stakeholder Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Legal Name"
                    id="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    error={errors.name}
                    placeholder="e.g. Vikramaditya Singh"
                  />
                  <Field
                    label="Contact Mobile"
                    id="mobile"
                    value={form.mobile}
                    onChange={handleChange("mobile")}
                    error={errors.mobile}
                    placeholder="10-digit primary sequence"
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Email Address"
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      error={errors.email}
                      placeholder="e.g. v.singh@corporate.in"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Field
                      label="Financial Identity (PAN)"
                      id="pan"
                      value={form.pan}
                      onChange={handleChange("pan")}
                      error={errors.pan}
                      placeholder="Format: ABCDE1234F"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-600 mb-1"
                    >
                      Permanent Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => handleChange("address")(e.target.value)}
                      rows={3}
                      placeholder="Complete physical or business address..."
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all resize-none ${errors.address
                        ? "border-rose-100 focus:ring-rose-50 bg-rose-50/30"
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                        }`}
                    />
                    {errors.address && (
                      <p className="mt-1 text-[11px] text-rose-500 font-medium">
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : editTarget ? (
                  "Update Profile"
                ) : (
                  "Register Owner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Authorize Sequence Purge"
        message={`This action will permanently terminate the stakeholder profile for ${deleteTarget?.name}. All broadcast data will be archived. Continue?`}
        confirmText="Confirm Deletion"
        type="danger"
      />
    </>
  );
}
