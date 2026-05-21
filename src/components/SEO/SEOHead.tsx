import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';

export interface SEOData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image_url?: string;
  canonical_url?: string;
  structured_data?: object | null;
  is_indexable?: boolean;
}

interface SEOHeadProps {
  pageKey?: string;
  overrides?: Partial<SEOData>;
}

const SITE_NAME = 'FinanceFlow AI';
const DEFAULT_OG_IMAGE = 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function SEOHead({ pageKey, overrides }: SEOHeadProps) {
  const [seoData, setSeoData] = useState<SEOData | null>(null);

  useEffect(() => {
    if (!pageKey) return;
    supabase
      .from('seo_pages')
      .select('*')
      .eq('page_key', pageKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSeoData(data);
      });
  }, [pageKey]);

  const merged: SEOData = { ...seoData, ...overrides };

  const title = merged.meta_title || SITE_NAME;
  const description = merged.meta_description || '';
  const keywords = merged.meta_keywords || '';
  const ogTitle = merged.og_title || title;
  const ogDescription = merged.og_description || description;
  const ogImage = merged.og_image_url || DEFAULT_OG_IMAGE;
  const twitterTitle = merged.twitter_title || ogTitle;
  const twitterDescription = merged.twitter_description || ogDescription;
  const twitterImage = merged.twitter_image_url || ogImage;
  const canonical = merged.canonical_url || '';
  const isIndexable = merged.is_indexable !== false;
  const structuredData = merged.structured_data;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {!isIndexable && <meta name="robots" content="noindex, nofollow" />}
      {isIndexable && <meta name="robots" content="index, follow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={ogTitle} />
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <meta property="og:url" content={canonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@financeflowai" />
      <meta name="twitter:title" content={twitterTitle} />
      {twitterDescription && <meta name="twitter:description" content={twitterDescription} />}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
