import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateUserModal from "../../components/forms/CreateUserModal";
import toast from "react-hot-toast";
import UserDetailsModal from "../../components/dashboard/UserDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { userService } from "../../services/userService";
import { projectService } from "../../services/projectService";
import SortDropdown from "../../components/common/SortDropdown";
import { getFullImageUrl } from "../../utils/imageUtils";

const ProjectManagersPage = () => {
    const [managers, setManagers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingManager, setViewingManager] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [managerToDelete, setManagerToDelete] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const PAGE_SIZE = 10;
    const [allProjects, setAllProjects] = useState<any[]>([]);

    const fetchManagers = async () => {
        try {
            setIsLoading(true);
            const res = await userService.getAllUsers(100, 0);
            const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);

            const projectsRes = await projectService.getProjects(100, 0);
            const projectList = Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || projectsRes.data || []);
            setAllProjects(projectList);

            const managerRecords = userList.filter((u: any) => {
                const role = typeof u.role === "string" ? u.role : u.role?.name || "";
                const normalizedRole = role.toLowerCase().replace(/\s/g, "");
                return normalizedRole === "projectmanager" || normalizedRole === "manager";
            });

            // Pre-fetch all project memberships to build lookup map
            const userProjectMap = new Map<number, any[]>();
            const BATCH_SIZE = 10;
            for (let i = 0; i < projectList.length; i += BATCH_SIZE) {
                const batch = projectList.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (p: any) => {
                    try {
                        const membersRes = await projectService.getProjectMembers(p.id);
                        const members = Array.isArray(membersRes) ? membersRes : (membersRes.items || []);
                        members.forEach((m: any) => {
                            const uid = m.user_id || m.user?.id || m.id;
                            if (uid) {
                                const existing = userProjectMap.get(uid) || [];
                                userProjectMap.set(uid, [...existing, p]);
                            }
                        });
                    } catch (e) {
                        console.warn(`Failed to fetch members for project ${p.id}`, e);
                    }
                }));
            }

            const mapped = managerRecords.map((u: any) => {
                const assigned = userProjectMap.get(u.user_id) || [];
                if (u.address) {
                    const byAddr = projectList.filter((p: any) => p.project_name === u.address);
                    byAddr.forEach((pa: any) => {
                        if (!assigned.find((a: any) => a.id === pa.id)) assigned.push(pa);
                    });
                }

                return {
                    id: u.user_id,
                    user_id: u.user_id,
                    name: u.full_name,
                    full_name: u.full_name,
                    email: u.email,
                    mobile: u.mobile_number,
                    mobile_number: u.mobile_number,
                    role: u.role || "ProjectManager",
                    projects: assigned.length > 0 ? assigned.map(p => p.project_name).join(", ") : "Unassigned",
                    assignedProjectsCount: assigned.length,
                    status: u.is_active ? "Active" : "Inactive",
                    is_active: u.is_active,
                    designation: u.designation || "Project Manager",
                    pan_number: u.pan_number || "",
                    aadhaar_number: u.aadhaar_number || "",
                    joiningDate: u.joining_date,
                    joining_date: u.joining_date,
                    profile_image: u.profile_image,
                };
            });

            setManagers(mapped);
        } catch (error) {
            console.error("Failed to fetch project managers:", error);
            toast.error("Failed to load project managers.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const filteredManagers = useMemo(() => {
        const list = managers.filter((m) =>
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.projects?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return [...list].sort((a, b) => {
            const aVal = a.id;
            const bVal = b.id;
            return sortOrder === "latest" ? bVal - aVal : aVal - bVal;
        });
    }, [managers, searchTerm, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredManagers.length / PAGE_SIZE));
    const pagedManagers = filteredManagers.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm, sortOrder]);

    const handleCreateOrUpdate = async (data: any) => {
        try {
            const payload: any = {
                full_name: data.full_name,
                email: data.email,
                mobile_number: data.mobile_number,
                designation: data.designation,
                pan_number: data.pan_number,
                aadhaar_number: data.aadhaar_number,
                address: data.address,
                joining_date: data.joining_date || null,
                role: "ProjectManager",
                is_active: data.is_active,
                profile_image: data.profile_image,
            };

            if (editingManager) {
                await userService.updateUser(editingManager.id, payload);
                toast.success("Manager details updated successfully.");
            } else {
                payload.password = data.password || data.mobile_number || "Welcome@123";
                await userService.createUser(payload);
                toast.success("Project Manager registered successfully!");
            }

            fetchManagers();
        } catch (error: any) {
            console.error(error);
            const detail = error.response?.data?.detail;
            const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(", ") : detail || "Operation failed";
            toast.error(msg);
        } finally {
            setIsModalOpen(false);
            setEditingManager(null);
        }
    };

    const handleDelete = async () => {
        if (!managerToDelete) return;
        try {
            await userService.deleteUser(managerToDelete);
            setManagers(prev => prev.filter(m => m.id !== managerToDelete));
            toast.success("Project Manager removed successfully.");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to remove Project Manager.");
        } finally {
            setIsDeleteModalOpen(false);
            setManagerToDelete(null);
        }
    };

    const handleViewDetails = async (manager: any) => {
        try {
            const toastId = toast.loading("Loading details...");
            const freshUser = await userService.getUserById(manager.id);
            toast.dismiss(toastId);
            setViewingManager({
                ...manager,
                ...freshUser
            });
            setIsViewModalOpen(true);
        } catch (error) {
            toast.dismiss();
            console.error("Failed to fetch fresh user details:", error);
            // Fallback
            setViewingManager(manager);
            setIsViewModalOpen(true);
        }
    };

    return (
        <>
            <Navbar
                title="Project Manager Management"
                breadcrumb={["Admin", "Project Managers"]}
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Project Managers
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage system project managers, assign roles, and track active project counts.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingManager(null);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        + Add Project Manager
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Project Managers"
                        value={managers.length.toString()}
                        sub="Registered accounts"
                        accent="text-primary"
                    />
                    <StatCard
                        title="Active Managers"
                        value={managers.filter(m => m.status === "Active").length.toString()}
                        sub={`${managers.filter(m => m.status === "Inactive").length} Inactive profiles`}
                        accent="text-emerald-500"
                    />
                    <StatCard
                        title="Assigned Projects"
                        value={managers.reduce((sum, m) => sum + (m.assignedProjectsCount || 0), 0).toString()}
                        sub="Total assignments count"
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
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 max-w-md w-full">
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
                                        placeholder="Search by name, email or project..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter"
                                    />
                                </div>
                                <SortDropdown value={sortOrder} onChange={setSortOrder} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Manager Info</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Assigned Projects</th>
                                        <th className="px-6 py-4">Joined Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pagedManagers.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200 uppercase overflow-hidden">
                                                        {m.profile_image ? (
                                                            <img src={getFullImageUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            m.name.split(' ').map((n: string) => n[0]).join('')
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 group-hover:text-primary transition-colors text-sm">
                                                            {m.name}
                                                        </p>
                                                        <p className="text-slate-400 text-[10px]">
                                                            {m.mobile} | {m.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                                {m.designation || "Project Manager"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-xs text-slate-600 font-bold max-w-[250px] truncate" title={m.projects}>
                                                        {m.projects}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                                                        Active projects: <span className="text-primary">{m.assignedProjectsCount}</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {m.joiningDate ? new Date(m.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Specified"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${m.status === "Active"
                                                        ? "bg-emerald-100 text-emerald-600"
                                                        : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleViewDetails(m)}
                                                        className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                                                        title="View Profile"
                                                    >
                                                        <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingManager(m);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                                                        title="Edit Manager"
                                                    >
                                                        <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setManagerToDelete(m.id);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                                                        title="Delete Manager"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredManagers.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                                <span className="text-xs text-slate-400 font-medium">
                                    {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredManagers.length)} of {filteredManagers.length} managers
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                                        {currentPage + 1}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {filteredManagers.length === 0 && (
                            <div className="p-20 text-center">
                                <p className="text-slate-400 font-medium">No project managers found matching your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </PageTransition>

            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingManager(null);
                }}
                onSubmit={handleCreateOrUpdate}
                initialData={editingManager}
            />

            <UserDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingManager(null);
                }}
                user={viewingManager}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setManagerToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Remove Project Manager"
                message="Are you sure you want to remove this project manager? This will archive their administration records and remove them from active project workflows."
                confirmText="Remove Record"
                type="danger"
            />
        </>
    );
};

export default ProjectManagersPage;
