"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  GlobeIcon,
  LockIcon,
  PrinterIcon,
  SendIcon,
  SmartphoneIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { paymentTransferTool } from "@/lib/ai/tools";
import {
  executeMobileRecharge,
  executePayBill,
  executeTransferFunds,
  formatINR,
  useBankStore,
  validateTransactionPin,
} from "@/lib/bank-store";

export type PaymentHubCardProps = UIToolInvocation<typeof paymentTransferTool>;

export function PaymentHubCard(props: PaymentHubCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const { beneficiaries, deleteBeneficiary } = useBankStore();

  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptData, setReceiptData] = useState<{
    referenceId: string;
    amount: number;
    recipient: string;
    mode: string;
    newBalance?: number;
    fee?: number;
  } | null>(null);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Preparing payment transaction...
            </p>
            <p className="text-xs text-muted-foreground">
              Validating routing IFSC, NPCI limits, and beneficiary cooling
              periods
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
              Payment Setup Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Could not initialize payment flow."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mode = output?.action || "transfer";
  const amount = output?.amount || 0;
  const recipientName = output?.recipientName || "Beneficiary";
  const recipientAccount = output?.recipientAccount || "•••• 4092";
  const note = output?.note || "Bank Payment";
  const transferType = output?.transferType || "UPI";
  const international = output?.internationalDetails;
  const billDetails = output?.billDetails;

  const handleAuthorizeTransfer = () => {
    if (!validateTransactionPin(pin)) {
      setStatus("error");
      setErrorMessage("Incorrect 6-digit transaction PIN. Please try again.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    setTimeout(() => {
      if (mode === "pay_bill" && billDetails?.id) {
        const res = executePayBill(billDetails.id, pin);
        if (res.success) {
          setStatus("success");
          setReceiptData({
            referenceId:
              res.receiptId || `BILL-${Date.now().toString().slice(-6)}`,
            amount: res.bill?.billAmount || amount,
            recipient: res.bill?.billerName || recipientName,
            mode: "BBPS Utility Pay",
          });
        } else {
          setStatus("error");
          setErrorMessage(res.message);
        }
      } else if (mode === "recharge" && output?.rechargeDetails) {
        const rec = output.rechargeDetails;
        const res = executeMobileRecharge(
          rec.phoneNumber,
          rec.operator,
          rec.amount,
          pin,
        );
        if (res.success) {
          setStatus("success");
          setReceiptData({
            referenceId:
              res.receiptId || `RCHG-${Date.now().toString().slice(-6)}`,
            amount: rec.amount,
            recipient: `${rec.phoneNumber} (${rec.operator})`,
            mode: "Instant Mobile Recharge",
          });
        } else {
          setStatus("error");
          setErrorMessage(res.message);
        }
      } else {
        // Standard or International transfer
        const res = executeTransferFunds({
          recipientName,
          recipientAccount,
          amount,
          note,
          pin,
          transferType,
        });

        if (res.success) {
          setStatus("success");
          setReceiptData({
            referenceId:
              res.referenceId || `TXN-${Date.now().toString().slice(-6)}`,
            amount,
            recipient: recipientName,
            mode: transferType,
            newBalance: res.newBalance,
            fee: international ? 590 : 0,
          });
        } else {
          setStatus("error");
          setErrorMessage(res.message);
        }
      }
      setIsProcessing(false);
    }, 800);
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              {international ? (
                <GlobeIcon className="size-4 text-white" />
              ) : mode === "pay_bill" ? (
                <ZapIcon className="size-4 text-white" />
              ) : mode === "recharge" ? (
                <SmartphoneIcon className="size-4 text-white" />
              ) : (
                <SendIcon className="size-4 text-white" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-100">
                {international
                  ? "International Remittance (SWIFT)"
                  : "Payments & Fund Transfers"}
              </span>
              <h3 className="text-base font-bold leading-tight">
                {mode === "manage_beneficiary"
                  ? "Beneficiary Management"
                  : mode === "pay_bill"
                    ? `Pay Bill: ${billDetails?.billerName || recipientName}`
                    : mode === "recharge"
                      ? `Mobile Recharge (${output?.rechargeDetails?.operator || "Prepaid"})`
                      : `Transfer ₹${amount.toLocaleString("en-IN")}`}
              </h3>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/20 text-[10px] font-bold">
            {transferType}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {status === "success" && receiptData ? (
          <div className="space-y-4 py-2 text-center">
            <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2Icon className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Payment Completed Successfully!
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Funds have been transferred and transaction recorded in your
                ledger.
              </p>
            </div>

            {/* Official Receipt Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border text-left space-y-2.5 text-xs max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-slate-200/80 dark:border-border">
                <span className="text-muted-foreground">
                  Receipt / Reference No.
                </span>
                <span className="font-mono font-bold text-foreground">
                  {receiptData.referenceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid To</span>
                <span className="font-bold text-foreground">
                  {receiptData.recipient}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Amount Transferred
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatINR(receiptData.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="font-semibold text-foreground">
                  {receiptData.mode}
                </span>
              </div>
              {receiptData.newBalance !== undefined && (
                <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-border">
                  <span className="text-muted-foreground">
                    Remaining Savings Balance
                  </span>
                  <span className="font-bold text-foreground">
                    {formatINR(receiptData.newBalance)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="text-xs"
              >
                <PrinterIcon className="size-3 mr-1" />
                Print Receipt
              </Button>
            </div>
          </div>
        ) : mode === "manage_beneficiary" ? (
          /* Beneficiaries View */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Registered Beneficiaries ({beneficiaries.length})
              </span>
              <span className="text-muted-foreground">
                Instant transfers within limit
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-border border rounded-xl overflow-hidden text-xs">
              {beneficiaries.map((b) => (
                <div
                  key={b.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-muted/30"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {b.name}
                      </span>
                      <Badge
                        variant={
                          b.status === "Active" ? "outline" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground block mt-0.5">
                      {b.bankName} • A/C {b.accountNumber} • IFSC {b.ifsc}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      Limit: ₹{b.dailyLimit.toLocaleString("en-IN")}/day
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteBeneficiary(b.id)}
                      className="text-destructive hover:underline text-[11px] mt-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Transfer Confirmation Mode */
          <div className="space-y-4">
            {/* Particulars Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Recipient
                </span>
                <span className="font-bold text-foreground mt-0.5 block truncate">
                  {recipientName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Account / Identifier
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {recipientAccount}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Payment Mode
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {transferType}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Amount Payable
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {formatINR(amount)}
                </span>
              </div>
            </div>

            {/* International Wire Breakdown if applicable */}
            {international && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                  <GlobeIcon className="size-4" />
                  <span>Outward Remittance Breakdown (LRS Form A2)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">
                      Foreign Currency:
                    </span>
                    <span className="font-bold text-foreground">
                      {international.foreignAmount}{" "}
                      {international.foreignCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Exchange Rate:
                    </span>
                    <span className="font-bold text-foreground">
                      ₹{international.exchangeRate} /{" "}
                      {international.foreignCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Wire Fee + GST:
                    </span>
                    <span className="font-bold text-foreground">
                      ₹500 + ₹90
                    </span>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  Compliance Status: {international.complianceStatus} •
                  Estimated Delivery: {international.estimatedDelivery}
                </div>
              </div>
            )}

            {/* Error Message */}
            {status === "error" && errorMessage && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PIN Authorization Row */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-100">
                  <LockIcon className="size-3.5" />
                  <span>Enter 6-digit Transaction PIN to Authorize</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Confidential
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="font-mono text-center tracking-widest text-sm h-9 bg-background"
                />

                <Button
                  onClick={handleAuthorizeTransfer}
                  disabled={pin.length < 6 || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-9 shrink-0 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="size-3 mr-1" />
                      Processing...
                    </>
                  ) : (
                    <>Authorize Payment</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
