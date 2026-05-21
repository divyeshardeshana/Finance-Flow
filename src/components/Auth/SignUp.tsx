import { useState } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  Star,
  BarChart2,
  Target,
  Check,
  X as XIcon,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface SignUpProps {
  onToggle: () => void;
  onBackToHome?: () => void;
  onNavigate?: (view: PublicView) => void;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const features = [
  {
    icon: Star,
    label: 'Free to start',
    gradient: 'from-amber-500 to-yellow-400',
    shadow: 'shadow-amber-500/20',
  },
  {
    icon: BarChart2,
    label: 'Smart reports',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: Target,
    label: 'Goal tracking',
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/20',
  },
];

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains an uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains a special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; textColor: string } {
  if (!password) return { score: 0, label: '', color: '', textColor: '' };
  const reqs = getPasswordRequirements(password);
  const metCount = reqs.filter((r) => r.met).length;
  if (metCount <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' };
  if (metCount === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' };
  if (metCount === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' };
}

export function SignUp({ onToggle, onBackToHome, onNavigate }: SignUpProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRequirements = getPasswordRequirements(password);
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      setError(error.message);
    }
  };

  const handleNavigate = (view: PublicView) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (view === 'home' && onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex flex-col overflow-x-hidden">
      <SEOHead pageKey="signup" />
      <PublicNavbar
        currentView="home"
        onNavigate={handleNavigate}
        onSignIn={onToggle}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
        <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
        <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-t from-cyan-100/30 to-transparent dark:from-cyan-600/5 dark:to-transparent blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-4">

        <div className="w-full max-w-md text-center mb-10">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-7"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
            FinanceFlow AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-4"
          >
            Your journey to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              financial freedom
            </span>{' '}
            starts here
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8"
          >
            Join thousands of users managing their money smarter, saving more, and reaching financial goals faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center flex-wrap gap-4"
          >
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${f.gradient} shadow-md ${f.shadow} flex-shrink-0`}>
                  <f.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-8 shadow-xl shadow-gray-200/60 dark:shadow-black/30">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Create Account
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Start managing your finances smarter.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/[0.08] border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 space-y-2.5 overflow-hidden"
                  >
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-white/[0.08]'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className={`text-xs font-semibold ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </p>
                    )}
                    <div className="space-y-1.5 pt-0.5">
                      {passwordRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {req.met ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XIcon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={onToggle}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1.5"
          >
            <Shield size={11} />
            Bank-level encryption · Your data is always protected
          </motion.p>
        </motion.div>
      </div>

      <PublicFooter onNavigate={handleNavigate} />
    </div>
  );
}
