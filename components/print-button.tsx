"use client";

import React from "react";
import { Download } from "lucide-react";

export function PrintButton() {
  const handleDownload = () => {
    if (typeof window === "undefined") return;

    const previousTitle = document.title;
    document.title = "sicily-malta-rome-travel-guidebook";
    window.print();

    window.setTimeout(() => {
      document.title = previousTitle;
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4A373] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-[#1A434E] shadow-[0_12px_28px_rgba(20,36,36,0.18)] transition hover:bg-[#e2b986] focus:outline-none focus:ring-2 focus:ring-white/70"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      PDF 다운로드
    </button>
  );
}
