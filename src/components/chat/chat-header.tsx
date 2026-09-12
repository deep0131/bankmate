"use client";

import { HelpCircleIcon, RotateCwIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { BankProfileModal } from "@/components/profile/bank-profile-modal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  hasMessages: boolean;
  isBusy: boolean;
  onReset: () => void;
}

export function ChatHeader({ hasMessages, isBusy, onReset }: ChatHeaderProps) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <>
      <header
        className="shrink-0 border rounded-sm shadow-xs px-5 h-14 flex items-center justify-between w-full"
        style={{
          backgroundColor: "var(--panel-bg)",
          borderColor: "var(--panel-border)",
        }}
      >
        <div className="flex items-center gap-2.5 m-0 p-0">
          <h1
            className="text-base font-bold tracking-tight m-0 p-0 leading-none"
            style={{ color: "var(--foreground)", margin: 0 }}
          >
            AI Chat
          </h1>
          <span
            className="hidden md:inline-flex items-center justify-center h-5.5 px-2.5 rounded-md text-[11px] font-semibold leading-none bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap"
            style={{ margin: 0 }}
          >
            BankMate v1.3
          </span>
        </div>

          <div className="flex items-center gap-2.5">
            {hasMessages && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Reset conversation"
                      onClick={onReset}
                      disabled={isBusy}
                    >
                      <RotateCwIcon />
                    </Button>
                  }
                />
                <TooltipContent>
                  <p>Reset conversation</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Premier Wealth Tier Pill (matching Upgrade pill in reference screenshot) */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-transform duration-150 hover:scale-105"
              style={{
                backgroundColor: "#0F172A",
              }}
            >
              <SparklesIcon className="size-3 text-amber-400" />
              <span>Premier Wealth</span>
            </button>

            {/* Profile Avatar button */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform duration-150 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
              }}
              title="Deep Yadav Profile"
            >
              DY
            </button>
          </div>
      </header>

      <BankProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
