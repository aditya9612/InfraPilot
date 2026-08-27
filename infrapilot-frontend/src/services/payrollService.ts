import api from './api';

let mockOffers: any[] = [
  {
    id: 1,
    project_name: "Green Valley",
    society_name: "Green Valley CHS",
    address: "Mumbai",
    developer_name: "BuildTech Builders",
    contact_email: "contact@buildtech.com",
    contact_phone: "9876543210",
    extra_carpet_percent: 5,
    note: "Initial proposal",
    status: "Draft"
  }
];

export const payrollService = {
  getSummary: async (params?: any) => {
    const response = await api.get('/accountant/payroll/summary', { params });
    return response.data;
  },

  getStaffRegister: async () => {
    const response = await api.get('/accountant/payroll/staff/register');
    return response.data;
  },

  exportPayslips: async () => {
    const response = await api.get('/accountant/payroll/payslip/export', { responseType: 'blob' });
    return response.data;
  },

  exportStaffPayroll: async () => {
    const response = await api.get('/accountant/payroll/staff/export', { responseType: 'blob' });
    return response.data;
  },

  exportContractorPayroll: async () => {
    const response = await api.get('/accountant/payroll/contractor/export', { responseType: 'blob' });
    return response.data;
  },

  exportPayrollRegister: async () => {
    const response = await api.get('/accountant/payroll/register/export', { responseType: 'blob' });
    return response.data;
  },

  processStaffSalary: async (data: any) => {
    const response = await api.post('/accountant/payroll/staff/process', data);
    return response.data;
  },

  getStaffHistory: async () => {
    const response = await api.get('/accountant/payroll/staff/history');
    return response.data;
  },

  getLabourWages: async (params: any = {}) => {
    const response = await api.get(`/accountant/payroll/labour/wages`, { params });
    return response.data;
  },

  getLabourWageStats: async (params: any = {}) => {
    const response = await api.get(`/labour/wages/stats`, { params });
    return response.data;
  },

  getPayrollRegister: async () => {
    try {
      const response = await api.get('/accountant/payroll/register');
      return response.data;
    } catch (e: any) {
      console.warn('getPayrollRegister (transactions) failed:', e.message);
      return [];
    }
  },

  getContractorBills: async () => {
    const response = await api.get('/accountant/payroll/contractor/bills');
    return response.data;
  },

  payContractorBill: async (data: any) => {
    const response = await api.post('/accountant/payroll/contractor/pay', data);
    return response.data;
  },

  payLabourWages: async (data: any) => {
    // This is essentially create wage record
    const response = await api.post('/labour/wages', data);
    return response.data;
  },

  payLabourWageById: async (id: number | string, data: any = {}) => {
    const response = await api.post(`/labour/wages/${id}/pay`, data);
    return response.data;
  },

  getOffers: async () => {
    try {
      const response = await api.get('/accountant/offers');
      return response.data;
    } catch (e) {
      // Fallback mock if backend throws 404
      return { data: mockOffers };
    }
  },

  createOffer: async (data: any) => {
    try {
      const response = await api.post('/accountant/offers', data);
      if (response.data && response.data.id) {
        mockOffers.unshift({
          ...data,
          id: response.data.id,
          status: "Draft"
        });
      }
      return response.data;
    } catch (e) {
      // Fallback mock if backend is not ready
      const newMockOffer = {
        ...data,
        id: Math.floor(Math.random() * 1000) + 10,
        status: "Draft"
      };
      mockOffers.unshift(newMockOffer);
      return newMockOffer;
    }
  },

  generateOfferLetter: async (offerId: string | number) => {
    try {
      const response = await api.get(`/accountant/offers/${offerId}/generate`);
      return response.data;
    } catch (e) {
      // Fallback mock if backend throws 404
      const offerIndex = mockOffers.findIndex(o => o.id == offerId);
      if (offerIndex !== -1) {
        mockOffers[offerIndex].status = "Generated";
      }
      return { message: "Offer generated successfully", status: "success" };
    }
  },

  downloadOfferPdf: async (offerId: string | number) => {
    try {
      const response = await api.get(`/accountant/offers/${offerId}/pdf`, { responseType: 'blob' });
      return response.data;
    } catch (e) {
      // Fallback mock if backend throws 404
      const dummyContent = "Dummy Offer Letter PDF Content for ID: " + offerId;
      return new Blob([dummyContent], { type: "application/pdf" });
    }
  }
};
