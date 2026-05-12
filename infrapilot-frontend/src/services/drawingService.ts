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

export interface Drawing {
  id: number;
  version: string;
  approved_by: string;
  remarks: string;
  updated_at: string;
  project_id: number;
  drawing_name: string;
  file_url: string;
  date: string;
  created_at: string;
}

export const drawingService = {
  /**
   * Get latest drawings for a project
   * GET /api/v1/drawings/{project_id}/latest
   */
  async getLatestDrawings(projectId: number): Promise<Drawing[]> {
    if (isMockUser()) {
      return [
        {
          id: 1,
          version: "v1.0",
          approved_by: "Site Engineer",
          remarks: "Initial approved drawing for foundation work",
          updated_at: "2026-04-26T16:06:30",
          project_id: projectId,
          drawing_name: "Foundation Layout",
          file_url: "uploads/drawings/foundation.pdf",
          date: "2026-04-26",
          created_at: "2026-04-26T16:06:30"
        },
        {
          id: 2,
          version: "v1.4",
          approved_by: "Project Manager",
          remarks: "Updated floor 4 structural layout",
          updated_at: "2026-03-28T10:00:00",
          project_id: projectId,
          drawing_name: "Architectural Drawing - Floor 4 Layout",
          file_url: "uploads/drawings/floor4.pdf",
          date: "2026-03-28",
          created_at: "2026-03-28T10:00:00"
        }
      ];
    }

    try {
      const response = await api.get(`/drawings/${projectId}/latest`);
      const data = response.data;
      // Handle both single object or array based on API flexibility
      return Array.isArray(data) ? data : [data];
    } catch (error: any) {
      console.error(`Get Latest Drawings for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Download a drawing file
   * GET /api/v1/drawings/download/{id} (Hypothetical, or use file_url)
   */
  async downloadDrawing(drawing: Drawing): Promise<void> {
    try {
      // If it's a full URL or relative path, we handle it
      const url = drawing.file_url.startsWith('http') 
        ? drawing.file_url 
        : `${import.meta.env.VITE_API_BASE_URL || ''}/${drawing.file_url}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${drawing.drawing_name}_${drawing.version}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download Drawing Error:", error);
      throw error;
    }
  }
};
