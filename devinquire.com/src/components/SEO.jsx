import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogTitle, 
  ogDescription, 
  ogImage, 
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  type = 'website',
  schemaType = 'WebPage',
  author,
  datePublished,
  dateModified,
  articleSection
}) => {
  const siteTitle = 'DevInquire';
  const defaultDescription = 'Professional web development, mobile app development, and digital solutions. Expert team delivering custom software solutions for businesses worldwide.';
  const defaultKeywords = 'web development, mobile app development, software development, digital solutions, custom software, DevInquire, professional development services';
  const baseUrl = 'https://devinquire.com';
  
  const pageTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - Professional Development Services`;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageCanonical = canonical || baseUrl;
  const pageOgTitle = ogTitle || pageTitle;
  const pageOgDescription = ogDescription || pageDescription;
  const pageOgUrl = ogUrl || baseUrl;
  const pageTwitterTitle = twitterTitle || pageTitle;
  const pageTwitterDescription = twitterDescription || pageDescription;

  // Schema.org structured data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DevInquire",
    "url": "https://devinquire.com",
    "logo": "https://devinquire.com/logo.png",
    "description": "Professional web development, mobile app development, and digital solutions company",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-0123",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://twitter.com/devinquire",
      "https://linkedin.com/company/devinquire",
      "https://github.com/devinquire"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevInquire",
    "url": "https://devinquire.com",
    "description": defaultDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://devinquire.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  let pageSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": pageTitle,
    "description": pageDescription,
    "url": pageCanonical
  };

  // Add article-specific schema for blog posts
  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    pageSchema = {
      ...pageSchema,
      "@type": "BlogPosting",
      "headline": title,
      "author": {
        "@type": "Person",
        "name": author || "DevInquire Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "DevInquire",
        "logo": {
          "@type": "ImageObject",
          "url": "https://devinquire.com/logo.png"
        }
      },
      "datePublished": datePublished,
      "dateModified": dateModified || datePublished,
      "articleSection": articleSection,
      "image": ogImage ? {
        "@type": "ImageObject",
        "url": ogImage
      } : undefined
    };
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <link rel="canonical" href={pageCanonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={pageOgTitle} />
      <meta property="og:description" content={pageOgDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageOgUrl} />
      <meta property="og:site_name" content={siteTitle} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTwitterTitle} />
      <meta name="twitter:description" content={pageTwitterDescription} />
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={author || "DevInquire"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(pageSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;