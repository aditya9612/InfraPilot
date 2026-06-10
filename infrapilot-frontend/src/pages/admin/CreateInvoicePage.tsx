import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
import InvoicePreviewModal from "../../components/forms/InvoicePreviewModal";
import SelectContractorModal from "../../components/forms/SelectContractorModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import RejectReasonModal from "../../components/common/RejectReasonModal";
import EditInvoiceItemModal from "../../components/forms/EditInvoiceItemModal";
import ImportEstimateModal from "../../components/forms/ImportEstimateModal";
import logo from "../../assets/logo.png";
import type { Quotation } from "../../types/quotation";

interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

const CreateInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract clientId from query params
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromUrl = queryParams.get("clientId");
  const projectIdFromUrl = queryParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState(queryParams.get("tab") || "items");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
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
    if (id) {
      setIsPreviewLoading(true);
      try {
        const data = await quotationService.getQuotationPreview(Number(id));
        setPreviewData({
          clientName: data.client_name,
          clientAddress: data.billing_address || data.site_address,
          clientGst: data.gst_number,
          invoiceNo: data.quotation_no,
          date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          items: (data.items || []) as any[],
          labourItems: (data.labour_items || []) as any[],
          materialItems: (data.material_items || []) as any[],
          extraChargeItems: (data.extra_charge_items || []) as any[],
          subTotal: data.subtotal,
          grandTotal: data.grand_total,
          cgstRate: data.cgst_percent,
          sgstRate: data.sgst_percent,
          discount: data.discount_amount,
          advancePaid: data.advance_paid,
          balanceDue: data.balance_due,
        });
      } catch (err) {
        setPreviewData(null);
      } finally {
        setIsPreviewLoading(false);
        setIsPreviewOpen(true);
      }
    } else {
      setPreviewData(null);
      setIsPreviewOpen(true);
    }
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);

  // Form State
  const [clientDetails, setClientDetails] = useState({
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

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Soling", unit: "Brass", quantity: 0, rate: 0, amount: 0 },
    { id: "2", description: "Plum Concrete", unit: "Cum", quantity: 0, rate: 0, amount: 0 },
    { id: "3", description: "Stone Work", unit: "Brass", quantity: 0, rate: 0, amount: 0 }
  ]);

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
      updateItem("2", "quantity", m3);
    }
  }, [measurementData.plum.l, measurementData.plum.w, measurementData.plum.h]);

  // Calculate Stone Work
  useEffect(() => {
    const totalCuft = measurementData.stone.reduce((sum, s) => sum + (s.l * s.w * s.h), 0);
    const brass = Number((totalCuft / 100).toFixed(2));
    updateItem("3", "quantity", brass);
  }, [measurementData.stone]);

  useEffect(() => {
    // Auto-populate from project list when selectedProjectId changes.
    if (selectedProjectId !== 0) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        setProjectDetails({
          name: selectedProject.project_name || "",
          type: (selectedProject as any).project_type || "",
          siteAddress: (selectedProject as any).site_location || "",
          workOrderNo: (selectedProject as any).boq_no || "",
          engineer: (selectedProject as any).engineer_name || ""
        });

        // Also update project dates if available
        if (selectedProject.start_date || selectedProject.end_date) {
          setProjectStartEnd({
            start: selectedProject.start_date || "",
            end: selectedProject.end_date || ""
          });
        }

        // Auto-populate client details if the project has an owner/client
        if (selectedProject.owner_id && !clientIdFromUrl) {
          const fetchClient = async () => {
            try {
              const u = await userService.getUserById(selectedProject.owner_id);
              if (u) {
                setClientDetails({
                  name: u.full_name || "",
                  company: u.designation || "",
                  mobile: u.mobile_number || "",
                  email: u.email || "",
                  address: u.address || "",
                  gst: u.pan_number || ""
                });
              }
            } catch (error) {
              console.error("Failed to auto-populate client details from project owner", error);
            }
          };
          fetchClient();
        }
      }
    }
  }, [selectedProjectId, projects, id, clientIdFromUrl]);

  // Pre-populate project from URL if provided
  useEffect(() => {
    if (projectIdFromUrl && !id && projects.length > 0) {
      const pid = Number(projectIdFromUrl);
      if (pid !== selectedProjectId) {
        setSelectedProjectId(pid);
      }
    }
  }, [projectIdFromUrl, id, projects]);

  // Fetch Projects
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
  }, []);

  // Pre-populate client details if clientId is provided in URL
  useEffect(() => {
    if (clientIdFromUrl && !id) {
      const fetchClient = async () => {
        try {
          const u = await userService.getUserById(Number(clientIdFromUrl));
          if (u) {
            setClientDetails({
              name: u.full_name || "",
              company: u.designation || "", // Using designation as company placeholder
              mobile: u.mobile_number || "",
              email: u.email || "",
              address: u.address || "",
              gst: u.pan_number || "" // Using PAN as GST placeholder if not available
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
            account_holder_name: q.account_holder_name || "",
            account_number: q.account_number || "",
            ifsc_code: q.ifsc_code || "",
            due_date: q.due_date || ""
          });

          // Sync due_date into invoiceDetails (the Invoice Details card reads this field)
          if (q.due_date) {
            setInvoiceDetails(prev => ({ ...prev, dueDate: q.due_date || "" }));
          }

          // Set project dropdown to the project this quotation belongs to
          if (q.project_id) {
            setSelectedProjectId(q.project_id);
          }

          setLabourItems(q.labour_items || []);
          setMaterialItems(q.material_items || []);
          setExtraChargeItems(q.extra_charge_items || []);

          if (q.items && q.items.length > 0) {
            const mappedItems = q.items.map(item => ({
              id: String(item.id),
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
              })) : [{ l: 500, w: 0, h: 0, v: 0 }]
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

  const handleRemoveItem = async (itemId: string) => {
    if (items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setItemDeleteTarget(itemId);
  };

  const confirmRemoveItem = async () => {
    if (!itemDeleteTarget) return;
    setIsDeletingItem(true);
    if (id && !itemDeleteTarget.startsWith("new_")) {
      try {
        await quotationService.deleteQuotationItem(Number(itemDeleteTarget));
        toast.success("Item deleted from quotation");
      } catch (error) {
        toast.error("Failed to delete item from database");
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
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
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
          let measurements: any[] = [];
          if (String(item.id) === "1" || String(item.id) === "soling") {
            const { l, w, h } = measurementData.soling;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "ft" }];
            }
          } else if (String(item.id) === "2" || String(item.id) === "plum_concrete") {
            const { l, w, h } = measurementData.plum;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "m" }];
            }
          } else {
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          }

          return {
            item_type: (String(item.id) === "1" || String(item.id) === "soling") ? "soling" : (String(item.id) === "2" || String(item.id) === "plum_concrete") ? "plum_concrete" : "stone_work",
            title: item.description.split('\n')[0],
            description: item.description,
            unit: item.unit,
            rate: item.rate,
            measurements
          };
        }) : items.map(item => {
          let measurements: any[] = [];
          if (String(item.id) === "1") {
            const { l, w, h } = measurementData.soling;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "ft" }];
            }
          } else if (String(item.id) === "2") {
            const { l, w, h } = measurementData.plum;
            if (l > 0 || w > 0 || h > 0) {
              measurements = [{ length: l, width: w, height: h, unit: "m" }];
            }
          } else {
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          }

          return {
            item_type: String(item.id) === "1" ? "soling" : String(item.id) === "2" ? "plum_concrete" : "stone_work",
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
          let itemType = "stone_work";
          if (newItem.id.includes("soling")) {
            itemType = "soling";
            measurements = [{ length: measurementData.soling.l, width: measurementData.soling.w, height: measurementData.soling.h, unit: "ft" }];
          } else if (newItem.id.includes("plum")) {
            itemType = "plum_concrete";
            measurements = [{ length: measurementData.plum.l, width: measurementData.plum.w, height: measurementData.plum.h, unit: "m" }];
          } else {
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          }

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
          let itemType = "stone_work";
          if (String(existingItem.id) === "1" || String(existingItem.id).includes("soling")) {
            itemType = "soling";
            measurements = [{ length: measurementData.soling.l, width: measurementData.soling.w, height: measurementData.soling.h, unit: "ft" }];
          } else if (String(existingItem.id) === "2" || String(existingItem.id).includes("plum")) {
            itemType = "plum_concrete";
            measurements = [{ length: measurementData.plum.l, width: measurementData.plum.w, height: measurementData.plum.h, unit: "m" }];
          } else {
            measurements = measurementData.stone
              .filter(s => s.l > 0 || s.w > 0 || s.h > 0)
              .map(s => ({ length: s.l, width: s.w, height: s.h, unit: "ft" }));
          }

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

  // Implement Professional Direct Download (UltraTech Style)
  const handleDownload = async () => {
    toast.loading("Preparing UltraTech PDF...", { id: "pdf-gen" });
    setTimeout(() => {
      window.print();
      toast.success("PDF Download Ready", { id: "pdf-gen" });
    }, 500);
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
        toast.error("Failed to remove labour item from server");
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
        toast.error("Failed to remove material from server");
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
        toast.error("Failed to remove extra charge from server");
      }
    }
  };

  return (
    <>
      <Navbar
        title={id ? "View/Edit Quotation" : "Create Invoice / Estimate"}
        breadcrumb={["Dashboard", "Invoices", id ? "View Quotation" : "Create Invoice"]}
      />

      <PageTransition className="p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                {id ? "Quotation Intelligence" : "Invoice Details"}
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
              <p className="text-slate-500 text-sm font-medium">{id ? `Viewing/Editing Quotation #${id}` : "Create and customize professional invoices / estimates."}</p>
            </div>
            <div className="flex items-center gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* CLIENT DETAILS */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Client Details</h3>
                  <button className="ml-auto text-slate-400 hover:text-indigo-600 transition-colors">
                    <Building className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={clientDetails.name}
                      onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                      readOnly={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
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
              </div>

              {/* PROJECT DETAILS */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Project Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Name <span className="text-rose-500">*</span></label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <option value={0}>Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Type</label>
                    <select
                      value={projectDetails.type}
                      onChange={(e) => setProjectDetails({ ...projectDetails, type: e.target.value })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <option>Gravity Wall</option>
                      <option>Building Construction</option>
                      <option>Road Work</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Engineer In-Charge</label>
                    <input
                      type="text"
                      value={projectDetails.engineer}
                      onChange={(e) => setProjectDetails({ ...projectDetails, engineer: e.target.value })}
                      readOnly={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                      placeholder="e.g. Er. Tejas Dhande"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Site Address</label>
                    <input
                      type="text"
                      value={projectDetails.siteAddress}
                      onChange={(e) => setProjectDetails({ ...projectDetails, siteAddress: e.target.value })}
                      readOnly={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Work Order No.</label>
                    <input
                      type="text"
                      value={projectDetails.workOrderNo}
                      onChange={(e) => setProjectDetails({ ...projectDetails, workOrderNo: e.target.value })}
                      readOnly={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* INVOICE DETAILS */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Invoice Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invoice No.</label>
                    <input
                      type="text"
                      value={invoiceDetails.invoiceNo}
                      onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNo: e.target.value })}
                      readOnly={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invoice Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={invoiceDetails.date}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Terms</label>
                    <select
                      value={invoiceDetails.paymentTerms}
                      onChange={(e) => setInvoiceDetails({ ...invoiceDetails, paymentTerms: e.target.value })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <option>30 Days</option>
                      <option>15 Days</option>
                      <option>Due on Receipt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={invoiceDetails.dueDate}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
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
                      <th className="px-6 py-4 w-28">Unit</th>
                      <th className="px-6 py-4 w-32">Quantity</th>
                      <th className="px-6 py-4 w-40">Rate (₹)</th>
                      <th className="px-6 py-4 w-40">Amount (₹)</th>
                      <th className="px-6 py-4 w-32 text-center">Action</th>
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
                            className="w-full bg-transparent border-none text-sm font-bold text-slate-700 outline-none resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            disabled={isReadOnly}
                            className={`w-full bg-transparent border-none text-sm font-semibold text-slate-600 outline-none appearance-none cursor-pointer ${isReadOnly ? 'cursor-not-allowed' : ''}`}
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
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value))}
                            className="w-full bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value))}
                            className="w-full bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
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

            {/* BOTTOM SECTION: TABS & SUMMARY */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                {[
                  { id: "measurements", label: "Measurement Details", icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: "material", label: "Material Details", icon: <Briefcase className="w-3.5 h-3.5" /> },
                  { id: "labour", label: "Labour Details", icon: <User className="w-3.5 h-3.5" /> },
                  { id: "charges", label: "Extra Charges", icon: <PlusCircle className="w-3.5 h-3.5" /> },
                  { id: "tax", label: "Tax Details", icon: <FileText className="w-3.5 h-3.5" /> },
                  { id: "payment", label: "Payment Details", icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: "notes", label: "Notes", icon: <FileText className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                      ? "text-indigo-600 border-indigo-600 bg-indigo-50/20"
                      : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50"
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8 min-h-[280px]">
                {activeTab === "measurements" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Soling Measurement</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 font-mono">Enter Direct Quantity if L/W/H not applicable</span>
                        </div>
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">Quantity (Brass)</span>
                          <input
                            type="number"
                            value={items.find(i => i.id === "1")?.quantity || 0}
                            onChange={(e) => updateItem("1", "quantity", parseFloat(e.target.value))}
                            readOnly={isReadOnly}
                            className={`w-24 px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800 text-right outline-none focus:ring-2 focus:ring-indigo-200 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                          />
                        </div>
                        {/* Removed hardcoded rate badge */}
                      </div>
                    </div>

                    <div className="space-y-6 border-x border-slate-50 px-8">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Plum Concrete Measurement</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Length (ft)</label>
                          <input
                            type="number"
                            value={measurementData.plum.l}
                            onChange={(e) => setMeasurementData(p => ({ ...p, plum: { ...p.plum, l: parseFloat(e.target.value) || 0 } }))}
                            readOnly={isReadOnly}
                            className={`w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Width (ft)</label>
                          <input
                            type="number"
                            value={measurementData.plum.w}
                            onChange={(e) => setMeasurementData(p => ({ ...p, plum: { ...p.plum, w: parseFloat(e.target.value) || 0 } }))}
                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Height (ft)</label>
                          <input
                            type="number"
                            value={measurementData.plum.h}
                            onChange={(e) => setMeasurementData(p => ({ ...p, plum: { ...p.plum, h: parseFloat(e.target.value) || 0 } }))}
                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Cubic Feet (cu.ft)</p>
                          <p className="text-sm font-black text-slate-800">{measurementData.plum.cuft.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Cubic Meter (m³)</p>
                          <p className="text-sm font-black text-slate-800">{measurementData.plum.m3.toFixed(2)}</p>
                        </div>
                      </div>
                      {/* Removed hardcoded rate badge */}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Stone Work Measurement</h4>
                      </div>
                      <div className="space-y-3 mb-4">
                        {measurementData.stone.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-2">
                            <input
                              type="number"
                              value={row.l}
                              onChange={(e) => {
                                if (isReadOnly) return;
                                const newStone = [...measurementData.stone];
                                newStone[idx].l = parseFloat(e.target.value) || 0;
                                setMeasurementData({ ...measurementData, stone: newStone });
                              }}
                              readOnly={isReadOnly}
                              className={`p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-center ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                              placeholder="L"
                            />
                            <input
                              type="number"
                              value={row.w}
                              onChange={(e) => {
                                if (isReadOnly) return;
                                const newStone = [...measurementData.stone];
                                newStone[idx].w = parseFloat(e.target.value) || 0;
                                setMeasurementData({ ...measurementData, stone: newStone });
                              }}
                              readOnly={isReadOnly}
                              className={`p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-center ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                              placeholder="W"
                            />
                            <input
                              type="number"
                              value={row.h}
                              onChange={(e) => {
                                if (isReadOnly) return;
                                const newStone = [...measurementData.stone];
                                newStone[idx].h = parseFloat(e.target.value) || 0;
                                setMeasurementData({ ...measurementData, stone: newStone });
                              }}
                              readOnly={isReadOnly}
                              className={`p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-center ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                              placeholder="H"
                            />
                            <div className="flex items-center justify-between px-2 bg-emerald-50 rounded text-[10px] font-black text-emerald-700">
                              <span>={Number((row.l * row.w * row.h).toFixed(2))}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Brass (Volume/100)</span>
                          <span className="text-sm font-black text-emerald-600">
                            {(measurementData.stone.reduce((sum, s) => sum + s.l * s.w * s.h, 0) / 100).toFixed(2)} Brass
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-50 text-[9px] text-slate-400">
                          Formula: (L=500 x W x H) / 100
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "labour" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Labour Requirements</h4>
                      {!isReadOnly && (
                        <button
                          onClick={handleAddLabourRow}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add Labour Type
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <th className="pb-4">Skill Type</th>
                            <th className="pb-4">Count</th>
                            <th className="pb-4">Wage (₹)</th>
                            <th className="pb-4">Days</th>
                            <th className="pb-4">OT Hrs</th>
                            <th className="pb-4">OT Rate</th>
                            <th className="pb-4">Notes</th>
                            <th className="pb-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {labourItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-3">
                                <select
                                  value={item.skill_type}
                                  onChange={(e) => handleLabourFieldChange(idx, "skill_type", e.target.value)}
                                  disabled={isReadOnly}
                                  className={`w-full bg-slate-50 border-none text-sm font-bold p-2 rounded-lg outline-none appearance-none cursor-pointer ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-indigo-100'}`}
                                >
                                  <option value="">Select Type</option>
                                  {["Skilled", "Unskilled", "Semi-skilled", "Supervisor", "Operator", "Security", "Other"].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.labour_count}
                                  onChange={(e) => handleLabourFieldChange(idx, "labour_count", parseInt(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-20 bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.daily_wage}
                                  onChange={(e) => handleLabourFieldChange(idx, "daily_wage", parseInt(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-24 bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.labour_days}
                                  onChange={(e) => handleLabourFieldChange(idx, "labour_days", parseInt(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-20 bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.overtime_hours}
                                  onChange={(e) => handleLabourFieldChange(idx, "overtime_hours", parseFloat(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-16 bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                  placeholder="OT Hrs"
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.overtime_rate}
                                  onChange={(e) => handleLabourFieldChange(idx, "overtime_rate", parseFloat(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-20 bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                  placeholder="OT Rate"
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="text"
                                  value={item.notes || ""}
                                  onChange={(e) => handleLabourFieldChange(idx, "notes", e.target.value)}
                                  readOnly={isReadOnly}
                                  className={`w-full bg-slate-50 border-none text-sm font-bold p-2 rounded-lg ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                  placeholder="Notes"
                                />
                              </td>
                              <td className="py-3">
                                <button
                                  onClick={() => handleRemoveLabourRow(idx, item.id)}
                                  disabled={isReadOnly}
                                  className={`p-2 rounded-lg transition-all ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "material" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Material Estimates</h4>
                      <button
                        onClick={handleAddMaterialRow}
                        disabled={isReadOnly}
                        className={`flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-100'}`}
                      >
                        <Plus className="w-4 h-4" /> Add Material
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <th className="pb-4">Material Name</th>
                            <th className="pb-4">Unit</th>
                            <th className="pb-4">Quantity</th>
                            <th className="pb-4">Rate (₹)</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4">Notes</th>
                            <th className="pb-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {materialItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-3">
                                <input
                                  type="text"
                                  value={item.material_name}
                                  onChange={(e) => handleMaterialFieldChange(idx, "material_name", e.target.value)}
                                  readOnly={isReadOnly}
                                  className={`w-full bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400'}`}
                                />
                              </td>
                              <td className="py-3">
                                <select
                                  value={item.unit}
                                  onChange={(e) => handleMaterialFieldChange(idx, "unit", e.target.value)}
                                  disabled={isReadOnly}
                                  className={`w-24 bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none appearance-none cursor-pointer ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`}
                                >
                                  <option value="">Unit</option>
                                  {["Cum", "Sqm", "Rm", "Nos", "Kg", "Ton", "Sqft", "Brass", "Litre", "LS"].map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.estimated_quantity}
                                  onChange={(e) => handleMaterialFieldChange(idx, "estimated_quantity", parseFloat(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-24 bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400'}`}
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  value={item.estimated_rate}
                                  onChange={(e) => handleMaterialFieldChange(idx, "estimated_rate", parseFloat(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  className={`w-24 bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400'}`}
                                />
                              </td>
                              <td className="py-3">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleMaterialFieldChange(idx, "category", e.target.value)}
                                  disabled={isReadOnly}
                                  className={`w-full bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none appearance-none cursor-pointer ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`}
                                >
                                  <option value="">Select Category</option>
                                  {["Cement", "Sand", "Aggregate", "Steel", "Bricks", "Blocks", "Pipes", "Cables", "Paint", "Hardware", "Electrical", "Plumbing", "Other"].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3">
                                <input
                                  type="text"
                                  value={item.notes || ""}
                                  onChange={(e) => handleMaterialFieldChange(idx, "notes", e.target.value)}
                                  readOnly={isReadOnly}
                                  className={`w-full bg-white border border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'focus:border-indigo-400'}`}
                                  placeholder="Notes"
                                />
                              </td>
                              <td className="py-3">
                                <button
                                  onClick={() => handleRemoveMaterialRow(idx, item.id)}
                                  disabled={isReadOnly}
                                  className={`p-2 rounded-lg transition-all ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "charges" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Extra Charges / Expenses</h4>
                      <button
                        onClick={handleAddExtraChargeRow}
                        disabled={isReadOnly}
                        className={`flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold transition-all ${isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100"}`}
                      >
                        <Plus className="w-4 h-4" /> Add Charge
                      </button>
                    </div>
                    <div className="space-y-4">
                      {extraChargeItems.length > 0 && (
                        <div className="flex gap-4 items-center px-3 pb-1">
                          <div className="w-32 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</div>
                          <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</div>
                          <div className="w-20 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</div>
                          <div className="w-32 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</div>
                          <div className="w-8" />
                        </div>
                      )}
                      {extraChargeItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="w-32">
                            <select
                              value={item.expense_type}
                              onChange={(e) => handleExtraChargeFieldChange(idx, "expense_type", e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full bg-white border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <option value="transport">Transport</option>
                              <option value="loading">Loading</option>
                              <option value="unloading">Unloading</option>
                              <option value="misc">Miscellaneous</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleExtraChargeFieldChange(idx, "description", e.target.value)}
                              readOnly={isReadOnly}
                              placeholder="Description"
                              className={`w-full bg-white border-slate-200 text-sm font-bold p-2 rounded-lg outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          </div>
                          <div className="w-20">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleExtraChargeFieldChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                              readOnly={isReadOnly}
                              placeholder="Qty"
                              className={`w-full bg-white border-slate-200 text-sm font-black p-2 rounded-lg outline-none text-center ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleExtraChargeFieldChange(idx, "rate", parseFloat(e.target.value) || 0)}
                              readOnly={isReadOnly}
                              placeholder="Amount"
                              className={`w-full bg-white border-slate-200 text-sm font-black p-2 rounded-lg outline-none text-right ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveExtraChargeRow(idx, item.id)}
                            disabled={isReadOnly}
                            className={`p-2 rounded-lg transition-all ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-rose-500 hover:bg-white'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "tax" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4 text-indigo-600">GST Breakdown Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total GST (%)</label>
                          <input
                            type="number"
                            value={gstRates.gst}
                            onChange={(e) => setGstRates({ ...gstRates, gst: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CGST (%)</label>
                            <input
                              type="number"
                              value={gstRates.cgst}
                              onChange={(e) => setGstRates({ ...gstRates, cgst: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SGST (%)</label>
                            <input
                              type="number"
                              value={gstRates.sgst}
                              onChange={(e) => setGstRates({ ...gstRates, sgst: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                            />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TDS (%)</label>
                          <input
                            type="number"
                            value={gstRates.tds}
                            onChange={(e) => setGstRates({ ...gstRates, tds: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4 text-emerald-600">Project Timeline</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Site Start Date</label>
                          <input
                            type="date"
                            value={projectStartEnd.start}
                            onChange={(e) => setProjectStartEnd({ ...projectStartEnd, start: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Est. Completion Date</label>
                          <input
                            type="date"
                            value={projectStartEnd.end}
                            onChange={(e) => setProjectStartEnd({ ...projectStartEnd, end: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "payment" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4 text-indigo-600">Bank / Payment Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name</label>
                          <input
                            type="text"
                            value={paymentDetails.bank_name}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, bank_name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">IFSC Code</label>
                          <input
                            type="text"
                            value={paymentDetails.ifsc_code}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, ifsc_code: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Number</label>
                        <input
                          type="text"
                          value={paymentDetails.account_number}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, account_number: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none font-mono tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">UPI ID</label>
                        <input
                          type="text"
                          value={paymentDetails.upi_id}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, upi_id: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4 text-emerald-600">Company Details on Quotation</h4>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Holder Name</label>
                        <input
                          type="text"
                          value={paymentDetails.account_holder_name}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, account_holder_name: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company Name on Quote</label>
                        <input
                          type="text"
                          value={clientDetails.company}
                          onChange={(e) => setClientDetails({ ...clientDetails, company: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                          placeholder="Patil Construction Pvt Ltd"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                        <input
                          type="date"
                          value={paymentDetails.due_date || ""}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, due_date: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="Add any specific notes for this quotation..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</label>
                      <textarea
                        rows={4}
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="Add terms and conditions..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === "signature" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-6 flex-wrap">
                      <div className="flex-1 min-w-[240px] space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upload Signature Image</label>
                          <p className="text-xs text-slate-400 mb-4">Upload a PNG/JPEG signature to be printed on this quotation. Transparent PNGs look best.</p>
                        </div>
                        <div
                          onClick={() => !isReadOnly && signatureInputRef.current?.click()}
                          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all min-h-[140px] ${isReadOnly ? "border-slate-100 bg-slate-50 cursor-not-allowed" : "border-slate-200 bg-slate-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30"}`}
                        >
                          {signatureImage ? (
                            <img src={signatureImage} alt="Signature Preview" className="max-h-24 w-auto object-contain" />
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                <Edit3 className="w-6 h-6 text-indigo-400" />
                              </div>
                              <p className="text-sm font-bold text-slate-500">Click to upload signature</p>
                              <p className="text-xs text-slate-400 mt-1">PNG, JPEG · Max 2MB</p>
                            </>
                          )}
                        </div>
                        <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSignatureUpload} disabled={isReadOnly} />
                        {signatureImage && !isReadOnly && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => signatureInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
                              <Edit3 className="w-3.5 h-3.5" /> Change
                            </button>
                            <button onClick={() => setSignatureImage(null)} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">
                              <X className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-64 shrink-0">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preview on Quotation</label>
                        <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                          <p className="text-[10px] font-black text-slate-900 uppercase mb-3">For {clientDetails.company || "Your Company"}</p>
                          <div className="h-16 border-b border-slate-200 flex items-end justify-center pb-2 mb-2">
                            {signatureImage ? (
                              <img src={signatureImage} alt="Sig" className="max-h-12 w-auto object-contain opacity-80" />
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">No signature uploaded</span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-600 uppercase text-center tracking-widest">Authorized Signatory</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-indigo-50/30 border-t border-slate-100 flex items-center gap-2">
                <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                  <Clock className="w-3 h-3" />
                </div>
                {/* Removed hardcoded conversion note */}
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
            <div className="space-y-3">
              <button
                onClick={handlePreviewModalOpen}
                disabled={isPreviewLoading}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-wait"
              >
                {isPreviewLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Eye className="w-5 h-5 group-hover:animate-pulse" />
                )}
                {isPreviewLoading ? 'GENERATING PREVIEW...' : 'PREVIEW INVOICE'}
              </button>
              <button
                onClick={handleSaveQuotation}
                disabled={isSaving || isReadOnly}
                className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3 ${isSaving || isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95'}`}
              >
                <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} /> {isSaving ? 'Saving...' : isReadOnly ? 'Approved' : id ? 'Update Quotation' : 'Save Quotation'}
              </button>

              {id && !isReadOnly && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleApproveQuotation}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="w-full py-3.5 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {id && (
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Actions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleConvertToBill}
                      disabled={isConvertingBill}
                      className="py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConvertingBill ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />} Bill
                    </button>
                    <button
                      onClick={handleConvertToInvoice}
                      disabled={isConvertingInvoice}
                      className="py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConvertingInvoice ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Invoice
                    </button>
                  </div>
                  <button
                    onClick={handleConvertToWorkOrder}
                    disabled={isConvertingWorkOrder}
                    className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConvertingWorkOrder ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Briefcase className="w-3 h-3" />} Convert To Work Order
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-indigo-600" /> Download PDF
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> Send on WhatsApp
                </button>
                <button
                  onClick={handleEmailShare}
                  className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-blue-500" /> Send Email
                </button>
              </div>

              <button className="w-full py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-rose-500 transition-all flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>

            {/* VERSION INFO */}
            <div className="text-center pt-4 opacity-30">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Infrapilot v1.0.0</p>
            </div>

          </div>

        </div>
      </PageTransition>

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData ? previewData : {
          clientName: clientDetails.name,
          clientAddress: clientDetails.address,
          clientGst: clientDetails.gst,
          invoiceNo: invoiceDetails.invoiceNo,
          date: invoiceDetails.date,
          items: items,
          labourItems: [],
          materialItems: [],
          extraChargeItems: [],
          subTotal: subTotal,
          grandTotal: grandTotal,
          cgstRate: gstRates.cgst,
          sgstRate: gstRates.sgst,
          discount: discount,
          advancePaid: advancePaid,
          balanceDue: balanceDue,
        }}
      />

      <EditInvoiceItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        onSave={handleSaveItem}
      />

      {/* PORTAL FOR PERFECT PRINTING (ULTRATECH STYLE) */}
      {createPortal(
        <div id="ultra-tech-print-zone" className="fixed inset-0 bg-white z-[-1] invisible pointer-events-none opacity-0 
              print:visible print:static print:z-[999999] print:opacity-100 print:block p-0 m-0">
          <div className="bg-white p-8 max-w-[210mm] mx-auto font-serif">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">InfraPilot</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Construction & Infrastructure</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-6 py-2 text-sm font-black uppercase tracking-[0.2em] mb-4">Tax Invoice</div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">GSTIN: 27AAACL6442L1ZA</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 mb-6 font-mono">
              <div className="bg-white p-4">
                <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200 mb-3 uppercase">Recipient Details</h4>
                <p className="text-xs font-black text-slate-900 uppercase mb-1">{clientDetails.name || "Sandeep Sir"}</p>
                <p className="text-[10px] text-slate-600 mb-2">{clientDetails.address || "Indore, MP"}</p>
                <p className="text-[10px] font-bold text-slate-800">GSTIN: {clientDetails.gst || "23ABCDE1234F1Z5"}</p>
              </div>
              <div className="bg-white p-4 text-right">
                <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200 mb-3 uppercase text-right">Invoice Info</h4>
                <p className="text-[10px] text-slate-400">Invoice No: <span className="font-black text-slate-900">{invoiceDetails.invoiceNo}</span></p>
                <p className="text-[10px] text-slate-400">Date: <span className="font-black text-slate-900">{invoiceDetails.date}</span></p>
                <p className="text-[10px] text-slate-400">Place: <span className="font-black text-slate-900 uppercase">Madhya Pradesh</span></p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-slate-900 mb-6 text-[11px]">
              <thead>
                <tr className="bg-slate-50 uppercase font-black border-b border-slate-900">
                  <th className="border border-slate-900 p-2 text-center w-12">Sr.</th>
                  <th className="border border-slate-900 p-2 text-left">Description</th>
                  <th className="border border-slate-900 p-2 text-center w-20">Qty</th>
                  <th className="border border-slate-900 p-2 text-right w-24">Rate (₹)</th>
                  <th className="border border-slate-900 p-2 text-center w-16">Unit</th>
                  <th className="border border-slate-900 p-2 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="font-bold text-slate-700">
                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-2 whitespace-pre-line">{item.description}</td>
                    <td className="border border-slate-900 p-2 text-center">{item.quantity}</td>
                    <td className="border border-slate-900 p-2 text-right">{item.rate.toLocaleString()}</td>
                    <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
                    <td className="border border-slate-900 p-2 text-right font-black text-slate-900">{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                  <tr key={i} className="h-8">
                    <td className="border border-slate-900"></td>
                    <td className="border border-slate-900"></td>
                    <td className="border border-slate-900"></td>
                    <td className="border border-slate-900"></td>
                    <td className="border border-slate-900"></td>
                    <td className="border border-slate-900"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan={5} className="p-2 text-right uppercase tracking-[0.2em]">Total basic value</td>
                  <td className="p-2 text-right">₹{subTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {/* Summary Footer */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total in Words:</p>
                <p className="text-[10px] font-black uppercase leading-tight">{toWords(grandTotal)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Taxable Value</span>
                  <span className="font-black text-slate-800">₹{subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">CGST ({gstRates.cgst}%)</span>
                  <span className="font-black text-slate-800">₹{cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">SGST ({gstRates.sgst}%)</span>
                  <span className="font-black text-slate-800">₹{sgst.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span className="font-bold">Discount</span>
                    <span className="font-black">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                {advancePaid > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span className="font-bold">Advance Paid</span>
                    <span className="font-black">₹{advancePaid.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-tighter">
                    {advancePaid > 0 ? "Balance Due" : "Final Net Amount"}
                  </span>
                  <span className="text-xl font-black text-slate-900">₹{balanceDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t-2 border-slate-900 pt-8 flex justify-between items-end">
              <div>
                <p className="text-[8px] text-slate-400">This is a computer generated invoice.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black mb-12 uppercase text-slate-900">For InfraPilot Pvt Ltd</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-black uppercase">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @media print {
          /* Hide the main application root entirely */
          #root { 
            display: none !important; 
            visibility: hidden !important; 
          }
          
          /* Show specifically our print zone */
          #ultra-tech-print-zone {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999999 !important;
          }

          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <ImportEstimateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelect={handleImportQuotation}
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

export default CreateInvoicePage;
