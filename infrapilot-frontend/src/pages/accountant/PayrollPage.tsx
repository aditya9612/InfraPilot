import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const PayrollPage = () => {
  return (
    <>
      <Navbar 
        title="Payroll Management" 
        breadcrumb={["Accountant", "HR", "Payroll"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payroll & Staff Salary</h1>
            <p className="text-slate-500 text-sm">Process monthly salaries, labor wages, and staff reimbursements.</p>
          </div>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
            Process Payroll
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">Payroll List & Wages Placeholder</p>
            <p className="text-xs text-slate-400 mt-1">Ready for Payroll integration.</p>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default PayrollPage;
