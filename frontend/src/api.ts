const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export type CommuteRecord = {
  id: number;
  createdAt: string;
  durationInTraffic: number;
  staticDuration: number;
  delay: number;
  dayOfWeek: string;
};

export type WeekdayCommuteSummary = {
  dayOfWeek: string;
  averageDurationInTraffic: number;
  averageStaticDuration: number;
  averageDelay: number;
  sampleSize: number;
};

export type CommuteSummary = {
  sampleSize: number;
  recentRecords: CommuteRecord[];
  weekdayAverages: WeekdayCommuteSummary[];
};

export type HealthResponse = {
  status: "ok";
};

export async function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/health");
}

export async function getCommuteRecords(limit = 100): Promise<CommuteRecord[]> {
  return getJson<CommuteRecord[]>(`/commute-records?limit=${limit}`);
}

export async function getCommuteSummary(): Promise<CommuteSummary> {
  return getJson<CommuteSummary>("/commute-records/summary");
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
