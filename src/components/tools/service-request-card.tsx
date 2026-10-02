"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  BanIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  KeyRoundIcon,
  MessageSquarePlusIcon,
  SendIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { serviceRequestTool } from "@/lib/ai/tools";
import { useBankStore, validateTransactionPin } from "@/lib/bank-store";
import type { ServiceRequest, ServiceRequestStatus } from "@/types/banking";

export type ServiceRequestCardProps = UIToolInvocation<
  typeof serviceRequestTool
>;

function getStatusBadgeClass(status: ServiceRequestStatus) {
  switch (status) {
    case "Resolved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300";
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300";
    case "In Review":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-300";
    case "Escalated":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300";
    case "Cancelled":
      return "bg-slate-200 text-slate-700 dark:bg-muted dark:text-muted-foreground border-slate-300";
    default:
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300";
  }
}

export function ServiceRequestCard(props: ServiceRequestCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const {
    serviceRequests,
    cancelServiceRequest,
    escalateServiceRequest,
    updateServiceRequest,
  } = useBankStore();

  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(
    null,
  );
  const [updateText, setUpdateText] = useState("");
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sensitive PIN prompt state for cancellation and escalation
  const [pinPrompt, setPinPrompt] = useState<{
    action: "cancel" | "escalate";
    requestId: string;
    title: string;
    description: string;
  } | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Processing service request...
            </p>
            <p className="text-xs text-muted-foreground">
              Connecting to core banking service desk & CRM ticketing system
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
              Service Request Query Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText ||
                "Could not retrieve or process service request details."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine what to display: single serviceRequest or list
  const singleReq = output?.serviceRequest as ServiceRequest | undefined;
  const requestList =
    (output?.requests as ServiceRequest[] | undefined) ||
    (singleReq ? [singleReq] : serviceRequests);

  const displayedRequests = requestList.map((r) => {
    // Re-sync with live store state
    const live = serviceRequests.find((sr) => sr.requestId === r.requestId);
    return live || r;
  });

  const handleEscalate = (id: string, reqTitle: string) => {
    setPin("");
    setPinError(null);
    setPinPrompt({
      action: "escalate",
      requestId: id,
      title: `Authorize Priority Escalation for ${id}`,
      description: `Enter 6-digit transaction PIN to escalate "${reqTitle}" to Principal Nodal Officer for immediate 24h resolution.`,
    });
  };

  const handleCancel = (id: string, reqTitle: string) => {
    setPin("");
    setPinError(null);
    setPinPrompt({
      action: "cancel",
      requestId: id,
      title: `Authorize Cancellation of ${id}`,
      description: `Enter 6-digit transaction PIN to permanently cancel service request "${reqTitle}".`,
    });
  };

  const handleConfirmPinAction = () => {
    if (!validateTransactionPin(pin)) {
      setPinError("Incorrect 6-digit transaction PIN. (Default PIN: 123456)");
      return;
    }
    if (!pinPrompt) return;

    setIsProcessing(true);
    setPinError(null);

    setTimeout(() => {
      if (pinPrompt.action === "cancel") {
        const res = cancelServiceRequest(
          pinPrompt.requestId,
          "Customer authorized cancellation via transaction PIN",
        );
        if (res.success) {
          setFeedback(`Request ${pinPrompt.requestId} has been cancelled.`);
        }
      } else if (pinPrompt.action === "escalate") {
        const res = escalateServiceRequest(
          pinPrompt.requestId,
          "Customer authorized priority escalation to Nodal Officer via transaction PIN",
        );
        if (res.success) {
          setFeedback(
            `Request ${pinPrompt.requestId} has been escalated to Urgent priority with the Nodal Officer.`,
          );
        }
      }
      setIsProcessing(false);
      setPinPrompt(null);
      setPin("");
      setTimeout(() => setFeedback(null), 4000);
    }, 600);
  };

  const handleAddUpdate = (id: string) => {
    if (!updateText.trim()) return;
    const res = updateServiceRequest(id, undefined, updateText.trim());
    if (res.success) {
      setUpdateText("");
      setActiveReqId(null);
      setFeedback("Customer update added to the request audit trail.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-3">
      {feedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {displayedRequests.length === 0 ? (
        <Card className="p-8 text-center border-slate-200 dark:border-border">
          <HeadphonesIcon className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-foreground">
            No active service requests
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You currently have no open complaints or service tickets with
            BankMate.
          </p>
        </Card>
      ) : (
        displayedRequests.map((req) => {
          const isExpanded = expandedTimelineId === req.requestId;
          const isAddingUpdate = activeReqId === req.requestId;

          // SLA calculation
          const slaDate = new Date(req.slaDeadline);
          const now = new Date();
          const msRemaining = slaDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
          const isDelayed = msRemaining < 0;

          return (
            <Card
              key={req.requestId}
              className="border border-slate-200 dark:border-border shadow-md bg-card overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-muted/40 border-b border-slate-200/80 dark:border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono font-bold"
                  >
                    {req.requestId}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    • {req.requestType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-semibold border ${getStatusBadgeClass(req.status)}`}
                  >
                    {req.status}
                  </Badge>
                  {req.isEscalated && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      ESCALATED
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground leading-snug">
                    {req.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-200/60 dark:border-border/60 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Department
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {req.department}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Assigned Officer
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {req.assignedEmployee.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      SLA Target
                    </span>
                    <span
                      className={`font-semibold block ${
                        isDelayed
                          ? "text-destructive"
                          : daysRemaining <= 1
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                      }`}
                    >
                      {isDelayed
                        ? "Breached / Delayed"
                        : `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Reference
                    </span>
                    <span className="font-mono text-[11px] text-foreground truncate block">
                      {req.referenceNumber || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Timeline / Updates Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Audit Timeline ({req.customerUpdates.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTimelineId(isExpanded ? null : req.requestId)
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          Hide Timeline <ChevronUpIcon className="size-3" />
                        </>
                      ) : (
                        <>
                          Show Timeline <ChevronDownIcon className="size-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Always show latest update */}
                  {req.customerUpdates.length > 0 && !isExpanded && (
                    <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-semibold mb-1">
                        <span>
                          Latest Update:{" "}
                          {
                            req.customerUpdates[req.customerUpdates.length - 1]
                              .author
                          }
                        </span>
                        <span>
                          {new Date(
                            req.customerUpdates[req.customerUpdates.length - 1]
                              .timestamp,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {
                          req.customerUpdates[req.customerUpdates.length - 1]
                            .message
                        }
                      </p>
                    </div>
                  )}

                  {/* Expanded full timeline */}
                  {isExpanded && (
                    <div className="border-l-2 border-blue-500/40 ml-2 pl-3 py-1 space-y-3">
                      {req.customerUpdates.map((update) => (
                        <div
                          key={`${update.timestamp}-${update.author}`}
                          className="relative text-xs"
                        >
                          <div className="absolute -left-[19px] top-1 size-2 rounded-full bg-blue-600 ring-2 ring-background" />
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {update.author}
                            </span>
                            <span>
                              {new Date(update.timestamp).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {update.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add customer message box */}
                {isAddingUpdate && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Add a note or message for the assigned team
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        placeholder="e.g. Please expedite dispatch, traveling next week..."
                        className="text-xs h-8"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddUpdate(req.requestId)}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <SendIcon className="size-3 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
                {/* PIN Authorization Box */}
                {pinPrompt?.requestId === req.requestId && (
                  <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/30 text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <KeyRoundIcon className="size-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-foreground block">
                            {pinPrompt.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground block leading-tight">
                            {pinPrompt.description}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPinPrompt(null);
                          setPin("");
                          setPinError(null);
                        }}
                        className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>

                    {pinError && (
                      <span className="text-destructive text-[11px] font-medium block">
                        {pinError}
                      </span>
                    )}

                    <div className="flex gap-2">
                      <Input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ""));
                          setPinError(null);
                        }}
                        placeholder="PIN: 123456"
                        className="h-8 text-xs font-mono tracking-widest bg-background"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPinPrompt(null);
                          setPin("");
                          setPinError(null);
                        }}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmPinAction}
                        disabled={pin.length < 6 || isProcessing}
                        className={`h-8 text-xs font-semibold px-4 text-white ${
                          pinPrompt.action === "cancel"
                            ? "bg-destructive hover:bg-destructive/90"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {isProcessing ? (
                          <Spinner className="size-3 mr-1" />
                        ) : pinPrompt.action === "cancel" ? (
                          "Confirm Cancel"
                        ) : (
                          "Confirm Escalate"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Card Footer Actions */}
              <CardFooter className="px-5 py-3 bg-slate-50 dark:bg-muted/30 border-t border-slate-200/80 dark:border-border flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setActiveReqId(isAddingUpdate ? null : req.requestId)
                  }
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                >
                  <MessageSquarePlusIcon className="size-3.5 mr-1" />
                  {isAddingUpdate ? "Cancel Note" : "Add Note / Update"}
                </Button>

                <div className="flex items-center gap-1.5 ml-auto">
                  {req.status !== "Resolved" && req.status !== "Cancelled" && (
                    <>
                      {!req.isEscalated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleEscalate(req.requestId, req.title)
                          }
                          className="text-xs text-amber-700 dark:text-amber-400 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        >
                          <ShieldAlertIcon className="size-3.5 mr-1" />
                          Escalate
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(req.requestId, req.title)}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        <BanIcon className="size-3.5 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })
      )}
    </div>
  );
}
