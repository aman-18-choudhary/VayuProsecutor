import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CausalData, LiveData, MapData, RecommendationsData, City, PolicyLevers, PolicySimulationResult, DashboardData, Alert, AlertStats, AlertTimelineData, SystemAdvisory, Report } from "./types";
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

export function useLiveData(city: City) {
  return useQuery({
    queryKey: ["live", city.name],
    queryFn: () =>
      fetchOrMock<LiveData>(`${API_BASE}/live/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`, () => mockLive(city.name), 30000),
  });
}

export function useCausalData(city: City) {
  return useQuery({
    queryKey: ["causal", city.name],
    // Live DoWhy causal inference on 3 months of data can take 60-120s on a cold call.
    queryFn: () =>
      fetchOrMock<CausalData>(
        `${API_BASE}/causal/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`,
        () => mockCausal(city.name),
        180000
      ),
    staleTime: 30 * 60 * 1000,
  });
}

export function useMapData(city: City) {
  return useQuery({
    queryKey: ["map", city.name],
    queryFn: () =>
      fetchOrMock<MapData>(`${API_BASE}/map/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`, () => mockMap(city.name), 30000),
  });
}

export function useRecommendations(city: City) {
  return useQuery({
    queryKey: ["recommendations", city.name],
    queryFn: async (): Promise<RecommendationsData> => {
      const url = `${API_BASE}/recommendations/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as RecommendationsData;
      } catch (e) {
        console.warn("[VayuProsecutor] Recommendations fetch failed", e);
        return { city: city.name, current_aqi: 0, recommendations: [], methodology: "", generated_at: new Date().toISOString(), message: "Backend unavailable" };
      } finally {
        clearTimeout(timeout);
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useDefaultPolicy() {
  return useQuery({
    queryKey: ["policy", "default"],
    queryFn: async (): Promise<PolicyLevers> => {
      const res = await fetch(`${API_BASE}/policy/default`);
      if (!res.ok) throw new Error("Failed to fetch default policy");
      return await res.json();
    },
    staleTime: Infinity,
  });
}

export function useSimulatePolicy() {
  return useMutation({
    mutationFn: async ({ city, levers }: { city: City; levers: PolicyLevers }): Promise<PolicySimulationResult> => {
      const res = await fetch(`${API_BASE}/policy/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.name,
          lat: city.lat,
          lon: city.lon,
          levers,
        }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      return await res.json();
    },
  });
}

export function useDashboard(city: City) {
  return useQuery({
    queryKey: ["dashboard", city.name],
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch(`${API_BASE}/dashboard/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return await res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ALERTS & ADVISORIES
export function useAlerts(city: City) {
  return useQuery({
    queryKey: ["alerts", city.name],
    queryFn: async (): Promise<Alert[]> => {
      const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return await res.json();
    },
    refetchInterval: 60000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string): Promise<Alert> => {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to acknowledge alert");
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries starting with "alerts" so lists and stats refresh
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts_stats"] });
    },
  });
}

export function useAdvisories(city: City) {
  return useQuery({
    queryKey: ["advisories", city.name],
    queryFn: async (): Promise<SystemAdvisory[]> => {
      const res = await fetch(`${API_BASE}/advisories/${encodeURIComponent(city.name)}?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error("Failed to fetch advisories");
      return await res.json();
    },
    refetchInterval: 60000,
  });
}

export function useAlertStats(city: City) {
  return useQuery({
    queryKey: ["alerts_stats", city.name],
    queryFn: async (): Promise<AlertStats> => {
      const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(city.name)}/stats?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error("Failed to fetch alert stats");
      return await res.json();
    },
    refetchInterval: 60000,
  });
}

export function useAlertTimeline(city: City) {
  return useQuery({
    queryKey: ["alerts_timeline", city.name],
    queryFn: async (): Promise<AlertTimelineData[]> => {
      const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(city.name)}/timeline?lat=${city.lat}&lon=${city.lon}`);
      if (!res.ok) throw new Error("Failed to fetch alert timeline");
      return await res.json();
    },
    refetchInterval: 60000,
  });
}

// REPORTS
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<Report[]> => {
      const res = await fetch(`${API_BASE}/reports`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return await res.json();
    },
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: async (): Promise<Report> => {
      const res = await fetch(`${API_BASE}/reports/${id}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useReportTemplates() {
  return useQuery({
    queryKey: ["report_templates"],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch(`${API_BASE}/reports/templates`);
      if (!res.ok) throw new Error("Failed to fetch report templates");
      return await res.json();
    },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({ city, type, user }: { city: City; type: string; user: string }): Promise<Report> => {
      const res = await fetch(`${API_BASE}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.name,
          lat: city.lat,
          lon: city.lon,
          type,
          user,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      return await res.json();
    },
  });
}

export function useExportReportPDF() {
  return useMutation({
    mutationFn: async (report_id: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE}/reports/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id }),
      });
      if (!res.ok) throw new Error("Export failed");
      return await res.blob();
    },
  });
}

export function useExportReportDOCX() {
  return useMutation({
    mutationFn: async (report_id: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE}/reports/export/docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id }),
      });
      if (!res.ok) throw new Error("Export failed");
      return await res.blob();
    },
  });
}

export function useExportReportCSV() {
  return useMutation({
    mutationFn: async (report_id: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE}/reports/export/csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id }),
      });
      if (!res.ok) throw new Error("Export failed");
      return await res.blob();
    },
  });
}

export function useShareReport() {
  return useMutation({
    mutationFn: async (report_id: string): Promise<{url: string}> => {
      const res = await fetch(`${API_BASE}/reports/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id }),
      });
      if (!res.ok) throw new Error("Share failed");
      return await res.json();
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report_id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/reports/${report_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// SETTINGS & CONFIGURATION
import { SystemSettings, UserProfile, SystemHealth, SystemStatus, AuditLogEntry } from "./types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<SystemSettings> => {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return await res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user_profile"],
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch(`${API_BASE}/user/profile`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return await res.json();
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProfile: Partial<UserProfile>) => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });
      if (!res.ok) throw new Error("Failed to update user profile");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const res = await fetch(`${API_BASE}/settings/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return await res.json();
    },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["system_health"],
    queryFn: async (): Promise<SystemHealth> => {
      const res = await fetch(`${API_BASE}/system/health`);
      if (!res.ok) throw new Error("Failed to fetch system health");
      return await res.json();
    },
    refetchInterval: 5000,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system_status"],
    queryFn: async (): Promise<SystemStatus> => {
      const res = await fetch(`${API_BASE}/system/status`);
      if (!res.ok) throw new Error("Failed to fetch system status");
      return await res.json();
    },
  });
}

export function useRefreshCache() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/cache/refresh`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh cache");
      return await res.json();
    },
  });
}

export function useClearCache() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/cache/clear`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear cache");
      return await res.json();
    },
  });
}
