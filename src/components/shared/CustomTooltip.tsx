export function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div className="value" key={i}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: p.color, marginRight: 4 }} />
          <span>{p.name}: <strong>{formatter ? formatter(p.value) : p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}
