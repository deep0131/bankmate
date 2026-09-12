"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Building2Icon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LandmarkIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  PiggyBankIcon,
  QrCodeIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserCheckIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { useBankStore, formatINR } from "@/lib/bank-store";

export type TabType =
  | "accounts"
  | "cards"
  | "investments"
  | "transactions"
  | "kyc"
  | "security";

export interface BankProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

export function BankProfileModal({
  isOpen,
  onClose,
  initialTab = "accounts",
}: BankProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [txFilter, setTxFilter] = useState<"all" | "savings" | "credit" | "debit">("all");
  const { profile, transactions, resetToDefault } = useBankStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-profile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden not-typeset"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--panel-border)",
          color: "var(--foreground)",
        }}
      >
        {/* Modal Header */}
        <div
          className="relative px-6 py-5 border-b shrink-0 flex items-center justify-between"
          style={{
            borderColor: "var(--panel-border)",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(79,70,229,0.03) 100%)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="size-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
              }}
            >
              {profile.personal.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 m-0 p-0">
                <h2 id="bank-profile-title" className="text-xl font-bold tracking-tight text-foreground m-0 p-0 leading-none">
                  {profile.personal.fullName}
                </h2>
                <div className="inline-flex items-center gap-1.5 m-0 p-0">
                  <span className="inline-flex items-center gap-1 h-5.5 px-2.5 rounded-full text-[11px] font-medium leading-none bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <ShieldCheckIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{profile.personal.kycStatus}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 h-5.5 px-2.5 rounded-full text-[11px] font-medium leading-none bg-blue-500/15 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    <SparklesIcon className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>{profile.personal.tier}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1">
                  CIF: <strong className="font-mono text-foreground">{profile.personal.cifNumber}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.personal.cifNumber, "cif")}
                    className="hover:text-foreground transition-colors"
                    title="Copy CIF"
                  >
                    <CopyIcon className="size-3" />
                  </button>
                </span>
                <span>•</span>
                <span>{profile.personal.email}</span>
                <span>•</span>
                <span>{profile.personal.phone}</span>
                {copiedField === "cif" && (
                  <span className="text-emerald-500 font-medium text-[11px]">Copied!</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
            aria-label="Close profile"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Quick Net Worth Strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 border-b text-xs shrink-0"
          style={{
            borderColor: "var(--panel-border)",
            backgroundColor: "var(--toggle-bg)",
          }}
        >
          <div className="min-w-0">
            <span className="text-[11px] truncate block" style={{ color: "var(--muted-foreground)" }}>Total Net Worth</span>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap tabular-nums">
              {formatINR(profile.wealth.totalNetWorth)}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] truncate block" style={{ color: "var(--muted-foreground)" }}>Liquid Balances</span>
            <p className="text-sm font-semibold font-mono whitespace-nowrap tabular-nums">
              {formatINR(profile.wealth.liquidCash)}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] truncate block" style={{ color: "var(--muted-foreground)" }}>Fixed Deposits</span>
            <p className="text-sm font-semibold font-mono whitespace-nowrap tabular-nums">
              {formatINR(profile.wealth.fixedIncome)}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] truncate block" style={{ color: "var(--muted-foreground)" }}>CIBIL Score</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap tabular-nums">
              {profile.wealth.creditScore.score} ({profile.wealth.creditScore.rating})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex items-center gap-2 px-6 border-b shrink-0 overflow-x-auto"
          style={{ borderColor: "var(--panel-border)" }}
        >
          {[
            { id: "accounts", label: "Accounts & FDs", icon: LandmarkIcon },
            { id: "transactions", label: "Recent Transactions", icon: ReceiptIcon },
            { id: "cards", label: "Cards & Limits", icon: CreditCardIcon },
            { id: "investments", label: "Wealth & Loans", icon: TrendingUpIcon },
            { id: "kyc", label: "KYC & Details", icon: UserCheckIcon },
            { id: "security", label: "Security & Nominee", icon: LockIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                borderColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                color: activeTab === tab.id ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab 1: Accounts & Fixed Deposits */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Primary Deposit Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 rounded-xl border relative overflow-hidden transition-all hover:shadow-md"
                      style={{
                        borderColor: "var(--panel-border)",
                        backgroundColor: "var(--card)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {acc.accountType}
                          </span>
                          <h4 className="text-sm font-semibold mt-1.5">{acc.branch}</h4>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-500"></span>
                          {acc.status}
                        </span>
                      </div>

                      <div className="my-3">
                        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Available Balance</span>
                        <p className="text-2xl font-bold font-mono text-foreground">
                          {formatINR(acc.availableBalance)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t font-mono" style={{ borderColor: "var(--panel-border)", color: "var(--muted-foreground)" }}>
                        <div>
                          <span>A/C:</span>{" "}
                          <strong className="text-foreground">{acc.accountNumber}</strong>
                        </div>
                        <div>
                          <span>IFSC:</span>{" "}
                          <strong className="text-foreground">{acc.ifsc}</strong>
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <span>UPI: <strong className="text-foreground">{acc.upiId}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.accountNumber, acc.id)}
                            className="text-primary hover:underline text-[10px] flex items-center gap-1 font-sans"
                          >
                            <CopyIcon className="size-2.5" />
                            {copiedField === acc.id ? "Copied" : "Copy A/C"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Active Fixed Deposits ({profile.fixedDeposits.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.fixedDeposits.map((fd) => (
                    <div
                      key={fd.id}
                      className="p-4 rounded-xl border flex flex-col justify-between"
                      style={{
                        borderColor: "var(--panel-border)",
                        backgroundColor: "var(--toggle-bg)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">{fd.fdNumber}</span>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          {fd.interestRate}% p.a.
                        </span>
                      </div>
                      <div className="my-2">
                        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Principal Amount</span>
                        <p className="text-lg font-bold font-mono text-foreground">
                          {formatINR(fd.principalAmount)}
                        </p>
                      </div>
                      <div className="text-[11px] space-y-1 pt-2 border-t" style={{ borderColor: "var(--panel-border)", color: "var(--muted-foreground)" }}>
                        <div className="flex justify-between">
                          <span>Maturity Value:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatINR(fd.maturityAmount)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Tenure & Payout:</span>
                          <span className="text-foreground">{fd.tenure} • {fd.payoutType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maturity Date:</span>
                          <span className="text-foreground">{fd.maturityDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cards & Limits */}
          {activeTab === "cards" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credit Card Graphic */}
                <div
                  className="p-5 rounded-2xl text-white shadow-xl flex flex-col justify-between aspect-[1.6/1]"
                  style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #2563EB 100%)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-75">BankMate Reserve</p>
                      <h4 className="text-sm font-bold">Deep Yadav</h4>
                    </div>
                    <span className="text-xs font-bold italic tracking-wider">VISA Infinite</span>
                  </div>

                  <div className="my-4 flex items-center justify-between">
                    <div className="size-8 rounded-md bg-amber-400/80 border border-amber-300"></div>
                    <span className="font-mono tracking-widest text-base sm:text-lg">
                      {profile.cards[0].cardNumberMasked}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-80 pt-2 border-t border-white/10">
                    <div>
                      <span>EXPIRES:</span> <span className="font-mono">{profile.cards[0].expiry}</span>
                    </div>
                    <div>
                      <span>POINTS:</span> <span className="font-mono font-bold text-amber-300">{profile.cards[0].rewardPoints?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Credit Card Limits & Stats */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between"
                  style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                >
                  <div>
                    <h4 className="text-sm font-bold mb-1">Credit Limit Breakdown</h4>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Payment Due: <strong className="text-foreground">{profile.cards[0].paymentDueDate}</strong>
                    </p>
                  </div>

                  <div className="space-y-2 my-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span style={{ color: "var(--muted-foreground)" }}>Available Limit:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(profile.cards[0].availableLimit || 0)}</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${(((profile.cards[0].availableLimit || 0) / (profile.cards[0].totalLimit || 1)) * 100).toFixed(0)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Used: {formatINR(profile.cards[0].outstandingDue || 0)}</span>
                      <span>Total: {formatINR(profile.cards[0].totalLimit || 0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t text-xs" style={{ borderColor: "var(--panel-border)" }}>
                    <span className="size-2 rounded-full bg-emerald-500"></span>
                    <span>Tap to Pay & International Usage Active</span>
                  </div>
                </div>
              </div>

              {/* Debit Card info */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <CreditCardIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{profile.cards[1].cardName}</h4>
                    <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                      {profile.cards[1].cardNumberMasked} • {profile.cards[1].network}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-medium text-foreground">ATM Limit: {formatINR(profile.cards[1].dailyAtm || 0)}/day</p>
                  <p style={{ color: "var(--muted-foreground)" }}>POS/E-Com: {formatINR(profile.cards[1].dailyPos || 0)}/day</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Wealth & Loans */}
          {activeTab === "investments" && (
            <div className="space-y-6">
              {/* Mutual Funds Portfolio */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    Mutual Funds & Equity Holdings ({formatINR(profile.wealth.investments)})
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    +18.4% Overall Gain
                  </span>
                </div>
                <div className="space-y-2.5">
                  {profile.wealth.mutualFunds.map((fund) => (
                    <div
                      key={fund.scheme}
                      className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{fund.scheme}</p>
                        <p style={{ color: "var(--muted-foreground)" }}>Invested: {formatINR(fund.invested)}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-foreground">{formatINR(fund.currentValue)}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">+{fund.returnPercent}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loans */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Loan Accounts & Pre-Approved Offers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.loans.map((loan) => (
                    <div
                      key={loan.loanType}
                      className="p-4 rounded-xl border"
                      style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{loan.loanType}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-xl font-bold font-mono text-foreground mb-2">
                        {formatINR(loan.offerAmount || loan.outstandingAmount || 0)}
                      </p>
                      <div className="text-[11px] space-y-1" style={{ color: "var(--muted-foreground)" }}>
                        <div className="flex justify-between">
                          <span>Interest Rate:</span>
                          <strong className="text-foreground">{loan.interestRate}% p.a.</strong>
                        </div>
                        {loan.monthlyEmi && (
                          <div className="flex justify-between">
                            <span>Monthly EMI:</span>
                            <strong className="text-foreground font-mono">{formatINR(loan.monthlyEmi)}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Tenure:</span>
                          <span className="text-foreground">{loan.tenure || loan.tenureRemaining}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: KYC & Details */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identity & Verification</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">PAN Number:</span>
                      <strong className="font-mono">{profile.personal.panNumber} (Verified)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">Aadhaar:</span>
                      <strong className="font-mono">{profile.personal.aadhaarNumber} (e-KYC)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">KYC Level:</span>
                      <span className="font-semibold text-emerald-600">Full KYC (Tier 3)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Re-KYC Due:</span>
                      <span>{profile.personal.reKycDue}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address on File</h4>
                  <p className="text-xs leading-relaxed">
                    {profile.personal.communicationAddress.line1},<br />
                    {profile.personal.communicationAddress.line2},<br />
                    {profile.personal.communicationAddress.city}, {profile.personal.communicationAddress.state} - {profile.personal.communicationAddress.postalCode},<br />
                    {profile.personal.communicationAddress.country}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-2 border-t" style={{ borderColor: "var(--panel-border)" }}>
                    Verified via Government Address Proof (DigiLocker)
                  </p>
                </div>
              </div>

              {/* Relationship Manager Contact */}
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    PS
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                      Dedicated Relationship Manager
                    </span>
                    <h4 className="text-sm font-bold">{profile.personal.relationshipManager.name}</h4>
                    <p className="text-xs text-muted-foreground">{profile.personal.relationshipManager.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${profile.personal.relationshipManager.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-card transition-colors"
                    style={{ borderColor: "var(--panel-border)" }}
                  >
                    <PhoneIcon className="size-3" />
                    Call Desk
                  </a>
                  <a
                    href={`mailto:${profile.personal.relationshipManager.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <MailIcon className="size-3" />
                    Email RM
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Security & Nominee */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Controls</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span>2-Factor Authentication:</span>
                      <strong className="text-emerald-600">Active (Biometric)</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span>Trusted Device:</span>
                      <span>{profile.security.primaryDevice}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span>Daily Transfer Limit:</span>
                      <strong className="font-mono">{formatINR(profile.security.dailyTransferLimit)}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>International Banking:</span>
                      <span className="text-emerald-600 font-semibold">Enabled</span>
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--card)" }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Nominee</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">Nominee Name:</span>
                      <strong className="text-foreground">{profile.security.nominee.name}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">Relationship:</span>
                      <span>{profile.security.nominee.relation}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--panel-border)" }}>
                      <span className="text-muted-foreground">Entitlement Share:</span>
                      <strong className="font-mono">{profile.security.nominee.sharePercentage}%</strong>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground">Verification:</span>
                      <span className="text-emerald-600 font-semibold">{profile.security.nominee.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Recent Transactions */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              <div
                className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
                style={{ borderColor: "var(--panel-border)" }}
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Live Transaction Statements & Ledger
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time transaction log synced with all savings, credit, and investment accounts
                  </p>
                </div>

                <div
                  className="flex items-center gap-1.5 p-1 rounded-lg border text-xs"
                  style={{
                    borderColor: "var(--panel-border)",
                    backgroundColor: "var(--toggle-bg)",
                  }}
                >
                  {(["all", "savings", "credit", "debit"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTxFilter(filter)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${txFilter === filter
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl border overflow-hidden"
                style={{
                  borderColor: "var(--panel-border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
                  {transactions
                    .filter((tx) => {
                      if (txFilter === "all") return true;
                      if (txFilter === "savings") return tx.account === "savings";
                      if (txFilter === "credit") return tx.type === "credit";
                      if (txFilter === "debit") return tx.type === "debit";
                      return true;
                    })
                    .map((tx) => {
                      const isCredit = tx.type === "credit";
                      const dateObj = new Date(tx.date);
                      const formattedDate = !Number.isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : tx.date;

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeftIcon className="size-4" />
                              ) : (
                                <ArrowUpRightIcon className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span className="capitalize">{tx.category}</span>
                                <span>•</span>
                                <span className="font-mono uppercase">{tx.account}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3">
                            <span
                              className={`font-mono font-bold text-xs whitespace-nowrap tabular-nums block ${isCredit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground"
                                }`}
                            >
                              {isCredit ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                            </span>
                            <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground capitalize mt-0.5">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3.5 border-t shrink-0 flex items-center justify-between text-xs"
          style={{
            borderColor: "var(--panel-border)",
            backgroundColor: "var(--toggle-bg)",
            color: "var(--muted-foreground)",
          }}
        >
          <span>BankMate Net Banking • Regulated by RBI</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
