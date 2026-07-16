import React, { useEffect, useState } from "react";
import { CitySelector } from "./CitySelector";

function useClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatIST(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Scales of justice */}
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="34"
        stroke="#C0392B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="14"
        x2="38"
        y2="14"
        stroke="#C0392B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="8" r="2.5" fill="#C0392B" />
      {/* Left pan */}
      <path
        d="M10 14 L6 22 A5 5 0 0 0 14 22 Z"
        stroke="#C0392B"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Right pan */}
      <path
        d="M38 14 L34 22 A5 5 0 0 0 42 22 Z"
        stroke="#C0392B"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Base */}
      <line
        x1="17"
        y1="34"
        x2="31"
        y2="34"
        stroke="#C0392B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Air / wave curve */}
      <path
        d="M6 40 C 12 36, 18 44, 24 40 S 36 36, 42 40"
        stroke="#00D4FF"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 45 C 14 42, 20 48, 26 45 S 38 42, 44 45"
        stroke="#00D4FF"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Navbar({
  city,
  onCityChange,
}: {
  city: string;
  onCityChange: (c: string) => void;
}) {
  const now = useClock();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <h1 className="bg-gradient-to-r from-crimson via-crimson-light to-amber bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-xl">
              VayuProsecutor
            </h1>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:block">
              Causal Air Quality Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson-light" />
            </span>
            <span className="font-mono text-sm font-semibold text-teal">
              {formatIST(now)} IST
            </span>
          </div>
          <CitySelector city={city} onCityChange={onCityChange} />
        </div>
      </div>
    </header>
  );
}
