export default function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
      {hint ? <p className="stat-card-hint">{hint}</p> : null}
    </article>
  );
}
