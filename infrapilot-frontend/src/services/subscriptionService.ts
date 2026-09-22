

export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
}

export interface PaymentSubmission {
  companyId: string;
  planId: string;
  utrNumber: string;
  amount: string;
}

export const subscriptionService = {
  // 1. Tenant Selects Plan
  async getPlans(): Promise<Plan[]> {
    return [
      { id: "starter", name: "Starter", price: "9999", features: ["Up to 5 Users"] },
      { id: "professional", name: "Professional", price: "29999", features: ["Up to 25 Users", "Priority Support"] },
      { id: "enterprise", name: "Enterprise", price: "99999", features: ["Unlimited Users", "24/7 Support"] },
    ];
  },

  // 2. Generate UPI QR
  async generateUpiQr(planId: string): Promise<{ qrUrl: string, amount: string }> {
    // Mocking QR code generation for the selected plan
    const amount = planId === 'starter' ? '9999' : planId === 'professional' ? '29999' : '99999';
    return {
      qrUrl: `https://mock-qr-server.com/generate?amount=${amount}&vpa=infrapilot@upi`,
      amount
    };
  },

  // 4. Submit UTR (Tenant side)
  async submitUtr(data: PaymentSubmission): Promise<{ success: boolean; message: string }> {
    // In a real app, this would send the UTR to the backend to be queued for Super Admin review
    console.log("Mock Submit UTR:", data);
    return { success: true, message: "Payment submitted successfully. Pending verification." };
  },

  // 5. Get Manual Payments (Super Admin side)
  async getPendingPayments(): Promise<any[]> {
    return [
      { id: 1, company: "Shree Constructions", plan: "Professional Plan", amount: "₹29,999", utr: "UTR1234567890", date: "25 Jun 2025, 11:30 AM", status: "Pending" },
      { id: 2, company: "BuildTech Infra", plan: "Enterprise Plan", amount: "₹99,999", utr: "UTR987654321", date: "25 Jun 2025, 10:15 AM", status: "Pending" },
    ];
  },

  // Super Admin Verifies Payment
  async verifyPayment(paymentId: number): Promise<{ success: boolean; message: string }> {
    console.log(`Mock Verify Payment ID: ${paymentId}`);
    return { success: true, message: "Payment verified successfully. Subscription activated." };
  },

  // Super Admin Rejects Payment
  async rejectPayment(paymentId: number, reason: string, refundStatus: string): Promise<{ success: boolean; message: string }> {
    console.log(`Mock Reject Payment ID: ${paymentId}, Reason: ${reason}, Refund: ${refundStatus}`);
    return { success: true, message: "Payment rejected." };
  }
};
