import { useQuery } from "@tanstack/react-query";
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
import { getCommuteRecords, getCommuteSummary, getHealth } from "./api";
import type { CommuteRecord, CommuteSummary } from "./api";
import "./styles.css";

export function App() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30_000
  });
  const recordsQuery = useQuery({
    queryKey: ["commute-records"],
    queryFn: () => getCommuteRecords(100)
  });
  const summaryQuery = useQuery({
    queryKey: ["commute-summary"],
    queryFn: getCommuteSummary
  });

  const records = recordsQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">FluxRoute</p>
          <h1>Commute tracking</h1>
        </div>
        <StatusPill
          isHealthy={healthQuery.data?.status === "ok"}
          isLoading={healthQuery.isLoading}
          hasError={healthQuery.isError}
        />
      </header>

      <section className="metric-grid" aria-label="Commute metrics">
        <MetricCard label="Records" value={summary?.sampleSize ?? records.length} />
        <MetricCard label="Avg traffic" value={formatMinutes(getAverageTraffic(summary))} />
        <MetricCard label="Avg delay" value={formatMinutes(getAverageDelay(summary))} />
      </section>

      <section className="content-grid">
        <section className="panel chart-panel" aria-label="Weekday commute chart">
          <div className="panel-heading">
            <h2>Weekday averages</h2>
            <span>{summary?.weekdayAverages.length ?? 0} days</span>
          </div>
          <WeekdayChart summary={summary} isLoading={summaryQuery.isLoading} />
        </section>

        <section className="panel" aria-label="Recent commute records">
          <div className="panel-heading">
            <h2>Recent records</h2>
            <span>{records.length} rows</span>
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
    <div className={`status-pill ${isHealthy ? "is-online" : ""}`}>
      <span aria-hidden="true" />
      {label}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function WeekdayChart({
  summary,
  isLoading
}: {
  summary: CommuteSummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <EmptyState title="Loading chart" detail="Fetching commute summary data." />;
  }

  if (!summary || summary.weekdayAverages.length === 0) {
    return <EmptyState title="No commute data yet" detail="The chart will populate after polling saves records." />;
  }

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={summary.weekdayAverages} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dayOfWeek" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} unit="m" />
          <Tooltip formatter={(value) => [`${value} min`, ""]} />
          <Legend />
          <Bar dataKey="averageStaticDuration" name="Static" fill="#5576a1" radius={[4, 4, 0, 0]} />
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
    return <EmptyState title="Loading records" detail="Fetching recent commute snapshots." />;
  }

  if (hasError) {
    return <EmptyState title="Records unavailable" detail="The backend did not return commute records." />;
  }

  if (records.length === 0) {
    return <EmptyState title="No records saved" detail="The scheduled poller has not collected commute data yet." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Traffic</th>
            <th>Static</th>
            <th>Delay</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{formatDate(record.createdAt)}</td>
              <td>{record.dayOfWeek}</td>
              <td>{record.durationInTraffic}m</td>
              <td>{record.staticDuration}m</td>
              <td className={record.delay > 0 ? "delay" : ""}>{record.delay}m</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function getAverageTraffic(summary: CommuteSummary | undefined): number | undefined {
  if (!summary || !summary.weekdayAverages || summary.weekdayAverages.length === 0) {
    return undefined;
  }

  return average(summary.weekdayAverages.map((day) => day.averageDurationInTraffic));
}

function getAverageDelay(summary: CommuteSummary | undefined): number | undefined {
  if (!summary || !summary.weekdayAverages || summary.weekdayAverages.length === 0) {
    return undefined;
  }

  return average(summary.weekdayAverages.map((day) => day.averageDelay));
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
