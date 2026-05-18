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
  async getLatestDrawings(projectId: number): Promise<Drawing[]> {
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

  downloadDocumentById: async (id: number): Promise<void> => {
    try {
      const response = await api.get(`/drawings/documents/download/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading document ${id}:`, error);
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
