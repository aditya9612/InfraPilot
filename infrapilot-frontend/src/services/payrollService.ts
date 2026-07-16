import api from './api';

export const payrollService = {
  getSummary: async () => {
    const response = await api.get('/accountant/payroll/summary');
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

  getLabourWages: async (start_date: string, end_date: string) => {
    const response = await api.get(`/accountant/payroll/labour/wages?start_date=${start_date}&end_date=${end_date}`);
    return response.data;
  },

  getPayrollRegister: async () => {
    const response = await api.get('/accountant/payroll/register');
    return response.data;
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
    const response = await api.post('/accountant/payroll/labour/pay', data);
    return response.data;
  }
};
