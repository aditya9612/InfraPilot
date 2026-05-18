import api from './api';

export interface DSRItem {
  project_id: number;
  report_date: string;
  site_location: string;
  contractor_id: number;
  weather: string;
  work_done: string;
  work_planned: string;
  machinery_used: string;
  material_received: string;
  material_used: string;
  issues: string;
  safety_observations: string;
  remarks: string;
  id: number;
  business_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: number;
  created_by_name: string;
  status: string;
  latitude: number;
  longitude: number;
  contractor_name: string;
  total_labour: number;
  skilled_labour: number;
  unskilled_labour: number;
  photos: Array<{
    id: number;
    file_url: string;
  }>;
}

export interface DSRResponse {
  items: DSRItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

const DSR_MOCK_FALLBACK: DSRResponse = {
  items: [
    {
      project_id: 1,
      report_date: "2026-05-11",
      site_location: "Pune",
      contractor_id: 1,
      weather: "Sunny",
      work_done: "Completed electrical conduit laying in ground floor. Vibrators used during pour.",
      work_planned: "Start wiring work for first floor and prepare column shuttering.",
      machinery_used: "Concrete mixer, drilling machine",
      material_received: "PVC pipes - 200 units",
      material_used: "PVC pipes - 150 units, Cement: 80 bags, Steel: 1.2 Tons",
      issues: "Slight delay in material delivery in the morning. Resolved by 10 AM.",
      safety_observations: "All workers wearing helmets and gloves. No safety incidents.",
      remarks: "Work progressing as per schedule. Slab finish achieved as per specifications.",
      id: 1,
      business_id: "DSR001",
      created_at: "2026-05-11T18:13:39",
      updated_at: "2026-05-11T18:13:39",
      created_by_id: 1,
      created_by_name: "Admin User",
      status: "Active",
      latitude: 18.5204,
      longitude: 73.8567,
      contractor_name: "Sai Infra",
      total_labour: 28,
      skilled_labour: 12,
      unskilled_labour: 16,
      photos: [
        {
          id: 1,
          file_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
        }
      ]
    },
    {
      project_id: 1,
      report_date: "2026-05-10",
      site_location: "Pune",
      contractor_id: 1,
      weather: "Partly Cloudy",
      work_done: "Shuttering and formwork for Ground Floor slab. Brickwork on Level 1 Apartments A & B.",
      work_planned: "Electrical conduit laying in ground floor.",
      machinery_used: "Tower crane, concrete pump",
      material_received: "Steel reinforcement bars - 5 Tons",
      material_used: "Plywood: 15 sheets, Bricks: 2500, Cement: 12 bags",
      issues: "None",
      safety_observations: "Safety briefing conducted in morning. All PPE compliance confirmed.",
      remarks: "Wait for plumbing layout approval for Level 1 bathroom shafts.",
      id: 2,
      business_id: "DSR002",
      created_at: "2026-05-10T17:45:00",
      updated_at: "2026-05-10T17:45:00",
      created_by_id: 1,
      created_by_name: "Admin User",
      status: "Active",
      latitude: 18.5204,
      longitude: 73.8567,
      contractor_name: "Sai Infra",
      total_labour: 22,
      skilled_labour: 10,
      unskilled_labour: 12,
      photos: [
        {
          id: 2,
          file_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&h=300&fit=crop"
        },
        {
          id: 3,
          file_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
        }
      ]
    }
  ],
  meta: {
    total: 2,
    limit: 20,
    offset: 0
  }
};

export const dsrService = {
  /**
   * Get DSR reports for a specific project.
   * Falls back to rich mock data if the backend is unreachable (502 / ECONNREFUSED / timeout).
   * GET /api/v1/dsr/project/{project_id}
   */
  async getProjectDsr(projectId: number): Promise<DSRResponse> {
    try {
      const response = await api.get(`/dsr/project/${projectId}`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const isNetworkError = !error?.response; // ECONNREFUSED, timeout, proxy error, etc.
      const isServerError = status >= 500;

      if (isNetworkError || isServerError) {
        console.warn(
          `[DSR] Backend unreachable (${isNetworkError ? 'network error' : `HTTP ${status}`}) — serving mock data for project ${projectId}.`
        );
        // Clone mock and update project_id to match the request
        const fallback: DSRResponse = {
          ...DSR_MOCK_FALLBACK,
          items: DSR_MOCK_FALLBACK.items.map(item => ({ ...item, project_id: projectId }))
        };
        return fallback;
      }

      // Auth / client errors (401, 403, 404) — propagate so the UI can handle them
      console.error('[DSR] API error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new DSR report.
   * POST /api/v1/dsr
   */
  async createDsr(dsrData: any) {
    try {
      const response = await api.post('/dsr', dsrData);
      return response.data;
    } catch (error: any) {
      console.error('[DSR] Create error:', error.response?.data || error.message);
      throw error;
    }
  }
};
