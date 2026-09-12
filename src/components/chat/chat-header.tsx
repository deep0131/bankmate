"use client";

import { BotIcon, RotateCwIcon } from "lucide-react";
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
  return (
    <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
            <BotIcon className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Bankmate</h1>
            <p className="text-[11px] text-muted-foreground">
              Conversational Banking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
        </div>
      </div>
    </header>
  );
}
