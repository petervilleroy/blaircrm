import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { accounts, opportunities, getContactsByAccount } from '../data';
import { MetricTile } from '../components/shared/MetricTile';
import { InsightCard } from '../components/shared/InsightCard';
import { CustomTooltip } from '../components/shared/CustomTooltip';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const STAGES = ['Alignment', 'Value Proof', 'Multi-Stakeholder', 'Commercial', 'Decision', 'Closed Won', 'Closed Lost'];
const STAGE_COLORS: Record<string, string> = {
  Alignment: '#706e6b',
  'Value Proof': '#7526b0',
  'Multi-Stakeholder': '#0070d2',
  Commercial: '#057070',
  Decision: '#04844b',
  'Closed Won': '#04844b',
  'Closed Lost': '#c23934',
};

export function SalesCyclePage() {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0].id);
  const account = accounts.find(a => a.id === selectedAccountId)!;
  const acctContacts = getContactsByAccount(selectedAccountId);
  const acctOpps = opportunities.filter(o => o.accountId === selectedAccountId);

  // Funnel data
  const funnelData = STAGES.filter(s => !['Closed Won', 'Closed Lost'].includes(s)).map(stage => ({
    name: stage,
    value: opportunities.filter(o => o.stage === stage).length,
    amount: opportunities.filter(o => o.stage === stage).reduce((s, o) => s + o.amount, 0),
    fill: STAGE_COLORS[stage],
  }));

  // Stage distribution bar
  const stageBar = STAGES.map(stage => ({
    stage: stage.replace('-', '-\n'),
    count: opportunities.filter(o => o.stage === stage).length,
    value: Math.round(opportunities.filter(o => o.stage === stage).reduce((s, o) => s + o.amount, 0) / 1000),
  }));

  // Stalled deals (no activity > 30 days)
  const stalledDeals = opportunities.filter(o => {
    if (['Closed Won', 'Closed Lost'].includes(o.stage)) return false;
    return o.ageInDays > 45;
  }).slice(0, 8);

  // Win rate
  const wonOpps = opportunities.filter(o => o.stage === 'Closed Won');
  const lostOpps = opportunities.filter(o => o.stage === 'Closed Lost');
  const winRate = Math.round(wonOpps.length / Math.max(wonOpps.length + lostOpps.length, 1) * 100);

  // Buyer/seller alignment for selected account
  const alignmentData = [
    { subject: 'Needs Alignment', buyer: 75, seller: account.engagementScore },
    { subject: 'Stakeholder Coverage', buyer: 60, seller: Math.min(acctContacts.length * 15, 100) },
    { subject: 'Value Clarity', buyer: 80, seller: account.healthScore },
    { subject: 'Timeline Sync', buyer: 55, seller: acctOpps.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).length > 0 ? 70 : 30 },
    { subject: 'Commercial Fit', buyer: 70, seller: 100 - account.riskScore },
    { subject: 'Decision Readiness', buyer: 50, seller: acctOpps.find(o => o.stage === 'Decision') ? 85 : 40 },
  ];

  // Avg deal age by stage
  const avgAgeByStage = STAGES.filter(s => !['Closed Won','Closed Lost'].includes(s)).map(stage => {
    const opps = opportunities.filter(o => o.stage === stage);
    return {
      stage: stage.slice(0, 10),
      avgDays: opps.length ? Math.round(opps.reduce((s,o) => s + o.ageInDays, 0) / opps.length) : 0,
    };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">🔄 Sales Cycle Intelligence</div>
          <div className="page-header__subtitle">Align your sales cycle with where the customer actually is in their buying journey</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-grid">
        <MetricTile label="Open Opportunities" value={opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).length} color="brand" />
        <MetricTile label="Pipeline Value" value={fmt$(opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).reduce((s,o) => s+o.amount, 0))} color="purple" />
        <MetricTile label="Win Rate" value={`${winRate}%`} color="success" trend={{ value: '+3% vs last quarter', up: true }} />
        <MetricTile label="Stalled Deals (45+ days)" value={stalledDeals.length} color="warning" />
        <MetricTile label="Avg Deal Age (Active)" value={`${Math.round(opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).reduce((s,o) => s+o.ageInDays, 0) / Math.max(opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).length, 1))}d`} color="brand" />
        <MetricTile label="Closed Won (YTD)" value={fmt$(wonOpps.reduce((s,o) => s+o.amount, 0))} color="success" />
      </div>

      <div className="two-col">
        {/* Pipeline Funnel */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🏆 Pipeline Stage Funnel</div>
          </div>
          <div className="slds-card__body">
            {funnelData.map((stage, i) => (
              <div key={i} className="funnel-stage">
                <div style={{ width: 120, fontSize: 11, textAlign: 'right', color: '#555' }}>{stage.name}</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${Math.max(20, (stage.value / Math.max(...funnelData.map(f => f.value))) * 100)}%`,
                      background: stage.fill,
                    }}
                  >
                    {stage.value > 0 && `${stage.value} deals`}
                  </div>
                </div>
                <div style={{ width: 80, fontSize: 11, color: '#888', textAlign: 'right' }}>{fmt$(stage.amount)}</div>
              </div>
            ))}
            <div className="section-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Total open pipeline</span>
              <strong>{fmt$(funnelData.reduce((s, d) => s + d.amount, 0))}</strong>
            </div>
          </div>
        </div>

        {/* Stage by Value */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">💰 Deal Value by Stage</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v}K`} />} />
                <Bar dataKey="value" name="Pipeline Value" radius={[3,3,0,0]}>
                  {stageBar.map((_s, i) => (
                    <Cell key={i} fill={STAGE_COLORS[STAGES[i]] || '#0070d2'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Average Age by Stage */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">⏱️ Average Deal Age by Stage</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={avgAgeByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="d" />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} days`} />} />
                <Bar dataKey="avgDays" name="Avg Days" fill="#0070d2" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stalled Deals */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🚧 Stalled Deals (45+ days, no movement)</div>
          </div>
          <div className="slds-card__body" style={{ padding: 0 }}>
            <table className="slds-table">
              <thead>
                <tr><th>Account</th><th>Opportunity</th><th>Stage</th><th>Value</th><th>Age</th></tr>
              </thead>
              <tbody>
                {stalledDeals.map(o => {
                  const acc = accounts.find(a => a.id === o.accountId);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontSize: 11 }}>{acc?.name}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{o.name}</td>
                      <td><span className="badge badge-warning" style={{ fontSize: 9 }}>{o.stage}</span></td>
                      <td>{fmt$(o.amount)}</td>
                      <td style={{ color: o.ageInDays > 60 ? '#c23934' : '#b35e00', fontWeight: 700 }}>{o.ageInDays}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buyer/Seller Alignment */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🎯 Buyer/Seller Alignment Radar</div>
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
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={alignmentData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar name="Buyer Perspective" dataKey="buyer" stroke="#04844b" fill="#04844b" fillOpacity={0.2} />
                <Radar name="Seller Assessment" dataKey="seller" stroke="#0070d2" fill="#0070d2" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Alignment Analysis — {account.name}</div>
              {alignmentData.map(d => {
                const gap = Math.abs(d.buyer - d.seller);
                const isAligned = gap < 20;
                return (
                  <div key={d.subject} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11 }}>{d.subject}</span>
                      <span style={{ fontSize: 11, color: isAligned ? '#04844b' : gap > 35 ? '#c23934' : '#b35e00', fontWeight: 700 }}>
                        {isAligned ? '✓ Aligned' : `Gap: ${gap}pts`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-bar__fill" style={{ width: `${d.buyer}%`, background: '#04844b' }} />
                      </div>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-bar__fill" style={{ width: `${d.seller}%`, background: '#0070d2' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10 }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 4, background: '#04844b', borderRadius: 2 }} /> Buyer</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 4, background: '#0070d2', borderRadius: 2 }} /> Seller</span>
              </div>
              <div className="section-divider" />
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Account Opportunities</div>
              {acctOpps.length === 0 ? (
                <div style={{ color: '#888', fontSize: 12 }}>No open opportunities</div>
              ) : acctOpps.map(o => (
                <div key={o.id} style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{o.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                    <span className="badge badge-brand" style={{ fontSize: 9 }}>{o.stage}</span>
                    <span style={{ fontSize: 11 }}>{fmt$(o.amount)}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>Close: {o.closeDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🤖 AI Sales Cycle Recommendations — {account.name}</div>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            <div>
              <InsightCard
                variant={account.cycleStage === 'Alignment' ? 'info' : account.cycleStage === 'Decision' ? 'success' : 'info'}
                title={`Cycle Stage: ${account.cycleStage}`}
                body={`Based on activity patterns and stakeholder engagement, ${account.name} is in the ${account.cycleStage} stage. ${
                  account.cycleStage === 'Alignment' ? 'Focus on discovery — understand their internal buying process, key stakeholders, and decision criteria.' :
                  account.cycleStage === 'Value Proof' ? 'Deliver proof points. Prepare case studies, ROI models, and product demonstrations tailored to their use case.' :
                  account.cycleStage === 'Commercial' ? 'Move to commercial discussions. Prepare pricing options, negotiate terms, and align on procurement timeline.' :
                  account.cycleStage === 'Decision' ? 'Decision stage — ensure all objections are resolved and the Economic Buyer is aligned. Push for close.' :
                  account.cycleStage === 'Renewal' ? 'Renewal window approaching. Prepare success summary and early renewal incentive.' :
                  'Expansion opportunity identified. Prepare expansion proposal and engage new stakeholders.'
                }`}
                action={{ label: 'Generate Stage Action Plan', onClick: () => {} }}
              />
              {alignmentData.some(d => Math.abs(d.buyer - d.seller) > 30) && (
                <InsightCard
                  variant="warning"
                  title="Buyer/Seller Misalignment Detected"
                  body={`Significant misalignment in: ${alignmentData.filter(d => Math.abs(d.buyer - d.seller) > 30).map(d => d.subject).join(', ')}. Recommend an alignment call to surface buyer's current priorities.`}
                  action={{ label: 'Book Alignment Meeting', onClick: () => {} }}
                />
              )}
            </div>
            <div>
              <InsightCard
                variant="info"
                title="Next Meeting Preparation"
                body={`For your next interaction with ${account.name}, prepare: (1) Product usage summary and ROI impact, (2) New SKU recommendations based on their project pipeline, (3) Competitive differentiation talking points, (4) Reference from a similar customer in their industry.`}
                action={{ label: 'Generate Meeting Brief', onClick: () => {} }}
              />
              {acctOpps.some(o => o.ageInDays > 45 && !['Closed Won','Closed Lost'].includes(o.stage)) && (
                <InsightCard
                  variant="warning"
                  title="Stalled Opportunity Detected"
                  body={`${acctOpps.filter(o => o.ageInDays > 45 && !['Closed Won','Closed Lost'].includes(o.stage)).map(o => o.name).join(', ')} ${acctOpps.filter(o => o.ageInDays > 45 && !['Closed Won','Closed Lost'].includes(o.stage)).length > 1 ? 'have' : 'has'} been stalled. Recommend identifying the root cause — budget freeze, internal politics, or competitor evaluation.`}
                  action={{ label: 'Diagnose Stall Reason', onClick: () => {} }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
