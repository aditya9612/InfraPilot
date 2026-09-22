import { useState } from "react";
import { Loader2, RefreshCw, TrendingUp, AlertCircle, Clock, Eye, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const BillingReconciliationPage = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'invoices' | 'reconciliation' | 'events'>('invoices');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: platformRecon, isLoading: isLoadingPlatform, refetch } = useQuery({
    queryKey: ['superadmin_platform_recon'],
    queryFn: () => superadminService.getPlatformReconciliation(),
  });

  const { data: companiesResponse } = useQuery({
    queryKey: ['superadmin_companies_small'],
    queryFn: () => superadminService.getCompanies({ limit: 100 }),
  });

  const { data: companyRecon, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['superadmin_company_recon', selectedCompanyId],
    queryFn: () => superadminService.getCompanyReconciliation(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: eventsResponse, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['superadmin_company_billing_events', selectedCompanyId],
    queryFn: () => superadminService.getCompanyBillingEvents(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['superadmin_company_invoices', selectedCompanyId],
    queryFn: () => superadminService.getCompanyInvoices(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const companies = companiesResponse?.items || (Array.isArray(companiesResponse) ? companiesResponse : []);
  const billingEvents = Array.isArray(eventsResponse)
    ? eventsResponse
    : (eventsResponse?.items || (eventsResponse as any)?.data || []);

  const companyInvoices = Array.isArray(invoicesResponse)
    ? invoicesResponse
    : (invoicesResponse?.items || (invoicesResponse as any)?.data || []);

  const pRecon = (platformRecon as any)?.data || platformRecon || {};
  const cRecon = (companyRecon as any)?.data || companyRecon || {};

  const expectedRev = pRecon.total_expected_revenue ?? pRecon.expected_revenue ?? pRecon.expected_amount ?? 0;
  const realizedRev = pRecon.total_realized_revenue ?? pRecon.realized_revenue ?? pRecon.realized_amount ?? 0;
  const outstandingRev = pRecon.total_outstanding ?? pRecon.outstanding_amount ?? pRecon.outstanding ?? 0;
  const pendingTxCount = pRecon.pending_manual_transactions ?? pRecon.pending_transactions ?? pRecon.pending_count ?? 0;

  const getCompanyName = (companyId?: string | number) => {
    if (!companyId) return 'Unknown Company';
    const found = companies.find((c: any) => String(c.id) === String(companyId));
    return found?.name || `Company #${companyId}`;
  };

  const reconResults: any[] = Array.isArray(cRecon?.results)
    ? cRecon.results
    : (cRecon?.company_id !== undefined || cRecon?.is_matched !== undefined || cRecon?.has_drift !== undefined)
    ? [cRecon]
    : Array.isArray(pRecon?.results) && selectedCompanyId
    ? pRecon.results.filter((r: any) => String(r.company_id) === String(selectedCompanyId))
    : (Array.isArray(pRecon?.results) ? pRecon.results : []);

  const renderPaginationControls = (totalCount: number) => {
    if (totalCount === 0) return null;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

    return (
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 font-inter rounded-b-2xl flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-600 bg-white shadow-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="text-[11px] font-medium text-slate-500 hidden md:block">
          Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {(() => {
            let pages: (number | string)[] = [];
            if (totalPages <= 5) {
              pages = Array.from({ length: totalPages }, (_, i) => i + 1);
            } else {
              if (currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
              } else if (currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
              }
            }

            return pages.map((pageItem, idx) => (
              <button
                key={idx}
                onClick={() => typeof pageItem === 'number' && setCurrentPage(pageItem)}
                disabled={typeof pageItem !== 'number'}
                className={`
                  min-w-[28px] h-7 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer
                  ${pageItem === currentPage
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                    : pageItem === '...'
                      ? 'bg-transparent border-transparent text-slate-400 cursor-default shadow-none'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-slate-300'}
                  ${typeof pageItem === 'number' ? 'border' : ''}
                `}
              >
                {pageItem}
              </button>
            ));
          })()}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const paginatedInvoices = companyInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedRecon = reconResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedEvents = billingEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Navbar title="Billing & Reconciliation" breadcrumb={["InfraPilot", "Super Admin", "Billing & Reconciliation"]} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Platform</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Billing & Reconciliation</h1>
              <p className="text-slate-500 text-sm">Platform-wide revenue tracking and per-company invoice reconciliation</p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" /> 
              <span className="text-sm font-bold text-slate-600">Refresh</span>
            </button>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Platform Overview</h2>
            {isLoadingPlatform ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Expected Revenue</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800">₹{Number(expectedRev).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Realized Revenue</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-700">₹{Number(realizedRev).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">Outstanding</span>
                  </div>
                  <p className="text-3xl font-black text-rose-700">₹{Number(outstandingRev).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Pending TX</span>
                  </div>
                  <p className="text-3xl font-black text-amber-700">{pendingTxCount}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Company Billing Lookup</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white shadow-xs focus:outline-none focus:border-blue-500 min-w-[280px]"
                >
                  <option value="">— Select a Company —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-b border-slate-200 px-6 pt-4 flex gap-8 text-sm font-semibold bg-white">
                <button
                  onClick={() => { setActiveTab('invoices'); setCurrentPage(1); }}
                  className={`pb-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'invoices'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => { setActiveTab('reconciliation'); setCurrentPage(1); }}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'reconciliation'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Reconciliation</span>
                  {reconResults.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">{reconResults.length}</span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab('events'); setCurrentPage(1); }}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'events'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Billing Events</span>
                  {billingEvents.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">{billingEvents.length}</span>
                  )}
                </button>
              </div>

              {activeTab === 'invoices' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Invoice #</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Issued At</th>
                          <th className="px-6 py-4">Due At</th>
                          <th className="px-6 py-4">Paid At</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!selectedCompanyId ? (
                          <tr><td colSpan={7} className="text-center py-10 text-slate-500">Select a company to view its invoices.</td></tr>
                        ) : isLoadingInvoices ? (
                          <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        ) : companyInvoices.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-slate-500">No invoices found for this company.</td></tr>
                        ) : (
                          paginatedInvoices.map((inv: any, idx: number) => (
                            <tr key={inv.id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-slate-800">
                                {inv.invoice_number || inv.number || (inv.id ? `INV-${inv.id}` : `INV-2025-000${idx + 1}`)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                  inv.status === 'Paid' || inv.status === 'paid' || inv.status === 'Success'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : inv.status === 'Pending' || inv.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {inv.status || 'Paid'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-800">
                                ₹{Number(inv.total_amount ?? inv.amount ?? inv.subtotal ?? 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                                {inv.issued_at
                                  ? new Date(inv.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : inv.created_at
                                  ? new Date(inv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                                {inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                                {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 font-bold hover:underline text-xs cursor-pointer">
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {selectedCompanyId && renderPaginationControls(companyInvoices.length)}
                </div>
              )}

              {activeTab === 'reconciliation' && (
                <div>
                  {selectedCompanyId && companyRecon && !isLoadingCompany && (
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                      {(cRecon.total_expected_revenue !== undefined || cRecon.expected_revenue !== undefined || cRecon.total_realized_revenue !== undefined) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                            <p className="text-xs text-slate-500 font-medium">Expected Revenue</p>
                            <p className="text-xl font-black text-slate-800">₹{(cRecon.total_expected_revenue ?? cRecon.expected_revenue ?? 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                            <p className="text-xs text-emerald-600 font-medium">Realized Revenue</p>
                            <p className="text-xl font-black text-emerald-700">₹{(cRecon.total_realized_revenue ?? cRecon.realized_revenue ?? 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                            <p className="text-xs text-rose-600 font-medium">Outstanding</p>
                            <p className="text-xl font-black text-rose-700">₹{(cRecon.total_outstanding ?? cRecon.outstanding ?? 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      )}

                      {(cRecon.total_reconciled !== undefined || cRecon.total_matched !== undefined || cRecon.total_drifted !== undefined || cRecon.total_unavailable !== undefined) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reconciled</p>
                            <p className="text-xl font-black text-slate-800">{cRecon.total_reconciled ?? 0}</p>
                          </div>
                          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Matched</p>
                            <p className="text-xl font-black text-emerald-700">{cRecon.total_matched ?? 0}</p>
                          </div>
                          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Drifted</p>
                            <p className="text-xl font-black text-amber-700">{cRecon.total_drifted ?? 0}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unavailable</p>
                            <p className="text-xl font-black text-slate-700">{cRecon.total_unavailable ?? 0}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Company Name & Sub ID</th>
                          <th className="px-6 py-4">Local Status</th>
                          <th className="px-6 py-4">Provider</th>
                          <th className="px-6 py-4">Reconciliation Status</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4">Reconciled At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!selectedCompanyId ? (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-500">Select a company to view its reconciliation audit details.</td></tr>
                        ) : isLoadingCompany ? (
                          <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        ) : reconResults.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-500">No reconciliation drift records found for this company.</td></tr>
                        ) : (
                          paginatedRecon.map((item: any, idx: number) => {
                            const isMatched = item.is_matched ?? !item.has_drift;
                            const hasDrift = item.has_drift ?? !isMatched;
                            const companyAssignedName = getCompanyName(item.company_id || selectedCompanyId);

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{companyAssignedName}</div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    Sub ID: {item.subscription_id ? `#${item.subscription_id}` : '#1'}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-100 text-slate-700">
                                    {item.local_status || 'Trial'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">{item.provider_name || 'mock'}</div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    {item.provider_subscription_id || item.provider_status || 'No external sub'}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    {isMatched ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 w-max">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 w-max">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Drift Detected
                                      </span>
                                    )}
                                    {hasDrift && item.drift_type && item.drift_type !== 'none' && (
                                      <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-max">
                                        {item.drift_type}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                                  {item.details || 'Tenant is on an internal trial with no external provider subscription.'}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                                  {item.reconciled_at ? new Date(item.reconciled_at).toLocaleString() : '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {selectedCompanyId && renderPaginationControls(reconResults.length)}
                </div>
              )}

              {activeTab === 'events' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Event Type</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Created At</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!selectedCompanyId ? (
                          <tr><td colSpan={5} className="text-center py-10 text-slate-500">Select a company to view its billing events.</td></tr>
                        ) : isLoadingEvents ? (
                          <tr><td colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                        ) : billingEvents.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-10 text-slate-500">No billing events found for this company.</td></tr>
                        ) : paginatedEvents.map((event: any) => (
                          <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{event.event_type || 'Unknown'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                event.status === 'Success' || event.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                event.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>{event.status || 'Pending'}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 font-bold">₹{Number(event.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg ml-auto cursor-pointer" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedCompanyId && renderPaginationControls(billingEvents.length)}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default BillingReconciliationPage;
