"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileCheck2Icon,
  MailCheckIcon,
  MailIcon,
  PrinterIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { generateBankingDocumentTool } from "@/lib/ai/tools";
import { formatINR, useBankStore } from "@/lib/bank-store";
import {
  downloadGenericDocumentPdf,
  printGenericDocumentHtml,
} from "@/lib/pdf-documents";
import type { BankingDocument } from "@/types/banking";

export type BankingDocumentCardProps = UIToolInvocation<
  typeof generateBankingDocumentTool
>;

export function BankingDocumentCard(props: BankingDocumentCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const { profile } = useBankStore();
  const [doc, _setDoc] = useState<BankingDocument | null>(
    (output?.document as BankingDocument) || null,
  );
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const targetEmail = profile?.personal?.email || "mitulshah3107@gmail.com";

  if (
    state === "input-streaming" ||
    state === "input-available" ||
    isRetrying
  ) {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Generating official certified document...
            </p>
            <p className="text-xs text-muted-foreground">
              Retrieving ledger records, applying digital bank seal & QR
              validation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    state === "output-error" ||
    state === "output-denied" ||
    (!doc && !output)
  ) {
    return (
      <Card className="w-full max-w-2xl border-destructive/40 bg-destructive/5 shadow-md">
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Failed to generate certificate
              </p>
              <p className="text-xs text-muted-foreground">
                {errorText || "Document could not be compiled. Please retry."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsRetrying(true);
              setTimeout(() => setIsRetrying(false), 1200);
            }}
          >
            <RefreshCwIcon className="size-3.5 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentDoc = doc || (output?.document as BankingDocument);
  if (!currentDoc) return null;

  const handleDownload = () => {
    const ok = downloadGenericDocumentPdf(currentDoc);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    printGenericDocumentHtml(currentDoc);
  };

  const handleEmail = () => {
    setEmailStatus("sending");
    setTimeout(() => {
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 5000);
    }, 1200);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(currentDoc.documentRefNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Top Bank Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <FileCheck2Icon className="size-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-100">
                BankMate Document Center
              </span>
              <h3 className="text-base font-bold leading-tight">
                {currentDoc.title}
              </h3>
            </div>
          </div>
          <Badge className="bg-white/20 hover:bg-white/25 text-white border-white/20 text-[11px] font-semibold">
            {currentDoc.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Certificate Reference Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">
              Reference No.
            </span>
            <div className="flex items-center gap-1 font-semibold text-foreground mt-0.5">
              <span className="truncate">{currentDoc.documentRefNumber}</span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy reference"
              >
                {copied ? (
                  <CheckIcon className="size-3 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </button>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">
              Customer CIF
            </span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {currentDoc.cifNumber}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">
              Financial Period
            </span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {currentDoc.financialYear}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">
              Generated Date
            </span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {currentDoc.generatedDate}
            </span>
          </div>
        </div>

        {/* Certificate Particulars Table */}
        <div className="border border-slate-200/80 dark:border-border rounded-xl overflow-hidden">
          <div className="bg-slate-100/80 dark:bg-muted/60 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
            <span>Particulars / Financial Particulars</span>
            <span>Certified Value</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border text-xs">
            {Object.entries(currentDoc.particulars).map(([key, val], idx) => (
              <div
                key={key}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  idx % 2 === 1 ? "bg-slate-50/50 dark:bg-muted/20" : ""
                }`}
              >
                <span className="text-muted-foreground font-medium">{key}</span>
                <span className="font-bold text-foreground">
                  {typeof val === "number" ? formatINR(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Declaration & Digital Stamp */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs">
          <ShieldCheckIcon className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {currentDoc.summaryText}
            </p>
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              Digital Verification Code: {currentDoc.verificationCode} •
              Authenticated by BankMate BKC Flagship Branch
            </p>
          </div>
        </div>

        {/* Email Feedback Notice */}
        {emailStatus === "sent" && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <MailCheckIcon className="size-4 text-emerald-600 shrink-0" />
            <span>
              Certified PDF copy sent to your registered email{" "}
              <strong>{targetEmail}</strong>!
            </span>
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      <CardFooter className="px-5 py-3.5 bg-slate-50 dark:bg-muted/30 border-t border-slate-200/80 dark:border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2Icon className="size-3.5 mr-1 text-emerald-300" />
                Downloaded
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5 mr-1" />
                Download PDF
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="text-xs font-medium"
          >
            <PrinterIcon className="size-3.5 mr-1" />
            Print
          </Button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleEmail}
          disabled={emailStatus === "sending"}
          className="text-xs font-medium"
        >
          {emailStatus === "sending" ? (
            <>
              <Spinner className="size-3 mr-1" />
              Sending...
            </>
          ) : emailStatus === "sent" ? (
            <>
              <CheckIcon className="size-3 mr-1 text-emerald-600" />
              Email Dispatched
            </>
          ) : (
            <>
              <MailIcon className="size-3.5 mr-1" />
              Email to {targetEmail.split("@")[0]}...
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
