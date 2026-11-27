import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { IS_LOCALHOST } from '../config';

const getCmsApiCandidates = () => {
  const envUrl = (process.env.REACT_APP_CMS_API_URL || '').replace(/\/+$/, '');
  const list = [];
  if (envUrl) list.push(envUrl);
  if (IS_LOCALHOST) {
    list.push('http://localhost:8080', 'http://localhost:3002/cms');
  } else {
    list.push(`${window.location.origin}`, `${window.location.origin}/cms`);
  }
  return Array.from(new Set(list));
};

function renderBlock(block) {
  if (!block) return null;
  const { type, content = {}, styles = {} } = block;
  const styleObj = {
    textAlign: styles.textAlign,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    padding: styles.padding,
    margin: styles.margin,
    borderRadius: styles.borderRadius,
  };

  switch (type) {
    case 'text': {
      const Tag = content.tag || 'p';
      return (
        <Tag
          key={block.id}
          style={styleObj}
          className={
            Tag === 'h1'
              ? 'text-4xl sm:text-5xl font-bold tracking-tight mb-4'
              : Tag === 'h2'
              ? 'text-3xl font-bold tracking-tight mb-3'
              : Tag === 'h3'
              ? 'text-xl font-semibold mb-2'
              : 'text-base leading-relaxed mb-3'
          }
          dangerouslySetInnerHTML={{ __html: content.text || '' }}
        />
      );
    }
    case 'button':
      return (
        <div key={block.id} style={{ textAlign: styles.textAlign }} className="my-4">
          <a
            href={content.url || '#'}
            target={content.openInNewTab ? '_blank' : undefined}
            rel={content.openInNewTab ? 'noopener noreferrer' : undefined}
            style={{
              backgroundColor: styles.backgroundColor || '#4e45e1',
              color: styles.color || '#ffffff',
              borderRadius: styles.borderRadius || '9999px',
              padding: styles.padding || '0.75rem 1.75rem',
            }}
            className="inline-flex items-center justify-center font-semibold text-sm transition hover:opacity-90"
          >
            {content.label || content.text || 'Learn More'}
          </a>
        </div>
      );
    case 'image':
      return (
        <div key={block.id} style={styleObj} className="my-4">
          <img
            src={content.url || content.src}
            alt={content.alt || ''}
            style={{ borderRadius: styles.borderRadius || '1rem' }}
            className="w-full h-auto object-cover"
          />
          {content.caption && (
            <p className="text-xs opacity-70 mt-2 text-center">{content.caption}</p>
          )}
        </div>
      );
    case 'video':
      return (
        <div key={block.id} style={styleObj} className="my-4 aspect-video overflow-hidden rounded-2xl">
          <iframe
            src={content.url}
            title={content.title || 'Embedded Video'}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      );
    case 'spacer':
      return <div key={block.id} style={{ height: content.height || styles.height || '2rem' }} />;
    case 'divider':
      return <hr key={block.id} className="my-6 border-black/10 dark:border-white/10" />;
    case 'html':
    case 'embed':
      return <div key={block.id} style={styleObj} dangerouslySetInnerHTML={{ __html: content.html || content.code || '' }} />;
    case 'code':
      return (
        <pre key={block.id} className="p-4 rounded-xl bg-[#1C1C1E] text-[#F5F5F7] text-xs font-mono overflow-x-auto my-4">
          <code>{content.code || content.text || ''}</code>
        </pre>
      );
    case 'list': {
      const items = Array.isArray(content.items) ? content.items : [];
      return (
        <ul key={block.id} style={styleObj} className="list-disc pl-6 space-y-1.5 my-3">
          {items.map((it, idx) => (
            <li key={idx}>{typeof it === 'string' ? it : it?.text || ''}</li>
          ))}
        </ul>
      );
    }
    case 'alert':
      return (
        <div
          key={block.id}
          style={styleObj}
          className="p-4 rounded-2xl border border-[#4e45e1]/20 bg-[#4e45e1]/8 my-4"
        >
          {content.title && <div className="font-semibold mb-1">{content.title}</div>}
          <div className="text-sm opacity-90">{content.text || content.message || ''}</div>
        </div>
      );
    default:
      if (content.text || content.html) {
        return (
          <div
            key={block.id}
            style={styleObj}
            dangerouslySetInnerHTML={{ __html: content.html || content.text }}
          />
        );
      }
      return null;
  }
}

export default function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPage(null);

    (async () => {
      const candidates = getCmsApiCandidates();
      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/api/v1/content/pages/${encodeURIComponent(slug)}`);
          if (!res.ok) continue;
          const json = await res.json();
          if (json?.success && json?.data) {
            if (active) {
              setPage(json.data);
              setLoading(false);
            }
            return;
          }
        } catch {
          // try next backend candidate
        }
      }
      if (active) {
        setNotFound(true);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4e45e1]" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center bg-white/80 dark:bg-[#2C2C2E]/80 backdrop-blur-xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-10 shadow-sm">
          <h1 className="text-5xl font-bold text-[#86868B] mb-3">404</h1>
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#86868B] mb-7">
            This page does not exist or has not been published in DevInquire CMS yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4e45e1] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (page.isCustomSite) {
    return (
      <>
        <Helmet>
          <title>{page.seo?.metaTitle || page.title}</title>
          {page.seo?.metaDescription && <meta name="description" content={page.seo.metaDescription} />}
        </Helmet>
        <style dangerouslySetInnerHTML={{ __html: page.customCSS || '' }} />
        <div dangerouslySetInnerHTML={{ __html: page.customHTML || '' }} />
      </>
    );
  }

  const sections = page.layoutJSON?.sections || [];

  return (
    <>
      <Helmet>
        <title>{page.seo?.metaTitle || page.title}</title>
        {page.seo?.metaDescription && <meta name="description" content={page.seo.metaDescription} />}
        {page.seo?.keywords && <meta name="keywords" content={page.seo.keywords} />}
      </Helmet>
      <div className="w-full">
        {sections.map((section) => (
          <section
            key={section.id}
            style={{
              ...section.styles,
              padding: section.styles?.padding || '4rem 0',
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div
                className="grid gap-8"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(section.columns?.length || 1, 1)}, minmax(0, 1fr))`,
                }}
              >
                {(section.columns || []).map((col) => (
                  <div key={col.id} style={col.styles} className="space-y-2">
                    {(col.blocks || []).map((block) => renderBlock(block))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
