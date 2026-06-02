interface ScoreRingProps {
  value: number; // 0-100
  label: string;
  size?: number;
  invert?: boolean; // if true, high value = bad (like risk score)
}

export function ScoreRing({ value, label, size = 80, invert = false }: ScoreRingProps) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;

  const color = invert
    ? value >= 75 ? '#c23934' : value >= 50 ? '#ffb75d' : value >= 25 ? '#0070d2' : '#04844b'
    : value >= 75 ? '#04844b' : value >= 50 ? '#0070d2' : value >= 25 ? '#ffb75d' : '#c23934';

  return (
    <div className="score-ring-container">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="#e8e8e8"
          strokeWidth={6}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
        <text
          x={size / 2} y={size / 2 + 5}
          textAnchor="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: size / 4, fontWeight: 700, fill: color }}
        >
          {value}
        </text>
      </svg>
      <div className="score-ring-label">{label}</div>
    </div>
  );
}
