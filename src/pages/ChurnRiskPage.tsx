import { useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { accounts, getActivitiesByAccount, getMonthlyRevenueByAccount } from '../data';
import { MetricTile } from '../components/shared/MetricTile';
import { InsightCard } from '../components/shared/InsightCard';
import { ScoreRing } from '../components/shared/ScoreRing';
import { CustomTooltip } from '../components/shared/CustomTooltip';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const RISK_COLORS: Record<string, string> = {
  Critical: '#c23934',
  High: '#ffb75d',
  Medium: '#0070d2',
  Low: '#04844b',
  None: '#057070',
};

function RiskGauge({ score }: { score: number }) {
  const angle = -135 + (score / 100) * 270;
  const color = score >= 70 ? '#c23934' : score >= 50 ? '#ffb75d' : score >= 30 ? '#0070d2' : '#04844b';
  return (
    <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 180 }}>
      {/* Gauge arcs */}
      {[
        { color: '#04844b', start: -135, end: -67 },
        { color: '#0070d2', start: -67, end: 0 },
        { color: '#ffb75d', start: 0, end: 67 },
        { color: '#c23934', start: 67, end: 135 },
      ].map((arc, i) => {
        const r = 70;
        const cx = 100, cy = 100;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(arc.start));
        const y1 = cy + r * Math.sin(toRad(arc.start));
        const x2 = cx + r * Math.cos(toRad(arc.end));
        const y2 = cy + r * Math.sin(toRad(arc.end));
        return (
          <path key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            fill="none" stroke={arc.color} strokeWidth={14} strokeLinecap="round"
          />
        );
      })}
      {/* Needle */}
      <line
        x1={100} y1={100}
        x2={100 + 55 * Math.cos((angle * Math.PI) / 180)}
        y2={100 + 55 * Math.sin((angle * Math.PI) / 180)}
        stroke={color} strokeWidth={3} strokeLinecap="round"
      />
      <circle cx={100} cy={100} r={6} fill={color} />
      <text x={100} y={88} textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>{score}</text>
      <text x={100} y={112} textAnchor="middle" fontSize={10} fill="#888">RISK SCORE</text>
      <text x={30} y={112} textAnchor="middle" fontSize={9} fill="#04844b">LOW</text>
      <text x={170} y={112} textAnchor="middle" fontSize={9} fill="#c23934">HIGH</text>
    </svg>
  );
}

export function ChurnRiskPage() {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find(a => a.churnRisk === 'Critical')?.id || accounts[0].id
  );
  const account = accounts.find(a => a.id === selectedAccountId)!;
  const activities = getActivitiesByAccount(selectedAccountId);
  const revenue = getMonthlyRevenueByAccount(selectedAccountId);

  // Critical accounts
  const criticalAccounts = accounts.filter(a => a.churnRisk === 'Critical');
  const highRiskAccounts = accounts.filter(a => a.churnRisk === 'High');
  const atRiskArr = [...criticalAccounts, ...highRiskAccounts].reduce((s, a) => s + a.arr, 0);

  // Risk scatter data
  const scatterData = accounts.map(a => ({
    name: a.name,
    x: a.engagementScore,
    y: a.riskScore,
    z: a.arr / 100000,
    risk: a.churnRisk,
  }));

  // Revenue trend for selected account
  const revTrend = revenue.map(r => ({ month: r.month.slice(5), revenue: r.revenue / 1000 }));
  const negativeActivities = activities.filter(a => a.outcome === 'Negative');
  const lastActivity = activities.sort((a, b) => b.date.localeCompare(a.date))[0];
  const daysSinceLastActivity = lastActivity
    ? Math.round((new Date('2026-06-02').getTime() - new Date(lastActivity.date).getTime()) / (1000 * 86400))
    : 99;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">🛡️ Churn &amp; Risk Intelligence</div>
          <div className="page-header__subtitle">Early signals, real truth, and the actions to protect the account</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-grid">
        <MetricTile label="Critical Risk Accounts" value={criticalAccounts.length} color="error" trend={{ value: `${fmt$(criticalAccounts.reduce((s,a) => s+a.arr, 0))} ARR`, up: false }} />
        <MetricTile label="High Risk Accounts" value={highRiskAccounts.length} color="warning" />
        <MetricTile label="ARR at Risk" value={fmt$(atRiskArr)} color="error" trend={{ value: '↑ vs last quarter', up: false }} />
        <MetricTile label="Competitor Threats" value={accounts.filter(a => a.competitorThreat === 'High').length} color="warning" />
        <MetricTile label="No QBR in 90+ Days" value={accounts.filter(a => {
          const d = new Date(a.lastQBR);
          const n = new Date('2026-06-02');
          return (n.getTime() - d.getTime()) / (1000*86400) > 90;
        }).length} color="error" />
        <MetricTile label="NPS Below 0" value={accounts.filter(a => a.nps < 0).length} color="error" />
      </div>

      <div className="two-col">
        {/* Risk vs Engagement Scatter */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📉 Risk vs. Engagement Matrix</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" dataKey="x" name="Engagement" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Engagement Score', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Risk" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[40, 300]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div className="custom-tooltip"><div className="label">{d.name}</div><div className="value">Risk: {Math.round(d.y)} | Engagement: {Math.round(d.x)}</div></div>;
                }} />
                <ReferenceLine x={50} stroke="#ccc" strokeDasharray="4 4" />
                <ReferenceLine y={50} stroke="#ccc" strokeDasharray="4 4" />
                <Scatter data={scatterData} fill="#0070d2">
                  {scatterData.map((d, i) => (
                    <circle key={i} style={{ fill: RISK_COLORS[d.risk] }} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>Bubble size = ARR · Top-left quadrant = highest churn risk</div>
          </div>
        </div>

        {/* Critical Accounts Table */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🚨 Critical &amp; High Risk Accounts</div>
          </div>
          <div className="slds-card__body" style={{ padding: 0 }}>
            <table className="slds-table">
              <thead>
                <tr>
                  <th>Account</th><th>Risk</th><th>Score</th><th>ARR</th><th>Competitor</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...criticalAccounts, ...highRiskAccounts].map(a => (
                  <tr key={a.id} onClick={() => setSelectedAccountId(a.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td><span className={`badge badge-${a.churnRisk === 'Critical' ? 'error' : 'warning'}`}>{a.churnRisk}</span></td>
                    <td style={{ color: a.riskScore >= 70 ? '#c23934' : '#b35e00', fontWeight: 700 }}>{a.riskScore}</td>
                    <td>{fmt$(a.arr)}</td>
                    <td><span className={`badge badge-${a.competitorThreat === 'High' ? 'error' : a.competitorThreat === 'Medium' ? 'warning' : 'neutral'}`}>{a.competitorThreat}</span></td>
                    <td><button className="slds-btn slds-btn-danger" style={{ fontSize: 10, padding: '2px 8px' }}>Defend</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Account Deep Dive */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🔍 Account Risk Deep Dive</div>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} [{a.churnRisk}]</option>)}
          </select>
        </div>
        <div className="slds-card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 24 }}>
            {/* Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <RiskGauge score={account.riskScore} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <ScoreRing value={account.healthScore} label="Health" size={70} />
                <ScoreRing value={account.engagementScore} label="Engage" size={70} />
                <ScoreRing value={account.riskScore} label="Risk" size={70} invert />
              </div>
            </div>

            {/* Revenue Trend */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Revenue Trend (12 Months)</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={revTrend.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
                  <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toFixed(0)}K`} />} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={account.revenueGrowthPct < 0 ? '#c23934' : '#04844b'} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Warning Signals */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>⚠️ Warning Signals</div>
              {[
                { active: account.riskScore >= 70, icon: '🔴', label: 'Critical Risk Score', detail: `Score: ${account.riskScore}/100` },
                { active: account.competitorThreat === 'High', icon: '⚔️', label: 'Competitor Threat', detail: 'Active competitive pressure detected' },
                { active: account.nps < 0, icon: '😠', label: 'Negative NPS', detail: `NPS: ${account.nps}` },
                { active: daysSinceLastActivity > 14, icon: '🔕', label: 'Engagement Gap', detail: `${daysSinceLastActivity} days since last activity` },
                { active: negativeActivities.length > 2, icon: '📉', label: 'Negative Interactions', detail: `${negativeActivities.length} negative outcomes recorded` },
                { active: account.revenueGrowthPct < -5, icon: '💸', label: 'Revenue Declining', detail: `${account.revenueGrowthPct}% YoY` },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 14, opacity: s.active ? 1 : 0.25 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: s.active ? 700 : 400, color: s.active ? '#c23934' : '#ccc' }}>{s.label}</div>
                    {s.active && <div style={{ fontSize: 10, color: '#888' }}>{s.detail}</div>}
                  </div>
                  {s.active ? (
                    <span className="badge badge-error" style={{ fontSize: 9 }}>Active</span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: 9 }}>OK</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Risk Insights */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🤖 AI Risk Mitigation Recommendations — {account.name}</div>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            <div>
              {account.churnRisk === 'Critical' && (
                <InsightCard
                  variant="critical"
                  title="URGENT: Churn Risk is Critical"
                  body={`${account.name} shows multiple churn indicators: declining revenue (${account.revenueGrowthPct}% YoY), ${account.competitorThreat === 'High' ? 'active competitive threat, ' : ''}low NPS (${account.nps}). Immediate executive escalation recommended.`}
                  action={{ label: 'Generate Defense Strategy', onClick: () => {} }}
                />
              )}
              {account.competitorThreat !== 'None' && (
                <InsightCard
                  variant="warning"
                  title={`${account.competitorThreat} Competitor Threat`}
                  body={`Competitive pricing pressure detected. Recommend scheduling an executive business review to reinforce ACME Tools' value proposition and switching costs.`}
                  action={{ label: 'Build Competitive Battle Card', onClick: () => {} }}
                />
              )}
              <InsightCard
                variant="info"
                title="Recommended Next Steps"
                body={`1. Schedule EBR within 2 weeks\n2. Prepare ROI analysis comparing ACME to competitors\n3. Identify and re-engage silent stakeholders\n4. Review open commitments and unresolved issues`}
                action={{ label: 'Create Action Plan', onClick: () => {} }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Risk Factor Breakdown</div>
              {[
                { label: 'Relationship Health', score: 100 - account.riskScore, color: '#0070d2' },
                { label: 'Engagement Quality', score: account.engagementScore, color: '#04844b' },
                { label: 'Revenue Stability', score: Math.min(100, Math.max(0, 50 + account.revenueGrowthPct * 2)), color: '#7526b0' },
                { label: 'Competitive Position', score: account.competitorThreat === 'High' ? 20 : account.competitorThreat === 'Medium' ? 50 : account.competitorThreat === 'Low' ? 75 : 90, color: '#057070' },
                { label: 'NPS / Sentiment', score: Math.min(100, Math.max(0, (account.nps + 100) / 2)), color: '#ffb75d' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: f.score < 40 ? '#c23934' : f.score < 60 ? '#b35e00' : '#04844b' }}>{Math.round(f.score)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${f.score}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
