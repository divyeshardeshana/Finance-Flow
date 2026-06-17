import { Zap, TrendingUp, Shield, Globe } from 'lucide-react';
import { type PublicView } from './PublicNavbar';

interface PublicFooterProps {
  onNavigate: (view: PublicView) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  return (
    <footer style={{ backgroundColor: '#070A12' }} className="relative overflow-hidden text-gray-400">

      {/* Background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Top gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Newsletter / CTA banner */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Start managing your money smarter</p>
              <p className="text-gray-500 text-xs mt-0.5">Join thousands of users worldwide. Free plan available.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pricing')}
            className="flex-shrink-0 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            Get Started Free →
          </button>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Brand col */}
          <div className="md:col-span-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 mb-5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all flex-shrink-0">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Flow</span>
              </span>
            </button>

            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
              AI-powered financial management for individuals, families, and businesses - built for the modern world.
            </p>

            {/* Trust badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-gray-400">
                <Shield className="w-3 h-3 text-emerald-400" />
                Bank-grade security
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-gray-400">
                <Globe className="w-3 h-3 text-blue-400" />
                50+ countries
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-xs tracking-widest uppercase">Product</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Features', view: 'features' },
                { label: 'How It Works', view: 'how-it-works' },
                { label: 'Use Cases', view: 'use-cases' },
                { label: 'Pricing', view: 'pricing' },
                { label: 'FAQ', view: 'faq' },
              ].map(({ label, view }) => (
                <li key={label}>
                  <button
                    onClick={() => onNavigate(view as PublicView)}
                    className="text-gray-500 hover:text-white transition-colors hover:translate-x-0.5 inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all text-blue-400 text-xs">›</span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-xs tracking-widest uppercase">Company</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'About Us', view: 'about' },
                { label: 'Blog', view: 'blog' },
                { label: 'Contact Us', view: 'contact' },
              ].map(({ label, view }) => (
                <li key={label}>
                  <button
                    onClick={() => onNavigate(view as PublicView)}
                    className="text-gray-500 hover:text-white transition-colors hover:translate-x-0.5 inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all text-blue-400 text-xs">›</span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-xs tracking-widest uppercase">Support</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Testimonials', view: 'testimonials' },
                { label: 'Security & Trust', view: 'security' },
                { label: 'Comparison', view: 'comparison' },
                { label: 'ROI Calculator', view: 'roi-calculator' },
                { label: 'Privacy Policy', view: 'privacy' },
              ].map(({ label, view }) => (
                <li key={label}>
                  <button
                    onClick={() => onNavigate(view as PublicView)}
                    className="text-gray-500 hover:text-white transition-colors hover:translate-x-0.5 inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all text-blue-400 text-xs">›</span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 FinanceFlow. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
