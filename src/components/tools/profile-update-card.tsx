"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  LockIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { customerProfileUpdateTool } from "@/lib/ai/tools";
import {
  executeCreateServiceRequest,
  getLiveProfile,
  saveLiveProfile,
  validateTransactionPin,
} from "@/lib/bank-store";

export type ProfileUpdateCardProps = UIToolInvocation<
  typeof customerProfileUpdateTool
>;

export function ProfileUpdateCard(props: ProfileUpdateCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [auditRef, setAuditRef] = useState<string | null>(null);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Retrieving profile records...
            </p>
            <p className="text-xs text-muted-foreground">
              Validating customer identification profile and KYC compliance
              state
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "output-error" || state === "output-denied") {
    return (
      <Card className="w-full max-w-xl border-destructive/40 bg-destructive/5 shadow-md">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertTriangleIcon className="size-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Profile Action Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Action could not be completed."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const action = output?.action || "view_info";
  const fieldName = output?.fieldName || "Profile Information";
  const currentValue = output?.currentValue || "Current Record";
  const requestedValue = output?.requestedValue || "";
  const requiresServiceRequest = output?.requiresServiceRequest || false;

  const handleConfirmUpdate = () => {
    if (!validateTransactionPin(pin)) {
      setStatus("error");
      setErrorMessage(
        "Incorrect 6-digit transaction PIN. (Default PIN: 123456)",
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    setTimeout(() => {
      const p = getLiveProfile();
      const ref = `AUDIT-PRF-${Date.now().toString().slice(-6)}`;

      if (action === "update_phone" && requestedValue) {
        p.personal.phone = requestedValue;
      } else if (action === "update_email" && requestedValue) {
        p.personal.email = requestedValue;
      } else if (action === "update_address" && requestedValue) {
        p.personal.communicationAddress.line1 = requestedValue;
      } else if (action === "update_nominee" && requestedValue) {
        p.security.nominee.name = requestedValue;
      } else if (action === "verify_pan") {
        p.personal.kycStatus = "Verified";
      } else if (action === "start_rekyc") {
        p.personal.reKycDue = "2029-08-15";
      }

      saveLiveProfile(p);

      if (requiresServiceRequest) {
        executeCreateServiceRequest({
          requestType:
            action === "update_address"
              ? "Address update"
              : action === "update_phone"
                ? "Registered mobile-number change"
                : action === "update_email"
                  ? "Email-address change"
                  : action === "update_nominee"
                    ? "Nominee update"
                    : "KYC update",
          title: `Customer Data Change: ${fieldName}`,
          description: `Customer requested update from '${currentValue}' to '${requestedValue}'. Customer authorization completed.`,
          department: "Central Verification & Compliance",
          priority: "Medium",
          referenceNumber: ref,
        });
      }

      setAuditRef(ref);
      setIsProcessing(false);
      setStatus("success");
    }, 700);
  };

  return (
    <Card className="w-full max-w-xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <UserCheckIcon className="size-4 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-100">
                Customer Information Management
              </span>
              <h3 className="text-base font-bold leading-tight">{fieldName}</h3>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/20 text-[10px] font-bold">
            TRANSACTION AUTHORIZATION
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {status === "success" ? (
          <div className="space-y-3 py-2 text-center">
            <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2Icon className="size-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {fieldName} Successfully Updated!
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your profile records and local storage state have been updated
              instantly.
              {requiresServiceRequest &&
                " An official compliance service request has also been logged for bank records."}
            </p>
            {auditRef && (
              <Badge variant="outline" className="font-mono text-xs mt-1">
                Audit Ref: {auditRef}
              </Badge>
            )}
          </div>
        ) : (
          <>
            {/* Current vs Requested Value Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border text-xs">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Current Registered Value
                </span>
                <span className="font-bold text-foreground mt-1 block truncate">
                  {currentValue}
                </span>
              </div>

              {requestedValue && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs">
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-medium">
                    New Requested Value
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-100 mt-1 block truncate">
                    {requestedValue}
                  </span>
                </div>
              )}
            </div>

            {/* Verification Notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/60 dark:border-border text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Enter your 6-digit transaction PIN (<strong>123456</strong>) to
                authorize updating this account record.
              </span>
            </div>

            {/* Error Feedback */}
            {status === "error" && errorMessage && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertTriangleIcon className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PIN Input Row */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex-1">
                <LockIcon className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN (123456)"
                  className="pl-9 text-xs h-9 tracking-widest font-mono"
                />
              </div>

              <Button
                onClick={handleConfirmUpdate}
                disabled={pin.length < 6 || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Spinner className="size-3 mr-1" />
                    Updating...
                  </>
                ) : (
                  <>Confirm Update</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
