
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useTypingEffect from "../hooks/useTypingEffect";


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollY = useRef(0);
  const { currentUser, logout } = useAuth();
  const { displayText, showCursor } = useTypingEffect("DevInquire", 150, 2000);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 0) {
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
      }
      setIsVisible(true); // Always visible (sticky)
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        translate-y-0
      `}
      style={{
        willChange: 'transform',
      }}
    >
      <div
        className={`
          mx-auto transition-all duration-300 ease-in-out
          ${isScrolled
            ? 'w-[94%] max-w-7xl glass-navbar backdrop-blur-md bg-white/70 shadow-lg rounded-2xl border border-white/20 mt-4'
            : 'w-full bg-transparent'
          }
        `}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 transition-all duration-500">
          <div className={`
            flex justify-between items-center transition-all duration-500
            ${isScrolled ? 'h-14' : 'h-20'}
          `}>
            {/* Logo */}
            <div className="w-[200px] flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center space-x-3 group"
                onClick={() => setIsMenuOpen(false)}
              >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 bg-[#0077b6] shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 opacity-50"></div>
                  <div className="relative z-10 flex items-center justify-center text-white font-bold text-sm">
                    <span className="text-white/80 mr-0.5 text-xs">&#123;</span>
                    <span className="text-white font-bold">DI</span>
                    <span className="text-white/80 ml-0.5 text-xs">&#125;</span>
                  </div>
                </div>
                                <span className="font-semibold text-lg text-[#0077b6] flex items-center min-w-0">
                  <span className="truncate">{displayText}</span>
                  <span className={`ml-0.5 flex-shrink-0 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>|</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1">
              {/* Left spacer to balance the logo width */}
              <div className="w-[50px] flex-shrink-0"></div>
              
              {/* Centered Navigation Links */}
              <div className="flex-1 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
                <div className="flex items-center space-x-4 lg:space-x-6" style={{ pointerEvents: 'auto' }}>
                  {[
                    ['About', '/about'],
                    ['Services', '/services'],
                    ['Products', '/products'],
                    ['Blog', '/blog'],
                  ].map(([label, path]) => (
                    <Link 
                      key={path}
                      to={path} 
                      className={`px-3 lg:px-4 py-2 font-medium transition-all duration-300 relative group text-sm lg:text-base ${
                                                isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-[var(--neutral-500)] hover:text-[var(--primary)]'
                      }`}
                      style={{ pointerEvents: 'auto' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{label}</span>
                      {isScrolled && (
                                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0077b6] transition-all duration-300 group-hover:w-full"></span>
                        )}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Right side action buttons */}
              <div className="w-50 flex-shrink-0 flex justify-end items-center space-x-3 lg:space-x-4" style={{ pointerEvents: 'auto' }}>
                {/* User Authentication */}
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsProfileOpen(!isProfileOpen);
                        } else if (e.key === 'Escape') {
                          setIsProfileOpen(false);
                        }
                      }}
                      className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                        isScrolled 
                          ? 'bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] hover:from-[var(--primary-dark)] hover:to-[var(--secondary-dark)]'
                          : 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:from-[var(--primary-dark)] hover:to-[var(--secondary-dark)]'
                      } text-white`}
                      aria-expanded={isProfileOpen}
                      aria-haspopup="menu"
                      aria-label="User profile menu"
                    >
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-[var(--primary)] font-bold text-xs lg:text-sm">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span className="text-sm lg:text-base hidden lg:block">{currentUser.displayName || currentUser.email}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-72 glass-card py-1 z-[60] transform transition-all duration-300 ease-out rounded-xl shadow-lg">
                      <div className="px-4 py-3 border-b border-gray-200/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] flex items-center justify-center text-xl text-white font-semibold">
                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{currentUser.displayName || 'User'}</div>
                            <div className="text-sm text-gray-500">{currentUser.email}</div>
                            <div className="text-xs text-[var(--primary)] font-medium uppercase tracking-wider mt-1">{currentUser.role}</div>
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-2">
                        <a
                          href="https://dashboard.devinquire.com"
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/20 transition-all duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>Dashboard</span>
                        </a>
                        {currentUser.role === 'admin' && (
                          <a
                            href="https://dashboard.devinquire.com"
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/20 transition-all duration-300"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Admin Panel</span>
                          </a>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50/20 transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 lg:space-x-4">
                    <Link 
                      to="/contact" 
                      className={`px-3 lg:px-4 py-2 border-2 rounded-full font-medium transition-all duration-300 text-sm lg:text-base ${
                        isScrolled 
                          ? 'border-[#0077b6] text-[#0077b6] hover:border-[#005a8a] hover:text-[#005a8a] hover:bg-[#0077b6]/5'
                          : 'border-gray-900 text-gray-900 bg-white/95 hover:bg-white hover:border-gray-700 shadow-sm backdrop-blur-sm'
                      }`}
                    >
                      Get Started
                    </Link>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className={`px-3 lg:px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm lg:text-base ${
                        isScrolled
                          ? 'bg-[#0077b6] hover:bg-[#005a8a]'
                          : 'bg-[#0077b6] hover:bg-[#005a8a]'
                      } text-white`}
                    >
                      Dashboard
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden" style={{ pointerEvents: 'auto' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 focus:outline-none z-[70] relative ${
                  isScrolled 
                    ? 'bg-white hover:bg-gray-50 border border-gray-300 shadow-sm' 
                    : 'bg-gray-900/80 hover:bg-gray-900/90 backdrop-blur-sm border border-gray-700'
                }`}
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 relative flex items-center justify-center transform transition-all duration-300">
                  <span className={`absolute h-0.5 w-6 transform transition-all duration-300 ${
                    isScrolled ? 'bg-gray-700' : 'bg-white'
                  } ${isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`}></span>
                  <span className={`absolute h-0.5 w-6 transform transition-all duration-300 ${
                    isScrolled ? 'bg-gray-700' : 'bg-white'
                  } ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`absolute h-0.5 w-6 transform transition-all duration-300 ${
                    isScrolled ? 'bg-gray-700' : 'bg-white'
                  } ${isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out z-[60] relative ${isMenuOpen ? 'max-h-screen opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`} style={{ pointerEvents: 'auto' }}>
            <div className="px-4 pt-4 pb-6 space-y-3 bg-white/98 backdrop-blur-lg my-2 mx-2 border border-gray-200 rounded-xl shadow-2xl">
              {[
                ['About', '/about'],
                ['Services', '/services'],
                ['Products', '/products'],
                ['Blog', '/blog'],
              ].map(([label, path]) => (
                <Link 
                  key={path}
                  to={path} 
                  className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 border-b border-gray-100 last:border-b-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}

              {/* Mobile User Authentication */}
              <div className="pt-4 border-t border-gray-200">
                {currentUser ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg mb-3">
                      <div className="text-sm text-gray-600">Signed in as</div>
                      <div className="text-gray-900 font-medium">{currentUser.displayName || currentUser.email}</div>
                      <div className="text-xs text-[var(--primary)]">{currentUser.role}</div>
                    </div>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className="bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] text-white block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                    {currentUser.role === 'admin' && (
                      <a 
                        href="https://dashboard.devinquire.com" 
                        className="bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] text-white block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/contact" 
                      className="border-2 border-[#0077b6] text-[#0077b6] hover:border-[#005a8a] hover:text-[#005a8a] hover:bg-[#0077b6]/10 bg-[#0077b6]/5 block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 mb-2 text-center shadow-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className="bg-[#0077b6] hover:bg-[#005a8a] text-white block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isMenuOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
}
