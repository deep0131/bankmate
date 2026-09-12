"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { BankProfileModal } from "@/components/profile/bank-profile-modal";

export function FloatingAssistantSphere() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 hidden sm:block">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group relative flex items-center justify-center size-13 rounded-full cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl focus:outline-none"
          style={{
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #06B6D4 100%)",
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.45), 0 8px 10px -6px rgba(6, 182, 212, 0.3)",
          }}
          title="Open Deep Yadav Bank Profile"
          aria-label="Open Bank Profile"
        >
          {/* Outer glowing pulsing ring */}
          <span className="absolute -inset-1 rounded-full bg-blue-500/20 animate-ping opacity-60 pointer-events-none"></span>

          {/* Inner concentric ring matching the reference screenshot */}
          <div className="size-7 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 backdrop-blur-xs">
            {/* Center dot/sparkle */}
            <div className="size-3 rounded-full bg-white shadow-sm"></div>
          </div>
        </button>
      </div>

      <BankProfileModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
