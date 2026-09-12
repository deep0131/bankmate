"use client";

import { ArrowUpIcon, PaperclipIcon, MicIcon, BookOpenIcon, SquareIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isBusy: boolean;
  onStop: () => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isBusy,
  onStop,
}: ChatInputProps) {
  const charCount = input.length;
  const maxChars = 3000;

  return (
    <footer className="shrink-0 p-4">
      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={onSubmit} className="w-full">
          <InputGroup>
            <InputGroupTextarea
              aria-label="Chat input"
              placeholder="Ask BankMate about balances, statements, loans..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              maxLength={maxChars}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--nav-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <PaperclipIcon className="size-3.5" />
                  Attach
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--nav-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <MicIcon className="size-3.5" />
                  Voice Message
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--nav-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <BookOpenIcon className="size-3.5" />
                  Browse Prompts
                </button>
              </div>

              {/* Char count + send */}
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {charCount} / {maxChars.toLocaleString()}
                </span>
                {isBusy ? (
                  <InputGroupButton
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={onStop}
                    aria-label="Stop generating"
                  >
                    <SquareIcon className="fill-current" />
                  </InputGroupButton>
                ) : (
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    disabled={!input.trim()}
                  >
                    <ArrowUpIcon />
                    <span className="sr-only">Send</span>
                  </InputGroupButton>
                )}
              </div>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <div className="mt-2 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          BankMate may generate inaccurate information about transactions or rates. Model: Gemini Flash
        </div>
      </div>
    </footer>
  );
}
