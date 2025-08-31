import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { subscribeToNewsletter } from '../services/emailService';

const SubscriptionForm = ({ 
  title = "Stay Updated", 
  subtitle = "Get the latest insights and tutorials delivered to your inbox.",
  placeholder = "Enter your email address",
  buttonText = "Subscribe",
  className = "",
  variant = "default", // default, compact, inline
  showCategories = false,
  categories = ['general', 'tutorials', 'updates']
}) => {
  const [formData, setFormData] = useState({
    email: '',
    selectedCategories: ['general']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Rate limiting check
  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('newsletter_attempts') || '[]');
    const recentAttempts = attempts.filter(time => now - time < 300000); // 5 minutes
    
    if (recentAttempts.length >= 3) {
      return {
        allowed: false,
        resetTime: new Date(recentAttempts[0] + 300000)
      };
    }
    
    recentAttempts.push(now);
    localStorage.setItem('newsletter_attempts', JSON.stringify(recentAttempts));
    return { allowed: true };
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (showCategories && formData.selectedCategories.length === 0) {
      errors.categories = 'Please select at least one category';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check rate limiting
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setSubmitStatus({
        type: 'error',
        message: `Too many attempts. Please try again after ${rateCheck.resetTime.toLocaleTimeString()}`
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const result = await subscribeToNewsletter(
        formData.email.trim().toLowerCase(),
        formData.selectedCategories
      );
      
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for subscribing! Check your email for confirmation.'
        });
        setFormData({ email: '', selectedCategories: ['general'] });
        setValidationErrors({});
        
        // Track successful subscription
        if (typeof gtag !== 'undefined') {
          gtag('event', 'newsletter_subscribe', {
            event_category: 'engagement',
            event_label: 'newsletter_form'
          });
        }
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Subscription failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
      // Clear status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'bg-white rounded-lg shadow-md p-6',
          title: 'text-xl font-semibold text-gray-900 mb-2',
          subtitle: 'text-sm text-gray-600 mb-4',
          form: 'space-y-3'
        };
      case 'inline':
        return {
          container: 'bg-transparent',
          title: 'text-lg font-medium text-gray-900 mb-1',
          subtitle: 'text-sm text-gray-600 mb-3',
          form: 'flex gap-2'
        };
      default:
        return {
          container: 'bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white',
          title: 'text-3xl font-bold mb-4',
          subtitle: 'text-blue-100 mb-6',
          form: 'space-y-4'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`${variantClasses.container} ${className}`}>
      <div className="text-center">
        <h3 className={variantClasses.title}>{title}</h3>
        <p className={variantClasses.subtitle}>{subtitle}</p>
      </div>

      <AnimatePresence>
        {submitStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              submitStatus.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{submitStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={variantClasses.form}>
        <div className={variant === 'inline' ? 'flex-1' : ''}>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              variant === 'default' ? 'text-blue-200' : 'text-gray-400'
            }`} />
            <input
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder={placeholder}
              required
              disabled={isSubmitting}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.email
                  ? 'border-red-500 bg-red-50'
                  : variant === 'default'
                  ? 'border-blue-200 bg-white/90 text-gray-900 placeholder-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
          {validationErrors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-1"
            >
              {validationErrors.email}
            </motion.p>
          )}
        </div>

        {showCategories && (
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${
              variant === 'default' ? 'text-blue-100' : 'text-gray-700'
            }`}>
              Subscription Preferences:
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    formData.selectedCategories.includes(category)
                      ? variant === 'default'
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-800'
                      : variant === 'default'
                      ? 'bg-blue-700 text-blue-100 hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="sr-only"
                  />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </label>
              ))}
            </div>
            {validationErrors.categories && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm"
              >
                {validationErrors.categories}
              </motion.p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            variant === 'default'
              ? 'bg-white text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </form>

      {variant === 'default' && (
        <p className="text-xs text-blue-100 text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      )}
    </div>
  );
};

export default SubscriptionForm;