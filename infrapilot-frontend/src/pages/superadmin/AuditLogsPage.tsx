import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, X, Filter, RotateCcw, Building2, User } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | null>(null);

  // Fetch Companies for dropdown / name lookup
  const { data: companiesResponse } = useQuery({
    queryKey: ['superadmin_companies_small'],
    queryFn: () => superadminService.getCompanies({ limit: 100 }),
  });

  const companies = companiesResponse?.items || (Array.isArray(companiesResponse) ? companiesResponse : []);

  // Fetch Platform Audit Logs (GET /api/v1/superadmin/audit-logs) with filters matching Image 1
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['superadmin_audit_logs', { page, limit, q: search, entity, action, performedBy }],
    queryFn: () => superadminService.getAuditLogs({
      skip: (page - 1) * limit,
      offset: (page - 1) * limit,
      limit: limit,
      q: search || undefined,
      entity: entity || undefined,
      action: action || undefined,
      performed_by: performedBy || undefined,
    })
  });

  // Fetch Company-specific Audit Logs (GET /api/v1/superadmin/companies/{company_id}/audit-logs) matching Image 2
  const { data: companyLogsResponse, isLoading: isLoadingCompanyLogs } = useQuery({
    queryKey: ['superadmin_company_audit_logs', selectedCompanyId],
    queryFn: () => superadminService.getCompanyAuditLogs(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const auditLogs = response?.items || (Array.isArray(response) ? response : []);
  const companyLogs = companyLogsResponse?.items || (Array.isArray(companyLogsResponse) ? companyLogsResponse : []);

  const resetFilters = () => {
    setSearch("");
    setEntity("");
    setAction("");
    setPerformedBy("");
    setLimit(10);
    setPage(1);
  };

  const renderFormattedDetails = (details: any) => {
    if (!details) return null;
    let parsed = details;
    if (typeof details === 'string') {
      try {
        parsed = JSON.parse(details);
      } catch (e) {
        return <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">{details}</p>;
      }
    }

    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.message) {
        return <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">{parsed.message}</p>;
      }
      const entries = Object.entries(parsed);
      if (entries.length === 0) return null;

      return (
        <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entries.map(([key, val]) => (
              <div key={key} className="flex flex-col bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key.replace(/_/g, ' ')}</span>
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">{String(details)}</p>;
  };

  const getCompanyName = (id?: string | number) => {
    if (!id) return null;
    const found = companies.find((c: any) => String(c.id) === String(id));
    return found?.name || 'Company';
  };

  const getTargetName = (log: any) => {
    const directName = log.details?.project_name || log.details?.name || log.details?.title || log.details?.task_name || log.details?.company_name || log.entity_name;
    if (directName) return String(directName);
    const companyId = log.company_id || (log.entity === 'Company' ? log.entity_id : null);
    const cName = getCompanyName(companyId);
    if (cName) return cName;
    return log.entity || "Platform";
  };

  const getPerformedByName = (log: any) => {
    const name = log.performed_by_name || log.user_name || log.user?.full_name || log.user?.name || log.details?.performed_by_name || log.details?.user_name || log.details?.full_name || log.details?.admin_name || log.details?.created_by_name;
    if (name) return String(name);
    return "Admin User";
  };

  return (
    <>
      <Navbar title="Audit Logs" breadcrumb={["InfraPilot", "Super Admin", "Audit Logs"]} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Platform</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Platform Audit Logs</h1>
              <p className="text-slate-500 text-sm">Track and monitor all platform activities and company changes</p>
            </div>
            
            {/* Direct Company Selector to view company-specific logs */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => setSelectedCompanyId(e.target.value ? e.target.value : null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">— View Company Specific Logs —</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            {/* Filter Bar */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filter Audit Logs</span>
                </div>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Entity Filter */}
                <div>
                  <select
                    value={entity}
                    onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="">All Entities (entity)</option>
                    <option value="Company">Company</option>
                    <option value="Plan">Plan</option>
                    <option value="User">User</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Payment">Payment</option>
                  </select>
                </div>

                {/* Action Filter */}
                <div>
                  <select
                    value={action}
                    onChange={(e) => { setAction(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="">All Actions (action)</option>
                    <option value="CREATE_COMPANY">CREATE_COMPANY</option>
                    <option value="SUSPEND_COMPANY">SUSPEND_COMPANY</option>
                    <option value="ACTIVATE_COMPANY">ACTIVATE_COMPANY</option>
                    <option value="UPDATE_COMPANY">UPDATE_COMPANY</option>
                    <option value="CREATE_PLAN">CREATE_PLAN</option>
                    <option value="UPDATE_PLAN">UPDATE_PLAN</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs List Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : isError ? (
                <div className="py-12 text-center text-rose-500 font-medium">Error loading logs: {(error as any)?.message}</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">No audit logs found matching the filter criteria.</div>
              ) : (
                <table className="w-full text-left text-sm font-inter">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest font-inter">
                    <tr>
                      <th className="px-6 py-4 font-inter">Action</th>
                      <th className="px-6 py-4 font-inter">Entity / Target</th>
                      <th className="px-6 py-4 font-inter">Performed By</th>
                      <th className="px-6 py-4 font-inter">Details</th>
                      <th className="px-6 py-4 font-inter">Timestamp</th>
                      <th className="px-6 py-4 text-right font-inter">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-inter">
                    {auditLogs.map((log: any, index: number) => {
                      const actionUpper = (log.action || "").toUpperCase();
                      const isDelete = actionUpper.includes("DELETE") || actionUpper.includes("REMOVE") || actionUpper.includes("SUSPEND");
                      const isCreate = actionUpper.includes("CREATE") || actionUpper.includes("ADD") || actionUpper.includes("ACTIVATE");
                      const isUpdate = actionUpper.includes("UPDATE") || actionUpper.includes("CHANGE");
                      const isComplete = actionUpper.includes("COMPLETE") || actionUpper.includes("TASK");

                      const tagStyle = isDelete ? "bg-rose-50 text-rose-600 border-rose-100" :
                        isCreate ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        isUpdate ? "bg-amber-50 text-amber-600 border-amber-100" :
                        isComplete ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-slate-50 text-slate-500 border-slate-100";

                      const companyId = log.company_id || (log.entity === 'Company' ? log.entity_id : null);
                      const targetCompanyId = companyId || (companies.length > 0 ? companies[0].id : 1);

                      return (
                        <tr key={log.id || index} className="hover:bg-slate-50/60 transition-colors group font-inter">
                          <td className="px-6 py-4 font-inter">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border font-inter ${tagStyle}`}>
                              {log.action?.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <div className="flex flex-col font-inter">
                              <span className="text-sm font-bold text-slate-800 font-inter">
                                {getTargetName(log)}
                              </span>
                              <span className="text-xs text-slate-400 font-medium font-inter">
                                {log.entity}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter">
                            <span className="text-sm font-bold text-slate-800 font-inter">
                              {getPerformedByName(log)}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-md font-inter">
                            {renderFormattedDetails(log.details)}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap font-inter">
                            {log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-inter">
                            <button
                              onClick={() => setSelectedCompanyId(targetCompanyId)}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination matching CompaniesPage style */}
            {!isLoading && auditLogs.length > 0 && response && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl flex-wrap gap-4">
                {/* Left: Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-600 bg-white shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Center: Showing info */}
                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, response.total || auditLogs.length)} of {response.total || auditLogs.length} records
                </div>

                {/* Right: Pagination */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {(() => {
                    const totalCount = response.total || auditLogs.length;
                    const totalPages = response.pages || Math.max(1, Math.ceil(totalCount / limit));
                    let pageNumbers: (number | string)[] = [];
                    
                    if (totalPages <= 5) {
                      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
                    } else {
                      if (page <= 3) {
                        pageNumbers = [1, 2, 3, 4, '...', totalPages];
                      } else if (page >= totalPages - 2) {
                        pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                      } else {
                        pageNumbers = [1, '...', page - 1, page, page + 1, '...', totalPages];
                      }
                    }

                    return pageNumbers.map((pageItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof pageItem === 'number' && setPage(pageItem)}
                        disabled={typeof pageItem !== 'number'}
                        className={`
                          min-w-[28px] h-7 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer
                          ${pageItem === page
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
                    onClick={() => setPage(prev => Math.min(response.pages || Math.ceil((response.total || auditLogs.length) / limit), prev + 1))}
                    disabled={response.pages ? page >= response.pages : auditLogs.length < limit}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Modal / Card overlay for GET /api/v1/superadmin/companies/{company_id}/audit-logs */}
      {selectedCompanyId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header without API route text */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {getCompanyName(selectedCompanyId)}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Company Audit Logs</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with formatted response details */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isLoadingCompanyLogs ? (
                <div className="py-16 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : companyLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium">No company-specific audit logs found.</div>
              ) : (
                companyLogs.map((log: any, idx: number) => {
                  return (
                    <div key={log.id || idx} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                          {log.action?.replaceAll("_", " ")}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Performed By: <strong className="text-slate-800">{getPerformedByName(log)}</strong></span>
                      </div>
                      {renderFormattedDetails(log.details)}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Total Logs: {companyLogs.length}</span>
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuditLogsPage;
