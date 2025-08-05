import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollY = useRef(0);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50;
      
      // Determine if we should show the navbar
      if (currentScrollY < scrollThreshold) {
        // At the top of the page
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        // Determine scroll direction
        const isScrollingDown = currentScrollY > prevScrollY.current;
        const scrollDifference = Math.abs(currentScrollY - prevScrollY.current);
        
        // Only update if scroll difference is significant
        if (scrollDifference > 10) {
          setIsVisible(!isScrollingDown);
          setIsScrolled(true);
        }
      }
      
      prevScrollY.current = currentScrollY;
    };

    // Debounced scroll handler
    let timeout;
    const debouncedScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => handleScroll(), 10);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeout);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
      ${!isVisible ? '-translate-y-full' : 'translate-y-0'}
    `}>
      <div className={`
        mx-auto transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'w-[94%] max-w-7xl glass-navbar backdrop-blur-md bg-white/70 shadow-lg rounded-2xl border border-white/20 mt-4' 
          : 'w-full bg-transparent'
        }
      `}>
        <div className="px-4 sm:px-6 lg:px-8 transition-all duration-500">
          <div className={`
            flex justify-between items-center transition-all duration-500
            ${isScrolled ? 'h-14' : 'h-20'}
          `}>
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 bg-[#4169e1]">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-[#4169e1] to-[#9c27b0] bg-clip-text text-transparent">
                DevInquire
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation Links */}
              {[
                ['Home', '/'],
                ['About', '/about'],
                ['Services', '/services'],
                ['Blog', '/blog'],
                ['Contact', '/contact'],
              ].map(([label, path]) => (
                <Link 
                  key={path}
                  to={path} 
                  className={`px-4 py-2 font-medium transition-all duration-300 relative group ${
                    isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-[#6B7280] hover:text-[#4169e1]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{label}</span>
                  {isScrolled && (
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
                  )}
                </Link>
              ))}

              {/* User Authentication */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                        : 'bg-[#4169e1] hover:bg-[#3154b4]'
                    } text-white`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span>{currentUser.displayName || currentUser.email}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-72 glass-card py-1 z-50 transform transition-all duration-300 ease-out rounded-xl shadow-lg">
                      <div className="px-4 py-3 border-b border-gray-200/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xl text-white font-semibold">
                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{currentUser.displayName || 'User'}</div>
                            <div className="text-sm text-gray-500">{currentUser.email}</div>
                            <div className="text-xs text-blue-600 font-medium uppercase tracking-wider mt-1">{currentUser.role}</div>
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-2">
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/20 transition-all duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>Dashboard</span>
                        </Link>
                        {currentUser.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/20 transition-all duration-300"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Admin Panel</span>
                          </Link>
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
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className={`px-4 py-2 font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900'
                        : 'text-[#4169e1] hover:text-[#3154b4]'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                      isScrolled
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                        : 'bg-[#4169e1] hover:bg-[#3154b4]'
                    } text-white`}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 focus:outline-none"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 relative transform transition-all duration-300">
                  <span className={`absolute h-0.5 w-6 bg-gray-700 transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2.5' : '-translate-y-2'}`} />
                  <span className={`absolute h-0.5 w-6 bg-gray-700 transform transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                  <span className={`absolute h-0.5 w-6 bg-gray-700 transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 translate-y-2.5' : 'translate-y-2'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass-card my-2 border border-white/10 rounded-xl">
              {[
                ['Home', '/'],
                ['About', '/about'],
                ['Services', '/services'],
                ['Blog', '/blog'],
                ['Contact', '/contact'],
              ].map(([label, path]) => (
                <Link 
                  key={path}
                  to={path} 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}

              {/* Mobile User Authentication */}
              {currentUser ? (
                <>
                  <div className="px-3 py-2 border-t border-gray-700">
                    <div className="text-sm text-gray-400">Signed in as</div>
                    <div className="text-white font-medium">{currentUser.displayName || currentUser.email}</div>
                    <div className="text-xs text-blue-400">{currentUser.role}</div>
                  </div>
                  <Link 
                    to="/admin" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsProfileOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
}
