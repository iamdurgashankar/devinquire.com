import React from 'react';

const TermsOfService = () => (
  <div className="min-h-screen bg-gray-50 pt-20">
    {/* Hero Section */}
    <section className="bg-[#4e45e1] text-white py-20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Terms of Service</h1>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Please read these terms carefully before using our services.
        </p>
      </div>
    </section>

    {/* Content Section */}
    <section className="py-20 relative">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 prose prose-indigo max-w-none">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
            <span className="text-sm font-semibold text-[#4e45e1] uppercase tracking-wider">Legal Framework</span>
            <span className="text-sm text-gray-500">Last updated: June 28, 2025</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-0">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using Devinquire (the "Site"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Site.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            Devinquire provides a platform for development inquiries, consulting, and technological solutions. We reserve the right to withdraw or amend the Site and any service or material we provide on the Site, in our sole discretion without notice.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Intellectual Property Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            The Site and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by Devinquire and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Prohibited Uses</h2>
          <p className="text-gray-600 leading-relaxed">
            You may use the Site only for lawful purposes and in accordance with these Terms. You agree not to use the Site:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
            <li>In any way that violates any applicable local, state, national, or international law.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including "junk mail" or "spam".</li>
            <li>To impersonate or attempt to impersonate Devinquire, a Devinquire employee, or any other user.</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Site.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            In no event will Devinquire, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, under any legal theory, arising out of or in connection with your use, or inability to use, the Site.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            All matters relating to the Site and these Terms of Service and any dispute or claim arising therefrom or related thereto shall be governed by and construed in accordance with the internal laws of the jurisdiction in which the company is registered.
          </p>

          <div className="mt-12 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-900 mt-0 mb-4">Contacting Us</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions regarding these Terms of Service, please contact us at:
            </p>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="font-semibold">Email:</span>
              <a href="mailto:legal@devinquire.com" className="text-[#4e45e1] hover:underline">legal@devinquire.com</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default TermsOfService;