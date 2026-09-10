import api from './api';

export interface RBACRole {
    id?: number;
    name: string;
    is_custom?: boolean;
}

export interface RBACModule {
    id: string;
    name: string;
    group?: string;
    permissions?: string[];
}

export interface RBACPermission {
    module_id: string;
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    approve?: boolean;
    export?: boolean;
    [key: string]: boolean | string | undefined;
}

export interface UserOverride {
    permission: string;
    is_granted: boolean;
}

export const rbacService = {
    // Roles
    getRoles: async () => {
        const response = await api.get('/rbac/roles');
        return response.data;
    },

    createRole: async (roleData: { name: string; display_name: string }) => {
        const response = await api.post('/rbac/roles', roleData);
        return response.data;
    },

    deleteRole: async (role: string) => {
        const response = await api.delete(`/rbac/roles/${role}`);
        return response.data;
    },

    resetRoleDefaults: async (role: string) => {
        const response = await api.post(`/rbac/roles/${role}/reset-defaults`);
        return response.data;
    },

    // Permissions & Modules
    getModulesAndPermissions: async (search?: string) => {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await api.get(`/rbac/permissions${query}`);
        return response.data;
    },

    getRolePermissions: async (role: string) => {
        const response = await api.get(`/rbac/roles/${role}/permissions`);
        return response.data;
    },

    updateRolePermissions: async (role: string, permissions: any[]) => {
        const response = await api.put(`/rbac/roles/${role}/permissions`, permissions);
        return response.data;
    },

    // User Overrides
    getUserOverrides: async (userId: string | number) => {
        const response = await api.get(`/rbac/users/${userId}/overrides`);
        return response.data;
    },

    updateUserOverrides: async (userId: string | number, overrides: any[]) => {
        const response = await api.put(`/rbac/users/${userId}/overrides`, { overrides });
        return response.data;
    },

    // Maintenance
    seedRbacData: async () => {
        const response = await api.post('/rbac/seed');
        return response.data;
    },

    assignDefaults: async () => {
        const response = await api.post('/rbac/assign-defaults');
        return response.data;
    },
};
