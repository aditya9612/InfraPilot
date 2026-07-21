import api from './api';

export const journalService = {
  getManualJournals: async () => {
    const response = await api.get('/journal/manual');
    return response.data;
  },

  createManualJournal: async (data: any) => {
    const response = await api.post('/journal/manual', data);
    return response.data;
  },

  getManualJournalDetails: async (id: string | number) => {
    const response = await api.get(`/journal/manual/${id}`);
    return response.data;
  },

  createAdjustmentJournal: async (data: any) => {
    const response = await api.post('/journal/adjustment', data);
    return response.data;
  },

  getAdjustmentJournals: async (params?: any) => {
    const response = await api.get('/journal/adjustment', { params });
    return response.data;
  },

  getAdjustmentJournalDetails: async (id: string | number) => {
    const response = await api.get(`/journal/adjustment/${id}`);
    return response.data;
  },

  exportAdjustmentJournals: async () => {
    const response = await api.get('/journal/adjustment/export', { responseType: 'blob' });
    return response.data;
  },

  importAdjustmentJournals: async (fileData: any) => {
    // Assuming fileData is a form data or properly formatted payload for the import
    const response = await api.post('/journal/adjustment/import', fileData);
    return response.data;
  },

  getRecurringJournals: async () => {
    const response = await api.get('/journal/recurring');
    return response.data;
  },

  createRecurringJournal: async (data: any) => {
    const response = await api.post('/journal/recurring', data);
    return response.data;
  },

  exportJournals: async () => {
    const response = await api.get('/journal/export', { responseType: 'blob' });
    return response.data;
  },

  exportRecurringJournals: async () => {
    const response = await api.get('/journal/recurring/export', { responseType: 'blob' });
    return response.data;
  },

  runDueRecurringJournals: async () => {
    const response = await api.post('/journal/recurring/run-due');
    return response.data;
  },

  toggleRecurringJournal: async (id: string | number) => {
    const response = await api.post(`/journal/recurring/${id}/toggle`);
    return response.data;
  }
};



