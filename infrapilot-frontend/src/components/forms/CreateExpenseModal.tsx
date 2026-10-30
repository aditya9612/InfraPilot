import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import type { Expense } from "../../types/expense";
import type { Project } from "../../types/project";
import { boqService } from "../../services/boqService";
import { projectService } from "../../services/projectService";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (expenseData: any) => void | Promise<void>;
  projects?: Project[];
  initialData?: Expense | null;
}

export const formatExpenseCategory = (cat: string | null | undefined): string => {
  if (!cat) return "Other";
  const trimmed = cat.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  const codeMap: Record<string, string> = {
    M: "Material",
    S: "Services",
    L: "Labour",
    V: "Vendor",
    E: "Equipment",
    F: "Fuel",
    T: "Travel",
    U: "Utility",
    O: "Other",
    C: "Construction",
    A: "Administrative",
    W: "Wages",
  };

  if (codeMap[upper]) {
    return codeMap[upper];
  }

  const standard = [
    "Material",
    "Labour",
    "Equipment",
    "Services",
    "Vendor",
    "Construction",
    "Utility",
    "Fuel",
    "Travel",
    "Maintenance",
    "Administrative",
    "Other",
  ];
  const matched = standard.find((s) => s.toLowerCase() === lower);
  if (matched) return matched;

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const STANDARD_CATEGORIES = [
  "Material",
  "Labour",
  "Equipment",
  "Services",
  "Vendor",
  "Fuel",
  "Travel",
  "Maintenance",
  "Construction",
  "Utility",
  "Administrative",
  "Other"
];

const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  initialData,
}) => {
  const emptyFormData = {
    project_id: "",
    category: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_mode: "Cash",
    remarks: "",
    boq_item_id: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    upi_id: "",
    cheque_number: "",
    cheque_date: new Date().toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState(emptyFormData);
  const [internalProjects, setInternalProjects] = useState<Project[]>([]);
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [isFetchingBoqs, setIsFetchingBoqs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!projects || projects.length === 0) {
        projectService.getProjects(100, 0, "", "").then(res => {
          const list = Array.isArray(res) ? res : res?.items || (res as any)?.data || [];
          setInternalProjects(list);
        }).catch(err => console.error("Failed to load projects in CreateExpenseModal", err));
      }
      if (initialData) {
        const cat = formatExpenseCategory(initialData.category);

        setFormData({
          project_id: String(initialData.project_id || (initialData as any).projectId || ""),
          category: cat,
          amount: String(initialData.amount || ""),
          expense_date: (initialData.expense_date || new Date().toISOString()).split("T")[0],
          payment_mode: initialData.payment_mode || "Cash",
          remarks: initialData.description || (initialData as any).remarks || "",
          boq_item_id: initialData.boq_item_id ? String(initialData.boq_item_id) : "",
          account_holder_name: (initialData as any).account_holder_name || "",
          account_number: (initialData as any).account_number || "",
          ifsc_code: (initialData as any).ifsc_code || "",
          bank_name: (initialData as any).bank_name || "",
          upi_id: (initialData as any).upi_id || "",
          cheque_number: (initialData as any).cheque_number || "",
          cheque_date: (initialData as any).cheque_date || new Date().toISOString().split("T")[0],
        });
      } else {
        setFormData(emptyFormData);
      }
      setErrors({});
    }
  }, [initialData, isOpen, projects]);

  useEffect(() => {
    let isMounted = true;
    const fetchBoqs = async () => {
      const pId = Number(formData.project_id);
      if (!pId || isNaN(pId)) {
        setBoqItems([]);
        return;
      }
      setIsFetchingBoqs(true);
      try {
        let items: any[] = [];

        // 1. Try getBoqItems (project items)
        try {
          const bItems = await boqService.getBoqItems(pId);
          const list = Array.isArray(bItems) ? bItems : (bItems as any)?.items || (bItems as any)?.boq_items || (bItems as any)?.data || [];
          if (list.length > 0) items = list;
        } catch (err) { }

        // 2. Try getBoqsByProject
        if (items.length === 0) {
          try {
            const byProj = await boqService.getBoqsByProject(pId);
            const list = Array.isArray(byProj) ? byProj : (byProj as any)?.items || (byProj as any)?.boq_items || (byProj as any)?.data || [];
            if (list.length > 0) items = list;
          } catch (err) { }
        }

        // 3. Try getBoqs with project_id filter and unwrap nested items
        if (items.length === 0) {
          try {
            const data = await boqService.getBoqs({ project_id: pId, limit: 100, skip: 0 } as any);
            const raw = Array.isArray(data) ? data : (data?.items || (data as any)?.data || []);
            if (raw.length > 0) items = raw;
          } catch (err) { }
        }

        // 4. Fallback to global getBoqs filter by project_id
        if (items.length === 0) {
          try {
            const allBoqs = await boqService.getBoqs({ limit: 100 } as any);
            const raw = Array.isArray(allBoqs) ? allBoqs : (allBoqs?.items || (allBoqs as any)?.data || []);
            const matching = raw.filter((b: any) => Number(b.project_id) === pId);
            items = matching.length > 0 ? matching : raw;
          } catch (err) { }
        }

        // Deep unwrap any nested structures (items, boq_items, sub_items)
        const unwrapItems = (list: any[]): any[] => {
          const res: any[] = [];
          list.forEach((b: any) => {
            if (!b) return;
            if (Array.isArray(b.items) && b.items.length > 0) {
              res.push(...unwrapItems(b.items));
            } else if (Array.isArray(b.boq_items) && b.boq_items.length > 0) {
              res.push(...unwrapItems(b.boq_items));
            } else if (Array.isArray(b.sub_items) && b.sub_items.length > 0) {
              res.push(...unwrapItems(b.sub_items));
            } else {
              res.push(b);
            }
          });
          return res;
        };

        let flattened = unwrapItems(items);

        // If returned items are group headers with no names, try fetching group items for the first few groups
        if (flattened.length > 0 && flattened.every(b => !b.item_name && !b.name && !b.description && !b.title && !b.item_code)) {
          try {
            const groupItemPromises = flattened.slice(0, 5).map(g => boqService.getGroupItems(g.id || g.group_id).catch(() => []));
            const groupResults = await Promise.all(groupItemPromises);
            const subItems = groupResults.flat().filter(Boolean);
            if (subItems.length > 0) {
              flattened = subItems;
            }
          } catch (e) { }
        }

        if (isMounted) {
          setBoqItems(flattened.filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to fetch BOQ items", error);
        if (isMounted) setBoqItems([]);
      } finally {
        if (isMounted) setIsFetchingBoqs(false);
      }
    };
    fetchBoqs();
    return () => { isMounted = false; };
  }, [formData.project_id]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const newErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0.";
    if (!formData.project_id) newErrors.project_id = "Project is required.";
    if (!formData.category?.trim()) newErrors.category = "Category is required.";
    if (!formData.expense_date) newErrors.expense_date = "Expense Date is required.";

    // Dynamic field validation by payment mode
    if (formData.payment_mode === "Bank Transfer") {
      if (!formData.account_holder_name?.trim()) newErrors.account_holder_name = "Account Holder Name is required.";
      if (!formData.account_number?.trim()) newErrors.account_number = "Account Number is required.";
      if (!formData.ifsc_code?.trim()) newErrors.ifsc_code = "IFSC Code is required.";
      if (!formData.bank_name?.trim()) newErrors.bank_name = "Bank Name is required.";
    } else if (formData.payment_mode === "UPI") {
      if (!formData.upi_id?.trim()) newErrors.upi_id = "UPI ID is required.";
    } else if (formData.payment_mode === "Cheque") {
      if (!formData.cheque_number?.trim()) newErrors.cheque_number = "Cheque Number is required.";
      if (!formData.bank_name?.trim()) newErrors.bank_name = "Bank Name is required.";
      if (!formData.cheque_date) newErrors.cheque_date = "Cheque Date is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setErrors({});

    let paymentDetails = "";
    if (formData.payment_mode === "Bank Transfer") {
      paymentDetails = `Bank Transfer [A/C Holder: ${formData.account_holder_name.trim()}, A/C No: ${formData.account_number.trim()}, IFSC: ${formData.ifsc_code.trim()}, Bank: ${formData.bank_name.trim()}]`;
    } else if (formData.payment_mode === "UPI") {
      paymentDetails = `UPI [UPI ID: ${formData.upi_id.trim()}]`;
    } else if (formData.payment_mode === "Cheque") {
      paymentDetails = `Cheque [No: ${formData.cheque_number.trim()}, Bank: ${formData.bank_name.trim()}, Date: ${formData.cheque_date}]`;
    }

    const fullDescription = [formData.remarks?.trim(), paymentDetails].filter(Boolean).join(" — ");

    const submissionData = {
      project_id: Number(formData.project_id) || 0,
      category: formData.category.trim(),
      description: fullDescription || formData.category.trim(),
      amount: Number(formData.amount),
      expense_date: formData.expense_date,
      payment_mode: formData.payment_mode,
      boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : 0,
      account_holder_name: formData.account_holder_name || undefined,
      account_number: formData.account_number || undefined,
      ifsc_code: formData.ifsc_code || undefined,
      bank_name: formData.bank_name || undefined,
      upi_id: formData.upi_id || undefined,
      cheque_number: formData.cheque_number || undefined,
      cheque_date: formData.cheque_date || undefined,
    };

    try {
      setIsSubmitting(true);
      // Await the parent handler — it controls closing the modal on success/failure
      if (onSubmit) {
        await onSubmit(submissionData);
      } else {
        toast.success("Expense recorded successfully");
        onClose();
      }
    } catch (err) {
      console.error("Failed to submit expense", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Expense" : "Record New Expense"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Classification */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Expense Classification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Category <span className="text-rose-500">*</span></label>
                <select
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.category
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  value={formData.category}
                  onChange={e => {
                    setFormData({ ...formData, category: e.target.value });
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                >
                  <option value="">Select Category...</option>
                  {STANDARD_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {formData.category && !STANDARD_CATEGORIES.includes(formData.category) && (
                    <option value={formData.category}>{formatExpenseCategory(formData.category)}</option>
                  )}
                </select>
                {errors.category && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.category}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Project <span className="text-rose-500">*</span></label>
                <select
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.project_id
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  value={formData.project_id}
                  onChange={e => {
                    setFormData({ ...formData, project_id: e.target.value });
                    if (errors.project_id) setErrors({ ...errors, project_id: "" });
                  }}
                >
                  <option value="">Select Project...</option>
                  {((projects && projects.length > 0) ? projects : internalProjects).map(p => {
                    const pId = p.id ?? (p as any).project_id;
                    const pName = p.project_name || (p as any).name || (p as any).projectName || `Project #${pId}`;
                    return (
                      <option key={pId} value={pId}>{pName}</option>
                    );
                  })}
                  {formData.project_id && !((projects && projects.length > 0) ? projects : internalProjects).some(p => String(p.id ?? (p as any).project_id) === String(formData.project_id)) && (
                    <option value={formData.project_id}>{(initialData as any)?.project_name || `Project #${formData.project_id}`}</option>
                  )}
                </select>
                {errors.project_id && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.project_id}</p>}
              </div>

              {formData.project_id && (
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    BOQ Item
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    value={formData.boq_item_id}
                    onChange={e => setFormData({ ...formData, boq_item_id: e.target.value })}
                  >
                    <option value="">Select BOQ Item...</option>
                    {boqItems.map((item: any, idx) => {
                      const idVal = item.id ?? item.boq_item_id ?? item.item_id ?? `boq-${idx}`;
                      const name = item.item_name || item.name || item.description || item.title || item.item_code || item.work_description || `BOQ Item #${idVal}`;
                      const unit = item.unit || item.unit_name ? ` (${item.unit || item.unit_name})` : "";
                      return (
                        <option key={`${idVal}-${idx}`} value={idVal}>
                          {name}{unit}
                        </option>
                      );
                    })}
                  </select>
                  {isFetchingBoqs && (
                    <p className="text-[10px] text-primary animate-pulse font-bold ml-1">Fetching project BOQ items...</p>
                  )}
                  {!isFetchingBoqs && boqItems.length === 0 && (
                    <p className="text-[11px] text-slate-400 font-medium ml-1">No BOQ items assigned to this project.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Financials & Audit */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Financials & Logistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount (₹) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-4 transition-all outline-none font-bold ${errors.amount
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (errors.amount) setErrors({ ...errors, amount: "" });
                  }}
                />
                {errors.amount && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.amount}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Expense Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-4 transition-all outline-none font-medium ${errors.expense_date
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  value={formData.expense_date}
                  onChange={e => {
                    setFormData({ ...formData, expense_date: e.target.value });
                    if (errors.expense_date) setErrors({ ...errors, expense_date: "" });
                  }}
                />
                {errors.expense_date && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.expense_date}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Mode</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={formData.payment_mode}
                  onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              {/* Dynamic Payment Details */}
              {formData.payment_mode === "Bank Transfer" && (
                <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bank Transfer Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Account Holder Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.account_holder_name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.account_holder_name}
                        onChange={e => {
                          setFormData({ ...formData, account_holder_name: e.target.value });
                          if (errors.account_holder_name) setErrors({ ...errors, account_holder_name: "" });
                        }}
                      />
                      {errors.account_holder_name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.account_holder_name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Account Number <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. 123456789012"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.account_number ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.account_number}
                        onChange={e => {
                          setFormData({ ...formData, account_number: e.target.value });
                          if (errors.account_number) setErrors({ ...errors, account_number: "" });
                        }}
                      />
                      {errors.account_number && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.account_number}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">IFSC Code <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none uppercase ${errors.ifsc_code ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.ifsc_code}
                        onChange={e => {
                          setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() });
                          if (errors.ifsc_code) setErrors({ ...errors, ifsc_code: "" });
                        }}
                      />
                      {errors.ifsc_code && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.ifsc_code}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Bank Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.bank_name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.bank_name}
                        onChange={e => {
                          setFormData({ ...formData, bank_name: e.target.value });
                          if (errors.bank_name) setErrors({ ...errors, bank_name: "" });
                        }}
                      />
                      {errors.bank_name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.bank_name}</p>}
                    </div>
                  </div>
                </div>
              )}

              {formData.payment_mode === "UPI" && (
                <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">UPI Details</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">UPI ID <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. username@upi or mobile@okhdfcbank"
                      className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.upi_id ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                      value={formData.upi_id}
                      onChange={e => {
                        setFormData({ ...formData, upi_id: e.target.value });
                        if (errors.upi_id) setErrors({ ...errors, upi_id: "" });
                      }}
                    />
                    {errors.upi_id && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.upi_id}</p>}
                  </div>
                </div>
              )}

              {formData.payment_mode === "Cheque" && (
                <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cheque Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Cheque Number <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. 000123"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.cheque_number ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.cheque_number}
                        onChange={e => {
                          setFormData({ ...formData, cheque_number: e.target.value });
                          if (errors.cheque_number) setErrors({ ...errors, cheque_number: "" });
                        }}
                      />
                      {errors.cheque_number && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.cheque_number}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Bank Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.bank_name ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.bank_name}
                        onChange={e => {
                          setFormData({ ...formData, bank_name: e.target.value });
                          if (errors.bank_name) setErrors({ ...errors, bank_name: "" });
                        }}
                      />
                      {errors.bank_name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.bank_name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Cheque Date <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:ring-4 transition-all outline-none ${errors.cheque_date ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10 focus:border-primary"}`}
                        value={formData.cheque_date}
                        onChange={e => {
                          setFormData({ ...formData, cheque_date: e.target.value });
                          if (errors.cheque_date) setErrors({ ...errors, cheque_date: "" });
                        }}
                      />
                      {errors.cheque_date && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.cheque_date}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
                  placeholder="Describe this expense (maps to description in backend)..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-all shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Saving..." : (initialData ? "Update Record" : "Save Expense")}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateExpenseModal;
