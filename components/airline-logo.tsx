"use client";

import Image from "next/image";

type AirlineLogoProps = {
  code?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

type AirlineLogoInfo = {
  code: string;
  name: string;
  src: string;
};

const AIRLINE_LOGOS: AirlineLogoInfo[] = [
  { code: "AY", name: "Finnair", src: "/airline-logos/finnair.svg" },
  { code: "FR", name: "Ryanair", src: "/airline-logos/ryanair.svg" },
  { code: "QR", name: "Qatar Airways", src: "/airline-logos/qatar-airways.svg" }
];

const SIZE_CONFIG = {
  sm: { box: "h-8 w-16 rounded-md px-1.5", imageWidth: 64, imageHeight: 32, text: "text-xs" },
  md: { box: "h-12 w-24 rounded-md px-2", imageWidth: 96, imageHeight: 48, text: "text-sm" },
  lg: { box: "h-14 w-28 rounded-lg px-3", imageWidth: 112, imageHeight: 56, text: "text-base" }
} as const;

export function getAirlineLogoInfo(code?: string, name?: string) {
  const normalizedCode = code?.trim().toUpperCase();
  const normalizedName = name?.trim().toLowerCase();

  return AIRLINE_LOGOS.find((logo) => {
    return logo.code === normalizedCode || normalizedName?.includes(logo.name.toLowerCase());
  });
}

export function AirlineLogo({ code, name, size = "md", className = "" }: AirlineLogoProps) {
  const config = SIZE_CONFIG[size];
  const logo = getAirlineLogoInfo(code, name);
  const label = logo?.name ?? name ?? code ?? "Airline";

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-field-line bg-white shadow-sm ${config.box} ${className}`}
      title={label}
      aria-label={`${label} logo`}
    >
      {logo ? (
        <Image
          src={logo.src}
          alt={`${logo.name} logo`}
          width={config.imageWidth}
          height={config.imageHeight}
          className="max-h-full w-full object-contain"
          unoptimized
        />
      ) : (
        <span className={`font-black text-field-forest ${config.text}`}>{code || "AIR"}</span>
      )}
    </div>
  );
}
