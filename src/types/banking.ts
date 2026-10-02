export type DocumentType =
  | "interest_certificate"
  | "loan_statement"
  | "balance_certificate"
  | "account_verification_letter"
  | "tax_certificate"
  | "tds_certificate"
  | "provisional_interest_certificate"
  | "no_dues_certificate"
  | "loan_foreclosure_letter"
  | "address_proof_letter"
  | "account_statement";

export interface BankingDocument {
  documentId: string;
  documentType: DocumentType;
  title: string;
  customerName: string;
  cifNumber: string;
  accountOrLoanReference: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  generatedDate: string;
  financialYear: string;
  status: "Generated" | "Pending" | "Failed";
  fileName: string;
  documentRefNumber: string;
  verificationCode: string;
  particulars: Record<string, string | number>;
  summaryText: string;
  downloadState: "idle" | "downloading" | "downloaded" | "error";
  emailDeliveryState: "idle" | "sending" | "sent" | "error";
  targetEmail: string;
}

export type ServiceRequestType =
  | "Address update"
  | "Registered mobile-number change"
  | "Email-address change"
  | "New cheque-book request"
  | "Card block request"
  | "Card replacement request"
  | "Bank-certificate request"
  | "Failed-transaction complaint"
  | "KYC update"
  | "Re-KYC request"
  | "Nominee update"
  | "Statement request"
  | "Loan servicing request"
  | "FD servicing request"
  | "General banking complaint";

export type ServiceRequestPriority = "Low" | "Medium" | "High" | "Urgent";
export type ServiceRequestStatus =
  | "Submitted"
  | "In Review"
  | "In Progress"
  | "Resolved"
  | "Escalated"
  | "Cancelled";

export interface ServiceRequestUpdate {
  timestamp: string;
  message: string;
  author: string;
  isCustomerVisible: boolean;
}

export interface ServiceRequest {
  requestId: string;
  requestType: ServiceRequestType;
  title: string;
  description: string;
  department: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  createdDate: string;
  lastUpdatedDate: string;
  slaDeadline: string;
  assignedTeam: string;
  assignedEmployee: {
    name: string;
    role: string;
    email: string;
  };
  internalNotes?: string;
  customerUpdates: ServiceRequestUpdate[];
  referenceNumber?: string;
  cancellationReason?: string;
  isEscalated: boolean;
  escalationReason?: string;
}

export type TransferType = "UPI" | "IMPS" | "NEFT" | "RTGS" | "INTERNATIONAL";

export interface Beneficiary {
  id: string;
  name: string;
  nickname: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountType: "Savings" | "Current";
  upiId?: string;
  dailyLimit: number;
  addedDate: string;
  coolingPeriodEnds?: string;
  status: "Active" | "Cooling Period" | "Inactive";
}

export interface PaymentRecord {
  id: string;
  referenceId: string;
  paymentType: TransferType | "BILL_PAY" | "RECHARGE" | "CREDIT_CARD_BILL";
  fromAccount: string;
  toRecipient: string;
  toAccountOrNumber: string;
  amount: number;
  fee: number;
  status:
    | "Completed"
    | "Pending"
    | "Scheduled"
    | "Failed"
    | "Declined"
    | "Cancelled";
  date: string;
  note?: string;
  category?: string;
  receiptNumber: string;
  internationalDetails?: {
    foreignCurrency: string;
    foreignAmount: number;
    exchangeRate: number;
    swiftBic: string;
    routingNumber?: string;
    country: string;
    complianceStatus: "Under Human Review" | "Cleared" | "Flagged";
    purpose: string;
    estimatedDelivery: string;
  };
}

export interface ScheduledPayment {
  id: string;
  scheduledDate: string;
  frequency: "One-Time" | "Monthly" | "Weekly" | "Quarterly";
  recipientName: string;
  recipientAccount: string;
  amount: number;
  purpose: string;
  type: TransferType;
  status: "Scheduled" | "Active" | "Paused" | "Cancelled" | "Executed";
  nextExecutionDate: string;
  sourceAccount: string;
}

export interface BillRecord {
  id: string;
  billerName: string;
  category:
    | "Electricity"
    | "Broadband"
    | "Mobile Postpaid"
    | "Water"
    | "Gas"
    | "DTH"
    | "Credit Card";
  consumerNumber: string;
  billAmount: number;
  dueDate: string;
  status: "Unpaid" | "Paid" | "Overdue";
  billPeriod: string;
  lastPaidDate?: string;
}

export interface MobileRechargePlan {
  id: string;
  operator: "Jio" | "Airtel" | "Vi";
  phoneNumber: string;
  circle: string;
  amount: number;
  validity: string;
  data: string;
  talktime: string;
  description: string;
}

export interface CardControls {
  cardId: string;
  cardNumberMasked: string;
  isBlockedTemporarily: boolean;
  isLostReported: boolean;
  contactlessEnabled: boolean;
  internationalEnabled: boolean;
  onlineEcommerceEnabled: boolean;
  atmDailyLimit: number;
  atmMaxLimit: number;
  posDailyLimit: number;
  posMaxLimit: number;
  pinLastChanged?: string;
  rewardPoints: number;
  rewardValue: number;
  disputes: CardDispute[];
}

export interface CardDispute {
  disputeId: string;
  transactionId: string;
  transactionDescription: string;
  amount: number;
  disputeDate: string;
  reason: string;
  status:
    | "Under Review"
    | "Provisional Credit Issued"
    | "Resolved"
    | "Rejected";
  referenceNumber: string;
}

export interface LoanApplicationDocument {
  id: string;
  documentType:
    | "Income Proof"
    | "Identity Proof"
    | "Address Proof"
    | "Property Deed"
    | "Bank Statement";
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verificationStatus: "Verified" | "Under Review" | "Rejected";
}

export interface RMAssignment {
  name: string;
  title: string;
  phone: string;
  email: string;
  branch: string;
}

export interface ForeclosureQuote {
  quoteId: string;
  loanAccount: string;
  loanType: string;
  principalOutstanding: number;
  accruedInterest: number;
  foreclosureCharges: number;
  gstOnCharges: number;
  totalForeclosureAmount: number;
  validUntil: string;
}

export interface EMIScheduleItem {
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
}

export interface FDMaturityReminder {
  id: string;
  fdNumber: string;
  maturityDate: string;
  maturityAmount: number;
  reminderDate: string;
  notificationChannel: "Email & SMS" | "SMS Only" | "WhatsApp";
  status: "Active" | "Triggered";
}

export interface RecurringDepositRecord {
  id: string;
  rdNumber: string;
  monthlyDeposit: number;
  tenureMonths: number;
  interestRate: number;
  maturityAmount: number;
  startDate: string;
  maturityDate: string;
  status: "Active" | "Matured" | "Closed";
  nextDeductionDate: string;
}

export interface BudgetRecord {
  id: string;
  category: string;
  monthlyBudget: number;
  currentSpend: number;
  period: string;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category:
    | "Emergency"
    | "Travel"
    | "Property"
    | "Retirement"
    | "Vehicle"
    | "General";
  color: string;
}

export interface RecurringPaymentItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: "Monthly" | "Annual" | "Quarterly";
  nextDueDate: string;
  category:
    | "Entertainment"
    | "Utility"
    | "Investment"
    | "Software"
    | "Loan EMI";
  autoDebitEnabled: boolean;
}

export interface CashFlowForecastItem {
  month: string;
  projectedInflow: number;
  projectedOutflow: number;
  netSurplus: number;
  estimatedClosingBalance: number;
}
