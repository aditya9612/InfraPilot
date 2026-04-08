import DashboardLayout from "../../../components/common/DashboardLayout";
import Navbar from "../../../components/common/Navbar";

const invoices = [
  { 
    invoiceNumber: "INV-2026-42", 
    bill: "BL-9942", 
    date: "28 Mar 2026", 
    workDescription: "Phase 3 Slab Reinforcement & Shuttering", 
    amount: "₹32,54,237", 
    gst: "₹5,85,763", 
    totalAmount: "₹38,40,000", 
    paidAmount: "₹38,40,000", 
    pendingAmount: "₹0", 
    status: "Paid", 
    dueDate: "05 Apr 2026" 
  },
  { 
    invoiceNumber: "INV-2026-41", 
    bill: "BL-9941", 
    date: "05 Mar 2026", 
    workDescription: "Labour & Mobilization — Floor 3", 
    amount: "₹10,16,949", 
    gst: "₹1,83,051", 
    totalAmount: "₹12,00,000", 
    paidAmount: "₹12,00,000", 
    pendingAmount: "₹0", 
    status: "Paid", 
    dueDate: "12 Mar 2026" 
  },
  { 
    invoiceNumber: "INV-2026-40", 
    bill: "BL-9940", 
    date: "20 Feb 2026", 
    workDescription: "Variation: Steel Price Surge Adjustment", 
    amount: "₹16,94,915", 
    gst: "₹3,05,085", 
    totalAmount: "₹20,00,000", 
    paidAmount: "₹5,00,000", 
    pendingAmount: "₹15,00,000", 
    status: "Partially Paid", 
    dueDate: "01 Mar 2026" 
  },
  { 
    invoiceNumber: "INV-2026-39", 
    bill: "BL-9939", 
    date: "15 Feb 2026", 
    workDescription: "RCC Casting — 3rd Floor Slab", 
    amount: "₹38,13,559", 
    gst: "₹6,86,441", 
    totalAmount: "₹45,00,000", 
    paidAmount: "₹45,00,000", 
    pendingAmount: "₹0", 
    status: "Paid", 
    dueDate: "22 Feb 2026" 
  },
];

const ClientInvoicesPage = () => (
  <DashboardLayout>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Invoices"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Invoices</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Track all project-related invoices and their detailed breakdown</p>
      </div>

      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Budget", value: "₹8,20,00,000", color: "bg-blue-600", text: "text-white" },
          { label: "Total Spent", value: "₹5,30,00,000", color: "bg-white", text: "text-slate-800 border border-slate-100 shadow-sm" },
          { label: "Remaining Budget", value: "₹2,90,00,000", color: "bg-emerald-50", text: "text-emerald-700 border border-emerald-100 shadow-sm" },
        ].map((item, i) => (
          <div key={i} className={`${item.color} ${item.text} rounded-3xl p-8 transition-transform hover:scale-[1.02] duration-300`}>
             <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${item.label === 'Total Budget' ? 'text-blue-100' : 'text-slate-400 font-black'}`}>{item.label}</p>
             <p className="text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Awaiting & Recent Invoices</h2>
           <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Download All (CSV)</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 pl-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Inv. Number / Bill</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / Due Date</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Description</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Base Amount</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">GST (18%)</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Pending</th>
                <th className="p-4 pr-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-8 whitespace-nowrap">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{inv.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{inv.bill}</p>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <p className="text-xs font-bold text-slate-700">{inv.date}</p>
                    <p className="text-[9px] text-red-400 font-black mt-0.5 uppercase tracking-widest">Due: {inv.dueDate}</p>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-xs font-bold text-slate-600 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:absolute group-hover:bg-white group-hover:p-2 group-hover:shadow-xl group-hover:rounded-lg group-hover:z-10">{inv.workDescription}</p>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-600 text-right">{inv.amount}</td>
                  <td className="p-4 text-xs font-bold text-slate-600 text-right">{inv.gst}</td>
                  <td className="p-4 text-sm font-black text-slate-800 text-right">{inv.totalAmount}</td>
                  <td className="p-4 text-xs font-bold text-emerald-600 text-right">{inv.paidAmount}</td>
                  <td className="p-4 text-xs font-bold text-red-600 text-right">{inv.pendingAmount}</td>
                  <td className="p-4 pr-8 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                      inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ClientInvoicesPage;
