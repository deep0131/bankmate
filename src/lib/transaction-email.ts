export interface TransferEmailData {
  recipientName: string;
  recipientAccount: string;
  amount: number;
  note?: string;
  referenceId: string;
  sourceAccount?: string;
  newBalance: number;
  date?: string;
}

export interface FdEmailData {
  fdNumber: string;
  principalAmount: number;
  tenureYears: number;
  interestRate: number;
  maturityAmount: number;
  payoutType?: string;
  sourceAccount?: string;
  newBalance: number;
  date?: string;
}

export interface LoanEmailData {
  applicationId: string;
  loanName: string;
  category: string;
  requestedAmount: number;
  tenureYears: number;
  interestRate: number;
  estimatedEmi: number;
  rmName?: string;
  rmEmail?: string;
  date?: string;
}

export type TransactionEmailPayload =
  | {
      type: "transfer";
      recipientEmail?: string;
      data: TransferEmailData;
    }
  | {
      type: "fixed-deposit";
      recipientEmail?: string;
      data: FdEmailData;
    }
  | {
      type: "loan-application";
      recipientEmail?: string;
      data: LoanEmailData;
    };

export async function sendTransactionEmail(payload: TransactionEmailPayload) {
  try {
    const res = await fetch("/api/send-transaction-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to send transaction notification email:", err);
    return { ok: false, error: err?.message || "Network error" };
  }
}
