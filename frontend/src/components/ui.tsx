import React from "react";
import { motion } from "framer-motion";

/* ─── Shared animation variants ──────────────────────────── */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

/* ─── Card ──────────────────────────────────────────────── */
export function Card({
  children,
  className = "",
  glow,
  hover = true,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  hover?: boolean;
  padding?: boolean;
}) {
  return (
    <div
      className={[
        "bg-white/90 backdrop-blur-md rounded-3xl border border-white/40",
        "shadow-card",
        hover ? "card-hover" : "",
        padding ? "p-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...glow ? { boxShadow: glow } : {},
        boxShadow: "inset 0 1px 0 rgba(255,255,255,1), " + (glow ? glow : "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)")
      }}
    >
      {children}
    </div>
  );
}

/* ─── Motion Card ───────────────────────────────────────── */
export function MotionCard({
  children,
  className = "",
  delay = 0,
  glow,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glow?: string;
  padding?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "bg-white/90 backdrop-blur-md rounded-3xl border border-white/40 shadow-card card-hover",
        padding ? "p-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...glow ? { boxShadow: glow } : {},
        boxShadow: "inset 0 1px 0 rgba(255,255,255,1), " + (glow ? glow : "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)")
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────── */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/* ─── Section header ─────────────────────────────────────── */
export function SectionTitle({
  children,
  icon,
  action,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
          {children}
        </span>
      </div>
      {action}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────── */
export function Badge({
  children,
  variant = "default",
  size = "sm",
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
  size?: "xs" | "sm";
}) {
  const styles = {
    default:  "bg-gray-100 text-gray-700",
    primary:  "bg-primary/10 text-primary",
    success:  "bg-success/10 text-success",
    warning:  "bg-warning/10 text-warning",
    danger:   "bg-danger/10 text-danger",
    outline:  "border border-border text-text-secondary bg-white",
  };
  const sizes = {
    xs: "text-[10px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-1",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${styles[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}

/* ─── KPI value with animated count-up ──────────────────── */
export function KPIValue({
  value,
  unit,
  color,
  size = "3xl",
}: {
  value: number | string;
  unit?: string;
  color?: string;
  size?: "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`font-display font-extrabold leading-none tracking-tight text-${size}`}
      style={color ? { color } : undefined}
    >
      {value}
      {unit && (
        <span className="ml-1 text-base font-semibold text-text-secondary">
          {unit}
        </span>
      )}
    </motion.div>
  );
}

/* ─── Animated progress bar ──────────────────────────────── */
export function ProgressBar({
  value,
  max = 100,
  color = "#6366F1",
  height = 6,
  delay = 0,
  showLabel = false,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  delay?: number;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 overflow-hidden rounded-full bg-bg-muted"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-text-primary">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

/* ─── Live indicator dot ─────────────────────────────────── */
export function LiveDot({ color = "#22C55E" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

/* ─── Gradient button ────────────────────────────────────── */
export function GradientButton({
  children,
  onClick,
  className = "",
  icon,
  size = "md",
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "danger" | "outline";
  disabled?: boolean;
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-8 py-3.5",
  };
  const variants = {
    primary:
      "bg-gradient-brand text-white hover:shadow-glow-primary hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:ring-primary",
    danger:
      "bg-gradient-danger text-white hover:shadow-glow-danger hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:ring-danger",
    outline:
      "border border-border bg-white text-text-primary hover:border-primary/50 hover:bg-bg-muted/50 focus-visible:ring-primary",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── Divider ────────────────────────────────────────────── */
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-border ${className}`} />;
}

/* ─── Stat row ───────────────────────────────────────────── */
export function StatRow({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-semibold text-text-primary">
          {value}
          {unit && <span className="ml-0.5 text-xs text-text-secondary">{unit}</span>}
        </span>
        {trend === "up" && <span className="text-xs text-danger">↑</span>}
        {trend === "down" && <span className="text-xs text-success">↓</span>}
      </div>
    </div>
  );
}
