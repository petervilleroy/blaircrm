import { useState, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,

} from 'recharts';
import { accounts, contacts, getContactsByAccount, getActivitiesByAccount, getStakeholderLinksByAccount } from '../data';
import { MetricTile } from '../components/shared/MetricTile';
import { InsightCard } from '../components/shared/InsightCard';
import { CustomTooltip } from '../components/shared/CustomTooltip';

const ROLE_COLORS: Record<string, string> = {
  Champion: '#04844b',
  'Economic Buyer': '#0070d2',
  Blocker: '#c23934',
  Influencer: '#7526b0',
  User: '#706e6b',
  Coach: '#057070',
  Neutral: '#888888',
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#04844b',
  Neutral: '#0070d2',
  Negative: '#c23934',
  Unknown: '#888',
};

function StakeholderMap({ accountId }: { accountId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const accts_contacts = getContactsByAccount(accountId);
  const links = getStakeholderLinksByAccount(accountId);

  const W = 600, H = 340;
  const cx = W / 2, cy = H / 2;
  const r = 130;

  const positions = accts_contacts.map((c, i) => {
    const angle = (i / accts_contacts.length) * 2 * Math.PI - Math.PI / 2;
    const dist = i === 0 ? 0 : r * (0.6 + 0.4 * (i % 3 === 0 ? 1 : i % 3 === 1 ? 0.7 : 0.4));
    return {
      ...c,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
    };
  });

  return (
    <div style={{ background: 'radial-gradient(ellipse at center, #f0f7ff 0%, #e8f4ff 100%)', borderRadius: 4, padding: 8 }}>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 340 }}>
        {/* Links */}
        {links.slice(0, 12).map((l, i) => {
          const src = positions.find(p => p.id === l.sourceId);
          const tgt = positions.find(p => p.id === l.targetId);
          if (!src || !tgt) return null;
          return (
            <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={l.relationship === 'Blocks' ? '#c23934' : '#0070d280'}
              strokeWidth={l.strength / 4}
              strokeDasharray={l.relationship === 'Blocks' ? '4,3' : undefined}
            />
          );
        })}
        {/* Nodes */}
        {positions.map((c) => {
          const color = ROLE_COLORS[c.role] || '#888';
          const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
          const sentColor = SENTIMENT_COLORS[c.sentiment];
          return (
            <g key={c.id} style={{ cursor: 'pointer' }}>
              <circle cx={c.x} cy={c.y} r={22} fill={color} opacity={0.9} />
              <circle cx={c.x + 14} cy={c.y - 14} r={7} fill={sentColor} stroke="white" strokeWidth={1.5} />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight="700">{initials}</text>
              <text x={c.x} y={c.y + 34} textAnchor="middle" fill="#16325c" fontSize={9} fontWeight="600">
                {c.name.split(' ')[0]}
              </text>
              <text x={c.x} y={c.y + 44} textAnchor="middle" fill="#706e6b" fontSize={8}>
                {c.role}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {role}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RelationshipPage({ selectedAccountId }: { selectedAccountId?: string }) {
  const [activeAccount, setActiveAccount] = useState(selectedAccountId || accounts[0].id);
  const account = accounts.find(a => a.id === activeAccount)!;
  const acctContacts = getContactsByAccount(activeAccount);
  const acctActivities = getActivitiesByAccount(activeAccount);

  // Portfolio-level metrics
  const totalChampions = contacts.filter(c => c.role === 'Champion').length;
  const totalBlockers = contacts.filter(c => c.role === 'Blocker').length;
  const silentStakeholders = contacts.filter(c => c.engagementLevel === 'Silent').length;
  const negSentiment = contacts.filter(c => c.sentiment === 'Negative').length;

  // Engagement by account (for heatmap)
  const engagementData = accounts.slice(0, 20).map(a => ({
    name: a.name.split(' ')[0],
    engagement: a.engagementScore,
    health: a.healthScore,
    risk: a.riskScore,
  }));

  // Sentiment distribution for selected account
  const sentimentDist = ['Positive', 'Neutral', 'Negative', 'Unknown'].map(s => ({
    sentiment: s,
    count: acctContacts.filter(c => c.sentiment === s).length,
  }));

  // Radar chart for account relationship health
  const radarData = [
    { subject: 'Champions', A: acctContacts.filter(c => c.role === 'Champion').length * 20 },
    { subject: 'Engagement', A: account.engagementScore },
    { subject: 'Sentiment', A: acctContacts.filter(c => c.sentiment === 'Positive').length / Math.max(acctContacts.length, 1) * 100 },
    { subject: 'Coverage', A: Math.min(acctContacts.length * 12, 100) },
    { subject: 'Recency', A: (() => {
      if (!acctActivities.length) return 0;
      const last = acctActivities.sort((a,b) => b.date.localeCompare(a.date))[0].date;
      const diff = (new Date('2026-06-02').getTime() - new Date(last).getTime()) / (1000*86400);
      return Math.max(0, 100 - diff * 2);
    })() },
    { subject: 'Access', A: acctContacts.filter(c => c.engagementLevel !== 'Silent').length / Math.max(acctContacts.length, 1) * 100 },
  ];

  // AI Insights
  const blockers = acctContacts.filter(c => c.role === 'Blocker');
  const silentContacts = acctContacts.filter(c => c.engagementLevel === 'Silent');
  const missingEconomicBuyer = !acctContacts.find(c => c.role === 'Economic Buyer');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">🤝 Relationship Intelligence</div>
          <div className="page-header__subtitle">Map champions, blockers, and stakeholder alignment across your portfolio</div>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="metric-grid">
        <MetricTile label="Total Champions" value={totalChampions} color="success" />
        <MetricTile label="Active Blockers" value={totalBlockers} color="error" />
        <MetricTile label="Silent Stakeholders" value={silentStakeholders} color="warning" />
        <MetricTile label="Negative Sentiment" value={negSentiment} color="error" />
        <MetricTile label="Avg Engagement" value={`${Math.round(accounts.reduce((s,a) => s+a.engagementScore, 0)/accounts.length)}`} color="brand" />
        <MetricTile label="Contacts Mapped" value={contacts.length} color="purple" />
      </div>

      <div className="two-col">
        {/* Engagement Heatmap */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📊 Engagement Heatmap (Top 20 Accounts)</div>
          </div>
          <div className="slds-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4 }}>
              {engagementData.map(d => (
                <div key={d.name} style={{ display: 'contents' }}>
                  <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', color: '#444' }}>{d.name}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {['engagement', 'health'].map(key => {
                      const val = d[key as keyof typeof d] as number;
                      const bg = val >= 75 ? '#04844b' : val >= 50 ? '#0070d2' : val >= 30 ? '#ffb75d' : '#c23934';
                      return (
                        <div key={key} className="heatmap-cell" style={{ flex: 1, background: bg, opacity: 0.7 + val/300 }}>
                          {val}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10 }}>
              <span style={{ color: '#888' }}>Columns: </span>
              <span>📊 Engagement</span>
              <span>💚 Health</span>
              <span style={{ marginLeft: 'auto', color: '#888' }}>
                <span style={{ background: '#04844b', padding: '1px 6px', color: 'white', borderRadius: 2 }}>75+</span>{' '}
                <span style={{ background: '#0070d2', padding: '1px 6px', color: 'white', borderRadius: 2 }}>50+</span>{' '}
                <span style={{ background: '#ffb75d', padding: '1px 6px', color: 'white', borderRadius: 2 }}>30+</span>{' '}
                <span style={{ background: '#c23934', padding: '1px 6px', color: 'white', borderRadius: 2 }}>&lt;30</span>
              </span>
            </div>
          </div>
        </div>

        {/* Role Distribution Bar Chart */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">👥 Contact Role Distribution</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.entries(ROLE_COLORS).map(([role, color]) => ({
                role, count: contacts.filter(c => c.role === role).length, color
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="role" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Contacts" radius={[3,3,0,0]}>
                  {Object.entries(ROLE_COLORS).map(([_, color], i) => (
                    <rect key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Account Selector + Stakeholder Map */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🗺️ Stakeholder Map</div>
          <select
            value={activeAccount}
            onChange={e => setActiveAccount(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            <StakeholderMap accountId={activeAccount} />
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Stakeholder Roster</div>
                {acctContacts.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div className="avatar-sm" style={{ background: ROLE_COLORS[c.role] }}>{c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{c.title}</div>
                    </div>
                    <span className={`badge badge-${c.sentiment === 'Positive' ? 'success' : c.sentiment === 'Negative' ? 'error' : 'neutral'}`} style={{ fontSize: 9 }}>{c.sentiment}</span>
                    <span style={{ fontSize: 10, color: ROLE_COLORS[c.role], fontWeight: 700 }}>{c.role}</span>
                    <div className="progress-bar" style={{ width: 40 }}>
                      <div className="progress-bar__fill brand" style={{ width: `${c.influence * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Radar */}
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Relationship Health Radar</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name={account.name} dataKey="A" stroke="#0070d2" fill="#0070d2" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🤖 AI-Generated Relationship Insights — {account.name}</div>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            <div>
              {blockers.length > 0 && (
                <InsightCard
                  variant="critical"
                  title={`${blockers.length} Active Blocker${blockers.length > 1 ? 's' : ''} Detected`}
                  body={`${blockers.map(b => b.name).join(', ')} ${blockers.length > 1 ? 'are' : 'is'} blocking progress. Recommended: schedule a discovery call to uncover objections and reframe value.`}
                  action={{ label: 'Generate Outreach Plan', onClick: () => {} }}
                />
              )}
              {silentContacts.length > 0 && (
                <InsightCard
                  variant="warning"
                  title={`${silentContacts.length} Silent Stakeholder${silentContacts.length > 1 ? 's' : ''}`}
                  body={`${silentContacts.map(c => c.name).join(', ')} have gone silent (30+ days no engagement). Silence often precedes churn. Recommend re-engagement via executive outreach.`}
                  action={{ label: 'Create Re-Engagement Email', onClick: () => {} }}
                />
              )}
              {missingEconomicBuyer && (
                <InsightCard
                  variant="warning"
                  title="Economic Buyer Not Mapped"
                  body="No Economic Buyer identified for this account. Multi-stakeholder deals require economic buyer alignment before advancing to Commercial stage."
                  action={{ label: 'Map Economic Buyer', onClick: () => {} }}
                />
              )}
              {acctContacts.filter(c => c.role === 'Champion').length === 0 && (
                <InsightCard
                  variant="critical"
                  title="No Champion Identified"
                  body="This account has no active internal champion. Without a champion, the renewal risk increases significantly. Identify and develop a champion from the current contact list."
                  action={{ label: 'Build Champion Plan', onClick: () => {} }}
                />
              )}
              {acctContacts.filter(c => c.role === 'Champion').length > 0 && blockers.length === 0 && (
                <InsightCard
                  variant="success"
                  title="Strong Champion Coverage"
                  body={`${acctContacts.filter(c => c.role === 'Champion').map(c => c.name).join(' and ')} ${acctContacts.filter(c => c.role === 'Champion').length > 1 ? 'are' : 'is'} actively championing. Leverage for expansion or reference.`}
                  action={{ label: 'Draft Reference Request', onClick: () => {} }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Sentiment Analysis</div>
              {sentimentDist.map(s => (
                <div key={s.sentiment} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{s.sentiment}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: SENTIMENT_COLORS[s.sentiment] }}>{s.count} contacts</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${(s.count / Math.max(acctContacts.length, 1)) * 100}%`, background: SENTIMENT_COLORS[s.sentiment] }} />
                  </div>
                </div>
              ))}
              <div className="section-divider" />
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Engagement Level Breakdown</div>
              {['High', 'Medium', 'Low', 'Silent'].map(level => {
                const cnt = acctContacts.filter(c => c.engagementLevel === level).length;
                const colors: Record<string, string> = { High: '#04844b', Medium: '#0070d2', Low: '#ffb75d', Silent: '#c23934' };
                return (
                  <div key={level} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{level}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{cnt}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${(cnt / Math.max(acctContacts.length, 1)) * 100}%`, background: colors[level] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
