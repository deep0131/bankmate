"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center h-9 rounded-full p-1 w-full" style={{ backgroundColor: "var(--toggle-bg)" }}>
        <div className="flex-1 h-full rounded-full" />
        <div className="flex-1 h-full rounded-full" />
      </div>
    );
  }

  const isLight = theme === "light";

  return (
    <div
      className="flex items-center h-9 rounded-full p-1 w-full cursor-pointer select-none"
      style={{ backgroundColor: "var(--toggle-bg)" }}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className="flex items-center justify-center gap-1.5 flex-1 h-full rounded-full text-xs font-medium transition-all duration-200"
        style={{
          backgroundColor: isLight ? "var(--toggle-active)" : "transparent",
          color: isLight ? "var(--foreground)" : "var(--muted-foreground)",
          boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <SunIcon className="size-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className="flex items-center justify-center gap-1.5 flex-1 h-full rounded-full text-xs font-medium transition-all duration-200"
        style={{
          backgroundColor: !isLight ? "var(--toggle-active)" : "transparent",
          color: !isLight ? "var(--foreground)" : "var(--muted-foreground)",
          boxShadow: !isLight ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <MoonIcon className="size-3.5" />
        Dark
      </button>
    </div>
  );
}
