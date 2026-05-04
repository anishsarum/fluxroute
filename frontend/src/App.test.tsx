import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      "/commute-records?limit=100&captureSource=scheduled": [],
      "/commute-records/summary?captureSource=scheduled": {
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
      "/commute-records?limit=100&captureSource=scheduled": [
        {
          id: 1,
          createdAt: "2026-05-04T07:30:00.000Z",
          capturedAt: "2026-05-04T07:30:00.000Z",
          captureSource: "scheduled",
          durationInTraffic: 42,
          staticDuration: 30,
          delay: 12,
          dayOfWeek: "Monday"
        }
      ],
      "/commute-records/summary?captureSource=scheduled": {
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

  it("renders editable route settings and saves changes", async () => {
    const user = userEvent.setup();
    mockFetch({
      "/health": { status: "ok" },
      "/route-settings/current": {
        origin: { label: "Home", latitude: 51.5072, longitude: -0.1276 },
        destination: { label: "Office", latitude: 51.4545, longitude: -2.5879 }
      },
      "/commute-records?limit=100&captureSource=scheduled": [],
      "/commute-records/summary?captureSource=scheduled": {
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      }
    });

    renderApp();

    const homeInput = await screen.findByDisplayValue("Home");
    const routePanel = screen.getByLabelText("Current route");

    expect(homeInput).toBeInTheDocument();
    expect(within(routePanel).getByDisplayValue("51.5072")).toBeInTheDocument();
    expect(within(routePanel).getByDisplayValue("-0.1276")).toBeInTheDocument();
    expect(within(routePanel).getByDisplayValue("Office")).toBeInTheDocument();
    expect(within(routePanel).getByDisplayValue("51.4545")).toBeInTheDocument();
    expect(within(routePanel).getByDisplayValue("-2.5879")).toBeInTheDocument();

    await user.clear(homeInput);
    await user.type(homeInput, "Flat");
    await user.click(within(routePanel).getByRole("button", { name: "Save route" }));

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/route-settings/current",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining('"label":"Flat"')
      })
    );
  });

  it("shows an API unreachable state when health fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: false, status: 500 } as Response;
      }

      if (url.endsWith("/commute-records?limit=100&captureSource=scheduled")) {
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

  it("shows a records unavailable state when the records request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return jsonResponse({ status: "ok" });
      }

      if (url.endsWith("/commute-records?limit=100&captureSource=scheduled")) {
        return { ok: false, status: 500 } as Response;
      }

      return jsonResponse({
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      });
    });

    renderApp();

    expect(await screen.findByText("Records unavailable")).toBeInTheDocument();
  });

  it("does not mark zero or negative delay as delayed", async () => {
    mockFetch({
      "/health": { status: "ok" },
      "/commute-records?limit=100&captureSource=scheduled": [
        {
          id: 1,
          createdAt: "2026-05-04T07:30:00.000Z",
          capturedAt: "2026-05-04T07:30:00.000Z",
          captureSource: "scheduled",
          durationInTraffic: 30,
          staticDuration: 30,
          delay: 0,
          dayOfWeek: "Monday"
        },
        {
          id: 2,
          createdAt: "2026-05-05T07:30:00.000Z",
          capturedAt: "2026-05-05T07:30:00.000Z",
          captureSource: "scheduled",
          durationInTraffic: 28,
          staticDuration: 30,
          delay: -2,
          dayOfWeek: "Tuesday"
        }
      ],
      "/commute-records/summary?captureSource=scheduled": {
        sampleSize: 2,
        recentRecords: [],
        weekdayAverages: []
      }
    });

    renderApp();

    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(screen.getByText("0m")).not.toHaveClass("delay");
    expect(screen.getByText("-2m")).not.toHaveClass("delay");
  });

  it("filters records by manual capture source", async () => {
    const user = userEvent.setup();
    mockFetch({
      "/health": { status: "ok" },
      "/commute-records?limit=100&captureSource=scheduled": [],
      "/commute-records/summary?captureSource=scheduled": {
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      },
      "/commute-records?limit=100&captureSource=manual": [
        {
          id: 1,
          createdAt: "2026-05-04T07:30:00.000Z",
          capturedAt: "2026-05-04T07:30:00.000Z",
          captureSource: "manual",
          durationInTraffic: 42,
          staticDuration: 30,
          delay: 12,
          dayOfWeek: "Monday"
        }
      ],
      "/commute-records/summary?captureSource=manual": {
        sampleSize: 1,
        recentRecords: [],
        weekdayAverages: []
      }
    });

    renderApp();

    await user.click(await screen.findByRole("button", { name: "manual" }));

    expect((await screen.findAllByText("manual")).length).toBeGreaterThan(0);
    expect(screen.getByText("42m")).toBeInTheDocument();
  });

  it("posts a manual collection request when collect now is clicked", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return jsonResponse({ status: "ok" });
      }

      if (url.endsWith("/commute-records/collect")) {
        return jsonResponse({
          id: 3,
          createdAt: "2026-05-04T07:31:00.000Z",
          capturedAt: "2026-05-04T07:31:00.000Z",
          captureSource: "manual",
          durationInTraffic: 42,
          staticDuration: 30,
          delay: 12,
          dayOfWeek: "Monday"
        });
      }

      if (url.endsWith("/commute-records?limit=100&captureSource=scheduled")) {
        return jsonResponse([]);
      }

      return jsonResponse({
        sampleSize: 0,
        recentRecords: [],
        weekdayAverages: []
      });
    });

    renderApp();

    await user.click(await screen.findByRole("button", { name: "Collect now" }));

    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/commute-records/collect", {
      method: "POST"
    });
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
    const body = routes[key] ?? defaultRoutes[key];

    if (body === undefined) {
      return { ok: false, status: 404 } as Response;
    }

    return jsonResponse(body);
  });
}

const defaultRoutes: Record<string, unknown> = {
  "/route-settings/current": {
    origin: { label: "Origin", latitude: 51.5, longitude: -0.12 },
    destination: { label: "Destination", latitude: 51.45, longitude: -2.58 }
  }
};

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
