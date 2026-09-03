import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import api from "../../services/api";
import { accountingService } from "../../services/accountingService";
import { projectService } from "../../services/projectService";
import { PROJECTS } from "../../config/projectSeed";
import { materialService } from "../../services/materialService";

const PETTY_CASH_CATEGORIES = ["Tea Expenses", "Diesel", "Site Travel", "Local Material Purchase", "Stationery", "Miscellaneous"];
const PARTY_TYPES = ["Material Supplier", "Contractor", "Labor", "Staff", "Equipment Owner", "Land Owner", "Legal Entity"];

// --- DATE HELPERS (Exact API Response String) ---
const formatDateTimeDMY = (dateStr: any): string => {
  if (!dateStr || dateStr === "-" || dateStr === "null" || dateStr === "undefined") return "-";
  return String(dateStr);
};

const formatDateOnlyDMY = (dateStr: any): string => {
  if (!dateStr || dateStr === "-" || dateStr === "null" || dateStr === "undefined") return "-";
  return String(dateStr);
};

// --- PROJECT NAME RESOLUTION COMPONENT ---
const KNOWN_PROJECT_MAP: Record<string, string> = {
  "1": "Sara City",
  "2": "Metro Heights",
  "3": "Green Gardens",
  "4": "Skyline Towers",
  "5": "Riverfront Residency",
  "6": "Emerald Park",
  "7": "City Plaza",
  "8": "Royal Palms",
  "9": "Grand Horizons",
  "10": "Ocean View Residences",
};

const resolveProjectName = (
  projectId: number | string | null | undefined,
  item?: any,
  projects?: any[]
): string => {
  // 1. Direct project name on item
  const directName =
    item?.project_name ||
    item?.project?.name ||
    item?.project?.project_name ||
    item?.projectName;
  if (directName && typeof directName === "string" && isNaN(Number(directName))) {
    return directName;
  }

  // 2. If projectId is already a text name (e.g. "Sara City")
  if (
    typeof projectId === "string" &&
    isNaN(Number(projectId)) &&
    projectId.trim() !== "" &&
    projectId !== "null" &&
    projectId !== "undefined" &&
    projectId !== "-"
  ) {
    return projectId;
  }

  if (
    projectId === null ||
    projectId === undefined ||
    projectId === "" ||
    projectId === "-" ||
    projectId === "null" ||
    projectId === "undefined" ||
    projectId === 0
  ) {
    return "—";
  }

  const strId = String(projectId).trim();

  // 3. Search in projects array passed from API
  if (Array.isArray(projects) && projects.length > 0) {
    const p = projects.find(
      (proj) => String(proj.id ?? proj.project_id) === strId
    );
    if (p && (p.name || p.project_name || p.title)) {
      return p.name || p.project_name || p.title;
    }
  }

  // 4. Search in seed PROJECTS
  const seedProj: any = PROJECTS.find((p) => String(p.id) === strId);
  if (seedProj && (seedProj.project_name || seedProj.name)) {
    return seedProj.project_name || seedProj.name;
  }

  // 5. Check static known project map
  if (KNOWN_PROJECT_MAP[strId]) {
    return KNOWN_PROJECT_MAP[strId];
  }

  return `Project #${strId}`;
};

const ProjectNameCell = ({
  projectId,
  item,
  projects,
}: {
  projectId: number | string | null | undefined;
  item?: any;
  projects?: any[];
}) => {
  const [name, setName] = useState<string>(() =>
    resolveProjectName(projectId, item, projects)
  );

  useEffect(() => {
    const resolved = resolveProjectName(projectId, item, projects);
    if (resolved && !resolved.startsWith("Project #")) {
      setName(resolved);
      return;
    }

    // Try fetching from API asynchronously
    const numId = Number(projectId);

    // Check linked invoice
    const refStr = String(item?.reference || "");
    const invId =
      item?.invoice_id ||
      item?.invoice_name ||
      (refStr.toLowerCase().startsWith("inv:")
        ? refStr.replace(/^inv:/i, "").trim()
        : null);

    if (invId && !isNaN(Number(invId))) {
      api
        .get(`/invoices/${invId}`)
        .then((res) => {
          const inv = res.data;
          const invPName =
            inv?.project_name ||
            inv?.project?.name ||
            inv?.project?.project_name ||
            inv?.client_name;
          if (invPName) setName(invPName);
        })
        .catch(() => { });
    }

    if (!isNaN(numId) && numId > 0) {
      projectService
        .getProjectById(numId)
        .then((proj) => {
          if (proj && (proj.name || proj.project_name)) {
            setName(proj.name || proj.project_name);
          } else {
            setName(resolveProjectName(projectId, item, projects));
          }
        })
        .catch(() => {
          setName(resolveProjectName(projectId, item, projects));
        });
    } else {
      setName(resolved || "—");
    }
  }, [projectId, item, projects]);

  return <>{name || resolveProjectName(projectId, item, projects)}</>;
};

// --- SECTIONS ---
// 1. Transactions removed (Moved to Fund Transfer)


// 2. Receipts Section (Receive Payment)
const ReceiptsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "approval">(
    (initialSubTab as any) === "approval" ? "approval" : "list"
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  useEffect(() => {
    projectService.getProjects(200).then(res => {
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setProjects(list);
    }).catch(() => { });
  }, []);

  const fetchReceipts = async () => {
    try {
      const data = await accountingService.getReceipts();
      const raw = Array.isArray(data) ? data : data?.data || [];
      const sorted = [...raw].sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.date || a.updated_at || 0).getTime() || (Number(a.id) || 0);
        const timeB = new Date(b.created_at || b.date || b.updated_at || 0).getTime() || (Number(b.id) || 0);
        return timeB - timeA;
      });
      setReceipts(sorted);

      const sumData = await accountingService.getReceiptsSummary();
      setSummary(sumData);
    } catch (err) {
      toast.error("Failed to fetch receipts");
    }
  };

  useEffect(() => {
    if (activeSubTab === "list" || activeSubTab === "approval") {
      fetchReceipts();
    }
  }, [activeSubTab]);



  const handleApprove = (id: string) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "Cleared" } : r));
    toast.success("Receipt cleared!");
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRec: any = {};
    formData.forEach((value, key) => { newRec[key] = value; });

    try {
      setIsLoading(true);
      await accountingService.createReceipt({
        project_id: Number(newRec.project_id || 0),
        amount: Number(newRec.amount || 0),
        mode: newRec.mode || "Cash",
        reference: newRec.reference || ""
      });
      toast.success("Receipt recorded!");
      fetchReceipts();
      setIsCreateModalOpen(false);
      e.currentTarget.reset();
    } catch (err) {
      toast.error("Failed to create receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = [...receipts].sort((a: any, b: any) => {
    const timeA = new Date(a.created_at || a.date || a.updated_at || 0).getTime() || (Number(a.id) || 0);
    const timeB = new Date(b.created_at || b.date || b.updated_at || 0).getTime() || (Number(b.id) || 0);
    return timeB - timeA;
  });

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800">Receipts</h2>
        <div className="flex items-center gap-3">

          <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 whitespace-nowrap">
            + Create Receipt
          </button>
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Cash & Bank Receipts</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage all incoming payments</p>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-5">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Total Receipts</p>
                <p className="text-xl font-black text-emerald-600">₹ {summary?.total_receipts ? summary.total_receipts.toLocaleString() : summary?.total_amount ? summary.total_amount.toLocaleString() : "0"}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Total Count</p>
                <p className="text-xl font-black text-slate-700">{summary?.total_count || "0"}</p>
              </div>
            </div>

            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500">Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Mode</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Linked To</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Invoice</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Project</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Amount</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Reference</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Dates</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 capitalize">{r.type || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.mode || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.linked_to || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.invoice_name || r.invoice_id || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <ProjectNameCell projectId={r.project_id} item={r} projects={projects} />
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">₹ {(r.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.reference || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs">
                      <div><span className="text-slate-400">Cre:</span> {r.created_at ? formatDateTimeDMY(r.created_at) : '-'}</div>
                      <div className="mt-0.5"><span className="text-slate-400">Upd:</span> {r.updated_at ? formatDateTimeDMY(r.updated_at) : '-'}</div>
                    </td>

                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No receipts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filtered.length)} of {filtered.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 transition-all"
              >
                Prev
              </button>
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Receipt" maxWidth="max-w-2xl">
        <form onSubmit={handleFormSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Project</label>
              <select name="project_id" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all cursor-pointer">
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.name || p.project_name || `Project #${p.id || p.project_id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Amount</label>
              <input type="number" name="amount" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Mode</label>
              <select name="mode" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all cursor-pointer">
                <option value="Cash">Cash</option>
                <option value="BankTransfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Reference No</label>
              <input type="text" name="reference" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all" />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="mr-3 px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button disabled={isLoading} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
              {isLoading ? "Saving..." : "Save Receipt"}
            </button>
          </div>
        </form>
      </Modal>

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Clearance Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Approve and clear pending receipts / cheques</p>
          </div>
          <div className="divide-y divide-slate-50">
            {receipts.filter(r => r.status !== "Cleared").map(r => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.party} — {r.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.mode} · Date: {formatDateOnlyDMY(r.date || r.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">₹{r.amount?.toLocaleString("en-IN")}</span>
                  <button onClick={() => handleApprove(r.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Clear Receipt</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Payments Section (Make Payment)
const PaymentsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "create"
  );

  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [vendorBills, setVendorBills] = useState<any[]>([]);

  const [editingPayment, setEditingPayment] = useState<any>(null);

  useEffect(() => {
    materialService.getSuppliers().then((res: any) => setSuppliers(res || [])).catch(() => null);
    api.get("/vendor-bills").then((res: any) => setVendorBills(Array.isArray(res.data) ? res.data : (res.data?.items || []))).catch(() => null);
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await accountingService.getPaymentVouchers();
      setPayments(Array.isArray(data) ? data : data?.data || data?.items || []);
    } catch (err) {
      toast.error("Failed to fetch payment vouchers");
    }
  };

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  useEffect(() => {
    if (activeSubTab === "list" || activeSubTab === "approval") {
      fetchPayments();
    }
  }, [activeSubTab]);

  const handleDelete = async (id: string) => {
    try {
      await accountingService.cancelVoucher(id);
      toast.success("Payment voucher cancelled!");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to cancel payment voucher");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await accountingService.markVoucherPaid(id);
      toast.success("Payment approved!");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to approve payment");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPay: any = {};
    formData.forEach((value, key) => { newPay[key] = value; });
    newPay.amount = Number(newPay.amount || 0);

    try {
      await accountingService.createPaymentVoucher(newPay);
      toast.success("Payment voucher submitted!");
      fetchPayments();
      setActiveSubTab("list");
      setEditingPayment(null);
    } catch (err) {
      toast.error("Failed to save payment voucher");
    }
  };

  const filtered = [...payments].sort((a: any, b: any) => {
    const timeA = new Date(a.date || a.created_at || 0).getTime() || (Number(String(a.id).replace(/\D/g, '')) || 0);
    const timeB = new Date(b.date || b.created_at || 0).getTime() || (Number(String(b.id).replace(/\D/g, '')) || 0);
    return timeB - timeA;
  });

  const subTabs = [
    { key: "create", label: "Make Payment" },
    { key: "list", label: "Payments List" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Cash & Bank Payments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage all outgoing payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Payment No", "Party", "Type", "Amount", "Mode", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateOnlyDMY(p.date || p.created_at)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-rose-600">{p.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{p.party}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.type}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{p.amount?.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.mode}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-slate-100 text-slate-600`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingPayment(p); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Voucher Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date *</label><input type="datetime-local" name="payment_date" defaultValue={editingPayment?.payment_date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" required /></div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Type *</label>
                  <select name="party_type" defaultValue={editingPayment?.party_type || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" required>
                    <option value="">Select Type...</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier *</label>
                  <select name="supplier_id" defaultValue={editingPayment?.supplier_id || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="">None</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.supplier_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor *</label>
                  <select name="contractor_id" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="0">None</option>
                    <option value="1">Contractor X</option>
                    <option value="2">Contractor Y</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Bill *</label>
                  <select name="vendor_bill_id" defaultValue={editingPayment?.vendor_bill_id || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="">None</option>
                    {vendorBills.map(b => (
                      <option key={b.id} value={b.id}>{b.bill_number || `Bill #${b.id}`} - {b.vendor_name || b.supplier_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Amount Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Amount *</label><input type="number" name="base_amount" defaultValue={editingPayment?.base_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>

                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Amount</label><input type="number" name="gst_amount" defaultValue={editingPayment?.gst_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>

                <div className="col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Amount</label><input type="number" name="gross_amount" defaultValue={editingPayment?.gross_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-bold" /></div>

                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Amount</label><input type="number" name="tds_amount" defaultValue={editingPayment?.tds_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-500" /></div>

                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Amount</label><input type="number" name="retention_amount" defaultValue={editingPayment?.retention_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-500" /></div>

                <div className="col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable Amount *</label><input type="number" name="net_payable_amount" defaultValue={editingPayment?.net_payable_amount || 0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-bold text-rose-600" /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Payment Execution
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method *</label>
                  <select name="payment_method" defaultValue={editingPayment?.payment_method || "BankTransfer"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account *</label>
                  <select name="bank_account_id" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="0">Select Bank Account...</option>
                    <option value="1">HDFC Bank - Current A/c - 1234</option>
                    <option value="2">SBI Bank - Escrow A/c - 5678</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No</label>
                  <input type="text" name="reference_no" defaultValue={editingPayment?.reference_no || ""} placeholder="Ref No." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Payment Workflow</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Base Amount</span><span className="font-semibold text-slate-700">{editingPayment ? `₹${editingPayment.amount}` : "—"}</span></div>
                <div className="flex justify-between text-xs text-rose-500"><span>Deductions</span><span className="font-semibold">—</span></div>
                <div className="flex justify-between text-sm font-bold text-rose-600 border-t border-slate-100 pt-3"><span>Net Payment</span><span>{editingPayment ? `₹${editingPayment.amount}` : "—"}</span></div>
              </div>
              <div className="mt-5 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Status *</label>
                <select name="status" defaultValue={editingPayment?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-semibold text-amber-600">
                  <option value="Pending">Pending</option><option value="Processed">Processed</option><option value="Paid">Paid</option><option value="Failed">Failed</option><option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-6 bg-rose-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95">
                {editingPayment ? "Update Voucher" : "Submit Payment Voucher"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")} className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 border border-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Payment Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Approve and process outgoing payments</p>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.filter(p => p.status !== "Paid").map(p => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.party} — {p.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.type} · Date: {formatDateOnlyDMY(p.date || p.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-600">₹{p.amount?.toLocaleString("en-IN")}</span>
                  <button onClick={() => handleApprove(p.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Approve Payment</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Petty Cash Section
const PettyCashSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [, setPettyCashData] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);

  const fetchPettyCash = async () => {
    try {
      const res = await accountingService.getPettyCashLedger();
      setPettyCashData(Array.isArray(res) ? res : res?.items || res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    accountingService.getBankAccounts().then(res => setBankAccounts(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
    accountingService.getAccounts({ limit: 100 }).then(res => {
      const accounts = Array.isArray(res) ? res : res?.items || res?.data || [];
      setExpenseAccounts(accounts.filter((a: any) => a.type === 'Expense' || a.account_type === 'Expense'));
    }).catch(() => { });
    fetchPettyCash();
  }, []);

  const [formData, setFormData] = useState({
    type: "CASH_OUT",
    transaction_date: new Date().toISOString().split("T")[0],
    category_id: 0,
    source_account_id: 0,
    amount: 0,
    paid_to_received_from: "",
    approved_by: 0,
    remarks: ""
  });

  const handleSaveTransaction = async () => {
    if (!formData.amount || !formData.category_id || !formData.source_account_id) {
      toast.error("Please fill required fields (Category, Source Account, Amount)");
      return;
    }
    setIsSubmitting(true);
    try {
      await accountingService.createPettyCashTransaction({
        type: formData.type,
        transaction_date: formData.transaction_date,
        category_id: Number(formData.category_id),
        source_account_id: Number(formData.source_account_id),
        amount: Number(formData.amount),
        paid_to_received_from: formData.paid_to_received_from,
        approved_by: Number(formData.approved_by),
        remarks: formData.remarks
      });
      toast.success("Petty Cash transaction added successfully!");
      setIsModalOpen(false);
      setFormData({
        type: "CASH_OUT",
        transaction_date: new Date().toISOString().split("T")[0],
        category_id: 0,
        source_account_id: 0,
        amount: 0,
        paid_to_received_from: "",
        approved_by: 0,
        remarks: ""
      });
      fetchPettyCash();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50/50 gap-4">
        <div>
          <h3 className="font-bold text-slate-800">Petty Cash Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Record daily cash in / out for minor site expenses</p>
        </div>
        <div className="flex items-center gap-6">

          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20 active:scale-95 whitespace-nowrap">
            + Create Petty Cash
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Transaction" maxWidth="max-w-2xl">
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value="CASH_OUT">Cash Out (Expense)</option><option value="CASH_IN">Cash In (Top-up)</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label><input type="date" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category *</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value={0}>Select...</option>{expenseAccounts.map(c => <option key={c.id} value={c.id}>{c.account_name || c.name}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Account *</label><select value={formData.source_account_id} onChange={(e) => setFormData({ ...formData, source_account_id: Number(e.target.value) })} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value={0}>Select Source Account...</option>{bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹) *</label><input type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} placeholder="0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid To / Received From</label><input type="text" value={formData.paid_to_received_from} onChange={(e) => setFormData({ ...formData, paid_to_received_from: e.target.value })} placeholder="Name" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</label><select value={formData.approved_by} onChange={(e) => setFormData({ ...formData, approved_by: Number(e.target.value) })} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value={0}>Select Approver...</option><option value={1}>Admin</option><option value={2}>Manager</option></select></div>
            <div className="sm:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Description..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSaveTransaction} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95">
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </div>
      </Modal>
      <div className="p-5 border-b border-slate-100">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl inline-block min-w-[200px]">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Current Balance</p>
          <p className="text-2xl font-black text-indigo-600">₹24,500</p>
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              {["Voucher No", "Date", "Category", "Remarks", "Paid To", "Cash In", "Cash Out", "Balance"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pettyCashData.length > 0 ? pettyCashData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-600">{item.voucher_no || item.id || '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{item.date ? item.date.split('T')[0] : (item.transaction_date ? item.transaction_date.split('T')[0] : '-')}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{item.category?.name || item.category || expenseAccounts.find(c => c.id === item.category_id)?.account_name || item.category_id || '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{item.remarks || item.description || '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{item.paid_to || item.paid_to_received_from || '-'}</td>
                <td className="px-4 py-3 text-xs text-emerald-600 text-right">{parseFloat(item.cash_in) > 0 ? `₹${item.cash_in}` : (item.type === 'CASH_IN' ? `₹${item.amount}` : '—')}</td>
                <td className="px-4 py-3 text-xs text-rose-600 text-right font-bold">{parseFloat(item.cash_out) > 0 ? `₹${item.cash_out}` : (item.type === 'CASH_OUT' ? `₹${item.amount}` : '—')}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{item.balance || '0'}</td>
              </tr>
            ))}
            {pettyCashData.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-xs text-slate-400">No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const CreateFundTransferModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    from_account_id: 0,
    to_account_id: 0,
    amount: 0,
    transfer_date: new Date().toISOString().split('T')[0],
    reference_number: "",
    remarks: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      accountingService.getBankAccounts().then(res => setAccountsList(Array.isArray(res) ? res : res?.data || [])).catch(() => { });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await accountingService.createFundTransfer(formData);
      toast.success("Fund Transfer Created!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to create fund transfer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Fund Transfer" maxWidth="max-w-xl" footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
          {isLoading ? "Creating..." : "Create Transfer"}
        </button>
      </>
    }>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Account *</label>
          <select required value={formData.from_account_id || ""} onChange={e => setFormData({ ...formData, from_account_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select From Account</option>
            {accountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Account *</label>
          <select required value={formData.to_account_id || ""} onChange={e => setFormData({ ...formData, to_account_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <option value="">Select To Account</option>
            {accountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount *</label>
          <input type="number" required value={formData.amount || ""} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Date *</label>
          <input type="date" required value={formData.transfer_date} onChange={e => setFormData({ ...formData, transfer_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number *</label>
          <input type="text" required value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label>
          <input type="text" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
        </div>
      </form>
    </Modal>
  );
};

// 6. Bank Transactions
const BankTransactionsSection = () => {
  const [activeSubTab, setActiveSubTab] = useState("deposits");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    projectService.getProjects(200).then(res => {
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setProjects(list);
    }).catch(() => { });
  }, []);

  const fetchTransfers = () => {
    setIsLoading(true);
    accountingService.getFundTransfers().then(res => {
      const raw = Array.isArray(res) ? res : res?.data || [];
      const sorted = [...raw].sort((a: any, b: any) => {
        const timeA = new Date(a.transfer_date || a.created_at || 0).getTime() || (Number(a.id) || 0);
        const timeB = new Date(b.transfer_date || b.created_at || 0).getTime() || (Number(b.id) || 0);
        return timeB - timeA;
      });
      setTransfers(sorted);
    }).finally(() => setIsLoading(false));
  };

  const subTabs = [
    { key: "deposits", label: "Bank Deposits" },
    { key: "withdrawals", label: "Bank Withdrawals" },
    { key: "transfers", label: "Fund Transfers" },
    { key: "history", label: "Transaction History" },
  ];

  useEffect(() => {
    if (activeSubTab === "history") {
      setIsLoading(true);
      accountingService.getTransactions().then(res => {
        const raw = Array.isArray(res) ? res : res?.data || [];
        const sorted = [...raw].sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || a.date || a.transaction_date || 0).getTime() || (Number(a.id) || 0);
          const timeB = new Date(b.created_at || b.date || b.transaction_date || 0).getTime() || (Number(b.id) || 0);
          return timeB - timeA;
        });
        setTransactions(sorted);
      }).catch(() => {
        toast.error("Failed to fetch transactions");
      }).finally(() => {
        setIsLoading(false);
      });
    } else if (activeSubTab === "transfers") {
      fetchTransfers();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-5">
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 w-fit">
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === "history" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">All Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">List of all cash inflows and outflows</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mode</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Project</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Reference</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">No transactions found.</td></tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id || t.reference || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{t.type || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{t.mode || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                        <ProjectNameCell projectId={t.project_id} item={t} projects={projects} />
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹ {Number(t.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{t.reference || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <div><span className="text-slate-400">Cre:</span> {t.created_at ? formatDateTimeDMY(t.created_at) : '-'}</div>
                        <div className="mt-0.5"><span className="text-slate-400">Upd:</span> {t.updated_at ? formatDateTimeDMY(t.updated_at) : '-'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === "transfers" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Fund Transfers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage fund transfers between accounts</p>
            </div>
            <button onClick={() => setIsTransferModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all">+ New Transfer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Ref No", "From", "To", "Remarks", "Amount"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">Loading...</td></tr>
                ) : transfers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-sm text-slate-500">No transfers found.</td></tr>
                ) : (
                  transfers.map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDateOnlyDMY(tr.transfer_date || tr.created_at)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-indigo-600">{tr.reference_number}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{tr.from_account_id}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{tr.to_account_id}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{tr.remarks}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{tr.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <CreateFundTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSuccess={fetchTransfers} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">{subTabs.find(t => t.key === activeSubTab)?.label}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage and record bank transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Ref No", "Description", "Amount", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateOnlyDMY("2024-05-18")}</td>
                  <td className="px-4 py-3 text-xs font-bold text-indigo-600">TRX-001</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">Sample {subTabs.find(t => t.key === activeSubTab)?.label}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">₹1,50,000</td>
                  <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};



// --- MAIN COMPONENT ---

type TabKey = "receipts" | "payments" | "fund-transfer" | "petty-cash";

const TABS: { key: TabKey; label: string }[] = [
  { key: "receipts", label: "Receipt" },
  { key: "payments", label: "Payment" },
  { key: "fund-transfer", label: "Fund Transfer" },
  { key: "petty-cash", label: "Petty Cash" },
];

const PaymentsReceiptsPage = () => {
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
      "receipts": "receipts",
      "payments": "payments",
      "petty-cash": "petty-cash",
      "fund-transfer": "fund-transfer",
    };
    return map[currentSub || ""] || "receipts";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/payments/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Payments & Receipts" breadcrumb={["Accountant", "Payments & Receipts"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payments & Receipts</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all cash inflows, outflows, petty cash, and bank transactions.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Rendering */}
        {activeTab === "receipts" && <ReceiptsSection initialSubTab={subTab} key={subTab || "receive"} />}
        {activeTab === "payments" && <PaymentsSection initialSubTab={subTab} key={subTab || "vendor"} />}
        {activeTab === "fund-transfer" && <BankTransactionsSection />}
        {activeTab === "petty-cash" && <PettyCashSection />}
      </PageTransition>
    </>
  );
};

export default PaymentsReceiptsPage;
