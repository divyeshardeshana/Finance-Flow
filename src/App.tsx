import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
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
import FAQPage from './components/Public/FAQPage';
import UseCasesPage from './components/Public/UseCasesPage';
import HowItWorksPage from './components/Public/HowItWorksPage';
import TestimonialsPage from './components/Public/TestimonialsPage';
import SecurityPage from './components/Public/SecurityPage';
import ComparisonPage from './components/Public/ComparisonPage';
import ROICalculatorPage from './components/Public/ROICalculatorPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import { PaymentSuccess } from './components/payment/PaymentSuccess';
import { PaymentCancel } from './components/payment/PaymentCancel';
import { type PublicView } from './components/Common/PublicNavbar';
import { CookieConsentBanner } from './components/Common/CookieConsentBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (loading) return <LoadingSpinner />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

// ── Route wrappers ────────────────────────────────────────────────────────────

function BlogPostRoute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const navHandlers = useNavHandlers();
  return (
    <BlogPostPage
      slug={slug!}
      onBack={() => navigate('/blog')}
      onPostClick={(s) => navigate(`/blog/${s}`)}
      {...navHandlers}
    />
  );
}

function SignInRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const showPasswordResetSuccess = !!(location.state as { passwordResetSuccess?: boolean } | null)?.passwordResetSuccess;
  const navHandlers = useNavHandlers();
  return (
    <SignIn
      onToggle={() => navigate('/signup')}
      onBackToHome={() => navigate('/')}
      onForgotPassword={() => navigate('/forgot-password')}
      showPasswordResetSuccess={showPasswordResetSuccess}
      {...navHandlers}
    />
  );
}

function SignUpRoute() {
  const navigate = useNavigate();
  const navHandlers = useNavHandlers();
  return (
    <SignUp
      onToggle={() => navigate('/signin')}
      onBackToHome={() => navigate('/')}
      {...navHandlers}
    />
  );
}

function ForgotPasswordRoute() {
  const navigate = useNavigate();
  const navHandlers = useNavHandlers();
  return (
    <ForgotPasswordPage
      onBackToSignIn={() => navigate('/signin')}
      {...navHandlers}
    />
  );
}

function ResetPasswordRoute() {
  const { clearPasswordRecovery, signOut } = useAuth();
  const navigate = useNavigate();
  const navHandlers = useNavHandlers();
  return (
    <ResetPasswordPage
      onSuccess={() => {
        clearPasswordRecovery();
        signOut().then(() => navigate('/signin', { state: { passwordResetSuccess: true } }));
      }}
      onForgotPassword={() => {
        clearPasswordRecovery();
        navigate('/forgot-password');
      }}
      {...navHandlers}
    />
  );
}

// ── Shared hook ───────────────────────────────────────────────────────────────

function viewToPath(view: PublicView): string {
  return view === 'home' ? '/' : `/${view}`;
}

function useNavHandlers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return {
    onNavigate: (view: PublicView) => navigate(viewToPath(view)),
    onSignIn: () => navigate(user ? '/dashboard' : '/signin'),
    onGetStarted: () => navigate(user ? '/dashboard' : '/signup'),
  };
}

// ── Main app content ──────────────────────────────────────────────────────────

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const navHandlers = useNavHandlers();

  useEffect(() => {
    if (isPasswordRecovery && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
    }
  }, [isPasswordRecovery]);

  if (authLoading) return <LoadingSpinner />;

  return (
    <>
      <ScrollToTop />
      <CookieConsentBanner gaMeasurementId={import.meta.env.VITE_GA_MEASUREMENT_ID} />
      <Routes>
        {/* ── Public pages ── */}
        <Route
          path="/"
          element={
            <LandingPage
              onGetStarted={() => navigate(user ? '/dashboard' : '/signup')}
              onSignIn={() => navigate(user ? '/dashboard' : '/signin')}
              onBlogClick={() => navigate('/blog')}
              onNavigate={navHandlers.onNavigate}
            />
          }
        />
        <Route path="/about" element={<AboutUsPage {...navHandlers} />} />
        <Route path="/features" element={<FeaturesPage {...navHandlers} />} />
        <Route path="/use-cases" element={<UseCasesPage {...navHandlers} />} />
        <Route path="/pricing" element={<PublicPricingPage {...navHandlers} />} />
        <Route path="/faq" element={<FAQPage {...navHandlers} />} />
        <Route path="/contact" element={<ContactUsPage {...navHandlers} />} />
        <Route path="/privacy" element={<PrivacyPolicyPage {...navHandlers} />} />
        <Route path="/how-it-works" element={<HowItWorksPage {...navHandlers} />} />
        <Route path="/testimonials" element={<TestimonialsPage {...navHandlers} />} />
        <Route path="/security" element={<SecurityPage {...navHandlers} />} />
        <Route path="/comparison" element={<ComparisonPage {...navHandlers} />} />
        <Route path="/roi-calculator" element={<ROICalculatorPage {...navHandlers} />} />
        <Route
          path="/blog"
          element={
            <BlogPage
              onBack={() => navigate('/')}
              onPostClick={(slug) => navigate(`/blog/${slug}`)}
              {...navHandlers}
            />
          }
        />
        <Route path="/blog/:slug" element={<BlogPostRoute />} />

        {/* ── Auth pages (redirect to dashboard if already signed in) ── */}
        <Route path="/signin" element={user ? <Navigate to="/dashboard" replace /> : <SignInRoute />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUpRoute />} />
        <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
        <Route path="/reset-password" element={<ResetPasswordRoute />} />

        {/* ── Payment routes (auth required) ── */}
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<PaymentSuccess />} />
        <Route path="/checkout/cancel" element={<PaymentCancel />} />

        {/* ── Admin routes ── */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><UserManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/users/create" element={<ProtectedAdminRoute><CreateUserPage /></ProtectedAdminRoute>} />
        <Route path="/admin/users/:userId" element={<ProtectedAdminRoute><UserDetailsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedAdminRoute><SubscriptionManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/payments" element={<ProtectedAdminRoute><PaymentManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/tickets" element={<ProtectedAdminRoute><TicketManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/quizzes" element={<ProtectedAdminRoute><ContentManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/faqs" element={<ProtectedAdminRoute><ContentManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/reports" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
        <Route path="/admin/features" element={<ProtectedAdminRoute><FeatureManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/retirement-management" element={<ProtectedAdminRoute><RetirementManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/investment-management" element={<ProtectedAdminRoute><InvestmentManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/settings" element={<ProtectedAdminRoute><SystemSettings /></ProtectedAdminRoute>} />
        <Route path="/admin/pricing" element={<ProtectedAdminRoute><PricingPage /></ProtectedAdminRoute>} />
        <Route path="/admin/seo" element={<ProtectedAdminRoute><SEOManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/blog" element={<ProtectedAdminRoute><BlogManagement /></ProtectedAdminRoute>} />
        <Route path="/admin/email" element={<ProtectedAdminRoute><EmailManagement /></ProtectedAdminRoute>} />

        {/* ── Dashboard (explicit + catch-all) ── */}
        <Route
          path="/dashboard"
          element={
            user
              ? <Dashboard onNavigatePublic={navHandlers.onNavigate} />
              : <Navigate to="/signin" replace />
          }
        />
        <Route
          path="/*"
          element={
            user
              ? <Dashboard onNavigatePublic={navHandlers.onNavigate} />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </>
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
