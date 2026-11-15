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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('newsletter_attempts') || '[]');
    const recentAttempts = attempts.filter(time => now - time < 300000);
    
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
    
    if (!validateForm()) {
      return;
    }
    
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
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'apple-card p-6',
          title: 'text-xl font-bold text-[var(--text-primary)] mb-1.5',
          subtitle: 'text-[13px] text-[var(--text-secondary)] mb-4',
          form: 'space-y-3'
        };
      case 'inline':
        return {
          container: 'bg-transparent',
          title: 'text-lg font-semibold text-[var(--text-primary)] mb-1',
          subtitle: 'text-[13px] text-[var(--text-secondary)] mb-3',
          form: 'flex gap-2'
        };
      default:
        return {
          container: 'apple-card p-8',
          title: 'text-2xl md:text-3xl font-bold tracking-[-0.025em] text-[var(--text-primary)] mb-2',
          subtitle: 'text-[15px] text-[var(--text-secondary)] mb-6',
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={`mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 ${
              submitStatus.type === 'success'
                ? 'bg-[#34C759]/12 text-[#248A3D] dark:text-[#30D158] border border-[#34C759]/30'
                : 'bg-[#FF3B30]/12 text-[#D70015] dark:text-[#FF453A] border border-[#FF3B30]/30'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-[13px] font-medium">{submitStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={variantClasses.form}>
        <div className={variant === 'inline' ? 'flex-1' : ''}>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder={placeholder}
              required
              disabled={isSubmitting}
              className={`apple-input pl-10 ${
                validationErrors.email ? 'border-[#FF3B30]' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
          {validationErrors.email && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#FF3B30] text-[12px] mt-1"
            >
              {validationErrors.email}
            </motion.p>
          )}
        </div>

        {showCategories && (
          <div className="space-y-2">
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
              Subscription Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all ${
                    formData.selectedCategories.includes(category)
                      ? 'bg-[#007AFF] text-white'
                      : 'apple-subcard text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#FF3B30] text-[12px]"
              >
                {validationErrors.categories}
              </motion.p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="apple-pill-btn w-full py-3 px-6 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </form>

      {variant === 'default' && (
        <p className="text-[12px] text-[var(--text-tertiary)] text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      )}
    </div>
  );
};

export default SubscriptionForm;
