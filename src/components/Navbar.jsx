import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  // Always floating, fixed, rounded, glass style

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav
      style={{
        background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(168,85,247,0.7) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        color: '#fff',
      }}
      className="fixed z-50 overflow-hidden left-1/2 transform -translate-x-1/2 w-[98vw] max-w-6xl top-2 rounded-2xl shadow-2xl transition-all duration-700"
    >
        <div className="w-full max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 brand-logo">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DevInquire
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                About
              </Link>
              <Link 
                to="/services" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Services
              </Link>
              <Link 
                to="/blog" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Blog
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Contact
              </Link>
              
              {/* User Authentication */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105"
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{currentUser.displayName || 'User'}</div>
                        <div className="text-gray-500">{currentUser.email}</div>
                        <div className="text-xs text-blue-600 font-medium">{currentUser.role}</div>
                      </div>
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Dashboard Panel
                      </Link>
                      {currentUser.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6 0%, #a21caf 100%)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)'}
                    onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #a21caf 100%)'}
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
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg mt-2">
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  to="/services" 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  to="/blog" 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                
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
                      Dashboard Panel
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
                      className="block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 register-btn"
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #a21caf 100%)',
                        color: '#fff',
                        border: 'none',
                        boxShadow: 'none',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)'}
                      onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #a21caf 100%)'}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
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