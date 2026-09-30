"use client";

import { useState } from "react";
import type { UIToolInvocation } from "ai";
import {
  Building2Icon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileCheckIcon,
  InfoIcon,
  MailCheckIcon,
  PercentIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserCheckIcon,
} from "lucide-react";
import { formatINR } from "@/lib/bank-store";
import type { showLoanOffersTool, applyLoanTool } from "@/lib/ai/tools";
import { useBankStore, type LoanApplicationRecord } from "@/lib/bank-store";
import { sendTransactionEmail } from "@/lib/transaction-email";

// Custom event to allow widgets in chat to dispatch prompt messages to the chat input
export function dispatchChatPrompt(promptText: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bankmate-send-chat-prompt", {
        detail: { text: promptText },
      }),
    );
  }
}

export type ShowLoanOffersProps = UIToolInvocation<typeof showLoanOffersTool>;

export function LoanOffersCatalog(props: ShowLoanOffersProps) {
  const output = props.output;
  const loans = output?.loans || [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(loans.map((l) => l.category))),
  ];

  const filteredLoans =
    selectedCategory === "all"
      ? loans
      : loans.filter((l) => l.category === selectedCategory);

  return (
    <div className="w-full my-3 space-y-3 not-typeset">
      {/* Header Banner */}
      <div
        className="p-4 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--panel-border)",
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
          style={{ borderColor: "var(--panel-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Building2Icon className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                Available BankMate Loan Products
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  CIBIL 795 Verified
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Showing bank offerings with personalized eligibility &
                pre-approved sanctions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div
              className="px-3 py-1 rounded-lg border text-right"
              style={{
                borderColor: "var(--panel-border)",
                backgroundColor: "var(--toggle-bg)",
              }}
            >
              <span className="text-[10px] text-muted-foreground block">
                Monthly Salary
              </span>
              <span className="text-xs font-bold font-mono text-foreground">
                ₹2,40,000
              </span>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 capitalize shrink-0 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {cat === "all" ? "All Loans" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredLoans.map((loan) => (
          <div
            key={loan.id}
            className="p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--panel-border)",
            }}
          >
            <div>
              {/* Badge & Title */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {loan.category}
                  </span>
                  <h5 className="text-sm font-bold text-foreground">
                    {loan.name}
                  </h5>
                </div>
                {loan.isPreApproved ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    <SparklesIcon className="size-3" />
                    Pre-Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <ShieldCheckIcon className="size-3" />
                    Eligible
                  </span>
                )}
              </div>

              {/* Amount & Rate Highlight */}
              <div
                className="p-2.5 rounded-xl my-2.5 flex items-center justify-between"
                style={{ backgroundColor: "var(--toggle-bg)" }}
              >
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    {loan.isPreApproved
                      ? "Pre-Approved Limit"
                      : "Max Sanction Limit"}
                  </span>
                  <span className="text-base font-bold font-mono text-foreground">
                    {formatINR(
                      loan.isPreApproved && loan.preApprovedAmount
                        ? loan.preApprovedAmount
                        : loan.maxAmount,
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">
                    Interest Rate
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {loan.interestRate}% p.a.
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {loan.description}
              </p>

              {/* Key Features */}
              <ul className="space-y-1 mb-4">
                {loan.features?.slice(0, 2).map((feat: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-[11px] text-foreground/80 flex items-center gap-1.5"
                  >
                    <CheckCircle2Icon className="size-3 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Application CTA */}
            <div
              className="pt-3 border-t flex items-center justify-between gap-2"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <span className="text-[11px] text-muted-foreground">
                Tenure: Up to {loan.maxTenureYears} yrs
              </span>
              <button
                type="button"
                onClick={() => {
                  const prompt = `I would like to apply for the ${loan.name} (Amount: ₹${(loan.isPreApproved && loan.preApprovedAmount ? loan.preApprovedAmount : loan.minAmount).toLocaleString("en-IN")}, Tenure: ${Math.min(loan.maxTenureYears, 10)} years)`;
                  dispatchChatPrompt(prompt);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                Apply Now
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type ApplyLoanProps = UIToolInvocation<typeof applyLoanTool>;

export function ApplyLoanCard(props: ApplyLoanProps) {
  const output = props.output;
  const { submitLoanApplication, loanApplications, profile } = useBankStore();

  const [amount, setAmount] = useState<number>(
    output?.requestedAmount ?? 5000000,
  );
  const [tenureYears, setTenureYears] = useState<number>(
    output?.tenureYears ?? 15,
  );
  const [status, setStatus] = useState<
    "ready" | "submitting" | "submitted" | "error"
  >("ready");
  const [submittedRecord, setSubmittedRecord] =
    useState<LoanApplicationRecord | null>(null);

  const loan = output?.loan;
  const rm = output?.rm || {
    name: "Priya Sharma",
    title: "Senior Wealth Director & Dedicated RM",
    email: "priya.sharma@bankmate.io",
    phone: "+91 22 6123 4567",
    branch: "BKC Flagship Lounge, Mumbai",
  };

  const rate = loan?.interestRate ?? 8.25;

  // Calculate live EMI based on adjustable amount and tenure
  const r = rate / 100 / 12;
  const n = tenureYears * 12;
  const liveEmi =
    r === 0
      ? Math.round(amount / n)
      : Math.round(
          (amount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1),
        );

  const totalRepayment = liveEmi * n;
  const totalInterest = totalRepayment - amount;

  // Check if this application was already submitted in store
  const existingApp = loanApplications.find(
    (app) => app.loanId === loan?.id && app.requestedAmount === amount,
  );

  const handleSubmitApplication = () => {
    if (!loan) return;
    setStatus("submitting");

    setTimeout(() => {
      const res = submitLoanApplication({
        loanId: loan.id,
        loanName: loan.name,
        category: loan.category,
        requestedAmount: amount,
        tenureYears,
        interestRate: rate,
        notes: `Customer requested via BankMate AI Concierge. Human approval routed to RM ${rm.name}.`,
      });

      if (res.success) {
        setSubmittedRecord(res.application);
        setStatus("submitted");

        // Send confirmation email to registered email
        sendTransactionEmail({
          type: "loan-application",
          recipientEmail: profile?.personal?.email,
          data: {
            applicationId: res.application.applicationId,
            loanName: loan.name,
            category: loan.category,
            requestedAmount: amount,
            tenureYears,
            interestRate: rate,
            estimatedEmi: liveEmi,
            rmName: rm.name,
            rmEmail: rm.email,
          },
        });
      } else {
        setStatus("error");
      }
    }, 900);
  };

  return (
    <div className="w-full my-3 not-typeset">
      <div
        className="rounded-2xl border shadow-md overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--panel-border)",
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b"
          style={{ borderColor: "var(--panel-border)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                <FileCheckIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bank Eligibility Verified
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    CIBIL 795: Prime
                  </span>
                </div>
                <h4 className="text-base font-bold text-foreground">
                  {loan?.name || "Bank Loan Application"}
                </h4>
              </div>
            </div>

            {/* Human Approval Tag */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border self-start sm:self-auto bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
              <UserCheckIcon className="size-4 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wide block leading-none">
                  Human Approval Required
                </span>
                <span className="text-[11px] leading-tight">
                  RM: {rm.name.split(" ")[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {status === "submitted" || existingApp ? (
          /* Success Screen */
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 flex items-start gap-3.5">
              <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2Icon className="size-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  Loan Application Raised to Relationship Manager!
                </h5>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Application ID:{" "}
                  <strong className="font-mono">
                    {submittedRecord?.applicationId ||
                      existingApp?.applicationId}
                  </strong>
                  . As per regulatory compliance, bank loans are finalized with
                  human verification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div
                className="p-3 rounded-xl border text-center"
                style={{
                  borderColor: "var(--panel-border)",
                  backgroundColor: "var(--toggle-bg)",
                }}
              >
                <span className="text-[10px] text-muted-foreground block">
                  Sanction Amount
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  {formatINR(
                    submittedRecord?.requestedAmount ||
                      existingApp?.requestedAmount ||
                      amount,
                  )}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{
                  borderColor: "var(--panel-border)",
                  backgroundColor: "var(--toggle-bg)",
                }}
              >
                <span className="text-[10px] text-muted-foreground block">
                  Est. Monthly EMI
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  {formatINR(
                    submittedRecord?.estimatedEmi ||
                      existingApp?.estimatedEmi ||
                      liveEmi,
                  )}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{
                  borderColor: "var(--panel-border)",
                  backgroundColor: "var(--toggle-bg)",
                }}
              >
                <span className="text-[10px] text-muted-foreground block">
                  Interest Rate
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {rate}% p.a.
                </span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{
                  borderColor: "var(--panel-border)",
                  backgroundColor: "var(--toggle-bg)",
                }}
              >
                <span className="text-[10px] text-muted-foreground block">
                  Application Status
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                  Pending RM Review
                </span>
              </div>
            </div>

            {/* Assigned RM Card */}
            <div
              className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{
                borderColor: "var(--panel-border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  PS
                </div>
                <div>
                  <h6 className="text-xs font-bold text-foreground">
                    {rm.name}
                  </h6>
                  <p className="text-[11px] text-muted-foreground">
                    {rm.title} • {rm.branch}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border bg-muted/30">
                  <PhoneCallIcon className="size-3 text-blue-500" />
                  {rm.phone}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Application Customization & Review Form */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Eligibility Verified Box */}
            <div
              className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
              style={{
                borderColor: "var(--panel-border)",
                backgroundColor: "var(--toggle-bg)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-500" />
                <span className="font-medium text-foreground">
                  Bank verification passed: CIBIL Score <strong>795</strong> &
                  Salary <strong>₹2.4L/mo</strong> qualify
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                Eligible
              </span>
            </div>

            {/* Sliders for Amount & Tenure */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Requested Loan Principal
                  </label>
                  <span className="text-sm font-bold font-mono text-primary">
                    {formatINR(amount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={loan?.minAmount || 500000}
                  max={loan?.maxAmount || 10000000}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Min: {formatINR(loan?.minAmount || 500000)}</span>
                  <span>Max: {formatINR(loan?.maxAmount || 10000000)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Repayment Tenure
                  </label>
                  <span className="text-sm font-bold font-mono text-primary">
                    {tenureYears} Years ({tenureYears * 12} Months)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={loan?.maxTenureYears || 30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1 Year</span>
                  <span>Max: {loan?.maxTenureYears || 30} Years</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div
              className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl border text-center"
              style={{
                borderColor: "var(--panel-border)",
                backgroundColor: "var(--toggle-bg)",
              }}
            >
              <div>
                <span className="text-[10px] text-muted-foreground block">
                  Estimated EMI
                </span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {formatINR(liveEmi)}/mo
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">
                  Interest Rate
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {rate}% p.a.
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">
                  Total Interest
                </span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {formatINR(totalInterest)}
                </span>
              </div>
            </div>

            {/* Human RM Routing Notice */}
            <div
              className="p-3 rounded-xl border flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/20"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <InfoIcon className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Loan sanctioning follows bank governance and requires manual
                approval. Submitting this request sends an expedited file to
                your Senior Wealth Director <strong>{rm.name}</strong> for final
                verification and document sign-off.
              </span>
            </div>

            {/* Submission Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">
                Zero processing charges for Premier tier
              </span>
              <button
                type="button"
                disabled={status === "submitting"}
                onClick={handleSubmitApplication}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center gap-2"
              >
                {status === "submitting" ? (
                  <>Verifying & Routing to RM...</>
                ) : (
                  <>
                    <UserCheckIcon className="size-4" />
                    Submit Request to RM {rm.name.split(" ")[0]}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
