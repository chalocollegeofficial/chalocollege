import React from 'react';
import { Helmet } from 'react-helmet';
import { DEFAULT_OG_IMAGE, SITE_NAME, mergeKeywords, toAbsoluteUrl } from '@/lib/seo';

const SeoHead = ({
  title,
  description,
  keywords = [],
  canonicalPath = '/',
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  noIndex = false,
  jsonLd,
  children,
}) => {
  const resolvedTitle = String(title || SITE_NAME).trim();
  const resolvedDescription = String(description || '').trim();
  const resolvedCanonicalUrl = toAbsoluteUrl(canonicalUrl || canonicalPath);
  const resolvedImage = toAbsoluteUrl(ogImage);
  const keywordContent = mergeKeywords(keywords).join(', ');
  const robotsContent = noIndex ? 'noindex, nofollow' : robots;
  const jsonLdScripts = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean);

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      {resolvedDescription ? <meta name="description" content={resolvedDescription} /> : null}
      {keywordContent ? <meta name="keywords" content={keywordContent} /> : null}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      <link rel="canonical" href={resolvedCanonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={resolvedTitle} />
      {resolvedDescription ? <meta property="og:description" content={resolvedDescription} /> : null}
      <meta property="og:url" content={resolvedCanonicalUrl} />
      <meta property="og:image" content={resolvedImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      {resolvedDescription ? <meta name="twitter:description" content={resolvedDescription} /> : null}
      <meta name="twitter:image" content={resolvedImage} />

      {jsonLdScripts.map((item, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}

      {children}
    </Helmet>
  );
};

export default SeoHead;
