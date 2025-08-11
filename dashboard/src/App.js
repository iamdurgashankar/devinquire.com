import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import apiService from "./services/api";
import PageBuilder from "./components/PageBuilder";
import PageManager from "./components/PageManager";

function PageBuilderWrapper() {
  const { pageId } = useParams();
  return <PageBuilder pageId={pageId} />;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

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
        <Routes>
          {/* Dashboard routes */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            }
          />
          <Route
            path="/page-manager"
            element={
              <ErrorBoundary>
                <PageManager />
              </ErrorBoundary>
            }
          />
          <Route
            path="/page-builder/:pageId"
            element={
              <ErrorBoundary>
                <PageBuilderWrapper />
              </ErrorBoundary>
            }
          />
          <Route
            path="/page-builder"
            element={
              <ErrorBoundary>
                <PageBuilder />
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
            path="/register"
            element={
              <ErrorBoundary>
                <Register />
              </ErrorBoundary>
            }
          />
          {/* Redirect any other routes to dashboard home */}
          <Route path="*" element={<Admin />} />
        </Routes>
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
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}