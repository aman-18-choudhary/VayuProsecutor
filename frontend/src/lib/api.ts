import { useQuery } from "@tanstack/react-query";
import { CausalData, LiveData, MapData } from "./types";
import { mockCausal, mockLive, mockMap } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

// Real API is the source of truth. Mock is only a last-resort fallback so the
// UI never goes blank if the backend is completely unreachable.
// Timeouts are generous because the causal endpoint runs live DoWhy inference.
async function fetchOrMock<T>(
  url: string,
  mock: () => T,
  timeoutMs = 30000
): Promise<T> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return mock();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[VayuProsecutor] ${url} → ${res.status}; using fallback.`);
      return mock();
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[VayuProsecutor] ${url} failed; using fallback.`, e);
    return mock();
  } finally {
    clearTimeout(timeout);
  }
}

export function useLiveData(city: string) {
  return useQuery({
    queryKey: ["live", city],
    queryFn: () =>
      fetchOrMock<LiveData>(`${API_BASE}/live/${city}`, () => mockLive(city), 30000),
  });
}

export function useCausalData(city: string) {
  return useQuery({
    queryKey: ["causal", city],
    // Live DoWhy causal inference on 3 months of data can take 60-120s on a cold call.
    queryFn: () =>
      fetchOrMock<CausalData>(
        `${API_BASE}/causal/${city}`,
        () => mockCausal(city),
        180000
      ),
    staleTime: 30 * 60 * 1000,
  });
}

export function useMapData(city: string) {
  return useQuery({
    queryKey: ["map", city],
    queryFn: () =>
      fetchOrMock<MapData>(`${API_BASE}/map/${city}`, () => mockMap(city), 30000),
  });
}
