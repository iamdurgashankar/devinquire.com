import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Globe, Monitor, Clock, CheckCircle2, AlertCircle, Send, HelpCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import ModernCTA from '../components/ModernCTA';
import { responsiveSpacing, responsiveContainers } from '../utils/responsive';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (!/^[0-9]{7,15}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number (7-15 digits)';
      }
    }

    if (formData.company && formData.company.trim().length > 200) {
      errors.company = 'Company name must be less than 200 characters';
    }

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

    if (!validateForm()) {
      return;
    }

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

        if (typeof gtag !== 'undefined') {
          gtag('event', 'contact_form_submit', {
            event_category: 'engagement',
            event_label: 'contact_form',
            value: 1
          });
        }

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
      title: "Headquarters",
      details: "Bengaluru, Karnataka, India",
      link: "https://maps.google.com",
      color: "#007AFF"
    },
    {
      icon: Mail,
      title: "Direct Email",
      details: "contact@devinquire.com",
      link: "mailto:contact@devinquire.com",
      color: "#5E5CE6"
    },
    {
      icon: Phone,
      title: "Phone Line",
      details: "+91 8763155488",
      link: "tel:+918763155488",
      color: "#34C759"
    },
    {
      icon: Globe,
      title: "Global Web",
      details: "www.devinquire.com",
      link: "https://devinquire.com",
      color: "#FF9F0A"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
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
        badge="Direct Line"
        title="Get in Touch"
        subtitle="Ready to start your next flagship project? Connect directly with our engineering and architecture team."
      >
        {/* Contact Form & Info Section */}
        <section id="contact-form" className="pt-4 pb-16 md:pb-20">
          <div className={responsiveContainers.standard}>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Contact Form (7 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 apple-card p-8 md:p-10"
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full apple-subcard mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                      Project Brief
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em] text-[var(--text-primary)]">
                    Send us a Message
                  </h2>
                  <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                    Our architects respond to all project inquiries within 24 hours.
                  </p>
                </div>
                
                {submitStatus?.type === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 rounded-2xl bg-[#34C759]/12 border border-[#34C759]/30 text-[#248A3D] dark:text-[#30D158] flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[14px]">Message Sent Successfully</p>
                      <p className="text-[13px] opacity-90">{submitStatus.message}</p>
                    </div>
                  </motion.div>
                )}

                {submitStatus?.type === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 rounded-2xl bg-[#FF3B30]/12 border border-[#FF3B30]/30 text-[#D70015] dark:text-[#FF453A] flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[14px]">Submission Failed</p>
                      <p className="text-[13px] opacity-90">{submitStatus.message}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="min-w-0">
                      <label htmlFor="name" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={`apple-input w-full ${validationErrors.name ? '!border-[#FF3B30]' : ''}`}
                        placeholder="John Appleseed"
                      />
                      {validationErrors.name && (
                        <p className="text-[#FF3B30] text-[12px] mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="email" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`apple-input w-full ${validationErrors.email ? '!border-[#FF3B30]' : ''}`}
                        placeholder="john@company.com"
                      />
                      {validationErrors.email && (
                        <p className="text-[#FF3B30] text-[12px] mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="min-w-0">
                      <label htmlFor="phone" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`apple-input w-full ${validationErrors.phone ? '!border-[#FF3B30]' : ''}`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {validationErrors.phone && (
                        <p className="text-[#FF3B30] text-[12px] mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="company" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="apple-input w-full"
                        placeholder="Your Company Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="min-w-0">
                      <label htmlFor="timeline" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Project Timeline
                      </label>
                      <select
                        id="timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleChange}
                        className="apple-input w-full"
                      >
                        <option value="">Select timeline...</option>
                        <option value="asap">ASAP</option>
                        <option value="1-month">Within 1 Month</option>
                        <option value="2-3-months">2-3 Months</option>
                        <option value="3-6-months">3-6 Months</option>
                        <option value="6-months-plus">6+ Months</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="subject" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={`apple-input w-full ${validationErrors.subject ? '!border-[#FF3B30]' : ''}`}
                        placeholder="Enterprise Web Platform"
                      />
                      {validationErrors.subject && (
                        <p className="text-[#FF3B30] text-[12px] mt-1">{validationErrors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-[13px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                      Project Details & Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className={`apple-input w-full resize-none ${validationErrors.message ? '!border-[#FF3B30]' : ''}`}
                      placeholder="Describe your project goals, required features, design preferences, or architectural questions..."
                    ></textarea>
                    {validationErrors.message && (
                      <p className="text-[#FF3B30] text-[12px] mt-1">{validationErrors.message}</p>
                    )}
                    <p className="text-[12px] text-[var(--apple-text-tertiary)] mt-2">
                      Tip: Mention your target audience, preferred stack, existing systems to integrate with, or key milestones.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="apple-pill-btn w-full py-3.5 text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Message...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Contact Information & Hours (5 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-5 space-y-6"
              >
                <div className="apple-card p-8">
                  <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)] mb-6">
                    Direct Channels
                  </h2>
                  <motion.div 
                    className="space-y-3.5"
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
                        className="apple-subcard flex items-center gap-4 p-4 rounded-2xl hover:border-[#007AFF]/40 transition-all group"
                      >
                        <div
                          className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                          style={{
                            backgroundColor: `${info.color}18`,
                            color: info.color
                          }}
                        >
                          <info.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                            {info.title}
                          </h3>
                          <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors">
                            {info.details}
                          </p>
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                </div>

                {/* Business Hours Card */}
                <div className="apple-card p-8 relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#007AFF]/10 blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-[12px] bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Operating Hours</h3>
                      <p className="text-[12px] text-[var(--text-tertiary)]">IST (UTC +5:30) & Global Coverage</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-secondary)]">Monday – Friday</span>
                      <span className="font-semibold text-[var(--text-primary)]">9:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-secondary)]">Saturday</span>
                      <span className="font-semibold text-[var(--text-primary)]">10:00 AM – 4:00 PM</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[var(--text-secondary)]">Sunday</span>
                      <span className="font-semibold text-[#FF9500] dark:text-[#FF9F0A]">On-Call SLA</span>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                    <span>24/7 Priority incident response active for enterprise partners</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Overview Section */}
        <section className={responsiveSpacing.sectionPadding}>
          <div className={responsiveContainers.standard}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full apple-subcard mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#007AFF] dark:text-[#0A84FF]">
                  Capabilities
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] mb-3">
                How We Can Partner
              </h2>
              <p className="text-[16px] text-[var(--text-secondary)] max-w-2xl mx-auto">
                Comprehensive engineering and product design disciplines tailored to your roadmap.
              </p>
            </div>
            
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="apple-card apple-card-interactive p-6"
                >
                  <div className="w-11 h-11 rounded-[13px] bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center mb-4">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <h3 className="text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] mb-1.5">
                    {service}
                  </h3>
                  <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                    Production-grade {service.toLowerCase()} engineered for scale, reliability, and human-centered polish.
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={responsiveSpacing.sectionPadding}>
          <div className={responsiveContainers.narrow}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full apple-subcard mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-[#5E5CE6]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                  FAQ
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-[16px] text-[var(--text-secondary)]">
                Clear answers about our engineering cadence, timelines, and delivery model.
              </p>
            </div>
            
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  question: "How long does a typical project take?",
                  answer: "Project timelines depend on scope and architectural complexity. Marketing platforms typically ship in 2–4 weeks, while custom SaaS and AI applications take 8–16 weeks with weekly milestone releases."
                },
                {
                  question: "Do you provide ongoing support after launch?",
                  answer: "Yes. We offer dedicated SLA retainers covering proactive security updates, cloud scaling, telemetry monitoring, and continuous feature iteration."
                },
                {
                  question: "What is your development process?",
                  answer: "We follow a transparent agile cadence: Architecture & Discovery → Apple-grade UI/UX Prototyping → Iterative Engineering Sprints → Automated QA → Zero-downtime Deployment."
                },
                {
                  question: "Do you work with international clients?",
                  answer: "Absolutely. We partner with founders and enterprises across North America, Europe, Asia, and Oceania with overlapping synchronous communication windows."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="apple-card p-6 md:p-7"
                >
                  <h3 className="text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <ModernCTA
          title="Ready to Start Your Project?"
          subtitle="Let's architect and ship something extraordinary together."
          primaryText="Get Free Quote"
          primaryLink="#contact-form"
          secondaryText="Explore Services"
          secondaryLink="/services"
        />
      </PageLayout>
    </>
  );
};

export default Contact;
