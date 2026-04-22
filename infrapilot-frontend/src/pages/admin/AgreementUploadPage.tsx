import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import AgreementUpload from "../../components/admin/owners/AgreementUpload";

export default function AgreementUploadPage() {
  return (
    <>
      <Navbar title="Owner Management" breadcrumb={["Admin", "Owners", "Agreements"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agreement Documents</h1>
            <p className="text-slate-500 text-sm">
              Upload and manage official agreement papers for owners safely.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[500px] flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <AgreementUpload />
          </div>
        </div>
      </PageTransition>
    </>
  );
}
