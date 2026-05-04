export type CommuteRecord = {
  id: number;
  createdAt: string;
  capturedAt: string;
  captureSource: CaptureSource;
  durationInTraffic: number;
  staticDuration: number;
  delay: number;
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  dayOfWeek: string;
};

export type CaptureSource = "scheduled" | "manual";
export type CaptureSourceFilter = CaptureSource | "all";

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

export type LabeledCoordinate = {
  label: string;
  latitude: number;
  longitude: number;
};

export type RouteSettings = {
  origin: LabeledCoordinate;
  destination: LabeledCoordinate;
};

export type HealthResponse = {
  status: "ok";
};

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "/api";
}

export async function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/health");
}

export async function getCurrentRouteSettings(): Promise<RouteSettings> {
  return getJson<RouteSettings>("/route-settings/current");
}

export async function updateCurrentRouteSettings(routeSettings: RouteSettings): Promise<RouteSettings> {
  return putJson<RouteSettings>("/route-settings/current", routeSettings);
}

export async function getCommuteRecords(
  limit = 100,
  captureSource: CaptureSourceFilter = "scheduled"
): Promise<CommuteRecord[]> {
  return getJson<CommuteRecord[]>(
    `/commute-records?limit=${limit}&captureSource=${captureSource}`
  );
}

export async function collectCommuteRecord(): Promise<CommuteRecord> {
  return postJson<CommuteRecord>("/commute-records/collect");
}

export async function getCommuteSummary(
  captureSource: CaptureSourceFilter = "scheduled"
): Promise<CommuteSummary> {
  return getJson<CommuteSummary>(`/commute-records/summary?captureSource=${captureSource}`);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
