import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X, ArrowUpRight, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import useTypingEffect from "../hooks/useTypingEffect";

const NAV_LINKS = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Products", "/products"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { displayText, showCursor } = useTypingEffect("DevInquire", 150, 2000);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    const handleClickOutside = (e) => {
      if (isMenuOpen && mobileMenuRef.current) {
        const isInsideMenu = mobileMenuRef.current.contains(e.target);
        const isMenuButton = e.target.closest(".mobile-menu-button");
        const isLink = e.target.closest("a[href]");
        if (!isInsideMenu && !isMenuButton && !isLink) {
          setIsMenuOpen(false);
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const isRouteActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 select-none"
      aria-label="Main navigation"
    >
      <div
        className={`mx-auto transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? "w-[95%] md:w-[92%] max-w-6xl mt-3 apple-glass rounded-full px-4 sm:px-6 py-2.5"
            : "w-full apple-glass-header px-4 sm:px-6 lg:px-10 py-3.5"
        }`}
      >
        <div className="relative max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Apple Identity Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group shrink-0"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_rgba(78,69,225,0.35)] relative overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <div className="relative z-10 flex items-center justify-center text-white font-bold text-[12px] tracking-tight badge-white">
                <span className="text-white/80 mr-0.5 text-[11px] badge-white">&#123;</span>
                <span className="text-white font-bold badge-white">DI</span>
                <span className="text-white/80 ml-0.5 text-[11px] badge-white">&#125;</span>
              </div>
            </div>
            <span className="relative inline-flex items-center font-semibold text-[16px] tracking-tight text-[var(--apple-text-primary)] leading-none">
              <span className="invisible select-none" aria-hidden="true">
                DevInquire|
              </span>
              <span className="absolute inset-0 flex items-center">
                <span>{displayText}</span>
                <span
                  className={`ml-0.5 text-[var(--apple-blue)] ${
                    showCursor ? "opacity-100" : "opacity-0"
                  } transition-opacity duration-100`}
                >
                  |
                </span>
              </span>
            </span>
          </Link>

          {/* Desktop Segmented Pill Navigation */}
          <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1 p-1 rounded-full apple-subcard">
            {NAV_LINKS.map(([label, path]) => {
              const active = isRouteActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[var(--apple-blue)] text-white shadow-sm badge-white"
                      : "text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)] hover:bg-[var(--apple-surface-subcard-hover)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Apple Appearance Toggle (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle appearance mode"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full apple-subcard text-[12px] font-medium text-[var(--apple-text-primary)] active:scale-95 transition-all"
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#5856D6]" />
                  <span className="hidden lg:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#FF9F0A]" />
                  <span className="hidden lg:inline">Light</span>
                </>
              )}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full apple-pill-btn text-[13px] font-medium"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold badge-white">
                    {currentUser.displayName
                      ? currentUser.displayName.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <span className="hidden lg:inline badge-white">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 apple-glass rounded-[20px] p-2 z-[60]">
                    <div className="px-3 py-2.5 border-b border-[var(--apple-border)] mb-1">
                      <div className="font-semibold text-[13px] text-[var(--apple-text-primary)] truncate">
                        {currentUser.displayName || "User"}
                      </div>
                      <div className="text-[11px] text-[var(--apple-text-tertiary)] truncate">
                        {currentUser.email}
                      </div>
                    </div>
                    <a
                      href="https://dashboard.devinquire.com"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[11px] text-[13px] text-[var(--apple-text-primary)] hover:bg-[var(--apple-surface-subcard-hover)] transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--apple-blue)]" />
                      <span>Command Dashboard</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[11px] text-[13px] text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/contact"
                  className="px-4 py-1.5 rounded-full apple-secondary-btn text-[13px] font-medium whitespace-nowrap"
                >
                  Get Started
                </Link>
                <a
                  href="https://dashboard.devinquire.com"
                  className="px-4 py-1.5 rounded-full apple-pill-btn text-[13px] font-medium inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span className="badge-white">Dashboard</span>
                  <ArrowUpRight className="w-3.5 h-3.5 badge-white" />
                </a>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle appearance mode"
              className="w-9 h-9 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-primary)]"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[#5856D6]" />
              ) : (
                <Sun className="w-4 h-4 text-[#FF9F0A]" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-9 h-9 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-primary)] mobile-menu-button"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Sheet Navigation */}
        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden mt-3 pt-3 border-t border-[var(--apple-border)] animate-fade-in"
          >
            <div className="space-y-1">
              {NAV_LINKS.map(([label, path]) => {
                const active = isRouteActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-[14px] font-medium transition-all ${
                      active
                        ? "bg-[var(--apple-blue)] text-white badge-white"
                        : "text-[var(--apple-text-primary)] hover:bg-[var(--apple-surface-subcard-hover)]"
                    }`}
                  >
                    <span className={active ? "badge-white" : ""}>{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--apple-border)] flex flex-col gap-2">
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-[12px] apple-secondary-btn text-center text-[13px] font-semibold"
              >
                Get Started
              </Link>
              <a
                href="https://dashboard.devinquire.com"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-[12px] apple-pill-btn text-center text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <span className="badge-white">Open Dashboard</span>
                <ArrowUpRight className="w-4 h-4 badge-white" />
              </a>
            </div>
          </div>
        )}
      </div>

      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </nav>
  );
}
