import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

import SupplierModal from "../../components/inventory/SupplierModal";
import TransferMaterialModal from "../../components/inventory/TransferMaterialModal";
import AddMaterialModal from "../../components/inventory/AddMaterialModal";
import UpdateTransferStatusModal from "../../components/inventory/UpdateTransferStatusModal";
import PurchaseActionModal from "../../components/inventory/PurchaseActionModal";
import MaterialCostReportModal from "../../components/inventory/MaterialCostReportModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import SortDropdown from "../../components/common/SortDropdown";
import { materialService } from "../../services/materialService";
import { projectService } from "../../services/projectService";
import { masterService } from "../../services/masterService";
import { computeMaterialValuation, formatValuationCurrency } from "../../utils/stockValuationUtils";
import {
  PlusCircle,
  FileText,
  History,
  ShoppingCart,
  Truck,
  LayoutDashboard,
  Upload,
  PackagePlus,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
} from "lucide-react";
import type {
  Material,
  Supplier,
  PurchaseOrder,
  Transfer,
  InventoryLog,
  InventorySummary,
  InwardReceipt,
  OutwardIssue,
  DailyStockRecord,
  StockLedgerEntry,
  OTPCancellationRequest,
  ValuationMethod,
  BulkMaterialRow,
  CreateInwardPayload,
  CreateOutwardPayload,
} from "../../types/material";

// Modular components
import InventoryTable from "../../components/admin/inventory/InventoryTable";
import SupplierTable from "../../components/admin/inventory/SupplierTable";
import PurchaseOrderTable from "../../components/admin/inventory/PurchaseOrderTable";
import TransferTable from "../../components/admin/inventory/TransferTable";
import ViewTransferModal from "../../components/admin/inventory/ViewTransferModal";
import InventoryLogsTable from "../../components/admin/inventory/InventoryLogsTable";
import TransactionTable from "../../components/admin/inventory/TransactionTable";
import EditPOModal from "../../components/admin/inventory/EditPOModal";
import CreatePOModal from "../../components/admin/inventory/CreatePOModal";
import ViewPOModal from "../../components/admin/inventory/ViewPOModal";
import ViewMaterialModal from "../../components/admin/inventory/ViewMaterialModal";
import ViewSupplierModal from "../../components/admin/inventory/ViewSupplierModal";
import MaterialTransactionsModal from "../../components/admin/inventory/MaterialTransactionsModal";
import PriceHistoryModal from "../../components/admin/inventory/PriceHistoryModal";

// Newly added Admin Material v1.0 components
import BulkMaterialUploadModal from "../../components/admin/inventory/BulkMaterialUploadModal";
import MaterialThresholdConfigModal from "../../components/admin/inventory/MaterialThresholdConfigModal";
import DailyStockTable from "../../components/admin/inventory/DailyStockTable";
import CreateDailyStockModal from "../../components/admin/inventory/CreateDailyStockModal";
import BulkDailyStockUploadModal from "../../components/admin/inventory/BulkDailyStockUploadModal";
import CreateInwardModal from "../../components/admin/inventory/CreateInwardModal";
import ViewInwardModal from "../../components/admin/inventory/ViewInwardModal";
import CreateOutwardModal from "../../components/admin/inventory/CreateOutwardModal";
import BulkOutwardModal from "../../components/admin/inventory/BulkOutwardModal";
import StockLedgerTable from "../../components/admin/inventory/StockLedgerTable";
import AdminOTPCancellationModal from "../../components/admin/inventory/AdminOTPCancellationModal";
import AdminMaterialReportsModal, { type AdminReportKey } from "../../components/admin/inventory/AdminMaterialReportsModal";

interface Project {
  id: number;
  name: string;
}

type AdminTab =
  | "overview"
  | "inventory"
  | "daily_stock"
  | "pos"
  | "inward"
  | "outward"
  | "ledger"
  | "transfers"
  | "suppliers"
  | "transactions"
  | "logs"
  | "reports";

const InventoryPage = () => {
  const location = useLocation();
  const isMaster =
    location.pathname.includes("/master") ||
    location.pathname === "/admin/inventory";

  const [inventory, setInventory] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [inwards, setInwards] = useState<InwardReceipt[]>([]);
  const [outwards, setOutwards] = useState<OutwardIssue[]>([]);
  const [dailyStocks, setDailyStocks] = useState<DailyStockRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [otpRequests, setOtpRequests] = useState<OTPCancellationRequest[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>(isMaster ? "suppliers" : "overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>(() => materialService.getValuationMethod());
  const [maskPrices, setMaskPrices] = useState(false);

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [isViewSupplierModalOpen, setViewSupplierModalOpen] = useState(false);
  const [selectedViewSupplier, setSelectedViewSupplier] = useState<any>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [supplierApiErrors, setSupplierApiErrors] = useState<Record<string, string>>({});
  const [supplierPage, setSupplierPage] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [materialPage, setMaterialPage] = useState(0);
  const [poPage, setPoPage] = useState(0);
  const [transferPage, setTransferPage] = useState(0);
  const [selectedUpdateTransfer, setSelectedUpdateTransfer] = useState<Transfer | null>(null);
  const [isUpdateTransferModalOpen, setIsUpdateTransferModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const PAGE_SIZE = 10;

  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isMaterialFormOpen, setMaterialFormOpen] = useState(false);
  const [materialApiErrors, setMaterialApiErrors] = useState<Record<string, string>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [isViewMaterialModalOpen, setIsViewMaterialModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);

  // New Modal States for v1.0 Admin Workflows
  const [isBulkMaterialOpen, setIsBulkMaterialOpen] = useState(false);
  const [thresholdMaterial, setThresholdMaterial] = useState<Material | null>(null);
  const [isCreateDailyStockOpen, setIsCreateDailyStockOpen] = useState(false);
  const [isBulkDailyStockOpen, setIsBulkDailyStockOpen] = useState(false);
  const [isCreateInwardOpen, setIsCreateInwardOpen] = useState(false);
  const [inwardTargetPO, setInwardTargetPO] = useState<PurchaseOrder | null>(null);
  const [viewingInward, setViewingInward] = useState<InwardReceipt | null>(null);
  const [isCreateOutwardOpen, setIsCreateOutwardOpen] = useState(false);
  const [isBulkOutwardOpen, setIsBulkOutwardOpen] = useState(false);
  const [isAdminReportsModalOpen, setIsAdminReportsModalOpen] = useState(false);
  const [initialAdminReport, setInitialAdminReport] = useState<AdminReportKey>("overall_stock");
  const [otpCancelConfig, setOtpCancelConfig] = useState<{
    isOpen: boolean;
    entityType: "PO" | "INWARD" | "OUTWARD";
    entityId: number;
    entityRef: string;
    projectId?: number;
    hasLinkedInwards?: boolean;
    existingRequest?: OTPCancellationRequest | null;
  }>({
    isOpen: false,
    entityType: "PO",
    entityId: 0,
    entityRef: "",
  });

  const [purchaseActionConfig, setPurchaseActionConfig] = useState<{
    isOpen: boolean;
    type: "purchase" | "usage";
    material: any | null;
  }>({
    isOpen: false,
    type: "purchase",
    material: null,
  });

  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isEditPOModalOpen, setIsEditPOModalOpen] = useState(false);
  const [isViewPOModalOpen, setIsViewPOModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectMap, setProjectMap] = useState<Record<number, string>>({});
  const [itemToDelete, setItemToDelete] = useState<{
    id: any;
    type: "material" | "supplier" | "po";
  } | null>(null);

  const [logProjectId, setLogProjectId] = useState<number | "all">("all");
  const [logType, setLogType] = useState<string>("all");
  const [inventoryProjectId, setInventoryProjectId] = useState<number | "all">("all");
  const [dailyDateFilter, setDailyDateFilter] = useState<string>("");
  const [isLogsRefreshing, setIsLogsRefreshing] = useState(false);

  const fetchExtendedModules = async (projFilter?: number) => {
    const [inwData, outData, dailyData, ledgData, otpData] = await Promise.all([
      materialService.listInwards(projFilter).catch(() => []),
      materialService.listOutwards(projFilter).catch(() => []),
      materialService.listDailyStocks(projFilter).catch(() => []),
      materialService.getStockLedger(projFilter).catch(() => []),
      materialService.listPendingCancellations().catch(() => []),
    ]);
    setInwards(inwData);
    setOutwards(outData);
    setDailyStocks(dailyData);
    setLedgerEntries(ledgData);
    setOtpRequests(otpData);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invData, supData, transferData, logsData, allMaterials, projectsResponse] = await Promise.all([
        materialService.listMaterials().catch(() => []),
        materialService.getSuppliers().catch(() => []),
        materialService.listTransfers().catch(() => []),
        materialService.getLogs({ project_id: 1 }).catch(() => []),
        masterService.getEntities("materials").catch(() => []),
        projectService.getProjects(100).catch(() => []),
      ]);

      setInventory(invData);
      setMasterMaterials(allMaterials);
      setSuppliers(supData);
      const transferItems = Array.isArray(transferData) ? transferData : (transferData?.data || []);
      setTransfers(transferItems);
      setLogs(Array.isArray(logsData) ? logsData : []);

      const projects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.items || projectsResponse.data || []);
      setProjectList(projects);
      const map: Record<number, string> = {};
      projects.forEach((p: any) => {
        map[p.id] = p.name || p.project_name;
      });
      setProjectMap(map);
      await fetchExtendedModules();
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      toast.error("Failed to sync inventory data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isMaster) {
      if (activeTab === "overview" || activeTab === "inventory") {
        setActiveTab("suppliers");
      }
    }
  }, [isMaster]);

  useEffect(() => {
    const projFilter = inventoryProjectId === "all" ? undefined : Number(inventoryProjectId);
    fetchExtendedModules(projFilter);
    if (inventoryProjectId === "all") {
      setSummary(null);
      return;
    }
    materialService
      .getMaterialSummary(inventoryProjectId)
      .then((sum) => setSummary(sum))
      .catch(() => {});
  }, [inventoryProjectId]);

  useEffect(() => {
    let isMounted = true;
    if (projectList.length === 0) return;

    const extPOs = materialService.getExtendedPOs();

    if (inventoryProjectId !== "all") {
      materialService
        .listPurchaseOrders(inventoryProjectId as number)
        .then((res) => {
          if (!isMounted) return;
          const backendList = Array.isArray(res) ? res : [];
          const merged = [
            ...extPOs.filter((ep) => ep.project_id === inventoryProjectId || ep.po_type === "COMMON"),
            ...backendList.filter((bp) => !extPOs.some((ep) => ep.id === bp.id)),
          ];
          setPos(merged);
        })
        .catch(() => {
          if (isMounted) setPos(extPOs.filter((ep) => ep.project_id === inventoryProjectId || ep.po_type === "COMMON"));
        });
    } else {
      Promise.all(projectList.map((p) => materialService.listPurchaseOrders(p.id).catch(() => [])))
        .then((results) => {
          if (!isMounted) return;
          const allPOs = results.flat().filter((p) => p);
          const merged = [...extPOs, ...allPOs.filter((bp) => !extPOs.some((ep) => ep.id === bp.id))];
          merged.sort((a, b) => (b.id || 0) - (a.id || 0));
          setPos(merged);
        })
        .catch(() => {
          if (isMounted) setPos(extPOs);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [inventoryProjectId, projectList]);

  // Filters & Derived Sets
  const filteredInventory = inventory.filter(
    (i) =>
      (inventoryProjectId === "all" || i.project_id === inventoryProjectId) &&
      ((i.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.material_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.gst || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInventory = useMemo(() => {
    return [...filteredInventory].sort((a, b) => (sortOrder === "latest" ? b.id - a.id : a.id - b.id));
  }, [filteredInventory, sortOrder]);

  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => (sortOrder === "latest" ? b.id - a.id : a.id - b.id));
  }, [filteredSuppliers, sortOrder]);

  const supplierMap = useMemo(() => {
    const map: Record<number, string> = {};
    suppliers.forEach((s: any) => {
      const sId = s.id ?? s.supplier_id;
      if (sId) {
        map[sId] = s.name || s.supplier_name || s.contactPerson || `Supplier #${sId}`;
      }
    });
    return map;
  }, [suppliers]);

  const sortedPOs = useMemo(() => {
    const filtered = pos.filter((p) => {
      const matchesSearch =
        (p.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.po_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject =
        inventoryProjectId === "all" || p.project_id === inventoryProjectId || p.po_type === "COMMON" || !p.project_id;
      return matchesSearch && matchesProject;
    });
    return [...filtered].sort((a, b) => (sortOrder === "latest" ? b.id - a.id : a.id - b.id));
  }, [pos, searchTerm, inventoryProjectId, sortOrder]);

  const sortedTransfers = useMemo(() => {
    const filtered = transfers.filter((t) => {
      const matchesSearch =
        t.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.from_project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.to_project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = inventoryProjectId === "all" || t.to_project?.id === inventoryProjectId;
      return matchesSearch && matchesProject;
    });
    return [...filtered].sort((a, b) => (sortOrder === "latest" ? b.id - a.id : a.id - b.id));
  }, [transfers, searchTerm, inventoryProjectId, sortOrder]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });
  }, [logs, sortOrder]);

  const filteredInwards = useMemo(() => {
    return inwards.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        r.receipt_no.toLowerCase().includes(q) ||
        r.challan_no.toLowerCase().includes(q) ||
        r.items.some((it) => it.material_name.toLowerCase().includes(q))
      );
    });
  }, [inwards, searchTerm]);

  const filteredOutwards = useMemo(() => {
    return outwards.filter((o) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        o.issue_slip_no.toLowerCase().includes(q) ||
        o.issued_to.toLowerCase().includes(q) ||
        o.purpose.toLowerCase().includes(q) ||
        o.items.some((it) => it.material_name.toLowerCase().includes(q))
      );
    });
  }, [outwards, searchTerm]);

  const filteredDailyStocks = useMemo(() => {
    return dailyStocks.filter((d) => {
      const q = searchTerm.toLowerCase();
      const matchesDate = !dailyDateFilter || d.date === dailyDateFilter;
      const matchesSearch = !q || d.material_name.toLowerCase().includes(q);
      return matchesDate && matchesSearch;
    });
  }, [dailyStocks, dailyDateFilter, searchTerm]);

  const pendingPOApprovalsCount = useMemo(
    () => pos.filter((p) => p.status === "DRAFT" || p.status === "SUBMITTED" || p.status === "PENDING").length,
    [pos]
  );
  const pendingOtpCount = useMemo(() => otpRequests.filter((r) => r.status === "PENDING_OTP").length, [otpRequests]);

  const refreshLogs = async () => {
    setIsLogsRefreshing(true);
    try {
      const params: any = {};
      if (logType !== "all") params.type = logType;
      let allLogs: any[] = [];
      if (logProjectId !== "all") {
        params.project_id = logProjectId;
        const logsData = await materialService.getLogs(params);
        allLogs = Array.isArray(logsData) ? logsData : [];
      } else {
        const results = await Promise.all(projectList.map((p) => materialService.getLogs({ ...params, project_id: p.id }).catch(() => [])));
        allLogs = results.flat().filter((l) => l);
      }
      setLogs(allLogs);
      setLogsPage(0);
    } catch {
      toast.error("Failed to filter logs");
    } finally {
      setIsLogsRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") refreshLogs();
  }, [logProjectId, logType, activeTab]);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === "transactions") {
      if (inventoryProjectId !== "all") {
        materialService
          .getProjectTransactions(inventoryProjectId as number)
          .then((res) => {
            if (isMounted) setTransactions(Array.isArray(res) ? res : []);
          })
          .catch(() => {
            if (isMounted) setTransactions([]);
          });
      } else {
        Promise.all(projectList.map((p) => materialService.getProjectTransactions(p.id).catch(() => [])))
          .then((results) => {
            if (!isMounted) return;
            const allTxns = results.flat().filter((t) => t);
            allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setTransactions(allTxns);
          })
          .catch(() => {
            if (isMounted) setTransactions([]);
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, inventoryProjectId, projectList]);

  // Handlers
  const handleSupplierSubmit = async (data: any) => {
    setSupplierApiErrors({});
    try {
      const payload = {
        supplier_name: data.name,
        contact_person: data.contactPerson,
        phone_email: data.phone || data.email ? `${data.phone || ""} ${data.email || ""}`.trim() : "",
        gst_number: data.gst,
        address: data.address,
      };
      if (selectedSupplier) {
        const updated = await materialService.updateSupplier(selectedSupplier.id, payload);
        setSuppliers((prev) => prev.map((s) => (s.id === selectedSupplier.id ? { ...s, ...updated } : s)));
        toast.success("Supplier updated successfully!");
      } else {
        const newSupplier = await materialService.createSupplier(payload);
        setSuppliers((prev) => [...prev, newSupplier]);
        toast.success("Supplier added successfully!");
      }
      setSupplierModalOpen(false);
      setSelectedSupplier(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {};
        detail.forEach((err: any) => {
          const field = err?.loc?.[err.loc.length - 1];
          if (field === "gst_number") fieldErrors.gst = err.msg || "Invalid GST number format";
          else if (field) fieldErrors[field] = err.msg;
        });
        if (Object.keys(fieldErrors).length > 0) {
          setSupplierApiErrors(fieldErrors);
          return;
        }
      }
      toast.error(typeof detail === "string" ? detail : "Failed to save supplier");
    }
  };

  const handleCreatePOSubmit = async (data: any) => {
    try {
      const newPO = await materialService.createExtendedPurchaseOrder(data);
      setPos((prev) => [newPO, ...prev]);
      toast.success("Purchase Order created successfully!");
    } catch (error) {
      console.error("Failed to create PO:", error);
      toast.error("Failed to create Purchase Order.");
    }
  };

  const handleApprovePO = async (po: PurchaseOrder) => {
    try {
      await materialService.approvePurchaseOrder(po.id, "Admin");
      setPos((prev) => prev.map((p) => (p.id === po.id ? { ...p, status: "APPROVED", approved_by: "Admin" } : p)));
      toast.success(`PO ${po.po_number || `#${po.id}`} approved!`);
    } catch {
      toast.error("Failed to approve Purchase Order.");
    }
  };

  const handleCreateInward = async (payload: CreateInwardPayload) => {
    const receipt = await materialService.createInwardReceipt(payload, "Admin");
    setInwards((prev) => [receipt, ...prev]);
    toast.success(`Inward Receipt ${receipt.receipt_no} posted & stock updated!`);
    await fetchData();
  };

  const handleCreateOutward = async (payload: CreateOutwardPayload) => {
    const issue = await materialService.createOutwardIssue(payload, "Admin");
    setOutwards((prev) => [issue, ...prev]);
    toast.success(`Outward Issue ${issue.issue_slip_no} posted & stock updated!`);
    await fetchData();
  };

  const handleBulkMaterialImport = async (rows: BulkMaterialRow[], fileName: string, projectId: number, supplierId: number) => {
    const res = await materialService.bulkUploadMaterials(rows, fileName, projectId, supplierId);
    toast.success(`Bulk import complete (${res.logId}): ${res.created} added, ${res.updated} updated.`);
    await fetchData();
  };

  const handleConfigureThreshold = async (materialId: number, newThreshold: number) => {
    const updated = await materialService.configureThreshold(materialId, newThreshold);
    setInventory((prev) => prev.map((m) => (m.id === materialId ? { ...m, ...updated, minimum_stock_level: newThreshold } : m)));
    toast.success(`Minimum stock threshold updated to ${newThreshold}`);
  };

  const handleCreateOrUpdateMaterial = async (data: any) => {
    try {
      if (selectedMaterial) {
        const payload = {
          material_master_id: Number(data.material_master_id),
          supplier_id: Number(data.supplier_id || selectedMaterial.supplier_id),
          purchase_rate: Number(data.purchase_rate),
          minimum_stock_level: Number(data.minimum_stock_level),
          rate_type: data.rate_type,
        };
        const updatedMaterial = await materialService.updateMaterial(selectedMaterial.id, payload);
        setInventory((prev) => prev.map((m) => (m.id === selectedMaterial.id ? { ...m, ...updatedMaterial } : m)));
        toast.success("Material updated successfully!");
      } else {
        const supplier = suppliers.find((s) => s.name === data.supplier_name || s.contactPerson === data.supplier_name);
        const payload = {
          project_id: Number(data.project_id || 1),
          material_master_id: Number(data.material_master_id),
          supplier_id: supplier?.id || 0,
          purchase_rate: Number(data.purchase_rate),
          rate_type: data.rate_type || "FIXED",
          quantity_purchased: Number(data.quantity_purchased),
          payment_given: Number(data.payment_given || 0),
          minimum_stock_level: Number(data.minimum_stock_level || 200),
        };
        const createdMaterial = await materialService.createMaterial(payload as any);
        const newMaterial: Material = {
          ...createdMaterial,
          supplier_name: data.supplier_name,
          alert_type: (createdMaterial as any).alert_type || "IN_STOCK",
        };
        setInventory((prev) => [...prev, newMaterial]);
        toast.success("Material created successfully!");
      }
      setMaterialFormOpen(false);
      setMaterialApiErrors({});
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {};
        detail.forEach((err: any) => {
          const field = err?.loc?.[err.loc.length - 1];
          if (field) fieldErrors[field] = err.msg;
        });
        setMaterialApiErrors(fieldErrors);
      } else if (typeof detail === "string") {
        if (detail.toLowerCase().includes("already exists")) setMaterialApiErrors({ material_name: detail });
        else toast.error(detail);
      } else {
        toast.error("Failed to save material");
      }
    }
  };

  const handlePurchaseAction = async (data: any) => {
    try {
      const material = purchaseActionConfig.material;
      if (data.actionType === "usage") {
        if (!data.quantity || Number(data.quantity) <= 0) {
          toast.error("Please enter a valid quantity greater than 0");
          return;
        }
        const payload: any = {
          quantity: Number(data.quantity),
          project_id: Number(data.project_id || material.project_id),
          issue_type: data.issue_type || "SITE",
        };
        if (data.task_id && Number(data.task_id) > 0) payload.task_id = Number(data.task_id);
        if (data.boq_item_id && Number(data.boq_item_id) > 0) payload.boq_item_id = Number(data.boq_item_id);
        const updatedMaterial = await materialService.recordUsage(material.id, payload);
        setInventory((prev) => prev.map((m) => (m.id === material.id ? { ...m, ...updatedMaterial } : m)));
        toast.success("Usage logged successfully!");
      } else {
        const payload: any = {
          quantity: Number(data.quantity),
          rate: Number(data.rate) || material.purchase_rate || 0,
          amount_paid: Number(data.amount_paid) || 0,
          project_id: Number(data.project_id || material.project_id),
          issue_type: data.issue_type || "PURCHASE",
        };
        if (data.boq_item_id && Number(data.boq_item_id) > 0) payload.boq_item_id = Number(data.boq_item_id);
        const updatedMaterial = await materialService.recordPurchase(material.id, payload);
        setInventory((prev) => prev.map((m) => (m.id === material.id ? { ...m, ...updatedMaterial } : m)));
        toast.success("Purchase added successfully!");
      }

      setPurchaseActionConfig({ isOpen: false, type: "purchase", material: null });
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.response?.data?.message;
      toast.error(typeof detail === "string" ? detail : "Failed to log action");
    }
  };

  const handleTransferSubmit = async (data: any) => {
    try {
      const materialId = Number(data.materialId || data.material_id);
      const fromProjectId = Number(data.fromProjectId || data.from_project_id);
      const toProjectId = Number(data.toProjectId || data.to_project_id);
      const quantity = Number(data.quantity);
      const material = inventory.find((i) => i.id === materialId);
      if (!material) {
        toast.error("Material not found in inventory");
        return;
      }
      setInventory((prev) =>
        prev.map((m) => (m.id === materialId ? { ...m, remaining_stock: m.remaining_stock - quantity } : m))
      );
      const newTransfer = await materialService.createTransfer({
        material_id: material.id,
        from_project_id: fromProjectId,
        to_project_id: toProjectId,
        quantity,
      });
      setTransfers((prev) => [newTransfer, ...prev]);
      setTransferModalOpen(false);
      toast.success("Material transfer recorded!");
    } catch {
      toast.error("Failed to transfer material");
    }
  };

  const handleDeleteClick = (id: any, type: "material" | "supplier" | "po") => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "material") {
        await materialService.deleteMaterial(itemToDelete.id);
        setInventory((prev) => prev.filter((m) => m.id !== itemToDelete.id));
        toast.success("Material deleted successfully!");
      } else if (itemToDelete.type === "po") {
        await materialService.deletePurchaseOrder(itemToDelete.id);
        setPos((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        toast.success("Purchase Order deleted successfully!");
      } else {
        await materialService.deleteSupplier(itemToDelete.id);
        setSuppliers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
        toast.success("Supplier deleted successfully!");
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: any }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "inventory", label: "Material Master", icon: FileText },
    { id: "daily_stock", label: "Daily Stock", icon: CalendarDays },
    { id: "pos", label: "Purchase Orders", icon: ShoppingCart },
    { id: "inward", label: "Inward", icon: PackagePlus },
    { id: "outward", label: "Outward", icon: ArrowUpRight },
    { id: "ledger", label: "Stock Ledger", icon: BookOpen },
    { id: "transfers", label: "Transfers", icon: Truck },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "reports", label: "Reports (9)", icon: BarChart3 },
    { id: "logs", label: "Audit Logs", icon: History },
  ];

  return (
    <>
      <Navbar
        title="Material, PO & Inventory Control"
        breadcrumb={["Admin", "Materials", isMaster ? "Master Data" : "Inventory Registry"]}
      />

      <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen pb-24 font-inter">
        {/* Header & Top Bar Quick Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isMaster ? "Material & Supplier Control" : "Admin Material & Stock Control"}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Centralized Material Master, POs, Inward/Outward Ledger, Daily Stock & OTP Cancellation Approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Valuation Selector & Price Masking */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Valuation:</span>
              <select
                value={valuationMethod}
                onChange={(e) => {
                  const m = e.target.value as ValuationMethod;
                  setValuationMethod(m);
                  materialService.setValuationMethod(m);
                }}
                className="text-xs font-black text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="WAC">Weighted Avg (WAC)</option>
                <option value="FIFO">FIFO</option>
                <option value="LPR">Last Purchase (LPR)</option>
              </select>
              <button
                type="button"
                onClick={() => setMaskPrices((p) => !p)}
                className="p-1 text-slate-400 hover:text-primary rounded"
                title={maskPrices ? "Unmask Prices" : "Mask Financial Prices"}
              >
                {maskPrices ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Pending Approvals Pill */}
            {(pendingPOApprovalsCount > 0 || pendingOtpCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  if (pendingOtpCount > 0) {
                    const req = otpRequests.find((r) => r.status === "PENDING_OTP");
                    if (req) {
                      setOtpCancelConfig({
                        isOpen: true,
                        entityType: req.entity_type,
                        entityId: req.entity_id,
                        entityRef: req.entity_ref,
                        existingRequest: req,
                      });
                    }
                  } else {
                    setActiveTab("pos");
                  }
                }}
                className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>{pendingPOApprovalsCount} POs • {pendingOtpCount} OTP Pending</span>
              </button>
            )}

            {/* Quick Action Buttons */}
            <button
              onClick={() => {
                setSelectedMaterial(null);
                setMaterialFormOpen(true);
              }}
              className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-blue-600 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add Material
            </button>
            <button
              onClick={() => setIsBulkMaterialOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-4 h-4 text-primary" /> Bulk Upload
            </button>
            <button
              onClick={() => setIsCreatePOModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" /> + PO
            </button>
            <button
              onClick={() => {
                setInwardTargetPO(null);
                setIsCreateInwardOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <PackagePlus className="w-4 h-4" /> + Inward
            </button>
            <button
              onClick={() => setIsCreateOutwardOpen(true)}
              className="px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 hover:bg-amber-700 flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" /> + Outward
            </button>
            <button
              onClick={() => {
                setInitialAdminReport("overall_stock");
                setIsAdminReportsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" /> Export Reports
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-sm mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "reports") {
                  setIsAdminReportsModalOpen(true);
                  return;
                }
                setActiveTab(tab.id);
                setSupplierPage(0);
                setLogsPage(0);
                setMaterialPage(0);
                setPoPage(0);
                setTransferPage(0);
                setTransactionsPage(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Alert Banner & Stats */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 mb-6">
            {filteredInventory.filter((m) => Number(m.remaining_stock) <= Number(m.minimum_stock_level)).length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="text-rose-500 font-bold text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900 text-sm">Minimum Stock Threshold Alerts</h3>
                  <p className="text-rose-700 text-xs mt-0.5 mb-2 font-medium">
                    Items below or equal to configured minimum threshold across sites (auto-clears upon inward replenishment):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filteredInventory
                      .filter((m) => Number(m.remaining_stock) <= Number(m.minimum_stock_level))
                      .map((lowItem) => (
                        <button
                          key={lowItem.id}
                          onClick={() => setThresholdMaterial(lowItem)}
                          className="bg-white border border-rose-200 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-rose-100 transition-colors"
                        >
                          {lowItem.material_name}{" "}
                          <span className="text-rose-500 font-semibold ml-1">
                            ({lowItem.remaining_stock}/{lowItem.minimum_stock_level} @ {projectMap[lowItem.project_id] || "Site"})
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {(() => {
                const localProjectInventory = inventory.filter((i) => inventoryProjectId === "all" || i.project_id === inventoryProjectId);
                const localStockValuation = localProjectInventory.reduce(
                  (sum, m) => sum + computeMaterialValuation(m, inwards, valuationMethod).totalValue,
                  0
                );
                const localPendingPayments = localProjectInventory.reduce((sum, m) => sum + (Number((m as any).payment_pending) || 0), 0);

                return (
                  <>
                    <StatCard
                      title={`Stock Valuation (${valuationMethod})`}
                      value={formatValuationCurrency(summary?.total_stock_value || localStockValuation, maskPrices)}
                      sub={inventoryProjectId === "all" ? "Company-wide Consolidated" : projectMap[inventoryProjectId as number] || "Site Valuation"}
                      accent="text-emerald-600"
                    />
                    <StatCard
                      title="Active Catalog Items"
                      value={(summary?.total_materials || localProjectInventory.length).toLocaleString()}
                      sub="Unique site records"
                      accent="text-primary"
                    />
                    <StatCard
                      title="Pending Supplier Pay"
                      value={formatValuationCurrency(summary?.total_pending_payments || localPendingPayments, maskPrices)}
                      sub="Payables outstanding"
                      accent="text-rose-600"
                    />
                    <StatCard
                      title="PO / Inward / Outward"
                      value={`${pos.length} / ${inwards.length} / ${outwards.length}`}
                      sub="Tracked audit transactions"
                      accent="text-indigo-600"
                    />
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Main Work Area Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible min-h-[500px]">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
                <div className="relative flex-1 max-w-md w-full">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab.replace(/_/g, " ")}...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setMaterialPage(0);
                      setSupplierPage(0);
                      setLogsPage(0);
                      setPoPage(0);
                      setTransferPage(0);
                    }}
                    className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <SortDropdown value={sortOrder} onChange={setSortOrder} />

                <select
                  value={inventoryProjectId}
                  onChange={(e) => {
                    setInventoryProjectId(e.target.value === "all" ? "all" : Number(e.target.value));
                    setMaterialPage(0);
                    setTransactionsPage(0);
                  }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">All Projects (Company-Wide)</option>
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {activeTab === "daily_stock" && (
                  <input
                    type="date"
                    value={dailyDateFilter}
                    onChange={(e) => setDailyDateFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                )}

                {activeTab === "logs" && (
                  <div className="flex items-center gap-2">
                    <select
                      value={logProjectId}
                      onChange={(e) => setLogProjectId(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="all">All Projects</option>
                      {projectList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="all">All Action Types</option>
                      <option value="PURCHASE">Purchase</option>
                      <option value="USAGE">Usage</option>
                      <option value="TRANSFER_IN">Transfer In</option>
                      <option value="TRANSFER_OUT">Transfer Out</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Contextual Tab Actions */}
              <div className="flex items-center gap-2">
                {activeTab === "daily_stock" && (
                  <>
                    <button
                      onClick={() => setIsBulkDailyStockOpen(true)}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" /> Bulk Daily Upload
                    </button>
                    <button
                      onClick={() => setIsCreateDailyStockOpen(true)}
                      className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Manual Daily Entry
                    </button>
                  </>
                )}
                {activeTab === "outward" && (
                  <button
                    onClick={() => setIsBulkOutwardOpen(true)}
                    className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" /> Bulk Outward Issue
                  </button>
                )}
                {activeTab === "suppliers" && (
                  <button
                    onClick={() => {
                      setSelectedSupplier(null);
                      setSupplierModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600"
                  >
                    + Add Supplier
                  </button>
                )}
                {activeTab === "transfers" && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600"
                  >
                    + Create Transfer
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Synchronizing inventory & ledger data...</p>
              </div>
            ) : (
              <>
                {(activeTab === "inventory" || activeTab === "overview") && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedInventory.length / PAGE_SIZE));
                  const paged = sortedInventory.slice(materialPage * PAGE_SIZE, (materialPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <InventoryTable
                        materials={paged}
                        projects={projectMap}
                        inwards={inwards}
                        valuationMethod={valuationMethod}
                        maskPrices={maskPrices}
                        onView={(m) => {
                          setSelectedMaterial(m);
                          setIsViewMaterialModalOpen(true);
                        }}
                        onConfigureThreshold={(m) => setThresholdMaterial(m)}
                        onTransactions={(m) => {
                          setSelectedMaterial(m);
                          setIsTransactionsModalOpen(true);
                        }}
                        onPriceHistory={(m) => {
                          setSelectedMaterial(m);
                          setIsPriceHistoryModalOpen(true);
                        }}
                        onEdit={(m) => {
                          setSelectedMaterial(m);
                          setMaterialFormOpen(true);
                        }}
                        onPurchase={(m) => setPurchaseActionConfig({ isOpen: true, type: "purchase", material: m })}
                        onUsage={(m) => setPurchaseActionConfig({ isOpen: true, type: "usage", material: m })}
                        onDelete={(id) => handleDeleteClick(id, "material")}
                      />
                      {sortedInventory.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Showing {materialPage * PAGE_SIZE + 1}–{Math.min((materialPage + 1) * PAGE_SIZE, sortedInventory.length)} of {sortedInventory.length} Materials
                          </p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setMaterialPage((p) => Math.max(0, p - 1))} disabled={materialPage === 0} className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40">
                              Prev
                            </button>
                            <span className="text-xs font-bold px-2">{materialPage + 1} / {totalPages}</span>
                            <button onClick={() => setMaterialPage((p) => Math.min(totalPages - 1, p + 1))} disabled={materialPage >= totalPages - 1} className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40">
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {activeTab === "daily_stock" && (
                  <DailyStockTable records={filteredDailyStocks} projectMap={projectMap} maskPrices={maskPrices} />
                )}

                {activeTab === "pos" && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedPOs.length / PAGE_SIZE));
                  const paged = sortedPOs.slice(poPage * PAGE_SIZE, (poPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <PurchaseOrderTable
                        pos={paged}
                        projectMap={projectMap}
                        supplierMap={supplierMap}
                        onView={(po) => {
                          setSelectedPO(po);
                          setIsViewPOModalOpen(true);
                        }}
                        onApprove={handleApprovePO}
                        onCreateInward={(po) => {
                          setInwardTargetPO(po);
                          setIsCreateInwardOpen(true);
                        }}
                        onCancelWithOTP={(po) => {
                          const hasInward = inwards.some((i) => i.po_id === po.id && i.status === "POSTED");
                          setOtpCancelConfig({
                            isOpen: true,
                            entityType: "PO",
                            entityId: po.id,
                            entityRef: po.po_number || `PO-${po.id}`,
                            projectId: po.project_id || undefined,
                            hasLinkedInwards: hasInward,
                          });
                        }}
                        onEdit={(po) => {
                          setSelectedPO(po);
                          setIsEditPOModalOpen(true);
                        }}
                        onDelete={(id) => handleDeleteClick(id, "po")}
                      />
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                          <span className="text-xs font-bold text-slate-500">Page {poPage + 1} of {totalPages}</span>
                          <div className="flex gap-2">
                            <button onClick={() => setPoPage((p) => Math.max(0, p - 1))} disabled={poPage === 0} className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40">Prev</button>
                            <button onClick={() => setPoPage((p) => Math.min(totalPages - 1, p + 1))} disabled={poPage >= totalPages - 1} className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40">Next</button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {activeTab === "inward" && (
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="px-5 py-4 font-bold text-slate-800">Receipt #</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Challan / Inv</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Receiving Site</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Supplier</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Items Received</th>
                          <th className="px-5 py-4 text-right font-bold text-slate-800">Total Amount</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Status</th>
                          <th className="px-5 py-4 text-right font-bold text-slate-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredInwards.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-mono text-xs font-black text-slate-900">{rec.receipt_no}</td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{rec.challan_no} <span className="text-slate-400 font-normal">({rec.delivery_date})</span></td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{projectMap[rec.receiving_project_id] || `Site #${rec.receiving_project_id}`}</td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{supplierMap[rec.supplier_id] || `Supplier #${rec.supplier_id}`}</td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                              {rec.items.map((x) => `${x.material_name} (${x.received_qty})`).join(", ")}
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-slate-900">
                              {formatValuationCurrency(rec.total_amount, maskPrices)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${rec.status === "CANCELLED" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => setViewingInward(rec)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="View Receipt">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {rec.status === "POSTED" && (
                                  <button
                                    onClick={() =>
                                      setOtpCancelConfig({
                                        isOpen: true,
                                        entityType: "INWARD",
                                        entityId: rec.id,
                                        entityRef: rec.receipt_no,
                                        projectId: rec.receiving_project_id,
                                      })
                                    }
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                    title="Cancel Inward (Admin OTP)"
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredInwards.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                              No inward receipts recorded yet. Click "+ Inward" or receive against a PO.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "outward" && (
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="px-5 py-4 font-bold text-slate-800">Slip #</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Date</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Site</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Issued To & Purpose</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Materials Issued</th>
                          <th className="px-5 py-4 text-right font-bold text-slate-800">Value</th>
                          <th className="px-5 py-4 font-bold text-slate-800">Status</th>
                          <th className="px-5 py-4 text-right font-bold text-slate-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredOutwards.map((out) => (
                          <tr key={out.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-mono text-xs font-black text-slate-900">{out.issue_slip_no}</td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{out.issue_date}</td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{projectMap[out.project_id] || `Site #${out.project_id}`}</td>
                            <td className="px-5 py-3.5">
                              <p className="text-xs font-bold text-slate-900">{out.issued_to}</p>
                              <p className="text-[11px] text-slate-500">{out.purpose}</p>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                              {out.items.map((x) => `${x.material_name} (${x.issue_qty})`).join(", ")}
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-slate-900">
                              {formatValuationCurrency(out.total_value, maskPrices)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${out.status === "CANCELLED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>
                                {out.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {out.status === "POSTED" && (
                                <button
                                  onClick={() =>
                                    setOtpCancelConfig({
                                      isOpen: true,
                                      entityType: "OUTWARD",
                                      entityId: out.id,
                                      entityRef: out.issue_slip_no,
                                      projectId: out.project_id,
                                    })
                                  }
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                  title="Reverse Outward Issue (Admin OTP)"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredOutwards.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                              No outward material issues recorded yet. Click "+ Outward" to issue stock.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "ledger" && (
                  <StockLedgerTable
                    materials={filteredInventory}
                    entries={ledgerEntries}
                    projectMap={projectMap}
                    inwards={inwards}
                    valuationMethod={valuationMethod}
                    maskPrices={maskPrices}
                  />
                )}

                {activeTab === "suppliers" && (() => {
                  const paged = sortedSuppliers.slice(supplierPage * PAGE_SIZE, (supplierPage + 1) * PAGE_SIZE);
                  return (
                    <SupplierTable
                      suppliers={paged}
                      onEdit={(s) => {
                        setSelectedSupplier(s);
                        setSupplierModalOpen(true);
                      }}
                      onDelete={(id) => handleDeleteClick(id, "supplier")}
                      onView={async (id) => {
                        const toastId = toast.loading("Loading supplier details...");
                        try {
                          const data = await materialService.getSupplier(id);
                          setSelectedViewSupplier(data);
                          setViewSupplierModalOpen(true);
                          toast.dismiss(toastId);
                        } catch {
                          toast.error("Failed to load supplier details", { id: toastId });
                        }
                      }}
                    />
                  );
                })()}

                {activeTab === "transfers" && (() => {
                  const paged = sortedTransfers.slice(transferPage * PAGE_SIZE, (transferPage + 1) * PAGE_SIZE);
                  return (
                    <TransferTable
                      transfers={paged}
                      onUpdateStatus={(t) => {
                        setSelectedUpdateTransfer(t);
                        setIsUpdateTransferModalOpen(true);
                      }}
                      onView={(t) => setSelectedTransfer(t)}
                    />
                  );
                })()}

                {activeTab === "transactions" && (() => {
                  const paged = transactions.slice(transactionsPage * PAGE_SIZE, (transactionsPage + 1) * PAGE_SIZE);
                  return <TransactionTable transactions={paged} projectMap={projectMap} />;
                })()}

                {activeTab === "logs" && (() => {
                  const paged = sortedLogs.slice(logsPage * PAGE_SIZE, (logsPage + 1) * PAGE_SIZE);
                  return isLogsRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtering audit logs...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {otpRequests.length > 0 && (
                        <div className="px-5 pt-4">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">OTP Cancellation Approval Trail</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otpRequests.map((req) => (
                              <div key={req.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-900">{req.entity_type} {req.entity_ref}</p>
                                  <p className="text-slate-500">Reason: {req.reason}</p>
                                  {req.reversal_id && <p className="text-[11px] text-emerald-700 font-mono">Reversal ID: {req.reversal_id}</p>}
                                </div>
                                {req.status === "PENDING_OTP" ? (
                                  <button
                                    onClick={() =>
                                      setOtpCancelConfig({
                                        isOpen: true,
                                        entityType: req.entity_type,
                                        entityId: req.entity_id,
                                        entityRef: req.entity_ref,
                                        existingRequest: req,
                                      })
                                    }
                                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
                                  >
                                    Verify OTP
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                    <CheckCircle2 className="w-4 h-4" /> Approved
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <InventoryLogsTable logs={paged} projectMap={projectMap} />
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Legacy & Upgraded Modals */}
      <ViewTransferModal isOpen={selectedTransfer !== null} onClose={() => setSelectedTransfer(null)} transfer={selectedTransfer} />
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setSelectedSupplier(null);
          setSupplierApiErrors({});
        }}
        onSubmit={handleSupplierSubmit}
        initialData={selectedSupplier}
        apiErrors={supplierApiErrors}
      />
      <AddMaterialModal
        isOpen={isMaterialFormOpen}
        onClose={() => {
          setMaterialFormOpen(false);
          setMaterialApiErrors({});
        }}
        onSubmit={handleCreateOrUpdateMaterial}
        initialData={selectedMaterial}
        suppliers={suppliers}
        apiErrors={materialApiErrors}
        projects={projectList}
        masterMaterials={masterMaterials}
      />
      <MaterialCostReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} inventory={inventory} projects={projectMap} />
      <PurchaseActionModal
        isOpen={purchaseActionConfig.isOpen}
        onClose={() => setPurchaseActionConfig({ isOpen: false, type: "purchase", material: null })}
        onSubmit={handlePurchaseAction}
        actionType={purchaseActionConfig.type}
        material={purchaseActionConfig.material}
        projects={projectList}
        suppliers={suppliers}
        allMaterials={masterMaterials}
      />
      <ViewMaterialModal isOpen={isViewMaterialModalOpen} onClose={() => setIsViewMaterialModalOpen(false)} material={selectedMaterial} projectsList={projectList} />
      <MaterialTransactionsModal isOpen={isTransactionsModalOpen} onClose={() => setIsTransactionsModalOpen(false)} material={selectedMaterial} projectsList={projectList} />
      <PriceHistoryModal isOpen={isPriceHistoryModalOpen} onClose={() => setIsPriceHistoryModalOpen(false)} material={selectedMaterial} />
      <TransferMaterialModal
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        inventory={inventory.map((i) => ({ id: i.id, name: i.material_name, stock: i.remaining_stock, unit: i.unit, project_id: i.project_id }))}
        projects={projectList}
      />
      <EditPOModal
        isOpen={isEditPOModalOpen}
        po={selectedPO}
        onClose={() => {
          setIsEditPOModalOpen(false);
          setSelectedPO(null);
        }}
        onSubmit={async (id, data) => {
          const updated = await materialService.updatePurchaseOrder(id, data);
          setPos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
          toast.success("Purchase Order updated successfully!");
        }}
        suppliers={suppliers}
        projects={projectList}
        inventory={inventory}
      />
      <ViewPOModal
        isOpen={isViewPOModalOpen}
        po={selectedPO}
        projectMap={projectMap}
        supplierMap={supplierMap}
        inwards={inwards}
        onApprove={handleApprovePO}
        onCreateInward={(po) => {
          setInwardTargetPO(po);
          setIsCreateInwardOpen(true);
        }}
        onClose={() => {
          setIsViewPOModalOpen(false);
          setSelectedPO(null);
        }}
      />
      <UpdateTransferStatusModal
        isOpen={isUpdateTransferModalOpen}
        onClose={() => {
          setIsUpdateTransferModalOpen(false);
          setSelectedUpdateTransfer(null);
        }}
        transfer={selectedUpdateTransfer}
        onSubmit={async (id, status) => {
          try {
            await materialService.updateTransferStatus(id, status);
            setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            toast.success(`Transfer status updated to ${status}!`);
          } catch (err: any) {
            toast.error(err?.response?.data?.detail || err?.message || "Failed to update transfer status");
          }
        }}
      />
      <CreatePOModal
        isOpen={isCreatePOModalOpen}
        onClose={() => setIsCreatePOModalOpen(false)}
        onSubmit={handleCreatePOSubmit}
        suppliers={suppliers}
        projects={projectList}
        inventory={inventory}
      />
      <ViewSupplierModal isOpen={isViewSupplierModalOpen} onClose={() => { setViewSupplierModalOpen(false); setSelectedViewSupplier(null); }} supplier={selectedViewSupplier} />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type === "material" ? "Material" : itemToDelete?.type === "po" ? "Purchase Order" : "Supplier"}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type === "po" ? "purchase order" : itemToDelete?.type}?`}
        confirmText="Delete"
        type="danger"
      />

      {/* New v1.0 Modals */}
      <BulkMaterialUploadModal
        isOpen={isBulkMaterialOpen}
        onClose={() => setIsBulkMaterialOpen(false)}
        existingMaterials={inventory}
        projects={projectList}
        suppliers={suppliers}
        onImport={handleBulkMaterialImport}
      />
      <MaterialThresholdConfigModal
        isOpen={thresholdMaterial !== null}
        onClose={() => setThresholdMaterial(null)}
        material={thresholdMaterial}
        projectName={thresholdMaterial ? projectMap[thresholdMaterial.project_id] : undefined}
        onSave={handleConfigureThreshold}
      />
      <CreateDailyStockModal
        isOpen={isCreateDailyStockOpen}
        onClose={() => setIsCreateDailyStockOpen(false)}
        projects={projectList}
        inventory={inventory}
        existingRecords={dailyStocks}
        inwards={inwards}
        outwards={outwards}
        onSubmit={async (rec) => {
          const saved = await materialService.createDailyStock(rec);
          setDailyStocks((prev) => [saved, ...prev]);
          toast.success("Daily stock record saved!");
        }}
      />
      <BulkDailyStockUploadModal
        isOpen={isBulkDailyStockOpen}
        onClose={() => setIsBulkDailyStockOpen(false)}
        projects={projectList}
        inventory={inventory}
        existingRecords={dailyStocks}
        onImport={async (rows) => {
          const cnt = await materialService.bulkUploadDailyStock(rows);
          toast.success(`Imported ${cnt} daily stock records!`);
          await fetchExtendedModules();
        }}
      />
      <CreateInwardModal
        isOpen={isCreateInwardOpen}
        onClose={() => {
          setIsCreateInwardOpen(false);
          setInwardTargetPO(null);
        }}
        initialPO={inwardTargetPO}
        pos={pos}
        suppliers={suppliers}
        projects={projectList}
        inventory={inventory}
        onSubmit={handleCreateInward}
      />
      <ViewInwardModal
        isOpen={viewingInward !== null}
        onClose={() => setViewingInward(null)}
        receipt={viewingInward}
        projectMap={projectMap}
        supplierMap={supplierMap}
        onCancelWithOTP={(rec) =>
          setOtpCancelConfig({
            isOpen: true,
            entityType: "INWARD",
            entityId: rec.id,
            entityRef: rec.receipt_no,
            projectId: rec.receiving_project_id,
          })
        }
      />
      <CreateOutwardModal
        isOpen={isCreateOutwardOpen}
        onClose={() => setIsCreateOutwardOpen(false)}
        projects={projectList}
        inventory={inventory}
        onSubmit={handleCreateOutward}
      />
      <BulkOutwardModal
        isOpen={isBulkOutwardOpen}
        onClose={() => setIsBulkOutwardOpen(false)}
        projects={projectList}
        inventory={inventory}
        onSubmit={handleCreateOutward}
      />
      <AdminOTPCancellationModal
        isOpen={otpCancelConfig.isOpen}
        onClose={() => setOtpCancelConfig((prev) => ({ ...prev, isOpen: false, existingRequest: null }))}
        entityType={otpCancelConfig.entityType}
        entityId={otpCancelConfig.entityId}
        entityRef={otpCancelConfig.entityRef}
        projectId={otpCancelConfig.projectId}
        hasLinkedInwards={otpCancelConfig.hasLinkedInwards}
        existingRequest={otpCancelConfig.existingRequest}
        onRequestOTP={async (type, eid, ref, reason, pid) => {
          const res = await materialService.requestOTPCancellation(type, eid, ref, reason, "Admin", pid);
          setOtpRequests((prev) => [res.request, ...prev]);
          toast.success(`OTP ${res.generatedOtp} generated & sent to Admin.`);
          return res;
        }}
        onVerifyOTP={async (reqId, otp, reason, expectedOtp) => {
          await materialService.verifyOTPCancellation(reqId, otp, reason, expectedOtp, "Admin");
          toast.success("Cancellation verified & stock reversal executed!");
          await fetchData();
        }}
      />
      <AdminMaterialReportsModal
        isOpen={isAdminReportsModalOpen}
        onClose={() => setIsAdminReportsModalOpen(false)}
        initialReport={initialAdminReport}
        materials={inventory}
        pos={pos}
        inwards={inwards}
        outwards={outwards}
        dailyStocks={dailyStocks}
        ledger={ledgerEntries}
        projectMap={projectMap}
        supplierMap={supplierMap}
        valuationMethod={valuationMethod}
        maskPrices={maskPrices}
      />
    </>
  );
};

export default InventoryPage;
