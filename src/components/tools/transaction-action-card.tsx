"use client";

import type { UIToolInvocation } from "ai";
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LockIcon,
  MicIcon,
  PiggyBankIcon,
  ReceiptIcon,
  SendIcon,
  SparklesIcon,
  UserCheckIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BankProfileModal,
  type TabType,
} from "@/components/profile/bank-profile-modal";
import { useVoice } from "@/context/voice-context";
import type { bookFixedDepositTool, transferFundsTool } from "@/lib/ai/tools";
import {
  executeCreateFixedDeposit,
  executeTransferFunds,
  formatINR,
  useBankStore,
} from "@/lib/bank-store";
import { parseSpokenPin } from "@/lib/spoken-pin-parser";
import { sendTransactionEmail } from "@/lib/transaction-email";

export interface TransactionActionCardProps {
  actionType: "fixed-deposit" | "transfer";
  amount: number;
  // FD specific
  tenureYears?: number;
  interestRate?: number;
  payoutType?: string;
  // Transfer specific
  recipientName?: string;
  recipientAccount?: string;
  note?: string;
}

// Registry to ensure only the latest active idle card intercepts spoken PINs
let latestActiveCardId: string | null = null;

export function TransactionActionCard({
  actionType = "fixed-deposit",
  amount,
  tenureYears = 2,
  interestRate = 7.25,
  payoutType = "Cumulative (At Maturity)",
  recipientName = "Rohit Verma",
  recipientAccount = "•••• 4092",
  note = "Personal Transfer",
}: TransactionActionCardProps) {
  const { profile } = useBankStore();
  const { speak, voiceMode } = useVoice();
  const cardIdRef = useRef<string>(
    `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  );
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [spokenPinDetected, setSpokenPinDetected] = useState(false);
  const [resultData, setResultData] = useState<{
    referenceId?: string;
    newBalance?: number;
    maturityAmount?: number;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<TabType>("accounts");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Register this card as the active idle transaction card on mount or when idle
  useEffect(() => {
    if (status === "idle") {
      latestActiveCardId = cardIdRef.current;
      inputRefs.current[0]?.focus();
    } else if (latestActiveCardId === cardIdRef.current) {
      latestActiveCardId = null;
    }
  }, [status]);

  const handlePinChange = (index: number, value: string) => {
    if (status === "processing" || status === "success") return;

    // Only allow single digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newPin = [...pin];
      newPin[index] = "";
      setPin(newPin);
      return;
    }

    const digit = cleaned.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setErrorMessage("");

    // Auto advance to next input box
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newPin = [...pin];
    for (let i = 0; i < 6; i++) {
      newPin[i] = pasted[i] || "";
    }
    setPin(newPin);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const isPinComplete = pin.every((d) => d.length === 1);
  const pinString = pin.join("");

  // Calculate estimated maturity for FD
  const maturityAmount =
    actionType === "fixed-deposit"
      ? Math.round(amount * (1 + interestRate / 400) ** (4 * tenureYears))
      : 0;

  // Execute authorization with specified 6-digit PIN
  const executeAuthorizationWithPin = useCallback(
    (targetPin: string, isSpoken: boolean = false) => {
      setStatus("processing");
      setErrorMessage("");

      setTimeout(() => {
        if (actionType === "fixed-deposit") {
          const res = executeCreateFixedDeposit({
            amount,
            tenureYears,
            interestRate,
            payoutType,
            pin: targetPin,
          });

          if (res.success) {
            setStatus("success");
            setResultData({
              referenceId: res.fd?.fdNumber,
              newBalance: res.newBalance,
              maturityAmount: res.fd?.maturityAmount,
            });

            // Send confirmation email
            sendTransactionEmail({
              type: "fixed-deposit",
              recipientEmail: profile?.personal?.email,
              data: {
                fdNumber: res.fd?.fdNumber || "FD-2026-9904",
                principalAmount: amount,
                tenureYears,
                interestRate,
                maturityAmount: res.fd?.maturityAmount || maturityAmount,
                payoutType,
                sourceAccount: "Savings A/C 4092 •••• 8842",
                newBalance: res.newBalance || 0,
              },
            });

            if (voiceMode || isSpoken || spokenPinDetected) {
              speak(
                `Fixed Deposit of ${formatINR(amount)} booked successfully. Reference number is ${res.fd?.fdNumber}. Your new savings balance is ${formatINR(res.newBalance || 0)}.`,
              );
            }
          } else {
            setStatus("error");
            setErrorMessage(res.message);
            setPin(["", "", "", "", "", ""]);
            setSpokenPinDetected(false);
            inputRefs.current[0]?.focus();
            if (voiceMode || isSpoken || spokenPinDetected) {
              speak(
                "Incorrect transaction PIN. Please speak your 6 digit PIN again.",
              );
            }
          }
        } else {
          const res = executeTransferFunds({
            recipientName,
            recipientAccount,
            amount,
            note,
            pin: targetPin,
          });

          if (res.success) {
            setStatus("success");
            setResultData({
              referenceId: res.referenceId,
              newBalance: res.newBalance,
            });

            // Send confirmation email
            sendTransactionEmail({
              type: "transfer",
              recipientEmail: profile?.personal?.email,
              data: {
                recipientName,
                recipientAccount,
                amount,
                note,
                referenceId: res.referenceId || "TX-IMPS",
                sourceAccount: "Savings A/C 4092 •••• 8842",
                newBalance: res.newBalance || 0,
              },
            });

            if (voiceMode || isSpoken || spokenPinDetected) {
              speak(
                `Transfer of ${formatINR(amount)} to ${recipientName} has been authorized and completed successfully. Reference number is ${res.referenceId}. Your new savings balance is ${formatINR(res.newBalance || 0)}.`,
              );
            }
          } else {
            setStatus("error");
            setErrorMessage(res.message);
            setPin(["", "", "", "", "", ""]);
            setSpokenPinDetected(false);
            inputRefs.current[0]?.focus();
            if (voiceMode || isSpoken || spokenPinDetected) {
              speak(
                "Incorrect transaction PIN. Please speak your 6 digit PIN again.",
              );
            }
          }
        }
      }, 500);
    },
    [
      actionType,
      amount,
      interestRate,
      maturityAmount,
      note,
      payoutType,
      profile?.personal?.email,
      recipientAccount,
      recipientName,
      speak,
      spokenPinDetected,
      tenureYears,
      voiceMode,
    ],
  );

  const handleAuthorize = () => {
    if (!isPinComplete) {
      setErrorMessage("Please enter all 6 digits of your transaction PIN.");
      return;
    }
    executeAuthorizationWithPin(pinString, false);
  };

  // Voice PIN Listening: Intercept spoken PIN while this authorization card is idle
  useEffect(() => {
    if (status !== "idle") return;

    const handleVoiceAction = (e: Event) => {
      // Only the latest active idle card responds to spoken PIN
      if (latestActiveCardId && latestActiveCardId !== cardIdRef.current)
        return;

      const customEvent = e as CustomEvent<{ text: string }>;
      const text = (customEvent.detail?.text || "").toLowerCase().trim();

      // Check if user spoke a 6-digit PIN
      const spokenPin = parseSpokenPin(text);

      if (spokenPin && spokenPin.length === 6) {
        // Prevent forwarding this PIN as a chat prompt to the AI
        e.preventDefault();
        setSpokenPinDetected(true);
        setPin(spokenPin.split(""));
        executeAuthorizationWithPin(spokenPin, true);
        return;
      }

      // Check if user spoke confirmation words when PIN is already filled
      if (
        text.includes("confirm") ||
        text.includes("authorize") ||
        text.includes("proceed") ||
        text.includes("send it")
      ) {
        if (pin.every((d) => d.length === 1)) {
          e.preventDefault();
          executeAuthorizationWithPin(pin.join(""), true);
        }
      }
    };

    window.addEventListener("bankmate-voice-action", handleVoiceAction);
    return () => {
      window.removeEventListener("bankmate-voice-action", handleVoiceAction);
    };
  }, [status, pin, executeAuthorizationWithPin]);

  return (
    <div className="w-full my-3.5 not-typeset">
      <div
        className="rounded-2xl border overflow-hidden shadow-sm transition-all"
        style={{
          borderColor: "var(--panel-border)",
          backgroundColor: "var(--card)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{
            borderColor: "var(--panel-border)",
            background:
              status === "success"
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                status === "success" ? "bg-emerald-600" : "bg-primary"
              }`}
            >
              {status === "success" ? (
                <CheckCircle2Icon className="size-5" />
              ) : actionType === "fixed-deposit" ? (
                <PiggyBankIcon className="size-5" />
              ) : (
                <SendIcon className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {status === "success"
                    ? actionType === "fixed-deposit"
                      ? "Fixed Deposit Booked Successfully"
                      : "Transfer Completed"
                    : actionType === "fixed-deposit"
                      ? "Fixed Deposit Booking Authorization"
                      : "Fund Transfer Authorization"}
                </h3>
                {status === "success" ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Confirmed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    PIN Required
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <LockIcon className="size-3 text-muted-foreground" />
                <span>256-bit Encrypted Banking Transaction</span>
              </p>
            </div>
          </div>

          <span className="text-base sm:text-lg font-bold font-mono text-foreground whitespace-nowrap tabular-nums">
            {formatINR(amount)}
          </span>
        </div>

        {/* Transaction Summary Table */}
        <div className="p-5 space-y-4 text-xs">
          <div
            className="p-3.5 rounded-xl border grid grid-cols-2 sm:grid-cols-3 gap-3"
            style={{
              borderColor: "var(--panel-border)",
              backgroundColor: "var(--toggle-bg)",
            }}
          >
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Debited Account
              </span>
              <strong className="text-foreground font-mono">
                Savings A/C •••• 8842
              </strong>
            </div>

            {actionType === "fixed-deposit" ? (
              <>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Tenure & Rate
                  </span>
                  <strong className="text-foreground">
                    {tenureYears} Years @ {interestRate}% p.a.
                  </strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted-foreground block">
                    Est. Maturity Value
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                    {formatINR(resultData?.maturityAmount || maturityAmount)}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Beneficiary
                  </span>
                  <strong className="text-foreground">{recipientName}</strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted-foreground block">
                    Note
                  </span>
                  <span className="text-foreground">{note}</span>
                </div>
              </>
            )}
          </div>

          {/* Success Receipt State */}
          {status === "success" ? (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Transaction Reference No.
                  </span>
                  <strong className="font-mono text-xs text-foreground">
                    {resultData?.referenceId}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs">
                  <span className="text-muted-foreground">
                    Updated Savings Balance:
                  </span>
                  <strong className="font-mono text-foreground font-bold whitespace-nowrap">
                    {formatINR(resultData?.newBalance || 0)}
                  </strong>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-2 pt-3 border-t"
                style={{ borderColor: "var(--panel-border)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setModalTab("transactions");
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-muted/50 cursor-pointer"
                  style={{
                    borderColor: "var(--panel-border)",
                    color: "var(--foreground)",
                  }}
                >
                  <ReceiptIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Recent Transactions</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab("accounts");
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  <UserCheckIcon className="size-3.5" />
                  <span>View Bank Profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* PIN Authorization Entry State */
            <div className="space-y-4 pt-1">
              <div>
                {/* Voice PIN prompt badge */}
                <div className="flex items-center justify-center mb-2.5">
                  {status === "processing" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 animate-pulse">
                      <SparklesIcon className="size-3.5 animate-spin" />
                      <span>
                        {spokenPinDetected
                          ? "Spoken PIN received! Authorizing transaction..."
                          : "Verifying credentials & authorizing..."}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <MicIcon className="size-3 text-blue-600 dark:text-blue-400 animate-pulse" />
                      <span>Speak your 6-digit PIN aloud or type below</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRoundIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Enter 6-Digit Transaction PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showPin ? (
                      <>
                        <EyeOffIcon className="size-3" /> Hide PIN
                      </>
                    ) : (
                      <>
                        <EyeIcon className="size-3" /> Show PIN
                      </>
                    )}
                  </button>
                </div>

                {/* 6 PIN Input Boxes */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-2">
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={status === "processing"}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className="size-11 sm:size-12 text-center text-lg font-bold font-mono rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs"
                      style={{
                        backgroundColor: "var(--toggle-bg)",
                        borderColor:
                          status === "error"
                            ? "#EF4444"
                            : digit
                              ? "var(--primary)"
                              : "var(--panel-border)",
                        color: "var(--foreground)",
                      }}
                      autoComplete="off"
                    />
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                  Enter your 6-digit transaction PIN to authorize
                </p>

                {/* Error message */}
                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium text-center animate-shake mt-1.5">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center justify-end gap-2.5 pt-2 border-t"
                style={{ borderColor: "var(--panel-border)" }}
              >
                <button
                  type="button"
                  disabled={status === "processing" || !isPinComplete}
                  onClick={handleAuthorize}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all duration-150 ${
                    status === "processing" || !isPinComplete
                      ? "opacity-50 cursor-not-allowed bg-slate-400"
                      : "bg-primary hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {status === "processing"
                    ? "Authorizing with Bank..."
                    : "Confirm & Authorize"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BankProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />
    </div>
  );
}

export type BookFixedDepositCardProps = UIToolInvocation<
  typeof bookFixedDepositTool
>;
export type TransferFundsCardProps = UIToolInvocation<typeof transferFundsTool>;

export function BookFixedDepositCard(props: BookFixedDepositCardProps) {
  const input = props.input || {};
  return (
    <TransactionActionCard
      actionType="fixed-deposit"
      amount={input.amount ?? 20000}
      tenureYears={input.tenureYears ?? 2}
      interestRate={input.interestRate ?? 7.25}
      payoutType={input.payoutType ?? "Cumulative (At Maturity)"}
    />
  );
}

export function TransferFundsCard(props: TransferFundsCardProps) {
  const input = props.input || {};
  return (
    <TransactionActionCard
      actionType="transfer"
      amount={input.amount ?? 5000}
      recipientName={input.recipientName ?? "Beneficiary"}
      recipientAccount={input.recipientAccount ?? "•••• 4092"}
      note={input.note ?? "Fund Transfer"}
    />
  );
}
