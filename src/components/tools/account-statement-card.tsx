"use client";

import { useEffect, useRef, useState } from "react";
import type { UIToolInvocation } from "ai";
import { cn } from "cn";
import {
  AlertTriangleIcon,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailCheckIcon,
  MailIcon,
  PrinterIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import type { accountStatementTool } from "@/lib/ai/tools";
import { formatINR, getLiveTransactions, useBankStore } from "@/lib/bank-store";
import {
  downloadStatementPdf,
  filterStatementData,
  printStatementHtml,
  type StatementData,
} from "@/lib/pdf-statement";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AccountStatementCardProps = UIToolInvocation<
  typeof accountStatementTool
>;

const PRESETS = [
  {
    label: "September 2026",
    subtext: "Current Month",
    start: "2026-09-01",
    end: "2026-09-30",
  },
  {
    label: "August 2026",
    subtext: "Last Month",
    start: "2026-08-01",
    end: "2026-08-31",
  },
  {
    label: "July 2026",
    subtext: "Previous Cycle",
    start: "2026-07-01",
    end: "2026-07-31",
  },
  {
    label: "Last 30 Days",
    subtext: "Rolling Window",
    start: "2026-08-15",
    end: "2026-09-15",
  },
  {
    label: "Q2 FY27",
    subtext: "Jul 01 – Sep 30",
    start: "2026-07-01",
    end: "2026-09-30",
  },
];

export function AccountStatementCard(props: AccountStatementCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const { profile } = useBankStore();

  // Primary live statement state (allows in-place interactive date filtering)
  const [currentStatement, setCurrentStatement] = useState<StatementData | null>(
    (output as StatementData) || null
  );

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailError, setEmailError] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const targetEmail = profile?.personal?.email || "mitulshah3107@gmail.com";

  // Date range picker modal / popover state
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(
    output?.startDate || "2026-09-01"
  );
  const [customEnd, setCustomEnd] = useState(output?.endDate || "2026-09-30");
  const [selectedAccount, setSelectedAccount] = useState<string>(
    output?.account || "all"
  );
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Synchronize when a new tool response is received
  useEffect(() => {
    if (output) {
      const out = output as StatementData;
      setCurrentStatement(out);
      setCustomStart(out.startDate);
      setCustomEnd(out.endDate);
      setSelectedAccount(out.account || "all");
      setIsCustomPeriod(false);
    }
  }, [output]);

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setDatePickerOpen(false);
      }
    }
    if (datePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerOpen]);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Marker role="status" className="my-2">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">
          Generating account statement for requested period...
        </MarkerContent>
      </Marker>
    );
  }

  if (state === "output-error" || errorText) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive my-2">
        Failed to generate statement: {errorText ?? "Unknown error occurred"}
      </div>
    );
  }

  if (!currentStatement) {
    return null;
  }

  const applyPeriod = (
    startStr: string,
    endStr: string,
    accountFilter: string = selectedAccount
  ) => {
    const liveTxs = getLiveTransactions();
    const updated = filterStatementData({
      allTransactions: liveTxs,
      startDateStr: startStr,
      endDateStr: endStr,
      account: accountFilter,
      accountName: profile?.personal?.fullName || "Deep Yadav",
      statementId: currentStatement.statementId,
    });

    setCurrentStatement(updated);
    setCustomStart(startStr);
    setCustomEnd(endStr);
    setSelectedAccount(accountFilter);
    setIsCustomPeriod(true);
    setDatePickerOpen(false);
    setEmailStatus("idle");
    setEmailError(null);
  };

  const resetPeriod = () => {
    if (output) {
      const out = output as StatementData;
      setCurrentStatement(out);
      setCustomStart(out.startDate);
      setCustomEnd(out.endDate);
      setSelectedAccount(out.account || "all");
      setIsCustomPeriod(false);
      setDatePickerOpen(false);
      setEmailStatus("idle");
      setEmailError(null);
    }
  };

  const handleDownload = () => {
    try {
      downloadStatementPdf(currentStatement);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
  };

  const handleSendEmail = async () => {
    if (emailStatus === "sending") return;
    setEmailStatus("sending");
    setEmailError(null);

    try {
      const res = await fetch("/api/send-statement-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          statement: currentStatement,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setEmailStatus("sent");
        setSentMessageId(data.id || null);
      } else {
        setEmailStatus("error");
        setEmailError({
          code: data.error || "ERROR",
          message:
            data.message ||
            "Unable to dispatch email. Please check your Resend configuration.",
        });
      }
    } catch (err: any) {
      setEmailStatus("error");
      setEmailError({
        code: "NETWORK_ERROR",
        message:
          err.message || "Network request failed. Please check your connection.",
      });
    }
  };

  const handlePrint = () => {
    printStatementHtml(currentStatement);
  };

  return (
    <Card
      size="sm"
      className="w-full max-w-[880px] my-2 overflow-visible not-typeset"
    >
      {/* Statement Header */}
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileTextIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Account Statement
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Verified Statement
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {currentStatement.account === "all"
                  ? "All Accounts Consolidated"
                  : `${
                      currentStatement.account.charAt(0).toUpperCase() +
                      currentStatement.account.slice(1)
                    } A/C`}{" "}
                • {currentStatement.accountNumber}
              </CardDescription>
            </div>
          </div>

          {/* Interactive Date Picker Trigger & Dropdown */}
          <div className="relative self-start sm:self-auto" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setDatePickerOpen((prev) => !prev)}
              aria-expanded={datePickerOpen}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-secondary/60 hover:bg-secondary dark:bg-secondary/40 dark:hover:bg-secondary/70 transition-all cursor-pointer shadow-xs group",
                datePickerOpen && "ring-2 ring-blue-500/40 border-blue-500/60"
              )}
              style={{ borderColor: "var(--panel-border)" }}
              title="Click to change statement period or date range"
            >
              <CalendarIcon className="size-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-foreground">
                {currentStatement.periodLabel}
              </span>
              {isCustomPeriod && (
                <span
                  className="size-1.5 rounded-full bg-blue-500 animate-pulse"
                  title="Custom period active"
                />
              )}
              <ChevronDownIcon
                className={cn(
                  "size-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200",
                  datePickerOpen && "rotate-180"
                )}
              />
            </button>

            {/* Floating Date Range Selector Popover */}
            {datePickerOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 w-[320px] sm:w-[360px] rounded-xl border bg-card/95 dark:bg-[#121212]/95 backdrop-blur-md p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
                style={{ borderColor: "var(--panel-border)" }}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--panel-border)" }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CalendarIcon className="size-3.5 text-blue-500" />
                    <span>Select Statement Period</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(false)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>

                {/* Quick Period Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Quick Presets
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESETS.map((preset) => {
                      const isSelected =
                        customStart === preset.start &&
                        customEnd === preset.end;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            applyPeriod(
                              preset.start,
                              preset.end,
                              selectedAccount
                            )
                          }
                          className={cn(
                            "p-2 text-left rounded-lg border transition-all cursor-pointer flex flex-col justify-between text-xs",
                            isSelected
                              ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                              : "border-border/50 hover:border-border hover:bg-muted/40 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{preset.label}</span>
                            {isSelected && (
                              <CheckIcon className="size-3 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {preset.subtext}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div
                  className="space-y-2 pt-2 border-t"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Custom Date Range
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full text-xs font-mono rounded-lg border bg-background/80 px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ borderColor: "var(--panel-border)" }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full text-xs font-mono rounded-lg border bg-background/80 px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ borderColor: "var(--panel-border)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Filter */}
                <div
                  className="space-y-1.5 pt-2 border-t"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Account Filter
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: "all", label: "All" },
                      { id: "savings", label: "Savings" },
                      { id: "checking", label: "Checking" },
                      { id: "credit", label: "Credit" },
                    ].map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccount(acc.id)}
                        className={cn(
                          "py-1 text-center rounded-md border text-[11px] cursor-pointer transition-all",
                          selectedAccount === acc.id
                            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                            : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popover Action Footer */}
                <div
                  className="pt-2 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  {isCustomPeriod ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetPeriod}
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
                    >
                      <RotateCcwIcon className="size-3" />
                      Reset
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      Pick any date window
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDatePickerOpen(false)}
                      className="h-7 text-[11px] px-2.5 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        applyPeriod(customStart, customEnd, selectedAccount)
                      }
                      className="h-7 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-500 text-white gap-1 cursor-pointer font-semibold shadow-xs"
                    >
                      <CheckIcon className="size-3" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Financial Summary Ribbon (4 Tiles) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Opening Balance */}
          <div
            className="p-3 rounded-xl border bg-secondary/50 dark:bg-secondary/60 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Opening Balance
            </span>
            <p className="text-sm sm:text-base font-bold font-mono text-foreground mt-1 tabular-nums">
              {formatINR(currentStatement.openingBalance)}
            </p>
          </div>

          {/* Total Inflows / Credits */}
          <div
            className="p-3 rounded-xl border bg-secondary/50 dark:bg-secondary/60 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
              <ArrowDownLeft className="size-3 text-emerald-500" />
              Total Credits (+)
            </span>
            <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              +{formatINR(currentStatement.totalCredits)}
            </p>
          </div>

          {/* Total Outflows / Debits */}
          <div
            className="p-3 rounded-xl border bg-secondary/50 dark:bg-secondary/60 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
              <ArrowUpRight className="size-3 text-rose-500" />
              Total Debits (-)
            </span>
            <p className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
              -{formatINR(currentStatement.totalDebits)}
            </p>
          </div>

          {/* Closing Balance */}
          <div
            className="p-3 rounded-xl border bg-secondary/50 dark:bg-secondary/60 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Closing Balance
            </span>
            <p className="text-sm sm:text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {formatINR(currentStatement.closingBalance)}
            </p>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div
          className="border rounded-xl overflow-hidden"
          style={{ borderColor: "var(--panel-border)" }}
        >
          <div
            className="px-3.5 py-2 border-b flex items-center justify-between text-xs font-semibold bg-muted/30"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <div className="flex items-center gap-2">
              <span>Statement Transactions ({currentStatement.totalCount})</span>
              {isCustomPeriod && (
                <Badge
                  variant="secondary"
                  className="text-[9px] py-0 px-1.5 font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                >
                  Filtered Range
                </Badge>
              )}
            </div>
            <span className="text-[11px] font-normal text-muted-foreground">
              Net Movement:{" "}
              <strong
                className={
                  currentStatement.netCashflow >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }
              >
                {currentStatement.netCashflow >= 0 ? "+" : ""}
                {formatINR(currentStatement.netCashflow)}
              </strong>
            </span>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[100px] text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStatement.transactions.length > 0 ? (
                  currentStatement.transactions.map((tx) => (
                    <TableRow key={tx.id} className="text-xs">
                      <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {tx.date.split("T")[0]}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize sm:hidden">
                          {tx.category} • {tx.account}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal py-0 px-2"
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold whitespace-nowrap">
                        <span
                          className={
                            tx.type === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatINR(tx.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-16 text-center text-xs text-muted-foreground"
                    >
                      No transaction records found for this specific date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Email Delivery Confirmation Banner */}
        {emailStatus === "sent" && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <MailCheckIcon className="size-4 shrink-0" />
              <span>
                Statement PDF successfully dispatched to{" "}
                <strong>{targetEmail}</strong> via Resend{" "}
                {sentMessageId && (
                  <span className="opacity-75 font-mono text-[10px]">
                    ({sentMessageId})
                  </span>
                )}
                .
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEmailStatus("idle")}
              className="text-[11px] hover:underline cursor-pointer opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Email Delivery Error / Config Banner */}
        {emailStatus === "error" && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
                  <AlertTriangleIcon className="size-4 shrink-0 text-amber-500" />
                  <span>Email Delivery Notice</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-700/95 dark:text-amber-300/95">
                  {emailError?.message}
                </p>
                {emailError?.code === "CONFIG_REQUIRED" && (
                  <div className="text-[11px] mt-2 pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">
                      Tip: Obtain a free API key at{" "}
                      <a
                        href="https://resend.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-0.5"
                      >
                        resend.com <ExternalLinkIcon className="size-2.5" />
                      </a>{" "}
                      and paste{" "}
                      <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[10px]">
                        RESEND_API_KEY=re_...
                      </code>{" "}
                      into{" "}
                      <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[10px]">
                        .env.local
                      </code>
                      .
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="h-6 text-[10px] gap-1 border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 cursor-pointer"
                    >
                      <DownloadIcon className="size-3" />
                      Download PDF Directly
                    </Button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEmailStatus("idle")}
                className="text-[11px] hover:underline cursor-pointer opacity-70 shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Footer: Download PDF & Email PDF Options */}
      <CardFooter className="border-t p-3 sm:p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[11px] text-muted-foreground">
          Ref:{" "}
          <strong className="font-mono text-foreground">
            {currentStatement.statementId}
          </strong>{" "}
          • Verified by BankMate
        </div>

        <div className="flex items-center gap-2">
          {/* Download PDF button */}
          <Button
            type="button"
            variant={downloadSuccess ? "outline" : "default"}
            size="sm"
            onClick={handleDownload}
            className="cursor-pointer gap-1.5 text-xs font-semibold transition-all shadow-xs"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                <span>Downloaded PDF</span>
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </Button>

          {/* Email as PDF button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={emailStatus === "sending"}
            className="cursor-pointer gap-1.5 text-xs font-medium transition-all"
          >
            {emailStatus === "sending" ? (
              <>
                <Spinner className="size-3.5" />
                <span>Sending via Resend...</span>
              </>
            ) : emailStatus === "sent" ? (
              <>
                <MailCheckIcon className="size-3.5 text-emerald-500" />
                <span>Resend Email</span>
              </>
            ) : emailStatus === "error" ? (
              <>
                <AlertTriangleIcon className="size-3.5 text-amber-500" />
                <span>Retry Email</span>
              </>
            ) : (
              <>
                <MailIcon className="size-3.5" />
                <span>Email as PDF</span>
              </>
            )}
          </Button>

          {/* Print preview */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            title="Print or view statement letterhead"
            className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          >
            <PrinterIcon className="size-3.5" />
            <span className="sr-only">Print Statement</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
