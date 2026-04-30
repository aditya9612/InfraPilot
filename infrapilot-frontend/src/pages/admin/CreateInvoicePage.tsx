import React, { useState, useEffect, useMemo } from "react";
import { 
  User, 
  Briefcase, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Download, 
  Send, 
  Share2, 
  X,
  Eye,
  Save,
  MessageCircle,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Building
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import type { Project } from "../../types/project";
import toast from "react-hot-toast";

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
  const [activeTab, setActiveTab] = useState("measurements");
  
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

  const [advancePaid, setAdvancePaid] = useState(0);
  const [discount, setDiscount] = useState(0);

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
  const cgst = 0;
  const sgst = 0;
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

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    } else {
      toast.error("At least one item is required");
    }
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
      <Navbar title="Create Invoice / Estimate" breadcrumb={["Dashboard", "Invoices", "Create Invoice"]} />
      
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
                      onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number</label>
                      <input 
                        type="text" 
                        value={clientDetails.mobile}
                        onChange={(e) => setClientDetails({...clientDetails, mobile: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billing Address</label>
                    <textarea 
                      rows={1}
                      value={clientDetails.address}
                      onChange={(e) => setClientDetails({...clientDetails, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">GST Number (Optional)</label>
                    <input 
                      type="text" 
                      value={clientDetails.gst}
                      onChange={(e) => setClientDetails({...clientDetails, gst: e.target.value})}
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
                    <input 
                      type="text" 
                      value={projectDetails.name}
                      onChange={(e) => setProjectDetails({...projectDetails, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Type</label>
                    <select 
                      value={projectDetails.type}
                      onChange={(e) => setProjectDetails({...projectDetails, type: e.target.value})}
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
                      onChange={(e) => setProjectDetails({...projectDetails, siteAddress: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Work Order No.</label>
                    <input 
                      type="text" 
                      value={projectDetails.workOrderNo}
                      onChange={(e) => setProjectDetails({...projectDetails, workOrderNo: e.target.value})}
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
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNo: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invoice Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={invoiceDetails.date}
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Terms</label>
                    <select 
                      value={invoiceDetails.paymentTerms}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, paymentTerms: e.target.value})}
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
                        onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
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
                            <button className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors">
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
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                      activeTab === tab.id 
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
                           <span className="text-xs font-bold text-slate-500">Length (ft)</span>
                           <span className="text-xs font-bold text-slate-400">-</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-500">Width (ft)</span>
                           <span className="text-xs font-bold text-slate-400">-</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-500">Thickness (ft)</span>
                           <span className="text-xs font-bold text-slate-400">-</span>
                         </div>
                         <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                           <span className="text-xs font-black text-slate-800">Quantity (Brass)</span>
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800">30.00</span>
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
                           <input type="text" value="387" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center" />
                         </div>
                         <div>
                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Width (ft)</label>
                           <input type="text" value="3" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center" />
                         </div>
                         <div>
                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Height (ft)</label>
                           <input type="text" value="5" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Cubic Feet (cu.ft)</p>
                            <p className="text-sm font-black text-slate-800">5804.00</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Cubic Meter (m³)</p>
                            <p className="text-sm font-black text-slate-800">164.37</p>
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
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Total Brass</span>
                            <span className="text-xs font-black text-slate-800">141.70</span>
                         </div>
                         <div className="pt-2 border-t border-slate-50">
                           <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg inline-block">Rate: ₹ 17,000 / Brass</p>
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
                  <span className="font-bold text-slate-500">CGST (0%)</span>
                  <span className="font-black text-slate-800">₹ 0.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">SGST (0%)</span>
                  <span className="font-black text-slate-800">₹ 0.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Discount</span>
                  <span className="font-black text-slate-800 text-rose-500">₹ 0.00</span>
                </div>
                
                <div className="py-4 border-y border-slate-100 my-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Grand Total</span>
                     <span className="text-xl font-black text-indigo-600">₹ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Advance Paid</span>
                  <span className="font-black text-slate-800">₹ 0.00</span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between mt-6">
                   <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Balance Due</span>
                   <span className="text-lg font-black text-emerald-600">₹ {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              <button className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group">
                <Eye className="w-5 h-5 group-hover:animate-pulse" /> Preview Invoice
              </button>
              <button 
                onClick={() => toast.success("Invoice Saved Successfully!")}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" /> Save Invoice
              </button>
              
              <div className="grid grid-cols-1 gap-3">
                <button className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" /> Download PDF
                </button>
                <button className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> Send on WhatsApp
                </button>
                <button className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
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
    </>
  );
};

export default CreateInvoicePage;
