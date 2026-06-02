import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  accounts, getContactsByAccount, getActivitiesByAccount,
  getOpportunitiesByAccount, getMonthlyRevenueByAccount
} from '../data';
import { ScoreRing } from '../components/shared/ScoreRing';
import { InsightCard } from '../components/shared/InsightCard';
import { CustomTooltip } from '../components/shared/CustomTooltip';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const ROLE_COLORS: Record<string, string> = {
  Champion: '#04844b', 'Economic Buyer': '#0070d2', Blocker: '#c23934',
  Influencer: '#7526b0', User: '#706e6b', Coach: '#057070', Neutral: '#888888',
};

const TABS = ['Overview', 'Relationship', 'Risk', 'Opportunities', 'Activity', 'Stakeholders'];

export function AccountDetailPage({ accountId, onBack }: { accountId: string; onBack: () => void }) {
  const [tab, setTab] = useState('Overview');
  const account = accounts.find(a => a.id === accountId);
  if (!account) return <div>Account not found</div>;

  const contacts = getContactsByAccount(accountId);
  const activities = getActivitiesByAccount(accountId);
  const opps = getOpportunitiesByAccount(accountId);
  const revenue = getMonthlyRevenueByAccount(accountId);

  const revTrend = revenue.map(r => ({ month: r.month.slice(5), revenue: r.revenue / 1000, orders: r.orders }));
  const actByType: Record<string, number> = {};
  activities.forEach(a => { actByType[a.type] = (actByType[a.type] || 0) + 1; });

  const radarData = [
    { subject: 'Health', A: account.healthScore },
    { subject: 'Engagement', A: account.engagementScore },
    { subject: 'Expansion', A: account.expansionScore },
    { subject: 'Safety', A: 100 - account.riskScore },
    { subject: 'NPS', A: (account.nps + 100) / 2 },
    { subject: 'Activities', A: Math.min(100, activities.length * 4) },
  ];

  return (
    <div className="fade-in">
      {/* Back button */}
      <button className="slds-btn slds-btn-neutral" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to Accounts
      </button>

      {/* Account Header */}
      <div className="account-detail-header">
        <div className="account-avatar" style={{ background: account.churnRisk === 'Critical' ? '#c23934' : account.churnRisk === 'None' ? '#04844b' : '#0070d2' }}>
          {account.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{account.name}</h1>
            <span className={`badge badge-${account.churnRisk === 'Critical' ? 'error' : account.churnRisk === 'High' ? 'warning' : account.churnRisk === 'None' ? 'teal' : 'brand'}`}>{account.churnRisk} Risk</span>
            <span className={`badge badge-${account.tier === 'Platinum' ? 'purple' : account.tier === 'Gold' ? 'warning' : 'neutral'}`}>{account.tier}</span>
          </div>
          <div className="account-detail-meta">
            {[
              { label: 'Industry', value: account.industry },
              { label: 'Segment', value: account.segment },
              { label: 'ARR', value: fmt$(account.arr) },
              { label: 'Employees', value: account.employees.toLocaleString() },
              { label: 'Location', value: account.location },
              { label: 'CSM', value: account.csm },
              { label: 'AM', value: account.am },
              { label: 'Renewal', value: account.renewalDate },
              { label: 'Cycle Stage', value: account.cycleStage },
              { label: 'NPS', value: account.nps.toString() },
            ].map(m => (
              <div key={m.label} className="account-meta-item">
                <div className="account-meta-item__label">{m.label}</div>
                <div className="account-meta-item__value">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Score rings */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <ScoreRing value={account.healthScore} label="Health" size={75} />
          <ScoreRing value={account.engagementScore} label="Engage" size={75} />
          <ScoreRing value={account.expansionScore} label="Expand" size={75} />
          <ScoreRing value={account.riskScore} label="Risk" size={75} invert />
        </div>
      </div>

      {/* Products */}
      <div className="slds-card" style={{ marginBottom: 12 }}>
        <div className="slds-card__body" style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>CURRENT PRODUCTS:</span>
            {account.products.map(p => <span key={p} className="badge badge-teal">{p}</span>)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <div key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div className="two-col">
            <div className="slds-card">
              <div className="slds-card__header"><div className="slds-card__title">📈 Revenue Trend</div></div>
              <div className="slds-card__body">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={revTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toFixed(0)}K`} />} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke={account.revenueGrowthPct < 0 ? '#c23934' : '#0070d2'} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="slds-card">
              <div className="slds-card__header"><div className="slds-card__title">🎯 Account Health Radar</div></div>
              <div className="slds-card__body">
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0,100]} tick={false} />
                    <Radar name={account.name} dataKey="A" stroke="#0070d2" fill="#0070d2" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="slds-card">
            <div className="slds-card__header"><div className="slds-card__title">🤖 AI Summary</div></div>
            <div className="slds-card__body">
              <div className="two-col">
                <InsightCard
                  variant={account.churnRisk === 'Critical' ? 'critical' : account.churnRisk === 'High' ? 'warning' : 'success'}
                  title="Account Status Summary"
                  body={`${account.name} is a ${account.tier} tier ${account.segment} account in ${account.industry}. Current ARR: ${fmt$(account.arr)} with ${account.revenueGrowthPct > 0 ? '+' : ''}${account.revenueGrowthPct}% YoY growth. Health score: ${account.healthScore}/100. ${account.churnRisk === 'Critical' ? '⚠️ CRITICAL: Immediate executive intervention recommended.' : account.churnRisk === 'None' ? '✅ Account is in excellent shape — strong expansion candidate.' : 'Monitor closely and maintain engagement cadence.'}`}
                />
                <InsightCard
                  variant="info"
                  title="Recommended Actions"
                  body={`1. ${account.churnRisk !== 'None' ? 'Schedule risk mitigation call with CSM' : 'Identify expansion opportunity'}\n2. ${contacts.find(c => c.role === 'Champion') ? `Leverage ${contacts.find(c => c.role === 'Champion')!.name} for advocacy` : 'Develop a champion from existing contacts'}\n3. Prepare for renewal on ${account.renewalDate}\n4. Review product coverage — ${10 - account.products.length} product lines not yet adopted`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Stakeholders' && (
        <div className="slds-card">
          <div className="slds-card__header"><div className="slds-card__title">👥 Stakeholder Roster</div></div>
          <div className="slds-card__body" style={{ padding: 0 }}>
            <table className="slds-table">
              <thead>
                <tr><th>Name</th><th>Title</th><th>Role</th><th>Sentiment</th><th>Engagement</th><th>Influence</th><th>Last Contact</th></tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontSize: 11 }}>{c.title}</td>
                    <td><span className="badge" style={{ background: ROLE_COLORS[c.role] + '22', color: ROLE_COLORS[c.role], fontSize: 10 }}>{c.role}</span></td>
                    <td><span className={`badge badge-${c.sentiment === 'Positive' ? 'success' : c.sentiment === 'Negative' ? 'error' : 'neutral'}`} style={{ fontSize: 10 }}>{c.sentiment}</span></td>
                    <td><span className={`badge badge-${c.engagementLevel === 'High' ? 'success' : c.engagementLevel === 'Low' ? 'warning' : c.engagementLevel === 'Silent' ? 'error' : 'brand'}`} style={{ fontSize: 10 }}>{c.engagementLevel}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 40 }}><div className="progress-bar__fill brand" style={{ width: `${c.influence * 10}%` }} /></div>
                        <span style={{ fontSize: 11 }}>{c.influence}/10</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: '#888' }}>{c.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="two-col">
          <div className="slds-card">
            <div className="slds-card__header"><div className="slds-card__title">📋 Activity History</div></div>
            <div className="slds-card__body">
              <div className="timeline">
                {activities.sort((a,b) => b.date.localeCompare(a.date)).map(a => (
                  <div key={a.id} className={`timeline-item ${a.outcome.toLowerCase()}`}>
                    <div className="timeline-item__date">{a.date} · <span className="badge badge-dark" style={{ fontSize: 9 }}>{a.type}</span></div>
                    <div className="timeline-item__subject">{a.subject}</div>
                    <div className="timeline-item__notes">{a.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="slds-card">
            <div className="slds-card__header"><div className="slds-card__title">📊 Activity Breakdown</div></div>
            <div className="slds-card__body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={Object.entries(actByType).map(([type, count]) => ({ type, count }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" fill="#0070d2" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Opportunities' && (
        <div className="slds-card">
          <div className="slds-card__header"><div className="slds-card__title">💼 Opportunities</div></div>
          <div className="slds-card__body" style={{ padding: 0 }}>
            <table className="slds-table">
              <thead>
                <tr><th>Name</th><th>Type</th><th>Stage</th><th>Amount</th><th>Probability</th><th>Close Date</th><th>Age</th><th>Products</th></tr>
              </thead>
              <tbody>
                {opps.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td><span className="badge badge-brand" style={{ fontSize: 10 }}>{o.type}</span></td>
                    <td><span className={`badge badge-${o.stage === 'Closed Won' ? 'success' : o.stage === 'Closed Lost' ? 'error' : 'brand'}`} style={{ fontSize: 10 }}>{o.stage}</span></td>
                    <td style={{ fontWeight: 600 }}>{fmt$(o.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="progress-bar" style={{ width: 40 }}><div className="progress-bar__fill brand" style={{ width: `${o.probability}%` }} /></div>
                        <span style={{ fontSize: 11 }}>{o.probability}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 11 }}>{o.closeDate}</td>
                    <td style={{ fontSize: 11, color: o.ageInDays > 45 ? '#b35e00' : '#888' }}>{o.ageInDays}d</td>
                    <td><div className="tag-list">{o.products.map(p => <span key={p} className="tag">{p}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Relationship' && (
        <InsightCard variant="info" title="Relationship Intelligence" body="Navigate to the Relationship Intelligence pillar for full stakeholder mapping, sentiment analysis, and engagement planning for this account." action={{ label: 'Open Relationship Intel', onClick: () => {} }} />
      )}

      {tab === 'Risk' && (
        <InsightCard variant={account.churnRisk === 'Critical' ? 'critical' : 'warning'} title="Risk Intelligence" body="Navigate to the Churn & Risk Intelligence pillar for the full risk analysis, warning signals, and defense strategy for this account." action={{ label: 'Open Churn & Risk Intel', onClick: () => {} }} />
      )}
    </div>
  );
}
