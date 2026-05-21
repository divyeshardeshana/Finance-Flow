import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppPreferencesProvider } from './contexts/AppPreferencesContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { LandingPage } from './components/Landing/LandingPage';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { ForgotPasswordPage } from './components/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserManagement from './components/Admin/UserManagement';
import CreateUserPage from './components/Admin/CreateUserPage';
import UserDetailsPage from './components/Admin/UserDetailsPage';
import SubscriptionManagement from './components/Admin/SubscriptionManagement';
import PaymentManagement from './components/Admin/PaymentManagement';
import TicketManagement from './components/Admin/TicketManagement';
import ContentManagement from './components/Admin/ContentManagement';
import SystemSettings from './components/Admin/SystemSettings';
import AdminReports from './components/Admin/AdminReports';
import FeatureManagement from './components/Admin/FeatureManagement';
import PricingPage from './components/Admin/PricingPage';
import RetirementManagement from './components/Admin/RetirementManagement';
import InvestmentManagement from './components/Admin/InvestmentManagement';
import SEOManagement from './components/Admin/SEOManagement';
import BlogManagement from './components/Admin/BlogManagement';
import EmailManagement from './components/Admin/EmailManagement';
import BlogPage from './components/Blog/BlogPage';
import BlogPostPage from './components/Blog/BlogPostPage';
import AboutUsPage from './components/Public/AboutUsPage';
import FeaturesPage from './components/Public/FeaturesPage';
import PublicPricingPage from './components/Public/PublicPricingPage';
import ContactUsPage from './components/Public/ContactUsPage';
import PrivacyPolicyPage from './components/Public/PrivacyPolicyPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import { PaymentSuccess } from './components/payment/PaymentSuccess';
import { PaymentCancel } from './components/payment/PaymentCancel';
import { type PublicView } from './components/Common/PublicNavbar';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

type AppView = 'landing' | 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'blog' | 'blogpost' | PublicView;

function getInitialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'reset-password') return 'reset-password';
  const hash = window.location.hash;
  if (hash.includes('type=recovery')) return 'reset-password';
  return 'landing';
}

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery, clearPasswordRecovery, signOut } = useAuth();
  const [appView, setAppView] = useState<AppView>(getInitialView);
  const [blogPostSlug, setBlogPostSlug] = useState('');
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(false);

  useEffect(() => {
    if (isPasswordRecovery && appView !== 'reset-password') {
      setAppView('reset-password');
    }
  }, [isPasswordRecovery]);

  const handleNavigate = (view: PublicView) => {
    setAppView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSignIn = () => setAppView('signin');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (appView === 'reset-password') {
    return (
      <ResetPasswordPage
        onNavigate={handleNavigate}
        onSignIn={handleSignIn}
        onSuccess={() => {
          clearPasswordRecovery();
          setShowPasswordResetSuccess(true);
          signOut().then(() => setAppView('signin'));
        }}
        onForgotPassword={() => {
          clearPasswordRecovery();
          setAppView('forgot-password');
        }}
      />
    );
  }

  if (appView === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigate={handleNavigate}
        onSignIn={handleSignIn}
        onBackToSignIn={() => setAppView('signin')}
      />
    );
  }

  if (appView === 'blog') {
    return (
      <BlogPage
        onBack={() => setAppView('landing')}
        onPostClick={(slug) => { setBlogPostSlug(slug); setAppView('blogpost'); }}
        onNavigate={handleNavigate}
        onSignIn={handleSignIn}
      />
    );
  }

  if (appView === 'blogpost' && blogPostSlug) {
    return (
      <BlogPostPage
        slug={blogPostSlug}
        onBack={() => setAppView('blog')}
        onPostClick={(slug) => { setBlogPostSlug(slug); setAppView('blogpost'); }}
        onNavigate={handleNavigate}
        onSignIn={handleSignIn}
      />
    );
  }

  if (appView === 'about') {
    return <AboutUsPage onNavigate={handleNavigate} onSignIn={handleSignIn} />;
  }

  if (appView === 'features') {
    return <FeaturesPage onNavigate={handleNavigate} onSignIn={handleSignIn} />;
  }

  if (appView === 'pricing') {
    return <PublicPricingPage onNavigate={handleNavigate} onSignIn={handleSignIn} />;
  }

  if (appView === 'contact') {
    return <ContactUsPage onNavigate={handleNavigate} onSignIn={handleSignIn} />;
  }

  if (appView === 'privacy') {
    return <PrivacyPolicyPage onNavigate={handleNavigate} onSignIn={handleSignIn} />;
  }

  // Payment routes are always accessible regardless of auth state.
  // They are handled via React Router <Routes>, so we check the current URL path.
  const isPaymentRoute = ['/products', '/orders', '/checkout/success', '/checkout/cancel'].some(
    p => window.location.pathname === p || window.location.pathname.startsWith(p + '?')
  );

  if (!user && !isPaymentRoute) {
    if (appView === 'landing' || appView === 'home') {
      return (
        <LandingPage
          onGetStarted={handleSignIn}
          onBlogClick={() => setAppView('blog')}
          onNavigate={handleNavigate}
        />
      );
    }

    if (appView === 'signup') {
      return (
        <SignUp
          onToggle={() => setAppView('signin')}
          onBackToHome={() => setAppView('landing')}
          onNavigate={handleNavigate}
        />
      );
    }

    return (
      <SignIn
        onToggle={() => setAppView('signup')}
        onBackToHome={() => setAppView('landing')}
        onNavigate={handleNavigate}
        onForgotPassword={() => setAppView('forgot-password')}
        showPasswordResetSuccess={showPasswordResetSuccess}
      />
    );
  }

  return (
    <Routes>
      {/* Payment routes — accessible to all */}
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/checkout/success" element={<PaymentSuccess />} />
      <Route path="/checkout/cancel" element={<PaymentCancel />} />

      {/* Authenticated app */}
      <Route path="/*" element={<Dashboard onNavigatePublic={handleNavigate} />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute>
            <UserManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedAdminRoute>
            <CreateUserPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedAdminRoute>
            <UserDetailsPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedAdminRoute>
            <SubscriptionManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedAdminRoute>
            <PaymentManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <ProtectedAdminRoute>
            <TicketManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <ProtectedAdminRoute>
            <ContentManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/faqs"
        element={
          <ProtectedAdminRoute>
            <ContentManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedAdminRoute>
            <AdminReports />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/features"
        element={
          <ProtectedAdminRoute>
            <FeatureManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/retirement-management"
        element={
          <ProtectedAdminRoute>
            <RetirementManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/investment-management"
        element={
          <ProtectedAdminRoute>
            <InvestmentManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedAdminRoute>
            <SystemSettings />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <ProtectedAdminRoute>
            <PricingPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/seo"
        element={
          <ProtectedAdminRoute>
            <SEOManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/blog"
        element={
          <ProtectedAdminRoute>
            <BlogManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/email"
        element={
          <ProtectedAdminRoute>
            <EmailManagement />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <AppPreferencesProvider>
            <SubscriptionProvider>
              <AppContent />
            </SubscriptionProvider>
          </AppPreferencesProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
