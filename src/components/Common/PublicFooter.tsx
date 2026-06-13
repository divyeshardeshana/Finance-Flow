import { Zap } from 'lucide-react';
import { type PublicView } from './PublicNavbar';

interface PublicFooterProps {
  onNavigate: (view: PublicView) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  return (
    <footer style={{ backgroundColor: '#0A0D14' }} className="text-gray-400 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          <div className="md:col-span-1">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 mb-5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Flow</span>
              </span>
            </button>
            <p className="text-sm text-gray-400 leading-relaxed">
              Smart financial management for everyone.
              Take control of your money and achieve your goals.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => onNavigate('features')} className="text-gray-400 hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="text-gray-400 hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('use-cases')} className="text-gray-400 hover:text-white transition-colors">
                  Use Cases
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => onNavigate('testimonials')} className="text-gray-400 hover:text-white transition-colors">
                  Testimonials
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('security')} className="text-gray-400 hover:text-white transition-colors">
                  Security & Trust
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('comparison')} className="text-gray-400 hover:text-white transition-colors">
                  Comparison
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('roi-calculator')} className="text-gray-400 hover:text-white transition-colors">
                  ROI Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2026 FinanceFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
