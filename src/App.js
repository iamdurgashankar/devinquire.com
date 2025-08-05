import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
// Admin, Register, and Login are now handled by dashboard subdomain
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import { ThemeProvider } from "./contexts/ThemeContext";
import apiService from "./services/api";
import React from "react";
import SupportAgent from "./components/SupportAgent";
// Dashboard components removed - handled by separate dashboard app

// PageBuilder functionality moved to dashboard

function AppContent() {
  const location = useLocation();
  // Admin, register, and login pages are handled by dashboard subdomain

  return (
    <div className="dynamic-bg">
      <div className="gradient-orb orb-1" style={{ top: "10%", left: "5%" }} />
      <div
        className="gradient-orb orb-2"
        style={{ top: "60%", right: "10%" }}
      />
      <div
        className="gradient-orb orb-3"
        style={{ top: "30%", right: "30%" }}
      />
      <Navbar />
      <div className="min-h-screen relative z-10">
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
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  // Main website app - dashboard is separate
  const [initialTheme, setInitialTheme] = React.useState("system");
  React.useEffect(() => {
    // Try to load theme from user preferences if logged in
    async function loadThemePref() {
      try {
        const user = await apiService.getCurrentUser();
        if (user) {
          const prefs = await apiService.getUserPreferences(user.id);
          if (prefs.success && prefs.preferences && prefs.preferences.theme) {
            setInitialTheme(prefs.preferences.theme);
          }
        }
      } catch (e) {}
    }
    loadThemePref();
  }, []);
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AuthProvider>
        <Router>
          <AppContent />
          <SupportAgent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
