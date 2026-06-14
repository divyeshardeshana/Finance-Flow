import { Shield } from 'lucide-react';
import { PublicFooter } from '../Common/PublicFooter';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import SEOHead from '../SEO/SEOHead';

interface PrivacyPolicyPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const sections = [
  {
    title: '1. Introduction',
    content: `FinanceFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial management platform, website, and related services (collectively, the "Service").

By accessing or using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not use the Service.

This policy was last updated on February 18, 2026 and is effective as of that date.`,
  },
  {
    title: '2. Information We Collect',
    content: `We collect several types of information in connection with the Service:

Account Information: When you create an account, we collect your full name, email address, and a securely hashed password.

Profile Information: You may optionally provide profile details such as your country, preferred currency, language, timezone, and a profile photo.

Financial Data: To provide our core service, we collect information you enter about your income, expenses, transactions, budgets, savings goals, investments, net worth entries, and bill reminders. This data is stored securely and associated with your account.

Usage Data: We automatically collect information about how you interact with the Service, including pages visited, features used, time spent, and clickstream data. This helps us improve the platform.

Technical Data: We collect your IP address, browser type and version, operating system, device identifiers, and log data when you access the Service.

Payment Information: If you subscribe to a paid plan, payment transactions are processed by Stripe. We do not store full credit card numbers. We may store the last four digits of your card and billing-related metadata.

Communications: When you contact us for support, we retain those communications to help resolve your issue and improve our service.`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We use the information we collect for the following purposes:

Service Delivery: To provide, operate, and maintain the FinanceFlow platform, including all features such as budgeting, expense tracking, savings goals, investment tracking, and financial analytics.

Account Management: To create and manage your user account, authenticate your identity, and protect against unauthorized access.

Personalization: To personalize your experience, including displaying content and features relevant to your preferences, subscription tier, and usage history.

Analytics & Improvement: To understand how users interact with the Service, identify bugs and performance issues, and continually improve our features and user experience.

Communications: To send you important account-related notices, security alerts, product updates, and — where you have opted in — marketing communications. You may opt out of marketing emails at any time.

Payment Processing: To process subscription payments through our payment provider, Stripe, and manage your billing history.

Legal & Compliance: To comply with applicable laws and regulations, enforce our Terms of Service, and protect the rights, property, and safety of FinanceFlow, our users, and others.

Security: To detect, prevent, and respond to fraud, abuse, and security incidents.`,
  },
  {
    title: '4. How We Share Your Information',
    content: `We do not sell, rent, or trade your personal information to third parties. We may share your information only in the following limited circumstances:

Service Providers: We engage trusted third-party vendors to help operate the Service, including cloud hosting (Supabase), payment processing (Stripe), analytics, and email delivery. These providers are contractually required to protect your data and may only use it to provide services to us.

Legal Requirements: We may disclose your information if required to do so by law or in response to valid legal requests (e.g., a court order, subpoena, or government agency request).

Business Transfers: If FinanceFlow is acquired, merged, or undergoes a significant corporate restructuring, your information may be transferred to the acquiring entity. We will notify you before your information becomes subject to a different privacy policy.

With Your Consent: We may share your information for other purposes with your explicit consent.

Aggregated, Non-Identifiable Data: We may share aggregated, anonymized data that cannot reasonably be used to identify you for research, industry analysis, or marketing purposes.`,
  },
  {
    title: '5. Data Security',
    content: `We take the security of your information seriously and implement industry-standard measures to protect it:

Encryption: All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security). Financial data at rest is encrypted using AES-256 encryption.

Access Controls: Access to your personal data is strictly controlled. Only authorized personnel who need access to perform their job functions are permitted to access user data.

Row-Level Security: Our database employs Row-Level Security (RLS) policies, ensuring that each user can only access their own data.

Authentication: We use secure session management and support multi-factor authentication (MFA) to protect your account from unauthorized access.

Payment Security: All payment data is processed by Stripe, a PCI DSS Level 1 compliant payment processor. FinanceFlow never stores your complete credit card information.

Incident Response: We maintain a security incident response plan. In the event of a data breach that affects your rights and freedoms, we will notify you and relevant authorities as required by applicable law.

While we implement robust safeguards, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to continuously improving our security practices.`,
  },
  {
    title: '6. Cookies and Tracking Technologies',
    content: `We use cookies and similar tracking technologies to operate and improve the Service:

Essential Cookies: Required for authentication, session management, and core functionality. These cannot be disabled without impairing the Service.

Preference Cookies: Store your settings and preferences (e.g., language, currency, theme) so you don't have to re-enter them on each visit.

Analytics Cookies: Help us understand how users use the Service. We use aggregated, anonymized analytics data to improve features and performance. You may opt out of analytics tracking through your account preferences.

You can control cookie settings through your browser. Note that disabling certain cookies may affect functionality. We do not use cookies to deliver targeted advertising.`,
  },
  {
    title: '7. Data Retention',
    content: `We retain your personal data for as long as your account is active or as needed to provide you with the Service.

If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal, regulatory, or legitimate business purposes (e.g., tax records, fraud prevention).

Financial transaction records that you explicitly delete are removed from active storage immediately but may be retained in encrypted backups for up to 90 days before permanent deletion.

We retain support communications for up to 2 years to improve service quality and resolve any follow-up issues.`,
  },
  {
    title: '8. Your Rights and Choices',
    content: `Depending on your location, you may have the following rights regarding your personal data:

Right to Access: You may request a copy of the personal data we hold about you.

Right to Rectification: You may update or correct inaccurate personal data through your account settings or by contacting us.

Right to Erasure ("Right to be Forgotten"): You may request deletion of your personal data. We will comply within 30 days, subject to legal retention requirements.

Right to Portability: You may request your data in a machine-readable format (e.g., CSV export of your transactions, budgets, and goals).

Right to Restrict Processing: In certain circumstances, you may request that we restrict the processing of your personal data.

Right to Object: You may object to processing of your personal data where we rely on legitimate interests as the legal basis.

Right to Withdraw Consent: Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of processing before withdrawal.

Opt-Out of Marketing: You may unsubscribe from marketing communications by clicking "Unsubscribe" in any marketing email or by updating your notification preferences in your account settings.

To exercise any of these rights, please contact us at privacy@financeflow.io. We will respond within 30 days.`,
  },
  {
    title: '9. Children\'s Privacy',
    content: `The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child under 16 has provided us with personal data, please contact us immediately and we will take steps to delete such information.`,
  },
  {
    title: '10. International Data Transfers',
    content: `FinanceFlow operates globally, and your data may be processed and stored in countries other than your own. When we transfer personal data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission for transfers from the European Economic Area (EEA) or the UK.`,
  },
  {
    title: '11. Third-Party Links',
    content: `The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`,
  },
  {
    title: '12. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated "Last Updated" date, and, where appropriate, by sending you an email notification. We encourage you to review this policy periodically.

Your continued use of the Service after any changes become effective constitutes your acceptance of the updated policy.`,
  },
  {
    title: '13. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: privacy@financeflow.io
Mailing Address: FinanceFlow Inc., Privacy Team, 123 Finance Street, San Francisco, CA 94105, USA

For EEA/UK users: If you are unsatisfied with our response to a privacy concern, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

export default function PrivacyPolicyPage({ onNavigate, onSignIn }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <SEOHead pageKey="privacy" />
      <PublicNavbar currentView="home" onNavigate={onNavigate} onSignIn={onSignIn} />

      <section className="pt-28 pb-16 bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Shield size={14} />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: February 18, 2026
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900 rounded-xl p-6 mb-10">
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              Your privacy is important to us. This Privacy Policy explains how FinanceFlow collects,
              uses, and protects your personal information when you use our financial management platform.
              Please read this document carefully. If you have questions, contact us at{' '}
              <a href="mailto:privacy@financeflow.io" className="font-semibold underline">
                privacy@financeflow.io
              </a>.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="border-b border-gray-100 dark:border-gray-700 pb-10 last:border-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{section.title}</h2>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-7 whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
