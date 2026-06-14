import {
  Shield,
  Database,
  Eye,
  Share2,
  Lock,
  Cookie,
  Clock,
  UserCheck,
  Baby,
  Globe,
  Link,
  RefreshCw,
  Mail,
  Trash2,
  Download,
} from 'lucide-react';
import { PublicFooter } from '../Common/PublicFooter';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import SEOHead from '../SEO/SEOHead';

interface PrivacyPolicyPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

type Section = {
  icon: React.ElementType;
  color: string;
  title: string;
  content?: string[];
  bullets?: { label: string; text: string }[];
  footer?: string;
  contact?: boolean;
};

const sections: Section[] = [
  {
    icon: Shield,
    color: 'blue',
    title: '1. Introduction',
    content: [
      'FinanceFlow AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered financial management platform, including all features such as transaction tracking, budgeting, savings goals, investment tracking, bill reminders, ROI calculator, AI financial assistant, and related services (collectively, the "Service").',
      'By accessing or using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not use the Service.',
      'This policy applies to all users of FinanceFlow AI across our Free, Paid, and Premium subscription tiers.',
    ],
  },
  {
    icon: Database,
    color: 'indigo',
    title: '2. Information We Collect',
    bullets: [
      { label: 'Account Information', text: 'When you create an account, we collect your full name, email address, and a securely hashed password.' },
      { label: 'Profile Information', text: 'You may optionally provide your country, preferred currency, language, timezone, and profile photo.' },
      { label: 'Financial Data', text: 'To provide our core service, we collect income, expenses, transactions, budgets, savings goals, investments, net worth entries, bill reminders, and ROI calculations you enter. This data is stored securely and associated only with your account.' },
      { label: 'AI Conversation Data', text: 'When you use the AI Financial Assistant, your queries and generated responses are processed to provide answers. We do not use your financial queries to train AI models without explicit consent.' },
      { label: 'Usage Data', text: 'We automatically collect information about how you interact with the Service — pages visited, features used, time spent, and clickstream data — to improve the platform.' },
      { label: 'Technical Data', text: 'Your IP address, browser type and version, operating system, device identifiers, and log data are collected when you access the Service.' },
      { label: 'Payment Information', text: 'If you subscribe to a Paid or Premium plan, transactions are processed by Stripe. We do not store full card numbers. We may store the last four digits and billing metadata.' },
      { label: 'Cookie & Analytics Data', text: 'We collect analytics data via cookies when you provide consent through our Cookie Consent Banner. See Section 6 for full details.' },
      { label: 'Communications', text: 'When you contact us for support, we retain those communications to resolve your issue and improve service quality.' },
    ],
  },
  {
    icon: Eye,
    color: 'violet',
    title: '3. How We Use Your Information',
    bullets: [
      { label: 'Service Delivery', text: 'To provide, operate, and maintain FinanceFlow AI, including all features available under your subscription tier — from basic transaction tracking (Free) through advanced analytics and unlimited AI queries (Premium).' },
      { label: 'AI Financial Assistant', text: 'To process your questions and generate personalised financial insights. Your financial data is used solely to answer your queries and is never shared with third-party AI providers beyond what is needed to generate a response.' },
      { label: 'Account Management', text: 'To create and manage your user account, authenticate your identity, and protect against unauthorised access.' },
      { label: 'Personalisation', text: 'To personalise your experience based on your subscription tier, preferences, currency, and usage history.' },
      { label: 'Analytics & Improvement', text: 'To understand how users interact with the Service, identify bugs, and continuously improve features. Analytics are collected only with your consent.' },
      { label: 'Communications', text: 'To send important account-related notices, security alerts, product updates, and — where you have opted in — marketing communications. You may opt out at any time.' },
      { label: 'Payment Processing', text: 'To process subscription payments through Stripe and manage your billing history.' },
      { label: 'Legal & Compliance', text: 'To comply with applicable laws, enforce our Terms of Service, and protect the rights, property, and safety of FinanceFlow AI, our users, and others.' },
      { label: 'Security', text: 'To detect, prevent, and respond to fraud, abuse, and security incidents.' },
    ],
  },
  {
    icon: Share2,
    color: 'pink',
    title: '4. How We Share Your Information',
    content: ['We do not sell, rent, or trade your personal information to third parties. We share your information only in the following limited circumstances:'],
    bullets: [
      { label: 'Service Providers', text: 'We engage trusted third-party vendors including Supabase (cloud hosting and database), Stripe (payment processing), Google Analytics (usage analytics — only with your consent), and email delivery providers. These providers are contractually required to protect your data.' },
      { label: 'AI Processing', text: 'Queries to the AI Financial Assistant are processed via our AI provider infrastructure. Only the minimum data needed to answer your query is transmitted, and it is not retained beyond the processing of your request.' },
      { label: 'Legal Requirements', text: 'We may disclose your information if required by law or in response to valid legal requests (e.g., court order, subpoena, or government agency request).' },
      { label: 'Business Transfers', text: 'If FinanceFlow AI is acquired or undergoes significant restructuring, your information may be transferred to the acquiring entity. We will notify you before your data becomes subject to a different privacy policy.' },
      { label: 'With Your Consent', text: 'We may share your information for other purposes with your explicit consent.' },
      { label: 'Aggregated, Non-Identifiable Data', text: 'We may share aggregated, anonymised data that cannot reasonably identify you for research or industry analysis.' },
    ],
  },
  {
    icon: Lock,
    color: 'green',
    title: '5. Data Security',
    bullets: [
      { label: 'Encryption in Transit', text: 'All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security).' },
      { label: 'Encryption at Rest', text: 'Financial data stored in our database is encrypted using AES-256 encryption.' },
      { label: 'Row-Level Security (RLS)', text: 'Our database employs Row-Level Security policies enforced at the database level, ensuring each user can only access their own data — even if application-layer checks were bypassed.' },
      { label: 'Access Controls', text: 'Only authorised personnel who need access to perform their job functions are permitted to access user data.' },
      { label: 'Authentication', text: 'We use secure session management and support multi-factor authentication (MFA) to protect your account.' },
      { label: 'Payment Security', text: 'All payment data is processed by Stripe, a PCI DSS Level 1 compliant payment processor. FinanceFlow AI never stores complete credit card information.' },
      { label: 'Incident Response', text: 'We maintain a security incident response plan. In the event of a data breach affecting your rights and freedoms, we will notify you and relevant authorities as required by applicable law.' },
    ],
    footer: 'While we implement robust safeguards, no method of internet transmission or electronic storage is 100% secure. We are committed to continuously improving our security practices.',
  },
  {
    icon: Cookie,
    color: 'amber',
    title: '6. Cookies & Analytics',
    content: ['We use a Cookie Consent Banner to give you clear control over which cookies are active. When you first visit FinanceFlow AI, you will be presented with the following options:'],
    bullets: [
      { label: 'Essential Cookies (always active)', text: 'Required for authentication, session management, and core functionality. These cannot be disabled without impairing the Service. They include your login session token and user preferences such as language, currency, and theme.' },
      { label: 'Analytics Cookies (consent required)', text: "When you click \"Accept All\" or customise to enable analytics, we activate Google Analytics (GA4) to collect aggregated, anonymised usage data — pages visited, features used, session duration, and device type. This data is sent to Google and is subject to Google's Privacy Policy. We use this data solely to improve FinanceFlow AI." },
      { label: 'Your Choice', text: 'You may click "Accept All," "Necessary Only," or "Customise" to select individual categories. Your preference is stored in your browser\'s local storage (key: ff_cookie_consent). You can withdraw consent at any time by clearing your browser storage or revisiting your cookie preferences.' },
    ],
    footer: 'We do not use cookies to deliver targeted advertising. You can also control cookies through your browser settings; note that disabling essential cookies may affect core functionality.',
  },
  {
    icon: Clock,
    color: 'teal',
    title: '7. Data Retention',
    bullets: [
      { label: 'Active Account Data', text: 'We retain your personal data for as long as your account is active or as needed to provide you with the Service.' },
      { label: 'Account Deletion', text: 'When you delete your account (via Settings → Account → Delete Account, which calls our secure delete_user_account database function), we permanently delete all your personal data, financial records, goals, budgets, transactions, and AI conversation history within 30 days.' },
      { label: 'Legal Retention', text: 'We may retain certain data where required by law, regulation, or legitimate business purposes (e.g., tax records, fraud prevention), even after account deletion.' },
      { label: 'Backup Retention', text: 'Explicitly deleted financial records are removed from active storage immediately but may remain in encrypted backups for up to 90 days before permanent deletion.' },
      { label: 'Support Communications', text: 'We retain support communications for up to 2 years to improve service quality and resolve follow-up issues.' },
    ],
  },
  {
    icon: UserCheck,
    color: 'blue',
    title: '8. Your Rights & Choices (GDPR)',
    content: ['If you are located in the European Economic Area (EEA), United Kingdom, or another jurisdiction with similar data protection laws, you have the following rights under the General Data Protection Regulation (GDPR) and equivalent legislation:'],
    bullets: [
      { label: 'Right to Access (Article 15)', text: 'You may request a copy of the personal data we hold about you. Navigate to Settings → Data Export or contact us at privacy@financeflow.io.' },
      { label: 'Right to Rectification (Article 16)', text: 'You may update or correct inaccurate personal data through your account settings at any time.' },
      { label: 'Right to Erasure — "Right to be Forgotten" (Article 17)', text: 'You may request permanent deletion of all your personal data. Use Settings → Account → Delete Account in the app, which triggers our secure delete_user_account database function to permanently remove all your records. We will complete deletion within 30 days, subject to legal retention requirements.' },
      { label: 'Right to Data Portability (Article 20)', text: 'You may export your data in a machine-readable format — including all transactions, budgets, savings goals, and net worth entries — via Settings → Data Export (CSV format). This allows you to port your financial data to another service.' },
      { label: 'Right to Restrict Processing (Article 18)', text: 'In certain circumstances, you may request that we restrict processing of your personal data.' },
      { label: 'Right to Object (Article 21)', text: 'You may object to processing of your personal data where we rely on legitimate interests as the legal basis.' },
      { label: 'Right to Withdraw Consent', text: 'Where processing is based on consent (e.g., analytics cookies, marketing emails), you may withdraw it at any time without affecting the lawfulness of processing before withdrawal.' },
      { label: 'Opt-Out of Marketing', text: 'Click "Unsubscribe" in any marketing email or update your notification preferences in account settings.' },
    ],
    footer: 'To exercise any of these rights, contact us at privacy@financeflow.io. We will respond within 30 days. If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.',
  },
  {
    icon: Baby,
    color: 'orange',
    title: "9. Children's Privacy",
    content: ["The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child under 16 has provided us with personal data, please contact us immediately and we will take steps to delete such information."],
  },
  {
    icon: Globe,
    color: 'cyan',
    title: '10. International Data Transfers',
    content: [
      'FinanceFlow AI operates globally, and your data may be processed and stored in countries other than your own — including the United States and the European Union, where our infrastructure providers operate. When we transfer personal data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission for transfers from the EEA or UK.',
      'Our primary data processor, Supabase, maintains SOC 2 Type II certification and GDPR-compliant data processing agreements.',
    ],
  },
  {
    icon: Link,
    color: 'slate',
    title: '11. Third-Party Services & Links',
    bullets: [
      { label: 'Supabase', text: 'Our database and authentication infrastructure. Your financial data is stored in Supabase-hosted PostgreSQL databases with RLS enforced.' },
      { label: 'Stripe', text: "Payment processing for Paid and Premium subscriptions. Subject to Stripe's Privacy Policy." },
      { label: 'Google Analytics', text: 'Usage analytics, activated only with your cookie consent. Subject to Google\'s Privacy Policy.' },
      { label: 'AI Provider', text: 'Our AI Financial Assistant uses large language model infrastructure. Queries are processed in real-time and not retained for model training.' },
      { label: 'Third-Party Links', text: 'The Service may contain links to external websites. We are not responsible for the privacy practices of those sites. Please review their privacy policies independently.' },
    ],
  },
  {
    icon: RefreshCw,
    color: 'purple',
    title: '12. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated "Last Updated" date and, where appropriate, by sending an email notification.',
      'Your continued use of the Service after any changes become effective constitutes your acceptance of the updated policy. We encourage you to review this policy periodically.',
    ],
  },
  {
    icon: Mail,
    color: 'rose',
    title: '13. Contact Us',
    content: ['If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:'],
    contact: true,
  },
];

const colorMap: Record<string, { bg: string; iconBg: string; icon: string; border: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     iconBg: 'bg-blue-100 dark:bg-blue-900/40',     icon: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-100 dark:border-blue-800' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40', icon: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-800' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', iconBg: 'bg-violet-100 dark:bg-violet-900/40', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-900/20',     iconBg: 'bg-pink-100 dark:bg-pink-900/40',     icon: 'text-pink-600 dark:text-pink-400',     border: 'border-pink-100 dark:border-pink-800' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',   iconBg: 'bg-green-100 dark:bg-green-900/40',   icon: 'text-green-600 dark:text-green-400',   border: 'border-green-100 dark:border-green-800' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   iconBg: 'bg-amber-100 dark:bg-amber-900/40',   icon: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-100 dark:border-amber-800' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',     iconBg: 'bg-teal-100 dark:bg-teal-900/40',     icon: 'text-teal-600 dark:text-teal-400',     border: 'border-teal-100 dark:border-teal-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-800' },
  cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-900/20',     iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',     icon: 'text-cyan-600 dark:text-cyan-400',     border: 'border-cyan-100 dark:border-cyan-800' },
  slate:  { bg: 'bg-slate-50 dark:bg-slate-800/40',   iconBg: 'bg-slate-100 dark:bg-slate-700/40',   icon: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-100 dark:border-slate-700' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-800' },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-900/20',     iconBg: 'bg-rose-100 dark:bg-rose-900/40',     icon: 'text-rose-600 dark:text-rose-400',     border: 'border-rose-100 dark:border-rose-800' },
};

export default function PrivacyPolicyPage({ onNavigate, onSignIn }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        pageKey="privacy"
        title="Privacy Policy — FinanceFlow AI | GDPR Compliant"
        description="FinanceFlow AI privacy policy — how we collect, use, and protect your personal and financial data. GDPR Article 17 & 20 compliant. Cookie consent controls. You own your data."
        keywords="FinanceFlow privacy policy, GDPR finance app, data protection personal finance, financial data privacy, cookie consent"
        canonical="https://financeflow.ai/privacy"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Privacy Policy', url: 'https://financeflow.ai/privacy' },
        ]}
      />
      <PublicNavbar currentView="home" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Shield size={14} />
            Legal &amp; Privacy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">Last updated: June 14, 2026</p>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your privacy matters. We are transparent about what we collect, why we collect it, and how you can control or delete your data at any time.
          </p>
        </div>
      </section>

      {/* GDPR highlights bar */}
      <section className="border-y border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 py-6 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { Icon: Lock,     label: 'AES-256 Encryption',  sub: 'Data at rest & in transit' },
            { Icon: Trash2,   label: 'Right to Deletion',   sub: 'GDPR Article 17 compliant' },
            { Icon: Download, label: 'Data Export',         sub: 'GDPR Article 20 compliant' },
            { Icon: Cookie,   label: 'Cookie Consent',      sub: 'You control analytics' },
          ].map(({ Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plain-language summary */}
      <section className="py-8 px-4 bg-blue-50 dark:bg-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3">
              Summary (plain language)
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> We collect only what is needed to run FinanceFlow AI and improve it.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> We never sell your data. Analytics cookies require your explicit consent.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> You can export all your data as CSV at any time from Settings → Data Export.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> You can permanently delete your account and all data via Settings → Account → Delete Account.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Questions? Email us at{' '}
                <a href="mailto:privacy@financeflow.io" className="text-blue-600 dark:text-blue-400 font-medium underline">
                  privacy@financeflow.io
                </a>.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Policy sections */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section) => {
            const colors = colorMap[section.color] ?? colorMap.blue;
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className={`rounded-2xl border ${colors.bg} ${colors.border} p-6 md:p-8`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={colors.icon} />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white pt-1">
                    {section.title}
                  </h2>
                </div>

                {section.content && (
                  <div className="space-y-3 mb-4">
                    {section.content.map((para, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-7">{para}</p>
                    ))}
                  </div>
                )}

                {section.bullets && (
                  <ul className="space-y-3 mt-2">
                    {section.bullets.map((b) => (
                      <li key={b.label} className="text-sm text-gray-700 dark:text-gray-300 leading-6">
                        <span className="font-semibold text-gray-900 dark:text-white">{b.label}: </span>
                        {b.text}
                      </li>
                    ))}
                  </ul>
                )}

                {section.footer && (
                  <p className="mt-5 text-sm text-gray-600 dark:text-gray-400 italic leading-6">
                    {section.footer}
                  </p>
                )}

                {section.contact && (
                  <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Email: </span>
                      <a href="mailto:privacy@financeflow.io" className="text-blue-600 dark:text-blue-400 underline">
                        privacy@financeflow.io
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">EEA / UK users: </span>
                      If unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority (e.g., ICO in the UK, CNIL in France).
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">In-app: </span>
                      Use Settings → Account → Delete Account to exercise your right to erasure, or Settings → Data Export to exercise your right to portability — no email required.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
