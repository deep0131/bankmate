"use client";

import type { UIToolInvocation } from "ai";
import {
  CreditCardIcon,
  ExternalLinkIcon,
  LandmarkIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { BankProfileModal, type TabType } from "@/components/profile/bank-profile-modal";
import { useBankStore, formatINR } from "@/lib/bank-store";
import type { bankProfileTool } from "@/lib/ai/tools";

export type BankProfileWidgetProps = UIToolInvocation<typeof bankProfileTool>;

export function UserProfileWidget(props: BankProfileWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<TabType>("accounts");
  const { profile } = useBankStore();
  const view = props.input?.view || "overview";

  return (
    <div className="w-full my-3">
      <div
        className="rounded-2xl border overflow-hidden shadow-sm transition-all"
        style={{
          borderColor: "var(--panel-border)",
          backgroundColor: "var(--card)",
        }}
      >
        {/* Top Gradient Banner */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(79,70,229,0.06) 100%)",
            borderBottom: "1px solid var(--panel-border)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="size-12 rounded-xl flex items-center justify-center text-base font-bold text-white shadow-md shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
              }}
            >
              {profile.personal.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {profile.personal.fullName}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  {profile.personal.tier}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>CIF: <strong className="font-mono text-foreground">{profile.personal.cifNumber}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                  <ShieldCheckIcon className="size-3" /> KYC Verified
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalTab("transactions");
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-muted/50 cursor-pointer"
              style={{ borderColor: "var(--panel-border)", color: "var(--foreground)" }}
            >
              <ReceiptIcon className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Recent Transactions</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab("accounts");
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              <span>View Profile</span>
              <ExternalLinkIcon className="size-3" />
            </button>
          </div>
        </div>

        {/* Snapshot Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            className="p-3 rounded-xl border min-w-0 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 min-w-0">
              <LandmarkIcon className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">Savings Balance</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-foreground whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.accounts[0].availableBalance)}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono truncate mt-1 whitespace-nowrap">
              A/C •••• 8842
            </span>
          </div>

          <div
            className="p-3 rounded-xl border min-w-0 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 min-w-0">
              <CreditCardIcon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Credit Available</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.cards[0].availableLimit || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono truncate mt-1 whitespace-nowrap">
              Limit: {formatINR(profile.cards[0].totalLimit || 0)}
            </span>
          </div>

          <div
            className="p-3 rounded-xl border min-w-0 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 min-w-0">
              <TrendingUpIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Fixed Deposits</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-foreground whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.wealth.fixedIncome)}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono truncate mt-1 whitespace-nowrap">
              2 Active (Up to 7.3%)
            </span>
          </div>

          <div
            className="p-3 rounded-xl border min-w-0 flex flex-col justify-between"
            style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--toggle-bg)" }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 min-w-0">
              <SparklesIcon className="size-3.5 text-amber-500 shrink-0" />
              <span className="truncate">CIBIL Score</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap tabular-nums tracking-tight">
              {profile.wealth.creditScore.score}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-1 whitespace-nowrap">
              Prime Tier ({profile.wealth.creditScore.rating})
            </span>
          </div>
        </div>

        {/* Footer Quick Info */}
        <div
          className="px-4 py-2.5 border-t flex flex-wrap items-center justify-between text-xs"
          style={{ borderColor: "var(--panel-border)", color: "var(--muted-foreground)" }}
        >
          <span>Branch: <strong className="text-foreground">{profile.accounts[0].branch}</strong> (IFSC: {profile.accounts[0].ifsc})</span>
          <span>RM: <strong className="text-foreground">{profile.personal.relationshipManager.name}</strong></span>
        </div>
      </div>

      {/* Full Modal */}
      <BankProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />
    </div>
  );
}
