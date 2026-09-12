"use client";

import { useEffect, useState } from "react";
import mockTransactions from "@/data/transactions.json";
import mockProfile from "@/data/user-profile.json";
import { type UserProfile, formatINR } from "./user-profile";
export { formatINR } from "./user-profile";
import type { Transaction } from "@/types/transaction";

const PROFILE_STORAGE_KEY = "bankmate_live_profile_v1";
const TRANSACTIONS_STORAGE_KEY = "bankmate_live_transactions_v1";
const PIN_STORAGE_KEY = "bankmate_security_pin_v1";
const DEFAULT_DEMO_PIN = "123456";

export interface BankStoreState {
  profile: UserProfile;
  transactions: Transaction[];
  pin: string;
}

// Custom event name for instant cross-component updates
const STORE_UPDATE_EVENT = "bankmate-store-updated";

function emitStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_UPDATE_EVENT));
  }
}

export function getLiveProfile(): UserProfile {
  if (typeof window === "undefined") return mockProfile as unknown as UserProfile;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      const initial = mockProfile as unknown as UserProfile;
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockProfile as unknown as UserProfile;
  }
}

export function getLiveTransactions(): Transaction[] {
  if (typeof window === "undefined") return mockTransactions as unknown as Transaction[];
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

export function getLivePin(): string {
  if (typeof window === "undefined") return DEFAULT_DEMO_PIN;
  try {
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!pin) {
      localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_DEMO_PIN);
      return DEFAULT_DEMO_PIN;
    }
    return pin;
  } catch {
    return DEFAULT_DEMO_PIN;
  }
}

export function validateTransactionPin(inputPin: string): boolean {
  const currentPin = getLivePin();
  return inputPin.trim() === currentPin;
}

export interface CreateFdParams {
  amount: number;
  tenureYears: number;
  interestRate: number;
  payoutType?: string;
  pin: string;
}

export interface CreateFdResult {
  success: boolean;
  message: string;
  fd?: UserProfile["fixedDeposits"][number];
  newBalance?: number;
  transactionId?: string;
}

export function executeCreateFixedDeposit({
  amount,
  tenureYears,
  interestRate,
  payoutType = "Cumulative (At Maturity)",
  pin,
}: CreateFdParams): CreateFdResult {
  if (!validateTransactionPin(pin)) {
    return {
      success: false,
      message: "Incorrect 6-digit transaction PIN. Please try again.",
    };
  }

  const profile = getLiveProfile();
  const transactions = getLiveTransactions();

  // Find savings account
  const savingsAccount = profile.accounts.find((a) => a.category === "savings") || profile.accounts[0];
  if (!savingsAccount) {
    return { success: false, message: "No active savings account found to debit." };
  }

  if (savingsAccount.availableBalance < amount) {
    return {
      success: false,
      message: `Insufficient funds. Available balance is ₹${savingsAccount.availableBalance.toLocaleString("en-IN")}.`,
    };
  }

  // Debit savings account
  savingsAccount.availableBalance -= amount;
  savingsAccount.ledgerBalance -= amount;

  // Calculate maturity value (quarterly compounding: A = P * (1 + r/400)^(4*n))
  const n = tenureYears;
  const r = interestRate;
  const maturityAmount = Math.round(amount * Math.pow(1 + r / 400, 4 * n));

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

  // Add FD to profile
  profile.fixedDeposits.unshift(newFd);

  // Recalculate Fixed Income and Net Worth
  profile.wealth.fixedIncome += amount;
  profile.wealth.liquidCash -= amount;
  // Net worth stays balanced (liquid cash converted into FD)

  // Record debit transaction in ledger
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

  // Persist to localStorage
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Failed to save live bank state:", err);
  }

  emitStoreUpdate();

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
}

export interface TransferFundsResult {
  success: boolean;
  message: string;
  newBalance?: number;
  referenceId?: string;
}

export function executeTransferFunds({
  recipientName,
  recipientAccount,
  amount,
  note = "Fund Transfer",
  pin,
}: TransferFundsParams): TransferFundsResult {
  if (!validateTransactionPin(pin)) {
    return {
      success: false,
      message: "Incorrect 6-digit transaction PIN. Please try again.",
    };
  }

  const profile = getLiveProfile();
  const transactions = getLiveTransactions();

  const savingsAccount = profile.accounts.find((a) => a.category === "savings") || profile.accounts[0];
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
  const refId = `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    date: now.toISOString(),
    description: `Transfer to ${recipientName} (${note})`,
    category: "Transfer",
    account: "savings",
    type: "debit",
    amount,
    status: "completed",
  };
  transactions.unshift(newTx);

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Failed to save transfer:", err);
  }

  emitStoreUpdate();

  return {
    success: true,
    message: `₹${amount.toLocaleString("en-IN")} transferred successfully to ${recipientName}. Ref: ${refId}`,
    newBalance: savingsAccount.availableBalance,
    referenceId: refId,
  };
}

export function resetBankStoreToDefault() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(mockProfile));
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(mockTransactions));
  localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_DEMO_PIN);
  emitStoreUpdate();
}

export function useBankStore() {
  const [profile, setProfile] = useState<UserProfile>(() => getLiveProfile());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLiveTransactions());
  const [pin, setPin] = useState<string>(() => getLivePin());

  useEffect(() => {
    // Initial sync
    setProfile(getLiveProfile());
    setTransactions(getLiveTransactions());
    setPin(getLivePin());

    const handleUpdate = () => {
      setProfile(getLiveProfile());
      setTransactions(getLiveTransactions());
      setPin(getLivePin());
    };

    window.addEventListener(STORE_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    profile,
    transactions,
    pin,
    createFixedDeposit: executeCreateFixedDeposit,
    transferFunds: executeTransferFunds,
    validatePin: validateTransactionPin,
    resetToDefault: resetBankStoreToDefault,
  };
}
