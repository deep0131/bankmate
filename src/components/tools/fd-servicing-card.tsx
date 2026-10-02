"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  BellRingIcon,
  CheckCircle2Icon,
  PiggyBankIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { fdServicingTool } from "@/lib/ai/tools";
import {
  formatINR,
  useBankStore,
  validateTransactionPin,
} from "@/lib/bank-store";
import { calculateFDPrematureClosure } from "@/lib/finance-calculations";

export type FDServicingCardProps = UIToolInvocation<typeof fdServicingTool>;

export function FDServicingCard(props: FDServicingCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const {
    profile,
    fdReminders,
    addFDReminder,
    createRecurringDeposit,
    createServiceRequest,
  } = useBankStore();

  const [activeTab, setActiveTab] = useState<
    | "portfolio"
    | "calculator"
    | "premature_close"
    | "renew"
    | "reminders"
    | "rd"
  >(
    (output?.initialTab as
      | "portfolio"
      | "calculator"
      | "premature_close"
      | "renew"
      | "reminders"
      | "rd") || "portfolio",
  );

  const [selectedFdNumber, setSelectedFdNumber] = useState<string>(
    output?.fdNumber || (profile.fixedDeposits[0]?.fdNumber ?? "FD-994021-A"),
  );

  const [feedback, setFeedback] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // RD state
  const [rdMonthly, setRdMonthly] = useState(25000);
  const [rdTenure, setRdTenure] = useState(12);

  // Reminder state
  const [reminderDate, setReminderDate] = useState("2027-10-01");
  const [reminderChannel, setReminderChannel] = useState<
    "Email & SMS" | "SMS Only" | "WhatsApp"
  >("Email & SMS");

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Retrieving Fixed Deposit Portfolio...
            </p>
            <p className="text-xs text-muted-foreground">
              Calculating accrued compounding interest, TDS deductions, and
              maturity dates
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
              FD Service Operation Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Could not retrieve deposit records."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedFd =
    profile.fixedDeposits.find(
      (f) => f.fdNumber.toLowerCase() === selectedFdNumber.toLowerCase(),
    ) || profile.fixedDeposits[0];

  const prematureEstimate = selectedFd
    ? calculateFDPrematureClosure(
        selectedFd.principalAmount,
        selectedFd.interestRate,
        3,
        23,
      )
    : null;

  const handlePrematureClose = () => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default: 123456)");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      createServiceRequest({
        requestType: "FD servicing request",
        title: `Premature Closure Request: ${selectedFd?.fdNumber}`,
        description: `Customer submitted premature closure for ${selectedFd?.fdNumber}. Net payable ~₹${prematureEstimate?.actualPayable.toLocaleString("en-IN")}.`,
        department: "Term Deposits & Treasury",
        priority: "High",
      });
      setIsProcessing(false);
      setPin("");
      setFeedback(
        `Premature closure request registered for ${selectedFd?.fdNumber}. Settlement will credit to Savings.`,
      );
      setTimeout(() => setFeedback(null), 5000);
    }, 800);
  };

  const handleAddReminder = () => {
    const res = addFDReminder(selectedFdNumber, reminderDate, reminderChannel);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateRD = () => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default: 123456)");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const res = createRecurringDeposit(rdMonthly, rdTenure, pin);
      setIsProcessing(false);
      setPin("");
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 5000);
    }, 800);
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <PiggyBankIcon className="size-4 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                Fixed & Recurring Deposits
              </span>
              <h3 className="text-base font-bold leading-tight">
                Deposit Servicing Center
              </h3>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/20 text-[11px] font-semibold">
            {profile.fixedDeposits.length} Active Deposits
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-border px-3 bg-slate-50 dark:bg-muted/30 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("portfolio")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "portfolio"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          FD Portfolio ({profile.fixedDeposits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rd")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "rd"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Recurring Deposit (RD)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("premature_close")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "premature_close"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Premature Closure
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "reminders"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Maturity Reminders
        </button>
      </div>

      <CardContent className="p-5 space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab 1: Portfolio View */}
        {activeTab === "portfolio" && (
          <div className="space-y-3">
            {profile.fixedDeposits.map((fd) => (
              <div
                key={fd.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">
                      {fd.fdNumber}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Booking: {fd.bookingDate} • {fd.payoutType}
                    </span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-xs font-semibold">
                    {fd.interestRate}% p.a.
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Principal Invested
                    </span>
                    <span className="font-bold text-foreground">
                      {formatINR(fd.principalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Maturity Date
                    </span>
                    <span className="font-bold text-foreground">
                      {fd.maturityDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Maturity Amount
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatINR(fd.maturityAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Recurring Deposit (RD) */}
        {activeTab === "rd" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
              <span className="font-bold text-blue-900 dark:text-blue-100 block">
                Open a High-Yield Recurring Deposit (7.15% p.a.)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automate systematic monthly savings from your Premier Savings
                A/C.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Monthly Installment (₹)
                </span>
                <Input
                  type="number"
                  step={5000}
                  value={rdMonthly}
                  onChange={(e) => setRdMonthly(Number(e.target.value))}
                  className="h-8 text-xs font-bold mt-1 text-foreground"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Tenure (Months)
                </span>
                <select
                  value={rdTenure}
                  onChange={(e) => setRdTenure(Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs mt-1 text-foreground"
                >
                  <option value={6}>6 Months (6.80% p.a.)</option>
                  <option value={12}>12 Months (7.15% p.a.)</option>
                  <option value={24}>24 Months (7.25% p.a.)</option>
                  <option value={36}>36 Months (7.10% p.a.)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-muted/40 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Principal Invested
                </span>
                <span className="font-bold">
                  {formatINR(rdMonthly * rdTenure)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>Estimated Maturity Value</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatINR(
                    rdMonthly * rdTenure +
                      Math.round(
                        rdMonthly *
                          ((rdTenure * (rdTenure + 1)) / 2) *
                          (7.15 / 1200),
                      ),
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 space-y-2">
              <span className="font-semibold block">
                Enter 6-digit PIN to Book RD
              </span>
              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="PIN: 123456"
                  className="h-8 text-xs font-mono tracking-widest"
                />
                <Button
                  size="sm"
                  onClick={handleCreateRD}
                  disabled={pin.length < 6 || isProcessing}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 shrink-0"
                >
                  {isProcessing ? (
                    <Spinner className="size-3 mr-1" />
                  ) : (
                    "Book Recurring Deposit"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Premature Closure Simulator */}
        {activeTab === "premature_close" && selectedFd && prematureEstimate && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Select Deposit to Close Prematurely
                <select
                  value={selectedFdNumber}
                  onChange={(e) => setSelectedFdNumber(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs mt-1 text-foreground"
                >
                  {profile.fixedDeposits.map((f) => (
                    <option key={f.id} value={f.fdNumber}>
                      {f.fdNumber} ({formatINR(f.principalAmount)} @{" "}
                      {f.interestRate}%)
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
              <div className="flex justify-between font-bold border-b pb-2">
                <span>Premature Withdrawal Estimate</span>
                <span className="text-destructive font-semibold">
                  1% Penalty Applicable
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Original Principal
                </span>
                <span className="font-bold">
                  {formatINR(selectedFd.principalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Penalized Interest Rate
                </span>
                <span className="font-semibold text-foreground">
                  {prematureEstimate.penalizedRate}% p.a. (contractual{" "}
                  {selectedFd.interestRate}% - 1%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Accrued Interest Payable
                </span>
                <span className="font-semibold text-emerald-600">
                  +{formatINR(prematureEstimate.interestEarned)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-sm">
                <span>Net Payable to Savings A/C</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatINR(prematureEstimate.actualPayable)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border space-y-2">
              <span className="font-semibold block">
                Confirm Premature Closure via PIN
              </span>
              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="PIN: 123456"
                  className="h-8 text-xs font-mono tracking-widest"
                />
                <Button
                  size="sm"
                  onClick={handlePrematureClose}
                  disabled={pin.length < 6 || isProcessing}
                  className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-white font-semibold px-4 shrink-0"
                >
                  {isProcessing ? (
                    <Spinner className="size-3 mr-1" />
                  ) : (
                    "Confirm Close FD"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Maturity Reminders */}
        {activeTab === "reminders" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border space-y-3">
              <span className="font-bold block">
                Schedule Maturity Notification
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Reminder Date
                  </span>
                  <Input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="h-8 text-xs mt-1 text-foreground"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Notification Channel
                  </span>
                  <select
                    value={reminderChannel}
                    onChange={(e) =>
                      setReminderChannel(
                        e.target.value as
                          | "Email & SMS"
                          | "WhatsApp"
                          | "SMS Only",
                      )
                    }
                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs mt-1 text-foreground"
                  >
                    <option value="Email & SMS">Email & SMS</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS Only">SMS Only</option>
                  </select>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleAddReminder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <BellRingIcon className="size-3.5 mr-1" />
                Schedule Maturity Reminder
              </Button>
            </div>

            {fdReminders.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold block">
                  Active Reminders ({fdReminders.length})
                </span>
                <div className="divide-y divide-slate-100 dark:divide-border border rounded-xl overflow-hidden">
                  {fdReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold block">{rem.fdNumber}</span>
                        <span className="text-muted-foreground text-[11px]">
                          Trigger on {rem.reminderDate} via{" "}
                          {rem.notificationChannel}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
