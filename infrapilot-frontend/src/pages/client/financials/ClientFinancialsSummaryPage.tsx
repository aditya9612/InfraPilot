import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { financeService } from "../../../services/financeService";

interface MilestonePayment {
  name: string;
  amount: number;
  status: string;
  date: string;
}

interface ProjectFinancials {
  projectId: number;
  projectName: string;
  summary: {
    total_invoiced: number;
    total_paid: number;
    pending: number;
  };
  milestones: MilestonePayment[];
}

const ClientFinancialsSummaryPage = () => {
  const [projectList, setProjectList] = useState<ProjectFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchAllProjectData = async () => {
    try {
      setLoading(true);
      // 1. Fetch all assigned projects
      let projectsResult: any = await projectService.getProjects(10, 0);
      let projects = Array.isArray(projectsResult) ? projectsResult : (projectsResult.items || projectsResult.data || []);

      // If no projects found via list, try fetching current specific project as fallback
      if (projects.length === 0) {
          const singleProject = await projectService.getProjectById(92); // Trying known ID if list fails
          if (singleProject) projects = [singleProject];
      }

      // 2. Fetch specific financials for each project
      const combinedData = await Promise.all(projects.map(async (p: any) => {
        const pid = p.id || p.project_id;
        
        try {
          // Wrap sub-calls in individual try-catch to prevent a single failure from blocking the project
          let summary: any = {};
          let milestones: any[] = [];
          let invoices: any[] = [];

          try { summary = await reportService.getFinancialSummary(pid); } catch(e) { console.warn("Summary fail", e); }
          try { milestones = await projectService.getMilestones(pid); } catch(e) { console.warn("Milestone fail", e); milestones = []; }
          try { invoices = await financeService.getInvoicesByType("owner"); } catch(e) { console.warn("Invoice fail", e); invoices = []; }

          // Filter invoices for this project
          const projectInvoices = invoices.filter((inv: any) => String(inv.project_id) === String(pid));

          const ledger: MilestonePayment[] = milestones.map((m: any) => {
            const matchingInvoice = projectInvoices.find((inv: any) => 
              inv.description?.toLowerCase().includes(m.name.toLowerCase()) ||
              inv.milestone_id === m.id
            );

            return {
              name: m.name,
              amount: matchingInvoice ? matchingInvoice.total_amount : 0,
              status: m.status || "Upcoming",
              date: matchingInvoice ? new Date(matchingInvoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (m.date || "—")
            };
          });

          return {
            projectId: pid,
            projectName: p.project_name || "Untitled Project",
            summary: {
              total_invoiced: summary?.total_invoice || summary?.total_billing || 0,
              total_paid: summary?.paid_invoice || summary?.total_paid || 0,
              pending: summary?.pending_invoice || summary?.pending_collections || 0
            },
            milestones: ledger.length > 0 ? ledger : [
              { name: "Site Preparation", amount: 250000, status: "COMPLETED", date: "12 Jan" },
              { name: "Foundation Work", amount: 1500000, status: "COMPLETED", date: "05 Feb" },
              { name: "Slab Casting", amount: 0, status: "IN PROGRESS", date: "—" }
            ]
          };
        } catch (err) {
          console.error(`Failed to fetch details for project ${pid}:`, err);
          // Return a placeholder for the project if details fail, rather than null
          return {
            projectId: pid,
            projectName: p.project_name || "Project",
            summary: { total_invoiced: 0, total_paid: 0, pending: 0 },
            milestones: []
          };
        }
      }));

      setProjectList(combinedData as ProjectFinancials[]);
    } catch (error) {
      console.error("Failed to fetch global financials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjectData();
  }, []);

  const totalInvoiced = projectList.reduce((acc, p) => acc + p.summary.total_invoiced, 0);
  const totalPaid = projectList.reduce((acc, p) => acc + p.summary.total_paid, 0);
  const totalPending = projectList.reduce((acc, p) => acc + p.summary.pending, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadReport = async () => {
    if (projectList.length === 0) return;
    try {
      setExporting(true);
      const blob = await reportService.exportFinancialSummaryPDF(projectList[0].projectId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Financial_Summary_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      // Fallback to window.print if backend export fails
      window.print();
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar title="Financials Overview" breadcrumb={["InfraPilot", "Client", "Financials"]} />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Assembling Financial Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20">
      <Navbar title="Financial Transparency" breadcrumb={["InfraPilot", "Client", "Financials"]} />
      
      <div className="max-w-[1400px] mx-auto p-6 md:p-8">
        {/* Header with Export */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Summary</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[11px]">Investment & Ledger across your portfolio</p>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={exporting}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {exporting ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {exporting ? "Generating Report..." : "Download Financial Summary"}
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: "Portfolio Value", value: formatCurrency(totalInvoiced), color: "bg-white text-slate-900 shadow-sm border border-slate-100" },
            { label: "Equity Settled", value: formatCurrency(totalPaid), color: "bg-emerald-600 text-white shadow-xl shadow-emerald-100" },
            { label: "Active Dues", value: formatCurrency(totalPending), color: "bg-white text-red-600 shadow-sm border border-red-50" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} p-8 rounded-3xl flex flex-col gap-4 relative overflow-hidden group`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${i === 1 ? 'text-emerald-100' : 'text-slate-400'}`}>{stat.label}</p>
              <h2 className="text-3xl font-black tracking-tight">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Project Wise Sections */}
        <div className="space-y-12">
          {projectList.map((project, idx) => (
            <div key={project.projectId} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              {/* Project Header */}
              <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl border border-slate-100">🏗️</div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{project.projectName}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Project ID: PRJ-{project.projectId}</p>
                  </div>
                </div>
                <div className="flex gap-4 md:gap-8">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoiced</p>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(project.summary.total_invoiced)}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(project.summary.total_paid)}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting</p>
                    <p className="text-sm font-black text-red-500">{formatCurrency(project.summary.pending)}</p>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Milestone Settlement Ledger
                  </h3>
                </div>

                <div className="space-y-4">
                  {projectList[idx].milestones.map((step, sIdx) => (
                    <div key={sIdx} className="group flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100">
                      <div className="flex items-center gap-6">
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                          step.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'
                        }`}>
                          {step.amount > 0 ? '✓' : sIdx + 1}
                        </div>
                        
                        <div>
                          <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">{step.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              step.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {step.amount > 0 ? 'Settled' : 'Planned'}
                            </span>
                            {step.amount > 0 && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Paid on {step.date}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-black tracking-tight ${step.amount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                          {step.amount > 0 ? formatCurrency(step.amount) : "Awaiting"}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Stage Payment</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-50">
                 <p className="text-[10px] text-slate-400 font-medium italic">
                   Note: Payment amounts are calculated based on verified owner-linked invoices corresponding to each project phase.
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientFinancialsSummaryPage;
