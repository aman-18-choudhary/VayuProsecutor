import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CITIES } from "../lib/cities";
import { LiveDot } from "./ui";

/* ── Types ─────────────────────────────────────────────── */
interface NavbarProps {
  city: string;
  onCityChange: (c: string) => void;
  onMenuClick?: () => void;
}

/* ── Clock hook ─────────────────────────────────────────── */
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

/* ── City Selector dropdown ─────────────────────────────── */
function CityDropdown({
  city,
  onCityChange,
}: {
  city: string;
  onCityChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-semibold text-text-primary shadow-sm transition-all hover:border-primary hover:shadow-card"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base">📍</span>
        <span>{city}</span>
        <svg
          className={`h-3.5 w-3.5 text-text-secondary transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-[9999] mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border bg-white shadow-card-xl"
            role="listbox"
          >
            <div className="py-1">
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="option"
                  aria-selected={c.name === city}
                  onClick={() => {
                    onCityChange(c.name);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-4 py-2.5 text-left text-sm font-medium transition-colors",
                    c.name === city
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-text-primary hover:bg-bg-muted",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Logo SVG ───────────────────────────────────────────── */
function Logo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scale of justice */}
        <line x1="12" y1="3" x2="12" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="4" y1="7" x2="20" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 7 L2 13 A3 3 0 0 0 8 13 Z" stroke="white" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        <path d="M20 7 L18 13 A3 3 0 0 0 24 13 Z" stroke="white" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        <line x1="8" y1="18" x2="16" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        {/* Air wave */}
        <path
          d="M3 21.5 C 6 19.5, 9 23, 12 21 S 18 19, 21 21"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ── Notification bell ──────────────────────────────────── */
function NotificationBell() {
  return (
    <button
      type="button"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-card"
      aria-label="Notifications"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {/* Notification badge */}
      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
        3
      </span>
    </button>
  );
}

/* ── Main Navbar ────────────────────────────────────────── */
export function Navbar({ city, onCityChange, onMenuClick }: NavbarProps) {
  const now = useClock();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "border-border bg-white/95 shadow-card backdrop-blur-xl"
          : "border-transparent bg-white/80 backdrop-blur-lg",
      ].join(" ")}
    >
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Hamburger (mobile) + Logo + Brand */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-bg-muted hover:text-text-primary lg:hidden shadow-sm"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="hidden sm:block">
            <Logo />
          </div>
          <div className="leading-tight">
            <h1 className="gradient-text text-base font-extrabold tracking-tight sm:text-lg">
              VayuProsecutor
            </h1>
            <p className="hidden text-[10px] font-medium uppercase tracking-widest text-text-muted sm:block">
              Smart City Command Center
            </p>
          </div>
        </div>

        {/* Center: System status */}
        <div className="hidden items-center gap-6 lg:flex">
          <div className="flex items-center gap-2">
            <LiveDot />
            <span className="text-xs font-medium text-text-secondary">
              All Systems Operational
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span className="font-mono text-xs font-semibold text-text-secondary">
              {formatIST(now)} IST
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-medium text-text-secondary">
            Powered by{" "}
            <span className="font-semibold text-primary">Microsoft DoWhy</span>
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile clock */}
          <span className="font-mono text-xs font-semibold text-text-secondary sm:hidden">
            {formatIST(now)}
          </span>
          <NotificationBell />
          <CityDropdown city={city} onCityChange={onCityChange} />
        </div>
      </div>
    </header>
  );
}
