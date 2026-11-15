import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';

const PrivacyPolicy = () => (
  <>
    <SEO
      title="Privacy Policy - DevInquire"
      description="Learn how DevInquire collects, uses, and protects your personal information with Apple-grade privacy standards."
      canonical="https://devinquire.com/privacy"
    />
    <PageLayout
      badge="Privacy & Trust"
      title="Privacy Policy"
      subtitle="Your privacy is fundamental. Learn how we collect, use, and safeguard your information."
    >
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="apple-card p-8 md:p-12 prose max-w-none">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-[var(--border-subtle)] pb-6">
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] uppercase tracking-[0.06em]">
                <ShieldCheck className="w-4 h-4" />
                Version 2.0
              </span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Last updated: June 28, 2025</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-0">Introduction</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Welcome to DevInquire. We respect your privacy and are committed to protecting your personal data. This privacy policy informs you how we look after your personal data when you visit our website and explains your privacy rights and how the law protects you.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">1. The Data We Collect</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Personal data means any information about an individual from which that person can be identified. We may collect, use, store, and transfer different kinds of personal data grouped as follows:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li><strong className="text-[var(--text-primary)]">Identity Data:</strong> includes first name, last name, username, or similar identifier.</li>
              <li><strong className="text-[var(--text-primary)]">Contact Data:</strong> includes email address and telephone numbers.</li>
              <li><strong className="text-[var(--text-primary)]">Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, and operating system.</li>
              <li><strong className="text-[var(--text-primary)]">Usage Data:</strong> includes information about how you use our website, products, and services.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">2. How We Use Your Data</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">3. Cookies</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Our website uses cookies to distinguish you from other users of our website. This helps us provide you with a seamless experience when you browse our website and allows us to improve our site. For detailed information on the cookies we use, see our{' '}
              <Link to="/cookies" className="text-[#007AFF] dark:text-[#0A84FF] font-semibold hover:underline">
                Cookie Policy
              </Link>.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">4. Data Security</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We have put in place strict security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to employees, agents, contractors, and other third parties who have a strict business need to know.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">5. Your Legal Rights</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Under data protection laws, you have rights in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, and data portability.
            </p>

            <div className="mt-12 p-6 md:p-8 apple-subcard rounded-2xl not-prose">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Questions or Concerns?</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-5">
                If you have any questions about this privacy policy or our privacy practices, please contact our data privacy officer:
              </p>
              <div className="space-y-2.5 text-[14px]">
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <Mail className="w-4 h-4 text-[#007AFF]" />
                  <span className="font-semibold">Email:</span>
                  <a href="mailto:privacy@devinquire.com" className="text-[#007AFF] dark:text-[#0A84FF] hover:underline">
                    privacy@devinquire.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <MapPin className="w-4 h-4 text-[#007AFF]" />
                  <span className="font-semibold">Location:</span>
                  <span className="text-[var(--text-secondary)]">Bengaluru, Karnataka, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  </>
);

export default PrivacyPolicy;
