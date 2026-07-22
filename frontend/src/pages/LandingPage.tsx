import { motion } from "framer-motion";
import { GradientButton, LiveDot } from "../components/ui";

/* ── Stat pill ───────────────────────────────────────────── */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-4 shadow-card">
      <span className="font-display text-3xl font-extrabold gradient-text">{value}</span>
      <span className="mt-1 text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}

/* ── Feature card ───────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  desc,
  color,
  delay,
}: {
  icon: string;
  title: string;
  desc: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card card-hover"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 0 0, ${color}10, transparent 60%)` }}
      />
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-display text-base font-bold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
    </motion.div>
  );
}

/* ── Floating data card (hero decoration) ────────────────── */
function FloatingCard({
  label,
  value,
  sub,
  color,
  className,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      style={{ animation: `float ${2.5 + delay}s ease-in-out ${delay}s infinite` }}
      className={`absolute rounded-2xl border border-border bg-white/90 p-4 shadow-card-xl backdrop-blur-sm ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{label}</p>
      <p
        className="font-display text-2xl font-extrabold leading-none"
        style={{ color }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-text-secondary">{sub}</p>
    </motion.div>
  );
}

/* ── Data source badge ───────────────────────────────────── */
function SourceBadge({ icon, name }: { icon: string; name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 shadow-sm">
      <span className="text-base">{icon}</span>
      <span className="text-sm font-medium text-text-secondary">{name}</span>
    </div>
  );
}

/* ── Main Landing Page ───────────────────────────────────── */
export function LandingPage({ onEnter, onExplore }: { onEnter: () => void; onExplore: () => void }) {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6">
        {/* Grid background */}
        <div className="hero-grid pointer-events-none absolute inset-0" />

        {/* Purple/indigo blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/8 px-4 py-2">
              <LiveDot color="#6366F1" />
              <span className="text-sm font-semibold text-primary">
                ET AI Hackathon 2026 · Smart City Track
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-center font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-6xl lg:text-7xl"
          >
            AI Powered{" "}
            <span className="gradient-text">Urban Air Quality</span>
            <br />
            Intelligence
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-3 max-w-2xl text-center text-lg text-text-secondary"
          >
            Move Beyond AQI Monitoring.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-10 flex flex-wrap justify-center gap-x-6 gap-y-1"
          >
            {["Identify.", "Predict.", "Prosecute.", "Intervene."].map((w, i) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="gradient-text-blue font-display text-xl font-bold"
              >
                {w}
              </motion.span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <GradientButton
              variant="primary"
              size="lg"
              onClick={onEnter}
              className="min-w-[200px]"
            >
              🚀 Launch Command Center
            </GradientButton>
            <GradientButton
              variant="outline"
              size="lg"
              onClick={onExplore}
              className="min-w-[180px]"
            >
              Explore Intelligence
            </GradientButton>
          </motion.div>

          {/* Floating hero illustration cards */}
          <div className="relative mx-auto mt-20 h-72 max-w-3xl">
            {/* Central glowing AQI display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-primary/20 bg-white/90 p-8 shadow-card-xl backdrop-blur-sm"
            >
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Current AQI · New Delhi
                </p>
                <p className="font-display text-7xl font-extrabold leading-none" style={{ color: "#EF4444" }}>
                  238
                </p>
                <p className="mt-2 font-semibold text-danger">Unhealthy</p>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard
              label="Primary Culprit"
              value="62%"
              sub="Traffic Emissions"
              color="#EF4444"
              className="-left-4 top-0 sm:left-0"
              delay={0.8}
            />
            <FloatingCard
              label="Causal Confidence"
              value="94%"
              sub="Microsoft DoWhy"
              color="#6366F1"
              className="-right-4 top-4 sm:right-0"
              delay={0.9}
            />
            <FloatingCard
              label="AQI Reduction"
              value="−93"
              sub="If traffic reduced"
              color="#22C55E"
              className="-left-4 bottom-0 sm:left-4"
              delay={1.0}
            />
            <FloatingCard
              label="Data Points"
              value="4.3K"
              sub="6 months historical"
              color="#F59E0B"
              className="-right-4 bottom-0 sm:right-4"
              delay={1.1}
            />
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────── */}
      <section className="border-y border-border bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatPill value="10" label="Indian Cities" />
            <StatPill value="5" label="Data Sources" />
            <StatPill value="4300+" label="Hourly Records" />
            <StatPill value="94%" label="Causal Confidence" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Platform Capabilities
            </p>
            <h2 className="font-display text-4xl font-extrabold text-text-primary">
              Everything You Need to{" "}
              <span className="gradient-text">Prosecute Pollution</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="📡"
              title="Live Monitoring"
              desc="Real-time AQI from AQICN, weather from Open-Meteo, and traffic from TomTom across 10 Indian cities."
              color="#3B82F6"
              delay={0}
            />
            <FeatureCard
              icon="⚖️"
              title="Causal Intelligence"
              desc="Microsoft DoWhy causal inference identifies exactly which source is responsible and by how much."
              color="#6366F1"
              delay={0.07}
            />
            <FeatureCard
              icon="🔮"
              title="24h Forecast"
              desc="Facebook Prophet + statistical extrapolation predicts next-day air quality with confidence intervals."
              color="#8B5CF6"
              delay={0.14}
            />
            <FeatureCard
              icon="📋"
              title="Legal Brief"
              desc="Llama 3.3 70B via Groq auto-generates a formal prosecution brief for municipal enforcement."
              color="#22C55E"
              delay={0.21}
            />
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ─────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
            Trusted Data Sources
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SourceBadge icon="🌤️" name="Open-Meteo" />
            <SourceBadge icon="📡" name="AQICN / WAQI" />
            <SourceBadge icon="🗺️" name="TomTom Traffic" />
            <SourceBadge icon="🛰️" name="NASA FIRMS" />
            <SourceBadge icon="🌍" name="OpenStreetMap" />
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ───────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/8 to-accent/5 p-12 shadow-card-xl"
          >
            <h2 className="mb-4 font-display text-3xl font-extrabold text-text-primary">
              Ready to prosecute pollution?
            </h2>
            <p className="mb-8 text-text-secondary">
              Access real-time causal air quality intelligence for your city.
            </p>
            <GradientButton variant="primary" size="lg" onClick={onEnter}>
              🚀 Launch Command Center
            </GradientButton>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-white text-sm">
              ⚖️
            </div>
            <span className="font-display font-bold gradient-text">VayuProsecutor</span>
          </div>
          <p className="text-center text-xs text-text-muted">
            ET AI Hackathon 2026 · Built with Microsoft DoWhy + Groq Llama 3.3 70B
          </p>
          <p className="text-xs text-text-muted">
            🔒 Data sources anonymized after event
          </p>
        </div>
      </footer>
    </div>
  );
}
