"use client";

import React from "react";

export function PrintButton() {
  return (
    <button
      onClick={() => typeof window !== "undefined" && window.print()}
      className="mt-2 px-4 py-2 bg-blue-500 rounded text-white"
    >
      PDF로 인쇄/저장
    </button>
  );
}
