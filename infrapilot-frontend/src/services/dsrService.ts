import api from './api';

// Helper to check if the current user is the mock/dev client
const isMockUser = () => {
  try {
    const stored = localStorage.getItem("infrapilot_user");
    if (!stored) return false;
    const user = JSON.parse(stored);
    const token = user.token?.access_token || user.token;
    return token === 'mock_test_token_client_transparency';
  } catch {
    return false;
  }
};

// Mock DSR data for dev/demo mode
const MOCK_DSR_DATA = [
  {
    id: "DSR001",
    date: "17 Apr 2026",
    workDone: "Completed electrical conduit laying in ground floor",
    workPlanned: "Start wiring work for first floor",
    labourCount: 18,
    materialUsed: "PVC pipes - 150 units",
    remarks: "Work progressing as per schedule",
    photos: []
  },
  {
    id: "DSR002",
    date: "16 Apr 2026",
    workDone: "Casting of Floor 4 slab completed with M25 concrete. Vibrators were used continuously during the pour.",
    workPlanned: "Removal of formwork from Floor 3 and preparation of Level 4 columns.",
    labourCount: 28,
    materialUsed: "Cement: 120 bags, Steel: 2.1 Tons, Concrete: 45 Cum",
    remarks: "Slab finish achieved as per specifications. No safety incidents reported.",
    photos: []
  },
  {
    id: "DSR003",
    date: "15 Apr 2026",
    workDone: "Placement of slab reinforcement for Floor 4. Inspection of electrical conduits by consultant.",
    workPlanned: "Casting of Floor 4 slab.",
    labourCount: 24,
    materialUsed: "Steel: 4.5 Tons, PVC Conduits: 180m, Binding Wire: 40kg",
    remarks: "Reinforcement checked and approved by PM. Concrete pump mobilization confirmed.",
    photos: []
  }
];

export const dsrService = {
  /**
   * Get DSR reports for a specific project
   * GET /api/v1/dsr/project/{project_id}
   */
  async getProjectDsr(projectId: number) {
    // Return mock data for mock/dev user to avoid 401
    if (isMockUser()) {
      console.log('DSR: Returning mock data for dev user.');
      return MOCK_DSR_DATA;
    }

    try {
      const response = await api.get(`/dsr/project/${projectId}`);
      const data = response.data;
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      return items;
    } catch (error: any) {
      console.error(`Get DSR for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new DSR report
   * POST /api/v1/dsr
   */
  async createDsr(dsrData: any) {
    // Always call the real API for create — the 401 guard prevents forced logout
    try {
      const response = await api.post('/dsr', dsrData);
      return response.data;
    } catch (error: any) {
      console.error("Create DSR Error:", error.response?.data || error.message);
      throw error;
    }
  }
};
