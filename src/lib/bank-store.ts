"use client";

import { useCallback, useEffect, useState } from "react";
import mockTransactions from "@/data/transactions.json";
import mockProfile from "@/data/user-profile.json";
import type { UserProfile } from "./user-profile";

export { formatINR } from "./user-profile";

import type {
  BankingDocument,
  Beneficiary,
  BillRecord,
  BudgetRecord,
  CardControls,
  CardDispute,
  FDMaturityReminder,
  LoanApplicationDocument,
  RecurringDepositRecord,
  RecurringPaymentItem,
  SavingsGoal,
  ScheduledPayment,
  ServiceRequest,
} from "@/types/banking";
import type { Transaction } from "@/types/transaction";
import {
  initialBeneficiaries,
  initialBills,
  initialBudgets,
  initialCardControls,
  initialFDReminders,
  initialRecurringDeposits,
  initialRecurringPayments,
  initialSavingsGoals,
  initialScheduledPayments,
  initialServiceRequests,
} from "./banking-data";

const PROFILE_STORAGE_KEY = "bankmate_live_profile_v1";
const TRANSACTIONS_STORAGE_KEY = "bankmate_live_transactions_v1";
const PIN_STORAGE_KEY = "bankmate_security_pin_v1";
const LOAN_APPLICATIONS_STORAGE_KEY = "bankmate_loan_applications_v1";
const SERVICE_REQUESTS_STORAGE_KEY = "bankmate_service_requests_v1";
const BENEFICIARIES_STORAGE_KEY = "bankmate_beneficiaries_v1";
const SCHEDULED_PAYMENTS_STORAGE_KEY = "bankmate_scheduled_payments_v1";
const BILLS_STORAGE_KEY = "bankmate_bills_v1";
const CARD_CONTROLS_STORAGE_KEY = "bankmate_card_controls_v1";
const BUDGETS_STORAGE_KEY = "bankmate_budgets_v1";
const SAVINGS_GOALS_STORAGE_KEY = "bankmate_savings_goals_v1";
const RECURRING_PAYMENTS_STORAGE_KEY = "bankmate_recurring_payments_v1";
const FD_REMINDERS_STORAGE_KEY = "bankmate_fd_reminders_v1";
const RECURRING_DEPOSITS_STORAGE_KEY = "bankmate_recurring_deposits_v1";
const DOCUMENTS_STORAGE_KEY = "bankmate_documents_history_v1";
const LOAN_DOCUMENTS_STORAGE_KEY = "bankmate_loan_documents_v1";
const RM_APPOINTMENTS_STORAGE_KEY = "bankmate_rm_appointments_v1";

const DEFAULT_TRANSACTION_PIN = "123456";

export interface LoanApplicationRecord {
  applicationId: string;
  loanId: string;
  loanName: string;
  category: string;
  requestedAmount: number;
  tenureYears: number;
  interestRate: number;
  estimatedEmi: number;
  status:
    | "Pending RM Review"
    | "Under Human Approval"
    | "RM Review Scheduled"
    | "Approved";
  rmAssigned: {
    name: string;
    title: string;
    email: string;
    phone: string;
    branch: string;
  };
  submittedAt: string;
  cibilScore: number;
  monthlyIncome: number;
  notes?: string;
}

export interface RMAppointmentRecord {
  appointmentId: string;
  date: string;
  timeSlot: string;
  topic: string;
  rmName: string;
  status: "Confirmed" | "Completed" | "Cancelled";
  meetingLink: string;
}

const STORE_UPDATE_EVENT = "bankmate-store-updated";

export function emitStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_UPDATE_EVENT));
  }
}

// ==================== PROFILE ====================
export function getLiveProfile(): UserProfile {
  if (typeof window === "undefined")
    return mockProfile as unknown as UserProfile;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      const initial = mockProfile as unknown as UserProfile;
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (
      parsed.personal &&
      parsed.personal.email !==
        (mockProfile as unknown as UserProfile).personal.email
    ) {
      parsed.personal.email = (
        mockProfile as unknown as UserProfile
      ).personal.email;
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return mockProfile as unknown as UserProfile;
  }
}

export function saveLiveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  emitStoreUpdate();
}

// ==================== TRANSACTIONS ====================
export function getLiveTransactions(): Transaction[] {
  if (typeof window === "undefined")
    return mockTransactions as unknown as Transaction[];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      const initial = mockTransactions as unknown as Transaction[];
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockTransactions as unknown as Transaction[];
  }
}

export function addLiveTransaction(tx: Transaction) {
  const txs = getLiveTransactions();
  txs.unshift(tx);
  if (typeof window !== "undefined") {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txs));
    emitStoreUpdate();
  }
}

// ==================== PIN ====================
export function getLivePin(): string {
  if (typeof window === "undefined") return DEFAULT_TRANSACTION_PIN;
  try {
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!pin) {
      localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_TRANSACTION_PIN);
      return DEFAULT_TRANSACTION_PIN;
    }
    return pin;
  } catch {
    return DEFAULT_TRANSACTION_PIN;
  }
}

export function validateTransactionPin(inputPin: string): boolean {
  const currentPin = getLivePin();
  return inputPin.trim() === currentPin;
}

// ==================== SERVICE REQUESTS ====================
export function getLiveServiceRequests(): ServiceRequest[] {
  if (typeof window === "undefined") return initialServiceRequests;
  try {
    const raw = localStorage.getItem(SERVICE_REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        SERVICE_REQUESTS_STORAGE_KEY,
        JSON.stringify(initialServiceRequests),
      );
      return initialServiceRequests;
    }
    return JSON.parse(raw);
  } catch {
    return initialServiceRequests;
  }
}

export function executeCreateServiceRequest(params: {
  requestType: ServiceRequest["requestType"];
  title: string;
  description: string;
  department?: string;
  priority?: ServiceRequest["priority"];
  referenceNumber?: string;
}): { success: boolean; serviceRequest: ServiceRequest; message: string } {
  const reqs = getLiveServiceRequests();
  const now = new Date();

  // Determine department & priority if not specified
  let department = params.department || "Customer Service Operations";
  let priority = params.priority || "Medium";
  let slaDays = 3;

  if (
    params.requestType.includes("Card block") ||
    params.requestType.includes("Failed-transaction")
  ) {
    department = "Cards & Digital Payments Desk";
    priority = "High";
    slaDays = 1;
  } else if (
    params.requestType.includes("KYC") ||
    params.requestType.includes("Re-KYC")
  ) {
    department = "Central Compliance & KYC";
    priority = "Medium";
    slaDays = 5;
  } else if (params.requestType.includes("Loan")) {
    department = "Retail Lending Operations";
    priority = "High";
    slaDays = 2;
  } else if (params.requestType.includes("Cheque")) {
    department = "Branch Operations";
    priority = "Medium";
    slaDays = 4;
  }

  const slaDeadlineDate = new Date(now);
  slaDeadlineDate.setDate(now.getDate() + slaDays);

  const reqId = `SR-BKMT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newSR: ServiceRequest = {
    requestId: reqId,
    requestType: params.requestType,
    title: params.title,
    description: params.description,
    department,
    priority,
    status: "Submitted",
    createdDate: now.toISOString(),
    lastUpdatedDate: now.toISOString(),
    slaDeadline: slaDeadlineDate.toISOString(),
    assignedTeam: `${department} Team`,
    assignedEmployee: {
      name: "Priya Sharma",
      role: "Senior Wealth Director & Dedicated RM",
      email: "priya.sharma@bankmate.io",
    },
    referenceNumber:
      params.referenceNumber ||
      `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    internalNotes: "Generated via BankMate AI Concierge authenticated session.",
    customerUpdates: [
      {
        timestamp: now.toISOString(),
        message: `Service request ${reqId} registered successfully. Assigned to ${department}. Expected resolution within ${slaDays} business day(s).`,
        author: "BankMate Concierge Bot",
        isCustomerVisible: true,
      },
    ],
    isEscalated: false,
  };

  reqs.unshift(newSR);
  if (typeof window !== "undefined") {
    localStorage.setItem(SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(reqs));
    emitStoreUpdate();
  }

  return {
    success: true,
    serviceRequest: newSR,
    message: `Service request ${reqId} created successfully.`,
  };
}

export function executeUpdateServiceRequest(
  requestId: string,
  newStatus?: ServiceRequest["status"],
  customerMessage?: string,
): { success: boolean; serviceRequest?: ServiceRequest; message: string } {
  const reqs = getLiveServiceRequests();
  const index = reqs.findIndex(
    (r) => r.requestId.toLowerCase() === requestId.toLowerCase(),
  );
  if (index === -1) {
    return { success: false, message: `Request ID ${requestId} not found.` };
  }

  const req = reqs[index];
  const now = new Date().toISOString();
  if (newStatus) req.status = newStatus;
  req.lastUpdatedDate = now;

  if (customerMessage) {
    req.customerUpdates.push({
      timestamp: now,
      message: customerMessage,
      author: "Deep Yadav",
      isCustomerVisible: true,
    });
  }

  reqs[index] = req;
  if (typeof window !== "undefined") {
    localStorage.setItem(SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(reqs));
    emitStoreUpdate();
  }

  return {
    success: true,
    serviceRequest: req,
    message: `Service request ${requestId} updated successfully.`,
  };
}

export function executeCancelServiceRequest(
  requestId: string,
  reason: string = "Cancelled by customer",
): { success: boolean; serviceRequest?: ServiceRequest; message: string } {
  const reqs = getLiveServiceRequests();
  const index = reqs.findIndex(
    (r) => r.requestId.toLowerCase() === requestId.toLowerCase(),
  );
  if (index === -1) {
    return { success: false, message: `Request ID ${requestId} not found.` };
  }

  const req = reqs[index];
  if (req.status === "Resolved") {
    return {
      success: false,
      message: "Cannot cancel an already resolved service request.",
    };
  }

  const now = new Date().toISOString();
  req.status = "Cancelled";
  req.cancellationReason = reason;
  req.lastUpdatedDate = now;
  req.customerUpdates.push({
    timestamp: now,
    message: `Request cancelled by customer. Reason: ${reason}`,
    author: "Deep Yadav",
    isCustomerVisible: true,
  });

  reqs[index] = req;
  if (typeof window !== "undefined") {
    localStorage.setItem(SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(reqs));
    emitStoreUpdate();
  }

  return {
    success: true,
    serviceRequest: req,
    message: `Service request ${requestId} has been cancelled.`,
  };
}

export function executeEscalateServiceRequest(
  requestId: string,
  reason: string = "SLA deadline approaching, customer expedited",
): { success: boolean; serviceRequest?: ServiceRequest; message: string } {
  const reqs = getLiveServiceRequests();
  const index = reqs.findIndex(
    (r) => r.requestId.toLowerCase() === requestId.toLowerCase(),
  );
  if (index === -1) {
    return { success: false, message: `Request ID ${requestId} not found.` };
  }

  const req = reqs[index];
  const now = new Date().toISOString();
  req.isEscalated = true;
  req.escalationReason = reason;
  req.priority = "Urgent";
  req.lastUpdatedDate = now;
  req.customerUpdates.push({
    timestamp: now,
    message: `ESCALATED: Request escalated to Head of Customer Experience. Reason: ${reason}`,
    author: "BankMate Escalations Desk",
    isCustomerVisible: true,
  });

  reqs[index] = req;
  if (typeof window !== "undefined") {
    localStorage.setItem(SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(reqs));
    emitStoreUpdate();
  }

  return {
    success: true,
    serviceRequest: req,
    message: `Service request ${requestId} has been escalated to Urgent priority with the Nodal Officer.`,
  };
}

// ==================== BENEFICIARIES ====================
export function getLiveBeneficiaries(): Beneficiary[] {
  if (typeof window === "undefined") return initialBeneficiaries;
  try {
    const raw = localStorage.getItem(BENEFICIARIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        BENEFICIARIES_STORAGE_KEY,
        JSON.stringify(initialBeneficiaries),
      );
      return initialBeneficiaries;
    }
    return JSON.parse(raw);
  } catch {
    return initialBeneficiaries;
  }
}

export function executeAddBeneficiary(
  b: Omit<Beneficiary, "id" | "addedDate" | "status">,
): {
  success: boolean;
  beneficiary: Beneficiary;
  message: string;
} {
  const bens = getLiveBeneficiaries();
  const id = `ben_${Date.now()}`;
  const now = new Date();
  const coolingEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours cooling

  const newBen: Beneficiary = {
    ...b,
    id,
    addedDate: now.toISOString().split("T")[0],
    coolingPeriodEnds: coolingEnd.toISOString(),
    status: "Cooling Period",
  };

  bens.unshift(newBen);
  if (typeof window !== "undefined") {
    localStorage.setItem(BENEFICIARIES_STORAGE_KEY, JSON.stringify(bens));
    emitStoreUpdate();
  }

  return {
    success: true,
    beneficiary: newBen,
    message: `Beneficiary ${b.name} (${b.bankName}) added. 4-hour cooling period active as per security guidelines.`,
  };
}

export function executeDeleteBeneficiary(id: string): {
  success: boolean;
  message: string;
} {
  const bens = getLiveBeneficiaries();
  const filtered = bens.filter((b) => b.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(BENEFICIARIES_STORAGE_KEY, JSON.stringify(filtered));
    emitStoreUpdate();
  }
  return { success: true, message: "Beneficiary deleted successfully." };
}

// ==================== SCHEDULED PAYMENTS ====================
export function getLiveScheduledPayments(): ScheduledPayment[] {
  if (typeof window === "undefined") return initialScheduledPayments;
  try {
    const raw = localStorage.getItem(SCHEDULED_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        SCHEDULED_PAYMENTS_STORAGE_KEY,
        JSON.stringify(initialScheduledPayments),
      );
      return initialScheduledPayments;
    }
    return JSON.parse(raw);
  } catch {
    return initialScheduledPayments;
  }
}

// ==================== BILLS & RECHARGES ====================
export function getLiveBills(): BillRecord[] {
  if (typeof window === "undefined") return initialBills;
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(initialBills));
      return initialBills;
    }
    return JSON.parse(raw);
  } catch {
    return initialBills;
  }
}

export function executePayBill(
  billId: string,
  pin: string,
): {
  success: boolean;
  bill?: BillRecord;
  message: string;
  receiptId?: string;
} {
  if (!validateTransactionPin(pin)) {
    return { success: false, message: "Incorrect 6-digit transaction PIN." };
  }

  const bills = getLiveBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) {
    return { success: false, message: "Bill not found." };
  }

  const profile = getLiveProfile();
  const savings =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savings || savings.availableBalance < bill.billAmount) {
    return {
      success: false,
      message: "Insufficient funds in savings account.",
    };
  }

  savings.availableBalance -= bill.billAmount;
  savings.ledgerBalance -= bill.billAmount;
  profile.wealth.liquidCash -= bill.billAmount;
  profile.wealth.totalNetWorth -= bill.billAmount;

  bill.status = "Paid";
  bill.lastPaidDate = new Date().toISOString();

  const receiptId = `BILL-REC-${Date.now().toString().slice(-6)}`;
  addLiveTransaction({
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    description: `Bill Payment - ${bill.billerName} (${bill.consumerNumber})`,
    category: "Utilities",
    account: "savings",
    type: "debit",
    amount: bill.billAmount,
    status: "completed",
  });

  saveLiveProfile(profile);
  if (typeof window !== "undefined") {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
    emitStoreUpdate();
  }

  return {
    success: true,
    bill,
    receiptId,
    message: `Paid ₹${bill.billAmount.toLocaleString("en-IN")} to ${bill.billerName}. Receipt: ${receiptId}`,
  };
}

export function executeMobileRecharge(
  phoneNumber: string,
  operator: "Jio" | "Airtel" | "Vi",
  amount: number,
  pin: string,
): { success: boolean; message: string; receiptId?: string } {
  if (!validateTransactionPin(pin)) {
    return { success: false, message: "Incorrect 6-digit transaction PIN." };
  }

  const profile = getLiveProfile();
  const savings =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savings || savings.availableBalance < amount) {
    return {
      success: false,
      message: "Insufficient balance for mobile recharge.",
    };
  }

  savings.availableBalance -= amount;
  savings.ledgerBalance -= amount;
  profile.wealth.liquidCash -= amount;
  profile.wealth.totalNetWorth -= amount;

  const receiptId = `RCHG-${Date.now().toString().slice(-6)}`;
  addLiveTransaction({
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    description: `Mobile Recharge ${operator} (${phoneNumber})`,
    category: "Utilities",
    account: "savings",
    type: "debit",
    amount,
    status: "completed",
  });

  saveLiveProfile(profile);
  return {
    success: true,
    receiptId,
    message: `Recharge of ₹${amount} for ${phoneNumber} (${operator}) successful! Ref: ${receiptId}`,
  };
}

// ==================== CARD CONTROLS ====================
export function getLiveCardControls(): Record<string, CardControls> {
  if (typeof window === "undefined") return initialCardControls;
  try {
    const raw = localStorage.getItem(CARD_CONTROLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        CARD_CONTROLS_STORAGE_KEY,
        JSON.stringify(initialCardControls),
      );
      return initialCardControls;
    }
    return JSON.parse(raw);
  } catch {
    return initialCardControls;
  }
}

export function executeToggleCardControl(
  cardId: string,
  field:
    | "contactlessEnabled"
    | "internationalEnabled"
    | "onlineEcommerceEnabled"
    | "isBlockedTemporarily",
  value: boolean,
): { success: boolean; message: string; cardControls: CardControls } {
  const allCards = getLiveCardControls();
  const current =
    allCards[cardId] ||
    initialCardControls[cardId] ||
    initialCardControls.card_credit_01;
  current[field] = value;
  allCards[cardId] = current;

  // Also sync with profile.cards if applicable
  const profile = getLiveProfile();
  const pCard = profile.cards.find((c) => c.id === cardId);
  if (pCard) {
    if (field === "contactlessEnabled") pCard.contactless = value;
    if (field === "internationalEnabled") pCard.international = value;
    if (field === "isBlockedTemporarily")
      pCard.status = value ? "Temporarily Blocked" : "Active";
    saveLiveProfile(profile);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_CONTROLS_STORAGE_KEY, JSON.stringify(allCards));
    emitStoreUpdate();
  }

  const label =
    field === "contactlessEnabled"
      ? "Contactless payments"
      : field === "internationalEnabled"
        ? "International usage"
        : field === "onlineEcommerceEnabled"
          ? "Online e-commerce usage"
          : "Card status";

  return {
    success: true,
    message: `${label} has been ${value ? "enabled" : "disabled"}.`,
    cardControls: current,
  };
}

export function executeSetCardLimits(
  cardId: string,
  atmLimit: number,
  posLimit: number,
): { success: boolean; message: string; cardControls: CardControls } {
  const allCards = getLiveCardControls();
  const current =
    allCards[cardId] ||
    initialCardControls[cardId] ||
    initialCardControls.card_credit_01;
  current.atmDailyLimit = atmLimit;
  current.posDailyLimit = posLimit;
  allCards[cardId] = current;

  // Sync profile
  const profile = getLiveProfile();
  const pCard = profile.cards.find((c) => c.id === cardId);
  if (pCard) {
    if (pCard.dailyAtm !== undefined) pCard.dailyAtm = atmLimit;
    if (pCard.dailyPos !== undefined) pCard.dailyPos = posLimit;
    saveLiveProfile(profile);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_CONTROLS_STORAGE_KEY, JSON.stringify(allCards));
    emitStoreUpdate();
  }

  return {
    success: true,
    message: `Limits updated. Daily ATM Limit: ₹${atmLimit.toLocaleString("en-IN")}, Daily POS/Online Limit: ₹${posLimit.toLocaleString("en-IN")}.`,
    cardControls: current,
  };
}

export function executeRedeemRewardPoints(
  cardId: string,
  pointsToRedeem: number,
  pin: string,
): {
  success: boolean;
  message: string;
  creditAmount?: number;
  remainingPoints?: number;
} {
  if (!validateTransactionPin(pin)) {
    return { success: false, message: "Incorrect 6-digit transaction PIN." };
  }

  const allCards = getLiveCardControls();
  const current =
    allCards[cardId] ||
    initialCardControls[cardId] ||
    initialCardControls.card_credit_01;
  if (current.rewardPoints < pointsToRedeem) {
    return {
      success: false,
      message: `Insufficient reward points. Available: ${current.rewardPoints.toLocaleString("en-IN")}.`,
    };
  }

  // 1 point = ₹0.25
  const creditAmount = Math.round(pointsToRedeem * 0.25);
  current.rewardPoints -= pointsToRedeem;
  current.rewardValue = Math.round(current.rewardPoints * 0.25 * 100) / 100;
  allCards[cardId] = current;

  // Credit to savings
  const profile = getLiveProfile();
  const savings =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (savings) {
    savings.availableBalance += creditAmount;
    savings.ledgerBalance += creditAmount;
    profile.wealth.liquidCash += creditAmount;
    profile.wealth.totalNetWorth += creditAmount;
  }
  const pCard = profile.cards.find((c) => c.id === cardId);
  if (pCard) {
    pCard.rewardPoints = current.rewardPoints;
    pCard.rewardValue = current.rewardValue;
  }
  saveLiveProfile(profile);

  addLiveTransaction({
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    description: `Credit Card Reward Redemption (${pointsToRedeem.toLocaleString("en-IN")} pts)`,
    category: "Income",
    account: "savings",
    type: "credit",
    amount: creditAmount,
    status: "completed",
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_CONTROLS_STORAGE_KEY, JSON.stringify(allCards));
    emitStoreUpdate();
  }

  return {
    success: true,
    creditAmount,
    remainingPoints: current.rewardPoints,
    message: `Redeemed ${pointsToRedeem.toLocaleString("en-IN")} reward points! ₹${creditAmount.toLocaleString("en-IN")} credited to your savings account.`,
  };
}

export function executeDisputeCardTransaction(
  cardId: string,
  txId: string,
  description: string,
  amount: number,
  reason: string,
): { success: boolean; dispute: CardDispute; message: string } {
  const allCards = getLiveCardControls();
  const current =
    allCards[cardId] ||
    initialCardControls[cardId] ||
    initialCardControls.card_credit_01;

  const disputeId = `DISP-${Date.now().toString().slice(-6)}`;
  const refNum = `DISP-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const dispute: CardDispute = {
    disputeId,
    transactionId: txId,
    transactionDescription: description,
    amount,
    disputeDate: new Date().toISOString(),
    reason,
    status: "Under Review",
    referenceNumber: refNum,
  };

  current.disputes.unshift(dispute);
  allCards[cardId] = current;

  // Also create a service request for this dispute
  executeCreateServiceRequest({
    requestType: "Failed-transaction complaint",
    title: `Card Transaction Dispute: ₹${amount.toLocaleString("en-IN")} (${description})`,
    description: `Dispute raised for transaction ${txId}. Reason: ${reason}. Reference: ${refNum}`,
    department: "Chargeback & Card Disputes",
    priority: "High",
    referenceNumber: refNum,
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_CONTROLS_STORAGE_KEY, JSON.stringify(allCards));
    emitStoreUpdate();
  }

  return {
    success: true,
    dispute,
    message: `Dispute ${disputeId} logged for ₹${amount.toLocaleString("en-IN")}. Reference: ${refNum}. Provisional credit will be evaluated within 48 hours.`,
  };
}

// ==================== BUDGETS & GOALS ====================
export function getLiveBudgets(): BudgetRecord[] {
  if (typeof window === "undefined") return initialBudgets;
  try {
    const raw = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(initialBudgets));
      return initialBudgets;
    }
    return JSON.parse(raw);
  } catch {
    return initialBudgets;
  }
}

export function executeCreateOrUpdateBudget(
  category: string,
  monthlyBudget: number,
): { success: boolean; budget: BudgetRecord; message: string } {
  const budgets = getLiveBudgets();
  const existingIndex = budgets.findIndex(
    (b) => b.category.toLowerCase() === category.toLowerCase(),
  );

  let budget: BudgetRecord;
  if (existingIndex >= 0) {
    budgets[existingIndex].monthlyBudget = monthlyBudget;
    budget = budgets[existingIndex];
  } else {
    budget = {
      id: `bud_${Date.now()}`,
      category,
      monthlyBudget,
      currentSpend: 0,
      period: "Current Month",
      color: "#3B82F6",
    };
    budgets.push(budget);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
    emitStoreUpdate();
  }

  return {
    success: true,
    budget,
    message: `Monthly budget of ₹${monthlyBudget.toLocaleString("en-IN")} set for ${category}.`,
  };
}

export function getLiveSavingsGoals(): SavingsGoal[] {
  if (typeof window === "undefined") return initialSavingsGoals;
  try {
    const raw = localStorage.getItem(SAVINGS_GOALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        SAVINGS_GOALS_STORAGE_KEY,
        JSON.stringify(initialSavingsGoals),
      );
      return initialSavingsGoals;
    }
    return JSON.parse(raw);
  } catch {
    return initialSavingsGoals;
  }
}

export function executeCreateSavingsGoal(
  title: string,
  targetAmount: number,
  targetDate: string,
  category: SavingsGoal["category"] = "General",
): { success: boolean; goal: SavingsGoal; message: string } {
  const goals = getLiveSavingsGoals();
  const newGoal: SavingsGoal = {
    id: `goal_${Date.now()}`,
    title,
    targetAmount,
    currentAmount: 0,
    targetDate,
    category,
    color: "#10B981",
  };

  goals.unshift(newGoal);
  if (typeof window !== "undefined") {
    localStorage.setItem(SAVINGS_GOALS_STORAGE_KEY, JSON.stringify(goals));
    emitStoreUpdate();
  }

  return {
    success: true,
    goal: newGoal,
    message: `Savings goal '${title}' created for ₹${targetAmount.toLocaleString("en-IN")} by ${targetDate}.`,
  };
}

export function executeContributeSavingsGoal(
  goalId: string,
  amount: number,
  pin: string,
): { success: boolean; goal?: SavingsGoal; message: string } {
  if (!validateTransactionPin(pin)) {
    return { success: false, message: "Incorrect 6-digit transaction PIN." };
  }

  const profile = getLiveProfile();
  const savings =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savings || savings.availableBalance < amount) {
    return { success: false, message: "Insufficient savings balance." };
  }

  const goals = getLiveSavingsGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return { success: false, message: "Savings goal not found." };

  savings.availableBalance -= amount;
  savings.ledgerBalance -= amount;
  goal.currentAmount += amount;

  saveLiveProfile(profile);
  addLiveTransaction({
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    description: `Goal Contribution: ${goal.title}`,
    category: "Investments",
    account: "savings",
    type: "debit",
    amount,
    status: "completed",
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(SAVINGS_GOALS_STORAGE_KEY, JSON.stringify(goals));
    emitStoreUpdate();
  }

  return {
    success: true,
    goal,
    message: `Contributed ₹${amount.toLocaleString("en-IN")} to '${goal.title}'. Current progress: ₹${goal.currentAmount.toLocaleString("en-IN")} / ₹${goal.targetAmount.toLocaleString("en-IN")}.`,
  };
}

// ==================== DOCUMENTS STORE ====================
export function getLiveDocuments(): BankingDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function executeSaveDocument(doc: BankingDocument) {
  const docs = getLiveDocuments();
  const existing = docs.findIndex(
    (d) => d.documentRefNumber === doc.documentRefNumber,
  );
  if (existing >= 0) {
    docs[existing] = doc;
  } else {
    docs.unshift(doc);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(docs));
    emitStoreUpdate();
  }
}

// ==================== RECURRING PAYMENTS ====================
export function getLiveRecurringPayments(): RecurringPaymentItem[] {
  if (typeof window === "undefined") return initialRecurringPayments;
  try {
    const raw = localStorage.getItem(RECURRING_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        RECURRING_PAYMENTS_STORAGE_KEY,
        JSON.stringify(initialRecurringPayments),
      );
      return initialRecurringPayments;
    }
    return JSON.parse(raw);
  } catch {
    return initialRecurringPayments;
  }
}

// ==================== FD REMINDERS & RD ====================
export function getLiveFDReminders(): FDMaturityReminder[] {
  if (typeof window === "undefined") return initialFDReminders;
  try {
    const raw = localStorage.getItem(FD_REMINDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        FD_REMINDERS_STORAGE_KEY,
        JSON.stringify(initialFDReminders),
      );
      return initialFDReminders;
    }
    return JSON.parse(raw);
  } catch {
    return initialFDReminders;
  }
}

export function executeAddFDReminder(
  fdNumber: string,
  reminderDate: string,
  channel: FDMaturityReminder["notificationChannel"] = "Email & SMS",
): { success: boolean; reminder: FDMaturityReminder; message: string } {
  const reminders = getLiveFDReminders();
  const profile = getLiveProfile();
  const fd =
    profile.fixedDeposits.find(
      (f) => f.fdNumber.toLowerCase() === fdNumber.toLowerCase(),
    ) || profile.fixedDeposits[0];

  const reminder: FDMaturityReminder = {
    id: `rem_${Date.now()}`,
    fdNumber: fd?.fdNumber || fdNumber,
    maturityDate: fd?.maturityDate || "2027-10-15",
    maturityAmount: fd?.maturityAmount || 1264800,
    reminderDate,
    notificationChannel: channel,
    status: "Active",
  };

  reminders.unshift(reminder);
  if (typeof window !== "undefined") {
    localStorage.setItem(FD_REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    emitStoreUpdate();
  }

  return {
    success: true,
    reminder,
    message: `FD Maturity reminder scheduled for ${fd.fdNumber} on ${reminderDate} via ${channel}.`,
  };
}

export function getLiveRecurringDeposits(): RecurringDepositRecord[] {
  if (typeof window === "undefined") return initialRecurringDeposits;
  try {
    const raw = localStorage.getItem(RECURRING_DEPOSITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        RECURRING_DEPOSITS_STORAGE_KEY,
        JSON.stringify(initialRecurringDeposits),
      );
      return initialRecurringDeposits;
    }
    return JSON.parse(raw);
  } catch {
    return initialRecurringDeposits;
  }
}

export function executeCreateRecurringDeposit(
  monthlyDeposit: number,
  tenureMonths: number,
  pin: string,
): { success: boolean; rd?: RecurringDepositRecord; message: string } {
  if (!validateTransactionPin(pin)) {
    return { success: false, message: "Incorrect 6-digit transaction PIN." };
  }

  const profile = getLiveProfile();
  const savings =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savings || savings.availableBalance < monthlyDeposit) {
    return {
      success: false,
      message:
        "Insufficient savings balance for initial monthly RD installment.",
    };
  }

  savings.availableBalance -= monthlyDeposit;
  savings.ledgerBalance -= monthlyDeposit;
  profile.wealth.fixedIncome += monthlyDeposit;

  const now = new Date();
  const matDate = new Date(now);
  matDate.setMonth(now.getMonth() + tenureMonths);

  const interestRate = 7.15;
  // RD Maturity estimate: M = P * [n(n+1)/2] * (r/1200) + P * n
  const n = tenureMonths;
  const totalPrincipal = monthlyDeposit * n;
  const interest = Math.round(
    monthlyDeposit * ((n * (n + 1)) / 2) * (interestRate / 1200),
  );
  const maturityAmount = totalPrincipal + interest;

  const rdNumber = `RD-BKMT-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRd: RecurringDepositRecord = {
    id: `rd_${Date.now()}`,
    rdNumber,
    monthlyDeposit,
    tenureMonths,
    interestRate,
    maturityAmount,
    startDate: now.toISOString().split("T")[0],
    maturityDate: matDate.toISOString().split("T")[0],
    status: "Active",
    nextDeductionDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  };

  const rds = getLiveRecurringDeposits();
  rds.unshift(newRd);

  addLiveTransaction({
    id: `tx_${Date.now()}`,
    date: now.toISOString(),
    description: `RD Creation - 1st Installment (${rdNumber})`,
    category: "Investments",
    account: "savings",
    type: "debit",
    amount: monthlyDeposit,
    status: "completed",
  });

  saveLiveProfile(profile);
  if (typeof window !== "undefined") {
    localStorage.setItem(RECURRING_DEPOSITS_STORAGE_KEY, JSON.stringify(rds));
    emitStoreUpdate();
  }

  return {
    success: true,
    rd: newRd,
    message: `Recurring Deposit ${rdNumber} booked for ₹${monthlyDeposit.toLocaleString("en-IN")}/mo for ${tenureMonths} months @ ${interestRate}%. Estimated maturity: ₹${maturityAmount.toLocaleString("en-IN")}.`,
  };
}

// ==================== LOAN APPLICATION AND SERVICING ====================
export function getLiveLoanApplications(): LoanApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOAN_APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function executeSubmitLoanApplication(params: {
  loanId: string;
  loanName: string;
  category: string;
  requestedAmount: number;
  tenureYears: number;
  interestRate: number;
  notes?: string;
}): { success: boolean; application: LoanApplicationRecord; message: string } {
  const profile = getLiveProfile();
  const applications = getLiveLoanApplications();

  const r = params.interestRate / 100 / 12;
  const n = params.tenureYears * 12;
  const estimatedEmi =
    r === 0
      ? Math.round(params.requestedAmount / n)
      : Math.round(
          (params.requestedAmount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1),
        );

  const appId = `LN-APP-${Date.now().toString().slice(-6)}`;
  const rm = profile.personal.relationshipManager || {
    name: "Priya Sharma",
    title: "Senior Wealth Director",
    email: "priya.sharma@bankmate.io",
    phone: "+91 22 6123 4567",
    branch: "BKC Flagship Lounge, Mumbai",
  };

  const newApp: LoanApplicationRecord = {
    applicationId: appId,
    loanId: params.loanId,
    loanName: params.loanName,
    category: params.category,
    requestedAmount: params.requestedAmount,
    tenureYears: params.tenureYears,
    interestRate: params.interestRate,
    estimatedEmi,
    status: "Pending RM Review",
    rmAssigned: {
      name: rm.name,
      title: rm.title,
      email: rm.email,
      phone: rm.phone,
      branch: rm.branch,
    },
    submittedAt: new Date().toISOString(),
    cibilScore: profile.wealth.creditScore?.score || 795,
    monthlyIncome: 240000,
    notes: params.notes,
  };

  applications.unshift(newApp);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      LOAN_APPLICATIONS_STORAGE_KEY,
      JSON.stringify(applications),
    );
    emitStoreUpdate();
  }

  // Also create a service request
  executeCreateServiceRequest({
    requestType: "Loan servicing request",
    title: `New Loan Application: ${params.loanName} (₹${params.requestedAmount.toLocaleString("en-IN")})`,
    description: `Application ${appId} submitted for ${params.loanName}. Underwriting verified CIBIL 795. Awaiting Credit Committee review.`,
    department: "Retail Lending & Credit Committee",
    priority: "High",
    referenceNumber: appId,
  });

  return {
    success: true,
    application: newApp,
    message: `Loan application ${appId} submitted successfully. Assigned to RM ${rm.name} for human review.`,
  };
}

export function getLiveLoanDocuments(): LoanApplicationDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOAN_DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function executeUploadLoanDocument(
  docType: LoanApplicationDocument["documentType"],
  fileName: string,
  fileSize: string = "2.4 MB",
): { success: boolean; document: LoanApplicationDocument; message: string } {
  const docs = getLiveLoanDocuments();
  const newDoc: LoanApplicationDocument = {
    id: `doc_${Date.now()}`,
    documentType: docType,
    fileName,
    fileSize,
    uploadedAt: new Date().toISOString(),
    verificationStatus: "Verified",
  };

  docs.unshift(newDoc);
  if (typeof window !== "undefined") {
    localStorage.setItem(LOAN_DOCUMENTS_STORAGE_KEY, JSON.stringify(docs));
    emitStoreUpdate();
  }

  return {
    success: true,
    document: newDoc,
    message: `${docType} (${fileName}) uploaded and verified successfully.`,
  };
}

export function getLiveRMAppointments(): RMAppointmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RM_APPOINTMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function executeScheduleRMCall(
  date: string,
  timeSlot: string,
  topic: string = "Loan Servicing & Portfolio Review",
): { success: boolean; appointment: RMAppointmentRecord; message: string } {
  const appointments = getLiveRMAppointments();
  const apptId = `RM-CALL-${Date.now().toString().slice(-6)}`;
  const appt: RMAppointmentRecord = {
    appointmentId: apptId,
    date,
    timeSlot,
    topic,
    rmName: "Priya Sharma (Senior Wealth Director)",
    status: "Confirmed",
    meetingLink: `https://meet.bankmate.io/rm-priya-${Date.now().toString().slice(-4)}`,
  };

  appointments.unshift(appt);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      RM_APPOINTMENTS_STORAGE_KEY,
      JSON.stringify(appointments),
    );
    emitStoreUpdate();
  }

  return {
    success: true,
    appointment: appt,
    message: `Video appointment scheduled with RM Priya Sharma on ${date} at ${timeSlot}. Ref: ${apptId}.`,
  };
}

// ==================== EXISTING CORE ACTIONS ====================
export interface CreateFdParams {
  amount: number;
  tenureYears: number;
  interestRate: number;
  payoutType?: string;
  pin: string;
}

export function executeCreateFixedDeposit({
  amount,
  tenureYears,
  interestRate,
  payoutType = "Cumulative (At Maturity)",
  pin,
}: CreateFdParams) {
  if (!validateTransactionPin(pin)) {
    return {
      success: false,
      message: "Incorrect 6-digit transaction PIN. Please try again.",
    };
  }

  const profile = getLiveProfile();
  const transactions = getLiveTransactions();

  const savingsAccount =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savingsAccount) {
    return {
      success: false,
      message: "No active savings account found to debit.",
    };
  }

  if (savingsAccount.availableBalance < amount) {
    return {
      success: false,
      message: `Insufficient funds. Available balance is ₹${savingsAccount.availableBalance.toLocaleString("en-IN")}.`,
    };
  }

  savingsAccount.availableBalance -= amount;
  savingsAccount.ledgerBalance -= amount;

  const n = tenureYears;
  const r = interestRate;
  const maturityAmount = Math.round(amount * (1 + r / 400) ** (4 * n));

  const now = new Date();
  const maturityDateObj = new Date(now);
  maturityDateObj.setFullYear(now.getFullYear() + tenureYears);

  const fdId = `fd_${Date.now()}`;
  const fdNumber = `FD-BKMT-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newFd: UserProfile["fixedDeposits"][number] = {
    id: fdId,
    fdNumber,
    principalAmount: amount,
    maturityAmount,
    interestRate,
    bookingDate: now.toISOString().split("T")[0],
    maturityDate: maturityDateObj.toISOString().split("T")[0],
    tenure: `${tenureYears} Year${tenureYears > 1 ? "s" : ""} (${tenureYears * 12} Months)`,
    payoutType,
    status: "Active",
  };

  profile.fixedDeposits.unshift(newFd);
  profile.wealth.fixedIncome += amount;
  profile.wealth.liquidCash -= amount;

  const txId = `tx_fd_${Date.now()}`;
  const newTx: Transaction = {
    id: txId,
    date: now.toISOString(),
    description: `FD Creation (${fdNumber})`,
    category: "Investments",
    account: "savings",
    type: "debit",
    amount,
    status: "completed",
  };
  transactions.unshift(newTx);

  saveLiveProfile(profile);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions),
    );
    emitStoreUpdate();
  }

  return {
    success: true,
    message: `Fixed Deposit ${fdNumber} for ₹${amount.toLocaleString("en-IN")} booked successfully!`,
    fd: newFd,
    newBalance: savingsAccount.availableBalance,
    transactionId: txId,
  };
}

export interface TransferFundsParams {
  recipientName: string;
  recipientAccount: string;
  amount: number;
  note?: string;
  pin: string;
  transferType?: string;
}

export function executeTransferFunds({
  recipientName,
  recipientAccount,
  amount,
  note = "Fund Transfer",
  pin,
  transferType = "UPI",
}: TransferFundsParams) {
  if (!validateTransactionPin(pin)) {
    return {
      success: false,
      message: "Incorrect 6-digit transaction PIN. Please try again.",
    };
  }

  const profile = getLiveProfile();
  const transactions = getLiveTransactions();

  const savingsAccount =
    profile.accounts.find((a) => a.category === "savings") ||
    profile.accounts[0];
  if (!savingsAccount || savingsAccount.availableBalance < amount) {
    return {
      success: false,
      message: `Insufficient balance. Available: ₹${savingsAccount?.availableBalance.toLocaleString("en-IN") || 0}`,
    };
  }

  savingsAccount.availableBalance -= amount;
  savingsAccount.ledgerBalance -= amount;
  profile.wealth.liquidCash -= amount;
  profile.wealth.totalNetWorth -= amount;

  const now = new Date();
  const refId = `${transferType}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    date: now.toISOString(),
    description: recipientAccount
      ? `Transfer to ${recipientName} (${recipientAccount}) - ${note}`
      : `Transfer to ${recipientName} (${note})`,
    category: "Transfer",
    account: "savings",
    type: "debit",
    amount,
    status: "completed",
  };
  transactions.unshift(newTx);

  saveLiveProfile(profile);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions),
    );
    emitStoreUpdate();
  }

  return {
    success: true,
    message: `₹${amount.toLocaleString("en-IN")} transferred successfully to ${recipientName} via ${transferType}. Ref: ${refId}`,
    newBalance: savingsAccount.availableBalance,
    referenceId: refId,
  };
}

// ==================== STORE RESTORE ====================
export function resetBankStoreToDefault() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(mockProfile));
  localStorage.setItem(
    TRANSACTIONS_STORAGE_KEY,
    JSON.stringify(mockTransactions),
  );
  localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_TRANSACTION_PIN);
  localStorage.setItem(
    SERVICE_REQUESTS_STORAGE_KEY,
    JSON.stringify(initialServiceRequests),
  );
  localStorage.setItem(
    BENEFICIARIES_STORAGE_KEY,
    JSON.stringify(initialBeneficiaries),
  );
  localStorage.setItem(
    SCHEDULED_PAYMENTS_STORAGE_KEY,
    JSON.stringify(initialScheduledPayments),
  );
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(initialBills));
  localStorage.setItem(
    CARD_CONTROLS_STORAGE_KEY,
    JSON.stringify(initialCardControls),
  );
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(initialBudgets));
  localStorage.setItem(
    SAVINGS_GOALS_STORAGE_KEY,
    JSON.stringify(initialSavingsGoals),
  );
  localStorage.setItem(
    RECURRING_PAYMENTS_STORAGE_KEY,
    JSON.stringify(initialRecurringPayments),
  );
  localStorage.setItem(
    FD_REMINDERS_STORAGE_KEY,
    JSON.stringify(initialFDReminders),
  );
  localStorage.setItem(
    RECURRING_DEPOSITS_STORAGE_KEY,
    JSON.stringify(initialRecurringDeposits),
  );
  localStorage.removeItem(LOAN_APPLICATIONS_STORAGE_KEY);
  localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  localStorage.removeItem(LOAN_DOCUMENTS_STORAGE_KEY);
  localStorage.removeItem(RM_APPOINTMENTS_STORAGE_KEY);
  emitStoreUpdate();
}

export function resetProfileData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(mockProfile));
  emitStoreUpdate();
}

export function resetTransactionsData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    TRANSACTIONS_STORAGE_KEY,
    JSON.stringify(mockTransactions),
  );
  emitStoreUpdate();
}

export function resetPaymentsData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    BENEFICIARIES_STORAGE_KEY,
    JSON.stringify(initialBeneficiaries),
  );
  localStorage.setItem(
    SCHEDULED_PAYMENTS_STORAGE_KEY,
    JSON.stringify(initialScheduledPayments),
  );
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(initialBills));
  emitStoreUpdate();
}

export function resetServiceRequestsData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SERVICE_REQUESTS_STORAGE_KEY,
    JSON.stringify(initialServiceRequests),
  );
  emitStoreUpdate();
}

export function resetDocumentsData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  emitStoreUpdate();
}

export function resetLoanApplicationsData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOAN_APPLICATIONS_STORAGE_KEY);
  localStorage.removeItem(LOAN_DOCUMENTS_STORAGE_KEY);
  localStorage.removeItem(RM_APPOINTMENTS_STORAGE_KEY);
  emitStoreUpdate();
}

export function resetCardsData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CARD_CONTROLS_STORAGE_KEY,
    JSON.stringify(initialCardControls),
  );
  emitStoreUpdate();
}

export function resetBudgetsAndGoalsData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(initialBudgets));
  localStorage.setItem(
    SAVINGS_GOALS_STORAGE_KEY,
    JSON.stringify(initialSavingsGoals),
  );
  emitStoreUpdate();
}

// ==================== REACT HOOK ====================
export function useBankStore() {
  const [profile, setProfile] = useState<UserProfile>(() => getLiveProfile());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getLiveTransactions(),
  );
  const [pin, setPin] = useState<string>(() => getLivePin());
  const [loanApplications, setLoanApplications] = useState<
    LoanApplicationRecord[]
  >(() => getLiveLoanApplications());
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() =>
    getLiveServiceRequests(),
  );
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() =>
    getLiveBeneficiaries(),
  );
  const [scheduledPayments, setScheduledPayments] = useState<
    ScheduledPayment[]
  >(() => getLiveScheduledPayments());
  const [bills, setBills] = useState<BillRecord[]>(() => getLiveBills());
  const [cardControls, setCardControls] = useState<
    Record<string, CardControls>
  >(() => getLiveCardControls());
  const [budgets, setBudgets] = useState<BudgetRecord[]>(() =>
    getLiveBudgets(),
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    getLiveSavingsGoals(),
  );
  const [fdReminders, setFDReminders] = useState<FDMaturityReminder[]>(() =>
    getLiveFDReminders(),
  );
  const [recurringDeposits, setRecurringDeposits] = useState<
    RecurringDepositRecord[]
  >(() => getLiveRecurringDeposits());
  const [documents, setDocuments] = useState<BankingDocument[]>(() =>
    getLiveDocuments(),
  );

  const syncAll = useCallback(() => {
    setProfile(getLiveProfile());
    setTransactions(getLiveTransactions());
    setPin(getLivePin());
    setLoanApplications(getLiveLoanApplications());
    setServiceRequests(getLiveServiceRequests());
    setBeneficiaries(getLiveBeneficiaries());
    setScheduledPayments(getLiveScheduledPayments());
    setBills(getLiveBills());
    setCardControls(getLiveCardControls());
    setBudgets(getLiveBudgets());
    setSavingsGoals(getLiveSavingsGoals());
    setFDReminders(getLiveFDReminders());
    setRecurringDeposits(getLiveRecurringDeposits());
    setDocuments(getLiveDocuments());
  }, []);

  useEffect(() => {
    syncAll();
    window.addEventListener(STORE_UPDATE_EVENT, syncAll);
    window.addEventListener("storage", syncAll);

    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, [syncAll]);

  return {
    profile,
    transactions,
    pin,
    loanApplications,
    serviceRequests,
    beneficiaries,
    scheduledPayments,
    bills,
    cardControls,
    budgets,
    savingsGoals,
    fdReminders,
    recurringDeposits,
    documents,
    // Actions
    createFixedDeposit: executeCreateFixedDeposit,
    transferFunds: executeTransferFunds,
    submitLoanApplication: executeSubmitLoanApplication,
    validatePin: validateTransactionPin,
    createServiceRequest: executeCreateServiceRequest,
    updateServiceRequest: executeUpdateServiceRequest,
    cancelServiceRequest: executeCancelServiceRequest,
    escalateServiceRequest: executeEscalateServiceRequest,
    addBeneficiary: executeAddBeneficiary,
    deleteBeneficiary: executeDeleteBeneficiary,
    payBill: executePayBill,
    rechargeMobile: executeMobileRecharge,
    toggleCardControl: executeToggleCardControl,
    setCardLimits: executeSetCardLimits,
    redeemRewardPoints: executeRedeemRewardPoints,
    disputeCardTransaction: executeDisputeCardTransaction,
    createOrUpdateBudget: executeCreateOrUpdateBudget,
    createSavingsGoal: executeCreateSavingsGoal,
    contributeSavingsGoal: executeContributeSavingsGoal,
    uploadLoanDocument: executeUploadLoanDocument,
    scheduleRMCall: executeScheduleRMCall,
    addFDReminder: executeAddFDReminder,
    createRecurringDeposit: executeCreateRecurringDeposit,
    saveDocument: executeSaveDocument,
    // Resets
    resetToDefault: resetBankStoreToDefault,
    resetProfile: resetProfileData,
    resetTransactions: resetTransactionsData,
    resetPayments: resetPaymentsData,
    resetServiceRequests: resetServiceRequestsData,
    resetDocuments: resetDocumentsData,
    resetLoans: resetLoanApplicationsData,
    resetCards: resetCardsData,
    resetBudgetsAndGoals: resetBudgetsAndGoalsData,
  };
}
