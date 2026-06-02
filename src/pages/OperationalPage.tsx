import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  
} from 'recharts';
import { accounts, activities, opportunities, getActivitiesByAccount } from '../data';
import { MetricTile } from '../components/shared/MetricTile';
import { InsightCard } from '../components/shared/InsightCard';
import { CustomTooltip } from '../components/shared/CustomTooltip';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function daysSince(dateStr: string): number {
  return Math.round((new Date('2026-06-02').getTime() - new Date(dateStr).getTime()) / (1000 * 86400));
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date('2026-06-02').getTime()) / (1000 * 86400));
}

export function OperationalPage() {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0].id);
  const account = accounts.find(a => a.id === selectedAccountId)!;
  const acctActivities = getActivitiesByAccount(selectedAccountId);
  const acctOpps = opportunities.filter(o => o.accountId === selectedAccountId);

  // Account health overview
  const overdueQBR = accounts.filter(a => daysSince(a.lastQBR) > 90);
  const upcomingRenewals30 = accounts.filter(a => { const d = daysUntil(a.renewalDate); return d >= 0 && d <= 30; });
  const upcomingRenewals60 = accounts.filter(a => { const d = daysUntil(a.renewalDate); return d > 30 && d <= 60; });
  const upcomingRenewals90 = accounts.filter(a => { const d = daysUntil(a.renewalDate); return d > 60 && d <= 90; });

  // Activity type breakdown
  const activityTypes = ['Call', 'Email', 'Meeting', 'Demo', 'QBR', 'EBR', 'Support Ticket', 'Renewal Discussion', 'Proposal'];
  const activityBreakdown = activityTypes.map(type => ({
    type,
    count: activities.filter(a => a.type === type).length,
  }));

  // CSM workload
  const csmWorkload = ['Sarah Chen', 'Marcus Williams', 'Jennifer Torres', 'David Kim', 'Rachel Patel'].map(csm => ({
    csm: csm.split(' ')[0],
    accounts: accounts.filter(a => a.csm === csm).length,
    arr: accounts.filter(a => a.csm === csm).reduce((s, a) => s + a.arr, 0),
    atRisk: accounts.filter(a => a.csm === csm && (a.churnRisk === 'Critical' || a.churnRisk === 'High')).length,
  }));

  // Commitment tracker (open opportunities as proxy)
  const openCommitments = acctOpps.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage));

  const qbrDays = daysSince(account.lastQBR);

  // Recent activities for timeline
  const recentActs = acctActivities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const renewalByMonth: Record<string, { count: number; arr: number }> = {};
  accounts.forEach(a => {
    const month = a.renewalDate.slice(0, 7);
    if (!renewalByMonth[month]) renewalByMonth[month] = { count: 0, arr: 0 };
    renewalByMonth[month].count++;
    renewalByMonth[month].arr += a.arr;
  });
  const renewalData = Object.entries(renewalByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12)
    .map(([month, d]) => { const data = d as { count: number; arr: number }; return { month: month.slice(5), count: data.count, arr: Math.round(data.arr / 1000) }; });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">⚙️ Operational Intelligence</div>
          <div className="page-header__subtitle">The BAU CSM/AM work and admin — automated. Auto-generate QBRs, EBRs, ROI analysis, and renewal prep.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-grid">
        <MetricTile label="Overdue QBR (90+ days)" value={overdueQBR.length} color="error" />
        <MetricTile label="Renewals in 30 Days" value={upcomingRenewals30.length} color="error" trend={{ value: fmt$(upcomingRenewals30.reduce((s,a) => s+a.arr, 0)), up: false }} />
        <MetricTile label="Renewals in 60 Days" value={upcomingRenewals60.length} color="warning" trend={{ value: fmt$(upcomingRenewals60.reduce((s,a) => s+a.arr, 0)), up: false }} />
        <MetricTile label="Renewals in 90 Days" value={upcomingRenewals90.length} color="brand" />
        <MetricTile label="Total Activities (YTD)" value={activities.length} color="teal" />
        <MetricTile label="Renewal ARR at Stake" value={fmt$(upcomingRenewals30.concat(upcomingRenewals60).concat(upcomingRenewals90).reduce((s,a) => s+a.arr, 0))} color="purple" />
      </div>

      <div className="two-col">
        {/* Renewal Pipeline */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📅 Renewal Pipeline by Month</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={renewalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="count" name="Renewals" fill="#0070d2" radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="arr" name="ARR ($K)" fill="#7526b0" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CSM Workload */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">👤 CSM Workload Distribution</div>
          </div>
          <div className="slds-card__body">
            {csmWorkload.map(c => (
              <div key={c.csm} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar-sm" style={{ background: '#0070d2', width: 24, height: 24, fontSize: 10 }}>{c.csm.slice(0, 2)}</div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.csm}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span>{c.accounts} accts</span>
                    <span style={{ color: '#888' }}>|</span>
                    <span>{fmt$(c.arr)}</span>
                    {c.atRisk > 0 && <span className="badge badge-error" style={{ fontSize: 9 }}>{c.atRisk} at risk</span>}
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill brand" style={{ width: `${(c.accounts / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue QBR Table */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">⚠️ Accounts Overdue for QBR</div>
        </div>
        <div className="slds-card__body" style={{ padding: 0 }}>
          <table className="slds-table">
            <thead>
              <tr><th>Account</th><th>Last QBR</th><th>Days Overdue</th><th>ARR</th><th>Risk</th><th>CSM</th><th>Action</th></tr>
            </thead>
            <tbody>
              {overdueQBR.sort((a,b) => daysSince(b.lastQBR) - daysSince(a.lastQBR)).map(a => (
                <tr key={a.id} onClick={() => setSelectedAccountId(a.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ fontSize: 11, color: '#888' }}>{a.lastQBR}</td>
                  <td style={{ color: daysSince(a.lastQBR) > 120 ? '#c23934' : '#b35e00', fontWeight: 700 }}>{daysSince(a.lastQBR)}d</td>
                  <td>{fmt$(a.arr)}</td>
                  <td><span className={`badge badge-${a.churnRisk === 'Critical' ? 'error' : a.churnRisk === 'High' ? 'warning' : 'brand'}`}>{a.churnRisk}</span></td>
                  <td style={{ fontSize: 11 }}>{a.csm}</td>
                  <td><button className="slds-btn slds-btn-brand" style={{ fontSize: 10, padding: '2px 8px' }} onClick={e => e.stopPropagation()}>Generate QBR</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Operational Detail */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">📋 Account Operational View</div>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            {/* Activity Timeline */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 12 }}>Activity Timeline</div>
              <div className="timeline">
                {recentActs.map(a => (
                  <div key={a.id} className={`timeline-item ${a.outcome.toLowerCase()}`}>
                    <div className="timeline-item__date">{a.date} · <span className="badge badge-dark" style={{ fontSize: 9 }}>{a.type}</span></div>
                    <div className="timeline-item__subject">{a.subject}</div>
                    <div className="timeline-item__notes">{a.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Metrics */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 12 }}>Operational Health</div>

              {[
                { label: 'QBR Cadence', value: `Last: ${account.lastQBR}`, score: Math.max(0, 100 - qbrDays), alert: qbrDays > 90 },
                { label: 'Renewal', value: `Due: ${account.renewalDate}`, score: Math.min(100, Math.max(0, 100 - daysUntil(account.renewalDate))), alert: daysUntil(account.renewalDate) < 60 },
                { label: 'Activity Frequency', value: `${acctActivities.length} total`, score: Math.min(100, acctActivities.length * 4), alert: acctActivities.length < 10 },
                { label: 'Account Health', value: `Score: ${account.healthScore}`, score: account.healthScore, alert: account.healthScore < 40 },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: m.alert ? '#c23934' : '#888' }}>{m.value}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${m.score}%`, background: m.score >= 70 ? '#04844b' : m.score >= 40 ? '#0070d2' : '#c23934' }} />
                  </div>
                </div>
              ))}

              <div className="section-divider" />
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Open Commitments</div>
              {openCommitments.length === 0 ? (
                <div style={{ fontSize: 12, color: '#888' }}>No open commitments</div>
              ) : openCommitments.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 11 }}>•</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12 }}>{o.name}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>Close: {o.closeDate} · {fmt$(o.amount)}</div>
                  </div>
                  <span className="badge badge-brand" style={{ fontSize: 9 }}>{o.stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Breakdown + AI Insights */}
      <div className="two-col">
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📊 Portfolio Activity Breakdown</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activityBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#0070d2" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🤖 AI Operational Recommendations — {account.name}</div>
          </div>
          <div className="slds-card__body">
            {qbrDays > 90 && (
              <InsightCard
                variant="critical"
                title={`QBR Overdue by ${qbrDays - 90} Days`}
                body={`${account.name} has not had a QBR in ${qbrDays} days. This creates a risk gap. Auto-generating QBR agenda and success summary now.`}
                action={{ label: 'Auto-Generate QBR Deck', onClick: () => {} }}
              />
            )}
            {daysUntil(account.renewalDate) <= 90 && daysUntil(account.renewalDate) >= 0 && (
              <InsightCard
                variant="warning"
                title={`Renewal in ${daysUntil(account.renewalDate)} Days`}
                body={`Renewal prep for ${account.name} should begin now. Generate renewal summary, ROI report, and pricing options.`}
                action={{ label: 'Generate Renewal Prep', onClick: () => {} }}
              />
            )}
            <InsightCard
              variant="info"
              title="Auto-Generated Next Steps"
              body={`Recommended actions for ${account.name}:\n1. ${qbrDays > 60 ? 'Schedule overdue QBR' : 'Confirm next QBR date'}\n2. Update account success plan\n3. Review open commitments with champion\n4. Prepare ROI update for upcoming renewal`}
              action={{ label: 'Create Success Plan', onClick: () => {} }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
