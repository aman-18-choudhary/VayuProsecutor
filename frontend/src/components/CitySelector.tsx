import React from "react";
import { CITIES } from "../lib/cities";

export function CitySelector({
  city,
  onCityChange,
}: {
  city: string;
  onCityChange: (c: string) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <span
        className="pointer-events-none absolute left-3 text-sm"
        aria-hidden="true"
      >
        🏙️
      </span>
      <select
        aria-label="Select city"
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm font-medium text-slate-800 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/60"
      >
        {CITIES.map((c) => (
          <option key={c.name} value={c.name} className="bg-slate-50">
            {c.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
