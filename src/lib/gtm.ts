// Replace GTM-XXXXXXX with your real container ID from tagmanager.google.com
export const GTM_ID = 'GTM-XXXXXXX';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, timestamp: new Date().toISOString(), ...params });
}

export const gtm = {
  // Auth
  signUp: (method = 'email') => push('sign_up', { method }),
  signIn: (method = 'email') => push('sign_in', { method }),

  // Pricing / conversion
  planSelected: (plan: string, price: number) => push('plan_selected', { plan_name: plan, plan_price: price }),
  pricingPageView: () => push('pricing_page_view'),
  ctaClicked: (label: string, location: string) => push('cta_clicked', { cta_label: label, cta_location: location }),

  // Blog
  blogPostRead: (title: string, slug: string, category: string) =>
    push('blog_post_read', { blog_title: title, blog_slug: slug, blog_category: category }),
  blogScrollDepth: (slug: string, pct: number) =>
    push('blog_scroll_depth', { blog_slug: slug, scroll_pct: pct }),

  // Tools
  roiCalculated: (result: number) => push('roi_calculated', { roi_value: result }),
  contactFormSubmitted: (subject: string) => push('contact_form_submitted', { subject }),

  // Lead capture
  emailCaptured: (source: string) => push('email_captured', { capture_source: source }),

  // Page views (SPA - call on each view change)
  pageView: (path: string, title: string) =>
    push('page_view', { page_path: path, page_title: title }),
};
