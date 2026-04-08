import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const RolesPage = () => {
  return (
    <>
      <Navbar
        title="Roles Management"
        breadcrumb={["Admin", "Users", "Roles"]}
      />
      <PageTransition className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
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
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Roles Management
          </h2>
          <p className="text-slate-500 max-w-sm">
            Define and manage system roles and their access levels across the
            platform.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all">
              + Create New Role
            </button>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default RolesPage;
