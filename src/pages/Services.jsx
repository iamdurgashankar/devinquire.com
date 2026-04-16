import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Monitor, Rocket, RefreshCw, Layout, ShieldCheck, Cpu, Zap, Layers, Puzzle, Smartphone, Search, Palette, FileText, ShoppingCart, TrendingUp, X, Mail, User, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import PageLayout from '../components/PageLayout';
import Banner728x98 from '../components/Banner728x98';
import SEO from '../components/SEO';
import ModernCTA from '../components/ModernCTA';
import { responsiveTypography, responsiveSpacing, responsiveContainers } from '../utils/responsive';
import { submitContactForm } from '../services/emailService';

// Service Images
import migrationImg from '../images/services/migration.png';
import landingPageImg from '../images/services/landing-page.png';
import maintenanceImg from '../images/services/maintenance.png';
import devImg from '../images/services/web-dev.png'; // Reusing from home migration
import webAppImg from '../images/services/custom.png'; // Reusing
import mobileAppImg from '../images/services/mobile-dev.png'; // Reusing
import seoImg from '../images/services/seo.png';
import brandingImg from '../images/services/branding.png';
import ecommerceImg from '../images/services/ecommerce.png';

const services = [
  {
    image: migrationImg,
    icon: RefreshCw,
    title: "Website Migration & Redesign",
    description: "Expert React to WordPress migration and modern UI rebuilds for existing websites",
    features: ["React → WordPress Migration", "Modern UI Redesign", "Elementor/Custom Themes", "SEO & Speed Recovery"],
    technologies: ["WordPress", "React", "Elementor", "PHP", "Performance Audit"]
  },
  {
    image: landingPageImg,
    icon: Layout,
    title: "Landing Page Development",
    description: "High-conversion, mobile-first landing pages for startups and product launches",
    features: ["1-Page Landing Systems", "Lead Generation Focus", "Mobile-first Design", "A/B Test Ready"],
    technologies: ["React", "HTML/CSS", "WordPress", "Analytics"]
  },
  {
    image: maintenanceImg,
    icon: ShieldCheck,
    title: "Web Maintenance Plans",
    description: "Comprehensive monthly support to keep your digital assets secure and optimized",
    features: ["Bug Fixes & Updates", "Speed Optimization", "Security & Backups", "Content Updates"],
    technologies: ["Security Tools", "Cloud Monitoring", "AWS", "Backup Systems"]
  },
  {
    image: devImg,
    icon: Monitor,
    title: "Custom Website Development",
    description: "Custom websites built with modern technologies and responsive design",
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Modern UI/UX", "Content Management", "Analytics Integration"],
    technologies: ["React", "Next.js", "Node.js", "MongoDB", "AWS", "Vercel"]
  },
  {
    image: webAppImg,
    icon: Rocket,
    title: "Web Application Development",
    description: "Full-stack web applications with advanced functionality and scalability",
    features: ["Custom Backend", "Database Design", "API Development", "User Authentication", "Real-time Features", "Cloud Deployment"],
    technologies: ["React", "Vue.js", "Express.js", "PostgreSQL", "Redis", "Docker"]
  },
  {
    image: mobileAppImg,
    icon: Smartphone,
    title: "Mobile Application Development",
    description: "Native and cross-platform mobile apps for iOS and Android",
    features: ["iOS Development", "Android Development", "Cross-platform", "Push Notifications", "Offline Support", "App Store Deployment"],
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "MySQL", "App Store"]
  },
  {
    image: seoImg,
    icon: Search,
    title: "SEO Services",
    description: "Search engine optimization to improve your online visibility and rankings",
    features: ["Keyword Research", "On-page SEO", "Technical SEO", "Content Strategy", "Link Building", "Performance Monitoring"],
    technologies: ["Google Analytics", "Search Console", "Ahrefs", "SEMrush", "Core Web Vitals", "Schema Markup"]
  },
  {
    image: brandingImg,
    icon: Palette,
    title: "Logo & Banner Design",
    description: "Professional branding and visual design for your business",
    features: ["Logo Design", "Brand Guidelines", "Social Media Graphics", "Print Materials", "Web Graphics", "Animation"],
    technologies: ["Adobe Illustrator", "Photoshop", "Figma", "After Effects", "InDesign", "Sketch"]
  },
  {
    image: ecommerceImg,
    icon: ShoppingCart,
    title: "E-commerce Development",
    description: "Complete online store solutions with secure payment processing and inventory management",
    features: ["Custom Store Design", "Payment Integration", "Inventory Management", "Order Processing", "Customer Accounts", "Analytics Dashboard"],
    technologies: ["Shopify", "WooCommerce", "Stripe", "PayPal", "React", "Node.js"]
  }
];

const ecosystemItems = [
  {
    icon: Cpu,
    title: "AI-Powered Tools",
    subtitle: "Accelerate your workflow",
    description: "Including ATS Resume Checker, Resume Builder, and SEO Meta Generators.",
    badge: "Phase 2"
  },
  {
    icon: Layers,
    title: "WordPress Plugins",
    subtitle: "Extend your site",
    description: "Custom Page Builder Add-ons, CTAs, and WhatsApp integrations.",
    badge: "Phase 3"
  },
  {
    icon: Zap,
    title: "Chrome Extensions",
    subtitle: "Productivity first",
    description: "UI Inspectors (PixelPerfecter) and AI explainers (QuickExplain).",
    badge: "New"
  },
  {
    icon: Puzzle,
    title: "UI Kits & Templates",
    subtitle: "Jumpstart development",
    description: "Premium React dashboards, portfolios, and landing page kits.",
    badge: "Scaling"
  }
];

export default function Services() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitContactForm({
        ...formData,
        subject: `Service Inquiry: ${formData.service}`
      });

      if (response.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', service: '', message: '' });
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitStatus('');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }

    setIsSubmitting(false);
  };

  const openModal = (serviceName) => {
    setFormData(prev => ({ ...prev, service: serviceName }));
    setIsModalOpen(true);
  };

  return (
    <>
      <SEO
        title="Our Services - Comprehensive Digital Solutions"
        description="Explore DevInquire's comprehensive digital services including web development, mobile apps, SEO, e-commerce, and digital marketing. Custom solutions tailored to your business needs."
        keywords="web development services, mobile app development, SEO services, e-commerce development, digital marketing, custom software development, UI/UX design, logo design"
        canonical="https://devinquire.com/services"
        ogTitle="DevInquire Services - Web Development, Mobile Apps & Digital Solutions"
        ogDescription="Comprehensive digital solutions from concept to deployment. Web development, mobile apps, SEO, e-commerce, and digital marketing services."
        ogUrl="https://devinquire.com/services"
        schemaType="Service"
      />
      <PageLayout
        title="Our Services"
        subtitle="Comprehensive digital solutions tailored to your unique business needs. From concept to deployment, we handle every aspect of your digital transformation."
      >

        {/* Services Grid */}
        <section className={`${responsiveSpacing.sectionPadding} relative`}>
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
          </div>

          <div className={`relative ${responsiveContainers.standard}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div key={index} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 overflow-hidden relative">
                  {/* Service Image Header */}
                  <div className="h-48 overflow-hidden relative">
                    <motion.img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                  </div>

                  <div className="relative z-10 p-8 -mt-6">
                    <div className="flex justify-between items-start mb-4">
                      <motion.div
                        className="p-3 bg-blue-50 rounded-xl text-blue-600"
                        whileHover={{ scale: 1.1 }}
                      >
                        <service.icon className="w-6 h-6" />
                      </motion.div>
                    </div>

                    <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-3 group-hover:text-[#4e45e1] transition-colors duration-300`}>{service.title}</h3>
                    <p className={`${responsiveTypography.bodyBase} text-gray-600 mb-6 line-clamp-2`}>{service.description}</p>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        What's Included:
                      </h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className={`flex items-center ${responsiveTypography.bodySmall} text-gray-600 group-hover:text-gray-700 transition-colors duration-300`}>
                            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technologies */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Technologies:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {service.technologies.map((tech, techIndex) => (
                          <span key={techIndex} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <button
                        onClick={() => openModal(service.title)}
                        className="block w-full bg-[#4e45e1] hover:bg-[#4139BF] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg text-center"
                      >
                        Let's Build This!
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className={`${responsiveSpacing.sectionPadding} bg-white relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-100/50 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
          </div>

          <div className={`relative ${responsiveContainers.standard}`}>
            <div className={`text-center ${responsiveSpacing.marginBottomLarge}`}>
              <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-4 animate-fade-in-up`}>Our Process</h2>
              <p className={`${responsiveTypography.sectionSubtitle} text-gray-600 max-w-2xl mx-auto animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
                We follow a proven methodology to deliver exceptional results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Discovery",
                  description: "We start by understanding your business goals, target audience, and project requirements.",
                  icon: "🔍"
                },
                {
                  step: "02",
                  title: "Planning",
                  description: "We create a detailed project plan, wireframes, and technical architecture.",
                  icon: "📋"
                },
                {
                  step: "03",
                  title: "Development",
                  description: "Our team builds your solution using modern technologies and best practices.",
                  icon: "⚡"
                },
                {
                  step: "04",
                  title: "Launch",
                  description: "We deploy your project and provide ongoing support and maintenance.",
                  icon: "🚀"
                }
              ].map((process, index) => (
                <div key={index} className="text-center group">
                  <div className="relative">
                    <div className="w-20 h-20 bg-[#4e45e1] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg">
                      {process.step}
                    </div>
                    <div className="absolute -inset-2 bg-[#4e45e1] rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                  </div>
                  <div className="text-3xl mb-3 group-hover:animate-bounce">{process.icon}</div>
                  <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-3 group-hover:text-[var(--primary)] transition-colors duration-300`}>{process.title}</h3>
                  <p className={`${responsiveTypography.bodyBase} text-gray-600 group-hover:text-gray-700 transition-colors duration-300`}>{process.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Innovative Ecosystem Section */}
        <section className={`${responsiveSpacing.sectionPadding} bg-gray-50 relative overflow-hidden`}>
          <div className="absolute inset-0">
            <div className="absolute top-20 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl transform translate-x-1/2"></div>
          </div>

          <div className={`relative ${responsiveContainers.standard}`}>
            <div className={`text-center ${responsiveSpacing.marginBottomLarge}`}>
              <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-4`}>Innovative Product Ecosystem</h2>
              <p className={`${responsiveTypography.sectionSubtitle} text-gray-600 max-w-2xl mx-auto`}>
                Beyond services, we're building a complete suite of tools to empower your digital journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecosystemItems.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-500 rounded">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-blue-500 font-medium mb-3">{item.subtitle}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>



        <ModernCTA 
          title="Ready to Start Your Project?"
          subtitle="Transform your vision into reality with our expert team. Let's create a custom solution that drives exceptional results."
          primaryText="Schedule Consultation"
          primaryLink="/contact"
          secondaryText="View Our Services"
          secondaryLink="/services"
        />

        {/* Contact Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-[#4e45e1] text-white p-6 rounded-t-2xl relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold mb-2">Let's Start Your Project!</h3>
                <p className="text-blue-100">Tell us about your {formData.service.toLowerCase()} needs</p>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {submitStatus === 'success' && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    ✅ Thank you! We'll get back to you within 24 hours.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ❌ Something went wrong. Please try again.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Two Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                        placeholder="Enter your email address"
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Service Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Interest
                      </label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                      >
                        <option value="">Select a service</option>
                        {services.map((service, index) => (
                          <option key={index} value={service.title}>{service.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message Field - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Project Details *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-900 bg-white"
                      placeholder="Tell us about your project requirements, timeline, and budget..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-[#4e45e1] text-white rounded-lg hover:bg-[#4139BF] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        '🚀 Send Message'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </PageLayout >
    </>
  );
}