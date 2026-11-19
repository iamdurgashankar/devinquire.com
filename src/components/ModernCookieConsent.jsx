import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, ShieldCheck, Info } from "lucide-react";
import { Link } from "react-router-dom";

const ModernCookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem("devinquire_cookie_consent");
    if (!storedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consent) => {
    localStorage.setItem("devinquire_cookie_consent", JSON.stringify(consent));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const togglePreference = (type) => {
    if (type === "essential") return;
    setPreferences((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSavePreferences = () => {
    saveConsent({
      ...preferences,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-5 left-4 right-4 z-[9999] flex justify-center pointer-events-none"
        >
          <motion.div
            layout
            className="w-full max-w-3xl apple-glass rounded-[24px] p-5 sm:p-6 pointer-events-auto relative"
          >
            <div
              className={`flex flex-col ${
                !showSettings ? "md:flex-row md:items-center" : ""
              } gap-5`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="w-10 h-10 rounded-[12px] bg-[#4e45e1]/12 text-[var(--apple-blue)] flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-[var(--apple-text-primary)] mb-1">
                    Privacy & Cookie Preferences
                  </h3>
                  <p className="text-[13px] text-[var(--apple-text-secondary)] leading-relaxed">
                    We use cookies to deliver a seamless Apple-grade browsing experience and analyze site performance.{" "}
                    <Link
                      to="/cookie-policy"
                      className="text-[var(--apple-blue)] font-medium hover:underline"
                    >
                      Learn more
                    </Link>
                  </p>
                </div>
                {showSettings && (
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-7 h-7 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-secondary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!showSettings ? (
                <div className="apple-btn-pair flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-3.5 py-2 rounded-full apple-subcard text-[12px] font-medium text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)] inline-flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 rounded-full apple-secondary-btn text-[12px] font-semibold"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-5 py-2 rounded-full apple-pill-btn text-[12px] font-semibold"
                  >
                    Accept All
                  </button>
                </div>
              ) : (
                <div className="w-full pt-4 border-t border-[var(--apple-border)] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-[16px] apple-subcard flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-[var(--apple-text-primary)]">
                            Essential
                          </span>
                          <ShieldCheck className="w-4 h-4 text-[#28CD41]" />
                        </div>
                        <p className="text-[11px] text-[var(--apple-text-tertiary)]">
                          Required for core site security and navigation.
                        </p>
                      </div>
                      <span className="mt-3 text-[10px] font-semibold text-[#28CD41] uppercase tracking-wider">
                        Always Active
                      </span>
                    </div>

                    <div
                      onClick={() => togglePreference("analytics")}
                      className="p-4 rounded-[16px] apple-subcard cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-[var(--apple-text-primary)]">
                            Analytics
                          </span>
                          <Info className="w-4 h-4 text-[var(--apple-blue)]" />
                        </div>
                        <p className="text-[11px] text-[var(--apple-text-tertiary)]">
                          Helps us measure and improve site speed and usability.
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            preferences.analytics
                              ? "bg-[#28CD41]"
                              : "bg-[var(--apple-border-strong)]"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                              preferences.analytics ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => togglePreference("marketing")}
                      className="p-4 rounded-[16px] apple-subcard cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-[var(--apple-text-primary)]">
                            Personalization
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--apple-text-tertiary)]">
                          Tailors content recommendations and product updates.
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            preferences.marketing
                              ? "bg-[#28CD41]"
                              : "bg-[var(--apple-border-strong)]"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                              preferences.marketing ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-2 rounded-full apple-secondary-btn text-[12px] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="px-5 py-2 rounded-full apple-pill-btn text-[12px] font-semibold"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModernCookieConsent;
