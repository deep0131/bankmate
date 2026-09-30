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
} from "lucide-react";
import { useState } from "react";
import {
  BankProfileModal,
  type TabType,
} from "@/components/profile/bank-profile-modal";
import { useBankStore, formatINR } from "@/lib/bank-store";
import type { bankProfileTool } from "@/lib/ai/tools";

export type BankProfileWidgetProps = UIToolInvocation<typeof bankProfileTool>;

export function UserProfileWidget(_props: BankProfileWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<TabType>("accounts");
  const { profile } = useBankStore();

  return (
    <div className="w-full my-1">
      <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card overflow-hidden shadow-2xs transition-all">
        {/* Top Header Section */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="size-12 rounded-2xl flex items-center justify-center text-base font-bold text-white shadow-xs shrink-0"
              style={{
                backgroundColor: "#1D4ED8",
              }}
            >
              {profile.personal.avatarInitials}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                {profile.personal.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                CIF:{" "}
                <strong className="font-bold text-slate-900 dark:text-slate-100">
                  {profile.personal.cifNumber}
                </strong>
              </p>
            </div>

            {/* KYC Status Badge */}
            <div className="flex items-center gap-1.5 ml-2 sm:ml-4">
              <span className="text-xs text-slate-400">•</span>
              <ShieldCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                KYC Verified
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => {
                setModalTab("transactions");
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-border bg-white dark:bg-secondary/70 hover:bg-slate-50 dark:hover:bg-secondary text-slate-800 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1D4ED8] hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <span>View Profile</span>
              <ExternalLinkIcon className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Financial Snapshot Stat Cards */}
        <div className="px-4 sm:px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Savings Balance */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border/80 bg-slate-50/90 dark:bg-secondary/60 flex flex-col justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <LandmarkIcon className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">Savings Bal...</span>
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.accounts[0].availableBalance)}
            </p>
            <span className="text-[11px] text-slate-400 font-mono truncate whitespace-nowrap">
              A/C •••• 8842
            </span>
          </div>

          {/* Credit Available */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border/80 bg-slate-50/90 dark:bg-secondary/60 flex flex-col justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <CreditCardIcon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Credit Avail...</span>
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.cards[0].availableLimit || 0)}
            </p>
            <span className="text-[11px] text-slate-400 font-mono truncate whitespace-nowrap">
              Limit: {formatINR(profile.cards[0].totalLimit || 0)}
            </span>
          </div>

          {/* Fixed Deposits */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border/80 bg-slate-50/90 dark:bg-secondary/60 flex flex-col justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <TrendingUpIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Fixed Depos...</span>
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums tracking-tight">
              {formatINR(profile.wealth.fixedIncome)}
            </p>
            <span className="text-[11px] text-slate-400 font-mono truncate whitespace-nowrap">
              2 Active (Up to 7.3...
            </span>
          </div>

          {/* CIBIL Score */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border/80 bg-slate-50/90 dark:bg-secondary/60 flex flex-col justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <SparklesIcon className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="truncate">CIBIL Score</span>
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap tabular-nums tracking-tight">
              {profile.wealth.creditScore.score}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate whitespace-nowrap">
              Prime Tier (Excell...
            </span>
          </div>
        </div>

        {/* Footer Quick Info */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Branch:{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {profile.accounts[0].branch}
            </strong>{" "}
            (IFSC: {profile.accounts[0].ifsc})
          </span>
          <span>
            RM:{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {profile.personal.relationshipManager.name}
            </strong>
          </span>
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
