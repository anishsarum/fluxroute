import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

app.innerHTML = `
  <main class="shell">
    <section class="summary">
      <p class="eyebrow">FluxRoute</p>
      <h1>Commute tracking dashboard</h1>
      <p class="lede">
        Backend polling is wired up. This frontend is ready for the next pass:
        charts, filters, and live commute records.
      </p>
    </section>

    <section class="panel" aria-label="Service status">
      <div>
        <span class="status-dot" aria-hidden="true"></span>
        <span class="status-label">Frontend service running</span>
      </div>
      <p>Vite is serving this app from the dedicated frontend container.</p>
    </section>
  </main>
`;
