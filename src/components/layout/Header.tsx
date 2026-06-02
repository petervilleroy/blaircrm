interface Page {
  id: string;
  label: string;
  icon: string;
}

const PAGES: Page[] = [
  { id: 'home', label: 'Overview', icon: '⚡' },
  { id: 'accounts', label: 'Accounts', icon: '🏢' },
  { id: 'relationship', label: 'Relationship Intel', icon: '🤝' },
  { id: 'risk', label: 'Churn & Risk', icon: '🛡️' },
  { id: 'sales-cycle', label: 'Sales Cycle', icon: '🔄' },
  { id: 'expansion', label: 'Expansion', icon: '📈' },
  { id: 'operational', label: 'Operations', icon: '⚙️' },
];

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="global-header">
      <div className="app-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>IA Advantage</span>
        <span style={{ fontSize: 11, fontWeight: 400, opacity: .6, marginLeft: 4 }}>ACME Tools CRM</span>
      </div>

      <nav className="nav-tabs">
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-tab ${currentPage === p.id ? 'active' : ''}`}
            onClick={() => onNavigate(p.id)}
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar-sm" style={{ background: '#00a1e0' }}>SC</div>
          <span style={{ fontSize: 12 }}>Sarah Chen</span>
        </div>
      </div>
    </header>
  );
}
