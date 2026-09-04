import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Briefcase,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Download,
  Send,
  X,
  Eye,
  Save,
  MessageCircle,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import { quotationService } from "../../services/quotationService";
import { userService } from "../../services/userService";
import { financeService } from "../../services/financeService";
import type { LabourItem, MaterialItem, ExtraChargeItem } from "../../types/quotation";
import type { Project } from "../../types/project";
import toast from "react-hot-toast";
import SelectContractorModal from "../../components/forms/SelectContractorModal";
import PDFPreviewModal from "../../components/common/PDFPreviewModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import RejectReasonModal from "../../components/common/RejectReasonModal";
import EditInvoiceItemModal from "../../components/forms/EditInvoiceItemModal";
import ImportEstimateModal from "../../components/forms/ImportEstimateModal";
import QuotationPreviewModal from "../../components/forms/QuotationPreviewModal";
import type { Quotation } from "../../types/quotation";

interface InvoiceItem {
  id: string;
  item_type?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

const CreateDraftQuotationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract clientId from query params
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromUrl = queryParams.get("clientId");
  const projectIdFromUrl = queryParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState(queryParams.get("tab") || "items");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const isReadOnly = status === "approved";

  // Item delete modal state
  const [itemDeleteTarget, setItemDeleteTarget] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  // Reject modal state  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Conversion states
  const [isConvertingBill, setIsConvertingBill] = useState(false);
  const [isConvertingInvoice, setIsConvertingInvoice] = useState(false);
  const [isConvertingWorkOrder, setIsConvertingWorkOrder] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [pendingConversionType, setPendingConversionType] = useState<"bill" | "workOrder" | null>(null);

  const handlePreviewModalOpen = async () => {
    setIsPreviewModalOpen(true);
  };

  const handleDownloadFromPreview = async () => {
    if (!id || !pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', `Quotation_${invoiceDetails.invoiceNo || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);
  const [activeHeaderSection, setActiveHeaderSection] = useState<"client" | "project" | "quotation" | null>("client");

  // Form State
  const [clientDetails, setClientDetails] = useState({
    clientId: null as number | null,
    name: "",
    company: "",
    mobile: "",
    email: "",
    address: "",
    gst: ""
  });

  const [projectDetails, setProjectDetails] = useState({
    name: "",
    type: "",
    engineer: "",
    siteAddress: "",
    workOrderNo: ""
  });

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split('T')[0],
    paymentTerms: "30 Days",
    dueDate: ""
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  // Measurements State
  const [measurementData, setMeasurementData] = useState({
    soling: { l: 0, w: 0, h: 0, qty: 0 },
    plum: { l: 0, w: 0, h: 0, cuft: 0, m3: 0 },
    stone: [
      { l: 500, w: 0, h: 0, v: 0 },
    ]
  });

  const [labourItems, setLabourItems] = useState<LabourItem[]>([]);

  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);

  const [extraChargeItems, setExtraChargeItems] = useState<ExtraChargeItem[]>([]);

  const [paymentDetails, setPaymentDetails] = useState({
    payment_mode: "UPI",
    upi_id: "",
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    due_date: ""
  });

  const [gstRates, setGstRates] = useState({
    gst: 18,
    cgst: 9,
    sgst: 9,
    tds: 1
  });

  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const [projectStartEnd, setProjectStartEnd] = useState({
    start: "",
    end: ""
  });

  // Signature
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Signature image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setSignatureImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Calculate Plum Concrete
  useEffect(() => {
    const cuft = measurementData.plum.l * measurementData.plum.w * measurementData.plum.h;
    const m3 = Number((cuft * 0.0283168).toFixed(2));
    if (Math.abs(cuft - measurementData.plum.cuft) > 0.001 || Math.abs(m3 - measurementData.plum.m3) > 0.001) {
      setMeasurementData(prev => ({
        ...prev,
        plum: { ...prev.plum, cuft, m3 }
      }));
      setItems(prev => prev.map(item => {
        if (item.item_type === "plum_concrete" || String(item.id) === "2" || String(item.id).includes("plum")) {
          const qty = item.unit === "Brass" ? Number((cuft / 100).toFixed(2)) : item.unit === "Sqft" ? Number((measurementData.plum.l * measurementData.plum.w).toFixed(2)) : item.unit === "Nos" ? 1 : m3;
          return { ...item, quantity: qty, amount: Number((qty * item.rate).toFixed(2)) };
        }
        return item;
      }));
    }
  }, [measurementData.plum.l, measurementData.plum.w, measurementData.plum.h]);

  // Calculate Stone Work
  useEffect(() => {
    const totalCuft = measurementData.stone.reduce((sum, s) => sum + (s.l * s.w * s.h), 0);
    setItems(prev => prev.map(item => {
      if (item.item_type === "stone_work" || String(item.id) === "3" || String(item.id).includes("stone")) {
        const qty = (item.unit === "Cum" || item.unit === "m3") ? Number((totalCuft * 0.0283168).toFixed(2)) : item.unit === "Sqft" ? Number((measurementData.stone.reduce((sum, s) => sum + (s.l * s.w), 0)).toFixed(2)) : item.unit === "Nos" ? measurementData.stone.length : Number((totalCuft / 100).toFixed(2));
        return { ...item, quantity: qty, amount: Number((qty * item.rate).toFixed(2)) };
      }
      return item;
    }));
  }, [measurementData.stone]);

  useEffect(() => {
    // Auto-populate from project list when selectedProjectId changes.
    // Skip when editing an existing quotation (id is set) — data already loaded from API.
    if (selectedProjectId !== 0 && !id) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        setProjectDetails({
          name: selectedProject.project_name || "",
          type: (selectedProject as any).project_type || selectedProject.type || "Commercial",
          siteAddress: selectedProject.site_address || (selectedProject as any).site_location || "",
          workOrderNo: (selectedProject as any).boq_no || (selectedProject as any).work_order_no || "",
          engineer: (selectedProject as any).engineer_name || "Er. Tejas Dhande"
        });

        // Also update project dates if available
        if (selectedProject.start_date || selectedProject.end_date) {
          setProjectStartEnd({
            start: selectedProject.start_date || "",
            end: selectedProject.end_date || ""
          });
        }

        // Client details will NOT be auto-populated from project owner.
        // User requested to type client details manually without them being overwritten by project selection.
      }
    }
  }, [selectedProjectId, projects, id]);

  // Pre-populate project from URL if provided
  useEffect(() => {
    if (projectIdFromUrl && !id && projects.length > 0) {
      const pid = Number(projectIdFromUrl);
      if (pid !== selectedProjectId) {
        setSelectedProjectId(pid);
      }
    }
  }, [projectIdFromUrl, id, projects]);

  // Fetch Projects and Clients
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectService.getProjects(100, 0);
        const list = Array.isArray(res) ? res : (res.items || res.data || []);
        setProjects(list);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();

    const fetchClients = async () => {
      try {
        const res = await userService.getAllUsers(100, 0);
        const list = Array.isArray(res) ? res : (res.items || res.data || []);
        // Match the exact Titlecase 'Client' from the backend UserRole type
        setClients(list.filter((u: any) => u.role === "Client" || u.role === "client"));
      } catch (error) {
        console.error("Failed to fetch clients", error);
      }
    };
    fetchClients();
  }, []);

  // Pre-populate client details if clientId is provided in URL
  useEffect(() => {
    if (clientIdFromUrl && !id) {
      const fetchClient = async () => {
        try {
          const u = await userService.getUserById(Number(clientIdFromUrl));
          if (u) {
            setClientDetails({
              clientId: u.id,
              name: u.full_name || "",
              company: u.designation || "", // Using designation as company placeholder
              mobile: u.mobile_number || "",
              email: u.email || "",
              address: u.address || "",
              gst: "" // Keep manual for client selection
            });
          }
        } catch (error) {
          console.error("Failed to pre-populate client details", error);
        }
      };
      fetchClient();
    }
  }, [clientIdFromUrl, id]);

  // Fetch Quotation by ID if provided
  useEffect(() => {
    if (!id) return;

    const fetchQuotation = async () => {
      try {
        const q = await quotationService.getQuotationById(Number(id));
        if (q) {
          setStatus(q.status || "draft");
          // Map basic details
          setClientDetails({
            clientId: q.client_user_id || (clientIdFromUrl ? Number(clientIdFromUrl) : null),
            name: q.client_name || "",
            company: q.company_name || "",
            mobile: q.mobile_number || "",
            email: q.email || "",
            address: q.billing_address || "",
            gst: q.gst_number || ""
          });

          setProjectDetails({
            name: q.project_name || "",
            type: q.project_type || "",
            engineer: q.engineer_name || "",
            siteAddress: q.site_address || "",
            workOrderNo: q.work_order_no || ""
          });

          setGstRates({
            gst: q.gst_percent || 0,
            cgst: q.cgst_percent || 0,
            sgst: q.sgst_percent || 0,
            tds: q.tds_percent || 0
          });

          setDiscount(q.discount_amount || 0);
          setAdvancePaid(q.advance_paid || 0);

          setPaymentDetails({
            payment_mode: q.payment_mode || "UPI",
            upi_id: q.upi_id || "",
            bank_name: q.bank_name || "",
            account_holder_name: q.account_holder_name || "", // Ensure field name match
            account_number: q.account_number || "",
            ifsc_code: q.ifsc_code || "",
            due_date: q.due_date || ""
          });

          // Restore Notes, Terms and Timeline
          setNotes((q as any).notes || (q as any).quotation_notes || (q as any).remarks || "");
          setTerms(q.terms_conditions || (q as any).terms || "");
          setProjectStartEnd({
            start: q.project_start_date || "",
            end: q.project_end_date || ""
          });

          // Sync due_date into invoiceDetails (the Invoice Details card reads this field)
          if (q.due_date) {
            setInvoiceDetails(prev => ({ ...prev, dueDate: q.due_date || "" }));
          }

          // Store raw fetched project ID just in case
          if (q.project_id) {
            setSelectedProjectId(q.project_id);
          }

          setLabourItems(q.labour_items || []);
          setMaterialItems(q.material_items || []);
          setExtraChargeItems(q.extra_charge_items || []);

          if (q.items && q.items.length > 0) {
            const mappedItems = q.items.map(item => ({
              id: String(item.id),
              item_type: item.item_type || "",
              description: item.description || item.title || "",
              unit: item.unit || "",
              quantity: item.quantity || 0,
              rate: item.rate || 0,
              amount: item.amount || 0
            }));
            setItems(mappedItems);

            // Populate measurement special states
            const soling = q.items.find(i => i.item_type === "soling")?.measurements?.[0];
            const plum = q.items.find(i => i.item_type === "plum_concrete")?.measurements?.[0];
            const stones = q.items.find(i => i.item_type === "stone_work")?.measurements || [];

            setMeasurementData({
              soling: soling ? {
                l: soling.length || 0,
                w: soling.width || 0,
                h: soling.height || 0,
                qty: soling.quantity || 0
              } : { l: 0, w: 0, h: 0, qty: 0 },
              plum: plum ? {
                l: plum.length || 0,
                w: plum.width || 0,
                h: plum.height || 0,
                cuft: plum.cubic_feet || 0,
                m3: plum.cubic_meter || 0
              } : { l: 0, w: 0, h: 0, cuft: 0, m3: 0 },
              stone: stones.length > 0 ? stones.map(s => ({
                l: s.length || 0,
                w: s.width || 0,
                h: s.height || 0,
                v: s.quantity || 0
              })) : [{ l: 0, w: 0, h: 0, v: 0 }] // Use 0 instead of 500 for initial state if empty
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch quotation", error);
        toast.error("Failed to load quotation details");
      }
    };
    fetchQuotation();
  }, [id]);

  // Fallback: If viewing an existing quote but the backend GET omitted project_id, try to match by name
  useEffect(() => {
    if (id && selectedProjectId === 0 && projectDetails.name && projects.length > 0) {
      const matched = projects.find(p => p.project_name?.trim() === projectDetails.name?.trim());
      if (matched && matched.id) {
        setSelectedProjectId(matched.id);
      }
    }
  }, [id, selectedProjectId, projectDetails.name, projects]);

  // Calculations
  // Calculations with robust rounding to 2 decimal places
  // SubTotal = work items + labour + material + extra charges (matches backend)
  const subTotal = useMemo(() => {
    const workTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const labourTotal = labourItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const materialTotal = materialItems.reduce((sum, item) => sum + (item.estimated_amount || (item.estimated_quantity * item.estimated_rate) || 0), 0);
    const extraTotal = extraChargeItems.reduce((sum, item) => sum + (item.amount || (item.quantity * item.rate) || 0), 0);
    return Number((workTotal + labourTotal + materialTotal + extraTotal).toFixed(2));
  }, [items, labourItems, materialItems, extraChargeItems]);

  const cgst = useMemo(() => Number((subTotal * (gstRates.cgst / 100)).toFixed(2)), [subTotal, gstRates.cgst]);
  const sgst = useMemo(() => Number((subTotal * (gstRates.sgst / 100)).toFixed(2)), [subTotal, gstRates.sgst]);
  // TDS is deducted on total invoice value including GST (matches backend formula)
  const tdsAmount = useMemo(() => Number(((subTotal + cgst + sgst) * (gstRates.tds / 100)).toFixed(2)), [subTotal, cgst, sgst, gstRates.tds]);
  const grandTotal = Number((subTotal + cgst + sgst - discount - tdsAmount).toFixed(2));
  const balanceDue = Number((grandTotal - advancePaid).toFixed(2));

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: "new_" + Date.now().toString(),
      description: "",
      unit: "",
      quantity: 0,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleWhatsAppShare = () => {
    const message = `*INVOICE SUMMARY - INFRA-PILOT*\n\n*Invoice No:* ${invoiceDetails.invoiceNo}\n*Date:* ${invoiceDetails.date}\n*Amount:* ₹${grandTotal.toLocaleString()}\n*Balance Due:* ₹${balanceDue.toLocaleString()}\n\nProfessional PDF invoice is ready for download in the portal.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleEmailShare = () => {
    const subject = `Invoice ${invoiceDetails.invoiceNo} from InfraPilot`;
    const body = `Dear Client,\n\nPlease find the summary of your invoice below:\n\nInvoice No: ${invoiceDetails.invoiceNo}\nDate: ${invoiceDetails.date}\nGrand Total: ₹${grandTotal.toLocaleString()}\nBalance Due: ₹${balanceDue.toLocaleString()}\n\nThe professional PDF has been generated.\n\nRegards,\nInfraPilot Team`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendQuotation = async () => {
    if (!id) return;
    const toastId = toast.loading("Sending quotation...");
    try {
      await quotationService.sendQuotation(Number(id));
      toast.success("Quotation sent successfully", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to send quotation", { id: toastId });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setItemDeleteTarget(itemId);
  };

  const confirmRemoveItem = async () => {
    if (!itemDeleteTarget) return;
    setIsDeletingItem(true);
    if (id && !itemDeleteTarget.startsWith("new_")) {
      try {
        await quotationService.deleteQuotationItem(Number(itemDeleteTarget));
        toast.success("Item deleted from quotation");
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to delete item from database");
        setIsDeletingItem(false);
        setItemDeleteTarget(null);
        return;
      }
    }
    setItems(items.filter(i => i.id !== itemDeleteTarget));
    setIsDeletingItem(false);
    setItemDeleteTarget(null);
  };

  // Approve / Reject handlers
  const handleApproveQuotation = async () => {
    if (!id) return;
    try {
      await quotationService.approveQuotation(Number(id));
      toast.success("Quotation approved!");
      setStatus("approved");
    } catch {
      toast.error("Failed to approve quotation");
    }
  };

  const handleRejectQuotation = async (reason: string) => {
    if (!id) return;
    try {
      await quotationService.rejectQuotation(Number(id), reason);
      toast.success("Quotation rejected");
      setIsRejectModalOpen(false);
    } catch {
      toast.error("Failed to reject quotation");
    }
  };

  const handleConvertToBill = async () => {
    if (!id) return;
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }
    setPendingConversionType("bill");
    setIsContractorModalOpen(true);
  };

  const handleConvertToInvoice = async () => {
    if (!id) return;
    try {
      setIsConvertingInvoice(true);
      await financeService.convertQuotationToInvoice(Number(id));
      toast.success("Converted to invoice successfully!");
      navigate("/admin/finance/invoices");
    } catch (err: any) {
      toast.error(err.message || "Failed to convert to invoice");
    } finally {
      setIsConvertingInvoice(false);
    }
  };

  const handleConvertToWorkOrder = async () => {
    if (!id) return;
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }
    setPendingConversionType("workOrder");
    setIsContractorModalOpen(true);
  };

  const handleContractorSelect = async (contractorId: number) => {
    if (!id || !selectedProjectId || !pendingConversionType) return;

    try {
      if (pendingConversionType === "bill") {
        setIsConvertingBill(true);
        await quotationService.convertToBill(Number(id), selectedProjectId, contractorId);
        toast.success("Converted to bill successfully!");
      } else {
        setIsConvertingWorkOrder(true);
        await quotationService.convertToWorkOrder(Number(id), selectedProjectId, contractorId);
        toast.success("Converted to work order successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to convert to ${pendingConversionType}`);
    } finally {
      setIsConvertingBill(false);
      setIsConvertingWorkOrder(false);
      setPendingConversionType(null);
    }
  };

  // Implement Save
  const handleSaveQuotation = async () => {
    if (!projectDetails.name || projectDetails.name.trim() === "") {
      toast.error("Project Name is required! Please select a valid project.");
      setIsSaving(false);
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        client_user_id: clientDetails.clientId || 1,
        client_name: clientDetails.name,
        company_name: clientDetails.company || "Patil Construction Pvt Ltd",
        mobile_number: clientDetails.mobile,
        email: clientDetails.email || "rahul.patil@example.com",
        billing_address: clientDetails.address,
        site_address: projectDetails.siteAddress,
        gst_number: clientDetails.gst,
        project_id: selectedProjectId,

        project_name: projectDetails.name,
        project_type: projectDetails.type,
        project_start_date: projectStartEnd.start || null,
        project_end_date: projectStartEnd.end || null,
        engineer_name: projectDetails.engineer || "Er. Tejas Dhande",
        work_order_no: projectDetails.workOrderNo,

        labour_items: labourItems,
        material_items: materialItems,
        extra_charge_items: extraChargeItems,

        items: id ? items.filter(i => !String(i.id).startsWith("new_")).map(item => {
          let itemType = item.item_type || "custom";
          let measurements: any[] = [];
          if (item.item_type === "soling" || String(item.id) === "1" || String(item.id).includes("soling")) {
            itemType = "soling";
            const { l, w, h } = measurementData.soling;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "ft" }];
            }
          } else if (item.item_type === "plum_concrete" || String(item.id) === "2" || String(item.id).includes("plum")) {
            itemType = "plum_concrete";
            const { l, w, h } = measurementData.plum;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "m" }];
            }
          } else if (item.item_type === "stone_work" || String(item.id) === "3" || String(item.id).includes("stone")) {
            itemType = "stone_work";
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          } else {
            itemType = item.item_type || "custom";
            measurements = [{ length: item.quantity || 1, width: 1, height: 1, unit: item.unit || "unit" }];
          }

          if (measurements.length === 0) {
            let dummyLength = item.quantity || 1;
            if (itemType === "plum_concrete" && (item.unit === "Cum" || item.unit === "m3")) {
              dummyLength = Number((dummyLength / 0.0283168).toFixed(2));
            } else if ((itemType === "soling" || itemType === "stone_work") && item.unit === "Brass") {
              dummyLength = dummyLength * 100;
            }
            measurements = [{ length: dummyLength, width: 1, height: 1, unit: "ft" }];
          }

          measurements = measurements.map(m => {
            return {
              ...m,
              length: m.length || 1,
              width: m.width || 1,
              height: m.height || 1
            };
          });

          return {
            item_type: itemType,
            title: item.description.split('\n')[0],
            description: item.description,
            unit: item.unit,
            rate: item.rate,
            measurements
          };
        }) : items.map(item => {
          let itemType = item.item_type || "custom";
          let measurements: any[] = [];
          if (item.item_type === "soling" || String(item.id) === "1" || String(item.id).includes("soling")) {
            itemType = "soling";
            const { l, w, h } = measurementData.soling;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "ft" }];
            }
          } else if (item.item_type === "plum_concrete" || String(item.id) === "2" || String(item.id).includes("plum")) {
            itemType = "plum_concrete";
            const { l, w, h } = measurementData.plum;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "m" }];
            }
          } else if (item.item_type === "stone_work" || String(item.id) === "3" || String(item.id).includes("stone")) {
            itemType = "stone_work";
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          } else {
            itemType = item.item_type || "custom";
            measurements = [{ length: item.quantity || 1, width: 1, height: 1, unit: item.unit || "unit" }];
          }

          if (measurements.length === 0) {
            let dummyLength = item.quantity || 1;
            if (itemType === "plum_concrete" && (item.unit === "Cum" || item.unit === "m3")) {
              dummyLength = Number((dummyLength / 0.0283168).toFixed(2));
            } else if ((itemType === "soling" || itemType === "stone_work") && item.unit === "Brass") {
              dummyLength = dummyLength * 100;
            }
            measurements = [{ length: dummyLength, width: 1, height: 1, unit: "ft" }];
          }

          measurements = measurements.map(m => {
            return {
              ...m,
              length: m.length || 1,
              width: m.width || 1,
              height: m.height || 1
            };
          });

          return {
            item_type: itemType,
            title: item.description.split('\n')[0],
            description: item.description,
            unit: item.unit,
            rate: item.rate,
            measurements
          };
        }),

        gst_percent: gstRates.gst,
        cgst_percent: gstRates.cgst,
        sgst_percent: gstRates.sgst,
        tds_percent: gstRates.tds,
        discount_amount: discount,
        advance_paid: advancePaid,

        // Computed totals — sent explicitly so backend stores correct values
        // (list view reads grand_total directly from the database)
        subtotal: subTotal,
        cgst_amount: cgst,
        sgst_amount: sgst,
        tds_amount: tdsAmount,
        grand_total: grandTotal,
        balance_due: balanceDue,

        ...paymentDetails,
        due_date: invoiceDetails.dueDate || paymentDetails.due_date || new Date().toISOString().split('T')[0],
        notes,
        terms_conditions: terms
      };

      console.log(`${id ? "Updating" : "Creating"} Quotation Payload:`, JSON.stringify(payload, null, 2));

      if (id) {
        await quotationService.updateQuotation(Number(id), payload);

        // POST new items
        const newItemsLocal = items.filter(i => String(i.id).startsWith("new_"));
        for (const newItem of newItemsLocal) {
          let measurements: any[] = [];
          let itemType = newItem.item_type || "custom";
          if (newItem.item_type === "soling" || String(newItem.id) === "1" || String(newItem.id).includes("soling")) {
            itemType = "soling";
            measurements = [{ length: measurementData.soling.l || 0, width: measurementData.soling.w || 0, height: measurementData.soling.h || 0, unit: "ft" }];
          } else if (newItem.item_type === "plum_concrete" || String(newItem.id) === "2" || String(newItem.id).includes("plum")) {
            itemType = "plum_concrete";
            measurements = [{ length: measurementData.plum.l || 0, width: measurementData.plum.w || 0, height: measurementData.plum.h || 0, unit: "m" }];
          } else if (newItem.item_type === "stone_work" || String(newItem.id) === "3" || String(newItem.id).includes("stone")) {
            itemType = "stone_work";
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          } else {
            itemType = newItem.item_type || "custom";
            measurements = [{ length: newItem.quantity || 1, width: 1, height: 1, unit: newItem.unit || "unit" }];
          }

          if (measurements.length === 0) {
            let dummyLength = newItem.quantity || 1;
            if (itemType === "plum_concrete" && (newItem.unit === "Cum" || newItem.unit === "m3")) {
              dummyLength = Number((dummyLength / 0.0283168).toFixed(2));
            } else if ((itemType === "soling" || itemType === "stone_work") && newItem.unit === "Brass") {
              dummyLength = dummyLength * 100;
            }
            measurements = [{ length: dummyLength, width: 1, height: 1, unit: "ft" }];
          }

          measurements = measurements.map(m => {
            return {
              ...m,
              length: m.length || 1,
              width: m.width || 1,
              height: m.height || 1
            };
          });

          const itemPayload = {
            item_type: itemType,
            title: newItem.description.split('\n')[0] || "New Work",
            description: newItem.description,
            unit: newItem.unit,
            rate: newItem.rate,
            measurements: measurements
          };
          await quotationService.addQuotationItem(Number(id), itemPayload);
        }

        // UPDATE existing items
        const existingItemsLocal = items.filter(i => !String(i.id).startsWith("new_"));
        for (const existingItem of existingItemsLocal) {
          let measurements: any[] = [];
          let itemType = existingItem.item_type || "custom";
          if (existingItem.item_type === "soling" || String(existingItem.id) === "1" || String(existingItem.id).includes("soling")) {
            itemType = "soling";
            measurements = [{ length: measurementData.soling.l || 0, width: measurementData.soling.w || 0, height: measurementData.soling.h || 0, unit: "ft" }];
          } else if (existingItem.item_type === "plum_concrete" || String(existingItem.id) === "2" || String(existingItem.id).includes("plum")) {
            itemType = "plum_concrete";
            measurements = [{ length: measurementData.plum.l || 0, width: measurementData.plum.w || 0, height: measurementData.plum.h || 0, unit: "m" }];
          } else if (existingItem.item_type === "stone_work" || String(existingItem.id) === "3" || String(existingItem.id).includes("stone")) {
            itemType = "stone_work";
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          } else {
            itemType = existingItem.item_type || "custom";
            measurements = [{ length: existingItem.quantity || 1, width: 1, height: 1, unit: existingItem.unit || "unit" }];
          }

          if (measurements.length === 0) {
            let dummyLength = existingItem.quantity || 1;
            if (itemType === "plum_concrete" && (existingItem.unit === "Cum" || existingItem.unit === "m3")) {
              dummyLength = Number((dummyLength / 0.0283168).toFixed(2));
            } else if ((itemType === "soling" || itemType === "stone_work") && existingItem.unit === "Brass") {
              dummyLength = dummyLength * 100;
            }
            measurements = [{ length: dummyLength, width: 1, height: 1, unit: "ft" }];
          }

          measurements = measurements.map(m => {
            return {
              ...m,
              length: m.length || 1,
              width: m.width || 1,
              height: m.height || 1
            };
          });

          const itemPayload = {
            item_type: itemType,
            title: existingItem.description.split('\n')[0] || "Existing Work",
            description: existingItem.description,
            unit: existingItem.unit,
            rate: existingItem.rate,
            measurements: measurements
          };
          await quotationService.updateQuotationItem(Number(existingItem.id), itemPayload);
        }

        toast.success("Quotation Updated Successfully!");

      } else {
        await quotationService.createQuotation(payload);
        toast.success("Quotation Saved Successfully!");
        navigate("/admin/invoices/all");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save quotation");
    } finally {
      setIsSaving(false);
    }
  };

  // Implement Professional Direct Download
  // Helper to convert number to Indian currency words
  const toWords = (num: number) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: any): string => {
      if ((n = n.toString()).length > 9) return 'overflow';
      let n_arr: any = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_arr) return '';
      let str = '';
      str += (n_arr[1] != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
      str += (n_arr[2] != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
      str += (n_arr[3] != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
      str += (n_arr[4] != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
      str += (n_arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
      return str;
    };

    const amount = Math.floor(num);
    const paisa = Math.round((num - amount) * 100);
    let res = inWords(amount) + "Rupees Only";
    if (paisa > 0) {
      res = inWords(amount) + "Rupees and " + inWords(paisa) + "Paise Only";
    }
    return res;
  };

  // Implement Professional Direct Download (Backend for existing, window.print for new/drafts)
  const handleDownload = async () => {
    if (!id) {
      toast.error("Please save the quotation first to download the PDF from backend", { duration: 3000 });
      // Optional: fallback to window.print() if you want to allow draft printing
      toast.loading("Opening print preview for draft...", { id: "pdf-gen" });
      setTimeout(() => {
        window.print();
        toast.success("Print Ready", { id: "pdf-gen" });
      }, 500);
      return;
    }

    const toastId = toast.loading("Downloading PDF from backend...", { id: "pdf-gen" });
    try {
      const blob = await quotationService.downloadQuotationPDF(Number(id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${invoiceDetails.invoiceNo || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF Downloaded Successfully", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download PDF from backend. Falling back to print.", { id: toastId });
      setTimeout(() => window.print(), 1000);
    }
  };

  const handleEditItem = (item: InvoiceItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (updatedItem: InvoiceItem) => {
    setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
    toast.success("Item updated");
  };

  const handleImportQuotation = (q: Quotation) => {
    // 1. Map Client Details
    setClientDetails({
      clientId: q.client_user_id || null,
      name: q.client_name || "",
      company: q.company_name || "",
      mobile: q.mobile_number || "",
      email: q.email || "",
      address: q.billing_address || "",
      gst: q.gst_number || ""
    });

    // 2. Map Project Details
    setProjectDetails({
      name: q.project_name || "",
      type: q.project_type || "Gravity Wall",
      engineer: q.engineer_name || "",
      siteAddress: q.site_address || "",
      workOrderNo: q.work_order_no || ""
    });

    // 3. Map Items
    if (q.items && q.items.length > 0) {
      const mappedItems = q.items.map(item => ({
        id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
        description: item.description || item.title,
        unit: item.unit,
        quantity: item.quantity || 0,
        rate: item.rate,
        amount: item.amount || (item.quantity || 0) * item.rate
      }));
      setItems(mappedItems);

      // 4. Try to reconstruct measurement data for known items
      q.items.forEach(item => {
        if (item.item_type === "soling" && item.measurements?.[0]) {
          setMeasurementData(prev => ({
            ...prev,
            soling: {
              l: item.measurements?.[0].length || 0,
              w: item.measurements?.[0].width || 0,
              h: item.measurements?.[0].height || 0,
              qty: item.quantity || 0
            }
          }));
        } else if (item.item_type === "plum_concrete" && item.measurements?.[0]) {
          setMeasurementData(prev => ({
            ...prev,
            plum: {
              l: item.measurements?.[0].length || 0,
              w: item.measurements?.[0].width || 0,
              h: item.measurements?.[0].height || 0,
              cuft: item.measurements?.[0].cubic_feet || 0,
              m3: item.measurements?.[0].cubic_meter || 0
            }
          }));
        } else if (item.item_type === "stone_work" && item.measurements) {
          const stoneRows = item.measurements.map(m => ({
            l: m.length,
            w: m.width,
            h: m.height,
            v: m.cubic_feet || 0
          }));
          setMeasurementData(prev => ({
            ...prev,
            stone: stoneRows.length > 0 ? stoneRows : prev.stone
          }));
        }
      });
    }

    // 5. Map Tax & Other Details
    setGstRates({
      gst: q.gst_percent || 18,
      cgst: q.cgst_percent || 9,
      sgst: q.sgst_percent || 9,
      tds: q.tds_percent || 1
    });
    setDiscount(q.discount_amount || 0);
    setAdvancePaid(q.advance_paid || 0);

    // 6. Map Other Items
    setLabourItems(q.labour_items || []);
    setMaterialItems(q.material_items || []);
    setExtraChargeItems(q.extra_charge_items || []);

    // 7. Map Bank Details
    setPaymentDetails({
      payment_mode: q.payment_mode || "UPI",
      upi_id: q.upi_id || "",
      bank_name: q.bank_name || "",
      account_holder_name: q.account_holder_name || "",
      account_number: q.account_number || "",
      ifsc_code: q.ifsc_code || "",
      due_date: q.due_date || ""
    });

    setNotes(q.notes || "");
    setTerms(q.terms_conditions || "");

    setIsImportModalOpen(false);
    toast.success("Estimate imported successfully!");
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    if (isReadOnly) return;
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          const rawAmount = Number(updatedItem.quantity) * Number(updatedItem.rate);
          updatedItem.amount = Number(rawAmount.toFixed(2));

          if (field === "quantity") {
            const actualQty = Number(value);
            if (item.item_type === "plum_concrete" || String(item.id) === "2" || String(item.id).includes("plum")) {
              const l = item.unit === "Brass" ? actualQty * 100 : item.unit === "Sqft" ? actualQty : actualQty / 0.0283168;
              setMeasurementData(prev => ({ ...prev, plum: { l: Number(l.toFixed(2)), w: 1, h: 1, cuft: 0, m3: 0 } }));
            } else if (item.item_type === "stone_work" || String(item.id) === "3" || String(item.id).includes("stone")) {
              const l = (item.unit === "Cum" || item.unit === "m3") ? actualQty / 0.0283168 : item.unit === "Sqft" ? actualQty : actualQty * 100;
              setMeasurementData(prev => ({ ...prev, stone: [{ l: Number(l.toFixed(2)), w: 1, h: 1, v: actualQty }] }));
            } else if (item.item_type === "soling" || String(item.id) === "1" || String(item.id).includes("soling")) {
              const l = item.unit === "Brass" ? actualQty * 100 : item.unit === "Sqft" ? actualQty : actualQty / 0.0283168;
              setMeasurementData(prev => ({ ...prev, soling: { l: Number(l.toFixed(2)), w: 1, h: 1, qty: actualQty } }));
            }
          }
        } else if (field === "unit") {
          if (item.item_type === "plum_concrete" || String(item.id) === "2" || String(item.id).includes("plum")) {
            const cuft = measurementData.plum.l * measurementData.plum.w * measurementData.plum.h;
            const m3 = Number((cuft * 0.0283168).toFixed(2));
            const qty = value === "Brass" ? Number((cuft / 100).toFixed(2)) : value === "Sqft" ? Number((measurementData.plum.l * measurementData.plum.w).toFixed(2)) : value === "Nos" ? 1 : m3;
            updatedItem.quantity = qty;
            updatedItem.amount = Number((qty * updatedItem.rate).toFixed(2));
          } else if (item.item_type === "stone_work" || String(item.id) === "3" || String(item.id).includes("stone")) {
            const totalCuft = measurementData.stone.reduce((sum, s) => sum + (s.l * s.w * s.h), 0);
            const qty = (value === "Cum" || value === "m3") ? Number((totalCuft * 0.0283168).toFixed(2)) : value === "Sqft" ? Number((measurementData.stone.reduce((sum, s) => sum + (s.l * s.w), 0)).toFixed(2)) : value === "Nos" ? measurementData.stone.length : Number((totalCuft / 100).toFixed(2));
            updatedItem.quantity = qty;
            updatedItem.amount = Number((qty * updatedItem.rate).toFixed(2));
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleLabourFieldChange = async (idx: number, field: string, value: any) => {
    if (isReadOnly) return;
    const newItems = [...labourItems];
    const item = newItems[idx];
    (item as any)[field] = value;

    // Auto-calculate amount
    const count = field === "labour_count" ? Number(value) : (item.labour_count || 0);
    const wage = field === "daily_wage" ? Number(value) : (item.daily_wage || 0);
    const days = field === "labour_days" ? Number(value) : (item.labour_days || 0);
    const ot_hrs = field === "overtime_hours" ? Number(value) : (item.overtime_hours || 0);
    const ot_rate = field === "overtime_rate" ? Number(value) : (item.overtime_rate || 0);

    item.amount = (count * wage * days) + (ot_hrs * ot_rate);
    setLabourItems(newItems);

    // If it's an existing quotation and not a new unsaved row, sync with backend
    if (id && item.id && !String(item.id).startsWith("new_") && !String(item.id).startsWith("999")) {
      try {
        const payload = {
          labour_id: (item as any).labour_id || null,
          skill_type: item.skill_type,
          labour_count: item.labour_count,
          daily_wage: item.daily_wage,
          labour_days: item.labour_days,
          overtime_hours: item.overtime_hours,
          overtime_rate: item.overtime_rate,
          notes: item.notes || ""
        };
        await quotationService.updateLabourItem(Number(item.id), payload);
      } catch (err: any) {
        console.error("Failed to sync labour item update:", err);
      }
    }
  };

  const handleAddLabourRow = async () => {
    if (isReadOnly) return;
    const newItem: LabourItem = {
      skill_type: "General Labourer",
      labour_count: 1,
      daily_wage: 1,
      labour_days: 1,
      overtime_hours: 0,
      overtime_rate: 0,
      amount: 1
    };

    if (id) {
      try {
        const payload = {
          ...newItem,
          labour_id: null,
          notes: ""
        };
        const addedItem = await quotationService.addLabourItem(Number(id), payload);
        setLabourItems([...labourItems, addedItem]);
        toast.success("Labour type added");
      } catch (err: any) {
        console.error("Failed to add labour item:", err);
        toast.error("Failed to add labour type to server");
      }
    } else {
      setLabourItems([...labourItems, {
        ...newItem,
        id: Number("999" + Date.now().toString().slice(-6))
      } as any]);
    }
  };

  const handleRemoveLabourRow = async (idx: number, itemId?: number) => {
    if (isReadOnly) return;
    const newItems = labourItems.filter((_, i) => i !== idx);
    setLabourItems(newItems);

    if (id && itemId && !String(itemId).startsWith("999")) {
      try {
        await quotationService.deleteLabourItem(Number(itemId));
        toast.success("Labour item removed");
      } catch (err: any) {
        console.error("Failed to delete labour item:", err);
        toast.error(err.response?.data?.detail || "Failed to remove labour item from server");
      }
    }
  };

  const handleMaterialFieldChange = async (idx: number, field: string, value: any) => {
    if (isReadOnly) return;
    const newItems = [...materialItems];
    const item = newItems[idx];
    (item as any)[field] = value;
    setMaterialItems(newItems);

    if (id && item.id && !String(item.id).startsWith("new_") && !String(item.id).startsWith("999")) {
      try {
        const payload = {
          material_id: (item as any).material_id || null,
          material_name: item.material_name,
          category: item.category,
          unit: item.unit,
          estimated_quantity: item.estimated_quantity,
          estimated_rate: item.estimated_rate,
          notes: item.notes || ""
        };
        await quotationService.updateMaterialItem(Number(item.id), payload);
      } catch (err: any) {
        console.error("Failed to sync material item update:", err);
      }
    }
  };

  const handleAddMaterialRow = async () => {
    if (isReadOnly) return;
    const newItem: any = {
      material_name: "",
      category: "",
      unit: "",
      estimated_quantity: 0,
      estimated_rate: 0,
      notes: ""
    };

    if (id) {
      try {
        const payload = {
          ...newItem,
          material_id: null
        };
        const addedItem = await quotationService.addMaterialItem(Number(id), payload);
        setMaterialItems([...materialItems, addedItem]);
        toast.success("Material added");
      } catch (err: any) {
        console.error("Failed to add material item:", err);
        toast.error("Failed to add material to server");
      }
    } else {
      setMaterialItems([...materialItems, {
        ...newItem,
        id: Number("999" + Date.now().toString().slice(-6))
      }]);
    }
  };

  const handleRemoveMaterialRow = async (idx: number, itemId?: number) => {
    if (isReadOnly) return;
    const newItems = materialItems.filter((_, i) => i !== idx);
    setMaterialItems(newItems);

    if (id && itemId && !String(itemId).startsWith("999")) {
      try {
        await quotationService.deleteMaterialItem(Number(itemId));
        toast.success("Material removed");
      } catch (err: any) {
        console.error("Failed to delete material item:", err);
        toast.error(err.response?.data?.detail || "Failed to remove material from server");
      }
    }
  };

  const handleExtraChargeFieldChange = async (idx: number, field: string, value: any) => {
    if (isReadOnly) return;
    const newItems = [...extraChargeItems];
    const item = newItems[idx];
    (item as any)[field] = value;

    // Auto-calculate amount
    if (field === "quantity" || field === "rate") {
      item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    }

    setExtraChargeItems(newItems);

    if (id && item.id && !String(item.id).startsWith("new_") && !String(item.id).startsWith("999")) {
      try {
        const payload = {
          equipment_id: (item as any).equipment_id || null,
          expense_type: item.expense_type,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount || (item.quantity * item.rate),
          notes: (item as any).notes || ""
        };
        await quotationService.updateExtraCharge(Number(item.id), payload);
      } catch (err: any) {
        console.error("Failed to sync extra charge update:", err);
      }
    }
  };

  const handleAddExtraChargeRow = async () => {
    if (isReadOnly) return;
    const newItem: any = {
      expense_type: "misc",
      description: "",
      quantity: 0,
      rate: 0,
      amount: 0,
      notes: ""
    };

    if (id) {
      try {
        const payload = {
          ...newItem,
          equipment_id: null
        };
        const addedItem = await quotationService.addExtraCharge(Number(id), payload);
        setExtraChargeItems([...extraChargeItems, addedItem]);
        toast.success("Extra charge added");
      } catch (err: any) {
        console.error("Failed to add extra charge:", err);
        toast.error("Failed to add extra charge to server");
      }
    } else {
      setExtraChargeItems([...extraChargeItems, {
        ...newItem,
        id: Number("999" + Date.now().toString().slice(-6))
      }]);
    }
  };

  const handleRemoveExtraChargeRow = async (idx: number, itemId?: number) => {
    if (isReadOnly) return;
    const newItems = extraChargeItems.filter((_, i) => i !== idx);
    setExtraChargeItems(newItems);

    if (id && itemId && !String(itemId).startsWith("999")) {
      try {
        await quotationService.deleteExtraCharge(Number(itemId));
        toast.success("Extra charge removed");
      } catch (err: any) {
        console.error("Failed to delete extra charge:", err);
        toast.error(err.response?.data?.detail || "Failed to remove extra charge from server");
      }
    }
  };

  return (
    <>
      <Navbar
        title={id ? "View/Edit Quotation" : "Create Draft Quotation"}
        breadcrumb={["Dashboard", "Invoices", id ? "View Quotation" : "Create Invoice"]}
      />

      <PageTransition className="p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                {id ? "Draft Quotation Intelligence" : "Draft Quotation Details"}
                {status === "approved" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Approved
                  </span>
                )}
                {status === "declined" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-200">
                    <XCircle className="w-3 h-3" /> Declined
                  </span>
                )}
              </h2>
              <p className="text-slate-500 text-sm font-medium">{id ? `Viewing/Editing Quotation #${id}` : "Create a streamlined draft quotation."}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                Preview Document
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                Import from Estimate
              </button>
              <button
                onClick={handleSaveQuotation}
                disabled={isSaving || isReadOnly}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95'}`}
              >
                {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isReadOnly ? "Approved" : id ? "Update Quotation" : "Save Quotation"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6">

          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 space-y-6">

            {/* TOP GRID: DETAILS */}
            <div className="flex flex-col gap-4">

              {/* CLIENT DETAILS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveHeaderSection(activeHeaderSection === "client" ? null : "client")}
                  className={`w-full p-5 flex items-center justify-between transition-colors ${activeHeaderSection === "client" ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Client Details</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="text-slate-400">
                      <svg className={`w-5 h-5 transition-transform ${activeHeaderSection === 'client' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </button>
                {activeHeaderSection === "client" && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client Identity <span className="text-rose-500">*</span></label>
                      <select
                        value={clientDetails.clientId || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val === 0) {
                            setClientDetails({ clientId: null, name: "", company: "", mobile: "", email: "", address: "", gst: "" });
                          } else {
                            const c = clients.find(x => (x.id || x.user_id) === val);
                            if (c) {
                              setClientDetails({
                                clientId: c.id || c.user_id,
                                name: c.full_name || "",
                                company: clientDetails.company, // Preserve whatever user manually typed
                                mobile: c.mobile_number || "",
                                email: c.email || "",
                                address: c.address || "",
                                gst: ""
                              });
                            }
                          }
                        }}
                        disabled={isReadOnly}
                        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <option value={0}>Walk-in / Manual Client</option>
                        {clients.map(c => (
                          <option key={c.id || c.user_id} value={c.id || c.user_id}>{c.full_name}</option>
                        ))}
                      </select>
                      {!clientDetails.clientId && (
                        <input
                          type="text"
                          value={clientDetails.name}
                          onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                          readOnly={isReadOnly}
                          placeholder="Type Manual Client Name..."
                          className={`w-full px-4 py-2.5 mt-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number</label>
                        <input
                          type="text"
                          value={clientDetails.mobile}
                          onChange={(e) => setClientDetails({ ...clientDetails, mobile: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={clientDetails.email}
                          onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          placeholder="client@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company Name</label>
                      <input
                        type="text"
                        value={clientDetails.company}
                        onChange={(e) => setClientDetails({ ...clientDetails, company: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="e.g. Patil Construction Pvt Ltd"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billing Address</label>
                      <textarea
                        rows={1}
                        value={clientDetails.address}
                        onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">GST Number (Optional)</label>
                      <input
                        type="text"
                        value={clientDetails.gst}
                        onChange={(e) => setClientDetails({ ...clientDetails, gst: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>


            </div>

            {/* MIDDLE SECTION: ITEMS TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Items / Measurements</h3>
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={isReadOnly}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  <Plus className="w-4 h-4" /> Add New Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4 w-12">#</th>
                      <th className="px-6 py-4">Item / Work Description</th>
                      <th className="px-6 py-4 w-40">Unit</th>
                      <th className="px-6 py-4 w-36">Quantity</th>
                      <th className="px-6 py-4 w-40">Rate (₹)</th>
                      <th className="px-6 py-4 w-40">Amount (₹)</th>
                      <th className="px-6 py-4 w-28 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                            placeholder="Enter item description..."
                            rows={2}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            disabled={isReadOnly}
                            className={`w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                          >
                            <option value="">Select Unit</option>
                            {["Cum", "Sqm", "Rm", "Nos", "Kg", "Ton", "Sqft", "Brass", "Litre", "LS"].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={0}
                            max={9999999}
                            step="any"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                updateItem(item.id, "quantity", "");
                              } else {
                                let val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  if (val < 0) return;
                                  if (val > 9999999) return;
                                  updateItem(item.id, "quantity", val);
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 placeholder:font-medium"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          <input
                            type="number"
                            min={0}
                            max={99999999}
                            step="any"
                            value={item.rate === 0 ? "" : item.rate}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                updateItem(item.id, "rate", "");
                              } else {
                                let val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  if (val < 0) return;
                                  if (val > 99999999) return;
                                  updateItem(item.id, "rate", val);
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 placeholder:font-medium"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">
                          ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              disabled={isReadOnly}
                              className={`p-1.5 transition-colors ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-indigo-600'}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isReadOnly}
                              className={`p-1.5 transition-colors ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-rose-500'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Items: <span className="text-slate-800">{items.length}</span></p>
                <div className="flex items-center gap-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</p>
                  <p className="text-xl font-black text-indigo-600">₹{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SUMMARY & PREVIEW */}
          <div className="w-full xl:w-[400px] space-y-6">

            {/* INVOICE SUMMARY */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Invoice Summary</h3>
                </div>
                {id && (
                  <div className="flex gap-2">
                    {status === "approved" && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {status === "declined" && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3" /> Declined
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Sub Total</span>
                  <span className="font-black text-slate-800">₹ {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">CGST</span>
                    <input
                      type="number"
                      value={gstRates.cgst}
                      onChange={(e) => setGstRates(prev => {
                        const val = parseFloat(e.target.value) || 0;
                        return { ...prev, cgst: val, gst: val + prev.sgst };
                      })}
                      readOnly={isReadOnly}
                      className={`w-12 px-1 py-0.5 bg-slate-50 border border-slate-100 rounded text-center text-xs font-black outline-none focus:ring-1 focus:ring-indigo-200 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                  </div>
                  <span className="font-black text-slate-800">₹ {cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">SGST</span>
                    <input
                      type="number"
                      value={gstRates.sgst}
                      onChange={(e) => setGstRates(prev => {
                        const val = parseFloat(e.target.value) || 0;
                        return { ...prev, sgst: val, gst: val + prev.cgst };
                      })}
                      readOnly={isReadOnly}
                      className={`w-12 px-1 py-0.5 bg-slate-50 border border-slate-100 rounded text-center text-xs font-black outline-none focus:ring-1 focus:ring-indigo-200 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                  </div>
                  <span className="font-black text-slate-800">₹ {sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Discount</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs">₹</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`w-24 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-black text-rose-500 outline-none focus:ring-2 focus:ring-rose-100 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-2 border-t border-slate-50 border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">TDS</span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{gstRates.tds}%</span>
                  </div>
                  <span className="font-black text-rose-500">- ₹ {tdsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="py-4 border-y border-slate-100 my-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-black text-indigo-600">₹ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Advance Paid</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs">₹</span>
                    <input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`w-24 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between mt-6">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Balance Due</span>
                  <span className="text-lg font-black text-emerald-600">₹ {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col mx-auto max-w-[280px] w-full space-y-2">
              <button
                onClick={handlePreviewModalOpen}
                disabled={isPreviewLoading}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-wait"
              >
                {isPreviewLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Eye className="w-3 h-3 group-hover:animate-pulse" />
                )}
                {isPreviewLoading ? 'GENERATING PREVIEW...' : 'PREVIEW QUOTATION'}
              </button>
              <button
                onClick={handleSaveQuotation}
                disabled={isSaving || isReadOnly}
                className={`w-full py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${isSaving || isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95'}`}
              >
                <Save className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} /> {isSaving ? 'Saving...' : isReadOnly ? 'Approved' : id ? 'Update Quotation' : 'Save Quotation'}
              </button>

              {id && !isReadOnly && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleApproveQuotation}
                    className="w-full py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="w-full py-1.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-rose-200 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}

              {id && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversion Actions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleConvertToBill}
                      disabled={isConvertingBill}
                      className="py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[9px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isConvertingBill ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />} Bill
                    </button>
                    <button
                      onClick={handleConvertToInvoice}
                      disabled={isConvertingInvoice}
                      className="py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[9px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isConvertingInvoice ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Invoice
                    </button>
                  </div>
                  <button
                    onClick={handleConvertToWorkOrder}
                    disabled={isConvertingWorkOrder}
                    className="w-full py-1.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-[9px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConvertingWorkOrder ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Briefcase className="w-3 h-3" />} Convert To Work Order
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownload}
                  className="w-full py-1.5 bg-white border border-slate-100 text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-indigo-600" /> Download PDF
                </button>
                {id && (
                  <button
                    onClick={handleSendQuotation}
                    className="w-full py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3 text-indigo-600" /> Send Quotation
                  </button>
                )}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full py-1.5 bg-white border border-slate-100 text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-500" /> Send on WhatsApp
                </button>
                <button
                  onClick={handleEmailShare}
                  className="w-full py-1.5 bg-white border border-slate-100 text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3 text-blue-500" /> Send Email
                </button>
              </div>

              <button className="w-full mt-2 py-1.5 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-rose-500 transition-all flex items-center justify-center gap-1.5">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>

            {/* VERSION INFO */}
            <div className="text-center pt-4 opacity-30">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Infrapilot v1.0.0</p>
            </div>

          </div>

        </div>
      </PageTransition>


      <EditInvoiceItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        onSave={handleSaveItem}
      />

      <ImportEstimateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelect={handleImportQuotation}
      />

      <QuotationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        forceLocal={true}
        data={{
          id: id,
          invoiceNo: invoiceDetails.invoiceNo,
          date: invoiceDetails.date,
          projectName: projectDetails.name,
          projectType: projectDetails.type,
          engineerName: projectDetails.engineer,
          workOrderNo: projectDetails.workOrderNo,
          clientName: clientDetails.name,
          clientAddress: clientDetails.address,
          clientMobile: clientDetails.mobile,
          clientGst: clientDetails.gst,
          items: items,
          labourItems: labourItems,
          materialItems: materialItems,
          subTotal: subTotal,
          cgstRate: gstRates.cgst,
          sgstRate: gstRates.sgst,
          grandTotal: grandTotal,
          advancePaid: advancePaid,
          balanceDue: balanceDue,
          terms: terms
        }}
      />

      <PDFPreviewModal
        isOpen={isPDFModalOpen}
        onClose={() => {
          setIsPDFModalOpen(false);
          if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
        pdfUrl={pdfUrl}
        title={`Preview Quotation: ${invoiceDetails.invoiceNo || 'New'}`}
        onDownload={handleDownloadFromPreview}
      />

      {/* Action Confirmation Modals */}
      <ConfirmationModal
        isOpen={itemDeleteTarget !== null}
        onClose={() => setItemDeleteTarget(null)}
        onConfirm={confirmRemoveItem}
        isLoading={isDeletingItem}
        title="Remove Item"
        message="Are you sure you want to remove this item from the quotation?"
        confirmLabel="Remove"
        confirmClass="bg-rose-500 hover:bg-rose-600 shadow-rose-200"
      />

      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectQuotation}
        title="Reject Quotation"
      />

      <SelectContractorModal
        isOpen={isContractorModalOpen}
        onClose={() => {
          setIsContractorModalOpen(false);
          setPendingConversionType(null);
        }}
        onSelect={handleContractorSelect}
        projectId={selectedProjectId}
      />
    </>
  );
};

export default CreateDraftQuotationPage;
