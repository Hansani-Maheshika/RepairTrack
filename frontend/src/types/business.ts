export interface Notification {
  id: string;
  repairJobId?: string | null;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
}
export interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
}
export interface Quotation {
  id: string;
  quotationNumber: string;
  repairJobId: string;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
  subtotal: string;
  tax: string;
  total: string;
  notes?: string | null;
  items: QuotationItem[];
  createdAt: string;
}
export interface SparePart {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  quantity: number;
  reorderLevel: number;
  unitCost: string;
  sellingPrice: string;
  isActive: boolean;
}
export interface Payment {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
  subtotal: string;
  tax: string;
  total: string;
  paidAmount: string;
  balance: string;
  customer?: { name: string; email?: string; phone: string };
  repairJob?: { repairNumber: string; reportedProblem: string };
  payments: Payment[];
}
export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}
export interface PartRequest {
  id: string;
  repairJobId: string;
  requestedById: string;
  sparePartId?: string | null;
  partName: string;
  quantity: number;
  note?: string | null;
  status: "PENDING" | "FULFILLED" | "REJECTED";
  createdAt: string;
  repairJob: { id: string; repairNumber: string; status: string };
  requestedBy: { id: string; fullName: string; staffCode: string };
  sparePart?: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
  } | null;
}
