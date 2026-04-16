import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useParams,
} from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
// Admin, Register, and Login are now handled by dashboard subdomain
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ModernCookieConsent from "./components/ModernCookieConsent";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import { ThemeProvider } from "./contexts/ThemeContext";
// API service removed - using PHP backend directly
import SupportAgent from "./components/SupportAgent";
// Dashboard components removed - handled by separate dashboard app



// PageBuilder functionality moved to dashboard

function AppContent() {
  const location = useLocation();
  // Admin, register, and login pages are handled by dashboard subdomain

  return (
    <div className="dynamic-bg bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div className="gradient-orb orb-1" style={{ top: "10%", left: "5%" }} aria-hidden="true" />
      <div
        className="gradient-orb orb-2"
        style={{ top: "60%", right: "10%" }}
        aria-hidden="true"
      />
      <div
        className="gradient-orb orb-3"
        style={{ top: "30%", right: "30%" }}
        aria-hidden="true"
      />
      
      <header role="banner">
        <Navbar />
      </header>
      
      <main id="main-content" role="main" className="min-h-screen relative z-10">
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
          {/* Admin routes removed - handled by dashboard.devinquire.com */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
      </main>
      
      <footer role="contentinfo">
        <Footer />
        <ModernCookieConsent />
      </footer>
    </div>
  );
}

export default function App() {
  // Main website app - dashboard is separate
  const [initialTheme, setInitialTheme] = React.useState("system");
  React.useEffect(() => {
    // Theme preferences will use system default for now
    // TODO: Implement theme preferences with your chosen backend
    setInitialTheme("system");
  }, []);
  return (
    <HelmetProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider>
          <Router>
            <AppContent />
            <SupportAgent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
