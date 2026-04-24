export interface Owner {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  pan: string;
  aadhaar: string;
}

export interface PaymentTransaction {
  id: string;
  ownerId: string;
  ownerName: string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Pending";
  reference: string;
  type: "Credit" | "Debit";
  description: string;
}

export const mockOwners: Owner[] = [
  {
    id: "OWN001",
    name: "Rajesh Kumar",
    mobile: "9876543210",
    email: "rajesh.k@example.com",
    address: "Chinchwad, Pune, Maharashtra",
    pan: "ABCDE1234F",
    aadhaar: "123412341234",
  },
  {
    id: "OWN002",
    name: "Priya Sharma",
    mobile: "8765432109",
    email: "priya.s@example.com",
    address: "Baner, Pune, Maharashtra",
    pan: "FGHIJ5678K",
    aadhaar: "987698769876",
  },
  {
    id: "OWN003",
    name: "Amit Patel",
    mobile: "7654321098",
    email: "amit.p@example.com",
    address: "Wakad, Pune, Maharashtra",
    pan: "LMNOP9012Q",
    aadhaar: "456745674567",
  },
];

export const mockPayments: PaymentTransaction[] = [
  { id: "TXN-5001", ownerId: "OWN001", ownerName: "Rajesh Kumar", date: "2023-10-01", amount: 150000, status: "Paid", reference: "NEFT-12345", type: "Credit", description: "Initial Booking Amount" },
  { id: "TXN-5002", ownerId: "OWN001", ownerName: "Rajesh Kumar", date: "2023-11-15", amount: 500000, status: "Paid", reference: "CHQ-98765", type: "Credit", description: "1st Installment" },
  { id: "TXN-5003", ownerId: "OWN002", ownerName: "Priya Sharma", date: "2023-12-05", amount: 250000, status: "Unpaid", reference: "-", type: "Debit", description: "2nd Installment Due" },
  { id: "TXN-5004", ownerId: "OWN003", ownerName: "Amit Patel", date: "2023-12-10", amount: 1000000, status: "Pending", reference: "RTGS-45678", type: "Credit", description: "Full Payment (Clearance Pending)" },
  { id: "TXN-5005", ownerId: "OWN002", ownerName: "Priya Sharma", date: "2023-11-01", amount: 100000, status: "Paid", reference: "UPI-112233", type: "Credit", description: "Booking Amount" },
];
