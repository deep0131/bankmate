import {
  type InferUITool,
  type InferUITools,
  tool,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { z } from "zod";
import mockTransactions from "@/data/transactions.json";
import type {
  BankingDocument,
  DocumentType,
  ServiceRequest,
  ServiceRequestType,
} from "@/types/banking";
import type { Transaction } from "@/types/transaction";
import {
  initialBeneficiaries,
  initialBills,
  initialServiceRequests,
} from "../banking-data";
import { calculateFxTransfer } from "../finance-calculations";

function calculateEmi(amount: number, ratePercent: number, years: number) {
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return amount / n;
  return (amount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1);
}

// 1. Transaction Table Tool
export const transactionTableTool = tool({
  description:
    "Retrieve the user's banking transaction history filtered by account, category, or limit to display in an interactive transaction data table.",
  inputSchema: z.object({
    account: z
      .enum(["checking", "savings", "credit", "all"])
      .optional()
      .describe(
        "Filter transactions by account type (checking, savings, credit, or all).",
      ),
    category: z
      .string()
      .optional()
      .describe(
        "Filter transactions by category (e.g. Groceries, Dining, Travel, Shopping, Utilities, Subscriptions, Income, Transfer).",
      ),
    limit: z
      .number()
      .optional()
      .describe("Max number of transactions to return (default 10)."),
  }),
  execute: async ({ account, category, limit = 10 }) => {
    let transactions = mockTransactions as Transaction[];

    if (account && account !== "all") {
      transactions = transactions.filter(
        (tx) => tx.account.toLowerCase() === account.toLowerCase(),
      );
    }

    if (category && category !== "all") {
      transactions = transactions.filter(
        (tx) => tx.category.toLowerCase() === category.toLowerCase(),
      );
    }

    return {
      account: account ?? "all",
      category: category ?? "all",
      totalCount: transactions.length,
      transactions: transactions.slice(0, limit),
    };
  },
});

// 2. Loan Calculator Tool
export const loanCalculatorTool = tool({
  description:
    "Calculate monthly loan payments (EMI), total interest, and compare loan terms/rates (e.g., home loans, auto loans, personal loans, education loans in INR / Rupees).",
  inputSchema: z.object({
    loanAmount: z
      .number()
      .default(2500000)
      .describe("Principal loan amount in INR / Rupees (e.g. 2500000)."),
    interestRate: z
      .number()
      .default(8.5)
      .describe("Annual interest rate percentage / APR (e.g. 8.5)."),
    loanTermYears: z
      .number()
      .default(20)
      .describe("Duration of the loan in years (e.g. 15, 20, or 30)."),
    loanType: z
      .enum(["mortgage", "auto", "personal", "student"])
      .optional()
      .describe("Type of loan product."),
  }),
  execute: async ({
    loanAmount = 2500000,
    interestRate = 8.5,
    loanTermYears = 20,
    loanType = "mortgage",
  }) => {
    const monthly = calculateEmi(loanAmount, interestRate, loanTermYears);
    const totalPayment = monthly * loanTermYears * 12;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      interestRate,
      loanTermYears,
      loanType,
      monthlyPayment: Math.round(monthly * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  },
});

// 3. Financial Chart Tool
export const financialChartTool = tool({
  description:
    "Display an interactive financial chart (such as spending breakdown donut, income vs expenses bar chart, cash flow area chart, or loan comparison) using shadcn charts.",
  inputSchema: z.object({
    title: z
      .string()
      .describe(
        "Title of the chart (e.g. 'Monthly Spending Breakdown', 'Cash Flow Analysis').",
      ),
    description: z
      .string()
      .optional()
      .describe(
        "Subtitle or time range (e.g. 'September 2026', 'Last 3 Months').",
      ),
    chartType: z
      .enum(["donut", "bar", "area", "line"])
      .default("donut")
      .describe(
        "Chart visualization type: 'donut' for category breakdown, 'bar' for comparisons, 'area' for trends, 'line' for rate/timeline.",
      ),
    data: z
      .array(
        z.object({
          label: z
            .string()
            .describe(
              "Category, Month, or Label (e.g. 'Groceries', 'Dining', 'Aug 2026').",
            ),
          value: z
            .number()
            .describe("Primary value in Rupees / INR or number."),
          secondaryValue: z
            .number()
            .optional()
            .describe(
              "Optional secondary value for comparison (e.g. Income vs Expense).",
            ),
        }),
      )
      .describe("Data points to plot in the chart."),
    primaryKeyLabel: z
      .string()
      .optional()
      .default("Amount")
      .describe(
        "Label for the primary series (e.g. 'Expense', 'Spend', 'Balance').",
      ),
    secondaryKeyLabel: z
      .string()
      .optional()
      .describe(
        "Label for secondary series if comparing two series (e.g. 'Income').",
      ),
    totalLabel: z
      .string()
      .optional()
      .describe("Summary label (e.g. 'Total Spend', 'Net Savings')."),
  }),
  execute: async (params) => {
    const total = params.data.reduce((acc, curr) => acc + curr.value, 0);
    return {
      ...params,
      calculatedTotal: total,
    };
  },
});

// 4. Bank Profile Tool
export const bankProfileTool = tool({
  description:
    "Retrieve and display Deep Yadav's complete net banking profile, accounts overview, card limits, KYC status, or relationship manager details in an interactive visual card widget.",
  inputSchema: z.object({
    view: z
      .enum(["overview", "accounts", "cards", "wealth", "kyc"])
      .default("overview")
      .describe("Specific section to highlight in the profile card."),
  }),
  execute: async ({ view = "overview" }) => {
    return {
      view,
    };
  },
});

// 5. Book Fixed Deposit Tool
export const bookFixedDepositTool = tool({
  description:
    "Open or book a new Fixed Deposit (FD) for the user. Prompts the user to review details and securely authorize the booking by entering their 6-digit transaction PIN. Use whenever the user asks to create, open, or invest in an FD / fixed deposit.",
  inputSchema: z.object({
    amount: z
      .number()
      .describe(
        "Principal amount to invest in the Fixed Deposit in INR / Rupees (e.g. 20000, 50000).",
      ),
    tenureYears: z
      .number()
      .default(2)
      .describe("Tenure duration in years (e.g. 1, 2, 3, 5)."),
    interestRate: z
      .number()
      .default(7.25)
      .describe("Annual interest rate percentage (e.g. 7.25 for 7.25% p.a.)."),
    payoutType: z
      .string()
      .default("Cumulative (At Maturity)")
      .describe(
        "Interest payout mode: 'Cumulative (At Maturity)', 'Quarterly Payout', or 'Monthly Payout'.",
      ),
  }),
  execute: async ({
    amount,
    tenureYears = 2,
    interestRate = 7.25,
    payoutType = "Cumulative (At Maturity)",
  }) => {
    const n = tenureYears;
    const r = interestRate;
    const estimatedMaturity = Math.round(amount * (1 + r / 400) ** (4 * n));
    return {
      actionType: "fixed-deposit" as const,
      amount,
      tenureYears,
      interestRate,
      payoutType,
      estimatedMaturity,
      status: "pending_pin_authorization",
    };
  },
});

// 6. Transfer Funds Tool
export const transferFundsTool = tool({
  description:
    "Initiate a fund transfer (UPI / IMPS / NEFT) to a recipient. Prompts the user to enter their 6-digit transaction PIN to authorize the payment. Use whenever the user asks to send, transfer, or pay money to someone.",
  inputSchema: z.object({
    recipientName: z.string().describe("Name of the recipient or beneficiary."),
    recipientAccount: z
      .string()
      .optional()
      .default("•••• 4092")
      .describe("Account number, UPI ID, or mobile number."),
    amount: z.number().describe("Amount in INR / Rupees to transfer."),
    note: z
      .string()
      .optional()
      .default("Fund Transfer")
      .describe(
        "Payment description or note (e.g. 'Rent payment', 'Dinner split').",
      ),
  }),
  execute: async ({
    recipientName,
    recipientAccount = "•••• 4092",
    amount,
    note = "Fund Transfer",
  }) => {
    return {
      actionType: "transfer" as const,
      recipientName,
      recipientAccount,
      amount,
      note,
      status: "pending_pin_authorization",
    };
  },
});

// 7. Show Loan Offers Tool
export const showLoanOffersTool = tool({
  description:
    "Show all available bank loan products with Deep Yadav's personalized eligibility status, pre-approved limits, interest rates, and key benefits. Use when the user asks to see available loans, apply for a loan, or check what loans they can get.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        "Optional category filter (e.g. 'all', 'Home Loan', 'Personal Loan', 'Auto Loan', 'Education Loan', 'Gold Loan', 'Property Loan').",
      ),
  }),
  execute: async ({ category }) => {
    const loansCatalog = (await import("@/data/loans-catalog.json")).default;
    const userCreditScore = 795;
    const userMonthlyIncome = 240000;

    const evaluatedLoans = loansCatalog.map((loan) => {
      const isEligible =
        userCreditScore >= loan.minCreditScore &&
        userMonthlyIncome >= loan.minMonthlyIncome;

      return {
        ...loan,
        userEligible: isEligible,
        eligibilityReason: isEligible
          ? loan.isPreApproved
            ? `Pre-approved! Credit score ${userCreditScore} qualifies for instant sanction.`
            : `Eligible based on CIBIL ${userCreditScore} and monthly salary ₹2,40,000.`
          : `Requires minimum credit score of ${loan.minCreditScore} and ₹${loan.minMonthlyIncome.toLocaleString("en-IN")}/mo salary.`,
      };
    });

    const filtered =
      category && category.toLowerCase() !== "all"
        ? evaluatedLoans.filter(
            (l) => l.category.toLowerCase() === category.toLowerCase(),
          )
        : evaluatedLoans;

    return {
      category: category ?? "all",
      totalAvailable: filtered.length,
      userCreditScore,
      userMonthlyIncome,
      loans: filtered,
    };
  },
});

// 8. Apply Loan Tool
export const applyLoanTool = tool({
  description:
    "Perform bank-side eligibility verification for a specific loan product requested by Deep Yadav, check credit limits, and initiate a loan application request requiring human approval by their dedicated Relationship Manager (Priya Sharma). Use when the user specifies a particular loan they want to apply for (e.g. 'I want to apply for the Home Loan', 'Apply for 15 Lakh personal loan', 'Apply for EV auto loan').",
  inputSchema: z.object({
    loanTypeOrName: z
      .string()
      .describe(
        "Name or category of the loan (e.g. 'Home Loan', 'Personal Loan', 'Auto Loan', 'loan_home_preapproved').",
      ),
    requestedAmount: z
      .number()
      .optional()
      .describe("Requested loan principal in INR / Rupees (e.g. 5000000)."),
    tenureYears: z
      .number()
      .optional()
      .describe("Requested tenure in years (e.g. 5, 10, 20)."),
    notes: z
      .string()
      .optional()
      .describe(
        "Specific purpose or customer note (e.g. 'Property in Bandra', 'EV purchase').",
      ),
  }),
  execute: async ({ loanTypeOrName, requestedAmount, tenureYears, notes }) => {
    const loansCatalog = (await import("@/data/loans-catalog.json")).default;
    const userCreditScore = 795;
    const userMonthlyIncome = 240000;

    const query = loanTypeOrName.toLowerCase();
    const matchedLoan =
      loansCatalog.find(
        (l) =>
          l.id.toLowerCase() === query ||
          l.name.toLowerCase().includes(query) ||
          l.category.toLowerCase().includes(query),
      ) || loansCatalog[0];

    const finalAmount =
      requestedAmount ??
      (matchedLoan.isPreApproved && matchedLoan.preApprovedAmount
        ? matchedLoan.preApprovedAmount
        : matchedLoan.minAmount);
    const finalTenure = tenureYears ?? Math.min(matchedLoan.maxTenureYears, 10);

    const isEligible =
      userCreditScore >= matchedLoan.minCreditScore &&
      userMonthlyIncome >= matchedLoan.minMonthlyIncome &&
      finalAmount <= matchedLoan.maxAmount;

    const r = matchedLoan.interestRate / 100 / 12;
    const n = finalTenure * 12;
    const estimatedEmi =
      r === 0
        ? Math.round(finalAmount / n)
        : Math.round((finalAmount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1));

    const rm = {
      name: "Priya Sharma",
      title: "Senior Wealth Director & Dedicated RM",
      email: "priya.sharma@bankmate.io",
      phone: "+91 22 6123 4567",
      branch: "BKC Flagship Lounge, Mumbai",
    };

    return {
      loan: matchedLoan,
      isEligible,
      eligibilityVerification: {
        cibilScore: userCreditScore,
        requiredScore: matchedLoan.minCreditScore,
        monthlyIncome: userMonthlyIncome,
        requiredIncome: matchedLoan.minMonthlyIncome,
        creditVerdict: isEligible
          ? "PASSED (Prime Tier 795)"
          : "NEEDS HUMAN EXCEPTION",
      },
      requestedAmount: finalAmount,
      tenureYears: finalTenure,
      interestRate: matchedLoan.interestRate,
      estimatedEmi,
      rm,
      notes: notes || "Submitted via BankMate AI Concierge",
      status: "ready_for_submission",
    };
  },
});

function parseStatementDate(dateStr?: string, fallbackDate?: Date): Date {
  if (!dateStr) return fallbackDate || new Date("2026-09-01T00:00:00Z");
  const trimmed = dateStr.trim();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }
  const clean = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const withYear = clean.includes("202") ? clean : `${clean} 2026`;
  const parsedWithYear = new Date(withYear);
  if (!Number.isNaN(parsedWithYear.getTime())) {
    return parsedWithYear;
  }
  return fallbackDate || new Date("2026-09-01T00:00:00Z");
}

// 9. Account Statement Tool
export const accountStatementTool = tool({
  description:
    "Retrieve the user's official bank account statement for a specified date range or time period (e.g. from X date to Y date, last month, September 2026) with full financial summary, credit/debit totals, and options to download as PDF or email as PDF.",
  inputSchema: z.object({
    startDate: z
      .string()
      .optional()
      .describe(
        "Start date of the statement period (e.g. '2026-09-01', '1 Sept 2026', '2026-08-25').",
      ),
    endDate: z
      .string()
      .optional()
      .describe(
        "End date of the statement period (e.g. '2026-09-12', '10 Sept 2026', '2026-09-30').",
      ),
    account: z
      .enum(["checking", "savings", "credit", "all"])
      .optional()
      .default("all")
      .describe(
        "Account to generate statement for (checking, savings, credit, or all).",
      ),
  }),
  execute: async ({ startDate, endDate, account = "all" }) => {
    let allTx = mockTransactions as unknown as Transaction[];
    allTx = [...allTx].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (account && account !== "all") {
      allTx = allTx.filter(
        (tx) => tx.account.toLowerCase() === account.toLowerCase(),
      );
    }

    const minDate = new Date("2026-08-20T00:00:00Z");
    const maxDate = new Date("2026-09-30T23:59:59Z");

    const start = startDate
      ? parseStatementDate(startDate, minDate)
      : new Date("2026-09-01T00:00:00Z");
    const end = endDate
      ? parseStatementDate(endDate, maxDate)
      : new Date("2026-09-15T23:59:59Z");

    end.setHours(23, 59, 59, 999);

    const filtered = allTx.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });

    const totalCredits = filtered
      .filter((tx) => tx.type === "credit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDebits = filtered
      .filter((tx) => tx.type === "debit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netCashflow = totalCredits - totalDebits;
    const baseBalance =
      account === "checking" ? 124680 : account === "savings" ? 484250 : 608930;
    const openingBalance = Math.max(0, baseBalance - netCashflow);
    const closingBalance = openingBalance + netCashflow;

    const startLabel = start.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endLabel = end.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return {
      statementId: `STM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      account,
      accountNumber:
        account === "savings"
          ? "4092 •••• 8842"
          : account === "checking"
            ? "4092 •••• 1928"
            : "4092 •••• 8842 (Primary)",
      accountName: "Deep Yadav",
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      periodLabel: `${startLabel} – ${endLabel}`,
      generatedAt: new Date().toISOString(),
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      netCashflow,
      totalCount: filtered.length,
      transactions: filtered,
    };
  },
});

// ==================== NEW SECTION 1: BANKING DOCUMENT CENTER ====================
export const generateBankingDocumentTool = tool({
  description:
    "Generate and display an official certified banking certificate or document widget (interest certificate, loan statement, balance certificate, account verification letter, tax certificate, TDS Form 16A, provisional interest certificate, no-dues certificate, foreclosure letter, address proof, or account statement). CRITICAL: ONLY invoke this tool when the user EXPLICITLY requests to generate, download, or view a SPECIFIC document. DO NOT invoke when the user asks what documents are available, which documents can be generated, or asks for a list of certificates.",
  inputSchema: z.object({
    documentType: z
      .enum([
        "interest_certificate",
        "loan_statement",
        "balance_certificate",
        "account_verification_letter",
        "tax_certificate",
        "tds_certificate",
        "provisional_interest_certificate",
        "no_dues_certificate",
        "loan_foreclosure_letter",
        "address_proof_letter",
        "account_statement",
      ])
      .describe("The official certificate or document type to generate."),
    accountOrLoan: z
      .string()
      .optional()
      .describe(
        "Target account number, FD number, or loan ID (e.g. 'A/C 4092 1102 8842', 'LN-AUTO-4091').",
      ),
    financialYear: z
      .string()
      .optional()
      .default("FY 2026-27")
      .describe(
        "Financial year or statement period (e.g. 'FY 2026-27', 'FY 2025-26').",
      ),
  }),
  execute: async ({
    documentType,
    accountOrLoan,
    financialYear = "FY 2026-27",
  }) => {
    const docTitles: Record<DocumentType, string> = {
      interest_certificate: "Certificate of Interest Earned & Paid",
      loan_statement: "Official Loan Account Statement & Amortization",
      balance_certificate: "Certified Balance Certificate",
      account_verification_letter: "Bank Account Verification Letter",
      tax_certificate: "Annual Tax Information & Investment Statement",
      tds_certificate: "Form 16A TDS Certificate (Section 194A)",
      provisional_interest_certificate: "Provisional Interest Certificate",
      no_dues_certificate: "No-Dues Certificate (NOC)",
      loan_foreclosure_letter: "Loan Foreclosure & Full Payoff Letter",
      address_proof_letter: "Bank Letter of Address & KYC Proof",
      account_statement: "Official Multi-Account Banking Statement",
    };

    const docParticulars: Record<
      DocumentType,
      Record<string, string | number>
    > = {
      interest_certificate: {
        "Savings Account Interest (Sec 80TTA)": 14280,
        "Fixed Deposit Interest (FD-994021-A)": 73000,
        "Quarterly Payout Deposit (FD-883190-B)": 35500,
        "Total Interest Accrued": 122780,
        "TDS Deducted @ 10%": 10850,
        "Net Interest Credited": 111930,
      },
      loan_statement: {
        "Loan Facility": "Auto Loan (LN-AUTO-4091)",
        "Original Sanctioned Principal": 800000,
        "Current Outstanding Principal": 385000,
        "Contractual Interest Rate": "8.60% p.a. Reducing",
        "Monthly EMI Installment": 19250,
        "Tenure Remaining": "22 Months",
        "Principal Repaid in Period": 164200,
        "Interest Repaid in Period": 31450,
      },
      balance_certificate: {
        "Premier Privilege Savings A/C (••• 8842)": 485250,
        "Corporate Executive Salary A/C (••• 1928)": 124680,
        "Active Fixed Deposits Balance": 1500000,
        "Total Aggregate Liquid Balance": 2109930,
        "Total Encumbrance / Lien": "NIL (Clear Title)",
      },
      account_verification_letter: {
        "Account Holder Name": "Deep Yadav",
        "CIF Number": "CIF-8829104",
        "Primary Account Number": "4092 1102 8842",
        "Account Type & Tier": "Premier Privilege Savings (Tier 1)",
        "Account Opening Date": "14 August 2018",
        "IFSC Code & MICR": "BKMT0001042 / 400240012",
        "Branch Location": "BKC Flagship Lounge, Mumbai - 400051",
      },
      tax_certificate: {
        "Total Term Deposit Interest": 108500,
        "Savings Interest Exemption Sec 80TTA": 10000,
        "Taxable Interest Income": 112780,
        "Total TDS Deducted (Deposited to NSDL)": 10850,
        "PAN Verification Status": "ABCDE1234F (Verified)",
      },
      tds_certificate: {
        "Deductor TAN Number": "MUMB10928F",
        "Assessment Year": "2027-28",
        "Section Under Which Deducted": "194A (Interest other than securities)",
        "Gross Interest Amount": 108500,
        "Total Tax Deducted (TDS)": 10850,
        "BSR Code & Challan Ref": "0291042 / CH-990214",
      },
      provisional_interest_certificate: {
        "Projected Term Deposit Interest": 122780,
        "Estimated TDS Liability": 12278,
        "Expected Maturity Proceeds (FY)": 1843300,
        "Form 15G/15H Status": "Not Applicable (Taxable Tier)",
      },
      no_dues_certificate: {
        "Closed Loan Facility": "Consumer Durable Loan (LN-CD-9902)",
        "Sanctioned Amount": 150000,
        "Final Settlement Date": "15 June 2026",
        "Outstanding Principal & Interest": "INR 0.00 (NIL)",
        "Collateral / Hypothecation Released": "Full & Final Discharge",
      },
      loan_foreclosure_letter: {
        "Loan Account Number": "LN-AUTO-4091",
        "Principal Outstanding as of Today": 385000,
        "Accrued Interest (Broken Days)": 2840,
        "Foreclosure Penalty (RBI Floating)": "INR 0.00 (Zero)",
        "Final Payoff Settlement Amount": 387840,
        "Quote Validity": "15 Days from Date of Issue",
      },
      address_proof_letter: {
        "Customer Name": "Deep Yadav",
        "Registered Communication Address":
          "Flat 1402, Tower B, Signature Crest, Bandra Kurla Complex (BKC)",
        "City, State & PIN": "Mumbai, Maharashtra - 400051",
        "Address Proof Verification Mode":
          "UIDAI Aadhaar Verified & Utility Cross-Validated",
        "Account Active Since": "August 2018",
      },
      account_statement: {
        "Primary Savings Account":
          "4092 1102 8842 (Available: INR 4,85,250.00)",
        "Corporate Salary Account":
          "4092 5590 1928 (Available: INR 1,24,680.00)",
        "Total Combined Credits": 240000,
        "Total Combined Debits": 78900,
        "Period Net Cashflow": "+INR 1,61,100.00",
      },
    };

    const docRef = `BKMT-DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const doc: BankingDocument = {
      documentId: `doc_${Date.now()}`,
      documentType,
      title: docTitles[documentType] || "Official Bank Document",
      customerName: "Deep Yadav",
      cifNumber: "CIF-8829104",
      accountOrLoanReference: accountOrLoan || "A/C 4092 1102 8842",
      financialYear,
      generatedDate: nowStr,
      status: "Generated",
      fileName: `${documentType}_${docRef}.pdf`,
      documentRefNumber: docRef,
      verificationCode: `BKMT-VER-${Math.floor(100000 + Math.random() * 900000)}`,
      particulars: docParticulars[documentType] || {},
      summaryText: `This is to certify that Mr. Deep Yadav holds authenticated accounts with BankMate BKC Flagship Branch, Mumbai. The particulars stated herein are certified true and extracted from bank books of accounts as of ${nowStr}.`,
      downloadState: "idle",
      emailDeliveryState: "idle",
      targetEmail: "mitulshah3107@gmail.com",
    };

    return {
      document: doc,
      message: `Generated ${doc.title} (${doc.documentRefNumber}) for Deep Yadav. Available for PDF download, print, or email dispatch.`,
    };
  },
});

// ==================== NEW SECTION 2: SERVICE REQUEST MANAGEMENT ====================
export const serviceRequestTool = tool({
  description:
    "Manage customer service requests, tracking, and complaints (e.g. create cheque book request, card block, address change complaint, check SR status, escalate, add customer note, or cancel).",
  inputSchema: z.object({
    action: z
      .enum(["create", "view", "list", "cancel", "add_update", "escalate"])
      .describe("Action to perform on service requests."),
    requestType: z
      .string()
      .optional()
      .describe(
        "Category of service request (e.g. 'New cheque-book request', 'Card block request', 'Failed-transaction complaint').",
      ),
    requestId: z
      .string()
      .optional()
      .describe("Service Request ID (e.g. 'SR-BKMT-2026-4019')."),
    title: z
      .string()
      .optional()
      .describe("Short descriptive title of the request."),
    description: z
      .string()
      .optional()
      .describe("Full details or issue description."),
    updateMessage: z
      .string()
      .optional()
      .describe("Message or follow-up note to append to the ticket."),
    reason: z
      .string()
      .optional()
      .describe("Reason for cancellation or escalation."),
  }),
  execute: async ({
    action,
    requestType,
    requestId,
    title,
    description,
    updateMessage,
    reason,
  }) => {
    const defaultRequests = initialServiceRequests;

    if (action === "list") {
      return {
        action: "list",
        totalCount: defaultRequests.length,
        requests: defaultRequests,
      };
    }

    if (
      action === "view" ||
      (action === "cancel" && requestId) ||
      (action === "escalate" && requestId)
    ) {
      const target =
        defaultRequests.find(
          (r) => r.requestId.toLowerCase() === (requestId || "").toLowerCase(),
        ) || defaultRequests[0];
      return {
        action,
        serviceRequest: target,
      };
    }

    // Create request
    const genId = `SR-BKMT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const sla = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const newReq: ServiceRequest = {
      requestId: genId,
      requestType:
        (requestType as ServiceRequestType) || "General banking complaint",
      title: title || `Request for ${requestType || "Banking Support"}`,
      description:
        description || "Customer raised request via BankMate AI Concierge.",
      department: "Customer Service Operations",
      priority: requestType?.includes("Card") ? "High" : "Medium",
      status: "Submitted",
      createdDate: now.toISOString(),
      lastUpdatedDate: now.toISOString(),
      slaDeadline: sla.toISOString(),
      assignedTeam: "Central Operations Desk",
      assignedEmployee: {
        name: "Priya Sharma",
        role: "Senior Wealth Director & Dedicated RM",
        email: "priya.sharma@bankmate.io",
      },
      referenceNumber: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      cancellationReason: reason,
      customerUpdates: [
        {
          timestamp: now.toISOString(),
          message:
            updateMessage ||
            `Service request ${genId} registered successfully. Assigned to RM Priya Sharma.`,
          author: updateMessage ? "Deep Yadav" : "System Bot",
          isCustomerVisible: true,
        },
      ],
      isEscalated: false,
    };

    return {
      action: "create",
      serviceRequest: newReq,
      message: `Created service request ${genId}. Assigned to operations desk with 3-day SLA.`,
    };
  },
});

// ==================== NEW SECTION 3: CUSTOMER INFORMATION UPDATES ====================
export const customerProfileUpdateTool = tool({
  description:
    "Review or update customer information (phone number, email address, communication address, nominee, communication preferences, PAN/Aadhaar verification, or Re-KYC status). Shows current value, validates new value, and prepares transaction PIN confirmation card.",
  inputSchema: z.object({
    action: z
      .enum([
        "update_address",
        "update_phone",
        "update_email",
        "update_preferences",
        "update_nominee",
        "verify_pan",
        "verify_aadhaar",
        "start_rekyc",
        "view_info",
      ])
      .describe("Specific customer information update workflow."),
    fieldName: z
      .string()
      .optional()
      .describe("User-friendly name of the field."),
    newValue: z
      .string()
      .optional()
      .describe("The new value requested by the user."),
  }),
  execute: async ({ action, fieldName, newValue }) => {
    const currentValues: Record<
      string,
      { current: string; label: string; reqService: boolean }
    > = {
      update_address: {
        current:
          "Flat 1402, Tower B, Signature Crest, Bandra Kurla Complex (BKC), Mumbai - 400051",
        label: "Communication Address",
        reqService: true,
      },
      update_phone: {
        current: "+91 98765 43210",
        label: "Registered Mobile Number",
        reqService: true,
      },
      update_email: {
        current: "mitulshah3107@gmail.com",
        label: "Registered Email Address",
        reqService: true,
      },
      update_nominee: {
        current: "Sunita Yadav (Mother, 100% Share)",
        label: "Account Nominee Details",
        reqService: false,
      },
      verify_pan: {
        current: "ABCDE1234F (Verified with NSDL / ITD)",
        label: "PAN Card Verification",
        reqService: false,
      },
      verify_aadhaar: {
        current: "•••• •••• 8921 (UIDAI Biometric Linked)",
        label: "Aadhaar Card Linkage",
        reqService: false,
      },
      start_rekyc: {
        current: "Full KYC Verified (Next Due: August 2028)",
        label: "Periodic Re-KYC Compliance",
        reqService: true,
      },
      view_info: {
        current: "Premier Wealth Privilege Profile",
        label: "Customer Profile Overview",
        reqService: false,
      },
    };

    const info = currentValues[action] || currentValues.view_info;

    return {
      action,
      fieldName: fieldName || info.label,
      currentValue: info.current,
      requestedValue: newValue || "",
      requiresServiceRequest: info.reqService,
      status: "pending_confirmation",
    };
  },
});

// ==================== NEW SECTION 4: PAYMENTS & TRANSFERS ====================
export const paymentTransferTool = tool({
  description:
    "Comprehensive banking payments hub: UPI, IMPS, NEFT, RTGS transfers, international wire simulation, utility bill payments (electricity, gas, water, broadband), mobile recharge, credit card bill payments, and beneficiary management.",
  inputSchema: z.object({
    action: z
      .enum([
        "transfer",
        "schedule",
        "recurring",
        "pay_bill",
        "recharge",
        "pay_credit_card",
        "manage_beneficiary",
        "international_wire",
        "track_payment",
        "cancel_payment",
        "retry_payment",
      ])
      .describe("Payment action to invoke."),
    amount: z
      .number()
      .optional()
      .default(1000)
      .describe("Amount in INR or foreign currency."),
    recipientName: z
      .string()
      .optional()
      .describe("Recipient, biller, or beneficiary name."),
    recipientAccount: z
      .string()
      .optional()
      .describe("Account number, IFSC, UPI ID, or consumer number."),
    transferType: z
      .enum(["UPI", "IMPS", "NEFT", "RTGS", "INTERNATIONAL"])
      .optional()
      .default("UPI")
      .describe("Payment channel / rail."),
    note: z
      .string()
      .optional()
      .default("Payment Transfer")
      .describe("Payment note or description."),
    targetCurrency: z
      .enum(["USD", "EUR", "GBP", "AED", "SGD"])
      .optional()
      .default("USD")
      .describe("Foreign currency for international remittances."),
    billerName: z
      .string()
      .optional()
      .describe("Utility biller name (e.g. 'Tata Power', 'Tata Play')."),
    phoneNumber: z.string().optional().describe("Mobile recharge number."),
    operator: z
      .enum(["Jio", "Airtel", "Vi"])
      .optional()
      .describe("Mobile telecom operator."),
  }),
  execute: async ({
    action,
    amount = 1000,
    recipientName = "Rohit Verma",
    recipientAccount = "•••• 4092",
    transferType = "UPI",
    note = "Fund Transfer",
    targetCurrency = "USD",
    billerName,
    phoneNumber,
    operator = "Jio",
  }) => {
    if (action === "manage_beneficiary") {
      return {
        action: "manage_beneficiary",
        beneficiaries: initialBeneficiaries,
      };
    }

    if (action === "pay_bill") {
      const targetBill =
        initialBills.find((b) =>
          b.billerName.toLowerCase().includes((billerName || "").toLowerCase()),
        ) || initialBills[0];
      return {
        action: "pay_bill",
        billDetails: targetBill,
        amount: targetBill.billAmount,
        recipientName: targetBill.billerName,
        recipientAccount: targetBill.consumerNumber,
        transferType: "BBPS",
        note: `Bill Payment - ${targetBill.billerName}`,
      };
    }

    if (action === "recharge") {
      return {
        action: "recharge",
        rechargeDetails: {
          phoneNumber: phoneNumber || "+91 98765 43210",
          operator,
          amount,
          validity: "28 Days",
          data: "2 GB/day",
        },
        amount,
        recipientName: `Mobile Recharge (${operator})`,
        recipientAccount: phoneNumber || "+91 98765 43210",
        transferType: "UPI",
      };
    }

    if (action === "international_wire" || transferType === "INTERNATIONAL") {
      const fx = calculateFxTransfer(amount, targetCurrency);
      return {
        action: "international_wire",
        amount,
        recipientName,
        recipientAccount,
        transferType: "INTERNATIONAL",
        note,
        internationalDetails: {
          foreignCurrency: fx.targetCurrency,
          foreignAmount: fx.foreignAmount,
          exchangeRate: fx.exchangeRate,
          currencySymbol: fx.currencySymbol,
          totalInrPayable: fx.totalInrPayable,
          complianceStatus: "Under Human Review",
          estimatedDelivery: fx.estimatedDeliveryDays,
          purpose: note || "Family Maintenance & Living Expenses",
        },
      };
    }

    // Default transfer
    return {
      action: "transfer",
      amount,
      recipientName,
      recipientAccount,
      transferType,
      note,
    };
  },
});

// ==================== NEW SECTION 5: CARD MANAGEMENT ====================
export const cardManagementTool = tool({
  description:
    "Manage debit & credit cards: view card details and limits, temporarily block or unblock card, report lost card for replacement, adjust ATM & POS limits, toggle contactless or international usage, view reward points, redeem reward points to cash, or dispute a card transaction.",
  inputSchema: z.object({
    cardId: z
      .enum(["card_credit_01", "card_debit_01"])
      .optional()
      .default("card_credit_01")
      .describe("Card identifier (credit card or debit card)."),
    action: z
      .enum([
        "view_details",
        "toggle_controls",
        "set_limits",
        "block_card",
        "report_lost",
        "change_pin",
        "redeem_rewards",
        "pay_bill",
        "limit_increase",
        "dispute_transaction",
      ])
      .default("view_details")
      .describe("Specific card management action."),
    toggleField: z
      .enum([
        "contactlessEnabled",
        "internationalEnabled",
        "onlineEcommerceEnabled",
        "isBlockedTemporarily",
      ])
      .optional(),
    toggleValue: z.boolean().optional(),
    atmLimit: z.number().optional(),
    posLimit: z.number().optional(),
    rewardPoints: z.number().optional().default(5000),
    disputeTxId: z.string().optional(),
    disputeReason: z.string().optional(),
    disputeAmount: z.number().optional(),
  }),
  execute: async ({
    cardId = "card_credit_01",
    action = "view_details",
    toggleField,
    toggleValue,
    atmLimit,
    posLimit,
    rewardPoints,
    disputeTxId,
    disputeReason,
    disputeAmount,
  }) => {
    return {
      cardId,
      action,
      toggleField,
      toggleValue,
      atmLimit,
      posLimit,
      rewardPoints,
      disputeTxId,
      disputeReason,
      disputeAmount,
    };
  },
});

// ==================== NEW SECTION 6: LOAN SERVICING ====================
export const loanServicingTool = tool({
  description:
    "Comprehensive retail loan servicing: track loan application status, mock upload income/property/identity documents, view EMI schedule and amortization breakdown, calculate loan foreclosure payoff quote, simulate part-prepayment tenure/EMI reduction, or schedule a video call with RM Priya Sharma.",
  inputSchema: z.object({
    action: z
      .enum([
        "track_status",
        "upload_document",
        "schedule_rm",
        "foreclosure_quote",
        "part_prepayment",
        "emi_schedule",
        "top_up",
        "compare_refinance",
      ])
      .default("track_status")
      .describe("Loan servicing operation."),
    loanAccount: z
      .string()
      .optional()
      .default("LN-AUTO-4091")
      .describe("Loan account number."),
    prepaymentAmount: z
      .number()
      .optional()
      .default(100000)
      .describe("Lump-sum part prepayment amount in INR."),
    documentType: z
      .enum([
        "Income Proof",
        "Identity Proof",
        "Property Deed",
        "Bank Statement",
      ])
      .optional()
      .default("Income Proof"),
  }),
  execute: async ({
    action = "track_status",
    loanAccount = "LN-AUTO-4091",
    prepaymentAmount = 100000,
    documentType = "Income Proof",
  }) => {
    const tabMap: Record<string, string> = {
      track_status: "applications",
      upload_document: "upload",
      schedule_rm: "rm_call",
      foreclosure_quote: "foreclosure",
      part_prepayment: "prepayment",
      emi_schedule: "emi_schedule",
    };

    return {
      action,
      initialTab: tabMap[action] || "applications",
      loanAccount,
      prepaymentAmount,
      documentType,
    };
  },
});

// ==================== NEW SECTION 7: FIXED DEPOSIT SERVICING ====================
export const fdServicingTool = tool({
  description:
    "Fixed deposit and term deposit servicing: view active deposit portfolio, calculate interest, premature closure estimation with 1% RBI penalty breakdown, set FD maturity reminders, create Recurring Deposits (RD), or renew deposits.",
  inputSchema: z.object({
    action: z
      .enum([
        "portfolio",
        "interest_calculator",
        "renew_fd",
        "premature_close",
        "change_payout",
        "maturity_reminders",
        "create_rd",
        "tax_deducted",
      ])
      .default("portfolio")
      .describe("Deposit servicing action."),
    fdNumber: z
      .string()
      .optional()
      .default("FD-994021-A")
      .describe("FD deposit receipt number."),
    monthlyDeposit: z
      .number()
      .optional()
      .default(25000)
      .describe("Monthly deposit amount for Recurring Deposit (RD)."),
    tenureMonths: z
      .number()
      .optional()
      .default(12)
      .describe("RD tenure in months."),
  }),
  execute: async ({
    action = "portfolio",
    fdNumber = "FD-994021-A",
    monthlyDeposit = 25000,
    tenureMonths = 12,
  }) => {
    const tabMap: Record<string, string> = {
      portfolio: "portfolio",
      interest_calculator: "calculator",
      premature_close: "premature_close",
      renew_fd: "renew",
      maturity_reminders: "reminders",
      create_rd: "rd",
      tax_deducted: "portfolio",
    };

    return {
      action,
      initialTab: tabMap[action] || "portfolio",
      fdNumber,
      monthlyDeposit,
      tenureMonths,
    };
  },
});

// ==================== NEW SECTION 8: PERSONAL FINANCE INTELLIGENCE ====================
export const financeIntelligenceTool = tool({
  description:
    "Personal finance intelligence & predictive analytics: monthly spending analysis, explanations of why spending increased, category budget alerts, recurring subscriptions detection, 6-month cash flow forecast, savings goals progress, or net worth progression.",
  inputSchema: z.object({
    insightType: z
      .enum([
        "spending_summary",
        "budget_status",
        "recurring_subscriptions",
        "cashflow_forecast",
        "savings_goals",
        "net_worth_trend",
        "investment_performance",
        "upcoming_reminders",
      ])
      .default("spending_summary")
      .describe("Financial intelligence insight to display."),
    budgetCategory: z
      .string()
      .optional()
      .describe("Category for budget creation."),
    budgetAmount: z
      .number()
      .optional()
      .describe("Monthly budget amount in INR."),
  }),
  execute: async ({
    insightType = "spending_summary",
    budgetCategory,
    budgetAmount,
  }) => {
    const tabMap: Record<string, string> = {
      spending_summary: "spending",
      budget_status: "budgets",
      recurring_subscriptions: "subscriptions",
      cashflow_forecast: "cashflow",
      savings_goals: "goals",
      net_worth_trend: "networth",
      investment_performance: "networth",
      upcoming_reminders: "subscriptions",
    };

    return {
      insightType,
      initialTab: tabMap[insightType] || "spending",
      budgetCategory,
      budgetAmount,
    };
  },
});

// ==================== CHAT TOOLS REGISTRY ====================
export const chatTools = {
  "transaction-table": transactionTableTool,
  "account-statement": accountStatementTool,
  "loan-calculator": loanCalculatorTool,
  "financial-chart": financialChartTool,
  "bank-profile": bankProfileTool,
  "book-fixed-deposit": bookFixedDepositTool,
  "transfer-funds": transferFundsTool,
  "show-loan-offers": showLoanOffersTool,
  "apply-loan": applyLoanTool,
  // New Tools
  "generate-banking-document": generateBankingDocumentTool,
  "service-request-tool": serviceRequestTool,
  "customer-profile-update": customerProfileUpdateTool,
  "payment-transfer-tool": paymentTransferTool,
  "card-management-tool": cardManagementTool,
  "loan-servicing-tool": loanServicingTool,
  "fd-servicing-tool": fdServicingTool,
  "finance-intelligence-tool": financeIntelligenceTool,
};

export type ChatTools = typeof chatTools;
export type ChatUITools = InferUITools<ChatTools>;
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatUITools>;

export type TransactionTableUITool = InferUITool<typeof transactionTableTool>;
export type AccountStatementUITool = InferUITool<typeof accountStatementTool>;
export type LoanCalculatorUITool = InferUITool<typeof loanCalculatorTool>;
export type FinancialChartUITool = InferUITool<typeof financialChartTool>;
export type BankProfileUITool = InferUITool<typeof bankProfileTool>;
export type BookFixedDepositUITool = InferUITool<typeof bookFixedDepositTool>;
export type TransferFundsUITool = InferUITool<typeof transferFundsTool>;
export type ShowLoanOffersUITool = InferUITool<typeof showLoanOffersTool>;
export type ApplyLoanUITool = InferUITool<typeof applyLoanTool>;
export type GenerateBankingDocumentUITool = InferUITool<
  typeof generateBankingDocumentTool
>;
export type ServiceRequestUITool = InferUITool<typeof serviceRequestTool>;
export type CustomerProfileUpdateUITool = InferUITool<
  typeof customerProfileUpdateTool
>;
export type PaymentTransferUITool = InferUITool<typeof paymentTransferTool>;
export type CardManagementUITool = InferUITool<typeof cardManagementTool>;
export type LoanServicingUITool = InferUITool<typeof loanServicingTool>;
export type FDServicingUITool = InferUITool<typeof fdServicingTool>;
export type FinanceIntelligenceUITool = InferUITool<
  typeof financeIntelligenceTool
>;
