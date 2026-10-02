"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  GiftIcon,
  KeyRoundIcon,
  LockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SlidersIcon,
  UnlockIcon,
  WifiIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { cardManagementTool } from "@/lib/ai/tools";
import {
  formatINR,
  useBankStore,
  validateTransactionPin,
} from "@/lib/bank-store";

export type CardManagementCardProps = UIToolInvocation<
  typeof cardManagementTool
>;

export function CardManagementCard(props: CardManagementCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const {
    profile,
    cardControls,
    toggleCardControl,
    setCardLimits,
    redeemRewardPoints,
    createServiceRequest,
  } = useBankStore();

  const [selectedCardId, setSelectedCardId] = useState<string>(
    output?.cardId || "card_credit_01",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<number>(5000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [atmLimit, setAtmLimit] = useState(100000);
  const [posLimit, setPosLimit] = useState(400000);

  // Sensitive PIN prompt state for block, unblock, report lost, limits & toggles
  const [sensitivePrompt, setSensitivePrompt] = useState<{
    type:
      | "block"
      | "unblock"
      | "report_lost"
      | "international"
      | "contactless"
      | "limits";
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
  } | null>(null);
  const [sensitivePin, setSensitivePin] = useState("");
  const [sensitivePinError, setSensitivePinError] = useState<string | null>(
    null,
  );

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Accessing Card Management Services...
            </p>
            <p className="text-xs text-muted-foreground">
              Connecting to Visa & Mastercard cardholder switch controls
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
              Card Operation Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Could not retrieve card details."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pCard =
    profile.cards.find((c) => c.id === selectedCardId) || profile.cards[0];
  const controls = cardControls[selectedCardId] || {
    cardId: selectedCardId,
    cardNumberMasked: pCard.cardNumberMasked,
    isBlockedTemporarily: pCard.status.includes("Block"),
    isLostReported: false,
    contactlessEnabled: pCard.contactless,
    internationalEnabled: pCard.international,
    onlineEcommerceEnabled: true,
    atmDailyLimit: pCard.dailyAtm || 100000,
    atmMaxLimit: 200000,
    posDailyLimit: pCard.dailyPos || 400000,
    posMaxLimit: 500000,
    rewardPoints: pCard.rewardPoints || 34250,
    rewardValue: pCard.rewardValue || 8562.5,
    disputes: [],
  };

  const handleToggle = (
    field:
      | "contactlessEnabled"
      | "internationalEnabled"
      | "onlineEcommerceEnabled"
      | "isBlockedTemporarily",
  ) => {
    setSensitivePin("");
    setSensitivePinError(null);

    if (field === "isBlockedTemporarily") {
      if (controls.isBlockedTemporarily) {
        setSensitivePrompt({
          type: "unblock",
          title: "Unfreeze Card",
          description: `Enter your 6-digit transaction PIN to unfreeze ${pCard.cardName} (${pCard.cardNumberMasked}) and restore domestic POS, ATM, and online transactions.`,
          confirmLabel: "Confirm Unfreeze",
          isDestructive: false,
        });
      } else {
        setSensitivePrompt({
          type: "block",
          title: "Temporary Card Freeze",
          description: `Enter your 6-digit transaction PIN to temporarily freeze ${pCard.cardName} (${pCard.cardNumberMasked}). All ATM cash withdrawals, POS swipes, and online checkouts will be blocked instantly.`,
          confirmLabel: "Freeze Card Now",
          isDestructive: true,
        });
      }
      return;
    }

    if (field === "internationalEnabled") {
      setSensitivePrompt({
        type: "international",
        title: controls.internationalEnabled
          ? "Disable Cross-Border Transactions"
          : "Enable Cross-Border Transactions",
        description: `Enter your 6-digit transaction PIN to ${
          controls.internationalEnabled ? "block" : "permit"
        } international merchants and foreign currency conversions as mandated by RBI security directives.`,
        confirmLabel: controls.internationalEnabled
          ? "Disable International"
          : "Enable International",
      });
      return;
    }

    if (field === "contactlessEnabled") {
      setSensitivePrompt({
        type: "contactless",
        title: controls.contactlessEnabled
          ? "Disable Contactless Tap & Pay"
          : "Enable Contactless Tap & Pay",
        description: `Enter your 6-digit transaction PIN to ${
          controls.contactlessEnabled ? "turn OFF" : "turn ON"
        } NFC contactless payments without PIN (up to ₹5,000 per tap) for ${pCard.cardName}.`,
        confirmLabel: controls.contactlessEnabled
          ? "Disable Contactless"
          : "Enable Contactless",
      });
      return;
    }

    const newVal = !controls[field];
    const res = toggleCardControl(selectedCardId, field, newVal);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleConfirmSensitiveAction = () => {
    if (!validateTransactionPin(sensitivePin)) {
      setSensitivePinError(
        "Incorrect 6-digit transaction PIN. (Default PIN: 123456)",
      );
      return;
    }
    setIsProcessing(true);
    setSensitivePinError(null);

    setTimeout(() => {
      if (!sensitivePrompt) return;
      if (sensitivePrompt.type === "block") {
        const res = toggleCardControl(
          selectedCardId,
          "isBlockedTemporarily",
          true,
        );
        setFeedback(res.message);
      } else if (sensitivePrompt.type === "unblock") {
        const res = toggleCardControl(
          selectedCardId,
          "isBlockedTemporarily",
          false,
        );
        setFeedback(res.message);
      } else if (sensitivePrompt.type === "report_lost") {
        createServiceRequest({
          requestType: "Card replacement request",
          title: `Lost Card Report: ${pCard.cardName} (${pCard.cardNumberMasked})`,
          description:
            "Card permanently hotlisted as lost. Replacement contactless EMV chip card dispatched to BKC address.",
          department: "Card Security & Fraud Operations",
          priority: "Urgent",
        });
        toggleCardControl(selectedCardId, "isBlockedTemporarily", true);
        setFeedback(
          `Card ${pCard.cardNumberMasked} hotlisted permanently. Replacement dispatched to BKC address.`,
        );
      } else if (sensitivePrompt.type === "international") {
        const res = toggleCardControl(
          selectedCardId,
          "internationalEnabled",
          !controls.internationalEnabled,
        );
        setFeedback(res.message);
      } else if (sensitivePrompt.type === "contactless") {
        const res = toggleCardControl(
          selectedCardId,
          "contactlessEnabled",
          !controls.contactlessEnabled,
        );
        setFeedback(res.message);
      } else if (sensitivePrompt.type === "limits") {
        const res = setCardLimits(selectedCardId, atmLimit, posLimit);
        setShowLimitModal(false);
        setFeedback(res.message);
      }

      setIsProcessing(false);
      setSensitivePrompt(null);
      setSensitivePin("");
      setTimeout(() => setFeedback(null), 5000);
    }, 600);
  };

  const handleRedeem = () => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default: 123456)");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const res = redeemRewardPoints(selectedCardId, redeemPoints, pin);
      setIsProcessing(false);
      setShowRedeemInput(false);
      setPin("");
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 4000);
    }, 700);
  };

  const handlePromptLimitsSave = () => {
    setSensitivePin("");
    setSensitivePinError(null);
    setSensitivePrompt({
      type: "limits",
      title: "Authorize Daily Card Limits",
      description: `Enter your 6-digit transaction PIN to update Daily ATM Limit to ${formatINR(
        atmLimit,
      )} and Daily POS/Online Limit to ${formatINR(posLimit)} for card ending in ${pCard.cardNumberMasked.slice(-4)}.`,
      confirmLabel: "Authorize & Save Limits",
    });
  };

  const handlePromptReportLost = () => {
    setSensitivePin("");
    setSensitivePinError(null);
    setSensitivePrompt({
      type: "report_lost",
      title: "Permanently Hotlist & Report Lost Card",
      description: `Enter your 6-digit transaction PIN to permanently hotlist ${pCard.cardName} (${pCard.cardNumberMasked}). This card will be immediately deactivated and a replacement contactless chip card dispatched.`,
      confirmLabel: "Hotlist & Reissue Card",
      isDestructive: true,
    });
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CreditCardIcon className="size-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                Card Control Center
              </span>
              <h3 className="text-base font-bold leading-tight">
                {pCard.cardName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.cards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCardId(c.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedCardId === c.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white/10 hover:bg-white/20 text-white/80"
                }`}
              >
                {c.cardType === "Credit Card" ? "Credit" : "Debit"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Visual Card Display */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold block">
                BankMate
              </span>
              <span className="text-sm font-bold text-amber-400">
                {pCard.cardName}
              </span>
            </div>
            <Badge
              className={`text-[10px] font-bold ${
                controls.isBlockedTemporarily
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
              }`}
            >
              {controls.isBlockedTemporarily ? "BLOCKED" : "ACTIVE"}
            </Badge>
          </div>

          <div className="my-6">
            <span className="font-mono text-lg tracking-widest font-bold">
              {pCard.cardNumberMasked}
            </span>
          </div>

          <div className="flex justify-between items-end text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                Card Holder
              </span>
              <span className="font-bold tracking-wide">DEEP YADAV</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                Expires
              </span>
              <span className="font-mono font-semibold">{pCard.expiry}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                Network
              </span>
              <span className="font-bold">{pCard.network}</span>
            </div>
          </div>
        </div>

        {/* Credit Card Financial Summary if credit card */}
        {pCard.totalLimit && (
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Total Limit
              </span>
              <span className="font-bold text-foreground mt-0.5 block">
                {formatINR(pCard.totalLimit)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Available Limit
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {formatINR(pCard.availableLimit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Outstanding Due
              </span>
              <span className="font-bold text-destructive mt-0.5 block">
                {formatINR(pCard.outstandingDue || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Sensitive PIN Authorization Prompt */}
        {sensitivePrompt && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/30 text-xs space-y-3 animate-in fade-in zoom-in-95 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    sensitivePrompt.isDestructive
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <KeyRoundIcon className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    {sensitivePrompt.title}
                  </h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                    {sensitivePrompt.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSensitivePrompt(null);
                  setSensitivePin("");
                  setSensitivePinError(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {sensitivePinError && (
              <div className="flex items-center gap-1.5 text-destructive text-[11px] font-medium bg-destructive/10 p-2 rounded-md">
                <AlertTriangleIcon className="size-3.5 shrink-0" />
                <span>{sensitivePinError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="flex-1">
                <Input
                  type="password"
                  maxLength={6}
                  value={sensitivePin}
                  onChange={(e) => {
                    setSensitivePin(e.target.value.replace(/\D/g, ""));
                    setSensitivePinError(null);
                  }}
                  placeholder="Enter 6-digit PIN (Default: 123456)"
                  className="h-9 text-xs font-mono tracking-widest text-foreground bg-background"
                />
                <span className="text-[10px] text-muted-foreground block mt-1">
                  Authorization PIN:{" "}
                  <strong className="font-mono">123456</strong>
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSensitivePrompt(null);
                    setSensitivePin("");
                    setSensitivePinError(null);
                  }}
                  disabled={isProcessing}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmSensitiveAction}
                  disabled={sensitivePin.length < 6 || isProcessing}
                  className={`h-9 text-xs font-semibold px-4 text-white ${
                    sensitivePrompt.isDestructive
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isProcessing ? (
                    <Spinner className="size-3.5 mr-1" />
                  ) : (
                    sensitivePrompt.confirmLabel
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleToggle("contactlessEnabled")}
            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              controls.contactlessEnabled
                ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                : "bg-slate-50 dark:bg-muted/20 border-slate-200 dark:border-border opacity-70"
            }`}
          >
            <div className="flex items-center gap-2">
              <WifiIcon className="size-4 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-bold block">Contactless</span>
                <span className="text-[10px] text-muted-foreground">
                  Tap & Pay
                </span>
              </div>
            </div>
            <Badge
              variant={controls.contactlessEnabled ? "default" : "outline"}
              className="text-[10px]"
            >
              {controls.contactlessEnabled ? "ON" : "OFF"}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => handleToggle("internationalEnabled")}
            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              controls.internationalEnabled
                ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                : "bg-slate-50 dark:bg-muted/20 border-slate-200 dark:border-border opacity-70"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-bold block">International</span>
                <span className="text-[10px] text-muted-foreground">
                  Cross-Border
                </span>
              </div>
            </div>
            <Badge
              variant={controls.internationalEnabled ? "default" : "outline"}
              className="text-[10px]"
            >
              {controls.internationalEnabled ? "ON" : "OFF"}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => handleToggle("isBlockedTemporarily")}
            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
              controls.isBlockedTemporarily
                ? "bg-destructive/10 border-destructive/30"
                : "bg-slate-50 dark:bg-muted/20 border-slate-200 dark:border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              {controls.isBlockedTemporarily ? (
                <LockIcon className="size-4 text-destructive" />
              ) : (
                <UnlockIcon className="size-4 text-emerald-600" />
              )}
              <div>
                <span className="font-bold block">
                  {controls.isBlockedTemporarily
                    ? "Card Blocked"
                    : "Card Active"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Temp Freeze
                </span>
              </div>
            </div>
            <Badge
              variant={
                controls.isBlockedTemporarily ? "destructive" : "outline"
              }
              className="text-[10px]"
            >
              {controls.isBlockedTemporarily ? "FROZEN" : "ACTIVE"}
            </Badge>
          </button>
        </div>

        {/* Reward Points Box (Credit Card) */}
        {controls.rewardPoints > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GiftIcon className="size-4 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {controls.rewardPoints.toLocaleString("en-IN")} Reward Points
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Cashback Value: {formatINR(controls.rewardValue)} (1 pt =
                  ₹0.25)
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRedeemInput(!showRedeemInput)}
              className="text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
            >
              Redeem to Savings
            </Button>
          </div>
        )}

        {/* Reward Points Redemption Drawer */}
        {showRedeemInput && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">
                Redeem Points into Savings Account
              </span>
              <span className="text-[11px] text-muted-foreground">
                PIN: 123456
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Number(e.target.value))}
                placeholder="Points to redeem (e.g. 5000)"
                className="text-xs h-8"
              />
              <Input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit PIN"
                className="text-xs h-8 font-mono tracking-widest w-32"
              />
              <Button
                size="sm"
                onClick={handleRedeem}
                disabled={pin.length < 6 || isProcessing}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isProcessing ? <Spinner className="size-3 mr-1" /> : "Redeem"}
              </Button>
            </div>
          </div>
        )}

        {/* Set Limits Modal / Drawer */}
        {showLimitModal && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border text-xs space-y-3">
            <h5 className="font-bold text-foreground">
              Adjust Daily Transaction Limits
            </h5>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Daily ATM Cash Withdrawal Limit</span>
                  <span className="font-bold">{formatINR(atmLimit)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={controls.atmMaxLimit}
                  step={5000}
                  value={atmLimit}
                  onChange={(e) => setAtmLimit(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Daily POS & Online Limit</span>
                  <span className="font-bold">{formatINR(posLimit)}</span>
                </div>
                <input
                  type="range"
                  min={25000}
                  max={controls.posMaxLimit}
                  step={10000}
                  value={posLimit}
                  onChange={(e) => setPosLimit(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowLimitModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePromptLimitsSave}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                Save Limits
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="px-5 py-3 bg-slate-50 dark:bg-muted/30 border-t border-slate-200/80 dark:border-border flex flex-wrap items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowLimitModal(!showLimitModal)}
          className="text-xs"
        >
          <SlidersIcon className="size-3.5 mr-1" />
          Set ATM & POS Limits
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handlePromptReportLost}
          className="text-xs text-destructive hover:bg-destructive/10"
        >
          <ShieldAlertIcon className="size-3.5 mr-1" />
          Report Lost Card
        </Button>
      </CardFooter>
    </Card>
  );
}
