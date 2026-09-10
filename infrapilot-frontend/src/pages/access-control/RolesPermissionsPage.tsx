import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { rbacService } from '../../services/rbacService';
import type { RBACRole, RBACModule, RBACPermission, UserOverride } from '../../services/rbacService';
import { userService } from '../../services/userService';
import Navbar from '../../components/common/Navbar';

const RolesPermissionsPage = () => {
    const [roles, setRoles] = useState<RBACRole[]>([]);
    const [modules, setModules] = useState<RBACModule[]>([]);
    const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
    const [rolePermissions, setRolePermissions] = useState<RBACPermission[]>([]);

    const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>('matrix');
    const [selectedUser, setSelectedUser] = useState<string>(''); // Assuming user email or ID is typed here for now
    const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
    const [searchRole, setSearchRole] = useState('');
    const [searchModule, setSearchModule] = useState('');

    // Form state for creating roles
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDisplayName, setNewRoleDisplayName] = useState('');

    // Delete Confirmation State
    const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<any>(null);

    // Accordion State Configuration
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "Project Execution": true,
        "BOQ & Materials": true
    });

    const MODULE_GROUPS = [
        { name: "Project Execution", bg: "bg-blue-500", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", keywords: ["project", "task", "dsr", "daily", "photo", "issue", "snag", "execution"] },
        { name: "BOQ & Materials", bg: "bg-emerald-500", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", keywords: ["boq", "material", "inventory", "supplier"] },
        { name: "Labour & Attendance", bg: "bg-amber-500", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", keywords: ["labour", "attendance", "worker"] },
        { name: "Finance & Billing", bg: "bg-orange-500", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z", keywords: ["finance", "billing", "invoice", "payment", "account"] },
        { name: "Safety & Quality Control", bg: "bg-red-500", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", keywords: ["safety", "quality", "inspection"] },
        { name: "Equipment Management", bg: "bg-yellow-500", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", keywords: ["equipment", "machine", "vehicle"] },
        { name: "Reports & Analytics", bg: "bg-cyan-500", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", keywords: ["report", "analytic", "dashboard", "metric"] },
        { name: "Other Modules", bg: "bg-slate-400", icon: "M4 6h16M4 10h16M4 14h16M4 18h16", keywords: [] }
    ];

    const getRoleName = (r: any) => {
        if (typeof r === 'string') return r;
        if (!r) return 'Unknown';
        const nameFallback = r.name || r.role_name || r.roleName || r.display_name || r.displayName || r.title || r.label || r.id;
        if (nameFallback) return nameFallback;
        return JSON.stringify(r); // Show exact response
    };



    const extractArray = (res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.roles)) return res.roles;
        if (res && Array.isArray(res.permissions)) return res.permissions;
        if (res && Array.isArray(res.modules)) return res.modules;
        if (res && Array.isArray(res.overrides)) return res.overrides;
        return [];
    };

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [rolesRes, permsRes] = await Promise.all([
                    rbacService.getRoles(),
                    rbacService.getModulesAndPermissions(),
                ]);

                const rolesArray = extractArray(rolesRes);
                if (rolesArray.length > 0) {
                    setRoles(rolesArray);
                    setSelectedRole(rolesArray[0]);
                }

                const permsArray = extractArray(permsRes);
                if (permsArray.length > 0) {
                    setModules(permsArray);
                }
            } catch (error) {
                console.error("Failed to load initial RBAC data:", error);
                toast.error("Failed to load roles and modules.");
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Role Permissions
    useEffect(() => {
        if (!selectedRole || activeTab !== 'matrix') return;
        const fetchRolePerms = async () => {
            try {
                const roleName = getRoleName(selectedRole);
                const res = await rbacService.getRolePermissions(roleName);
                setRolePermissions(extractArray(res));
            } catch (err) {
                console.error(`Failed to fetch permissions for ${getRoleName(selectedRole)}:`, err);
                toast.error("Failed to load permissions for the selected role.");
                setRolePermissions([]);
            }
        };
        fetchRolePerms();
    }, [selectedRole, activeTab]);

    // Fetch User Overrides Explicitly
    const handleFetchOverrides = async () => {
        if (!selectedUser) return;
        const toastId = toast.loading(`Fetching overrides for ${selectedUser}...`);
        try {
            const res = await rbacService.getUserOverrides(selectedUser);
            setUserOverrides(extractArray(res));
            setActiveTab('overrides');
            toast.success('Overrides retrieved', { id: toastId });
        } catch (error) {
            console.error(`Failed to fetch overrides for user ${selectedUser}:`, error);
            toast.error("Failed to fetch user overrides.", { id: toastId });
            setUserOverrides([]);
        }
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        const toastId = toast.loading('Saving permissions...');
        try {
            await rbacService.updateRolePermissions(selectedRole.name, rolePermissions);
            toast.success('Permissions updated successfully', { id: toastId });
        } catch {
            toast.error('Failed to update permissions', { id: toastId });
        }
    };

    const handleReset = async () => {
        if (!selectedRole) return;
        if (!window.confirm('Reset this role to default permissions?')) return;
        const toastId = toast.loading('Resetting permissions...');
        try {
            await rbacService.resetRoleDefaults(selectedRole.name);
            // Refresh data
            const res = await rbacService.getRolePermissions(selectedRole.name);
            setRolePermissions(res || []);
            toast.success('Permissions reset to defaults', { id: toastId });
        } catch {
            toast.error('Failed to reset permissions', { id: toastId });
        }
    };

    const handleSaveUserOverrides = async () => {
        if (!selectedUser) return;
        const toastId = toast.loading('Saving user overrides...');
        try {
            await rbacService.updateUserOverrides(selectedUser, userOverrides);
            toast.success('User overrides updated successfully', { id: toastId });
        } catch {
            toast.error('Failed to update user overrides', { id: toastId });
        }
    };

    const getPermId = (p: any) => {
        if (typeof p === 'string') return p;
        if (!p) return 'Unknown';
        return p.module_id || p.module || p.resource || p.name || p.feature || p.module_name || JSON.stringify(p).substring(0, 15);
    };

    const groupedPermissions = useMemo(() => {
        const map = new Map();
        rolePermissions
            .filter((p: any) => searchModule.trim() === '' || getPermId(p).toLowerCase().trim().startsWith(searchModule.toLowerCase().trim()))
            .forEach(p => {
                const ident = getPermId(p);
                const identLower = ident.toLowerCase();
                let targetGroup = MODULE_GROUPS[MODULE_GROUPS.length - 1]; // Other Modules
                for (const group of MODULE_GROUPS) {
                    if (group.keywords.some(kw => identLower.includes(kw))) {
                        targetGroup = group;
                        break;
                    }
                }
                if (!map.has(targetGroup.name)) map.set(targetGroup.name, { group: targetGroup, items: [] });
                map.get(targetGroup.name).items.push({ p, ident });
            });

        return Array.from(map.values()).sort((a, b) => {
            const indexA = MODULE_GROUPS.findIndex(g => g.name === a.group.name);
            const indexB = MODULE_GROUPS.findIndex(g => g.name === b.group.name);
            return indexA - indexB;
        });
    }, [rolePermissions, searchModule]);

    const togglePermission = (moduleId: string, action: keyof Omit<RBACPermission, 'module_id'>, checked: boolean) => {
        setRolePermissions(prev => {
            const existing = prev.find(p => getPermId(p) === moduleId);
            if (existing) {
                return prev.map(p => {
                    if (getPermId(p) === moduleId) {
                        return typeof p === 'string' ? { module_id: p, [action]: checked } : { ...p, [action]: checked };
                    }
                    return p;
                });
            }
            return [...prev, { module_id: moduleId, [action]: checked }];
        });
    };

    const toggleMasterGroup = (items: any[], checked: boolean) => {
        setRolePermissions(prev => {
            let next = [...prev];
            items.forEach(({ ident }) => {
                let existingIndex = next.findIndex(p => getPermId(p) === ident);
                if (existingIndex > -1) {
                    const p = next[existingIndex];
                    next[existingIndex] = typeof p === 'string'
                        ? { module_id: p, view: checked, create: checked, edit: checked, delete: checked, approve: checked, export: checked } as any
                        : { ...p, view: checked, create: checked, edit: checked, delete: checked, approve: checked, export: checked };
                } else {
                    next.push({ module_id: ident, view: checked, create: checked, edit: checked, delete: checked, approve: checked, export: checked } as any);
                }
            });
            return next;
        });
    };

    const toggleUserOverride = (permission: string, is_granted: boolean) => {
        setUserOverrides(prev => {
            const existing = prev.find(o => o.permission === permission);
            if (existing) {
                return prev.map(o => o.permission === permission ? { ...o, is_granted } : o);
            }
            return [...prev, { permission, is_granted }];
        });
    };

    const handleAddCustomRole = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const name = newRoleName.trim();
        const display_name = newRoleDisplayName.trim();
        if (!name || !display_name) return;
        const toastId = toast.loading('Creating role...');
        try {
            await rbacService.createRole({ name, display_name });
            const rolesRes = await rbacService.getRoles();
            const arr = extractArray(rolesRes);
            setRoles(arr);
            setShowAddRoleModal(false);
            setNewRoleName('');
            setNewRoleDisplayName('');
            toast.success('Role created successfully', { id: toastId });
        } catch (error) {
            toast.error('Failed to create custom role', { id: toastId });
        }
    };

    const confirmDeleteRole = async (role: any) => {
        const roleIdentifier = role.id || getRoleName(role);
        const roleName = getRoleName(role);
        const toastId = toast.loading('Deleting role...');
        try {
            await rbacService.deleteRole(String(roleIdentifier));
            const rolesRes = await rbacService.getRoles();
            const arr = extractArray(rolesRes);
            setRoles(arr);
            if (getRoleName(selectedRole) === roleName) setSelectedRole(arr?.[0] || null);
            setDeleteRoleConfirm(null);
            toast.success('Role deleted successfully', { id: toastId });
        } catch (error) {
            toast.error('Failed to delete role', { id: toastId });
            setDeleteRoleConfirm(null);
        }
    };

    return (
        <>
            <Navbar title="Roles & Permissions" breadcrumb={["InfraPilot", "Access Control", "Roles"]} />
            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Roles & Permissions</h1>
                        <p className="text-slate-500 text-sm">Manage role-based access control for your organization</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Reset to Defaults
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-auto xl:h-[calc(100vh-220px)] min-h-[600px]">

                    {/* Roles Sidebar */}
                    <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[450px] xl:h-full">
                        <div className="p-4 border-b border-slate-50">
                            <h2 className="font-bold text-slate-800">Roles <span className="text-slate-400 font-normal text-xs">(Tenant Roles)</span></h2>
                            <div className="mt-3 relative">
                                <input
                                    type="text"
                                    placeholder="Search roles..."
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-sm"
                                    value={searchRole}
                                    onChange={e => setSearchRole(e.target.value)}
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {roles.length === 0 && (
                                <div className="text-center text-sm text-slate-400 py-4">No roles found.</div>
                            )}
                            {roles.filter(r => getRoleName(r).toLowerCase().includes(searchRole.toLowerCase())).map((role, idx) => (
                                <div
                                    key={role.id || idx}
                                    onClick={() => setSelectedRole(role)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${getRoleName(selectedRole) === getRoleName(role) ? 'bg-primary text-white font-semibold shadow-sm' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-5 h-5 flex items-center justify-center rounded ${getRoleName(selectedRole) === getRoleName(role) ? 'bg-white/20' : 'text-slate-400'}`}>
                                            {getRoleName(role).includes('Admin') ? '👑' : '👤'}
                                        </span>
                                        <span className="text-sm">{getRoleName(role)}</span>
                                    </div>
                                    {getRoleName(role).toLowerCase() !== 'admin' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteRoleConfirm(role); }}
                                            className={`p-1.5 rounded-lg hover:bg-red-100 hover:text-red-500 transition ${getRoleName(selectedRole) === getRoleName(role) ? 'text-white/70 hover:bg-white/20' : 'text-slate-400'}`}
                                            title="Delete Role"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                            <button onClick={() => setShowAddRoleModal(true)} className="w-full py-2.5 bg-white border border-primary/20 text-primary rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/5 transition flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Custom Role
                            </button>
                        </div>
                    </div>

                    {/* Roles Permissions Matrix wrapper */}
                    <div className="xl:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px] xl:h-full">
                        <div className="flex border-b border-slate-50">
                            <button
                                onClick={() => setActiveTab('matrix')}
                                className={`px-6 py-4 text-sm font-bold transition ${activeTab === 'matrix' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Role Permissions Matrix
                            </button>
                            <button
                                onClick={() => setActiveTab('overrides')}
                                className={`px-6 py-4 text-sm font-bold transition ${activeTab === 'overrides' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                User-Specific Overrides
                            </button>
                        </div>

                        {activeTab === 'matrix' && (
                            <div className="flex-1 overflow-auto flex flex-col">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <div className="relative w-64">
                                        <input
                                            type="text"
                                            placeholder="Search modules..."
                                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                            value={searchModule}
                                            onChange={e => setSearchModule(e.target.value)}
                                        />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    {/* <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-500">Batch Toggle All</span>
                                        <div className="w-10 h-5 bg-slate-200 rounded-full cursor-pointer relative transition-colors"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div></div>
                                    </div> */}
                                </div>

                                <div className="flex-1 p-4 overflow-auto">
                                    {modules.length === 0 ? (
                                        <div className="text-center text-sm text-slate-400 py-10">No modules loaded.</div>
                                    ) : (
                                        <table className="w-full text-left border-collapse min-w-[750px]">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="pb-3">Module / Feature</th>
                                                    <th className="pb-3 text-center">* (All)</th>
                                                    <th className="pb-3 text-center">View</th>
                                                    <th className="pb-3 text-center">Create</th>
                                                    <th className="pb-3 text-center">Edit</th>
                                                    <th className="pb-3 text-center">Delete</th>
                                                    <th className="pb-3 text-center">Approve</th>
                                                    <th className="pb-3 text-center">Export</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedPermissions.map((groupData: any, groupIndex: number) => {
                                                    const { group, items } = groupData;
                                                    const isExpanded = !!expandedGroups[group.name];
                                                    // check if ALL items in this group have ALL permissions true
                                                    const isAllGroupChecked = items.length > 0 && items.every((i: any) =>
                                                        ['view', 'create', 'edit', 'delete', 'approve', 'export'].every(action => !!i.p[action])
                                                    );

                                                    return (
                                                        <React.Fragment key={`group-${group.name}`}>
                                                            {/* Group Header Row */}
                                                            <tr className="border-b border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition" onClick={() => setExpandedGroups(prev => ({ ...prev, [group.name]: !isExpanded }))}>
                                                                <td className="py-2.5 px-4 flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg ${group.bg} text-white flex items-center justify-center shadow-sm`}>
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={group.icon}></path></svg>
                                                                    </div>
                                                                    <span className="font-bold text-slate-800">{group.name} <span className="font-normal text-slate-400 text-xs ml-1">({items.length} Modules)</span></span>
                                                                </td>
                                                                <td className="py-2.5 text-center px-4" onClick={(e) => e.stopPropagation()}>
                                                                    <div onClick={() => toggleMasterGroup(items, !isAllGroupChecked)} className={`w-10 h-[22px] rounded-full mx-auto cursor-pointer relative transition-colors shadow-inner ${isAllGroupChecked ? 'bg-primary' : 'bg-slate-200'}`}>
                                                                        <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${isAllGroupChecked ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                                                    </div>
                                                                </td>
                                                                <td colSpan={6} className="text-right px-4">
                                                                    <div className="p-1 text-slate-400 rounded transition inline-block">
                                                                        {isExpanded ? (
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                                                        ) : (
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            {/* Group Child Rows */}
                                                            {isExpanded && items.map((item: any, index: number) => {
                                                                const { p, ident } = item;
                                                                const isRowAllChecked = ['view', 'create', 'edit', 'delete', 'approve', 'export'].every(action => !!p[action]);

                                                                return (
                                                                    <tr key={`module-${ident}-${index}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition bg-white group">
                                                                        <td className="py-3 text-sm text-slate-700 pl-[4.5rem]">
                                                                            {typeof ident === 'string' && ident.includes('{') ? 'Unknown Payload' : ident}
                                                                        </td>
                                                                        <td className="py-3 text-center">
                                                                            <div onClick={() => {
                                                                                (['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).forEach(action => togglePermission(ident, action, !isRowAllChecked));
                                                                            }} className={`w-8 h-4 rounded-full mx-auto cursor-pointer relative transition-colors ${isRowAllChecked ? 'bg-green-500/30' : 'bg-slate-200'} group-hover:shadow-sm`}>
                                                                                <div className={`w-3 h-3 rounded-full absolute top-0.5 transition-all ${isRowAllChecked ? 'right-0.5 bg-green-500' : 'left-0.5 bg-white shadow-sm'}`}></div>
                                                                            </div>
                                                                        </td>
                                                                        {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(action => (
                                                                            <td key={action} className="py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!p?.[action]}
                                                                                    onChange={(e) => togglePermission(ident, action as any, e.target.checked)}
                                                                                    className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary cursor-pointer transition"
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'overrides' && (
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400 select-none">
                                <span className="text-4xl mb-4">👤</span>
                                <p className="font-semibold text-slate-600 mb-1">User Overrides mode active</p>
                                <p className="text-xs text-center max-w-sm">Use the right side panel to search by user ID and manage precise overrides.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Hand Side Tooling */}
                    <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[500px] xl:h-full">


                        {/* Overrides Panel */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
                                <h3 className="font-bold text-slate-800">User-Specific Overrides</h3>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-4 flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Specify User ID</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 104"
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleFetchOverrides(); }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <button onClick={handleFetchOverrides} className="px-3 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary/90 transition">Fetch</button>
                                </div>

                                {selectedUser ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="relative mb-3">
                                            <input type="text" placeholder="Add override mapping..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            toggleUserOverride(val, true);
                                                            e.currentTarget.value = "";
                                                        }
                                                    }
                                                }}
                                            />
                                            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[150px]">
                                            {userOverrides.length === 0 && (
                                                <div className="text-center text-xs text-slate-400 py-4">No overrides loaded. Enter in bar above to add.</div>
                                            )}
                                            {userOverrides.map(p => (
                                                <div key={p.permission} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-700">{p.permission}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleUserOverride(p.permission, !p.is_granted)}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition hover:opacity-80 ${p.is_granted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {p.is_granted ? 'Granted' : 'Denied'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button onClick={handleSaveUserOverrides} className="w-full mt-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                            Update User Overrides
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                        <svg className="w-6 h-6 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                        <p className="text-xs font-semibold text-slate-500">Specify a user identifier to fetch or create overrides.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin / Maintenance */}
                        <div className="p-4 border-t border-slate-50 bg-slate-50/50 mt-auto">
                            <h4 className="font-bold text-xs text-slate-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                Admin / Maintenance
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        const id = toast.loading('Seeding permissions...');
                                        try {
                                            await rbacService.seedRbacData();
                                            toast.success('RBAC definitions seeded', { id });
                                        } catch {
                                            toast.error('Failed to seed RBAC definitions', { id });
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                                    Seed RBAC
                                </button>
                                <button
                                    onClick={async () => {
                                        const id = toast.loading('Assigning defaults...');
                                        try {
                                            await rbacService.assignDefaults();
                                            toast.success('System defaults enforced', { id });
                                        } catch {
                                            toast.error('Failed to assign defaults', { id });
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    Assign Defaults
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {showAddRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800">Add Custom Role</h3>
                            <button onClick={() => setShowAddRoleModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomRole} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Role Identifier (System Name) <span className="text-red-500">*</span></label>
                                <input type="text" required placeholder="e.g. site_supervisor" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                                <p className="text-[10px] text-slate-500 mt-1">Unique backend identifier (lowercase, no spaces).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Display Name <span className="text-red-500">*</span></label>
                                <input type="text" required placeholder="e.g. Site Supervisor" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" value={newRoleDisplayName} onChange={e => setNewRoleDisplayName(e.target.value)} />
                                <p className="text-[10px] text-slate-500 mt-1">User-friendly title displayed throughout the UI.</p>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowAddRoleModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm">Create Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteRoleConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </div>
                            <h3 className="font-bold text-xl text-slate-800 mb-2">Delete Role</h3>
                            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete the <strong className="text-slate-700">{getRoleName(deleteRoleConfirm)}</strong> role? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteRoleConfirm(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                                <button onClick={() => confirmDeleteRole(deleteRoleConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition shadow-sm">Delete Role</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RolesPermissionsPage;
