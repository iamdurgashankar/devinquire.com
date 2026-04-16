import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Globe, Monitor } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import { responsiveTypography, responsiveSpacing, responsiveContainers } from '../utils/responsive';
import { submitContactForm } from '../services/emailService';

const Contact = () => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    timeline: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Preserve original value but ensure proper handling of spacing
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Rate limiting check
  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('contact_attempts') || '[]');
    const recentAttempts = attempts.filter(time => now - time < 900000); // 15 minutes
    
    if (recentAttempts.length >= 3) {
      return {
        allowed: false,
        resetTime: new Date(recentAttempts[0] + 900000)
      };
    }
    
    recentAttempts.push(now);
    localStorage.setItem('contact_attempts', JSON.stringify(recentAttempts));
    return { allowed: true };
  };

  const validateForm = () => {
    const errors = {};
    
    // Required field validation with enhanced checks
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 254) {
      errors.email = 'Email address is too long';
    }
    

    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      errors.subject = 'Subject must be at least 3 characters long';
    } else if (formData.subject.trim().length > 200) {
      errors.subject = 'Subject must be less than 200 characters';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > 5000) {
      errors.message = 'Message must be less than 5000 characters';
    }
    
    // Enhanced phone validation (if provided)
    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (!/^[0-9]{7,15}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number (7-15 digits)';
      }
    }
    
    // Company name validation (if provided)
    if (formData.company && formData.company.trim().length > 200) {
      errors.company = 'Company name must be less than 200 characters';
    }
    
    // Basic spam detection
    const spamPatterns = [
      /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
      /\b(click here|act now|limited time|urgent)\b/i,
      /(http:\/\/|https:\/\/)[^\s]{10,}/g
    ];
    
    const messageText = formData.message.toLowerCase();
    if (spamPatterns.some(pattern => pattern.test(messageText))) {
      errors.message = 'Message contains prohibited content';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    // Check rate limiting
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setSubmitStatus({
        type: 'error',
        message: `Too many submissions. Please try again after ${rateCheck.resetTime.toLocaleTimeString()}`
      });
      setTimeout(() => setSubmitStatus(null), 8000);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message || 'Thank you for your message! We\'ll get back to you within 24 hours.'
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          timeline: '',
          message: ''
        });
        setValidationErrors({});
        
        // Track successful form submission
        if (typeof gtag !== 'undefined') {
          gtag('event', 'contact_form_submit', {
            event_category: 'engagement',
            event_label: 'contact_form',
            value: 1
          });
        }
        
        // Auto-hide success message after 8 seconds
        setTimeout(() => setSubmitStatus(null), 8000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || result.message || 'Submission failed. Please try again or contact us directly at contact@devinquire.com'
        });
        setTimeout(() => setSubmitStatus(null), 8000);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Server')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few minutes or contact us directly.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please refresh the page and try again.';
      }
      
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
      setTimeout(() => setSubmitStatus(null), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      details: "Bengaluru, Karnataka, India",
      link: "https://maps.google.com"
    },
    {
      icon: Mail,
      title: "Email",
      details: "contact@devinquire.com",
      link: "mailto:contact@devinquire.com"
    },
    {
      icon: Phone,
      title: "Phone",
      details: "+91 8763155488",
      link: "tel:+918763155488"
    },
    {
      icon: Globe,
      title: "Website",
      details: "www.devinquire.com",
      link: "https://devinquire.com"
    }
  ];

  const services = [
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "E-commerce Solutions",
    "Custom Software",
    "Consulting"
  ];

  // Animation variants for better performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <SEO 
        title="Contact Us - Get In Touch with DevInquire"
        description="Ready to transform your digital presence? Contact DevInquire for web development, mobile apps, and digital solutions. Get a free consultation and project quote today."
        keywords="contact DevInquire, web development consultation, project quote, digital solutions inquiry, get in touch, free consultation"
        canonical="https://devinquire.com/contact"
        ogTitle="Contact DevInquire - Free Consultation & Project Quotes"
        ogDescription="Ready to transform your digital presence? Contact us for web development, mobile apps, and digital solutions. Get your free consultation today."
        ogUrl="https://devinquire.com/contact"
      />
      <PageLayout
        title="Get in Touch"
        subtitle="Ready to start your next project? We'd love to hear from you. Let's discuss how we can help bring your ideas to life."
      >

      {/* Contact Form & Info Section */}
      <section className={`${responsiveSpacing.sectionPadding}`}>
        <div className={responsiveContainers.standard}>
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-6`}>Send us a Message</h2>
              
              {submitStatus?.type === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-3"
                >
                  <span className="text-green-600 text-xl">✅</span>
                  <div>
                    <p className="font-semibold">Message Sent Successfully!</p>
                    <p className="text-sm">{submitStatus.message}</p>
                  </div>
                </motion.div>
              )}

              {submitStatus?.type === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3"
                >
                  <span className="text-red-600 text-xl">❌</span>
                  <div>
                    <p className="font-semibold">Submission Failed</p>
                    <p className="text-sm">{submitStatus.message}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white ${
                        validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white"
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>
                
                {/* Project Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#6b7280' }}>Select timeline...</option>
                      <option value="asap" style={{ color: '#111827' }}>ASAP</option>
                      <option value="1-month" style={{ color: '#111827' }}>Within 1 Month</option>
                      <option value="2-3-months" style={{ color: '#111827' }}>2-3 Months</option>
                      <option value="3-6-months" style={{ color: '#111827' }}>3-6 Months</option>
                      <option value="6-months-plus" style={{ color: '#111827' }}>6+ Months</option>
                      <option value="flexible" style={{ color: '#111827' }}>Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 text-gray-900 bg-white ${
                        validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Project Inquiry"
                    />
                    {validationErrors.subject && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.subject}</p>
                    )}
                  </div>
                </div>
                
                {/* Message Section */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Details & Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 resize-none text-gray-900 bg-white ${
                      validationErrors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Please describe your project in detail. Include any specific requirements, features you need, design preferences, or questions you have. The more information you provide, the better we can assist you."
                  ></textarea>
                  {validationErrors.message && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Tip: Include details about your target audience, preferred technologies, existing systems to integrate with, or any specific challenges you're facing.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#4e45e1] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#4139BF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-6`}>Contact Information</h2>
                <motion.div 
                  className="space-y-6"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {contactInfo.map((info, index) => (
                    <motion.a
                      key={index}
                      href={info.link}
                      variants={itemVariants}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <motion.div
                    className="text-2xl text-blue-600"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    <info.icon className="w-6 h-6" />
                  </motion.div>
                      <div>
                        <h3 className={`${responsiveTypography.cardTitle} text-gray-900`}>{info.title}</h3>
                        <p className={`${responsiveTypography.bodyBase} text-gray-600`}>{info.details}</p>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
              </div>

              <motion.div 
                className="bg-[#4e45e1] rounded-2xl p-8 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h3 className={`${responsiveTypography.cardTitle} mb-4`}>Business Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
                <p className="mt-4 text-blue-100">
                  Emergency support available 24/7 for existing clients
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={`${responsiveSpacing.sectionPadding} bg-white`}>
        <div className={responsiveContainers.standard}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`${responsiveTypography.pageTitle} text-gray-900 mb-4`}>Our Services</h2>
            <p className={`${responsiveTypography.bodyLarge} text-gray-600 max-w-2xl mx-auto`}>
              We offer a comprehensive range of development and design services to meet your needs.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-50 rounded-xl p-6 hover:bg-blue-50 transition-colors duration-300"
              >
                <motion.div
                  className="text-3xl mb-4 text-blue-600"
                  whileHover={{
                    scale: 1.05,
                    y: -2
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                >
                  <Monitor className="w-8 h-8" />
                </motion.div>
                <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-2`}>{service}</h3>
                <p className={`${responsiveTypography.bodyBase} text-gray-600`}>
                  Professional {service.toLowerCase()} services tailored to your specific requirements.
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`${responsiveSpacing.sectionPadding} bg-gray-50`}>
        <div className={responsiveContainers.narrow}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`${responsiveTypography.pageTitle} text-gray-900 mb-4`}>Frequently Asked Questions</h2>
            <p className={`${responsiveTypography.bodyLarge} text-gray-600`}>
              Get answers to common questions about our services and process.
            </p>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                question: "How long does a typical project take?",
                answer: "Project timelines vary depending on complexity. A simple website might take 2-4 weeks, while complex applications can take 2-6 months. We'll provide a detailed timeline during our initial consultation."
              },
              {
                question: "Do you provide ongoing support after launch?",
                answer: "Yes! We offer various support packages including maintenance, updates, and technical support. We're here to ensure your project continues to perform optimally."
              },
              {
                question: "What is your development process?",
                answer: "We follow an agile methodology: Discovery & Planning → Design → Development → Testing → Launch → Support. We keep you involved throughout the entire process."
              },
              {
                question: "Do you work with international clients?",
                answer: "Absolutely! We work with clients worldwide and are experienced in managing projects across different time zones and cultures."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className={`${responsiveTypography.bodyLarge} font-semibold text-gray-900 mb-3`}>{faq.question}</h3>
                <p className={`${responsiveTypography.bodyBase} text-gray-600`}>{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.sectionPadding} bg-[#4e45e1]`}>
        <div className={`${responsiveContainers.narrow} text-center`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`${responsiveTypography.pageTitle} text-white mb-6`}>
              Ready to Start Your Project?
            </h2>
            <p className={`${responsiveTypography.bodyLarge} text-blue-100 mb-8`}>
              Let's discuss your ideas and create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact-form"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
              >
                Get Free Quote
              </a>
              <a
                href="/services"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
              >
                View Services
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      </PageLayout>
    </>
  );
};

export default Contact;