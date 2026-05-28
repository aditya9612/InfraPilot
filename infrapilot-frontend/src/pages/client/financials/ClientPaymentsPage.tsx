import { useState, useEffect, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import { paymentService } from "../../../services/paymentService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const ClientPaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: any;
    liability: any[];
    velocity: any[];
    history: any[];
    fiscal: any;
    momentum: any;
    aggregate: any;
  }>({
    stats: null,
    liability: [],
    velocity: [],
    history: [],
    fiscal: null,
    momentum: null,
    aggregate: null
  });

  const { projectId } = useClientProjectId();

  const fetchAllData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [
        stats,
        liability,
        velocity,
        history,
        fiscal,
        momentum,
        aggregate
      ] = await Promise.all([
        paymentService.getPayrollStats(projectId),
        paymentService.getContractorLiability(projectId),
        paymentService.getWeeklyVelocity(projectId),
        paymentService.getDisbursementHistory(projectId),
        paymentService.getFiscalSummary(projectId),
        paymentService.getPayrollMomentum(projectId),
        paymentService.getAggregatePayrollReport(projectId)
      ]);

      setData({
        stats,
        liability: Array.isArray(liability) ? liability : [],
        velocity: Array.isArray(velocity) ? velocity : [],
        history: Array.isArray(history) ? history : [],
        fiscal,
        momentum,
        aggregate
      });
    } catch (err) {
      console.error("Failed to fetch payment analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleDownloadAggregate = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const blob = await paymentService.exportAggregatePayrollPDF(projectId);
      
      // Check if blob is valid and not an error JSON
      if (blob.size < 500) {
        const text = await blob.text();
        if (text.includes("error") || text.includes("message")) {
          throw new Error(text);
        }
      }

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payroll_Aggregate_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err: any) {
      console.error("PDF Download Failure:", err);
      const status = err.response?.status;
      const message = status === 404 ? "Export endpoint not found (404). Check API path." : `Export failed (${status || 'Network Error'}).`;
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFiscal = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const blob = await paymentService.exportFiscalSummaryExcel(projectId);

      // Check if blob is valid and not an error JSON
      if (blob.size < 500) {
        const text = await blob.text();
        if (text.includes("error") || text.includes("message")) {
          throw new Error(text);
        }
      }

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Fiscal_Payroll_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err: any) {
      console.error("Excel Download Failure:", err);
      const status = err.response?.status;
      const message = status === 404 ? "Export endpoint not found (404). Check API path." : `Excel export failed (${status || 'Network Error'}).`;
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading && !data.stats) {
    return (
      <>
        <Navbar title="Financial Transparency" breadcrumb={["InfraPilot", "Client", "Financials", "Payroll"]} />
        <div className="p-12 h-[80vh] flex flex-col items-center justify-center gap-4 bg-slate-50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Aggregating Fiscal Records...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Disbursement Analytics" breadcrumb={["InfraPilot", "Client", "Financials", "Payroll"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial Disbursements</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Project Payroll, Contractor Liabilities & Fiscal Momentum</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadAggregate}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Aggregate PDF
            </button>
            <div className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${data.momentum?.trend === 'down' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {data.momentum?.label || "Stable Volume"}
            </div>
            <button onClick={fetchAllData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
               <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Disbursed</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(data.aggregate?.total_disbursed)}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600">+{data.stats?.period_change || 0}%</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase">vs prev. month</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Liability</p>
            <p className="text-2xl font-black text-orange-600">{formatCurrency(data.aggregate?.total_liability)}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">Awaiting disbursement</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Contractors</p>
            <p className="text-2xl font-black text-slate-800">{data.stats?.active_contractors || 0}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">Reporting payroll</p>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-200">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Avg Weekly Run</p>
            <p className="text-2xl font-black text-white">{formatCurrency(data.velocity?.[data.velocity.length-1]?.amount || 0)}</p>
            <p className="text-[10px] font-medium text-blue-200 mt-2 uppercase tracking-wide">Current Velocity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Main Chart */}
          <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Disbursement Velocity</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Payroll Trend</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> Payout
                </span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.velocity}>
                  <defs>
                    <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 900, marginBottom: '4px'}}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPayout)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Contractor Liability */}
          <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Contractor Exposure</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {data.liability.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-100">
                      {item.contractor?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 tracking-tight group-hover:text-blue-600 transition-colors">{item.contractor}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.worker_count} Workers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800 tracking-tight">{formatCurrency(item.amount)}</p>
                    <p className={`text-[10px] font-black uppercase ${item.status === 'urgent' ? 'text-orange-500' : 'text-slate-300'}`}>
                      {item.status || 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 mt-6 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 active:scale-95">
              Full Liability Report
            </button>
          </div>
        </div>

        {/* disbursement History */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Disbursement Log</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">Filter By Date</button>
              <button 
                onClick={handleExportFiscal}
                className="px-4 py-2 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
              >
                Export Ledger
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.history.length > 0 ? data.history.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">#{row.transaction_id || `TRX-${1000+idx}`}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{row.date}</td>
                    <td className="px-8 py-5 font-bold text-slate-700">{row.recipient}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.type === 'Salary' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-800">{formatCurrency(row.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No detailed history available for this cycle.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-6 bg-blue-600/5 rounded-[32px] border border-blue-100/50 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 font-black">!</div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-blue-900 leading-none">Fiscal Transparency Disclaimer</h4>
            <p className="text-[11px] text-blue-700/70 font-bold mt-2 leading-relaxed">
              Disbursement data is synced from the core project ledger every 6 hours. Reported liabilities are estimates based on active attendance logs and may fluctuate until final project audit.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientPaymentsPage;
