import React from "react";

export function Card({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm shadow-black/5 ${
        className ?? ""
      }`}
      style={glow ? { boxShadow: glow } : undefined}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className ?? ""}`} />;
}

export function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
