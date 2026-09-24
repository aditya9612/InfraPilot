import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import StatCard from '../../components/common/StatCard';
import { equipmentService } from '../../services/equipmentService';
import type { EquipmentItem as Equipment, CreateRentalRequest, ReturnInspectionRequest, RentalItem } from '../../services/equipmentService';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, CheckCircle, Download, FileText, ClipboardList, Activity, CheckCircle2, IndianRupee, RefreshCcw, Eye } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import CreateRentalModal from '../../components/forms/CreateRentalModal';
import CreateReturnInspectionModal from '../../components/forms/CreateReturnInspectionModal';
import ViewRentalModal from '../../components/forms/ViewRentalModal';

const RentalManagementPage = () => {
    const { selectedProjectId, assignedProjects } = useProject();
    const [rentals, setRentals] = useState<RentalItem[]>([]);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Track selected item
    const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);
    const [viewedEqName, setViewedEqName] = useState<string>('');
    const [viewedProjName, setViewedProjName] = useState<string>('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    const fetchRentals = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentService.getAllRentals({ project_id: selectedProjectId || undefined });
            setRentals(data);

            // Also fetch basic equipment lookup (Backend limits to 100 max per request)
            let allEq: Equipment[] = [];
            let offset = 0;
            while (true) {
                const res = await equipmentService.listEquipment({ limit: 100, offset });
                const items = res.items || [];
                allEq = allEq.concat(items);
                if (items.length < 100) break;
                offset += 100;
            }
            setEquipmentList(allEq);
        } catch (error) {
            toast.error('Failed to load rentals');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRental = async (equipmentId: number, data: CreateRentalRequest) => {
        try {
            await equipmentService.createRental(equipmentId, data);
            toast.success("Rental created successfully!");
            setIsCreateModalOpen(false);
            fetchRentals();
        } catch (error) {
            toast.error("Failed to create rental");
            throw error;
        }
    };

    const handleCreateInspection = async (equipmentId: number, data: ReturnInspectionRequest) => {
        try {
            await equipmentService.createReturnInspection(equipmentId, data);
            toast.success("Inspection created successfully!");
            setIsInspectionModalOpen(false);
            setSelectedRental(null);
            fetchRentals();
        } catch (error) {
            toast.error("Failed to submit inspection");
            throw error;
        }
    };

    const handleCompleteRental = async (rentalId: number) => {
        if (!confirm("Are you sure you want to mark this rental as completed?")) return;
        try {
            await equipmentService.completeRental(rentalId);
            toast.success("Rental marked as complete!");
            fetchRentals();
        } catch (error) {
            toast.error("Failed to complete rental");
        }
    };

    const handleVendorBill = async (equipmentId: number, purchaseId: number) => {
        try {
            await equipmentService.generateRentalInVendorBill(equipmentId, purchaseId);
            toast.success("Vendor bill generated!");
            fetchRentals();
        } catch (error) {
            toast.error("Failed to generate vendor bill");
        }
    };

    const handleInvoice = async (equipmentId: number, rentalId: number) => {
        try {
            await equipmentService.generateRentalOutInvoice(equipmentId, rentalId);
            toast.success("Invoice generated!");
            fetchRentals();
        } catch (error) {
            toast.error("Failed to generate invoice");
        }
    };

    useEffect(() => {
        fetchRentals();
    }, [selectedProjectId]);

    const filteredRentals = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return rentals.filter(r =>
            (r.client_name || '').toLowerCase().includes(term) ||
            r.equipment_id?.toString().includes(term)
        );
    }, [rentals, searchTerm]);

    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredRentals.length / PAGE_SIZE));
    const pagedRentals = filteredRentals.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const activeRentals = rentals.filter(r => r.status !== 'COMPLETED' && !r.is_completed).length;
    const completedRentals = rentals.filter(r => r.status === 'COMPLETED' || r.is_completed).length;
    const totalSpend = rentals.reduce((sum, r) => sum + (Number(r.rental_cost) || 0), 0);

    return (
        <>
            <Navbar title="Rental Management" breadcrumb={["Admin", "Material & Inventory", "Equipment Management", "Rental Management"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rental Management</h1>
                        <p className="text-slate-500 text-sm">Track active rentals, upcoming returns, and manage billing workflows.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchRentals}
                            disabled={isLoading}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" /> Refresh
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-blue-600"
                        >
                            <Plus className="w-4 h-4" /> New Rental
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Rentals" value={rentals.length.toString()} sub="All time records" accent="text-blue-500" icon={<ClipboardList className="w-5 h-5" />} />
                    <StatCard title="Active Rentals" value={activeRentals.toString()} sub="Currently hired" accent="text-amber-500" icon={<Activity className="w-5 h-5" />} />
                    <StatCard title="Completed Rentals" value={completedRentals.toString()} sub="Returned & closed" accent="text-emerald-500" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <StatCard title="Total Rental Spend" value={`₹${totalSpend.toLocaleString()}`} sub="Cumulative cost" accent="text-indigo-500" icon={<IndianRupee className="w-5 h-5" />} />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search rentals by ID or equipment..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Equipment</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Client Info</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Financials</th>
                                    <th className="px-6 py-4">Notes</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr><td colSpan={9} className="p-10 text-center text-slate-400">Loading rentals...</td></tr>
                                ) : pagedRentals.length > 0 ? pagedRentals.map(rental => {
                                    const eqName = equipmentList.find(eq => eq.id === rental.equipment_id)?.equipment_name || `Unknown (ID: ${rental.equipment_id})`;
                                    const proj = rental.project_id ? assignedProjects.find((p: any) => p.id === rental.project_id) : null;
                                    const projName = proj ? (proj.project_name || `Project (ID: ${rental.project_id})`) : 'N/A';

                                    return (
                                        <tr key={rental.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{eqName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{projName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{rental.client_name || 'N/A'}</div>
                                                {rental.client_id && <div className="text-[10px] text-slate-500 mt-0.5 font-bold">Client ID: #{rental.client_id}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-700">{rental.duration} Day(s)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] text-slate-500">{rental.start_date} → <br /> {rental.end_date}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-emerald-600">₹{rental.rental_cost} Total</div>
                                                <div className="text-[10px] text-emerald-500 mt-0.5 font-bold">₹{rental.per_day_cost}/day</div>
                                                {rental.invoice_id && <div className="text-[10px] text-indigo-500 mt-0.5 font-bold">Ref: INV-{rental.invoice_id}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-slate-600 max-w-[150px] truncate" title={rental.notes !== 'null' ? rental.notes : ''}>
                                                    {rental.notes && rental.notes !== 'null' ? rental.notes : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${rental.status === 'COMPLETED' || rental.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {rental.status || (rental.is_completed ? 'COMPLETED' : 'ACTIVE')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => { setSelectedRental(rental); setViewedEqName(eqName); setViewedProjName(projName); setIsViewModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="View details"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => handleCompleteRental(rental.id)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded" title="Complete Rental"><CheckCircle className="w-4 h-4" /></button>
                                                    <button onClick={() => { setSelectedRental(rental); setIsInspectionModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Return Inspection"><RotateCcw className="w-4 h-4" /></button>
                                                    <button onClick={() => handleVendorBill(rental.equipment_id, rental.id)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded" title="Vendor Bill (IN)"><FileText className="w-4 h-4" /></button>
                                                    <button onClick={() => handleInvoice(rental.equipment_id, rental.id)} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded" title="Invoice (OUT)"><Download className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={9} className="p-10 text-center text-slate-400">No rentals found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredRentals.length)} of {filteredRentals.length} Rentals
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
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
                </div>
            </PageTransition>

            <CreateRentalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateRental}
                equipmentList={equipmentList}
                projects={assignedProjects}
            />

            <CreateReturnInspectionModal
                isOpen={isInspectionModalOpen}
                onClose={() => { setIsInspectionModalOpen(false); setSelectedRental(null); }}
                onSubmit={handleCreateInspection}
                rentalItem={selectedRental}
            />

            <ViewRentalModal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setSelectedRental(null); }}
                rental={selectedRental}
                equipmentName={viewedEqName}
                projectName={viewedProjName}
            />
        </>
    );
};

export default RentalManagementPage;
