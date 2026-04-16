import React from 'react';

const PrivacyPolicy = () => (
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
        <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Privacy Policy</h1>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Your privacy is important to us. Learn how we collect, use, and protect your information.
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
            <span className="text-sm font-semibold text-[#4e45e1] uppercase tracking-wider">Version 1.0</span>
            <span className="text-sm text-gray-500">Last updated: June 28, 2025</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-0">Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to Devinquire. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. The Data We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
            <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. How We Use Your Data</h2>
          <p className="text-gray-600 leading-relaxed">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal or regulatory obligation.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. For detailed information on the cookies we use and the purposes for which we use them see our <a href="/cookies" className="text-[#4e45e1] font-semibold hover:underline">Cookie Policy</a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Your Legal Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
          </p>

          <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mt-0 mb-4">Questions or Concerns?</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about this privacy policy or our privacy practices, please contact our data privacy manager in the following ways:
            </p>
            <div className="space-y-3">
              <p className="flex items-center text-gray-700">
                <span className="font-semibold w-24">Email:</span>
                <a href="mailto:privacy@devinquire.com" className="text-[#4e45e1] hover:underline">privacy@devinquire.com</a>
              </p>
              <p className="flex items-center text-gray-700">
                <span className="font-semibold w-24">Address:</span>
                <span>Virtual Headquarters, Tech District, Cloud City</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default PrivacyPolicy;