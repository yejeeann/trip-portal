"use client";

import { useState } from "react";

type GuideImageProps = {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fit?: "cover" | "contain";
};

export function GuideImage({
  src,
  alt,
  className = "",
  imageClassName = "",
  fit = "cover"
}: GuideImageProps) {
  const [failed, setFailed] = useState(false);
  const isLocalAsset = Boolean(src?.startsWith("/"));
  const [loaded, setLoaded] = useState(isLocalAsset);
  const showImage = Boolean(src) && !failed;
  const art = getDestinationArt(alt);

  return (
    <div className={`relative overflow-hidden bg-[#E7E1D6] ${className}`} aria-label={alt}>
      <div className={`absolute inset-0 ${art.sky}`} />
      <div className={`absolute inset-x-[-8%] bottom-[-14%] h-[52%] rounded-[50%] ${art.land}`} />
      <div className={`absolute left-[12%] top-[16%] h-14 w-14 rounded-full ${art.sun}`} />
      <div className="absolute bottom-[20%] left-[8%] right-[8%] flex items-end justify-between opacity-80">
        <div className={`h-24 w-[22%] rounded-t-full ${art.shape}`} />
        <div className={`h-36 w-[30%] rounded-t-[45%] ${art.shape}`} />
        <div className={`h-20 w-[18%] rounded-t-full ${art.shape}`} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.42),transparent_30%),linear-gradient(to_top,rgba(23,32,29,0.20),transparent_55%)]" />
      <div className="absolute bottom-3 left-3 rounded-md bg-white/72 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#34413D] backdrop-blur">
        {art.label}
      </div>
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} transition-opacity duration-500 ${
            loaded || isLocalAsset ? "opacity-100" : "opacity-0"
          } ${imageClassName}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
        />
      )}
    </div>
  );
}

function getDestinationArt(value: string) {
  const text = value.toLowerCase();

  if (text.includes("swiss") || text.includes("alps") || text.includes("zermatt") || text.includes("interlaken") || text.includes("jungfrau") || text.includes("chamonix")) {
    return {
      label: "Alpine field image",
      sky: "bg-[linear-gradient(145deg,#b9d8e8_0%,#f7f4ee_58%,#bfcfbe_100%)]",
      land: "bg-[#7E9781]",
      sun: "bg-[#F6D7A7]",
      shape: "bg-[#EFF6F4]"
    };
  }

  if (text.includes("malta") || text.includes("valletta") || text.includes("gozo") || text.includes("harbor")) {
    return {
      label: "Harbor guide image",
      sky: "bg-[linear-gradient(145deg,#acd8dd_0%,#f5dcc4_55%,#d99b72_100%)]",
      land: "bg-[#C8A46A]",
      sun: "bg-[#FFF1B7]",
      shape: "bg-[#F7E6C7]"
    };
  }

  if (text.includes("rome") || text.includes("sicily") || text.includes("catania") || text.includes("taormina") || text.includes("syracuse") || text.includes("amalfi")) {
    return {
      label: "Mediterranean guide image",
      sky: "bg-[linear-gradient(145deg,#8FC8C7_0%,#F4D7B3_56%,#D96C4A_100%)]",
      land: "bg-[#B9925A]",
      sun: "bg-[#FFE4A6]",
      shape: "bg-[#F1E0C2]"
    };
  }

  if (text.includes("venice") || text.includes("lagoon")) {
    return {
      label: "Lagoon guide image",
      sky: "bg-[linear-gradient(145deg,#A8C7C7_0%,#F7E8D6_52%,#B97F62_100%)]",
      land: "bg-[#8AA2A1]",
      sun: "bg-[#F8D9A5]",
      shape: "bg-[#E8D2B2]"
    };
  }

  return {
    label: "Travel guide image",
    sky: "bg-[linear-gradient(135deg,#D9EEE9_0%,#F6F0E6_48%,#E8C7B6_100%)]",
    land: "bg-[#B9B99A]",
    sun: "bg-[#F1C982]",
    shape: "bg-[#F7F4EE]"
  };
}
