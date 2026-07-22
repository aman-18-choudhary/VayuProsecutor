import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X, Loader2 } from "lucide-react";
import { CITIES } from "../lib/cities";
import { City } from "../lib/types";

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
}

export function CitySelector({ isOpen, onClose, onSelect }: CitySelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<City[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let focusTimer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setQuery("");
      setResults([]);
      focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
      
      const saved = localStorage.getItem("vayu_recent_cities");
      if (saved) {
        try {
          setRecent(JSON.parse(saved));
        } catch (e) {}
      }
    }
    return () => {
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&featuretype=city`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Nominatim search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (city: City) => {
    const newRecent = [city, ...recent.filter((c) => c.name !== city.name)].slice(0, 5);
    setRecent(newRecent);
    localStorage.setItem("vayu_recent_cities", JSON.stringify(newRecent));
    onSelect(city);
    onClose();
  };

  const handleSelectNominatim = (item: any) => {
    // Extract a clean name from nominatim result
    const name = item.address.city || item.address.town || item.address.village || item.address.county || item.name;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    
    if (name && !isNaN(lat) && !isNaN(lon)) {
      handleSelect({ name, lat, lon });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4 py-4">
            <Search className="h-5 w-5 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              className="ml-3 flex-1 bg-transparent text-lg text-text-primary placeholder:text-text-muted focus:outline-none"
              placeholder="Search for any city globally..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            <button onClick={onClose} className="ml-3 rounded-full p-1 hover:bg-bg-muted text-text-muted hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
            {/* Search Results */}
            {query.trim() !== "" ? (
              <div className="p-2">
                <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Search Results
                </div>
                {results.length === 0 && !loading ? (
                  <div className="px-2 py-4 text-center text-sm text-text-muted">No cities found.</div>
                ) : (
                  results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectNominatim(r)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-bg-muted"
                    >
                      <MapPin className="h-5 w-5 text-text-muted" />
                      <div>
                        <div className="font-semibold text-text-primary">{r.name}</div>
                        <div className="text-xs text-text-secondary">{r.display_name.split(", ").slice(1).join(", ")}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Recent Searches */}
                {recent.length > 0 && (
                  <div className="p-2">
                    <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                      Recent Cities
                    </div>
                    {recent.map((c, i) => (
                      <button
                        key={`recent-${i}`}
                        onClick={() => handleSelect(c)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-bg-muted"
                      >
                        <Clock className="h-4 w-4 text-text-muted" />
                        <span className="font-semibold text-text-primary">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular / Default Cities */}
                <div className="p-2">
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Popular Indian Cities
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {CITIES.map((c, i) => (
                      <button
                        key={`popular-${i}`}
                        onClick={() => handleSelect(c)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-bg-muted"
                      >
                        <MapPin className="h-4 w-4 text-text-muted" />
                        <span className="font-semibold text-text-primary">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
