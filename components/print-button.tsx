"use client";

import React from "react";
import { Download } from "lucide-react";

export function PrintButton() {
  const handleDownload = () => {
    if (typeof window === "undefined") return;

    const previousTitle = document.title;
    document.title = "Sicily & Malta Travel Guide · May 2026";
    window.print();

    window.setTimeout(() => {
      document.title = previousTitle;
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="group inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d8c5ae] bg-white/72 px-3.5 pr-4 text-[12px] font-extrabold text-[#1A434E] shadow-[0_8px_20px_rgba(55,42,32,0.08)] transition hover:-translate-y-0.5 hover:border-[#c99a68] hover:bg-white hover:shadow-[0_14px_26px_rgba(55,42,32,0.12)] focus:outline-none focus:ring-2 focus:ring-[#d4a373]/45"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A434E] text-[#F7F1E8] transition group-hover:bg-[#9B6B43]">
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      PDF 다운로드
    </button>
  );
}
