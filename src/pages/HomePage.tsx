import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { MetricTile } from '../components/shared/MetricTile';
import { CustomTooltip } from '../components/shared/CustomTooltip';
import { accounts, activities, opportunities, monthlyRevenue } from '../data';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function HomePage({ onNavigate }: { onNavigate: (p: string) => void }) {
  // KPIs
  const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
  const atRisk = accounts.filter(a => a.churnRisk === 'Critical' || a.churnRisk === 'High').length;
  const champions = accounts.filter(a => a.churnRisk === 'None').length;
  const avgHealth = Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length);
  const openOpps = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage));
  const pipelineValue = openOpps.reduce((s, o) => s + o.amount, 0);
  const renewalSoon = accounts.filter(a => {
    const d = new Date(a.renewalDate);
    const now = new Date('2026-06-02');
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  }).length;

  // Revenue trend (aggregate all accounts by month)
  const revenueByMonth: Record<string, number> = {};
  monthlyRevenue.forEach(r => {
    revenueByMonth[r.month] = (revenueByMonth[r.month] || 0) + r.revenue;
  });
  const revTrend = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month: month.slice(5), // "MM"
      revenue: Math.round(revenue / 1000),
    }));

  // Churn risk breakdown
  const riskBreakdown = [
    { name: 'Critical', value: accounts.filter(a => a.churnRisk === 'Critical').length },
    { name: 'High', value: accounts.filter(a => a.churnRisk === 'High').length },
    { name: 'Medium', value: accounts.filter(a => a.churnRisk === 'Medium').length },
    { name: 'Low', value: accounts.filter(a => a.churnRisk === 'Low').length },
    { name: 'None', value: accounts.filter(a => a.churnRisk === 'None').length },
  ];
  const riskColors = ['#c23934', '#ffb75d', '#0070d2', '#04844b', '#057070'];

  // Industry breakdown
  const industryMap: Record<string, number> = {};
  accounts.forEach(a => { industryMap[a.industry] = (industryMap[a.industry] || 0) + a.arr; });
  const industryData = Object.entries(industryMap)
    .map(([name, value]) => ({ name, value: Math.round(value / 1000) }))
    .sort((a, b) => b.value - a.value);

  // Recent activities
  const recentActivities = [...activities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // Health distribution
  const healthBands = [
    { band: '80-100', label: 'Healthy', count: accounts.filter(a => a.healthScore >= 80).length, color: '#04844b' },
    { band: '60-79', label: 'Good', count: accounts.filter(a => a.healthScore >= 60 && a.healthScore < 80).length, color: '#0070d2' },
    { band: '40-59', label: 'Watch', count: accounts.filter(a => a.healthScore >= 40 && a.healthScore < 60).length, color: '#ffb75d' },
    { band: '<40', label: 'At Risk', count: accounts.filter(a => a.healthScore < 40).length, color: '#c23934' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">⚡ IA Advantage Overview</div>
          <div className="page-header__subtitle">ACME Tools · 40 Active Accounts · Fiscal Year 2026</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="slds-btn slds-btn-neutral">📥 Export</button>
          <button className="slds-btn slds-btn-brand">+ New Account</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-grid">
        <MetricTile label="Total Portfolio ARR" value={fmt$(totalArr)} color="brand" trend={{ value: '+8.2% YoY', up: true }} onClick={() => onNavigate('accounts')} />
        <MetricTile label="Open Pipeline" value={fmt$(pipelineValue)} color="purple" trend={{ value: `${openOpps.length} opps`, up: true }} onClick={() => onNavigate('expansion')} />
        <MetricTile label="Avg Account Health" value={`${avgHealth}`} color="success" trend={{ value: '+3 pts vs Q1', up: true }} onClick={() => onNavigate('risk')} />
        <MetricTile label="At-Risk Accounts" value={atRisk} color="error" trend={{ value: '2 escalated this wk', up: false }} onClick={() => onNavigate('risk')} />
        <MetricTile label="Champion Accounts" value={champions} color="teal" trend={{ value: '+1 this quarter', up: true }} onClick={() => onNavigate('relationship')} />
        <MetricTile label="Renewals in 90 Days" value={renewalSoon} color="warning" trend={{ value: 'Needs attention', up: false }} onClick={() => onNavigate('operational')} />
      </div>

      <div className="two-col">
        {/* Revenue Trend */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📊 Portfolio Revenue Trend (18 Months)</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070d2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0070d2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}K`} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v}K`} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0070d2" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry ARR Breakdown */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🏭 ARR by Industry</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={industryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v}K`} />} />
                <Bar dataKey="value" name="ARR" fill="#0070d2" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Churn Risk Pie */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🛡️ Churn Risk Distribution</div>
          </div>
          <div className="slds-card__body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={riskBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {riskBreakdown.map((_, i) => <Cell key={i} fill={riskColors[i]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${v} accounts`] as any} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {riskBreakdown.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: riskColors[i], display: 'inline-block' }} />
                  <span style={{ flex: 1, fontSize: 12 }}>{r.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{r.value}</span>
                  <div className="progress-bar" style={{ width: 60 }}>
                    <div className="progress-bar__fill" style={{ width: `${(r.value / 40) * 100}%`, background: riskColors[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Health Distribution */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">💚 Account Health Distribution</div>
          </div>
          <div className="slds-card__body">
            {healthBands.map(b => (
              <div key={b.band} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{b.label} ({b.band})</span>
                  <span style={{ fontSize: 12, color: b.color, fontWeight: 700 }}>{b.count} accounts</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${(b.count / 40) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
            <div className="section-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
              <span>Average Health Score: <strong style={{ color: '#0070d2' }}>{avgHealth}</strong></span>
              <span>Target: <strong>75+</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🕐 Recent Activity Across Portfolio</div>
          <button className="slds-btn slds-btn-neutral" style={{ fontSize: 11 }}>View All</button>
        </div>
        <div className="slds-card__body">
          <table className="slds-table">
            <thead>
              <tr>
                <th>Date</th><th>Account</th><th>Type</th><th>Subject</th><th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map(a => {
                const acc = accounts.find(ac => ac.id === a.accountId);
                return (
                  <tr key={a.id}>
                    <td style={{ fontSize: 11, color: '#888' }}>{a.date}</td>
                    <td style={{ fontWeight: 600 }}>{acc?.name}</td>
                    <td><span className="badge badge-dark">{a.type}</span></td>
                    <td>{a.subject}</td>
                    <td>
                      <span className={`badge ${a.outcome === 'Positive' ? 'badge-success' : a.outcome === 'Negative' ? 'badge-error' : 'badge-neutral'}`}>
                        {a.outcome}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
