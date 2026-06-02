import type { ReactNode } from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  trend?: { value: string; up: boolean };
  color?: 'brand' | 'success' | 'warning' | 'error' | 'purple' | 'teal';
  icon?: ReactNode;
  onClick?: () => void;
}

export function MetricTile({ label, value, trend, color = 'brand', icon, onClick }: MetricTileProps) {
  return (
    <div className={`metric-tile ${color}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div className="metric-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </div>
      <div className="metric-tile__value">{value}</div>
      {trend && (
        <div className={`metric-tile__trend ${trend.up ? 'trend-up' : 'trend-down'}`}>
          {trend.up ? '▲' : '▼'} {trend.value}
        </div>
      )}
    </div>
  );
}
