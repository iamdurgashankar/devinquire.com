import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';

export default function Admin() {
  const { currentUser, signInWithEmail, signUp, changePassword, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResetOption, setShowResetOption] = useState(false);

  useEffect(() => {
  // If user is already logged in, show dashboard
  if (currentUser) {
      return;
  }
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await signInWithEmail(email, password);
      if (response.success) {
        setCurrentUser(response.user);
      }
    } catch (error) {
      setError(error.message);
      setShowResetOption(true); // Show reset option when login fails
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await signUp(name, email, password, confirmPassword);
      if (response.success) {
        setMessage('Registration successful! Your account is pending admin approval. You will receive an email notification once approved.');
        setMode('login');
        setEmail('');
        setPassword('');
        setName('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      setMessage('Password changed successfully! You can now login with your new password.');
      setMode('login');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setShowResetOption(false);
    // Clear form data
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // If user is logged in, show dashboard
  if (currentUser) {
    return <AdminDashboard />;
  }

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <form className="space-y-4" onSubmit={handleLogin}>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-white placeholder-gray-300 shadow-lg text-sm"
              placeholder="Email address"
            />
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-white placeholder-gray-300 shadow-lg text-sm"
              placeholder="Password"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        );

      case 'reset':
        return (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); /* Add reset logic */ }}>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 text-white placeholder-gray-300 shadow-lg text-sm"
              placeholder="Email address"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Sending reset link..." : "Reset Password"}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  // Render the redesigned login interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Nodes */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>

        {/* Circuit Lines */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gradient-to-r from-transparent via-blue-400 to-transparent h-px animate-pulse"
              style={{
                left: `${Math.random() * 80}%`,
                top: `${Math.random() * 100}%`,
                width: `${100 + Math.random() * 200}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="flex min-h-screen relative z-20">
        {/* Left Side - Login/Register Options */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 relative">
          {/* Left Column Circuit Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/60 to-transparent backdrop-blur-sm"></div>
          
          <div className="max-w-md w-full space-y-8 relative z-10">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-2xl font-bold">D</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  DevInquire
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Access Your Dashboard
              </h2>
              <p className="text-blue-200">
                Choose your access level to get started
              </p>
            </div>

            {/* Login/Register Options */}
            <div className="space-y-4">
              <button
                onClick={() => setMode('login')}
                className={`block w-full py-4 px-6 text-center font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'border-2 border-blue-500 hover:bg-blue-500/20 text-blue-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="block w-full py-4 px-6 text-center font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 border-2 border-green-500 hover:bg-green-500/20 text-green-400 hover:text-white"
              >
                Create Account
              </button>
              
              <button
                onClick={() => setMode('reset')}
                className={`block w-full py-4 px-6 text-center font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  mode === 'reset'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'border-2 border-purple-500 hover:bg-purple-500/20 text-purple-400 hover:text-white'
                }`}
              >
                Reset Password
              </button>
            </div>

            {/* Quick Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h3 className="text-lg font-medium text-white mb-4">
                {mode === 'login' ? 'Quick Login' : 'Reset Password'}
              </h3>
              
              {/* Error/Message Display */}
              {error && (
                <div className="mb-6 p-5 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {message && (
                <div className="mb-6 p-5 bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-200 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {renderForm()}
            </div>
          </div>
        </div>
        
        {/* Right Side - Dashboard Features Description */}
         <div className="flex-1 flex items-center justify-center px-8 lg:px-16 relative">
           {/* Right Column Circuit Overlay */}
           <div className="absolute inset-0 bg-gradient-to-l from-slate-900/80 via-indigo-900/60 to-transparent backdrop-blur-sm"></div>
           
           <div className="max-w-lg w-full relative z-10">

            
            {/* Feature Descriptions */}
             <div className="space-y-6">
               <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                 <div className="flex items-start space-x-4">
                   <div className="text-2xl">📊</div>
                   <div>
                     <h4 className="text-xl font-semibold text-white mb-2">
                       Advanced Analytics
                     </h4>
                     <p className="text-gray-300 text-sm leading-relaxed">
                       Get real-time insights with comprehensive analytics dashboards. Track user engagement, content performance, and system metrics with interactive charts and detailed reports.
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-6 rounded-xl border border-green-500/30 backdrop-blur-sm">
                 <div className="flex items-start space-x-4">
                   <div className="text-2xl">📝</div>
                   <div>
                     <h4 className="text-xl font-semibold text-white mb-2">
                       Content Management
                     </h4>
                     <p className="text-gray-300 text-sm leading-relaxed">
                       Create, edit, and organize your content with our intuitive editor. Support for rich text, media uploads, categories, and scheduling. Collaborate with team members seamlessly.
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                 <div className="flex items-start space-x-4">
                   <div className="text-2xl">👥</div>
                   <div>
                     <h4 className="text-xl font-semibold text-white mb-2">
                       User Management
                     </h4>
                     <p className="text-gray-300 text-sm leading-relaxed">
                       Manage users, roles, and permissions with granular control. Set up approval workflows, monitor user activity, and maintain security with advanced access controls.
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
                 <div className="flex items-start space-x-4">
                   <div className="text-2xl">🔧</div>
                   <div>
                     <h4 className="text-xl font-semibold text-white mb-2">
                       System Administration
                     </h4>
                     <p className="text-gray-300 text-sm leading-relaxed">
                       Configure system settings, manage integrations, and monitor performance. Built-in backup solutions, security monitoring, and automated maintenance tools.
                     </p>
                   </div>
                 </div>
               </div>
             </div>
            

          </div>
        </div>
      </div>
    </div>
  );
}