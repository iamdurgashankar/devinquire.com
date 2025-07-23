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
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Login from "./pages/Login";
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
import PageBuilder from "./components/PageBuilder";
import PageManager from "./components/PageManager";

function PageBuilderWrapper() {
  const { pageId } = useParams();
  return <PageBuilder pageId={pageId} />;
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";
  const isRegisterPage = location.pathname === "/register";
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isAdminPage && <Navbar />}
      <div className="min-h-screen">
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
          <Route
            path="/register"
            element={
              <ErrorBoundary>
                <Register />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/page-manager"
            element={
              <ErrorBoundary>
                <PageManager />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/page-builder/:pageId"
            element={
              <ErrorBoundary>
                <PageBuilderWrapper />
              </ErrorBoundary>
            }
          />
          <Route path="/admin/page-builder" element={<PageBuilder />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
      </div>
      {!isAdminPage && !isRegisterPage && !isLoginPage && <Footer />}
    </>
  );
}

export default function App() {
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
