import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, ShieldCheck, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModernCookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    // Check if consent is already stored
    const storedConsent = localStorage.getItem('devinquire_cookie_consent');
    if (!storedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const handleRejectAll = () => {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const saveConsent = (consent) => {
    localStorage.setItem('devinquire_cookie_consent', JSON.stringify(consent));
    setIsVisible(false);
  };

  const togglePreference = (type) => {
    if (type === 'essential') return;
    setPreferences(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 right-6 z-[9999] flex justify-center pointer-events-none"
        >
          <motion.div 
            layout
            className="w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2rem] p-6 md:p-8 pointer-events-auto overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className={`flex flex-col ${!showSettings ? 'lg:flex-row lg:items-center' : 'lg:items-start'} gap-8 relative z-10`}>
              {/* Icon & Title */}
              <div className={`flex items-start gap-4 ${showSettings ? 'w-full border-b border-gray-100 pb-6' : ''}`}>
                <div className="p-3 bg-indigo-100/50 rounded-2xl">
                  <Cookie className="text-[#4e45e1] w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cookie Preferences</h3>
                  {!showSettings ? (
                    <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                      We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Choose which cookies you want to allow. Essential cookies are required for the website to function.</p>
                  )}
                </div>
                {showSettings && (
                   <button 
                   onClick={() => setShowSettings(false)}
                   className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <X size={24} />
                 </button>
                )}
              </div>

              {/* Main Content Areas */}
              {!showSettings ? (
                <div className="flex flex-col items-center lg:items-end gap-3 ml-auto min-w-[280px]">
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 px-6 py-3 rounded-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200 whitespace-nowrap"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 px-8 py-3 rounded-full text-sm font-bold text-white bg-[#4e45e1] hover:bg-[#4139BF] shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                      Accept All
                    </button>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest py-1"
                  >
                    <Settings size={14} />
                    Customize Settings
                  </button>
                </div>
              ) : (
                <div className="w-full animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Essential */}
                    <div className="p-6 rounded-[1.5rem] bg-gray-50 border border-gray-100 opacity-60 flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4e45e1]">Essential</span>
                          <ShieldCheck size={18} className="text-[#4e45e1]" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Necessary for the site to function properly.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Always Active</span>
                      </div>
                    </div>
                    
                    {/* Analytics */}
                    <div 
                      onClick={() => togglePreference('analytics')}
                      className={`p-6 rounded-[1.5rem] border cursor-pointer transition-all flex flex-col justify-between min-h-[160px] ${preferences.analytics ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${preferences.analytics ? 'text-[#4e45e1]' : 'text-gray-400'}`}>Analytics</span>
                          <Info size={18} className={preferences.analytics ? 'text-[#4e45e1]' : 'text-gray-300'} />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Help us understand how visitors use our site.</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.analytics ? 'bg-[#4e45e1]' : 'bg-gray-200'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.analytics ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div 
                      onClick={() => togglePreference('marketing')}
                      className={`p-6 rounded-[1.5rem] border cursor-pointer transition-all flex flex-col justify-between min-h-[160px] ${preferences.marketing ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${preferences.marketing ? 'text-[#4e45e1]' : 'text-gray-400'}`}>Marketing</span>
                          <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                            <div className="w-1 h-1 bg-current rounded-full" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Used to deliver more relevant advertisements.</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.marketing ? 'bg-[#4e45e1]' : 'bg-gray-200'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.marketing ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
                    >
                      <X size={14} />
                      Discard
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="px-10 py-3 rounded-full text-sm font-bold text-white bg-[#4e45e1] hover:bg-[#4139BF] shadow-lg shadow-indigo-100 transition-all transform hover:scale-105"
                    >
                      Save My Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Link */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                View our <Link to="/privacy" className="underline hover:text-[#4e45e1]">Privacy Policy</Link> and <Link to="/cookies" className="underline hover:text-[#4e45e1]">Cookie Policy</Link> for more information.
              </p>
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 transition-colors lg:hidden"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
  );
};

export default ModernCookieConsent;
