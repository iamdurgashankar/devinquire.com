import React from 'react';
import { Cookie, RotateCcw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';

const CookiePolicy = () => (
  <>
    <SEO
      title="Cookie Policy - DevInquire"
      description="Learn how DevInquire uses cookies and local storage to deliver a fast, personalized browsing experience."
      canonical="https://devinquire.com/cookies"
    />
    <PageLayout
      badge="User Experience"
      title="Cookie Policy"
      subtitle="Learn how we use cookies and local preferences to enhance your browsing experience."
    >
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="apple-card p-8 md:p-12 prose max-w-none">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-[var(--border-subtle)] pb-6">
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] uppercase tracking-[0.06em]">
                <Cookie className="w-4 h-4" />
                Browser Preferences
              </span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Last updated: June 28, 2025</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-0">What Are Cookies?</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, remember your appearance preferences (such as Light or Dark mode), and provide anonymized telemetry to site operators.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">How We Use Cookies</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We use cookies for the specific purposes detailed below. You can customize your consent preferences at any time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 not-prose">
              <div className="p-6 apple-subcard rounded-2xl">
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-2">Essential Cookies</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Strictly necessary to provide you with core site functionality, security tokens, and theme appearance persistence.
                </p>
              </div>
              <div className="p-6 apple-subcard rounded-2xl">
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-2">Analytics Cookies</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Collect aggregate, anonymized metrics to help us understand how visitors navigate our pages and improve performance.
                </p>
              </div>
              <div className="p-6 apple-subcard rounded-2xl">
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-2">Personalization Cookies</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Remember your interface choices and regional settings to provide a tailored experience across sessions.
                </p>
              </div>
              <div className="p-6 apple-subcard rounded-2xl">
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-2">Marketing Cookies</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Help measure the effectiveness of our technical publications and campaign outreach.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">Managing Your Cookies</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              You have the right to decide whether to accept or reject non-essential cookies. You can also amend your web browser controls to block or delete cookies.
            </p>

            <div className="mt-12 p-8 apple-subcard rounded-2xl text-center not-prose">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Cookie Consent Preferences</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                You can reset and adjust your on-site cookie consent preferences at any time with a single click.
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem('devinquire_cookie_consent');
                  window.location.reload();
                }}
                className="apple-pill-btn px-6 py-3 text-[14px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Cookie Preferences</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  </>
);

export default CookiePolicy;
