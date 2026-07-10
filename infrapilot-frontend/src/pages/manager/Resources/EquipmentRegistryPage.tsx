import { useState, useEffect, useCallback, useMemo } from "react";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, CostReport, RentalItem,
    UtilizationReport, AvailabilityReport
} from "../../../services/equipmentService";
import { equipmentService } from "../../../services/equipmentService";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import PageTransition from "../../../components/common/PageTransition";
import Pagination from "../../../components/common/Pagination";
import Navbar from "../../../components/common/Navbar";
import ProjectSelector from "../../../components/common/ProjectSelector";

import {
    Search, Plus, Edit2, Eye, Activity, ArrowRightLeft,
    Trash2, Link2, Wrench, FileText, History, RefreshCcw, Download, ShieldCheck
} from "lucide-react";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import EquipmentFormModal from "../../engineer/MachineryManagement/EquipmentFormModal";

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

import { useProject } from "../../../context/ProjectContext";
import { projectService } from "../../../services/projectService";
import { boqService } from "../../../services/boqService";

const TABS = ["Dashboard", "Machinery & Equipment List", "Usage", "Transfer Equipment", "Maintenance", "Rental", "Reports & Alerts"];

const EquipmentRegistryPage = () => {
    const { selectedProjectId: globalProjectId, assignedProjects, isLoading: isProjectLoading } = useProject();
    const { user } = useAuth();

    // Effective project ID for data fetching
    const effectiveProjectId = globalProjectId || (user as any)?.project_id;

    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Data States for Other Tabs
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [rentalCostReport, setRentalCostReport] = useState<CostReport[]>([]);
    const [equipmentAlerts, setEquipmentAlerts] = useState<EquipmentAlert[]>([]);
    const [utilizationReport, setUtilizationReport] = useState<UtilizationReport[]>([]);
    const [availability, setAvailability] = useState<AvailabilityReport[]>([]);
    const [conditionFilter, setConditionFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState<string | number>("All");
    const [projects, setProjects] = useState<any[]>([]);
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [selectedEquipmentLogs, setSelectedEquipmentLogs] = useState<{ usage: any[]; maint: any[]; rental: any[] }>({ usage: [], maint: [], rental: [] });
    const [allRentalLogs, setAllRentalLogs] = useState<RentalItem[]>([]);
    const [isRentalViewOnly, setIsRentalViewOnly] = useState(false);
    const [transferForm, setTransferForm] = useState<any>({ equipment_id: undefined, to_project_id: undefined, transfer_date: new Date().toISOString().split('T')[0], condition_notes: '' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100, project_id: effectiveProjectId };
            const pIdObj = { project_id: effectiveProjectId };

            if (activeTab === "Dashboard") {
                const [eqRes, usageRes, maintRes, rentalRes, alertsRes] = await Promise.all([
                    equipmentService.listEquipment(params),
                    equipmentService.getUsageReport(pIdObj),
                    equipmentService.getMaintenanceAlerts(pIdObj),
                    equipmentService.getCostReport(pIdObj),
                    equipmentService.getEquipmentAlerts(pIdObj)
                ]);
                setEquipmentList(eqRes.items || []);
                setUsageReport(usageRes);
                setMaintenanceAlerts(maintRes);
                setRentalCostReport(rentalRes);
                setEquipmentAlerts(alertsRes);
            } else if (activeTab === "Machinery & Equipment List") {
                const res = await equipmentService.listEquipment(params);
                setEquipmentList(res.items || []);
            } else if (activeTab === "Usage") {
                const [eqRes, usageRes] = await Promise.all([
                    equipmentService.listEquipment(params),
                    equipmentService.getUsageReport(pIdObj)
                ]);
                const eqList = eqRes.items || [];
                setEquipmentList(eqList);
                setUsageReport(usageRes);
                if (!selectedEquipment && eqList.length > 0) {
                    setSelectedEquipment(eqList[0]);
                }
            } else if (activeTab === "Transfer Equipment") {
                const res = await equipmentService.listEquipment(params);
                setEquipmentList(res.items || []);
            } else if (activeTab === "Maintenance") {
                const [eqRes, maintRes] = await Promise.all([
                    equipmentService.listEquipment(params),
                    equipmentService.getMaintenanceAlerts(pIdObj)
                ]);
                const eqList = eqRes.items || [];
                setEquipmentList(eqList);
                setMaintenanceAlerts(maintRes);
                if (!selectedEquipment && eqList.length > 0) {
                    setSelectedEquipment(eqList[0]);
                }
            } else if (activeTab === "Rental") {
                const [eqRes, cost] = await Promise.all([
                    equipmentService.listEquipment(params),
                    equipmentService.getCostReport(pIdObj)
                ]);
                const eqList = eqRes.items || [];
                setEquipmentList(eqList);
                setRentalCostReport(cost);
                if (!selectedEquipment && eqList.length > 0) {
                    setSelectedEquipment(eqList[0]);
                }
            } else if (activeTab === "Reports & Alerts") {
                const [util, avail, alerts] = await Promise.all([
                    equipmentService.getUtilizationReport(pIdObj),
                    equipmentService.getAvailabilityReport(pIdObj),
                    equipmentService.getEquipmentAlerts(pIdObj)
                ]);
                setUtilizationReport(util || []);
                setAvailability(avail || []);
                setEquipmentAlerts(alerts || []);
            }
        } catch (err) {
            toast.error("Failed to load machinery data");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, effectiveProjectId, selectedEquipment]);

    useEffect(() => {
        if (isProjectLoading || !effectiveProjectId) return;
        fetchData();
    }, [fetchData, isProjectLoading, effectiveProjectId]);

    const filteredEquipment = (equipmentList || []).filter(item => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (item.equipment_name || "").toLowerCase().includes(term)
            || (item.equipment_code || "").toLowerCase().includes(term)
            || (item.operator_name || "").toLowerCase().includes(term);
        const matchesCondition = conditionFilter === "All" || item.condition === conditionFilter;
        const matchesProject = projectFilter === "All" || String(item.project_id) === String(projectFilter);
        return matchesSearch && matchesCondition && matchesProject;
    });

    const filteredUsage = (usageReport || []).filter(u => (u.equipment_code || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredMaintenance = (maintenanceAlerts || []).filter(m => (m.equipment_code || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredRental = (rentalCostReport || []).filter(r => (r.equipment_code || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredAlerts = (equipmentAlerts || []).filter(a => (a.equipment_code || "").toLowerCase().includes(searchTerm.toLowerCase()) || (a.equipment_name || "").toLowerCase().includes(searchTerm.toLowerCase()));

    const currentListData = activeTab === "Machinery & Equipment List" ? filteredEquipment :
        activeTab === "Usage" ? filteredUsage :
            activeTab === "Transfer Equipment" ? filteredEquipment :
                activeTab === "Maintenance" ? filteredMaintenance :
                    activeTab === "Rental" ? filteredRental :
                        activeTab === "Reports & Alerts" ? filteredAlerts : [];

    const pagedData = currentListData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const dashStats = useMemo(() => ({
        totalEquipment: equipmentList.length,
        available: equipmentList.filter(item => !item.project_id).length,
        allocated: equipmentList.filter(item => item.project_id).length,
        maintenanceAlerts: maintenanceAlerts.length,
        equipmentAlerts: equipmentAlerts.length,
        rentalCost: rentalCostReport.reduce((sum, item) => sum + (item.total_cost || 0), 0)
    }), [equipmentList, maintenanceAlerts, equipmentAlerts, rentalCostReport]);

    // Reset page on tab or search change
    useEffect(() => { setCurrentPage(0); }, [activeTab, searchTerm, conditionFilter, projectFilter]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(projectsList);
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };
        loadProjects();
    }, []);

    useEffect(() => {
        const loadBoqItems = async () => {
            try {
                const filters: any = { limit: 100 };
                if (effectiveProjectId) filters.project_id = effectiveProjectId;
                const res = await boqService.getBoqs(filters);
                const items = Array.isArray(res.items) ? res.items : [];
                setBoqItems(items);
            } catch (err) {
                console.error("Failed to load BOQ items", err);
            }
        };
        loadBoqItems();
    }, [effectiveProjectId]);

    useEffect(() => {
        if (activeTab !== "Usage" || !selectedEquipment) return;

        equipmentService.listUsage(selectedEquipment.id)
            .then(res => setSelectedEquipmentLogs(prev => ({ ...prev, usage: res })))
            .catch(() => setSelectedEquipmentLogs(prev => ({ ...prev, usage: [] })));
    }, [activeTab, selectedEquipment]);

    useEffect(() => {
        if (activeTab !== "Maintenance" || !selectedEquipment) return;

        equipmentService.listMaintenance(selectedEquipment.id)
            .then(res => setSelectedEquipmentLogs(prev => ({ ...prev, maint: res })))
            .catch(() => setSelectedEquipmentLogs(prev => ({ ...prev, maint: [] })));
    }, [activeTab, selectedEquipment]);

    useEffect(() => {
        if (activeTab !== "Rental") return;

        // load rentals for selected equipment
        if (selectedEquipment) {
            equipmentService.listRental(selectedEquipment.id)
                .then(res => setSelectedEquipmentLogs(prev => ({ ...prev, rental: res })))
                .catch(() => setSelectedEquipmentLogs(prev => ({ ...prev, rental: [] })));
        } else {
            setSelectedEquipmentLogs(prev => ({ ...prev, rental: [] }));
        }

        // aggregate all rentals (one call per equipment) for history view
        (async () => {
            try {
                const results = await Promise.all((equipmentList || []).map(eq => equipmentService.listRental(eq.id).catch(() => [])));
                setAllRentalLogs(results.flat());
            } catch (err) {
                setAllRentalLogs([]);
            }
        })();
    }, [activeTab, selectedEquipment, equipmentList]);

    const openViewModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData(item);
        setIsViewOnly(true);
        setIsEquipmentModalOpen(true);
    };

    const openEditModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData(item);
        setIsViewOnly(false);
        setIsEquipmentModalOpen(true);
    };

    const openAllocateModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData({ equipment_id: item.id, project_id: item.project_id || effectiveProjectId || undefined });
        setIsAllocateModalOpen(true);
    };

    const openUsageModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData({ equipment_id: item.id, working_hours: item.working_hours || 0, fuel_used: item.fuel_used || 0, usage_date: new Date().toISOString().split('T')[0], notes: '' });
        setIsUsageModalOpen(true);
    };

    const openTransferModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setTransferForm({
            equipment_id: item.id,
            to_project_id: undefined,
            transfer_date: new Date().toISOString().split('T')[0],
            condition_notes: ''
        });
        setIsTransferModalOpen(true);
    };

    const openMaintenanceModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData({
            equipment_id: item.id,
            description: '',
            maintenance_date: new Date().toISOString().split('T')[0],
            cost: 0,
            next_maintenance_date: '',
            project_id: effectiveProjectId || item.project_id || '' ,
            boq_item_id: ''
        });
        setIsMaintenanceModalOpen(true);
    };

    const openRentalModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setFormData({
            equipment_id: item.id,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            rental_cost: 0,
            client_name: '',
            notes: '',
            project_id: effectiveProjectId || item.project_id || '',
            boq_item_id: ''
        });
        setIsRentalModalOpen(true);
    };

    const openLogsModal = async (item: Equipment) => {
        setSelectedEquipment(item);
        setIsLogsModalOpen(true);
        try {
            const res = await equipmentService.getAuditLogs(item.id);
            setAuditLogs(res?.items || []);
        } catch (err) {
            toast.error('Failed to load audit logs');
            setAuditLogs([]);
        }
    };

    const handleAllocate = async () => {
        if (!selectedEquipment || !formData.project_id) {
            toast.error('Select a project to allocate');
            return;
        }
        setIsLoading(true);
        try {
            await equipmentService.updateEquipment(selectedEquipment.id, { project_id: Number(formData.project_id) });
            toast.success('Equipment allocated');
            setIsAllocateModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Failed to allocate equipment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsageSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const equipmentId = selectedEquipment?.id || formData.equipment_id;
        if (!equipmentId) return;
        setIsLoading(true);
        try {
            const payload = {
                working_hours: Number(formData.working_hours || 0),
                fuel_used: Number(formData.fuel_used || 0),
                usage_date: formData.usage_date,
                notes: formData.notes || ''
            };

            if (formData?.id) {
                await equipmentService.updateUsage(formData.id, payload);
                toast.success('Usage entry updated');
            } else {
                await equipmentService.createUsage(equipmentId, payload);
                toast.success('Usage logged');
            }

            setIsUsageModalOpen(false);
            await handleUsageRefresh();
        } catch (err) {
            toast.error('Failed to save usage');
        } finally {
            setIsLoading(false);
        }
    };

    const openUsageEditModal = (log: any) => {
        const equipment = equipmentList.find(eq => eq.id === log.equipment_id);
        if (equipment) setSelectedEquipment(equipment);
        setFormData({
            id: log.id,
            equipment_id: log.equipment_id,
            working_hours: log.working_hours,
            fuel_used: log.fuel_used,
            usage_date: log.usage_date,
            notes: log.notes || ''
        });
        setIsUsageModalOpen(true);
    };

    const handleUsageDelete = async (usageId: number) => {
        if (!usageId) return;
        setIsLoading(true);
        try {
            await equipmentService.deleteUsage(usageId);
            toast.success('Usage entry deleted');
            await handleUsageRefresh();
        } catch (err) {
            toast.error('Failed to delete usage entry');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferForm.equipment_id || !transferForm.to_project_id) {
            toast.error('Select equipment and destination project');
            return;
        }

        setIsLoading(true);
        try {
            await equipmentService.transferEquipment({
                equipment_id: Number(transferForm.equipment_id),
                to_project_id: Number(transferForm.to_project_id),
                transfer_date: transferForm.transfer_date,
                condition_notes: transferForm.condition_notes || ''
            });
            toast.success('Equipment transfer initiated');
            setIsTransferModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Failed to initiate transfer');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsageRefresh = async () => {
        await fetchData();
        if (selectedEquipment) {
            try {
                const logs = await equipmentService.listUsage(selectedEquipment.id);
                setSelectedEquipmentLogs(prev => ({ ...prev, usage: logs }));
            } catch (err) {
                console.error('Failed to refresh usage logs', err);
            }
        }
    };

    const handleMaintenanceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const equipmentId = selectedEquipment?.id || formData.equipment_id;
        if (!equipmentId) return;
        setIsLoading(true);
        try {
            await equipmentService.createMaintenance(equipmentId, {
                description: formData.description || '',
                maintenance_date: formData.maintenance_date || new Date().toISOString().split('T')[0],
                cost: Number(formData.cost || 0),
                next_maintenance_date: formData.next_maintenance_date || undefined,
                project_id: formData.project_id ? Number(formData.project_id) : selectedEquipment?.project_id
            });
            toast.success('Maintenance scheduled');
            setIsMaintenanceModalOpen(false);
            await fetchData();
            if (activeTab === "Maintenance" && selectedEquipment) {
                try {
                    const maintLogs = await equipmentService.listMaintenance(selectedEquipment.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, maint: maintLogs }));
                } catch (err) {
                    setSelectedEquipmentLogs(prev => ({ ...prev, maint: [] }));
                }
            }
        } catch (err) {
            toast.error('Failed to schedule maintenance');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRentalSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const equipmentId = selectedEquipment?.id || formData.equipment_id;
        if (!equipmentId) return;
        setIsLoading(true);
        try {
            const payload = {
                start_date: formData.start_date,
                end_date: formData.end_date,
                rental_cost: Number(formData.rental_cost || 0),
                client_name: formData.client_name || '',
                notes: formData.notes || '',
                project_id: formData.project_id ? Number(formData.project_id) : undefined,
                boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : undefined
            };
            if (formData.id) {
                await equipmentService.updateRental(formData.id, payload);
            } else {
                await equipmentService.createRental(equipmentId, payload);
            }
            toast.success('Rental record added');
            setIsRentalModalOpen(false);
            setIsRentalViewOnly(false);
            await fetchData();
        } catch (err: any) {
            const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to add rental record';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRentalDelete = async (rentalId: number) => {
        if (!rentalId) return;
        setIsLoading(true);
        try {
            await equipmentService.deleteRental(rentalId);
            toast.success('Rental record deleted');
            // refresh selected equipment rentals
            if (selectedEquipment) {
                const res = await equipmentService.listRental(selectedEquipment.id);
                setSelectedEquipmentLogs(prev => ({ ...prev, rental: res }));
            }
            // refresh aggregated history
            const results = await Promise.all((equipmentList || []).map(eq => equipmentService.listRental(eq.id).catch(() => [])));
            setAllRentalLogs(results.flat());
        } catch (err) {
            toast.error('Failed to delete rental record');
        } finally {
            setIsLoading(false);
        }
    };

    const viewRental = async (rentalId: number) => {
        try {
            const res = await equipmentService.getRental(rentalId);
            setFormData(res);
            const eq = equipmentList.find(eq => eq.id === res.equipment_id);
            if (eq) setSelectedEquipment(eq);
            setIsRentalViewOnly(true);
            setIsRentalModalOpen(true);
        } catch (err) {
            toast.error('Failed to load rental details');
        }
    };

    const handleDelete = async () => {
        if (!selectedEquipment) return;
        setIsLoading(true);
        try {
            await equipmentService.deleteEquipment(selectedEquipment.id);
            toast.success('Equipment deleted');
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Failed to delete equipment');
        } finally {
            setIsLoading(false);
        }
    };

    const renderRegistry = () => (
        <div className="space-y-4 h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Equipment Register</h2>
            <div className="flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by name, code or operator..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="All">All Conditions</option>
                            <option value="GOOD">GOOD</option>
                            <option value="REPAIR">REPAIR</option>
                            <option value="DAMAGED">DAMAGED</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="All">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.project_name || `Project ${project.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-sm text-slate-500">Use table actions to update equipment or log activity.</div>
                        <button onClick={() => { setFormData({}); setIsViewOnly(false); setIsEquipmentModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4" /> Add Equipment
                        </button>
                    </div>
                </div>

                <div className="overflow-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-200">Equipment</th>
                                <th className="px-6 py-4 border-b border-slate-200">Operator</th>
                                <th className="px-6 py-4 border-b border-slate-200">Usage</th>
                                <th className="px-6 py-4 border-b border-slate-200">Condition</th>
                                <th className="px-6 py-4 border-b border-slate-200">Maintenance</th>
                                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading equipment registry...</td></tr>
                            ) : pagedData.length > 0 ? pagedData.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{item.equipment_name}</p>
                                        <p className="text-xs text-slate-500">{item.equipment_code}</p>
                                        <p className="text-[10px] font-bold mt-1 text-primary">
                                            {item.project_id ? (projects.find(p => Number(p.id) === Number(item.project_id))?.project_name || projects.find(p => Number(p.id) === Number(item.project_id))?.name || `Project ${item.project_id}`) : 'Not Allocated'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{item.operator_name || '—'}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {item.working_hours ?? 'N/A'} hrs<br />
                                        <span className="text-xs text-slate-400">{item.fuel_used ?? '0'} L Fuel</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                            {item.condition}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{item.maintenance_date || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openViewModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => openAllocateModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Allocate"><Link2 className="w-4 h-4" /></button>
                                            <button onClick={() => openTransferModal(item)} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded" title="Transfer"><ArrowRightLeft className="w-4 h-4" /></button>
                                            <button onClick={() => openUsageModal(item)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded" title="Log Usage"><Activity className="w-4 h-4" /></button>
                                            <button onClick={() => openMaintenanceModal(item)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Maintenance"><Wrench className="w-4 h-4" /></button>
                                            <button onClick={() => openRentalModal(item)} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded" title="Rental"><FileText className="w-4 h-4" /></button>
                                            <button onClick={() => openLogsModal(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded" title="Audit Logs"><History className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No machinery records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderUsage = () => {
        const totalHrs = usageReport.reduce((sum, r) => sum + (r.total_hours || 0), 0);
        const totalFuel = usageReport.reduce((sum, r) => sum + (r.total_fuel || 0), 0);
        const totalCount = usageReport.reduce((sum, r) => sum + (r.usage_count || 0), 0);

        return (
            <div className="space-y-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Usage Analytics</h2>
                        <p className="text-sm text-slate-500">Track equipment activity, fuel consumption, and recent log details.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={handleUsageRefresh} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all">
                            <RefreshCcw className="w-4 h-4" /> Refresh
                        </button>
                        <button onClick={() => { setFormData({ equipment_id: selectedEquipment?.id || undefined, working_hours: 0, fuel_used: 0, usage_date: new Date().toISOString().split('T')[0], notes: '' }); setIsUsageModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                            <Plus className="w-4 h-4" /> Log Usage
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Total Hours Logged", value: totalHrs.toString(), sub: "Across all equipment", accent: "text-blue-500" },
                        { title: "Total Fuel Consumed", value: `${totalFuel} L`, sub: "Across all equipment", accent: "text-orange-500" },
                        { title: "Usage Entries", value: totalCount.toString(), sub: "Total log records", accent: "text-emerald-500" }
                    ].map((stat) => (
                        <div key={stat.title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">{stat.title}</p>
                            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-800">Usage Report Summary</h3>
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white sticky top-0 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Equipment</th>
                                        <th className="px-4 py-3">Hours</th>
                                        <th className="px-4 py-3">Fuel (L)</th>
                                        <th className="px-4 py-3">Entries</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading usage report...</td></tr>
                                    ) : filteredUsage.length > 0 ? filteredUsage.map((report: any) => {
                                        const equipment = equipmentList.find(eq => eq.id === report.equipment_id);
                                        return (
                                            <tr key={report.equipment_id} onClick={() => equipment && setSelectedEquipment(equipment)} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedEquipment?.id === report.equipment_id ? 'bg-slate-100' : ''}`}>
                                                <td className="px-4 py-4 font-semibold text-slate-800">{report.equipment_code}</td>
                                                <td className="px-4 py-4 text-slate-700">{report.total_hours}</td>
                                                <td className="px-4 py-4 text-orange-600 font-bold">{report.total_fuel}</td>
                                                <td className="px-4 py-4 text-slate-500">{report.usage_count}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={4} className="p-10 text-center text-slate-400">No usage reports found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-800">Logs {selectedEquipment ? `— ${selectedEquipment.equipment_code}` : "(Select equipment)"}</h3>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-4 max-h-[500px]">
                            {selectedEquipmentLogs.usage.length > 0 ? selectedEquipmentLogs.usage.map((log) => (
                                <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{log.usage_date}</p>
                                            <p className="text-xs text-slate-500">{log.notes || 'No notes added'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => openUsageEditModal(log)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-primary hover:border-primary transition">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => handleUsageDelete(log.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fuel</p>
                                        <span className="rounded-2xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{log.fuel_used} L</span>
                                        <span className="rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">{log.working_hours} hrs</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-400 text-sm mt-10">Select equipment to view logs</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransfer = () => (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Transfer Equipment</h2>
                    <p className="text-sm text-slate-500">Create a transfer request for equipment between active projects or return it to the central yard.</p>
                </div>
                <button onClick={() => { setTransferForm({ equipment_id: selectedEquipment?.id, to_project_id: undefined, transfer_date: new Date().toISOString().split('T')[0], condition_notes: '' }); setIsTransferModalOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                    <ArrowRightLeft className="w-4 h-4" /> Create Transfer
                </button>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                {isLoading ? (
                    <div className="text-center max-w-xl mx-auto mb-10">
                        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-500 shadow-sm">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Loading Equipment</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-500">Please wait while equipment data is being loaded.</p>
                    </div>
                ) : filteredEquipment.length === 0 ? (
                    <div className="text-center max-w-xl mx-auto mb-10">
                        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Initiate Equipment Transfer</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-500">Click the Create Transfer button at the top right to seamlessly transfer equipment between active projects or return it to the central yard.</p>
                    </div>
                ) : (
                    <div className="overflow-auto rounded-3xl border border-slate-100 bg-slate-50 shadow-sm">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 border-b border-slate-200">Equipment</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Current Project</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Condition</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Usage</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredEquipment.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{item.equipment_name}</p>
                                            <p className="text-xs text-slate-500">{item.equipment_code}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{item.project_id ? (projects.find(p => Number(p.id) === Number(item.project_id))?.project_name || projects.find(p => Number(p.id) === Number(item.project_id))?.name || `Project ${item.project_id}`) : 'Not Allocated'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{item.working_hours ?? 'N/A'} hrs</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => { setSelectedEquipment(item); openTransferModal(item); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-all">
                                                <ArrowRightLeft className="w-4 h-4" /> Transfer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderMaintenance = () => (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Maintenance & Servicing</h2>
                    <p className="text-sm text-slate-500">Schedule and review equipment maintenance records with project-level visibility.</p>
                </div>
                <button onClick={() => {
                    setFormData({
                        equipment_id: selectedEquipment?.id || undefined,
                        description: '',
                        maintenance_date: new Date().toISOString().split('T')[0],
                        cost: 0,
                        next_maintenance_date: '',
                        project_id: selectedEquipment?.project_id || effectiveProjectId || ''
                    });
                    setIsMaintenanceModalOpen(true);
                }} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                    <Plus className="w-4 h-4" /> Schedule Maintenance
                </button>
            </div>

            {maintenanceAlerts.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {maintenanceAlerts.map((alert, i) => (
                        <div key={i} onClick={() => {
                            const eq = equipmentList.find(e => e.id === alert.equipment_id);
                            if (eq) setSelectedEquipment(eq);
                        }} className={`cursor-pointer min-w-[250px] rounded-xl border p-4 ${alert.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} hover:scale-[1.02] transition-transform`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800">{alert.equipment_code}</h4>
                                    <p className="text-xs text-slate-600 mt-1">Due: {alert.maintenance_date} ({alert.days_until} days)</p>
                                </div>
                                <Wrench className={`w-4 h-4 ${alert.status === 'OVERDUE' ? 'text-red-500' : 'text-amber-500'}`} />
                            </div>
                            <span className={`inline-block mt-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${alert.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {alert.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 max-h-[520px] overflow-auto">
                    <h3 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Select Equipment</h3>
                    {equipmentList.length > 0 ? equipmentList.map(eq => (
                        <button key={eq.id} onClick={() => setSelectedEquipment(eq)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedEquipment?.id === eq.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}>
                            {eq.equipment_code}
                            <span className="block text-xs text-slate-400 truncate">{eq.equipment_name}</span>
                        </button>
                    )) : (
                        <div className="px-4 py-5 text-sm text-slate-500">No equipment available.</div>
                    )}
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-sm text-slate-800">Maintenance Logs {selectedEquipment ? `— ${selectedEquipment.equipment_name}` : "(Select equipment)"}</h3>
                    </div>
                    <div className="overflow-auto max-h-[520px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Next Due</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading maintenance records...</td></tr>
                                ) : selectedEquipmentLogs.maint.length > 0 ? selectedEquipmentLogs.maint.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 whitespace-nowrap">{log.maintenance_date}</td>
                                        <td className="p-4 text-slate-700">{log.description}</td>
                                        <td className="p-4 font-bold text-slate-800">₹{(log.cost || 0).toLocaleString()}</td>
                                        <td className="p-4">{log.next_maintenance_date || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${log.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {log.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">No maintenance records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRental = () => {
        const totalCost = rentalCostReport.reduce((s, r) => s + (r.total_cost || 0), 0);
        const rentalCount = rentalCostReport.reduce((s, r) => s + (r.rental_count || 0), 0);
        const totalDays = rentalCostReport.reduce((s, r) => s + (r.total_days || 0), 0);
        const avgRevPerDay = totalDays ? Math.round(totalCost / totalDays) : 0;

        return (
            <div className="space-y-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Rental & Cost Tracking</h2>
                        <p className="text-sm text-slate-500">Overview of rentals and per-equipment rental history.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selectedEquipment?.id || ''} onChange={(e) => {
                            const id = e.target.value ? Number(e.target.value) : undefined;
                            const eq = equipmentList.find(x => Number(x.id) === Number(id));
                            setSelectedEquipment(eq || null);
                        }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white">
                            <option value="">Select equipment</option>
                            {equipmentList.map(eq => (
                                <option key={eq.id} value={eq.id}>{eq.equipment_code} - {eq.equipment_name}</option>
                            ))}
                        </select>
                        <button onClick={() => { setFormData({ equipment_id: selectedEquipment?.id || undefined, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], rental_cost: 0, client_name: '', notes: '', project_id: selectedEquipment?.project_id || effectiveProjectId || '', boq_item_id: '' }); setIsRentalModalOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-white text-sm font-bold hover:bg-violet-600 transition-all shadow-lg">
                            <Plus className="w-4 h-4" /> Add Rental
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total Rental Cost</p>
                        <p className="text-2xl font-bold text-violet-600">₹{totalCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">All time</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Rental Count</p>
                        <p className="text-2xl font-bold text-slate-800">{rentalCount}</p>
                        <p className="text-xs text-slate-500 mt-1">Contracts executed</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total Days</p>
                        <p className="text-2xl font-bold text-slate-800">{totalDays}</p>
                        <p className="text-xs text-slate-500 mt-1">Days rented out</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Avg Rev/Day</p>
                        <p className="text-2xl font-bold text-amber-500">₹{avgRevPerDay.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Across fleet</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-slate-800">Rental History</h3>
                        <div className="text-sm text-slate-500">Select equipment</div>
                    </div>
                    <div className="overflow-auto max-h-[220px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase font-bold text-slate-500">
                                <tr><th className="p-3">Start Date</th><th className="p-3">End Date</th><th className="p-3">Rental Cost</th><th className="p-3">Client</th><th className="p-3">Notes</th><th className="p-3">Created At</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedEquipment && isLoading ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading rental records...</td></tr>
                                ) : selectedEquipment && selectedEquipmentLogs.rental.length > 0 ? selectedEquipmentLogs.rental.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="p-3 whitespace-nowrap">{r.start_date}</td>
                                        <td className="p-3 whitespace-nowrap">{r.end_date}</td>
                                        <td className="p-3 font-bold">₹{(r.rental_cost || 0).toLocaleString()}</td>
                                        <td className="p-3">{r.client_name}</td>
                                        <td className="p-3 text-slate-600">{r.notes}</td>
                                        <td className="p-3 text-slate-500">{r.created_at ? r.created_at.split('T')[0] : '-'}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${r.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>{r.status || 'ACTIVE'}</span></td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setSelectedEquipment(equipmentList.find(eq => eq.id === r.equipment_id) || null); setFormData({ id: r.id, equipment_id: r.equipment_id, start_date: r.start_date, end_date: r.end_date, rental_cost: r.rental_cost, client_name: r.client_name, notes: r.notes, project_id: r.project_id || effectiveProjectId }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleRentalDelete(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={8} className="p-10 text-center text-slate-400">No rental records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <h3 className="font-bold text-sm text-slate-800 mb-3">All Rental History</h3>
                    <div className="overflow-auto max-h-[320px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="p-3">Equipment</th>
                                    <th className="p-3">Start Date</th>
                                    <th className="p-3">End Date</th>
                                    <th className="p-3">Rental Cost</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Notes</th>
                                    <th className="p-3">Duration</th>
                                    <th className="p-3">Per Day Cost</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={9} className="p-8 text-center text-slate-400">Loading rental history...</td></tr>
                                ) : allRentalLogs.length > 0 ? allRentalLogs.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-bold">{equipmentList.find(eq => eq.id === r.equipment_id)?.equipment_code || `EQ-${r.equipment_id}`}</td>
                                        <td className="p-3">{r.start_date}</td>
                                        <td className="p-3">{r.end_date}</td>
                                        <td className="p-3">₹{(r.rental_cost || 0).toLocaleString()}</td>
                                        <td className="p-3">{r.client_name}</td>
                                        <td className="p-3 text-slate-500 max-w-[200px] truncate" title={r.notes}>{r.notes || '-'}</td>
                                        <td className="p-3">{r.duration ?? '-'}</td>
                                        <td className="p-3">{r.per_day_cost ? `₹${r.per_day_cost.toLocaleString()}` : '-'}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => viewRental(r.id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setIsRentalViewOnly(false); setSelectedEquipment(equipmentList.find(eq => eq.id === r.equipment_id) || null); setFormData({ id: r.id, equipment_id: r.equipment_id, start_date: r.start_date, end_date: r.end_date, rental_cost: r.rental_cost, client_name: r.client_name, notes: r.notes, project_id: r.project_id || effectiveProjectId, boq_item_id: r.boq_item_id }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleRentalDelete(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={9} className="p-10 text-center text-slate-400">No rental records found in history</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderAlerts = () => (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Intelligence & Export</h2>
                <div className="flex gap-3">
                    <button onClick={async () => { toast.loading("Generating PDF...", { id: 'pdf' }); await equipmentService.exportPdf(); toast.success("PDF downloaded!", { id: 'pdf' }); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                        <FileText className="w-4 h-4 text-rose-500" /> Export PDF
                    </button>
                    <button onClick={async () => { toast.loading("Generating Excel...", { id: 'xl' }); await equipmentService.exportExcel(); toast.success("Excel downloaded!", { id: 'xl' }); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                        <Download className="w-4 h-4 text-emerald-500" /> Export Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> <h3 className="font-bold text-sm text-slate-800">Utilization Rate</h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-[400px] overflow-auto">
                        {utilizationReport.map(r => (
                            <div key={r.equipment_id}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-slate-700">{r.equipment_code}</span>
                                    <span className="font-medium text-slate-500">{r.total_hours} hrs ({r.utilization_rate}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${r.utilization_rate > 75 ? 'bg-rose-500' : r.utilization_rate > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, r.utilization_rate)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> <h3 className="font-bold text-sm text-slate-800">Availability Map</h3>
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white sticky top-0 font-bold text-slate-400 text-[10px] uppercase">
                                <tr><th className="p-4">Code</th><th className="p-4">Status</th><th className="p-4">Project ID</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {availability.map(a => (
                                    <tr key={a.equipment_id} className="hover:bg-slate-50">
                                        <td className="p-4 font-bold text-slate-700">{a.equipment_code}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {a.is_available ? 'Available' : 'Allocated'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono">{a.project_id || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-8 p-6">
            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { title: "Total Equipment", value: dashStats.totalEquipment.toString(), sub: "Registered units", accent: "text-slate-800" },
                        { title: "Available", value: dashStats.available.toString(), sub: "Not allocated", accent: "text-emerald-500" },
                        { title: "Allocated", value: dashStats.allocated.toString(), sub: "Deployed to projects", accent: "text-blue-500" },
                        { title: "Maintenance Alerts", value: dashStats.maintenanceAlerts.toString(), sub: "Pending checks", accent: "text-amber-500" },
                        { title: "Equipment Alerts", value: dashStats.equipmentAlerts.toString(), sub: "Critical issues", accent: "text-rose-500" },
                        { title: "Rental Cost", value: `₹${dashStats.rentalCost.toLocaleString()}`, sub: "Current period", accent: "text-purple-500" }
                    ].map((stat) => (
                        <div key={stat.title} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">{stat.title}</p>
                            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Alerts</h3>
                    <div className="space-y-4">
                        {equipmentAlerts.length > 0 ? equipmentAlerts.slice(0, 4).map((alert) => (
                            <div key={alert.equipment_id || alert.equipment_code || Math.random()} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{alert.equipment_name}</p>
                                        <p className="text-xs text-slate-500">{alert.equipment_code}</p>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-rose-600 bg-rose-100 rounded-full px-2 py-1">Alert</span>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">{alert.issues.map((issue: any) => `${issue.type} (${issue.current_hours}/${issue.limit})`).join(' • ')}</p>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-400">No current alerts.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Action Items</h3>
                    <div className="space-y-3 text-sm text-slate-600">
                        <p>• Use the Registry tab to add or update equipment details.</p>
                        <p>• Track usage and maintenance entries in dedicated tabs.</p>
                        <p>• Review rental costs and alerts before approving deployments.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Navbar title="Asset Command" breadcrumb={["Manager", "Resources", "Equipment Registry"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Machinery & Equipment</h1>
                        <p className="text-slate-500 text-sm">Complete lifecycle tracking — allocation, usage, maintenance, cost.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ProjectSelector variant="page" />
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        {activeTab === "Machinery & Equipment List" && (
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Total: {filteredEquipment.length}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Dashboard" && renderDashboard()}
                        {activeTab === "Machinery & Equipment List" && renderRegistry()}
                        {activeTab === "Usage" && renderUsage()}
                        {activeTab === "Transfer Equipment" && renderTransfer()}
                        {activeTab === "Maintenance" && renderMaintenance()}
                        {activeTab === "Rental" && renderRental()}
                        {activeTab === "Reports & Alerts" && renderAlerts()}
                    </div>
                    {activeTab !== "Dashboard" && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={currentListData.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setCurrentPage}
                            label={activeTab === "Machinery & Equipment List" ? "Assets" : activeTab === "Transfer Equipment" ? "Transfers" : "Records"}
                        />
                    )}
                </div>
            </PageTransition>

            <EquipmentFormModal
                isOpen={isEquipmentModalOpen}
                onClose={() => setIsEquipmentModalOpen(false)}
                onSave={async (data) => {
                    try {
                        if (data.id) await equipmentService.updateEquipment(data.id, data);
                        else await equipmentService.createEquipment(data);
                        toast.success("Registry updated");
                        setIsEquipmentModalOpen(false);
                        fetchData();
                    } catch (err) { toast.error("Failed to save asset"); }
                }}
                initialData={formData}
                selectedProjectId={effectiveProjectId}
                isViewOnly={isViewOnly}
            />

            <Modal isOpen={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Equipment" maxWidth="max-w-md">
                <div className="space-y-4 p-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Project</label>
                        {effectiveProjectId ? (
                            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
                                {projects.find(project => Number(project.id) === Number(effectiveProjectId))?.project_name || `Project ${effectiveProjectId}`}
                            </div>
                        ) : (
                            <select value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-primary/20">
                                <option value="">Select project</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.project_name || `Project ${project.id}`}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsAllocateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">Cancel</button>
                        <button type="button" onClick={handleAllocate} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl">Allocate</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title="Log Equipment Usage" maxWidth="max-w-md">
                <form onSubmit={handleUsageSave} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || selectedEquipment?.id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Working Hours *</label>
                            <input type="number" min="0" required value={formData.working_hours || ''} onChange={(e) => setFormData({ ...formData, working_hours: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fuel Used (L) *</label>
                            <input type="number" min="0" required value={formData.fuel_used || ''} onChange={(e) => setFormData({ ...formData, fuel_used: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Usage Date *</label>
                        <input type="date" required value={formData.usage_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, usage_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Notes</label>
                        <textarea rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsUsageModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20">Save Usage</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title="Schedule Maintenance" maxWidth="max-w-md">
                <form onSubmit={handleMaintenanceSave} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || selectedEquipment?.id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description *</label>
                            <input type="text" required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Maintenance Date *</label>
                            <input type="date" required value={formData.maintenance_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cost (₹) *</label>
                            <input type="number" min="0" required value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Next Maintenance Date</label>
                            <input type="date" value={formData.next_maintenance_date || ''} onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Project *</label>
                        <select required value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : '' })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary">
                            <option value="">-- Select Project --</option>
                            {assignedProjects.map(project => (
                                <option key={project.id} value={project.id}>{project.project_name || `Project ${project.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">BOQ Item (Optional)</label>
                        <select value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : '' })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary">
                            <option value="">-- Choose BOQ Item --</option>
                            {boqItems.map((boq: any) => (
                                <option key={boq.id} value={boq.id}>{boq.item_name || boq.name || `BOQ ${boq.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20">Save Maintenance</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isRentalModalOpen} onClose={() => { setIsRentalModalOpen(false); setIsRentalViewOnly(false); }} title={isRentalViewOnly ? "View Rental" : (formData.id ? "Edit Rental" : "Add Rental Record")} maxWidth="max-w-md">
                <form onSubmit={handleRentalSave} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required disabled={isRentalViewOnly} value={formData.equipment_id || selectedEquipment?.id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">START DATE *</label>
                            <input type="date" required disabled={isRentalViewOnly} value={formData.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">END DATE *</label>
                            <input type="date" required disabled={isRentalViewOnly} value={formData.end_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RENTAL COST (₹) *</label>
                        <input type="number" min="0" required disabled={isRentalViewOnly} value={formData.rental_cost || ''} onChange={(e) => setFormData({ ...formData, rental_cost: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CLIENT NAME *</label>
                        <input type="text" required disabled={isRentalViewOnly} value={formData.client_name || ''} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT (OPTIONAL)</label>
                        <select disabled={isRentalViewOnly} value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : '' })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Select Project --</option>
                            {assignedProjects.map(project => (
                                <option key={project.id} value={project.id}>{project.project_name || `Project ${project.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BOQ ITEM (OPTIONAL)</label>
                        <select disabled={isRentalViewOnly} value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : '' })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose BOQ Item --</option>
                            {boqItems.map((boq: any) => (
                                <option key={boq.id} value={boq.id}>{boq.item_name || boq.name || `BOQ ${boq.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NOTES</label>
                        <textarea rows={2} disabled={isRentalViewOnly} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        {isRentalViewOnly ? (
                            <button type="button" onClick={() => { setIsRentalModalOpen(false); setIsRentalViewOnly(false); }} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Close</button>
                        ) : (
                            <>
                                <button type="button" onClick={() => { setIsRentalModalOpen(false); setIsRentalViewOnly(false); }} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20">{formData.id ? 'Update Rental' : 'Add Rental'}</button>
                            </>
                        )}
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Equipment" maxWidth="max-w-md">
                <form onSubmit={handleTransferSubmit} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment *</label>
                        <select required value={transferForm.equipment_id || selectedEquipment?.id || ''} onChange={(e) => setTransferForm({ ...transferForm, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-primary/20">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Project *</label>
                        <select required value={transferForm.to_project_id || ''} onChange={(e) => setTransferForm({ ...transferForm, to_project_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-primary/20">
                            <option value="">-- Select destination project --</option>
                            {assignedProjects.filter(project => Number(project.id) !== Number(selectedEquipment?.project_id)).map(project => (
                                <option key={project.id} value={project.id}>{project.project_name || `Project ${project.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-3">
                        <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">Initiate Transfer</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title={`Audit Logs — ${selectedEquipment?.equipment_name || ''}`} maxWidth="max-w-2xl">
                <div className="p-6 font-inter space-y-3 max-h-[600px] overflow-y-auto">
                    {auditLogs.length > 0 ? auditLogs.map((log: any, idx: number) => {
                        const actionColors: Record<string, string> = {
                            ALLOCATE: 'bg-blue-100 text-blue-700',
                            DEALLOCATE: 'bg-amber-100 text-amber-700',
                            CREATE: 'bg-emerald-100 text-emerald-700',
                            UPDATE: 'bg-purple-100 text-purple-700',
                            DELETE: 'bg-rose-100 text-rose-700',
                            RENTAL_CREATE: 'bg-violet-100 text-violet-700',
                            MAINTENANCE_CREATE: 'bg-orange-100 text-orange-700',
                            USAGE_CREATE: 'bg-cyan-100 text-cyan-700',
                        };
                        const colorClass = actionColors[log.action] || 'bg-slate-100 text-slate-600';

                        const getProjectName = (id: any) => {
                            if (!id) return 'Not Allocated';
                            const p = projects.find(p => Number(p.id) === Number(id));
                            return p ? (p.project_name || p.name) : `Project #${id}`;
                        };

                        const renderDetails = () => {
                            const ov = log.old_values;
                            const nv = log.new_values;

                            if (log.action === 'ALLOCATE') {
                                return (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">From</span>
                                            <span className="text-sm font-semibold text-slate-600">{getProjectName(ov?.project_id)}</span>
                                        </div>
                                        <span className="text-slate-400 text-lg">→</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">To</span>
                                            <span className="text-sm font-bold text-blue-700">{getProjectName(nv?.project_id)}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (log.action === 'DEALLOCATE') {
                                return (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Released From</span>
                                            <span className="text-sm font-semibold text-slate-600">{getProjectName(ov?.project_id)}</span>
                                        </div>
                                        <span className="text-slate-400 text-lg">→</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                                            <span className="text-sm font-bold text-amber-600">Not Allocated</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (log.action === 'CREATE') {
                                const vals = nv || {};
                                return (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        {vals.equipment_name && <div><span className="text-slate-400 text-xs">Name: </span><span className="font-semibold text-slate-700">{vals.equipment_name}</span></div>}
                                        {vals.equipment_code && <div><span className="text-slate-400 text-xs">Code: </span><span className="font-semibold text-slate-700">{vals.equipment_code}</span></div>}
                                        {vals.operator_name && <div><span className="text-slate-400 text-xs">Operator: </span><span className="font-semibold text-slate-700">{vals.operator_name}</span></div>}
                                        {vals.condition && <div><span className="text-slate-400 text-xs">Condition: </span><span className="font-semibold text-slate-700">{vals.condition}</span></div>}
                                        {vals.project_id && <div><span className="text-slate-400 text-xs">Project: </span><span className="font-semibold text-slate-700">{getProjectName(vals.project_id)}</span></div>}
                                        {vals.rental_cost !== undefined && <div><span className="text-slate-400 text-xs">Rental Cost: </span><span className="font-semibold text-slate-700">₹{vals.rental_cost}</span></div>}
                                    </div>
                                );
                            }

                            if (log.action === 'RENTAL_CREATE') {
                                const vals = nv || {};
                                return (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        {vals.client_name && <div><span className="text-slate-400 text-xs">Client: </span><span className="font-semibold text-slate-700">{vals.client_name}</span></div>}
                                        {vals.rental_cost !== undefined && <div><span className="text-slate-400 text-xs">Cost: </span><span className="font-semibold text-slate-700">₹{vals.rental_cost}</span></div>}
                                        {vals.start_date && <div><span className="text-slate-400 text-xs">Start: </span><span className="font-semibold text-slate-700">{vals.start_date}</span></div>}
                                        {vals.end_date && <div><span className="text-slate-400 text-xs">End: </span><span className="font-semibold text-slate-700">{vals.end_date}</span></div>}
                                    </div>
                                );
                            }

                            if (log.action === 'MAINTENANCE_CREATE') {
                                const vals = nv || {};
                                return (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        {vals.description && <div className="col-span-2"><span className="text-slate-400 text-xs">Description: </span><span className="font-semibold text-slate-700">{vals.description}</span></div>}
                                        {vals.maintenance_date && <div><span className="text-slate-400 text-xs">Date: </span><span className="font-semibold text-slate-700">{vals.maintenance_date}</span></div>}
                                        {vals.cost !== undefined && <div><span className="text-slate-400 text-xs">Cost: </span><span className="font-semibold text-slate-700">₹{vals.cost}</span></div>}
                                    </div>
                                );
                            }

                            if (log.action === 'USAGE_CREATE') {
                                const vals = nv || {};
                                return (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        {vals.working_hours !== undefined && <div><span className="text-slate-400 text-xs">Working Hours: </span><span className="font-semibold text-slate-700">{vals.working_hours} hrs</span></div>}
                                        {vals.fuel_used !== undefined && <div><span className="text-slate-400 text-xs">Fuel Used: </span><span className="font-semibold text-slate-700">{vals.fuel_used} L</span></div>}
                                        {vals.usage_date && <div><span className="text-slate-400 text-xs">Date: </span><span className="font-semibold text-slate-700">{vals.usage_date}</span></div>}
                                        {vals.notes && <div className="col-span-2"><span className="text-slate-400 text-xs">Notes: </span><span className="font-semibold text-slate-700">{vals.notes}</span></div>}
                                    </div>
                                );
                            }

                            if (log.action === 'UPDATE') {
                                const allKeys = Array.from(new Set([...Object.keys(ov || {}), ...Object.keys(nv || {})]));
                                const changedKeys = allKeys.filter(k => JSON.stringify((ov || {})[k]) !== JSON.stringify((nv || {})[k]));
                                if (changedKeys.length === 0) return <span className="text-xs text-slate-400">No meaningful changes</span>;
                                return (
                                    <div className="space-y-1">
                                        {changedKeys.map(k => (
                                            <div key={k} className="flex items-center gap-2 text-sm flex-wrap">
                                                <span className="text-slate-500 text-xs capitalize">{k.replace(/_/g, ' ')}:</span>
                                                <span className="text-slate-500 line-through text-xs">{k === 'project_id' ? getProjectName((ov || {})[k]) : String((ov || {})[k] ?? '—')}</span>
                                                <span className="text-slate-400">→</span>
                                                <span className="font-semibold text-slate-700 text-xs">{k === 'project_id' ? getProjectName((nv || {})[k]) : String((nv || {})[k] ?? '—')}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            return <span className="text-xs text-slate-400">Action recorded</span>;
                        };

                        return (
                            <div key={idx} className={`rounded-2xl border border-slate-200 p-4 ${colorClass}`}>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 uppercase tracking-[0.18em]">{log.action?.replace(/_/g, ' ') || 'Audit Event'}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at || log.timestamp || Date.now()).toLocaleString()}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">{log.user_name || log.performed_by || 'System'}</span>
                                </div>
                                <div className="mt-4 text-sm text-slate-700">
                                    {renderDetails()}
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-slate-500">No audit logs available for this equipment.</p>
                    )}
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Equipment"
                message="Are you sure you want to delete this equipment record? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};

export default EquipmentRegistryPage;
