import React, { useState } from 'react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import { User, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const response = await signUp(fullName, formData.email, formData.password, formData.confirmPassword);
      if (response.success) {
        setMessage('Registration successful! Your account is pending approval.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join DevInquire to start creating and managing content."
      type="register"
    >
      <div className="space-y-6">

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex gap-3 text-sm border border-emerald-100"
            >
              <CheckCircle size={20} className="flex-shrink-0" />
              <p>{message}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-red-50 text-red-600 rounded-2xl flex gap-3 text-sm border border-red-100"
            >
              <AlertCircle size={20} className="flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-neutral-900 placeholder-neutral-400 font-medium shadow-sm"
                  placeholder="First Name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-neutral-900 placeholder-neutral-400 font-medium shadow-sm"
                  placeholder="Last Name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-neutral-900 placeholder-neutral-400 font-medium shadow-sm"
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-neutral-900 placeholder-neutral-400 font-medium shadow-sm"
                  placeholder="Create Password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-neutral-900 placeholder-neutral-400 font-medium shadow-sm"
                  placeholder="Confirm Password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 mt-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold rounded-full shadow-lg shadow-sky-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-neutral-400 font-medium">or</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          onClick={() => handleOAuthError('Google sign up not implemented yet')}
          className="w-full py-4 px-6 bg-white border border-neutral-200 text-neutral-700 font-semibold rounded-full hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Signup with Google
        </button>

        <p className="text-center text-neutral-500 font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}