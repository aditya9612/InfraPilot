import api from "./api";
import { projectService } from "./projectService";

export interface Contractor {
    id: number;
    name: string;
    email: string;
    mobile: string;
    code?: string;
    specialization?: string;
}

export const contractorService = {
    /**
     * Fetch all contractors from the dedicated API
     * GET /api/v1/contractors
     */
    async getContractors(): Promise<Contractor[]> {
        try {
            const res = await api.get('/contractors');
            const data = res.data;
            const contractorList = Array.isArray(data) ? data : (data.items || data.data || []);

            return contractorList.map((c: any) => ({
                // Use the numeric 'id' as the primary identifier for conversion APIs
                // 'contractor_id' in the response seems to be the string code (e.g. "CNT005")
                id: Number(c.id || c.user_id),
                name: c.name || c.full_name,
                email: c.email,
                mobile: c.contact_number || c.mobile_number || c.mobile,
                code: c.contractor_id || c.contractor_code || `CONT-${String(c.id || c.user_id).padStart(3, '0')}`,
                specialization: c.work_type || c.specialization || "General Contractor"
            }));
        } catch (error) {
            console.error("Failed to fetch contractors:", error);
            throw error;
        }
    },

    /**
     * Fetch project members and filter by 'Contractor' role
     */
    async getContractorsByProject(projectId: number): Promise<Contractor[]> {
        try {
            const members = await projectService.getProjectMembers(projectId);
            const memberList = Array.isArray(members) ? members : (members.items || members.data || []);

            const projectContractors = memberList
                .filter((member: any) => (member.role as string) === "Contractor" || (member.user && (member.user.role as string) === "Contractor"))
                .map((member: any) => {
                    const user = member.user || member;
                    return {
                        id: Number(user.id || user.user_id),
                        name: user.full_name || user.name,
                        email: user.email,
                        mobile: user.mobile_number || user.mobile,
                        code: user.contractor_id || user.contractor_code || `CONT-${String(user.id || user.user_id).padStart(3, '0')}`,
                        specialization: user.designation || user.specialization || user.work_type || "Project Contractor"
                    };
                });

            return projectContractors;
        } catch (error) {
            console.error(`Failed to fetch contractors for project ${projectId}:`, error);
            return [];
        }
    }
};
