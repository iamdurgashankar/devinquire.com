import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ModernCookieConsent from "./components/ModernCookieConsent";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import { ThemeProvider } from "./contexts/ThemeContext";
import SupportAgent from "./components/SupportAgent";
import QuotationView from "./pages/QuotationView";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

function AppContent() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/quotation/")) {
    return (
      <Routes>
        <Route path="/quotation/:slug" element={<QuotationView />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--apple-text-primary)] relative selection:bg-[#4e45e1]/20 selection:text-[var(--apple-blue)]">
      <ScrollToTop />
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Ambient Apple System Wallpaper Mesh Glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-[#4e45e1]/[0.07] dark:bg-[#4e45e1]/[0.14] blur-[110px]" />
        <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-[#AF52DE]/[0.05] dark:bg-[#BF5AF2]/[0.1] blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-[#6B63F2]/[0.06] dark:bg-[#6B63F2]/[0.12] blur-[130px]" />
      </div>

      <header role="banner" className="relative z-50">
        <Navbar />
      </header>

      <main
        id="main-content"
        role="main"
        className="flex-1 min-h-screen relative z-10"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/about"
            element={
              <ErrorBoundary>
                <About />
              </ErrorBoundary>
            }
          />
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/contact"
            element={
              <ErrorBoundary>
                <Contact />
              </ErrorBoundary>
            }
          />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
      </main>

      <footer role="contentinfo" className="relative z-20">
        <Footer />
        <ModernCookieConsent />
      </footer>
    </div>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isStandaloneQuotation = pathname.startsWith("/quotation/");
  return (
    <>
      <AppContent />
      {!isStandaloneQuotation && <SupportAgent />}
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider initialTheme="light">
        <AuthProvider>
          <Router>
            <AppShell />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
