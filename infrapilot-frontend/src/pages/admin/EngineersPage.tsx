import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateEngineerModal from "../../components/forms/CreateEngineerModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { userService } from "../../services/userService";

const EngineersPage = () => {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [engineerToDelete, setEngineerToDelete] = useState<number | null>(null);

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        setIsLoading(true);
        const res = await userService.getAllUsers(100, 0);

        // Robust extraction logic: handles direct array or nested items/data/users property
        const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);

        // Filter for Site Engineers with robust checks for strings or objects
        const engineerList = userList.filter((u: any) => {
          const role = typeof u.role === "string" ? u.role : u.role?.name || "";

          // Case-insensitive match for SiteEngineer or Engineer roles
          const normalizedRole = role.toLowerCase().replace(/\s/g, "");
          return normalizedRole === "siteengineer" || normalizedRole === "engineer";
        });

        // Map to UI structure
        const mapped = engineerList.map((u: any) => ({
          id: u.user_id,
          name: u.full_name,
          email: u.email,
          mobile: u.mobile_number,
          projects: u.address || "Main Site",
          experience: "5 Years", // Mock
          status: u.is_active ? "On Site" : "Leave",
          specialization: u.designation || "Civil Engineer",
          lastDsr: new Date().toISOString(),
          weather: "Sunny, 32°C",
          laborCount: 0,
          activeTask: "General Supervision"
        }));

        setEngineers(mapped);
      } catch (error) {
        console.error("Failed to fetch engineers:", error);
        toast.error("Failed to load engineering staff.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEngineers();
  }, []);

  const filteredEngineers = engineers.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projects.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateOrUpdate = (data: any) => {
    if (editingEngineer) {
      setEngineers(prev => prev.map(e => e.id === editingEngineer.id ? { ...e, ...data } : e));
      toast.success("Engineer details updated.");
    } else {
      const newEngineer = {
        ...data,
        id: Date.now(),
        lastDsr: new Date(Date.now() - 86400000 * 2).toISOString(), // Simulation
        performance: "New Joiner"
      };
      setEngineers(prev => [newEngineer, ...prev]);
      toast.success("New engineer deployed successfully!");
    }
    setIsModalOpen(false);
    setEditingEngineer(null);
  };

  const handleDelete = () => {
    if (engineerToDelete) {
      setEngineers(prev => prev.filter(e => e.id !== engineerToDelete));
      toast.success("Staff record removed.");
      setIsDeleteModalOpen(false);
      setEngineerToDelete(null);
    }
  };

  return (
    <>
      <Navbar
        title="Site Engineer Management"
        breadcrumb={["Admin", "Engineers"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Engineering Staff
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor site engineer performance, reports, and assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              Daily Logs
            </button>
            <button
              onClick={() => {
                setEditingEngineer(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + Add Engineer
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Engineers"
            value={engineers.filter(e => e.status === "On Site").length.toString()}
            sub={`${engineers.length} Total Staff`}
            accent="text-primary"
          />
          <StatCard
            title="DSR Compliance"
            value={`${Math.round((engineers.filter(e => new Date(e.lastDsr).toDateString() === new Date().toDateString()).length / engineers.length) * 100)}%`}
            sub="Based on today's submissions"
            accent="text-emerald-500"
          />
          <StatCard
            title="Pending Reviews"
            value={engineers.filter(e => e.status === "On Site" && new Date(e.lastDsr).toDateString() !== new Date().toDateString()).length.toString()}
            sub="Missing reports for today"
            accent="text-violet-500"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing Staff Intelligence...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-50">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by name or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Engineer Information</th>
                    <th className="px-6 py-4">Assigned Projects & Weather</th>
                    <th className="px-6 py-4">Specialization & Labour</th>
                    <th className="px-6 py-4">Active Supervision</th>
                    <th className="px-6 py-4">Daily Report (DSR)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEngineers.map((e) => {
                    const isDsrToday = new Date(e.lastDsr).toDateString() === new Date().toDateString();
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200 uppercase">
                              {e.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                                {e.name}
                              </p>
                              <p className="text-slate-400 text-[10px]">
                                {e.mobile} | {e.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-xs text-slate-600 font-bold">{e.projects}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                              <span className="text-[10px]">{e.weather === "Sunny, 32°C" ? "☀️" : "☁️"}</span>
                              <span className="text-[10px] font-medium">{e.weather || "Syncing..."}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider block w-fit">
                              {e.specialization || "General"}
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                              Labour Force: <span className="text-primary">{e.laborCount || 0} Staff</span>
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-xs font-bold text-slate-700">{e.activeTask || "None"}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isDsrToday ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDsrToday
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                                }`}
                            >
                              {isDsrToday ? "Live: Submitted" : "Pending Today"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${e.status === "On Site"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => navigate(`/admin/engineers/${e.id}`)}
                              className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                              title="View Profile"
                            >
                              <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingEngineer(e);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                              title="Edit Engineer"
                            >
                              <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => {
                                setEngineerToDelete(e.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                              title="Delete Engineer"
                            >
                              <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredEngineers.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-400 font-medium">No engineers found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </PageTransition>

      {/* Create Modal */}
      <CreateEngineerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEngineer(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingEngineer}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEngineerToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Remove Staff Member"
        message="Are you sure you want to remove this engineer? This will archive their deployment records and remove them from active project assignments."
        confirmText="Remove Record"
        type="danger"
      />
    </>
  );
};

export default EngineersPage;
