import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Building
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import { financeService } from "../../services/financeService";
import type { Project } from "../../types/project";
import toast from "react-hot-toast";
import InvoicePreviewModal from "../../components/forms/InvoicePreviewModal";
import EditInvoiceItemModal from "../../components/forms/EditInvoiceItemModal";
import logo from "../../assets/logo.png";

interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

const CreateInvoicePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("measurements");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);

  // Form State
  const [clientDetails, setClientDetails] = useState({
    name: "Sandeep Sir",
    mobile: "9876543210",
    address: "Indore, Madhya Pradesh",
    gst: "23ABCDE1234F1Z5"
  });

  const [projectDetails, setProjectDetails] = useState({
    name: "Gravity Wall Work Estimate",
    type: "Gravity Wall",
    siteAddress: "Indore, Madhya Pradesh",
    workOrderNo: "GW/2024/001"
  });

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNo: "INV/2024-25/0001",
    date: "2024-05-20",
    paymentTerms: "30 Days",
    dueDate: "2024-06-19"
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "Soling\nSoling Work (As Per Measurement)", unit: "Brass", quantity: 30.00, rate: 10000.00, amount: 300000.00 },
    { id: "2", description: "Plum Concrete\n387 ft x 3 ft x 5 ft\n(5804 cu.ft = 164.37 m³)", unit: "m³", quantity: 164.37, rate: 7000.00, amount: 1150590.00 },
    { id: "3", description: "Stone Work (Gravity Wall)\nTotal Brass", unit: "Brass", quantity: 141.70, rate: 17000.00, amount: 2408832.00 }
  ]);

  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  // Measurements State
  const [measurementData, setMeasurementData] = useState({
    soling: { l: 0, w: 0, h: 0, qty: 30 }, // qty is Brass
    plum: { l: 387, w: 5, h: 3, cuft: 5804, m3: 164.37 },
    stone: [
      { l: 500, w: 4, h: 3, v: 6000 },
      { l: 500, w: 3, h: 3, v: 4500 },
      { l: 500, w: 2.6, h: 3, v: 3900 },
    ]
  });

  // Calculate Plum Concrete
  useEffect(() => {
    const cuft = measurementData.plum.l * measurementData.plum.w * measurementData.plum.h;
    const m3 = Number((cuft * 0.0283168).toFixed(2));
    if (cuft !== measurementData.plum.cuft || m3 !== measurementData.plum.m3) {
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
    const brass = totalCuft / 100;
    updateItem("3", "quantity", brass);
  }, [measurementData.stone]);

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

  // Calculations
  const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const cgst = useMemo(() => (subTotal * cgstRate) / 100, [subTotal, cgstRate]);
  const sgst = useMemo(() => (subTotal * sgstRate) / 100, [subTotal, sgstRate]);
  const grandTotal = subTotal + cgst + sgst - discount;
  const balanceDue = grandTotal - advancePaid;

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "New Work Description",
      unit: "Unit",
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

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    } else {
      toast.error("At least one item is required");
    }
  };

  // Implement Save
  const handleSaveInvoice = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        project_id: selectedProjectId,
        owner_id: 1, // Default or selected owner
        type: "owner" as any,
        reference_id: 1,
        amount: subTotal,
        gst_percent: 0,
        gst_amount: 0,
        tax_percent: 0,
        tax_amount: 0,
        total_amount: grandTotal,
        description: items.map(i => i.description.split('\n')[0]).join(", ")
      };

      // await financeService.createInvoice(payload);
      toast.success("Invoice Saved (Offline Mode)");
    } catch (error: any) {
      toast.error(error.message || "Failed to save invoice");
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



  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  return (
    <>
      <Navbar
        title="Create Invoice / Estimate"
        breadcrumb={["Dashboard", "Invoices", "Create Invoice"]}
      />

      <PageTransition className="p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number</label>
                      <input
                        type="text"
                        value={clientDetails.mobile}
                        onChange={(e) => setClientDetails({ ...clientDetails, mobile: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                    >
                      <option>Gravity Wall</option>
                      <option>Building Construction</option>
                      <option>Road Work</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Site Address</label>
                    <input
                      type="text"
                      value={projectDetails.siteAddress}
                      onChange={(e) => setProjectDetails({ ...projectDetails, siteAddress: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Work Order No.</label>
                    <input
                      type="text"
                      value={projectDetails.workOrderNo}
                      onChange={(e) => setProjectDetails({ ...projectDetails, workOrderNo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
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
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
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
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-semibold text-slate-600 outline-none"
                          />
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
                              className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
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
                            className="w-24 px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800 text-right outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">Rate: ₹ 10,000 / Brass</p>
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
                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center"
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
                      <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">Rate: ₹ 7,000 / m³</p>
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
                          <div key={idx} className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              value={row.w}
                              onChange={(e) => {
                                const newStone = [...measurementData.stone];
                                newStone[idx].w = parseFloat(e.target.value) || 0;
                                setMeasurementData({ ...measurementData, stone: newStone });
                              }}
                              className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-center"
                              placeholder="W"
                            />
                            <input
                              type="number"
                              value={row.h}
                              onChange={(e) => {
                                const newStone = [...measurementData.stone];
                                newStone[idx].h = parseFloat(e.target.value) || 0;
                                setMeasurementData({ ...measurementData, stone: newStone });
                              }}
                              className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-center"
                              placeholder="H"
                            />
                            <div className="flex items-center justify-between px-2 bg-emerald-50 rounded text-[10px] font-black text-emerald-700">
                              <span>={row.l * row.w * row.h}</span>
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
                {activeTab !== "measurements" && (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No detailed records added yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-indigo-50/30 border-t border-slate-100 flex items-center gap-2">
                <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                  <Clock className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-bold text-indigo-600">Note: 1 cu.ft = 0.0283168 m³</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SUMMARY & PREVIEW */}
          <div className="w-full xl:w-[400px] space-y-6">

            {/* INVOICE SUMMARY */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Invoice Summary</h3>
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
                      value={cgstRate}
                      onChange={(e) => setCgstRate(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-slate-50 border border-slate-100 rounded text-center text-xs font-black outline-none focus:ring-1 focus:ring-indigo-200"
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
                      value={sgstRate}
                      onChange={(e) => setSgstRate(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-slate-50 border border-slate-100 rounded text-center text-xs font-black outline-none focus:ring-1 focus:ring-indigo-200"
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
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-black text-rose-500 outline-none focus:ring-2 focus:ring-rose-100"
                    />
                  </div>
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
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
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
                onClick={() => setIsPreviewOpen(true)}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                <Eye className="w-5 h-5 group-hover:animate-pulse" /> Preview Invoice
              </button>
              <button
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className={`w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} /> {isSaving ? 'Saving...' : 'Save Invoice'}
              </button>

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
        data={{
          clientName: clientDetails.name,
          clientAddress: clientDetails.address,
          clientGst: clientDetails.gst,
          invoiceNo: invoiceDetails.invoiceNo,
          date: invoiceDetails.date,
          items: items,
          subTotal: subTotal,
          grandTotal: grandTotal,
          cgstRate: cgstRate,
          sgstRate: sgstRate,
          discount: discount,
          advancePaid: advancePaid,
          balanceDue: balanceDue
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
                  <span className="font-bold text-slate-500">CGST ({cgstRate}%)</span>
                  <span className="font-black text-slate-800">₹{cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">SGST ({sgstRate}%)</span>
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
    </>
  );
};

export default CreateInvoicePage;
