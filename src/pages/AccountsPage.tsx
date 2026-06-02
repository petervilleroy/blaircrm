import { useState, useMemo } from 'react';
import { accounts } from '../data';
import type { Account } from '../data';

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function RiskBadge({ risk }: { risk: Account['churnRisk'] }) {
  const cls = risk === 'Critical' ? 'badge-error' : risk === 'High' ? 'badge-warning' : risk === 'Medium' ? 'badge-brand' : risk === 'Low' ? 'badge-success' : 'badge-teal';
  return <span className={`badge ${cls}`}>{risk}</span>;
}

function TierBadge({ tier }: { tier: Account['tier'] }) {
  const cls = tier === 'Platinum' ? 'badge-purple' : tier === 'Gold' ? 'badge-warning' : tier === 'Silver' ? 'badge-neutral' : 'badge-dark';
  return <span className={`badge ${cls}`}>{tier}</span>;
}

const INDUSTRIES = ['All', 'Construction', 'Retail', 'Distribution', 'Industrial', 'Property Management', 'Contracting'];
const RISKS = ['All', 'Critical', 'High', 'Medium', 'Low', 'None'];
const SEGMENTS = ['All', 'Enterprise', 'Mid-Market', 'SMB'];

export function AccountsPage({ onSelectAccount }: { onSelectAccount: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [risk, setRisk] = useState('All');
  const [segment, setSegment] = useState('All');
  const [sort, setSort] = useState<{ key: keyof Account; dir: 1 | -1 }>({ key: 'arr', dir: -1 });

  const filtered = useMemo(() => {
    return accounts
      .filter(a =>
        (search === '' || a.name.toLowerCase().includes(search.toLowerCase()) || a.location.toLowerCase().includes(search.toLowerCase())) &&
        (industry === 'All' || a.industry === industry) &&
        (risk === 'All' || a.churnRisk === risk) &&
        (segment === 'All' || a.segment === segment)
      )
      .sort((a, b) => {
        const av = a[sort.key] as any;
        const bv = b[sort.key] as any;
        return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
      });
  }, [search, industry, risk, segment, sort]);

  const toggleSort = (key: keyof Account) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 });
  };

  const sortIcon = (key: keyof Account) =>
    sort.key === key ? (sort.dir === -1 ? ' ↓' : ' ↑') : '';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-header__title">🏢 Account Portfolio</div>
          <div className="page-header__subtitle">{filtered.length} of {accounts.length} accounts · Click any row to view details</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="slds-btn slds-btn-neutral">📥 Export CSV</button>
          <button className="slds-btn slds-btn-brand">+ New Account</button>
        </div>
      </div>

      {/* Filters */}
      <div className="slds-card" style={{ marginBottom: 16 }}>
        <div className="slds-card__body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: '1 1 240px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="account-search"
                placeholder="Search accounts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {[
              { label: 'Industry', val: industry, opts: INDUSTRIES, set: setIndustry },
              { label: 'Churn Risk', val: risk, opts: RISKS, set: setRisk },
              { label: 'Segment', val: segment, opts: SEGMENTS, set: setSegment },
            ].map(f => (
              <select
                key={f.label}
                value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
              >
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{filtered.length} results</span>
          </div>
        </div>
      </div>

      <div className="slds-card">
        <div className="slds-card__body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="slds-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Account{sortIcon('name')}</th>
                  <th>Industry</th>
                  <th>Segment</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('arr')}>ARR{sortIcon('arr')}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('healthScore')}>Health{sortIcon('healthScore')}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('riskScore')}>Risk{sortIcon('riskScore')}</th>
                  <th>Churn Risk</th>
                  <th>Tier</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('engagementScore')}>Engage{sortIcon('engagementScore')}</th>
                  <th>CSM</th>
                  <th>Renewal</th>
                  <th>Cycle Stage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} onClick={() => onSelectAccount(a.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar-sm" style={{ background: a.churnRisk === 'Critical' ? '#c23934' : a.churnRisk === 'None' ? '#04844b' : '#0070d2', fontSize: 10 }}>
                          {a.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: '#888' }}>{a.location}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-dark" style={{ fontSize: 10 }}>{a.industry}</span></td>
                    <td style={{ fontSize: 11, color: '#555' }}>{a.segment}</td>
                    <td style={{ fontWeight: 600 }}>{fmt$(a.arr)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 48 }}>
                          <div className="progress-bar__fill" style={{
                            width: `${a.healthScore}%`,
                            background: a.healthScore >= 75 ? '#04844b' : a.healthScore >= 50 ? '#0070d2' : a.healthScore >= 30 ? '#ffb75d' : '#c23934'
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{a.healthScore}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`score-${a.riskScore >= 70 ? 'critical' : a.riskScore >= 50 ? 'high' : a.riskScore >= 30 ? 'medium' : 'good'}`}>
                        {a.riskScore}
                      </span>
                    </td>
                    <td><RiskBadge risk={a.churnRisk} /></td>
                    <td><TierBadge tier={a.tier} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 40 }}>
                          <div className="progress-bar__fill brand" style={{ width: `${a.engagementScore}%` }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{a.engagementScore}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 11 }}>{a.csm}</td>
                    <td style={{ fontSize: 11, color: (() => { const d = new Date(a.renewalDate); const n = new Date('2026-06-02'); const diff = (d.getTime()-n.getTime())/(1000*86400); return diff < 30 ? '#c23934' : diff < 60 ? '#b35e00' : '#444'; })() }}>
                      {a.renewalDate}
                    </td>
                    <td><span className="badge badge-brand" style={{ fontSize: 10 }}>{a.cycleStage}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
