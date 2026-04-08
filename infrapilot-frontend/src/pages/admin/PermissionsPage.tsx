import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const PermissionsPage = () => {
  return (
    <>
      <Navbar
        title="Permissions"
        breadcrumb={["Admin", "Users", "Permissions"]}
      />
      <PageTransition className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Access Permissions
          </h2>
          <p className="text-slate-500 max-w-sm">
            Configure detailed access controls and feature permissions for each
            user role.
          </p>
          <div className="mt-6">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-all">
              Manage Access Matrix
            </button>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default PermissionsPage;
