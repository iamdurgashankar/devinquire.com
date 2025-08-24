import React from 'react';

const CookiePolicy = () => (
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
        <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Cookie Policy</h1>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Learn how we use cookies to enhance your browsing experience.
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
    <h2 className="text-xl font-semibold mt-6 mb-2">What Are Cookies?</h2>
    <p className="mb-4">Cookies are small text files stored on your device by your web browser. They help us improve your experience on our website.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Cookies</h2>
    <ul className="list-disc ml-6 mb-4">
      <li><strong>Essential Cookies:</strong> Necessary for the website to function properly.</li>
      <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
      <li><strong>Preference Cookies:</strong> Remember your preferences and settings.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-6 mb-2">Managing Cookies</h2>
    <p className="mb-4">You can choose to disable cookies through your browser settings. However, disabling cookies may affect the functionality of our website.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Third-Party Cookies</h2>
    <p className="mb-4">We may use third-party services (such as analytics providers) that may also set cookies on your device.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Changes to This Policy</h2>
    <p className="mb-4">We may update our Cookie Policy from time to time. Any changes will be posted on this page.</p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>If you have any questions about our Cookie Policy, please contact us at <strong>contact@devinquire.com</strong>.</p>
        </div>
      </div>
    </section>
  </div>
);

export default CookiePolicy;