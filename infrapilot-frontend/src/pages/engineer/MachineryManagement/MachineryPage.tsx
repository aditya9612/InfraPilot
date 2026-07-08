import { useState, useMemo, useEffect } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import { equipmentService } from "../../../services/equipmentService";
import { projectService } from "../../../services/projectService";
import { boqService } from "../../../services/boqService";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, CostReport,
    UtilizationReport, AvailabilityReport, UsageItem, MaintenanceItem, RentalItem, AuditLog
} from "../../../services/equipmentService";

import {
    Search, Plus, Edit2, Trash2, Eye, FileText, Wrench, Activity,
    AlertTriangle, ShieldCheck, Download, Link2, History, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react";
import EquipmentFormModal from "./EquipmentFormModal";

// Types mapping for condition colors
const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

const conditionDisplay: Record<string, string> = {
    'GOOD': 'GOOD',
    'REPAIR': 'REPAIR',
    'DAMAGED': 'DAMAGED',
    'MAINTENANCE': 'MAINTENANCE',
};

const TABS = ["Dashboard", "Machinery & Equipment List", "Usage", "Maintenance", "Rental", "Purchase", "Reports & Alerts"];

const MachineryPage = () => {
    // ─── Project Context ──────────────────────────────────────────────
    const getProjectIdFromStorage = (): number | null => {
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                const user = JSON.parse(userStr);
                const pId = user?.default_project_id || user?.project_id || user?.user?.project_id;
                if (pId) return Number(pId);
            }
        } catch (e) { }
        return null;
    };

    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(getProjectIdFromStorage);

    // Re-sync when Settings page changes the active project (storage event)
    useEffect(() => {
        const onStorageChange = () => {
            setSelectedProjectId(getProjectIdFromStorage());
        };
        window.addEventListener('storage', onStorageChange);
        return () => window.removeEventListener('storage', onStorageChange);
    }, []);

    // ─── Main States ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);

    // ─── Data States ──────────────────────────────────────────────────
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [availability, setAvailability] = useState<AvailabilityReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [equipmentAlerts, setEquipmentAlerts] = useState<EquipmentAlert[]>([]);

    // Tab 3: Usage
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [boqsList, setBoqsList] = useState<any[]>([]);
    const [selectedEquipmentLogs, setSelectedEquipmentLogs] = useState<{ usage: UsageItem[], maint: MaintenanceItem[], rental: RentalItem[] }>({ usage: [], maint: [], rental: [] });

    // Tab 5: Rental
    const [costReport, setCostReport] = useState<CostReport[]>([]);
    const [allRentals, setAllRentals] = useState<RentalItem[]>([]);
    const [rentalCurrentPage, setRentalCurrentPage] = useState(1);
    const [rentalItemsPerPage, setRentalItemsPerPage] = useState(10);

    // Tab 6: Reports
    const [utilizationReport, setUtilizationReport] = useState<UtilizationReport[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // ─── UI / Form States ──────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [conditionFilter, setConditionFilter] = useState("All");
    const [allocationFilter, setAllocationFilter] = useState<'All' | 'Allocated' | 'Unallocated'>("All");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Selected items for modals
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [allocationStatus, setAllocationStatus] = useState<{ allocated: boolean, project_id: number | null }>({ allocated: false, project_id: null });

    // Modals visibility
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isMaintenanceDeleteModalOpen, setIsMaintenanceDeleteModalOpen] = useState(false);
    const [maintenanceToDelete, setMaintenanceToDelete] = useState<{ id: number, equipment_id: number } | null>(null);
    const [isRentalViewModalOpen, setIsRentalViewModalOpen] = useState(false);
    const [rentalToView, setRentalToView] = useState<any>(null);
    const [isRentalDeleteModalOpen, setIsRentalDeleteModalOpen] = useState(false);
    const [rentalToDelete, setRentalToDelete] = useState<{ id: number, equipment_id: number } | null>(null);
    const [purchaseReport, setPurchaseReport] = useState<any[]>([]);
    
    // New Modals for Transfer & Purchase
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isPurchaseHistoryModalOpen, setIsPurchaseHistoryModalOpen] = useState(false);
    const [purchaseHistoryData, setPurchaseHistoryData] = useState<any>(null);

    // Form Data
    const [formData, setFormData] = useState<any>({});
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(projectsList);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };
        fetchProjects();
    }, []);

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProjectId = e.target.value ? Number(e.target.value) : null;
        setSelectedProjectId(newProjectId);
        if (newProjectId) {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    const selectedProjObj = projects.find(p => Number(p.id) === newProjectId);

                    parsed.project_id = newProjectId;
                    parsed.default_project_id = newProjectId;
                    if (selectedProjObj) {
                        parsed.project_name = selectedProjObj.project_name || selectedProjObj.name;
                    }
                    if (parsed.user) {
                        parsed.user.project_id = newProjectId;
                        if (selectedProjObj) {
                            parsed.user.project_name = selectedProjObj.project_name || selectedProjObj.name;
                        }
                    }
                    localStorage.setItem("infrapilot_user", JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch(e) {}
        }
    };

    // ─── Data Fetching ─────────────────────────────────────────────────

    // Helper to wrap API calls
    const withLoading = async (fn: () => Promise<void>) => {
        setIsLoading(true);
        try { await fn(); }
        catch (err) { console.error(err); toast.error("Failed to load data"); }
        finally { setIsLoading(false); }
    };

    // Load data based on active tab
    useEffect(() => {
        const eqParams = selectedProjectId ? { limit: 100, project_id: selectedProjectId } : { limit: 100 };
        const pIdObj = selectedProjectId ? { project_id: selectedProjectId } : undefined;
        withLoading(async () => {
            if (activeTab === "Dashboard") {
                const [eqRes, avail, mAlerts, eAlerts, cost] = await Promise.all([
                    equipmentService.listEquipment(eqParams),
                    equipmentService.getAvailabilityReport(pIdObj),
                    equipmentService.getMaintenanceAlerts(pIdObj),
                    equipmentService.getEquipmentAlerts(pIdObj),
                    equipmentService.getCostReport(pIdObj)
                ]);
                setEquipmentList(eqRes.items || []);
                setAvailability(avail);
                setMaintenanceAlerts(mAlerts);
                setEquipmentAlerts(eAlerts);
                setCostReport(cost);
            }
            else if (activeTab === "Machinery & Equipment List") {
                const res = await equipmentService.listEquipment(eqParams);
                setEquipmentList(res.items || []);
            }
            else if (activeTab === "Usage") {
                const [res, report, boqs] = await Promise.all([
                    equipmentService.listEquipment(eqParams),
                    equipmentService.getUsageReport(pIdObj),
                    selectedProjectId ? boqService.getBoqs({ project_id: selectedProjectId, limit: 100, skip: 0 } as any).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })
                ]);
                const eqList = res.items || [];
                setEquipmentList(eqList);
                setUsageReport(report);
                setBoqsList(Array.isArray(boqs) ? boqs : ((boqs as any).items || (boqs as any).data || []));
                if (!selectedEquipment && eqList.length > 0) setSelectedEquipment(eqList[0]);
            }
            else if (activeTab === "Maintenance") {
                const [res, mAlerts, boqs] = await Promise.all([
                    equipmentService.listEquipment(eqParams),
                    equipmentService.getMaintenanceAlerts(pIdObj),
                    selectedProjectId ? boqService.getBoqs({ project_id: selectedProjectId, limit: 100, skip: 0 } as any).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })
                ]);
                const eqList = res.items || [];
                setEquipmentList(eqList);
                setMaintenanceAlerts(mAlerts);
                setBoqsList(Array.isArray(boqs) ? boqs : ((boqs as any).items || (boqs as any).data || []));
                if (!selectedEquipment && eqList.length > 0) setSelectedEquipment(eqList[0]);
            }
            else if (activeTab === "Rental") {
                const [res, cost] = await Promise.all([
                    equipmentService.listEquipment(eqParams),
                    equipmentService.getCostReport(pIdObj)
                ]);
                const eqList = res.items || [];
                setEquipmentList(eqList);
                setCostReport(cost);
                if (!selectedEquipment && eqList.length > 0) setSelectedEquipment(eqList[0]);
                
                // Fetch all rentals
                try {
                    const rentalsArrays = await Promise.all(eqList.map(eq => equipmentService.listRental(eq.id)));
                    const flatRentals = rentalsArrays.flat().sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime());
                    setAllRentals(flatRentals);
                } catch(e) { console.error("Failed to fetch all rentals"); }
            }
            else if (activeTab === "Purchase") {
                const res = await equipmentService.listEquipment(eqParams);
                const eqList = res.items || [];
                setEquipmentList(eqList);
                if (!selectedEquipment && eqList.length > 0) setSelectedEquipment(eqList[0]);
            }
            else if (activeTab === "Reports & Alerts") {
                const [avail, util, eqRes, purchaseRes] = await Promise.all([
                    equipmentService.getAvailabilityReport(pIdObj),
                    equipmentService.getUtilizationReport(pIdObj),
                    equipmentService.listEquipment(eqParams),
                    equipmentService.getPurchaseReport(pIdObj).catch(() => [])
                ]);
                setAvailability(avail);
                setUtilizationReport(util);
                setEquipmentList(eqRes.items || []);
                setPurchaseReport(purchaseRes || []);
            }
        });
    }, [activeTab, selectedProjectId]);

    // Fetch equipment specific logs when selected in Usage/Maintenance/Rental/Logs tabs
    useEffect(() => {
        if (!selectedEquipment) return;

        if (activeTab === "Usage") {
            equipmentService.listUsage(selectedEquipment.id).then(res => setSelectedEquipmentLogs(prev => ({ ...prev, usage: res })));
        } else if (activeTab === "Maintenance") {
            equipmentService.listMaintenance(selectedEquipment.id).then(res => setSelectedEquipmentLogs(prev => ({ ...prev, maint: res })));
        } else if (activeTab === "Rental") {
            equipmentService.listRental(selectedEquipment.id).then(res => setSelectedEquipmentLogs(prev => ({ ...prev, rental: res })));
        } else if (activeTab === "Reports & Alerts" || isLogsModalOpen) {
            equipmentService.getAuditLogs(selectedEquipment.id, { limit: 20, offset: 0 }).then(res => setAuditLogs(res.items || []));
        }
    }, [selectedEquipment, activeTab, isLogsModalOpen]);

    // Fetch BOQs dynamically for Usage, Maintenance, and Rental modals
    useEffect(() => {
        if (isUsageModalOpen || isMaintenanceModalOpen || isRentalModalOpen) {
            const eq = equipmentList.find(e => e.id === formData.equipment_id);
            const projectId = formData.project_id || eq?.project_id || selectedProjectId;
            if (projectId) {
                boqService.getBoqs({ project_id: projectId, limit: 100, skip: 0 } as any)
                    .then(boqs => setBoqsList(Array.isArray(boqs) ? boqs : ((boqs as any).items || (boqs as any).data || [])))
                    .catch(() => setBoqsList([]));
            } else {
                boqService.getBoqs({ limit: 100, skip: 0 } as any)
                    .then(boqs => setBoqsList(Array.isArray(boqs) ? boqs : ((boqs as any).items || (boqs as any).data || [])))
                    .catch(() => setBoqsList([]));
            }
        }
    }, [isUsageModalOpen, isMaintenanceModalOpen, isRentalModalOpen, formData.project_id, formData.equipment_id, selectedProjectId, equipmentList]);


    // ─── Handlers ─────────────────────────────────────────────────────

    const handleSaveEquipmentModal = async (submittedData: any) => {
        try {
            if (submittedData.id) {
                await equipmentService.updateEquipment(submittedData.id, submittedData);
                toast.success("Equipment updated successfully!");
            } else {
                const payload = { ...submittedData };
                if (!payload.project_id) {
                    payload.project_id = null;
                }
                const newEq = await equipmentService.createEquipment(payload);

                // Force deallocate immediately to ensure it starts as Unallocated
                try {
                    if (newEq && newEq.id) {
                        await equipmentService.deallocateEquipment(newEq.id);
                    }
                } catch (err) {
                    console.error("Failed to explicitly deallocate new equipment", err);
                }

                toast.success("Equipment added successfully!");
            }
            setIsEquipmentModalOpen(false);
            const res = await equipmentService.listEquipment({ limit: 100 });
            setEquipmentList(res.items || []);
        } catch (error) {
            toast.error("Failed to save equipment");
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await equipmentService.deleteEquipment(itemToDelete);
            toast.success("Equipment deleted successfully!");
            setIsDeleteModalOpen(false);
            const res = await equipmentService.listEquipment({ limit: 100 });
            setEquipmentList(res.items || []);
        } catch (error) {
            toast.error("Failed to delete equipment");
        }
    };

    const handleAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipment) return;
        try {
            await equipmentService.allocateEquipment(selectedEquipment.id, formData.project_id || selectedProjectId);
            toast.success("Equipment allocated successfully!");
            setIsAllocateModalOpen(false);
            // Refetch equipment list so UI reflects the new allocation status immediately
            const res = await equipmentService.listEquipment({ limit: 100 });
            setEquipmentList(res.items || []);
        } catch (error) {
            toast.error("Failed to allocate equipment");
        }
    };

    const handleDeallocate = async () => {
        if (!selectedEquipment) return;
        try {
            await equipmentService.deallocateEquipment(selectedEquipment.id);
            toast.success("Equipment deallocated!");
            setIsAllocateModalOpen(false);
            // Refetch equipment list so UI reflects the new allocation status immediately
            const res = await equipmentService.listEquipment({ limit: 100 });
            setEquipmentList(res.items || []);
        } catch (error) {
            toast.error("Failed to deallocate equipment");
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipment || !formData.project_id) return;
        try {
            await equipmentService.transferEquipment({ equipment_id: selectedEquipment.id, to_project_id: formData.project_id });
            toast.success("Equipment transferred successfully!");
            setIsTransferModalOpen(false);
            const res = await equipmentService.listEquipment({ limit: 100 });
            setEquipmentList(res.items || []);
        } catch (error) {
            toast.error("Failed to transfer equipment");
        }
    };

    const handleSaveUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.usage_id) {
                await equipmentService.updateUsage(formData.usage_id, {
                    working_hours: Number(formData.working_hours),
                    fuel_used: Number(formData.fuel_used),
                    usage_date: formData.usage_date || new Date().toISOString().split('T')[0],
                    notes: formData.notes
                });
            } else {
                await equipmentService.createUsage(formData.equipment_id, {
                    ...formData,
                    usage_date: formData.usage_date || new Date().toISOString().split('T')[0]
                } as any);
            }
            toast.success(formData.usage_id ? "Usage updated successfully!" : "Usage logged successfully!");
            setIsUsageModalOpen(false);
            if (activeTab === "Usage") {
                const report = await equipmentService.getUsageReport({ project_id: selectedProjectId || undefined });
                setUsageReport(report);
                const eq = equipmentList.find(e => e.id === formData.equipment_id);
                if (eq) {
                    setSelectedEquipment(eq);
                    const logs = await equipmentService.listUsage(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, usage: logs }));
                }
            }
        } catch (error) {
            toast.error(formData.usage_id ? "Failed to update usage" : "Failed to log usage");
        }
    };

    const handleDeleteUsage = async (usage_id: number, equipment_id: number) => {
        if (!window.confirm("Are you sure you want to delete this usage log?")) return;
        try {
            await equipmentService.deleteUsage(usage_id);
            toast.success("Usage log deleted");
            if (activeTab === "Usage") {
                const report = await equipmentService.getUsageReport({ project_id: selectedProjectId || undefined });
                setUsageReport(report);
                const eq = equipmentList.find(e => e.id === equipment_id);
                if (eq) {
                    const logs = await equipmentService.listUsage(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, usage: logs }));
                }
            }
        } catch (error) {
            toast.error("Failed to delete usage log");
        }
    };
    const handleDeleteMaintenanceConfirm = async () => {
        if (!maintenanceToDelete) return;
        try {
            await equipmentService.deleteMaintenance(maintenanceToDelete.id);
            toast.success("Maintenance record deleted");
            if (activeTab === "Maintenance") {
                const alerts = await equipmentService.getMaintenanceAlerts({ project_id: selectedProjectId || undefined });
                setMaintenanceAlerts(alerts);
                const eq = equipmentList.find(e => e.id === maintenanceToDelete.equipment_id);
                if (eq) {
                    const logs = await equipmentService.listMaintenance(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, maint: logs }));
                }
            }
        } catch (error) {
            toast.error("Failed to delete maintenance record");
        } finally {
            setIsMaintenanceDeleteModalOpen(false);
            setMaintenanceToDelete(null);
        }
    };

    const handleSaveMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await equipmentService.updateMaintenance(formData.id, {
                    ...formData,
                    maintenance_date: formData.maintenance_date || new Date().toISOString().split('T')[0]
                } as any);
                toast.success("Maintenance updated!");
            } else {
                await equipmentService.createMaintenance(formData.equipment_id, {
                    ...formData,
                    maintenance_date: formData.maintenance_date || new Date().toISOString().split('T')[0]
                } as any);
                toast.success("Maintenance scheduled!");
            }
            setIsMaintenanceModalOpen(false);
            if (activeTab === "Maintenance") {
                const alerts = await equipmentService.getMaintenanceAlerts({ project_id: selectedProjectId || undefined });
                setMaintenanceAlerts(alerts);
                const eq = equipmentList.find(e => e.id === formData.equipment_id);
                if (eq) {
                    setSelectedEquipment(eq);
                    const logs = await equipmentService.listMaintenance(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, maint: logs }));
                }
            }
        } catch (error) {
            toast.error("Failed to save maintenance");
        }
    };

    const handleSaveRental = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const payload = {
                ...formData,
                start_date: formData.start_date || today.toISOString().split('T')[0],
                end_date: formData.end_date || tomorrow.toISOString().split('T')[0]
            } as any;

            if (formData.id) {
                await equipmentService.updateRental(formData.id, payload);
                toast.success("Rental updated successfully!");
            } else {
                await equipmentService.createRental(formData.equipment_id, payload);
                toast.success("Rental added successfully!");
            }
            setIsRentalModalOpen(false);
            if (activeTab === "Rental") {
                const report = await equipmentService.getCostReport({ project_id: selectedProjectId || undefined });
                setCostReport(report);
                const eq = equipmentList.find(e => e.id === formData.equipment_id);
                if (eq) {
                    setSelectedEquipment(eq);
                    const logs = await equipmentService.listRental(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, rental: logs }));
                }
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Failed to add rental";
            toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
    };

    const handleDeleteRentalConfirm = async () => {
        if (!rentalToDelete) return;
        try {
            await equipmentService.deleteRental(rentalToDelete.id);
            toast.success("Rental record deleted");
            if (activeTab === "Rental") {
                const report = await equipmentService.getCostReport({ project_id: selectedProjectId || undefined });
                setCostReport(report);
                const eq = equipmentList.find(e => e.id === rentalToDelete.equipment_id);
                if (eq) {
                    const logs = await equipmentService.listRental(eq.id);
                    setSelectedEquipmentLogs(prev => ({ ...prev, rental: logs }));
                }
                try {
                    const rentalsArrays = await Promise.all(equipmentList.map(eq => equipmentService.listRental(eq.id)));
                    const flatRentals = rentalsArrays.flat().sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime());
                    setAllRentals(flatRentals);
                } catch(e) {}
            }
        } catch (error) {
            toast.error("Failed to delete rental record");
        } finally {
            setIsRentalDeleteModalOpen(false);
            setRentalToDelete(null);
        }
    };

    // Open view modal and fetch allocation
    const openViewModal = async (eq: Equipment) => {
        setSelectedEquipment(eq);
        setIsViewModalOpen(true);
        try {
            const alloc = await equipmentService.getAllocation(eq.id);
            setAllocationStatus(alloc);
        } catch (e) {
            setAllocationStatus({ allocated: false, project_id: null });
        }
    };

    const openAllocateModal = async (eq: Equipment) => {
        setSelectedEquipment(eq);
        setIsAllocateModalOpen(true);
        try {
            const alloc = await equipmentService.getAllocation(eq.id);
            setAllocationStatus(alloc);
            setFormData({ project_id: alloc.project_id || selectedProjectId });
        } catch (e) {
            setAllocationStatus({ allocated: false, project_id: null });
            setFormData({ project_id: selectedProjectId });
        }
    };

    // ─── Filters & Computations ───────────────────────────────────────

    const filteredEquipmentList = useMemo(() => {
        return equipmentList.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === "" ||
                item.equipment_name.toLowerCase().includes(term) ||
                item.equipment_code.toLowerCase().includes(term) ||
                item.operator_name.toLowerCase().includes(term);
            const matchesCondition = conditionFilter === "All" || item.condition === conditionFilter;

            // Strict project filter: if a project is selected, show ONLY that project's equipment
            // (no unallocated, no other project's equipment)
            let matchesProject = true;
            if (selectedProjectId) {
                matchesProject = Number(item.project_id) === Number(selectedProjectId);
            }

            // Within already-project-filtered items, apply allocation filter if needed
            let matchesAllocation = true;
            if (allocationFilter === "Allocated") {
                matchesAllocation = item.project_id != null;
            } else if (allocationFilter === "Unallocated") {
                matchesAllocation = item.project_id == null;
            }

            return matchesSearch && matchesCondition && matchesProject && matchesAllocation;
        });
    }, [equipmentList, searchTerm, conditionFilter, allocationFilter, selectedProjectId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, conditionFilter, allocationFilter]);

    const paginatedEquipmentList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEquipmentList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEquipmentList, currentPage, itemsPerPage]);

    const paginatedAllRentals = useMemo(() => {
        const startIndex = (rentalCurrentPage - 1) * rentalItemsPerPage;
        return allRentals.slice(startIndex, startIndex + rentalItemsPerPage);
    }, [allRentals, rentalCurrentPage, rentalItemsPerPage]);

    // Dashboard Stats
    const dashStats = useMemo(() => {
        const total = equipmentList.length;
        const avail = availability.filter(a => a.is_available).length;
        const alloc = availability.filter(a => !a.is_available).length;
        const maint = maintenanceAlerts.length;
        const alerts = equipmentAlerts.length;
        const totalRental = costReport.reduce((sum, item) => sum + (item.total_cost || 0), 0);
        return { total, avail, alloc, maint, alerts, totalRental };
    }, [equipmentList, availability, maintenanceAlerts, equipmentAlerts, costReport]);


    // ─── Tab Renderers ────────────────────────────────────────────────

    const renderDashboard = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { title: "Total Equipment", value: dashStats.total.toString(), sub: "Registered Units", accent: "text-slate-800", action: () => { setActiveTab("Machinery & Equipment List"); setAllocationFilter("All"); } },
                        { title: "Available", value: dashStats.avail.toString(), sub: "Ready for deploy", accent: "text-emerald-500", action: () => { setActiveTab("Machinery & Equipment List"); setAllocationFilter("Unallocated"); } },
                        { title: "Allocated", value: dashStats.alloc.toString(), sub: "Currently in use", accent: "text-blue-500", action: () => { setActiveTab("Machinery & Equipment List"); setAllocationFilter("Allocated"); } },
                        { title: "Maintenance Due", value: dashStats.maint.toString(), sub: "Upcoming/Overdue", accent: "text-amber-500", action: () => setActiveTab("Maintenance") },
                        { title: "Equipment Alerts", value: dashStats.alerts.toString(), sub: "Issues detected", accent: "text-rose-500", action: () => setActiveTab("Reports & Alerts") },
                        { title: "Total Rental/Mo", value: `₹${dashStats.totalRental.toLocaleString()}`, sub: "Estimated cost", accent: "text-purple-500", action: () => setActiveTab("Rental") }
                    ].map((s) => (
                        <div key={s.title} onClick={s.action} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">{s.title}</p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Alerts & Maintenance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                    {/* Maintenance Alerts */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-amber-500" /> Maintenance Alerts
                        </h3>
                        <div className="space-y-3">
                            {maintenanceAlerts.length > 0 ? maintenanceAlerts.map((alert, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{alert.equipment_code}</p>
                                        <p className="text-xs text-slate-500">Due in {alert.days_until} days ({alert.maintenance_date})</p>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${alert.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {alert.status}
                                    </span>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-sm">No maintenance alerts</div>
                            )}
                        </div>
                    </div>

                    {/* Equipment Alerts */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" /> Equipment Alerts
                        </h3>
                        <div className="space-y-3">
                            {equipmentAlerts.length > 0 ? equipmentAlerts.map((alert, i) => (
                                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-slate-800">{alert.equipment_name} <span className="text-xs text-slate-500">({alert.equipment_code})</span></h4>
                                    </div>
                                    <ul className="text-xs text-slate-600 list-disc list-inside mb-2">
                                        {alert.issues.map((issue, j) => (
                                            <li key={j} className={issue.severity === 'HIGH' ? 'text-rose-600 font-medium' : 'text-amber-600'}>
                                                {issue.type}: {issue.current_hours}hrs (Limit: {issue.limit})
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-xs font-medium text-slate-700 bg-white p-2 rounded border border-slate-200">Recommendation: {alert.recommendation}</p>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-sm">No equipment alerts</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEquipmentList = () => (
        <div className="space-y-4 h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Equipment Register</h2>
            <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by name, code or operator..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary">
                            <option value="All">All Conditions</option>
                            {Object.keys(conditionDisplay).map(k => <option key={k} value={k}>{conditionDisplay[k]}</option>)}
                        </select>
                        <select value={allocationFilter} onChange={(e) => setAllocationFilter(e.target.value as any)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary">
                            <option value="All">All Projects</option>
                            <option value="Allocated">Allocated</option>
                            <option value="Unallocated">Deallocated</option>
                        </select>
                    </div>
                    <button onClick={() => { setFormData({}); setIsEquipmentModalOpen(true); }} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 whitespace-nowrap shrink-0">
                        <Plus className="w-4 h-4" /> Add Equipment
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left min-w-[1000px]">
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
                        <tbody className="divide-y divide-slate-100">
                            {paginatedEquipmentList.length > 0 ? paginatedEquipmentList.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="font-bold text-sm text-slate-800">{item.equipment_name}</p>
                                        <p className="text-xs text-slate-500">{item.equipment_code}</p>
                                        <p className="text-[10px] font-bold text-primary mt-0.5">
                                            {item.project_id ? (projects.find(p => Number(p.id) === Number(item.project_id))?.project_name || projects.find(p => Number(p.id) === Number(item.project_id))?.name || `PRJ-${item.project_id}`) : 'Not Allocated'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-700">{item.operator_name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-700">
                                        N/A
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                            {conditionDisplay[item.condition] || item.condition}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-700">{item.maintenance_date}</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openViewModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => { setFormData(item); setIsEquipmentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => openAllocateModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Allocate"><Link2 className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsTransferModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded" title="Transfer"><ExternalLink className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsUsageModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded" title="Log Usage"><Activity className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsMaintenanceModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Maintenance"><Wrench className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded" title="Rental"><FileText className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedEquipment(item); setIsLogsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded" title="Audit Logs"><History className="w-4 h-4" /></button>
                                            <button onClick={() => { setItemToDelete(item.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400">🚜 No equipment found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── Pagination Controls ──────────────────────────────────────────────────────── */}
                {filteredEquipmentList.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                        {/* Left: Items per page */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Center: Showing info */}
                        <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEquipmentList.length)} of {filteredEquipmentList.length} records
                        </div>

                        {/* Right: Pagination */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {(() => {
                                const totalItems = filteredEquipmentList.length;
                                const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                const pages = [];
                                if (totalPages <= 5) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    if (currentPage <= 3) {
                                        pages.push(1, 2, 3, 4, '...', totalPages);
                                    } else if (currentPage >= totalPages - 2) {
                                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                    } else {
                                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                    }
                                }

                                return pages.map((page, index) => {
                                    if (page === '...') {
                                        return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                    }
                                    const pageNum = page as number;
                                    const isActive = currentPage === pageNum;
                                    return (
                                        <button
                                            key={`page-${pageNum}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                });
                            })()}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredEquipmentList.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(filteredEquipmentList.length / itemsPerPage)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderUsage = () => {
        const totalHrs = usageReport.reduce((sum, r) => sum + r.total_hours, 0);
        const totalFuel = usageReport.reduce((sum, r) => sum + r.total_fuel, 0);
        const totalCount = usageReport.reduce((sum, r) => sum + r.usage_count, 0);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Usage Analytics</h2>
                    <button onClick={() => { setFormData({}); setIsUsageModalOpen(true); }} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                        <Plus className="w-4 h-4" /> Log Usage
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Total Hours Logged", value: totalHrs.toString(), sub: "All equipment", accent: "text-blue-500" },
                        { title: "Total Fuel Consumed", value: `${totalFuel} L`, sub: "All equipment", accent: "text-orange-500" },
                        { title: "Usage Entries", value: totalCount.toString(), sub: "Total logs recorded", accent: "text-emerald-500" }
                    ].map((s) => (
                        <div key={s.title} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-default group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.title}</p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-sm text-slate-800">Usage Report Summary</h3></div>
                        <div className="overflow-auto max-h-[400px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 font-bold text-slate-500 text-[10px] uppercase">
                                    <tr><th className="p-4">Equipment</th><th className="p-4">Total Hrs</th><th className="p-4">Total Fuel</th><th className="p-4">Avg Hrs</th><th className="p-4">Entries</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {usageReport.map(r => (
                                        <tr key={r.equipment_id} onClick={() => setSelectedEquipment(equipmentList.find(e => e.id === r.equipment_id) || null)} className="hover:bg-slate-50 cursor-pointer">
                                            <td className="p-4 font-bold text-primary">{r.equipment_code}</td>
                                            <td className="p-4">{r.total_hours}</td>
                                            <td className="p-4">{r.total_fuel}</td>
                                            <td className="p-4">{r.avg_hours.toFixed(1)}</td>
                                            <td className="p-4">{r.usage_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-800">
                                Logs {selectedEquipment ? `— ${selectedEquipment.equipment_code}` : "(Select equipment)"}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3 max-h-[400px]">
                            {selectedEquipmentLogs.usage.length > 0 ? selectedEquipmentLogs.usage.map(log => (
                                <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-600">{log.usage_date}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-600">{log.working_hours} hrs</span>
                                            <button onClick={() => { setFormData({ ...log, usage_id: log.id, equipment_id: log.equipment_id || selectedEquipment?.id }); setIsUsageModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-500 rounded"><Edit2 className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteUsage(log.id, log.equipment_id || selectedEquipment?.id || 0)} className="p-1 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">{log.fuel_used} L Fuel</p>
                                    {log.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{log.notes}</p>}
                                </div>
                            )) : <div className="text-center text-slate-400 text-sm mt-10">No logs to display</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMaintenance = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Maintenance & Servicing</h2>
                <button onClick={() => { setFormData({}); setIsMaintenanceModalOpen(true); }} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                    <Plus className="w-4 h-4" /> Schedule Maintenance
                </button>
            </div>

            {maintenanceAlerts.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {maintenanceAlerts.map((alert, i) => (
                        <div key={i} onClick={() => {
                            const eq = equipmentList.find(e => e.id === alert.equipment_id);
                            if (eq) setSelectedEquipment(eq);
                        }} className={`cursor-pointer hover:scale-[1.02] transition-transform min-w-[250px] p-4 rounded-xl border ${alert.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-slate-800">{alert.equipment_code}</h4>
                                <Wrench className={`w-4 h-4 ${alert.status === 'OVERDUE' ? 'text-red-500' : 'text-amber-500'}`} />
                            </div>
                            <p className="text-xs text-slate-600 mt-1">Due: {alert.maintenance_date} ({alert.days_until} days)</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${alert.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{alert.status}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 max-h-[500px] overflow-auto">
                    <h3 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Select Equipment</h3>
                    {equipmentList.map(eq => (
                        <button key={eq.id} onClick={() => setSelectedEquipment(eq)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedEquipment?.id === eq.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}>
                            {eq.equipment_code} <span className="text-xs text-slate-400 block truncate">{eq.equipment_name}</span>
                        </button>
                    ))}
                </div>
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-sm text-slate-800">
                            Maintenance Logs {selectedEquipment ? `— ${selectedEquipment.equipment_name}` : "(Select equipment)"}
                        </h3>
                    </div>
                    <div className="overflow-auto max-h-[440px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0 font-bold text-slate-500 text-[10px] uppercase whitespace-nowrap">
                                <tr>
                                    <th className="p-4">Project</th>
                                    <th className="p-4">BOQ Item</th>
                                    <th className="p-4">Equipment</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Maintenance Date</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Next Maintenance Date</th>
                                    <th className="p-4">Is Completed</th>
                                    <th className="p-4">Completed At</th>
                                    <th className="p-4">Created At</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedEquipmentLogs.maint.length > 0 ? selectedEquipmentLogs.maint.map((logItem: any) => {
                                    const log = logItem as any;
                                    return (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="p-4 whitespace-nowrap">{log.project_id ? (projects.find(p => p.id === log.project_id)?.project_name || projects.find(p => p.id === log.project_id)?.name || `Project #${log.project_id}`) : '-'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.boq_item_id ? (boqsList.find(b => b.id === log.boq_item_id)?.item_name || `BOQ Item #${log.boq_item_id}`) : '-'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.equipment_id ? (equipmentList.find(e => e.id === log.equipment_id)?.equipment_name || selectedEquipment?.equipment_name || `Equipment #${log.equipment_id}`) : '-'}</td>
                                        <td className="p-4 text-slate-700 min-w-[150px]">{log.description || '-'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.maintenance_date || '-'}</td>
                                        <td className="p-4 font-bold text-slate-800">₹{log.cost?.toLocaleString() || '0'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.next_maintenance_date || '-'}</td>
                                        <td className="p-4">{log.is_completed ? 'True' : 'False'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}</td>
                                        <td className="p-4 whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${log.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{log.status}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => { setFormData({ ...log, equipment_id: log.equipment_id || selectedEquipment?.id }); setIsMaintenanceModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => {
                                                    setMaintenanceToDelete({ id: log.id, equipment_id: log.equipment_id || selectedEquipment?.id || 0 });
                                                    setIsMaintenanceDeleteModalOpen(true);
                                                }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}) : <tr><td colSpan={12} className="p-8 text-center text-slate-400">No maintenance records found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRental = () => {
        const tCost = costReport.reduce((s, r) => s + r.total_cost, 0);
        const tCount = costReport.reduce((s, r) => s + r.rental_count, 0);
        const tDays = costReport.reduce((s, r) => s + r.total_days, 0);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Rental & Cost Tracking</h2>
                    <button onClick={() => { setFormData({}); setIsRentalModalOpen(true); }} className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
                        <Plus className="w-4 h-4" /> Add Rental
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { title: "Total Rental Cost", value: `₹${tCost.toLocaleString()}`, sub: "All time", accent: "text-purple-600" },
                        { title: "Rental Count", value: tCount.toString(), sub: "Contracts executed", accent: "text-blue-500" },
                        { title: "Total Days", value: tDays.toString(), sub: "Days rented out", accent: "text-emerald-500" },
                        { title: "Avg Rev/Day", value: `₹${tDays > 0 ? Math.round(tCost / tDays).toLocaleString() : 0}`, sub: "Across fleet", accent: "text-amber-500" }
                    ].map((s) => (
                        <div key={s.title} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-default group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.title}</p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Specific Equipment Rental History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                Rental History
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Equipment</span>
                                <select 
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary"
                                    value={selectedEquipment?.id || ""}
                                    onChange={(e) => {
                                        const eq = equipmentList.find(item => item.id === Number(e.target.value));
                                        if (eq) setSelectedEquipment(eq);
                                    }}
                                >
                                    {equipmentList.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.equipment_code} - {eq.equipment_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[440px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 font-bold text-slate-500 text-[10px] uppercase">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">Start Date</th>
                                        <th className="p-4 whitespace-nowrap">End Date</th>
                                        <th className="p-4 whitespace-nowrap">Rental Cost</th>
                                        <th className="p-4 whitespace-nowrap">Client Name</th>
                                        <th className="p-4 whitespace-nowrap">Notes</th>
                                        <th className="p-4 whitespace-nowrap">Created At</th>
                                        <th className="p-4 whitespace-nowrap">Status</th>
                                        <th className="p-4 whitespace-nowrap">Duration</th>
                                        <th className="p-4 whitespace-nowrap">Per Day Cost</th>
                                        <th className="p-4 whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedEquipmentLogs.rental.length > 0 ? selectedEquipmentLogs.rental.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-700 whitespace-nowrap">{log.start_date}</td>
                                            <td className="p-4 text-slate-700 whitespace-nowrap">{log.end_date}</td>
                                            <td className="p-4 font-bold text-purple-600 whitespace-nowrap">₹{log.rental_cost?.toLocaleString()}</td>
                                            <td className="p-4 font-bold text-slate-700 whitespace-nowrap">{log.client_name}</td>
                                            <td className="p-4 text-slate-500 max-w-[150px] truncate" title={log.notes}>{log.notes || '-'}</td>
                                            <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${log.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{log.status || 'COMPLETED'}</span>
                                            </td>
                                            <td className="p-4 text-slate-700 whitespace-nowrap">{log.duration} days</td>
                                            <td className="p-4 text-slate-500 whitespace-nowrap">₹{log.per_day_cost?.toLocaleString()}</td>
                                            <td className="p-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={async () => {
                                                        const rentalDetails = await equipmentService.getRental(log.id);
                                                        setRentalToView(rentalDetails);
                                                        setIsRentalViewModalOpen(true);
                                                    }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setFormData({ ...log, equipment_id: log.equipment_id || selectedEquipment?.id }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => {
                                                        setRentalToDelete({ id: log.id, equipment_id: log.equipment_id || selectedEquipment?.id || 0 });
                                                        setIsRentalDeleteModalOpen(true);
                                                    }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={9} className="p-8 text-center text-slate-400">No rental records found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* All Rental History Container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-800">
                                All Rental History
                            </h3>
                        </div>
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10 font-bold text-slate-500 text-[10px] uppercase tracking-wider shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Equipment</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Start Date</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">End Date</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Rental Cost</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Client Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Notes</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200">Status</th>
                                        <th className="px-6 py-4 whitespace-nowrap border-b border-slate-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedAllRentals.length > 0 ? paginatedAllRentals.map(log => {
                                        const eq = equipmentList.find(e => e.id === log.equipment_id);
                                        return (
                                        <tr key={`${log.equipment_id}-${log.id}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-bold text-slate-800">{eq?.equipment_code || `EQ-${log.equipment_id}`}</td>
                                            <td className="px-6 py-3 text-slate-700">{log.start_date}</td>
                                            <td className="px-6 py-3 text-slate-700">{log.end_date}</td>
                                            <td className="px-6 py-3 font-bold text-purple-600">₹{log.rental_cost?.toLocaleString()}</td>
                                            <td className="px-6 py-3 font-bold text-slate-700">{log.client_name}</td>
                                            <td className="px-6 py-3 text-slate-500 max-w-[150px] truncate" title={log.notes}>{log.notes || '-'}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${log.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{log.status || 'COMPLETED'}</span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={async () => {
                                                        const rentalDetails = await equipmentService.getRental(log.id);
                                                        setRentalToView(rentalDetails);
                                                        setIsRentalViewModalOpen(true);
                                                    }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setFormData({ ...log, equipment_id: log.equipment_id || selectedEquipment?.id }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => {
                                                        setRentalToDelete({ id: log.id, equipment_id: log.equipment_id || selectedEquipment?.id || 0 });
                                                        setIsRentalDeleteModalOpen(true);
                                                    }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}) : <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400">No rental records found in history</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination for All Rentals */}
                        {allRentals.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white font-inter rounded-b-2xl mt-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                    <select
                                        value={rentalItemsPerPage}
                                        onChange={(e) => { setRentalItemsPerPage(Number(e.target.value)); setRentalCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                    Showing {(rentalCurrentPage - 1) * rentalItemsPerPage + 1} - {Math.min(rentalCurrentPage * rentalItemsPerPage, allRentals.length)} of {allRentals.length} records
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setRentalCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={rentalCurrentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {(() => {
                                        const totalItems = allRentals.length;
                                        const totalPages = Math.max(1, Math.ceil(totalItems / rentalItemsPerPage));
                                        const pages = [];
                                        if (totalPages <= 5) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                        } else {
                                            if (rentalCurrentPage <= 3) {
                                                pages.push(1, 2, 3, 4, '...', totalPages);
                                            } else if (rentalCurrentPage >= totalPages - 2) {
                                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pages.push(1, '...', rentalCurrentPage - 1, rentalCurrentPage, rentalCurrentPage + 1, '...', totalPages);
                                            }
                                        }
                                        return pages.map((page, index) => {
                                            if (page === '...') return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                            const pageNum = page as number;
                                            const isActive = rentalCurrentPage === pageNum;
                                            return (
                                                <button
                                                    key={`page-${pageNum}`}
                                                    onClick={() => setRentalCurrentPage(pageNum)}
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        });
                                    })()}
                                    <button
                                        onClick={() => setRentalCurrentPage(prev => Math.min(Math.ceil(allRentals.length / rentalItemsPerPage), prev + 1))}
                                        disabled={rentalCurrentPage >= Math.ceil(allRentals.length / rentalItemsPerPage)}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderReports = () => (
        <div className="space-y-6">
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" /> <h3 className="font-bold text-sm text-slate-800">Purchase Analytics</h3>
                    </div>
                    <div className="p-6">
                        {purchaseReport.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {purchaseReport.map((p, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{p.category || 'General Equipment'}</p>
                                        <p className="text-2xl font-bold text-slate-800 mb-1">₹{p.total_cost?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-slate-500 font-medium">{p.purchase_count || 0} Assets Purchased</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <FileText className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm font-medium">No purchase data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPurchase = () => (
        <div className="space-y-4 h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Equipment Purchase Tracker</h2>
            <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800">Select equipment to view purchase history</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-200">Equipment Name</th>
                                <th className="px-6 py-4 border-b border-slate-200">Code</th>
                                <th className="px-6 py-4 border-b border-slate-200">Condition</th>
                                <th className="px-6 py-4 border-b border-slate-200 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {equipmentList.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-sm text-slate-800">{item.equipment_name}</td>
                                    <td className="px-6 py-3 text-xs text-slate-500 font-mono">{item.equipment_code}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                            {conditionDisplay[item.condition] || item.condition}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={async () => {
                                                setSelectedEquipment(item);
                                                try {
                                                    const hist = await equipmentService.getEquipmentPurchaseHistory(item.id);
                                                    setPurchaseHistoryData(hist);
                                                    setIsPurchaseHistoryModalOpen(true);
                                                } catch(e) {
                                                    toast.error("Failed to load purchase history");
                                                }
                                            }} 
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                        >
                                            View History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {equipmentList.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">No equipment found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery", activeTab]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ─── Main Header ─── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Machinery & Equipment
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Complete lifecycle tracking — allocation, usage, maintenance, cost
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase">Active Project:</span>
                        <select
                            value={selectedProjectId || ""}
                            onChange={handleProjectChange}
                            className="bg-transparent border-none text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                            <option value="" disabled>Select Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ─── Tab Bar ─── */}
                <div className="mb-8 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Main Content ─── */}
                <div className="w-full">
                    {isLoading && equipmentList.length === 0 ? (
                        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
                    ) : (
                        <>
                            {activeTab === "Dashboard" && renderDashboard()}
                            {activeTab === "Machinery & Equipment List" && renderEquipmentList()}
                            {activeTab === "Usage" && renderUsage()}
                            {activeTab === "Maintenance" && renderMaintenance()}
                            {activeTab === "Rental" && renderRental()}
                            {activeTab === "Purchase" && renderPurchase()}
                            {activeTab === "Reports & Alerts" && renderReports()}
                        </>
                    )}
                </div>
            </PageTransition>

            {/* ─── Modals ────────────────────────────────────────────────────────── */}

            {/* 1 & 2. Add/Edit Equipment */}
            <EquipmentFormModal
                isOpen={isEquipmentModalOpen}
                onClose={() => setIsEquipmentModalOpen(false)}
                onSave={handleSaveEquipmentModal}
                initialData={formData}
                selectedProjectId={selectedProjectId}
            />

            {/* 3. View Detail */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Equipment Details" maxWidth="max-w-xl">
                {selectedEquipment && (
                    <div className="p-6 font-inter">
                        <div className={`rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden ${conditionColors[selectedEquipment.condition]?.split(' ')[0] || 'bg-primary'}`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{selectedEquipment.equipment_name}</h3>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">{selectedEquipment.equipment_code}</span>
                                </div>
                                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
                                    Condition: {conditionDisplay[selectedEquipment.condition] || selectedEquipment.condition}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operator</p><p className="text-sm font-bold text-slate-800">{selectedEquipment.operator_name}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</p><p className="text-sm font-bold text-slate-800 font-mono">
                                {selectedEquipment.project_id ? (projects.find(p => Number(p.id) === Number(selectedEquipment.project_id))?.project_name || projects.find(p => Number(p.id) === Number(selectedEquipment.project_id))?.name || `PRJ-${selectedEquipment.project_id}`) : 'Not Allocated'}
                            </p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Working Hours</p><p className="text-sm font-bold text-slate-800">N/A</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fuel Used</p><p className="text-sm font-bold text-blue-600">N/A</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rental Cost</p><p className="text-sm font-bold text-purple-600">₹{selectedEquipment.rental_cost.toLocaleString()}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maintenance Date</p><p className="text-sm font-bold text-slate-800">{selectedEquipment.maintenance_date}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p><p className="text-sm font-bold text-slate-800">{selectedEquipment.created_at ? new Date(selectedEquipment.created_at).toLocaleString() : 'N/A'}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Updated At</p><p className="text-sm font-bold text-slate-800">{selectedEquipment.updated_at ? new Date(selectedEquipment.updated_at).toLocaleString() : 'N/A'}</p></div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Allocation Status</p>
                                <p className="text-sm font-bold text-blue-900">
                                    {allocationStatus.allocated 
                                        ? `Allocated to ${projects.find(p => Number(p.id) === Number(allocationStatus.project_id))?.project_name || projects.find(p => Number(p.id) === Number(allocationStatus.project_id))?.name || `Project ${allocationStatus.project_id}`}` 
                                        : 'Available in Yard'}
                                </p>
                            </div>
                            {allocationStatus.allocated ? <Link2 className="w-5 h-5 text-blue-500" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest">Close</button>
                            <button onClick={() => { setIsViewModalOpen(false); setFormData(selectedEquipment); setIsEquipmentModalOpen(true); }} className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Edit Details</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 4. Allocate Equipment */}
            <Modal isOpen={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Equipment" maxWidth="max-w-md">
                <div className="p-6 font-inter">
                    <form onSubmit={handleAllocate} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">EQUIPMENT NAME *</label>
                            <input type="text" readOnly value={selectedEquipment?.equipment_name || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-500 font-medium cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">TARGET PROJECT *</label>
                            <select
                                required
                                value={formData.project_id || ''}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                            >
                                <option value="">-- Select project to allocate --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ALLOCATION STATUS *</label>
                            <div className="flex items-center px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <input type="checkbox" checked={true} readOnly className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 cursor-not-allowed" />
                                <span className="ml-3 text-sm font-bold text-emerald-700">Set as Allocated</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            {allocationStatus.allocated && (
                                <button type="button" onClick={handleDeallocate} className="px-6 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">Deallocate</button>
                            )}
                            <button type="button" onClick={() => setIsAllocateModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">Allocate</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* 5. Log Usage */}
            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title={formData.usage_id ? "Edit Equipment Usage" : "Log Equipment Usage"} maxWidth="max-w-md">
                <form onSubmit={handleSaveUsage} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">BOQ Item (Optional)</label>
                        <select value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: Number(e.target.value) || undefined })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary">
                            <option value="">-- Choose BOQ item --</option>
                            {boqsList.map(boq => <option key={boq.id} value={boq.id}>{boq.item_name || `BOQ Item #${boq.id}`}</option>)}
                        </select>
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

            {/* 6. Schedule Maintenance */}
            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title="Schedule Maintenance" maxWidth="max-w-md">
                <form onSubmit={handleSaveMaintenance} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DESCRIPTION *</label>
                        <input type="text" required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MAINTENANCE DATE *</label>
                            <input type="date" required value={formData.maintenance_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">COST (₹) *</label>
                            <input type="number" min="0" required value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NEXT MAINTENANCE DATE</label>
                        <input type="date" value={formData.next_maintenance_date || ''} onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT (OPTIONAL)</label>
                        <select value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) || undefined })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Select Project --</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name || p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BOQ ITEM (OPTIONAL)</label>
                        <select value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: Number(e.target.value) || undefined })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose BOQ item --</option>
                            {boqsList.map(boq => <option key={boq.id} value={boq.id}>{boq.item_name || `BOQ Item #${boq.id}`}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20">Schedule</button>
                    </div>
                </form>
            </Modal>

            {/* 7. Add Rental */}
            <Modal isOpen={isRentalModalOpen} onClose={() => setIsRentalModalOpen(false)} title="Add Rental Record" maxWidth="max-w-md">
                <form onSubmit={handleSaveRental} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">START DATE *</label>
                            <input type="date" required value={formData.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">END DATE *</label>
                            <input type="date" required value={formData.end_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RENTAL COST (₹) *</label>
                        <input type="number" min="0" required value={formData.rental_cost || ''} onChange={(e) => setFormData({ ...formData, rental_cost: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CLIENT NAME *</label>
                        <input type="text" required value={formData.client_name || ''} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT (OPTIONAL)</label>
                        <select value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) || undefined })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Select Project --</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name || p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BOQ ITEM (OPTIONAL)</label>
                        <select value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: Number(e.target.value) || undefined })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose BOQ item --</option>
                            {boqsList.map(boq => <option key={boq.id} value={boq.id}>{boq.item_name || `BOQ Item #${boq.id}`}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NOTES</label>
                        <textarea rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsRentalModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20">Add Rental</button>
                    </div>
                </form>
            </Modal>

            {/* 8. Audit Logs Modal */}
            <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title="Audit Logs" maxWidth="max-w-2xl">
                {selectedEquipment && (
                    <div className="p-6 font-inter">
                        <div className={`rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden bg-slate-800`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{selectedEquipment.equipment_name}</h3>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">{selectedEquipment.equipment_code}</span>
                                </div>
                                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
                                    Operator: {selectedEquipment.operator_name}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-6">
                    {auditLogs.length > 0 ? auditLogs.map(log => {
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

                        // Helper: get project name from projects list by id
                        const getProjectName = (id: any) => {
                            if (!id) return 'Not Allocated';
                            const p = projects.find(p => Number(p.id) === Number(id));
                            return p ? (p.project_name || p.name) : `Project #${id}`;
                        };

                        // Render meaningful summary based on action type
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
                                // Show what changed: old vs new for changed keys
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
                            <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                <div className="shrink-0">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg ${colorClass}`}>{log.action.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {renderDetails()}
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <p className="text-sm font-medium">No audit logs found</p>
                        </div>
                    )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setIsLogsModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Equipment"
                message="Are you sure? This will permanently delete this equipment record."
                confirmText="Delete"
                type="danger"
            />

            <ConfirmModal
                isOpen={isMaintenanceDeleteModalOpen}
                onClose={() => setIsMaintenanceDeleteModalOpen(false)}
                onConfirm={handleDeleteMaintenanceConfirm}
                title="Remove Maintenance Entry"
                message="Are you sure you want to delete this maintenance record?"
                confirmText="Confirm Deletion"
                type="danger"
            />

            <ConfirmModal
                isOpen={isRentalDeleteModalOpen}
                onClose={() => setIsRentalDeleteModalOpen(false)}
                onConfirm={handleDeleteRentalConfirm}
                title="Remove Rental Entry"
                message="Are you sure you want to delete this rental record? This action cannot be undone."
                confirmText="Confirm Deletion"
                type="danger"
            />

            {/* Rental View Modal */}
            <Modal isOpen={isRentalViewModalOpen} onClose={() => setIsRentalViewModalOpen(false)} title="Rental Details" maxWidth="max-w-xl">
                {rentalToView && (
                    <div className="p-6 font-inter">
                        <div className={`rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden ${rentalToView.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                            <div className="relative z-10">
                                <div className="flex flex-col mb-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{rentalToView.client_name}</h3>
                                    <p className="text-sm opacity-90 mt-1">{equipmentList.find(e => e.id === rentalToView.equipment_id)?.equipment_name || `Equipment ID: ${rentalToView.equipment_id}`}</p>
                                </div>
                                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
                                    Status: {rentalToView.status || 'COMPLETED'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Date</p><p className="text-sm font-bold text-slate-800">{rentalToView.start_date}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Date</p><p className="text-sm font-bold text-slate-800">{rentalToView.end_date}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p><p className="text-sm font-bold text-slate-800">{rentalToView.duration} days</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</p><p className="text-sm font-bold text-slate-800 font-mono">{rentalToView.project_id ? (projects.find(p => p.id === rentalToView.project_id)?.project_name || `Project #${rentalToView.project_id}`) : 'N/A'}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rental Cost</p><p className="text-sm font-bold text-purple-600">₹{rentalToView.rental_cost?.toLocaleString()}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Per Day Cost</p><p className="text-sm font-bold text-blue-600">₹{rentalToView.per_day_cost?.toLocaleString()}</p></div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BOQ Item</p>
                                <p className="text-sm font-bold text-slate-800 font-mono">{rentalToView.boq_item_id ? (boqsList.find(b => b.id === rentalToView.boq_item_id)?.item_name || `BOQ Item #${rentalToView.boq_item_id}`) : 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">{rentalToView.notes || 'No notes provided.'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsRentalViewModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
                            <button onClick={() => { setIsRentalViewModalOpen(false); setFormData({ ...rentalToView, equipment_id: rentalToView.equipment_id || selectedEquipment?.id }); setIsRentalModalOpen(true); }} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 transition-colors text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20">Edit Details</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Equipment">
                <form onSubmit={handleTransfer} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transfer To Project</label>
                        <select required value={formData.project_id || ""} onChange={e => setFormData({ ...formData, project_id: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                            <option value="" disabled>Select target project...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-2">Equipment will be moved from its current allocation to the selected project.</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all py-2.5">Transfer Equipment</button>
                    </div>
                </form>
            </Modal>

            {/* Purchase History Modal */}
            <Modal isOpen={isPurchaseHistoryModalOpen} onClose={() => setIsPurchaseHistoryModalOpen(false)} title="Purchase History" maxWidth="max-w-3xl">
                <div className="p-6 font-inter bg-slate-50">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Purchase Details</h3>
                        {purchaseHistoryData ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment</p><p className="text-sm font-bold text-slate-800">{purchaseHistoryData.equipment_name || selectedEquipment?.equipment_name}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</p><p className="text-sm font-bold text-slate-800">{purchaseHistoryData.supplier_name || 'N/A'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchase Date</p><p className="text-sm font-bold text-slate-800">{purchaseHistoryData.purchase_date ? new Date(purchaseHistoryData.purchase_date).toLocaleDateString() : 'N/A'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Warranty Expiry</p><p className="text-sm font-bold text-slate-800">{purchaseHistoryData.warranty_expiry ? new Date(purchaseHistoryData.warranty_expiry).toLocaleDateString() : 'N/A'}</p></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost</p><p className="text-sm font-bold text-emerald-600">₹{purchaseHistoryData.total_cost?.toLocaleString() || '0'}</p></div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-sm">No purchase data available</div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsPurchaseHistoryModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default MachineryPage;
