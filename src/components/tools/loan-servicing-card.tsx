"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileTextIcon,
  FileUpIcon,
  LandmarkIcon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { loanServicingTool } from "@/lib/ai/tools";
import {
  formatINR,
  useBankStore,
  validateTransactionPin,
} from "@/lib/bank-store";
import {
  calculateForeclosureQuote,
  calculatePartPrepayment,
} from "@/lib/finance-calculations";

export type LoanServicingCardProps = UIToolInvocation<typeof loanServicingTool>;

export function LoanServicingCard(props: LoanServicingCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const {
    profile,
    loanApplications,
    uploadLoanDocument,
    scheduleRMCall,
    createServiceRequest,
  } = useBankStore();

  const [activeTab, setActiveTab] = useState<
    | "applications"
    | "upload"
    | "rm_call"
    | "foreclosure"
    | "prepayment"
    | "emi_schedule"
  >(
    (output?.initialTab as
      | "applications"
      | "upload"
      | "rm_call"
      | "foreclosure"
      | "prepayment"
      | "emi_schedule") || "applications",
  );

  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] =
    useState<string>("Income Proof");
  const [rmDate, setRmDate] = useState("2026-10-06");
  const [rmSlot, setRmSlot] = useState("11:30 AM");
  const [prepayAmount, setPrepayAmount] = useState<number>(100000);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Accessing Loan Servicing Portal...
            </p>
            <p className="text-xs text-muted-foreground">
              Retrieving loan underwriting schedules, amortization tables, and
              foreclosure quotes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "output-error" || state === "output-denied") {
    return (
      <Card className="w-full max-w-2xl border-destructive/40 bg-destructive/5 shadow-md">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertTriangleIcon className="size-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Loan Service Operation Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Could not load loan details."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeLoan = profile.loans.find(
    (l) => l.outstandingAmount && l.outstandingAmount > 0,
  ) || {
    loanType: "Auto Loan (Luxury Sedan)",
    accountNumber: "LN-AUTO-4091",
    sanctionedAmount: 800000,
    outstandingAmount: 385000,
    interestRate: 8.6,
    monthlyEmi: 19250,
    tenureRemaining: "22 months",
    status: "Regular",
  };

  const foreclosure = calculateForeclosureQuote(
    activeLoan.accountNumber || "LN-AUTO-4091",
    activeLoan.outstandingAmount || 385000,
    activeLoan.interestRate || 8.6,
    true,
  );

  const prepaymentImpact = calculatePartPrepayment(
    activeLoan.outstandingAmount || 385000,
    activeLoan.interestRate || 8.6,
    22,
    prepayAmount,
  );

  const handleMockUpload = (docType: string) => {
    const mockFiles: Record<string, string> = {
      "Income Proof": "Salary_Slips_ITR_Deep_Yadav_FY26.pdf",
      "Identity Proof": "PAN_Aadhaar_Verified_Copy.pdf",
      "Property Deed": "BKC_Signature_Crest_Allotment_Deed.pdf",
      "Bank Statement": "BankMate_6Month_Statement.pdf",
    };
    const fileName =
      mockFiles[docType] || `${docType.replace(/\s+/g, "_")}.pdf`;
    const res = uploadLoanDocument(
      docType as
        | "Income Proof"
        | "Identity Proof"
        | "Property Deed"
        | "Bank Statement",
      fileName,
      "3.1 MB",
    );
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleScheduleRM = () => {
    const res = scheduleRMCall(
      rmDate,
      rmSlot,
      "Loan Refinancing & Top-Up Consultation",
    );
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmForeclosure = () => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default: 123456)");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      createServiceRequest({
        requestType: "Loan servicing request",
        title: `Loan Foreclosure Request: ${activeLoan.loanType} (${activeLoan.accountNumber})`,
        description: `Customer accepted foreclosure quote ${foreclosure.quoteId} for ₹${foreclosure.totalForeclosureAmount.toLocaleString("en-IN")}. Scheduled payoff via Savings A/C.`,
        department: "Lending Operations & Collateral Release",
        priority: "High",
        referenceNumber: foreclosure.quoteId,
      });
      setIsProcessing(false);
      setPin("");
      setFeedback(
        `Foreclosure quote ${foreclosure.quoteId} submitted! RM Priya Sharma will execute payoff.`,
      );
      setTimeout(() => setFeedback(null), 5000);
    }, 800);
  };

  const handleConfirmPrepayment = () => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default PIN: 123456)");
      return;
    }
    const savings =
      profile.accounts.find((a) => a.category === "savings") ||
      profile.accounts[0];
    if (!savings || savings.availableBalance < prepayAmount) {
      setFeedback(
        `Insufficient savings balance for ₹${prepayAmount.toLocaleString("en-IN")} prepayment.`,
      );
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      createServiceRequest({
        requestType: "Loan servicing request",
        title: `Loan Part-Prepayment: ₹${prepayAmount.toLocaleString("en-IN")}`,
        description: `Customer authorized part-prepayment of ₹${prepayAmount.toLocaleString("en-IN")} towards ${activeLoan.loanType} (${activeLoan.accountNumber}). Principal reduced immediately.`,
        department: "Lending Operations & Retail Assets",
        priority: "High",
      });
      setIsProcessing(false);
      setPin("");
      setFeedback(
        `Part-prepayment of ${formatINR(prepayAmount)} authorized! Loan tenure reduced by ${prepaymentImpact.optionA_tenureReduction.monthsSaved} months.`,
      );
      setTimeout(() => setFeedback(null), 5000);
    }, 700);
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <LandmarkIcon className="size-4 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                Loan Servicing & Amortization
              </span>
              <h3 className="text-base font-bold leading-tight">
                {activeLoan.loanType}
              </h3>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/20 text-[11px] font-semibold">
            {activeLoan.accountNumber}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-border px-3 bg-slate-50 dark:bg-muted/30 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "applications"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Applications ({loanApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "upload"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Upload Documents
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("emi_schedule")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "emi_schedule"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          EMI Schedule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prepayment")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "prepayment"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Part-Prepayment
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("foreclosure")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "foreclosure"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Foreclosure Quote
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rm_call")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "rm_call"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Schedule RM Call
        </button>
      </div>

      <CardContent className="p-5 space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab 1: Application Tracking */}
        {activeTab === "applications" && (
          <div className="space-y-3">
            {loanApplications.length === 0 ? (
              <div className="p-6 text-center border rounded-xl bg-slate-50 dark:bg-muted/20">
                <FileTextIcon className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">
                  No recent loan applications
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  You have pre-approved limits available! Ask &quot;Show loan
                  offers&quot; to apply.
                </p>
              </div>
            ) : (
              loanApplications.map((app) => (
                <div
                  key={app.applicationId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground">
                        {app.loanName}
                      </span>
                      <span className="font-mono text-muted-foreground block text-[11px]">
                        Ref: {app.applicationId}
                      </span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-xs font-semibold">
                      {app.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Principal
                      </span>
                      <span className="font-bold">
                        {formatINR(app.requestedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Tenure
                      </span>
                      <span className="font-bold">{app.tenureYears} Years</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Est. EMI
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatINR(app.estimatedEmi)}/mo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                    <span>
                      Assigned to: {app.rmAssigned.name} ({app.rmAssigned.title}
                      )
                    </span>
                    <span>CIBIL: {app.cibilScore} Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Upload Documents */}
        {activeTab === "upload" && (
          <div className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Select a verification document category to simulate instant
              banking document submission.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                "Income Proof",
                "Identity Proof",
                "Property Deed",
                "Bank Statement",
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDocType(type)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedDocType === type
                      ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 font-bold"
                      : "bg-slate-50 dark:bg-muted/20 border-slate-200 dark:border-border"
                  }`}
                >
                  <span>{type}</span>
                  {selectedDocType === type && (
                    <CheckIcon className="size-3.5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 border-2 border-dashed border-blue-400/50 rounded-xl text-center space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
              <UploadCloudIcon className="size-8 text-blue-600 mx-auto" />
              <div>
                <p className="font-bold text-foreground">
                  Upload {selectedDocType}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Secure end-to-end encrypted upload • Supports PDF, JPG, PNG up
                  to 10MB
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleMockUpload(selectedDocType)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs mt-2"
              >
                <FileUpIcon className="size-3.5 mr-1" />
                Upload & Verify File
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: EMI Schedule */}
        {activeTab === "emi_schedule" && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                Active Loan Particulars
              </span>
              <span className="text-muted-foreground">
                Rate: {activeLoan.interestRate}% p.a.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Outstanding Principal
                </span>
                <span className="font-bold text-foreground">
                  {formatINR(activeLoan.outstandingAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Monthly EMI
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatINR(activeLoan.monthlyEmi || 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Tenure Remaining
                </span>
                <span className="font-bold text-foreground">
                  {activeLoan.tenureRemaining}
                </span>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-muted/60 px-3 py-2 font-bold flex justify-between">
                <span>Upcoming Installments</span>
                <span>Principal + Interest</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-border">
                {[
                  {
                    month: "05 Oct 2026",
                    emi: 19250,
                    p: 16490,
                    i: 2760,
                    bal: 368510,
                  },
                  {
                    month: "05 Nov 2026",
                    emi: 19250,
                    p: 16608,
                    i: 2642,
                    bal: 351902,
                  },
                  {
                    month: "05 Dec 2026",
                    emi: 19250,
                    p: 16727,
                    i: 2523,
                    bal: 335175,
                  },
                  {
                    month: "05 Jan 2027",
                    emi: 19250,
                    p: 16847,
                    i: 2403,
                    bal: 318328,
                  },
                ].map((row) => (
                  <div
                    key={row.month}
                    className="p-3 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold block">{row.month}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Bal after EMI: {formatINR(row.bal)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatINR(row.emi)}</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Prin: {formatINR(row.p)} • Int: {formatINR(row.i)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Part-Prepayment */}
        {activeTab === "prepayment" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
              <span className="font-bold text-blue-900 dark:text-blue-100 block">
                Part-Prepayment Simulator (Zero Foreclosure Penalty)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Prepaying lump-sum principal directly reduces remaining tenure
                or monthly EMI.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">
                  Lump-Sum Prepayment Amount
                </span>
                <span className="font-bold text-blue-600">
                  {formatINR(prepayAmount)}
                </span>
              </div>
              <input
                type="range"
                min={25000}
                max={activeLoan.outstandingAmount || 350000}
                step={25000}
                value={prepayAmount}
                onChange={(e) => setPrepayAmount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  Option A: Reduce Tenure
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Same EMI ({formatINR(activeLoan.monthlyEmi || 0)})
                </span>
                <span className="text-base font-bold text-emerald-600 block mt-1">
                  Save {prepaymentImpact.optionA_tenureReduction.monthsSaved}{" "}
                  Months
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Interest Saved: ~
                  {formatINR(
                    prepaymentImpact.optionA_tenureReduction
                      .estimatedInterestSaved,
                  )}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-1">
                <span className="font-bold text-blue-900 dark:text-blue-200 block">
                  Option B: Reduce EMI
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Same Tenure (22 Mos)
                </span>
                <span className="text-base font-bold text-blue-600 block mt-1">
                  New EMI:{" "}
                  {formatINR(
                    prepaymentImpact.optionB_emiReduction.newMonthlyEmi,
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Monthly Savings:{" "}
                  {formatINR(
                    prepaymentImpact.optionB_emiReduction.monthlySavings,
                  )}
                  /mo
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold block text-foreground">
                  Authorize Part-Prepayment via Transaction PIN
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Debit from: Premier Savings (•••• 4821)
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN (123456)"
                  className="h-8 text-xs font-mono tracking-widest bg-background"
                />
                <Button
                  size="sm"
                  onClick={handleConfirmPrepayment}
                  disabled={pin.length < 6 || isProcessing}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 shrink-0"
                >
                  {isProcessing ? (
                    <Spinner className="size-3 mr-1" />
                  ) : (
                    `Prepay ${formatINR(prepayAmount)}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Foreclosure Quote */}
        {activeTab === "foreclosure" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-muted/40 border space-y-2">
              <div className="flex justify-between font-bold border-b pb-2">
                <span>Foreclosure Breakdown ({foreclosure.quoteId})</span>
                <span className="text-emerald-600">
                  Valid until {foreclosure.validUntil}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Principal Outstanding
                </span>
                <span className="font-bold">
                  {formatINR(foreclosure.principalOutstanding)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Accrued Interest (Broken Period)
                </span>
                <span className="font-semibold">
                  {formatINR(foreclosure.accruedInterest)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Prepayment Penalty (RBI 0% Floating)
                </span>
                <span className="font-semibold">₹0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-sm">
                <span>Total Foreclosure Payoff</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatINR(foreclosure.totalForeclosureAmount)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 space-y-2">
              <span className="font-semibold block">
                Confirm Foreclosure via Transaction PIN
              </span>
              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN (123456)"
                  className="h-8 text-xs font-mono tracking-widest"
                />
                <Button
                  size="sm"
                  onClick={handleConfirmForeclosure}
                  disabled={pin.length < 6 || isProcessing}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 shrink-0"
                >
                  {isProcessing ? (
                    <Spinner className="size-3 mr-1" />
                  ) : (
                    "Request Payoff"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Schedule RM Call */}
        {activeTab === "rm_call" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                PS
              </div>
              <div>
                <span className="font-bold text-indigo-950 dark:text-indigo-100 block">
                  Priya Sharma
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Senior Wealth Director & Dedicated RM • BKC Flagship Lounge
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Preferred Date
                </span>
                <Input
                  type="date"
                  value={rmDate}
                  onChange={(e) => setRmDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Time Slot
                </span>
                <select
                  value={rmSlot}
                  onChange={(e) => setRmSlot(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="10:00 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:30 AM">11:30 AM - 12:00 PM</option>
                  <option value="02:30 PM">02:30 PM - 03:00 PM</option>
                  <option value="04:00 PM">04:00 PM - 04:30 PM</option>
                </select>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleScheduleRM}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
            >
              <VideoIcon className="size-3.5 mr-1" />
              Confirm Video Appointment with Priya Sharma
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
