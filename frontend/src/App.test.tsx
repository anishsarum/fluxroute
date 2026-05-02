import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("recharts", () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

  return {
    Bar: () => null,
    BarChart: passthrough,
    CartesianGrid: () => null,
    Legend: () => null,
    ResponsiveContainer: passthrough,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null
  };
});

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders API health and empty commute states", async () => {
    mockFetch({
      "/health": { status: "ok" },
      "/commute-records?limit=100": [],
      "/commute-records/summary": {
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      }
    });

    renderApp();

    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(screen.getByText("No commute data yet")).toBeInTheDocument();
    expect(screen.getByText("No records saved")).toBeInTheDocument();
  });

  it("renders commute metrics, chart labels, and table rows", async () => {
    mockFetch({
      "/health": { status: "ok" },
      "/commute-records?limit=100": [
        {
          id: 1,
          createdAt: "2026-05-04T07:30:00.000Z",
          durationInTraffic: 42,
          staticDuration: 30,
          delay: 12,
          dayOfWeek: "Monday"
        }
      ],
      "/commute-records/summary": {
        sampleSize: 1,
        recentRecords: [],
        weekdayAverages: [
          {
            dayOfWeek: "Monday",
            averageDurationInTraffic: 42,
            averageStaticDuration: 30,
            averageDelay: 12,
            sampleSize: 1
          }
        ]
      }
    });

    renderApp();

    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(metric("Records")).toHaveTextContent("1");
    expect(metric("Avg traffic")).toHaveTextContent("42m");
    expect(metric("Avg delay")).toHaveTextContent("12m");
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getAllByText("42m").length).toBeGreaterThan(0);
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getAllByText("12m").length).toBeGreaterThan(0);
  });

  it("shows an API unreachable state when health fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: false, status: 500 } as Response;
      }

      if (url.endsWith("/commute-records?limit=100")) {
        return jsonResponse([]);
      }

      return jsonResponse({
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      });
    });

    renderApp();

    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });
});

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function metric(label: string): HTMLElement {
  const labelElement = screen.getByText(label);
  const card = labelElement.closest("article");

  if (!card) {
    throw new Error(`Metric card not found for ${label}`);
  }

  const value = card.querySelector("strong");

  if (!value) {
    throw new Error(`Metric value not found for ${label}`);
  }

  return value;
}

function mockFetch(routes: Record<string, unknown>) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input));
    const key = `${url.pathname}${url.search}`;
    const body = routes[key];

    if (body === undefined) {
      return { ok: false, status: 404 } as Response;
    }

    return jsonResponse(body);
  });
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
