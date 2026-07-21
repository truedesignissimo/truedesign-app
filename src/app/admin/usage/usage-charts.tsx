export type UsageDatum = {
  label: string;
  value: number;
  detail?: string;
};

function HorizontalBars({ title, data }: { title: string; data: UsageDatum[] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-heading">
        <h2>{title}</h2>
        <span>{data.reduce((sum, item) => sum + item.value, 0)} accessi</span>
      </div>
      <div className="analytics-bars">
        {data.slice(0, 10).map((item) => (
          <div className="analytics-bar-row" key={item.label}>
            <div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div>
            <span><i style={{ width: `${Math.max(4, (item.value / maximum) * 100)}%` }} /></span>
            <b>{item.value}</b>
          </div>
        ))}
        {data.length === 0 && <p className="muted">Nessun utilizzo registrato.</p>}
      </div>
    </section>
  );
}

function TrendChart({ data }: { data: UsageDatum[] }) {
  const width = 900;
  const height = 250;
  const padding = 24;
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.value / maximum) * (height - padding * 2);
    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;

  return (
    <section className="analytics-trend-card">
      <div className="analytics-chart-heading">
        <div><p className="eyebrow">Ultimi 30 giorni</p><h2>Andamento degli accessi</h2></div>
        <strong>{data.reduce((sum, item) => sum + item.value, 0)}</strong>
      </div>
      <svg className="analytics-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Andamento accessi negli ultimi trenta giorni">
        <polygon points={area} className="analytics-trend-area" />
        <polyline points={polyline} className="analytics-trend-line" />
        {points.map((point, index) => (
          <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r="4" />
        ))}
      </svg>
      <div className="analytics-trend-labels">
        {data.filter((_, index) => index % 7 === 0 || index === data.length - 1).map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </section>
  );
}

export default function UsageCharts({
  daily,
  byApp,
  byUser,
}: {
  daily: UsageDatum[];
  byApp: UsageDatum[];
  byUser: UsageDatum[];
}) {
  return (
    <div className="analytics-visuals">
      <TrendChart data={daily} />
      <div className="analytics-chart-grid">
        <HorizontalBars title="Utilizzo per applicazione" data={byApp} />
        <HorizontalBars title="Utilizzo per utente" data={byUser} />
      </div>
    </div>
  );
}
