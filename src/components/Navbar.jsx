
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useTypingEffect from "../hooks/useTypingEffect";


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isOverHero, setIsOverHero] = useState(true);
  const [isLargeDevice, setIsLargeDevice] = useState(false);
  const prevScrollY = useRef(0);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { displayText, showCursor } = useTypingEffect("DevInquire", 150, 2000);
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = window.innerHeight; // Assuming hero section is full viewport height
      
      if (currentScrollY <= 0) {
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
      }
      
      // Check if navbar is over hero section (within first viewport height)
      setIsOverHero(currentScrollY < heroHeight * 0.8); // 80% of hero height for smooth transition
      
      setIsVisible(true); // Always visible (sticky)
    };
    
    const handleResize = () => {
      setIsLargeDevice(window.innerWidth > 768);
    };
    
    // Handle clicks outside mobile menu
    const handleClickOutside = (e) => {
      if (isMenuOpen && mobileMenuRef.current) {
        // Check if click is inside menu container
        const isInsideMenu = mobileMenuRef.current.contains(e.target);
        // Check if click is on menu button
        const isMenuButton = e.target.closest('.mobile-menu-button');
        // Check if click is on a Link (allow navigation to complete)
        const isLink = e.target.closest('a[href]') || e.target.closest('.mobile-nav-link');
        
        // Only close if clicking outside menu, not on button, and not on a link
        if (!isInsideMenu && !isMenuButton && !isLink) {
          setIsMenuOpen(false);
        }
      }
    };
    
    // Initial checks
    handleScroll();
    handleResize();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Add click outside listener for mobile menu
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 mobile-navbar
        ${isVisible ? 'nav-visible' : 'nav-hidden'}
        ${isHomePage && isLargeDevice && isOverHero && !isScrolled ? 'hero-transparent-navbar' : ''}
      `}
      style={{
        zIndex: 50,
      }}
    >
      <div
        className={`
          mx-auto transform-gpu mobile-navbar-inner
          ${isScrolled
            ? 'scrolled-navbar w-[95%] md:w-[94%] max-w-7xl glass-navbar mt-2 md:mt-4'
            : 'w-full'
          }
        `}
      >
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 navbar-content-container">
          <div className={`
            flex justify-between items-center navbar-height-container
            ${isScrolled ? 'h-scrolled' : 'h-normal'}
          `}>
            {/* Logo */}
            <div className="w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center space-x-3 group"
                onClick={() => setIsMenuOpen(false)}
              >
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 bg-[var(--primary)] shadow-lg relative overflow-hidden mobile-logo">
                  <div className="absolute inset-0 bg-white/20 opacity-50"></div>
                  <div className="relative z-10 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    <span className="text-white/80 mr-0.5 text-xs">&#123;</span>
                    <span className="text-white font-bold">DI</span>
                    <span className="text-white/80 ml-0.5 text-xs">&#125;</span>
                  </div>
                </div>
                <span className="font-semibold text-base sm:text-lg md:text-xl text-[var(--primary)] flex items-center min-w-0 mobile-brand-text">
                  <span className="truncate">{displayText}</span>
                  <span className={`ml-0.5 flex-shrink-0 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>|</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1">
              {/* Left spacer to balance the logo width */}
              <div className="w-[30px] lg:w-[50px] flex-shrink-0"></div>
              
              {/* Centered Navigation Links */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center space-x-3 lg:space-x-6">
                  {[
                    ['About', '/about'],
                    ['Services', '/services'],
                    ['Products', '/products'],
                    ['Blog', '/blog'],
                  ].map(([label, path]) => (
                    <Link 
                      key={path}
                      to={path} 
                      className={`nav-item px-2 md:px-3 lg:px-4 py-2 font-medium relative group text-sm md:text-base transition-colors duration-300 ease-out ${
                        isScrolled ? 'text-gray-700' : 'text-gray-600'
                      } hover:text-[var(--primary)]`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="relative z-10">{label}</span>
                      {/* Premium smooth underline effect */}
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--primary)] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Right side action buttons */}
              <div className="w-auto flex-shrink-0 flex justify-end items-center space-x-2 md:space-x-3 lg:space-x-4" style={{ pointerEvents: 'auto' }}>
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
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <Link 
                      to="/contact" 
                      className={`auth-button sign-in px-3 md:px-4 py-2 border-2 rounded-full font-medium transition-all duration-300 text-sm md:text-base whitespace-nowrap ${
                        isScrolled 
                          ? 'border-[var(--primary)] text-[var(--primary)] hover:border-[var(--primary-dark)] hover:text-white hover:bg-[var(--primary)]'
                          : 'border-[var(--primary)] text-[var(--primary)] bg-white/90 hover:bg-[var(--primary)] hover:text-white shadow-sm backdrop-blur-sm'
                      }`}
                    >
                      Get Started
                    </Link>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className="auth-button sign-up px-3 md:px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white shadow-sm whitespace-nowrap"
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
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl transition-all duration-300 ease-out focus:outline-none z-[70] relative transform-gpu mobile-menu-button ${
                  isScrolled 
                    ? 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md' 
                    : 'bg-white/90 hover:bg-white border border-gray-200 shadow-sm backdrop-blur-sm'
                }`}
                style={{
                  willChange: 'background-color, border-color, box-shadow, transform',
                  backfaceVisibility: 'hidden'
                }}
                aria-label="Toggle menu"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 relative flex items-center justify-center transform transition-all duration-300 ease-out mobile-hamburger">
                  <span className={`absolute h-0.5 w-5 md:w-6 transform transition-all duration-300 ease-out bg-gray-700 ${
                    isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                  }`} style={{ transformOrigin: 'center' }}></span>
                  <span className={`absolute h-0.5 w-5 md:w-6 transform transition-all duration-300 ease-out bg-gray-700 ${
                    isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`} style={{ transformOrigin: 'center' }}></span>
                  <span className={`absolute h-0.5 w-5 md:w-6 transform transition-all duration-300 ease-out bg-gray-700 ${
                    isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                  }`} style={{ transformOrigin: 'center' }}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div 
            ref={mobileMenuRef} 
            className={`md:hidden overflow-hidden transition-all duration-300 ease-out transform-gpu ${isMenuOpen ? 'max-h-screen opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`} 
            style={{ 
              pointerEvents: isMenuOpen ? 'auto' : 'none', 
              willChange: 'max-height, opacity, visibility', 
              position: 'relative', 
              zIndex: 60 
            }}
          >
            <div 
              className="px-3 md:px-4 pt-3 md:pt-4 pb-4 md:pb-6 space-y-2 md:space-y-3 bg-white/95 backdrop-blur-lg my-2 mx-2 md:mx-3 border border-gray-200 rounded-lg md:rounded-xl shadow-xl transition-all duration-300 ease-out transform-gpu mobile-nav-container" 
              style={{ 
                willChange: 'transform, opacity', 
                pointerEvents: 'auto', 
                position: 'relative', 
                zIndex: 60
              }}
            >
              {[
                ['About', '/about'],
                ['Services', '/services'],
                ['Products', '/products'],
                ['Blog', '/blog'],
              ].map(([label, path]) => (
                <Link 
                  key={path}
                  to={path} 
                  className="text-gray-700 hover:text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.05)] block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-300 ease-out border-b border-gray-100 last:border-b-0 transform-gpu hover:translate-x-1 mobile-nav-link"
                  style={{ 
                    willChange: 'background-color, color, transform', 
                    pointerEvents: 'auto', 
                    position: 'relative', 
                    zIndex: 61,
                    cursor: 'pointer',
                    display: 'block',
                    width: '100%',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    textDecoration: 'none'
                  }}
                  onClick={() => {
                    // Close menu - React Router Link will handle navigation
                    setIsMenuOpen(false);
                  }}
                >
                  {label}
                </Link>
              ))}

              {/* Mobile User Authentication */}
              <div className="pt-3 md:pt-4 border-t border-gray-200 mobile-auth-section" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61 }}>
                {currentUser ? (
                  <>
                    <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-lg mb-2 md:mb-3 mobile-user-info">
                      <div className="text-xs md:text-sm text-gray-600">Signed in as</div>
                      <div className="text-sm md:text-base text-gray-900 font-medium">{currentUser.displayName || currentUser.email}</div>
                      <div className="text-xs text-[var(--primary)]">{currentUser.role}</div>
                    </div>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className="bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] text-white block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-300 mb-2 mobile-auth-button"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61 }}
                      onClick={(e) => {
                        // Allow navigation to happen, then close menu
                        setIsMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </a>
                    {currentUser.role === 'admin' && (
                      <a 
                        href="https://dashboard.devinquire.com" 
                        className="bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] text-white block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-300 mb-2 mobile-auth-button"
                        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                        }}
                      >
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        // Allow logout to happen, then close menu
                        handleLogout();
                      }}
                      className="w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-200 mobile-auth-button"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61 }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/contact" 
                      className="border-2 border-[var(--primary)] text-[var(--primary)] hover:border-[var(--primary-dark)] hover:text-[var(--primary-dark)] hover:bg-[rgba(var(--primary-rgb),0.1)] bg-[rgba(var(--primary-rgb),0.05)] block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-200 mb-2 text-center shadow-sm mobile-auth-button"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61, cursor: 'pointer' }}
                      onClick={(e) => {
                        // Stop propagation to prevent overlay from handling the click
                        e.stopPropagation();
                        // Close menu after navigation
                        setIsMenuOpen(false);
                      }}
                    >
                      Get Started
                    </Link>
                    <a 
                      href="https://dashboard.devinquire.com" 
                      className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white block px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-300 mobile-auth-button"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 61 }}
                      onClick={(e) => {
                        // Allow navigation to happen, then close menu
                        setIsMenuOpen(false);
                      }}
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
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen(false);
          }}
        />
      )}
    </nav>
  );
}
