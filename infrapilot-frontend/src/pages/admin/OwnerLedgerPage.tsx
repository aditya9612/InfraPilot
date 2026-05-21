import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import OwnerLedger from "../../components/admin/owners/OwnerLedger";

export default function OwnerLedgerPage() {
  return (
    <>
      <Navbar
        title="Owner Management"
        breadcrumb={["Admin", "Owners", "Ledger"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Owner Ledger
            </h1>
            <p className="text-slate-500 text-sm">
              Full debit and credit breakdown history.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          <OwnerLedger />
        </div>
      </PageTransition>
    </>
  );
}
