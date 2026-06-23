import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";

import toast from "react-hot-toast";

const ClientApprovedApprovalsPage = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('https://infrapilot.in/api/v1/invoices');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Approved Approvals" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
        <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
          <p className="text-slate-600">Loading approved approvals...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Approved Approvals" breadcrumb={["InfraPilot", "Client", "Approvals", "Approved"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-6">Approved Approvals</h1>
        {invoices.length === 0 ? (
  <p className="text-slate-500">No invoices found.</p>
) : (
  <div className="space-y-6">
    {invoices.map((inv, i) => (
      <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-black uppercase text-slate-400">{inv.type}</span>
          <span className="text-xs text-slate-400">ID: {inv.id}</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{inv.description}</h2>
        <p className="text-slate-600">Amount: {inv.amount} (Total: {inv.total_amount})</p>
        <p className="mt-2 text-sm text-slate-500">Status: {inv.status} | Created: {new Date(inv.created_at).toLocaleDateString()}</p>
      </div>
    ))}
  </div>
)}
      </div>
    </>
  );
};

export default ClientApprovedApprovalsPage;
