import { useState } from 'react';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { RelationshipPage } from './pages/RelationshipPage';
import { ChurnRiskPage } from './pages/ChurnRiskPage';
import { SalesCyclePage } from './pages/SalesCyclePage';
import { ExpansionPage } from './pages/ExpansionPage';
import { OperationalPage } from './pages/OperationalPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import './styles/slds.css';

type Page = 'home' | 'accounts' | 'relationship' | 'risk' | 'sales-cycle' | 'expansion' | 'operational';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <Header
        currentPage={currentPage}
        onNavigate={(p) => { setCurrentPage(p as Page); setSelectedAccountId(null); }}
      />
      <main className="main-content">
        {selectedAccountId ? (
          <AccountDetailPage accountId={selectedAccountId} onBack={() => setSelectedAccountId(null)} />
        ) : (
          <>
            {currentPage === 'home' && <HomePage onNavigate={(p) => setCurrentPage(p as Page)} />}
            {currentPage === 'accounts' && <AccountsPage onSelectAccount={setSelectedAccountId} />}
            {currentPage === 'relationship' && <RelationshipPage />}
            {currentPage === 'risk' && <ChurnRiskPage />}
            {currentPage === 'sales-cycle' && <SalesCyclePage />}
            {currentPage === 'expansion' && <ExpansionPage />}
            {currentPage === 'operational' && <OperationalPage />}
          </>
        )}
      </main>
    </div>
  );
}
