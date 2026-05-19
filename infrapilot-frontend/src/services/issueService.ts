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

// Mock Issues data for dev/demo mode
// Mock Issues data based on latest API samples
const MOCK_ISSUES_DATA = [
  {
    project_id: 1,
    title: "Concrete quality issue",
    category: "Delay",
    description: "Concrete mix failed slump test at site. Required immediate replacement of the batch.",
    reported_date: "2026-04-10",
    priority: "High",
    id: 2,
    business_id: "ISS002",
    status: "Open",
    assigned_to: null,
    resolution: "Batch rejected. New mix ordered and slump test passed on retry."
  },
  {
    project_id: 1,
    title: "Sand delivery delay",
    category: "Material",
    description: "Sand supply was delayed by 4HR, affecting the morning masonry schedule.",
    reported_date: "2026-04-02",
    priority: "High",
    id: 1,
    business_id: "ISS001",
    status: "Open",
    assigned_to: null,
    resolution: "Supplier notified. Extended shift for masonry team to recover lost time."
  },
  {
    project_id: 1,
    title: "Safety Harness Compliance Audit",
    category: "Safety",
    description: "Quarterly audit identified equipment requiring immediate replacement.",
    reported_date: "2026-03-15",
    priority: "Medium",
    id: 3,
    business_id: "ISS003",
    status: "Closed",
    assigned_to: "Safety Officer",
    resolution: "Purchased 5 new certified harnesses; safety briefing conducted."
  }
];

const isOfflineError = (error: any): boolean => {
  if (!error?.response) return true;
  return error.response.status >= 500;
};

export const issueService = {
  /**
   * Get all issues with comprehensive filtering
   * GET /api/v1/issues
   */
  async getProjectIssues(projectId: number, filters: any = {}) {
    // Return mock data for mock/dev user
    if (isMockUser()) {
      console.log('Issues: Returning mock data for dev user.');
      // Simple local filtering for mock mode
      let items = [...MOCK_ISSUES_DATA];
      if (filters.status) items = items.filter(i => i.status === filters.status);
      if (filters.priority) items = items.filter(i => i.priority === filters.priority);
      if (filters.category) items = items.filter(i => i.category === filters.category);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
      }

      return {
        items: items,
        meta: {
          total: items.length,
          limit: filters.limit || 20,
          offset: filters.offset || 0
        }
      };
    }

    try {
      console.log(`🌐 Fetching Real Issues for Project ${projectId}... URL: ${api.defaults.baseURL}/issues/project/${projectId}`);
      const response = await api.get(`/issues/project/${projectId}`, {
        params: {
          ...filters
        }
      });
      const data = response.data;
      
      // Handle various API response shapes
      if (data && data.items) return data;
      if (Array.isArray(data)) {
        return {
          items: data,
          meta: { total: data.length, limit: 100, offset: 0 }
        };
      }
      return { items: [], meta: { total: 0, limit: 20, offset: 0 } };
    } catch (error: any) {
      if (isOfflineError(error)) {
        console.warn(`[Issues] Backend offline — serving mock data for project ${projectId}`);
        let items = [...MOCK_ISSUES_DATA];
        if (filters.status) items = items.filter(i => i.status === filters.status);
        if (filters.priority) items = items.filter(i => i.priority === filters.priority);
        if (filters.category) items = items.filter(i => i.category === filters.category);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          items = items.filter(i => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
        }
        return {
          items: items,
          meta: {
            total: items.length,
            limit: filters.limit || 20,
            offset: filters.offset || 0
          }
        };
      }
      console.error(`Get Issues for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get a single issue by ID
   * GET /api/v1/issues/{id}
   */
  async getIssueById(id: number) {
    // Return mock data for mock/dev user
    if (isMockUser()) {
      const issue = MOCK_ISSUES_DATA.find(i => i.id === id);
      if (!issue) throw new Error("Issue not found");
      return issue;
    }

    try {
      const response = await api.get(`/issues/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Issue ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new issue
   * POST /api/v1/issues
   */
  async createIssue(issueData: any) {
    if (isMockUser()) {
      console.log('Issues: Mock creating issue...', issueData);
      return { message: "Issue created successfully (MOCK)", ...issueData };
    }

    try {
      const response = await api.post('/issues', issueData);
      return response.data;
    } catch (error: any) {
      if (isOfflineError(error)) {
        console.warn(`[Issues] Backend offline — mock creating issue...`, issueData);
        return {
          id: Math.floor(Math.random() * 1000) + 10,
          business_id: `ISS${Math.floor(Math.random() * 900) + 100}`,
          status: "Open",
          assigned_to: null,
          resolution: null,
          ...issueData
        };
      }
      console.error("Create Issue Error:", error.response?.data || error.message);
      throw error;
    }
  }
};
