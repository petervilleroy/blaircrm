import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  Cell
} from 'recharts';
import { accounts, opportunities, contacts, getContactsByAccount, PRODUCTS } from '../data';
import { MetricTile } from '../components/shared/MetricTile';
import { InsightCard } from '../components/shared/InsightCard';
import { CustomTooltip } from '../components/shared/CustomTooltip';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const EXPANSION_COLORS: Record<string, string> = {
  Upsell: '#04844b',
  'Cross-sell': '#0070d2',
  Renewal: '#7526b0',
  'New SKU': '#057070',
  Expansion: '#ffb75d',
};

export function ExpansionPage() {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find(a => a.expansionScore >= 70)?.id || accounts[0].id
  );
  const account = accounts.find(a => a.id === selectedAccountId)!;
  const acctContacts = getContactsByAccount(selectedAccountId);

  // Expansion opportunities
  const expansionOpps = opportunities.filter(o => ['Upsell', 'Cross-sell', 'New SKU', 'Expansion'].includes(o.type) && !['Closed Lost'].includes(o.stage));
  const expansionPipeline = expansionOpps.reduce((s, o) => s + o.amount, 0);
  const wonExpansion = opportunities.filter(o => ['Upsell', 'Cross-sell', 'New SKU', 'Expansion'].includes(o.type) && o.stage === 'Closed Won');

  // Expansion by type
  const byType = Object.keys(EXPANSION_COLORS).map(type => ({
    type,
    count: opportunities.filter(o => o.type === type && !['Closed Lost'].includes(o.stage)).length,
    value: Math.round(opportunities.filter(o => o.type === type && !['Closed Lost'].includes(o.stage)).reduce((s, o) => s + o.amount, 0) / 1000),
    color: EXPANSION_COLORS[type],
  }));


  // Top expansion opportunities
  const topAccounts = accounts.slice(0, 15);
  const topExpansionAccounts = accounts
    .filter(a => a.expansionScore >= 60)
    .sort((a, b) => b.expansionScore - a.expansionScore)
    .slice(0, 10);

  // Revenue growth vs expansion score
  const scatterData = accounts.map(a => ({
    name: a.name,
    x: a.expansionScore,
    y: a.revenueGrowthPct,
    z: a.arr / 100000,
    tier: a.tier,
  }));

  // Champion contacts (internal advocates)
  const champions = contacts.filter(c => c.role === 'Champion').slice(0, 8);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">📈 Expansion Intelligence</div>
          <div className="page-header__subtitle">Detect, qualify, and accelerate expansion through usage signals and internal advocacy</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="metric-grid">
        <MetricTile label="Expansion Pipeline" value={fmt$(expansionPipeline)} color="success" trend={{ value: '+12% this quarter', up: true }} />
        <MetricTile label="Active Expansion Opps" value={expansionOpps.length} color="brand" />
        <MetricTile label="Won Expansion (YTD)" value={fmt$(wonExpansion.reduce((s,o) => s+o.amount, 0))} color="success" trend={{ value: `${wonExpansion.length} deals closed`, up: true }} />
        <MetricTile label="High Expansion Score" value={accounts.filter(a => a.expansionScore >= 70).length} color="teal" />
        <MetricTile label="Internal Champions" value={contacts.filter(c => c.role === 'Champion').length} color="purple" />
        <MetricTile label="Avg Expansion Score" value={Math.round(accounts.reduce((s,a) => s+a.expansionScore, 0)/accounts.length)} color="brand" />
      </div>

      <div className="two-col">
        {/* Expansion Pipeline by Type */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">💰 Expansion Pipeline by Type</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v}K`} />} />
                <Bar dataKey="value" name="Pipeline Value" radius={[3,3,0,0]}>
                  {byType.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {byType.map(d => (
                <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                  {d.type}: {d.count} opps
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expansion Score Leaderboard */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🏆 Top Expansion Opportunities</div>
          </div>
          <div className="slds-card__body" style={{ padding: 0 }}>
            <table className="slds-table">
              <thead>
                <tr><th>Account</th><th>Exp. Score</th><th>ARR</th><th>Growth</th><th>Signal</th></tr>
              </thead>
              <tbody>
                {topExpansionAccounts.map(a => (
                  <tr key={a.id} onClick={() => setSelectedAccountId(a.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 48 }}>
                          <div className="progress-bar__fill" style={{ width: `${a.expansionScore}%`, background: '#04844b' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#04844b' }}>{a.expansionScore}</span>
                      </div>
                    </td>
                    <td>{fmt$(a.arr)}</td>
                    <td style={{ color: a.revenueGrowthPct > 0 ? '#04844b' : '#c23934', fontWeight: 600 }}>
                      {a.revenueGrowthPct > 0 ? '+' : ''}{a.revenueGrowthPct}%
                    </td>
                    <td>
                      <span className={`badge badge-${a.expansionScore >= 80 ? 'success' : 'brand'}`} style={{ fontSize: 9 }}>
                        {a.expansionScore >= 80 ? '🔥 Hot' : '📊 Warm'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Coverage Heatmap */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🗺️ Product Coverage Heatmap (Top 15 Accounts)</div>
        </div>
        <div className="slds-card__body">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 10, color: '#888', width: 140 }}>Account</th>
                  {PRODUCTS.map(p => (
                    <th key={p} style={{ textAlign: 'center', padding: '4px 4px', fontSize: 9, color: '#555', minWidth: 70, maxWidth: 70, wordBreak: 'break-word' }}>
                      {p.split(' ').slice(0, 2).join(' ')}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontSize: 10, color: '#888' }}>Exp.</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map(a => (
                  <tr key={a.id} onClick={() => setSelectedAccountId(a.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '3px 8px', fontWeight: a.id === selectedAccountId ? 700 : 400, color: '#333' }}>{a.name.split(' ').slice(0,2).join(' ')}</td>
                    {PRODUCTS.map(p => {
                      const has = a.products.includes(p);
                      return (
                        <td key={p} style={{ textAlign: 'center', padding: '3px 4px' }}>
                          {has ? (
                            <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 3, background: '#04844b', fontSize: 10, lineHeight: '20px', color: 'white', fontWeight: 700 }}>✓</span>
                          ) : (
                            <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 3, background: '#f0f9f4', border: '2px dashed #b3dfc8', fontSize: 9, lineHeight: '17px', color: '#04844b', textAlign: 'center' }} title="Expansion opportunity">+</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: a.expansionScore >= 70 ? '#04844b' : '#0070d2' }}>{a.expansionScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 10, color: '#888' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#04844b', marginRight: 4, verticalAlign: 'middle' }} />Current product</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#f0f9f4', border: '2px dashed #b3dfc8', marginRight: 4, verticalAlign: 'middle' }} />Expansion opportunity</span>
          </div>
        </div>
      </div>

      {/* Growth Momentum + Account Detail */}
      <div className="two-col">
        {/* Scatter: Expansion Score vs Revenue Growth */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">📊 Expansion Score vs Revenue Growth</div>
          </div>
          <div className="slds-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" dataKey="x" name="Expansion Score" domain={[0,100]} tick={{ fontSize: 10 }} label={{ value: 'Expansion Score', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Rev Growth %" tick={{ fontSize: 10 }} label={{ value: 'Rev Growth %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[40, 280]} />
                <ReferenceLine x={60} stroke="#ccc" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#ccc" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div className="custom-tooltip"><div className="label">{d.name}</div><div className="value">Score: {d.x} | Growth: {d.y}%</div></div>;
                }} />
                <Scatter data={scatterData} fill="#0070d2">
                  {scatterData.map((d, i) => (
                    <circle key={i} style={{ fill: d.y > 10 ? '#04844b' : d.y > 0 ? '#0070d2' : '#c23934' }} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Champion Internal Advocates */}
        <div className="slds-card">
          <div className="slds-card__header">
            <div className="slds-card__title">🌟 Top Internal Advocates / Champions</div>
          </div>
          <div className="slds-card__body">
            {champions.map(c => {
              const acc = accounts.find(a => a.id === c.accountId);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div className="avatar-sm" style={{ background: '#04844b' }}>{c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>{c.title} · {acc?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888' }}>Influence</div>
                    <div style={{ fontWeight: 700, color: '#04844b', fontSize: 13 }}>{c.influence}/10</div>
                  </div>
                  <span className={`badge badge-${c.sentiment === 'Positive' ? 'success' : 'neutral'}`} style={{ fontSize: 9 }}>{c.sentiment}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Expansion Insights */}
      <div className="slds-card">
        <div className="slds-card__header">
          <div className="slds-card__title">🤖 AI Expansion Recommendations — {account.name}</div>
        </div>
        <div className="slds-card__body">
          <div className="two-col">
            <div>
              {account.expansionScore >= 70 && (
                <InsightCard
                  variant="success"
                  title={`High Expansion Signal (Score: ${account.expansionScore})`}
                  body={`${account.name} shows strong expansion signals. They're currently using ${account.products.length} of ${PRODUCTS.length} product lines. Recommended expansion: ${PRODUCTS.filter(p => !account.products.includes(p)).slice(0, 2).join(' and ')}.`}
                  action={{ label: 'Generate Expansion Proposal', onClick: () => {} }}
                />
              )}
              {account.products.length < PRODUCTS.length && (
                <InsightCard
                  variant="info"
                  title="Cross-Sell Opportunities Identified"
                  body={`${account.name} is not currently purchasing: ${PRODUCTS.filter(p => !account.products.includes(p)).join(', ')}. Based on their industry (${account.industry}) and size, these products are high-probability cross-sell candidates.`}
                  action={{ label: 'Create Cross-Sell Brief', onClick: () => {} }}
                />
              )}
            </div>
            <div>
              {acctContacts.filter(c => c.role === 'Champion').length > 0 && (
                <InsightCard
                  variant="success"
                  title="Internal Champion Available for Expansion"
                  body={`${acctContacts.filter(c => c.role === 'Champion').map(c => c.name).join(', ')} can facilitate internal introductions to new teams or departments. Leverage them to expand the footprint.`}
                  action={{ label: 'Draft Champion Outreach', onClick: () => {} }}
                />
              )}
              <InsightCard
                variant="info"
                title="Recommended Expansion Motion"
                body={`For ${account.name} (${account.segment}, ${account.industry}): (1) Present ROI summary from current product usage, (2) Introduce ${PRODUCTS.filter(p => !account.products.includes(p))[0] || 'additional product lines'} with case study, (3) Propose pilot agreement, (4) Schedule executive sponsor meeting.`}
                action={{ label: 'Build ROI Summary', onClick: () => {} }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
