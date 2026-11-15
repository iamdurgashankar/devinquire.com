import React from 'react';
import { Scale, Mail } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';

const TermsOfService = () => (
  <>
    <SEO
      title="Terms of Service - DevInquire"
      description="Read the Terms of Service governing the use of DevInquire's platforms, software, and consulting services."
      canonical="https://devinquire.com/terms"
    />
    <PageLayout
      badge="Legal Framework"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using our digital platforms and engineering services."
    >
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="apple-card p-8 md:p-12 prose max-w-none">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-[var(--border-subtle)] pb-6">
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] uppercase tracking-[0.06em]">
                <Scale className="w-4 h-4" />
                Legal Agreement
              </span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Last updated: June 28, 2025</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-0">1. Acceptance of Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              By accessing or using DevInquire (the "Site"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, clients, and users who access or use the Site.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">2. Description of Service</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              DevInquire provides software engineering, product design, consulting, and cloud architecture solutions. We reserve the right to withdraw or amend the Site and any service or material we provide on the Site, in our sole discretion without notice.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">3. Intellectual Property Rights</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The Site and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by DevInquire and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">4. Prohibited Uses</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              You may use the Site only for lawful purposes and in accordance with these Terms. You agree not to use the Site:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2 mt-4">
              <li>In any way that violates any applicable local, state, national, or international law.</li>
              <li>To transmit, or procure the sending of, any unauthorized advertising or promotional material, including "spam".</li>
              <li>To impersonate or attempt to impersonate DevInquire, a DevInquire employee, or any other user.</li>
              <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Site.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">5. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              In no event will DevInquire, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, under any legal theory, arising out of or in connection with your use, or inability to use, the Site.
            </p>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8">6. Governing Law</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              All matters relating to the Site and these Terms of Service and any dispute or claim arising therefrom or related thereto shall be governed by and construed in accordance with the internal laws of the jurisdiction in which the company is registered.
            </p>

            <div className="mt-12 p-6 md:p-8 apple-subcard rounded-2xl not-prose">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Contacting Legal</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-4">
                If you have any questions regarding these Terms of Service, please contact us at:
              </p>
              <div className="flex items-center gap-3 text-[14px] text-[var(--text-primary)]">
                <Mail className="w-4 h-4 text-[#007AFF]" />
                <span className="font-semibold">Email:</span>
                <a href="mailto:legal@devinquire.com" className="text-[#007AFF] dark:text-[#0A84FF] hover:underline">
                  legal@devinquire.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  </>
);

export default TermsOfService;
