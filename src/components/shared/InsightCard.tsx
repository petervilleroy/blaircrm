import type { ReactNode } from 'react';

interface InsightCardProps {
  title: string;
  body: string;
  variant?: 'info' | 'warning' | 'critical' | 'success';
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}

const ICONS: Record<string, string> = {
  info: '💡',
  warning: '⚠️',
  critical: '🚨',
  success: '✅',
};

export function InsightCard({ title, body, variant = 'info', icon, action }: InsightCardProps) {
  const cls = variant === 'info' ? '' : variant;
  return (
    <div className={`insight-card ${cls}`}>
      <div className="insight-card__header">
        {icon ?? ICONS[variant]}
        {title}
      </div>
      <div className="insight-card__body">{body}</div>
      {action && (
        <div className="insight-card__action">
          <button className="slds-btn slds-btn-outline" style={{ fontSize: 11, padding: '3px 10px' }} onClick={action.onClick}>
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
