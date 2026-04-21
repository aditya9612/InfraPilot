import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import PaymentTracker from "../../components/admin/owners/PaymentTracker";

export default function PaymentTrackerPage() {
  return (
    <>
      <Navbar
        title="Owner Management"
        breadcrumb={["Admin", "Owners", "Track Payments"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Payment Tracker
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor incoming and pending payments from property owners.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          <PaymentTracker />
        </div>
      </PageTransition>
    </>
  );
}
