import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  collectCommuteRecord,
  getCommuteRecords,
  getCommuteSummary,
  getCurrentRouteSettings,
  getHealth,
  updateCurrentRouteSettings
} from "./api";
import type { CaptureSourceFilter, CommuteRecord, CommuteSummary, RouteSettings } from "./api";
import "./styles.css";

const panelClass = "min-w-0 rounded-lg border border-[#dce3dd] bg-white p-[18px] shadow-[0_16px_42px_rgb(26_44_32_/_0.06)]";
const fieldClass = "block w-full min-h-[38px] rounded-lg border border-[#d6ddd8] bg-[#fbfdfc] px-2.5 text-[#263340] mt-2";

export function App() {
  const [captureSource, setCaptureSource] = useState<CaptureSourceFilter>("scheduled");
  const queryClient = useQueryClient();
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30_000
  });
  const routeSettingsQuery = useQuery({
    queryKey: ["route-settings"],
    queryFn: getCurrentRouteSettings
  });
  const recordsQuery = useQuery({
    queryKey: ["commute-records", captureSource],
    queryFn: () => getCommuteRecords(100, captureSource)
  });
  const summaryQuery = useQuery({
    queryKey: ["commute-summary", captureSource],
    queryFn: () => getCommuteSummary(captureSource)
  });
  const collectMutation = useMutation({
    mutationFn: collectCommuteRecord,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["commute-records"] }),
        queryClient.invalidateQueries({ queryKey: ["commute-summary"] })
      ]);
    }
  });
  const updateRouteSettingsMutation = useMutation({
    mutationFn: updateCurrentRouteSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["route-settings"] });
    }
  });

  const records = recordsQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <main className="mx-auto w-[min(1180px,calc(100%_-_32px))] py-8 max-[760px]:w-[min(calc(100%_-_24px),1180px)] max-[760px]:py-6">
      <header className="mb-7 flex items-start justify-between gap-6 max-[760px]:flex-col">
        <div>
          <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#32725d]">FluxRoute</p>
          <h1 className="text-[2.5rem] leading-none tracking-normal max-[760px]:text-[2.1rem]">
            Commute tracking
          </h1>
        </div>
        <StatusPill
          isHealthy={healthQuery.data?.status === "ok"}
          isLoading={healthQuery.isLoading}
          hasError={healthQuery.isError}
        />
      </header>

      <section className="mb-[18px] flex items-center justify-between gap-3 max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Dashboard controls">
        <div
          className="inline-grid grid-cols-3 overflow-hidden rounded-lg border border-[#d6ddd8] bg-white"
          aria-label="Capture source filter"
        >
          {(["scheduled", "manual", "all"] as const).map((source, index) => (
            <button
              key={source}
              type="button"
              className={`min-h-[38px] border-0 px-3.5 font-extrabold capitalize ${
                captureSource === source ? "bg-[#e8f3ee] text-[#25654f]" : "bg-transparent text-[#53616c]"
              } ${index === 0 ? "" : "border-l border-[#d6ddd8]"}`}
              onClick={() => setCaptureSource(source)}
            >
              {source}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="min-h-[38px] rounded-lg border-0 bg-[#263340] px-[18px] font-extrabold text-white disabled:cursor-wait disabled:opacity-70"
          onClick={() => collectMutation.mutate()}
          disabled={collectMutation.isPending}
        >
          {collectMutation.isPending ? "Collecting" : "Collect now"}
        </button>
      </section>

      {collectMutation.isError ? (
        <p role="alert" className="-mt-1.5 mb-[18px] font-bold text-[#a84939]">
          Manual collection failed. Check backend logs and API key settings.
        </p>
      ) : null}

      <RouteSettingsPanel
        routeSettings={routeSettingsQuery.data}
        isLoading={routeSettingsQuery.isLoading}
        hasError={routeSettingsQuery.isError}
        isSaving={updateRouteSettingsMutation.isPending}
        isSaved={updateRouteSettingsMutation.isSuccess}
        saveError={updateRouteSettingsMutation.isError}
        onSave={(routeSettings) => updateRouteSettingsMutation.mutate(routeSettings)}
      />

      <section className="mb-[18px] grid grid-cols-3 gap-3.5 max-[760px]:grid-cols-1" aria-label="Commute metrics">
        <MetricCard label="Records" value={summary?.sampleSize ?? records.length} />
        <MetricCard label="Avg traffic" value={formatMinutes(getAverageTraffic(summary))} />
        <MetricCard label="Avg delay" value={formatMinutes(getAverageDelay(summary))} />
      </section>

      <section className="grid grid-cols-1 gap-[18px] min-[980px]:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] min-[980px]:items-start">
        <section className={panelClass} aria-label="Departure time chart">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-normal">Departure time averages</h2>
            <span className="text-sm font-bold text-[#6b7680]">{summary?.departureMinuteAverages.length ?? 0} slots</span>
          </div>
          <DepartureTimeChart
            summary={summary}
            isLoading={summaryQuery.isLoading}
          />
        </section>

        <section className={panelClass} aria-label="Recent commute records">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-normal">Recent records</h2>
            <span className="text-sm font-bold text-[#6b7680]">{records.length} rows</span>
          </div>
          <RecordsTable
            records={records}
            isLoading={recordsQuery.isLoading}
            hasError={recordsQuery.isError}
          />
        </section>
      </section>
    </main>
  );
}

function StatusPill({
  isHealthy,
  isLoading,
  hasError
}: {
  isHealthy: boolean;
  isLoading: boolean;
  hasError: boolean;
}) {
  const label = isLoading ? "Checking API" : hasError ? "API unreachable" : "API online";

  return (
    <div
      role={hasError ? "alert" : "status"}
      className="inline-flex min-h-9 items-center gap-2.5 whitespace-nowrap rounded-full border border-[#d6ddd8] bg-white px-3.5 text-sm font-bold text-[#5b6670]"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${
          isHealthy ? "bg-[#2f9b6d] shadow-[0_0_0_5px_rgb(47_155_109_/_0.14)]" : "bg-[#c36b58]"
        }`}
      />
      {label}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-lg border border-[#dce3dd] bg-white p-[18px] shadow-[0_16px_42px_rgb(26_44_32_/_0.06)]">
      <span className="block text-sm font-bold text-[#66717b]">{label}</span>
      <strong className="mt-2 block text-[2rem] tracking-normal">{value}</strong>
    </article>
  );
}

function RouteSettingsPanel({
  routeSettings,
  isLoading,
  hasError,
  isSaving,
  isSaved,
  saveError,
  onSave
}: {
  routeSettings: RouteSettings | undefined;
  isLoading: boolean;
  hasError: boolean;
  isSaving: boolean;
  isSaved: boolean;
  saveError: boolean;
  onSave: (routeSettings: RouteSettings) => void;
}) {
  const [formValues, setFormValues] = useState<RouteSettingsFormValues>(() =>
    toRouteSettingsFormValues(routeSettings)
  );

  useEffect(() => {
    if (routeSettings) {
      setFormValues(toRouteSettingsFormValues(routeSettings));
    }
  }, [routeSettings]);

  if (isLoading) {
    return (
      <section className={`mb-[18px] ${panelClass}`} aria-label="Current route">
        <span className="text-sm font-extrabold text-[#66717b]">Current route</span>
        <strong className="ml-4 text-[#263340]">Loading route</strong>
      </section>
    );
  }

  if (hasError || !routeSettings?.origin || !routeSettings.destination) {
    return (
      <section className={`mb-[18px] ${panelClass}`} aria-label="Current route">
        <span className="text-sm font-extrabold text-[#66717b]">Current route</span>
        <strong className="ml-4 text-[#263340]">Route unavailable</strong>
      </section>
    );
  }

  function updateField(field: keyof RouteSettingsFormValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(toRouteSettings(formValues));
  }

  const saveMessage = saveError ? (
    <p role="alert" className="mb-3 text-sm font-bold text-[#a84939]">
      Save failed
    </p>
  ) : isSaved ? (
    <p role="status" className="mb-3 text-sm font-bold text-[#2f8f6b]">
      Route saved
    </p>
  ) : null;

  return (
    <section className={`mb-[18px] ${panelClass}`} aria-label="Current route">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold text-[#66717b]">Current route</span>
      </div>
      {saveMessage}
      <form
        className="grid grid-cols-[repeat(2,minmax(0,1fr))_auto] items-end gap-3.5 max-[760px]:grid-cols-1"
        onSubmit={handleSubmit}
      >
        <RouteFieldset
          title="Origin"
          label={formValues.originLabel}
          latitude={formValues.originLatitude}
          longitude={formValues.originLongitude}
          onLabelChange={(value) => updateField("originLabel", value)}
          onLatitudeChange={(value) => updateField("originLatitude", value)}
          onLongitudeChange={(value) => updateField("originLongitude", value)}
        />
        <RouteFieldset
          title="Destination"
          label={formValues.destinationLabel}
          latitude={formValues.destinationLatitude}
          longitude={formValues.destinationLongitude}
          onLabelChange={(value) => updateField("destinationLabel", value)}
          onLatitudeChange={(value) => updateField("destinationLatitude", value)}
          onLongitudeChange={(value) => updateField("destinationLongitude", value)}
        />
        <button
          type="submit"
          className="min-h-[38px] whitespace-nowrap rounded-lg border-0 bg-[#2f8f6b] px-4 font-extrabold text-white disabled:cursor-wait disabled:opacity-70"
          disabled={isSaving}
        >
          {isSaving ? "Saving" : "Save route"}
        </button>
      </form>
    </section>
  );
}

function RouteFieldset({
  title,
  label,
  latitude,
  longitude,
  onLabelChange,
  onLatitudeChange,
  onLongitudeChange
}: {
  title: string;
  label: string;
  latitude: string;
  longitude: string;
  onLabelChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
}) {
  return (
    <fieldset className="grid min-w-0 grid-cols-[minmax(140px,1fr)_repeat(2,minmax(110px,0.7fr))] gap-x-2.5 gap-y-3.5 border-0 p-0 max-[760px]:grid-cols-1">
      <legend className="col-span-full mb-2 text-sm font-extrabold text-[#263340]">{title}</legend>
      <label className="text-xs font-bold text-[#6b7680]">
        Label
        <input className={fieldClass} value={label} onChange={(event) => onLabelChange(event.target.value)} />
      </label>
      <label className="text-xs font-bold text-[#6b7680]">
        Latitude
        <input
          className={fieldClass}
          type="number"
          step="any"
          value={latitude}
          onChange={(event) => onLatitudeChange(event.target.value)}
        />
      </label>
      <label className="text-xs font-bold text-[#6b7680]">
        Longitude
        <input
          className={fieldClass}
          type="number"
          step="any"
          value={longitude}
          onChange={(event) => onLongitudeChange(event.target.value)}
        />
      </label>
    </fieldset>
  );
}

function DepartureTimeChart({
  summary,
  isLoading
}: {
  summary: CommuteSummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <EmptyState title="Loading chart" detail="Fetching commute summary data." minHeightClass="min-h-[220px]" />;
  }

  if (!summary || summary.departureMinuteAverages.length === 0) {
    return (
      <EmptyState
        title="No commute data yet"
        detail="The chart will populate after polling saves records."
        minHeightClass="min-h-[220px]"
      />
    );
  }

  return (
    <div className="h-80 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={summary.departureMinuteAverages} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="departureMinute" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} unit="m" />
          <Tooltip formatter={(value) => [`${value} min`, ""]} />
          <Legend />
          <Bar
            dataKey="averageDurationInTraffic"
            name="Traffic"
            fill="#2f8f6b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecordsTable({
  records,
  isLoading,
  hasError
}: {
  records: CommuteRecord[];
  isLoading: boolean;
  hasError: boolean;
}) {
  if (isLoading) {
    return <EmptyState title="Loading records" detail="Fetching recent commute snapshots." minHeightClass="min-h-[220px]" />;
  }

  if (hasError) {
    return (
      <EmptyState
        title="Records unavailable"
        detail="The backend did not return commute records."
        minHeightClass="min-h-[220px]"
        role="alert"
      />
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="No records saved"
        detail="The scheduled poller has not collected commute data yet."
        minHeightClass="min-h-[220px]"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Date</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Source</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Origin</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Destination</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Day</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Traffic</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Static</th>
            <th className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-xs font-extrabold uppercase text-[#62707a]">Delay</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">{formatDate(record.createdAt)}</td>
              <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">{record.captureSource}</td>
              <RouteSnapshotCell
                label={record.originLabel}
                latitude={record.originLatitude}
                longitude={record.originLongitude}
              />
              <RouteSnapshotCell
                label={record.destinationLabel}
                latitude={record.destinationLatitude}
                longitude={record.destinationLongitude}
              />
              <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">{record.dayOfWeek}</td>
              <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">{record.durationInTraffic}m</td>
              <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">{record.staticDuration}m</td>
              <td
                className={`border-b border-[#e6ebe7] px-2.5 py-[13px] text-left ${
                  record.delay > 0 ? "font-extrabold text-[#b24f3d]" : "text-[#263340]"
                }`}
              >
                {record.delay}m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RouteSnapshotCell({
  label,
  latitude,
  longitude
}: {
  label: string;
  latitude: number;
  longitude: number;
}) {
  return (
    <td className="border-b border-[#e6ebe7] px-2.5 py-[13px] text-left text-[#263340]">
      <span className="block font-bold">{label}</span>
      <span className="mt-1 block text-xs font-bold text-[#6b7680]">
        {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
      </span>
    </td>
  );
}

function EmptyState({
  title,
  detail,
  minHeightClass,
  role
}: {
  title: string;
  detail: string;
  minHeightClass: string;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className={`grid place-content-center rounded-lg border border-dashed border-[#cfd8d2] bg-[#f8faf9] p-6 text-center text-[#5f6b74] ${minHeightClass}`}
    >
      <strong className="text-[#263340]">{title}</strong>
      <p className="mt-2 leading-normal">{detail}</p>
    </div>
  );
}

function getAverageTraffic(summary: CommuteSummary | undefined): number | undefined {
  if (!summary || !summary.departureMinuteAverages || summary.departureMinuteAverages.length === 0) {
    return undefined;
  }

  return average(summary.departureMinuteAverages.map((day) => day.averageDurationInTraffic));
}

function getAverageDelay(summary: CommuteSummary | undefined): number | undefined {
  if (!summary || !summary.departureMinuteAverages || summary.departureMinuteAverages.length === 0) {
    return undefined;
  }

  return average(summary.departureMinuteAverages.map((day) => day.averageDelay));
}

function average(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round((total / values.length) * 10) / 10;
}

function formatMinutes(value: number | undefined): string {
  return value === undefined ? "-" : `${value}m`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCoordinate(value: number): string {
  return value.toLocaleString("en-GB", {
    maximumFractionDigits: 6,
    useGrouping: false
  });
}

type RouteSettingsFormValues = {
  originLabel: string;
  originLatitude: string;
  originLongitude: string;
  destinationLabel: string;
  destinationLatitude: string;
  destinationLongitude: string;
};

function toRouteSettingsFormValues(routeSettings: RouteSettings | undefined): RouteSettingsFormValues {
  return {
    originLabel: routeSettings?.origin?.label ?? "",
    originLatitude: routeSettings?.origin ? String(routeSettings.origin.latitude) : "",
    originLongitude: routeSettings?.origin ? String(routeSettings.origin.longitude) : "",
    destinationLabel: routeSettings?.destination?.label ?? "",
    destinationLatitude: routeSettings?.destination ? String(routeSettings.destination.latitude) : "",
    destinationLongitude: routeSettings?.destination ? String(routeSettings.destination.longitude) : ""
  };
}

function toRouteSettings(formValues: RouteSettingsFormValues): RouteSettings {
  return {
    origin: {
      label: formValues.originLabel,
      latitude: Number(formValues.originLatitude),
      longitude: Number(formValues.originLongitude)
    },
    destination: {
      label: formValues.destinationLabel,
      latitude: Number(formValues.destinationLatitude),
      longitude: Number(formValues.destinationLongitude)
    }
  };
}
