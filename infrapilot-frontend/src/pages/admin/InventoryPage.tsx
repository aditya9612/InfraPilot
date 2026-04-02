import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

const InventoryPage = () => {
  return (
    <DashboardLayout>
      <Navbar
        title="Material & Inventory"
        breadcrumb={["Admin", "Material & Inventory"]}
      />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Material & Inventory
          </h2>
          <p className="text-slate-500 text-lg font-medium mt-2">
            Work In Progress...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
