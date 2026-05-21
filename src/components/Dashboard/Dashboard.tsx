import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { supabase } from '../../lib/supabase';
import { type PublicView } from '../Common/PublicNavbar';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { UpgradePrompt } from '../Subscription/UpgradePrompt';
import { LockedFeaturePage } from '../Subscription/LockedFeaturePage';
import { AccessDeniedModal } from '../Common/AccessDeniedModal';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { DashboardHome } from './DashboardHome';
import { TransactionsPage } from '../Transactions/TransactionsPage';
import { InvestmentPage } from '../Investment/InvestmentPage';
import { BudgetPage } from '../Budget/BudgetPage';
import { ReportsPage } from '../Reports/ReportsPage';
import { FinancialAssistantPage } from '../Assistant/FinancialAssistantPage';
import { LiteracyGamificationPage } from '../Literacy/LiteracyGamificationPage';
import { ProfilePage } from '../Profile/ProfilePage';
import { ExpensePredictionPage } from '../Predictions/ExpensePredictionPage';
import { RecommendationsPage } from '../Recommendations/RecommendationsPage';
import { BillRemindersPage } from '../Bills/BillRemindersPage';
import { SupportPage } from '../Support/SupportPage';
import { KnowledgeBasePage } from '../Support/KnowledgeBasePage';
import { NetWorthPage } from '../NetWorth/NetWorthPage';
import { RetirementPage } from '../Retirement/RetirementPage';
import { EstatePage } from '../Estate/EstatePage';
import { SavingsPage } from '../Savings/SavingsPage';
import { PriceComparisonPage } from '../PriceComparison/PriceComparisonPage';
import { StockPredictionPage } from '../Predictions/StockPredictionPage';
import { SubscriptionManagementPage } from '../Profile/SubscriptionManagementPage';
import SubscriptionDetailsPage from '../Profile/SubscriptionDetailsPage';
import SubscriptionSuccessPage from '../Subscription/SubscriptionSuccessPage';
import type { Page } from './types';

interface DashboardProps {
  onNavigatePublic?: (view: PublicView) => void;
}

const PAGE_NAMES: Partial<Record<Page, string>> = {
  home: 'Dashboard',
  transactions: 'Transactions',
  budget: 'Budget',
  investment: 'Investment',
  reports: 'Reports',
  assistant: 'Financial Assistant',
  literacy: 'Learning Challenge',
  predictions: 'Expense Prediction',
  stockprediction: 'Stock Prediction',
  recommendations: 'AI Recommendations',
  bills: 'Bill Reminders',
  support: 'Support',
  'knowledge-base': 'Knowledge Base',
  networth: 'Net Worth',
  retirement: 'Retirement',
  estate: 'Estate Planning',
  savings: 'Savings Goals',
  pricecomparison: 'Price Comparison',
  profile: 'Profile',
  subscription: 'Subscription',
  'subscription-details': 'My Plan',
  'subscription-success': 'Subscription Activated',
};

const PAGE_FEATURE_MAP: Partial<Record<Page, string>> = {
  assistant: 'financial_assistant',
  bills: 'bill_reminders',
  support: 'support_tickets',
  reports: 'advanced_reports',
  networth: 'net_worth_tracker',
  investment: 'advanced_investments',
  retirement: 'retirement_planning',
  estate: 'estate_planning',
  predictions: 'expense_prediction',
  stockprediction: 'stock_prediction',
  recommendations: 'ai_recommendations',
  pricecomparison: 'price_comparison',
};

export function Dashboard({ onNavigatePublic }: DashboardProps = {}) {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { t } = useAppPreferences();
  const { accessDeniedState, closeAccessDenied, hasFeatureAccess, showUpgradePrompt, refreshSubscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (searchParams.get('subscription_success') === '1') return 'subscription-success';
    return 'home';
  });
  const [subscriptionDefaultSection, setSubscriptionDefaultSection] = useState<'overview' | 'plans'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openProfileTab, setOpenProfileTab] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('subscription_success') === '1') {
      setCurrentPage('subscription-success');
      setSearchParams({}, { replace: true });
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription-from-stripe`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({}),
          }
        ).then(() => refreshSubscription()).catch(() => refreshSubscription());
      });
    }
  }, []);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleNavigateToSubscription = () => {
    setSubscriptionDefaultSection('overview');
    setCurrentPage('subscription');
  };

  const handleAccessDeniedRedirect = () => setCurrentPage('home');

  const pageName = PAGE_NAMES[currentPage] || '';

  const renderPage = () => {
    const featureKey = PAGE_FEATURE_MAP[currentPage];
    if (featureKey && !hasFeatureAccess(featureKey)) {
      return (
        <LockedFeaturePage
          featureKey={featureKey}
          onUpgrade={() => showUpgradePrompt(featureKey)}
          onNavigateToSubscription={() => {
            setSubscriptionDefaultSection('plans');
            setCurrentPage('subscription');
          }}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <DashboardHome onNavigate={handleNavigate} />;
      case 'assistant':
        return <FinancialAssistantPage />;
      case 'literacy':
        return <LiteracyGamificationPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'bills':
        return <BillRemindersPage />;
      case 'budget':
        return <BudgetPage />;
      case 'savings':
        return <SavingsPage />;
      case 'investment':
        return <InvestmentPage />;
      case 'networth':
        return <NetWorthPage />;
      case 'retirement':
        return <RetirementPage />;
      case 'estate':
        return <EstatePage />;
      case 'predictions':
        return <ExpensePredictionPage />;
      case 'stockprediction':
        return <StockPredictionPage />;
      case 'pricecomparison':
        return <PriceComparisonPage />;
      case 'recommendations':
        return <RecommendationsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'support':
        return <SupportPage onNavigatePublic={onNavigatePublic} onNavigate={handleNavigate} />;
      case 'knowledge-base':
        return <KnowledgeBasePage onNavigate={handleNavigate} />;
      case 'profile':
        return (
          <ProfilePage
            initialTab={openProfileTab || undefined}
            onTabChange={() => setOpenProfileTab(null)}
          />
        );
      case 'subscription':
        return <SubscriptionManagementPage defaultSection={subscriptionDefaultSection} />;
      case 'subscription-details':
        return <SubscriptionDetailsPage />;
      case 'subscription-success':
        return (
          <SubscriptionSuccessPage
            onNavigateToDashboard={() => setCurrentPage('home')}
            onNavigateToSubscription={() => {
              setSubscriptionDefaultSection('overview');
              setCurrentPage('subscription');
            }}
          />
        );
      default:
        return <DashboardHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080C14]">
      <UpgradePrompt onNavigateToSubscription={handleNavigateToSubscription} />

      {accessDeniedState && (
        <AccessDeniedModal
          featureName={accessDeniedState.featureName}
          requiredTier={accessDeniedState.requiredTier}
          onClose={closeAccessDenied}
          onRedirect={handleAccessDeniedRedirect}
        />
      )}

      <div className="min-h-screen flex">
        <AppSidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          t={t}
        />

        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
          } min-h-screen flex flex-col`}
        >
          <AppTopBar
            pageName={pageName}
            profile={profile}
            onMenuOpen={() => setSidebarOpen(true)}
            onNavigate={handleNavigate}
            onSubscriptionNavigate={handleNavigateToSubscription}
            onSignOut={signOut}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#080C14]">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}
