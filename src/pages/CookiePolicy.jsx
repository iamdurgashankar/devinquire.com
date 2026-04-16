import React from 'react';

const CookiePolicy = () => (
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
        <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Cookie Policy</h1>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Learn how we use cookies to enhance your browsing experience.
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
            <span className="text-sm font-semibold text-[#4e45e1] uppercase tracking-wider">User Experience</span>
            <span className="text-sm text-gray-500">Last updated: June 28, 2025</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-0">What Are Cookies?</h2>
          <p className="text-gray-600 leading-relaxed">
            Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">How We Use Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies for a variety of reasons detailed below. Unfortunately, in most cases there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mt-0 mb-3">Essential Cookies</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mt-0 mb-3">Analytics Cookies</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mt-0 mb-3">Personalisation Cookies</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                These cookies are used to enhance the performance and functionality of our website but are non-essential to their use.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mt-0 mb-3">Marketing Cookies</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Managing Your Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
          </p>

          <div className="mt-12 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center">
            <h3 className="text-xl font-bold text-gray-900 mt-0 mb-4">Cookie Consent Toggles</h3>
            <p className="text-gray-600 mb-6">
              You can adjust your preferences at any time using our on-site cookie management tool.
            </p>
            <button 
              onClick={() => {
                localStorage.removeItem('devinquire_cookie_consent');
                window.location.reload();
              }}
              className="bg-[#4e45e1] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#4139BF] transition-all transform hover:scale-105"
            >
              Reset Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default CookiePolicy;