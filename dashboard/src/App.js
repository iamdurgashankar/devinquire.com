import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EnhancedAuthProvider, useAuth } from "./contexts/EnhancedAuthContext";
import { GoogleCallback, GitHubCallback } from "./components/OAuthCallback";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";
import AdminSetup from "./components/AdminSetup";
import AuthTroubleshooter from "./components/AuthTroubleshooter";
import { ThemeProvider } from "./contexts/ThemeContext";
import apiService from "./services/api";
import PageManager from "./components/PageManager";
import "./utils/createAdminUser"; // Make createAdminUser available globally
import "./utils/cleanupAdminData"; // Make cleanupAdminData available globally
import AdminBypassTester from "./utils/testAdminBypass";

// Initialize admin bypass testing in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development Mode: Admin Bypass Testing Enabled');
}



function AppContent() {
  const location = useLocation();
  const { loading, currentUser } = useAuth();
  const isLoginPage = location.pathname === "/login";

  // Show loading screen while authentication is initializing
  if (loading) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  return (
    <div className="dynamic-bg">
      {/* Background orbs for dashboard */}
      <div className="gradient-orb orb-1" style={{ top: "10%", left: "5%" }} />
      <div
        className="gradient-orb orb-2"
        style={{ top: "60%", right: "10%" }}
      />
      <div
        className="gradient-orb orb-3"
        style={{ top: "30%", right: "30%" }}
      />

      <div className="min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Main login route - unified entry point */}
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                </motion.div>
              }
            />
            <Route
              path="/login"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                </motion.div>
              }
            />
            <Route
              path="/register"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <Register />
                  </ErrorBoundary>
                </motion.div>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <ForgotPassword />
                  </ErrorBoundary>
                </motion.div>
              }
            />

            {/* Dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </motion.div>
              }
            />

            {/* Legacy admin route - redirect to dashboard */}
            <Route
              path="/admin"
              element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </motion.div>
              }
            />

            {/* ... other routes similarly wrapped ... */}
            <Route
              path="/page-manager"
              element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorBoundary>
                    <PageManager />
                  </ErrorBoundary>
                </motion.div>
              }
            />

            <Route path="*" element={<Login />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
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
      } catch (e) {
        // Silently handle errors
      }
    }
    loadThemePref();
  }, []);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <EnhancedAuthProvider>
        <Router>
          <AppContent />
        </Router>
      </EnhancedAuthProvider>
    </ThemeProvider>
  );
}
