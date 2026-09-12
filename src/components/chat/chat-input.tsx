"use client";

import { ArrowUpIcon, SquareIcon } from "lucide-react";
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
  return (
    <footer className="shrink-0 p-4">
      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={onSubmit} className="w-full">
          <InputGroup>
            <InputGroupTextarea
              aria-label="Chat input"
              placeholder="Ask Bankmate about balances, statements, loans..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />
            <InputGroupAddon align="block-end" className="justify-end">
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
            </InputGroupAddon>
          </InputGroup>
        </form>
        <div className="mt-2 text-center text-[11px] text-muted-foreground">
          Bankmate AI is read-only. Financial calculations & widgets execute
          securely on your client.
        </div>
      </div>
    </footer>
  );
}
