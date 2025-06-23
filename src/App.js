import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
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
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";
  const isRegisterPage = location.pathname === "/register";

  return (
    <>
      {!isAdminPage && !isRegisterPage && <Navbar />}
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
            path="/admin"
            element={
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
      {!isAdminPage && !isRegisterPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
