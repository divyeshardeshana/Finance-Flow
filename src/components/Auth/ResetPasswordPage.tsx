import { useState, useEffect, useMemo, useRef } from 'react';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface ResetPasswordPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

type PageState = 'verifying' | 'ready' | 'expired' | 'success';

function parseHashError(): { isError: boolean; description: string } {
  const hash = window.location.hash;
  if (!hash) return { isError: false, description: '' };
  const params = new URLSearchParams(hash.replace('#', ''));
  const error = params.get('error');
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');
  if (error === 'access_denied' || errorCode === 'otp_expired') {
    return {
      isError: true,
      description: errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : 'This password reset link has expired or is invalid.',
    };
  }
  return { isError: false, description: '' };
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
  return { score: 5, label: 'Very Strong', color: 'bg-green-600' };
}

const VERIFY_TIMEOUT_MS = 20000;

export function ResetPasswordPage({ onNavigate, onSignIn, onSuccess, onForgotPassword }: ResetPasswordPageProps) {
  const { user, isPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const exchangedRef = useRef(false);

  const [hashError] = useState(parseHashError);

  const [pageState, setPageState] = useState<PageState>(() => {
    if (hashError.isError) return 'expired';
    if (isPasswordRecovery) return 'ready';
    return 'verifying';
  });

  // Handle PKCE ?code= exchange — Supabase v2 sends code in URL for recovery
  useEffect(() => {
    if (exchangedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    exchangedRef.current = true;
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchError }) => {
      if (exchError) {
        setPageState('expired');
      }
      // PASSWORD_RECOVERY event from onAuthStateChange will set isPasswordRecovery → pageState ready
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    });
  }, []);

  // Handle implicit flow — hash contains access_token + type=recovery
  useEffect(() => {
    if (hashError.isError && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [hashError.isError]);

  useEffect(() => {
    if (pageState !== 'verifying') return;
    if (isPasswordRecovery || user) {
      setPageState('ready');
      return;
    }
    const timer = setTimeout(() => {
      if (!isPasswordRecovery && !user) {
        setPageState('expired');
      }
    }, VERIFY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isPasswordRecovery, user, pageState]);

  useEffect(() => {
    if (pageState === 'ready' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [pageState]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = password.length >= 8 && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPageState('success');
      setTimeout(() => {
        onSuccess();
      }, 3000);
    }
  };

  const renderExpired = () => (
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Expired</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
        {hashError.isError ? hashError.description : 'This password reset link has expired or could not be verified.'}
      </p>
      <p className="text-gray-400 dark:text-gray-600 text-xs mb-8">
        Password reset links expire after 1 hour for your security.
      </p>
      <button
        onClick={onForgotPassword}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Request a New Reset Link
      </button>
      <button
        onClick={onSignIn}
        className="mt-3 w-full py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
      >
        Back to Sign In
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/50">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Updated</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Your password has been successfully changed. You'll be redirected to sign in with your new password.
      </p>
      <button
        onClick={onSuccess}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Sign In Now
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderVerifying = () => (
    <div className="text-center p-8">
      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying your link</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Please wait while we verify your password reset link...
      </p>
    </div>
  );

  const renderForm = () => (
    <div className="p-8">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set new password</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Create a strong password for your account. It must be at least 8 characters long.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            {error.toLowerCase().includes('session') && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium text-left"
              >
                Request a new reset link
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all duration-200"
              placeholder="At least 8 characters"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Password strength</span>
                <span className={`text-xs font-medium ${
                  strength.score <= 1 ? 'text-red-600' :
                  strength.score <= 2 ? 'text-orange-600' :
                  strength.score <= 3 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strength.score ? strength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                <div className={`text-xs flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  8+ characters
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Uppercase letter
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Number
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Special character
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all duration-200 ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? 'border-green-300 dark:border-green-500/40 bg-green-50/30 dark:bg-green-500/5'
                    : 'border-red-300 dark:border-red-500/40 bg-red-50/30 dark:bg-red-500/5'
                  : 'border-gray-200 dark:border-white/[0.10]'
              }`}
              placeholder="Re-enter your new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-red-600">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating Password...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex flex-col overflow-x-hidden">
      <PublicNavbar
        currentView="home"
        onNavigate={onNavigate}
        onSignIn={onSignIn}
        onGetStarted={onSignIn}
      />
      <div className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-t from-cyan-100/30 to-transparent dark:from-cyan-600/5 dark:to-transparent blur-3xl" />
        </div>
        <div className="relative w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center">
          <div className="w-full max-w-[420px]">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl shadow-xl shadow-gray-200/60 dark:shadow-black/30 overflow-hidden">
              {pageState === 'verifying' && renderVerifying()}
              {pageState === 'expired' && renderExpired()}
              {pageState === 'success' && renderSuccess()}
              {pageState === 'ready' && renderForm()}
            </div>
          </div>
        </div>
      </div>
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
