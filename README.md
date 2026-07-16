# VayuProsecutor ⚖️
**AI-Powered Causal Pollution Source Prosecution Engine**  
ET AI Hackathon 2026 | "Not just what the AQI is — but who caused it, by how much, and what to do about it."

---

## 🚀 Quick Start (Personal Laptop)

### Prerequisites — install these once
| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11 or 3.12 | https://python.org |
| Node.js | 18+ (LTS) | https://nodejs.org |

> ⚠️ Do NOT use Python 3.13/3.14 — DoWhy and Prophet have no wheels for them.

---

### Step 1 — Unzip the project
```bash
unzip VayuProsecutor.zip
cd vayuprosecutor
```

### Step 2 — Python backend setup
```bash
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3 — Add your API keys
Create a file called `.env` in the project root:
```
OPENAQ_API_KEY=84bb446a4b1284d80619e17251c29865946da8324be63cd37b10531d3aeb7697
AQICN_TOKEN=2bd934f6c52bd2b85a6542f6bed28ee662e75a2a
TOMTOM_API_KEY=dTZqbIVZ2crdyVBcnjcHGjq6GysY9cJr
NASA_FIRMS_KEY=5e4f6fc0dbd71153e9ff2e8d0cb1a98b
GROQ_API_KEY=          # optional — for LLM prosecution briefs
OPENAI_API_KEY=        # optional — fallback LLM
```

### Step 4 — Run (open 2 terminals)

**Terminal 1 — Python API backend:**
```bash
source venv/bin/activate
python -m uvicorn api_server:app --port 8000
```

**Terminal 2 — React frontend:**

Option A — Dev mode (requires Node.js):
```bash
cd frontend
npm install
npm run dev
```

Option B — Serve pre-built dist (no Node.js needed):
```bash
cd frontend/dist
python3 -m http.server 5173
```

Open **http://localhost:5173** ✅

---

## 📁 Project Structure
```
vayuprosecutor/
├── api_server.py           ← FastAPI backend (real data from all APIs)
├── requirements.txt        ← Python dependencies
├── data/
│   └── cities.json         ← 10 Indian cities + coordinates
├── src/
│   ├── aqi_fetcher.py      ← Open-Meteo + AQICN real AQI
│   ├── weather_fetcher.py  ← Open-Meteo weather
│   ├── causal_engine.py    ← Microsoft DoWhy causal inference
│   ├── historical_collector.py  ← 6-month historical data (parallel fetch)
│   ├── traffic_fetcher.py  ← TomTom real-time traffic
│   ├── fire_detector.py    ← NASA FIRMS satellite fires
│   ├── industrial_mapper.py ← OpenStreetMap factories
│   ├── vulnerability.py    ← Schools/hospitals near hotspots
│   ├── forecaster.py       ← 24h AQI forecast
│   ├── alert_generator.py  ← Multilingual health advisories
│   └── prosecutor_report.py ← LLM prosecution brief
└── frontend/               ← React 18 + TypeScript dashboard
    ├── dist/               ← Pre-built production app (serve directly)
    ├── src/
    │   ├── components/     ← AQICard, VerdictCard, CausalDAG, etc.
    │   ├── pages/          ← LiveIntelligence, CausalProsecutor
    │   └── lib/            ← API hooks, types, mock data
    └── package.json
```

## 🌐 Data Sources
| Source | What it provides | Key required? |
|--------|-----------------|---------------|
| Open-Meteo | AQI, weather, history | ❌ Free, no key |
| AQICN/WAQI | Official station AQI (20 stations/city) | ✅ Free |
| TomTom | Real-time traffic congestion | ✅ Free (2500 req/day) |
| NASA FIRMS | Fire/stubble burning detection | ✅ Free |
| OpenStreetMap | Schools, hospitals, factories | ❌ Free, no key |

## 🔑 Rotate keys after the hackathon
Keys in `.env` are real and should be regenerated after the event.
