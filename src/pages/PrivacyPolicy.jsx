import React from 'react';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gray-50 pt-20">
    {/* Hero Section */}
    <section className="bg-[#0077b6] text-white py-20 relative overflow-hidden">
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
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="mb-6 text-gray-600">Effective Date: <strong>28/06/2025</strong></p>
    <p className="mb-4">At Devinquire, accessible from <strong>https://devinquire.com</strong>, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Devinquire and how we use it.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
    <ul className="list-disc ml-6 mb-4">
      <li><strong>Personal Information:</strong> When you register for an account, we may collect your name, email address, username, and other information you provide.</li>
      <li><strong>Usage Data:</strong> We may collect information on how you access and use the site, including your IP address, browser type, and pages visited.</li>
      <li><strong>Cookies:</strong> We use cookies to enhance your experience (see our Cookie Policy).</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Information</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>To provide, operate, and maintain our website and services.</li>
      <li>To improve, personalize, and expand our website.</li>
      <li>To communicate with you, including for customer service and updates.</li>
      <li>To process your transactions and manage your account.</li>
      <li>To comply with legal obligations.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">Sharing Your Information</h2>
    <p className="mb-4">We do not sell, trade, or otherwise transfer your personal information to outside parties except as required by law or to trusted third parties who assist us in operating our website, so long as those parties agree to keep this information confidential.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Security</h2>
    <p className="mb-4">We implement a variety of security measures to maintain the safety of your personal information.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Your Rights</h2>
    <p className="mb-4">Depending on your location, you may have the right to access, correct, or delete your personal data. Please contact us at <strong>[your contact email]</strong> for any requests.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Changes to This Policy</h2>
    <p className="mb-4">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <strong>contact@devinquire.com</strong>.</p>
        </div>
      </div>
    </section>
  </div>
);

export default PrivacyPolicy;