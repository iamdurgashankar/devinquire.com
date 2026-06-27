import { Link } from "react-router-dom";
import ModernCTA from '../components/ModernCTA';
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  Monitor, Smartphone, Palette, Cloud, Rocket, Settings,
  Target, Smile, Star, Shield, ChevronUp, ChevronLeft, ChevronRight,
  Code, Zap, Wrench, Globe, ArrowUp
} from "lucide-react";
import SEO from '../components/SEO';

// Service Images
import webDevImg from '../images/services/web-dev.png';
import mobileDevImg from '../images/services/mobile-dev.png';
import uiUxImg from '../images/services/ui-ux.png';

// Product Images
import aiBotImg from '../images/products/ai-bot.png';
import analyticsImg from '../images/products/analytics.png';
import ecommerceProductImg from '../images/products/ecommerce.png';

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      <SEO
        title="Professional Web Development & Digital Solutions"
        description="DevInquire offers expert web development, mobile app development, and digital solutions. Transform your business with our custom software development services and innovative technology solutions."
        keywords="web development, mobile app development, custom software, digital solutions, React development, Node.js, professional development services, business automation, e-commerce development"
        canonical="https://devinquire.com"
        ogTitle="DevInquire - Professional Web Development & Digital Solutions"
        ogDescription="Transform your business with expert web development, mobile apps, and custom software solutions. Professional development services for modern businesses."
        ogUrl="https://devinquire.com"
      />
      {/* Custom Cursor */}
      <motion.div
        className="fixed w-6 h-6 bg-indigo-500/30 rounded-full pointer-events-none z-50 mix-blend-multiply hidden lg:block"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Floating Action Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed bottom-24 right-6 z-40"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group w-14 h-14 bg-[#4F46E5] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white hover:scale-110 border border-white/20 backdrop-blur-sm"
              aria-label="Back to top"
            >
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUp className="w-6 h-6" />
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative bg-white text-gray-900 overflow-hidden min-h-screen flex items-center hero-section-overlay"
        style={{ y, opacity }}
      >
        {/* Enhanced Light Glass Effect Background */}
        <div className="absolute inset-0">
          {/* Spider Web Circuit Animation */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
              {/* Circuit Nodes */}
              {[
                { x: 100, y: 150, size: 8, delay: 0 },
                { x: 300, y: 100, size: 6, delay: 0.5 },
                { x: 500, y: 200, size: 10, delay: 1 },
                { x: 700, y: 120, size: 7, delay: 1.5 },
                { x: 900, y: 180, size: 9, delay: 2 },
                { x: 1100, y: 140, size: 6, delay: 2.5 },
                { x: 200, y: 350, size: 8, delay: 3 },
                { x: 400, y: 400, size: 7, delay: 3.5 },
                { x: 600, y: 320, size: 9, delay: 4 },
                { x: 800, y: 380, size: 8, delay: 4.5 },
                { x: 1000, y: 340, size: 6, delay: 5 },
                { x: 150, y: 550, size: 7, delay: 5.5 },
                { x: 350, y: 600, size: 8, delay: 6 },
                { x: 550, y: 520, size: 10, delay: 6.5 },
                { x: 750, y: 580, size: 7, delay: 7 },
                { x: 950, y: 540, size: 9, delay: 7.5 },
              ].map((node, i) => (
                <motion.circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill="var(--accent)"
                  opacity={0.6}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    opacity: [0, 0.8, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    delay: node.delay,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 8
                  }}
                />
              ))}

              {/* Connecting Lines - Spider Web Pattern */}
              {[
                // Horizontal connections
                { x1: 100, y1: 150, x2: 300, y2: 100, delay: 1 },
                { x1: 300, y1: 100, x2: 500, y2: 200, delay: 1.5 },
                { x1: 500, y1: 200, x2: 700, y2: 120, delay: 2 },
                { x1: 700, y1: 120, x2: 900, y2: 180, delay: 2.5 },
                { x1: 900, y1: 180, x2: 1100, y2: 140, delay: 3 },

                // Vertical connections
                { x1: 200, y1: 350, x2: 100, y2: 150, delay: 3.5 },
                { x1: 400, y1: 400, x2: 300, y2: 100, delay: 4 },
                { x1: 600, y1: 320, x2: 500, y2: 200, delay: 4.5 },
                { x1: 800, y1: 380, x2: 700, y2: 120, delay: 5 },
                { x1: 1000, y1: 340, x2: 900, y2: 180, delay: 5.5 },

                // Cross connections
                { x1: 150, y1: 550, x2: 200, y2: 350, delay: 6 },
                { x1: 350, y1: 600, x2: 400, y2: 400, delay: 6.5 },
                { x1: 550, y1: 520, x2: 600, y2: 320, delay: 7 },
                { x1: 750, y1: 580, x2: 800, y2: 380, delay: 7.5 },
                { x1: 950, y1: 540, x2: 1000, y2: 340, delay: 8 },

                // Diagonal web connections
                { x1: 100, y1: 150, x2: 400, y2: 400, delay: 8.5 },
                { x1: 300, y1: 100, x2: 600, y2: 320, delay: 9 },
                { x1: 500, y1: 200, x2: 800, y2: 380, delay: 9.5 },
                { x1: 700, y1: 120, x2: 950, y2: 540, delay: 10 },
                { x1: 200, y1: 350, x2: 550, y2: 520, delay: 10.5 },
                { x1: 400, y1: 400, x2: 750, y2: 580, delay: 11 },
              ].map((line, i) => (
                <motion.line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--accent)"
                  strokeWidth="1"
                  opacity={0.3}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: line.delay,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Data Pulse Animation - Alternative approach */}
              {[
                { startX: 100, startY: 150, endX: 500, endY: 200, delay: 2 },
                { startX: 500, startY: 200, endX: 900, endY: 180, delay: 4 },
                { startX: 200, startY: 350, endX: 600, endY: 320, delay: 6 },
                { startX: 600, startY: 320, endX: 1000, endY: 340, delay: 8 },
                { startX: 150, startY: 550, endX: 550, endY: 520, delay: 10 },
              ].map((pulse, i) => (
                <motion.circle
                  key={`pulse-${i}`}
                  r="3"
                  fill="var(--secondary)"
                  opacity={0.8}
                  initial={{
                    cx: pulse.startX,
                    cy: pulse.startY,
                    scale: 0
                  }}
                  animate={{
                    cx: [pulse.startX, pulse.endX, pulse.startX],
                    cy: [pulse.startY, pulse.endY, pulse.startY],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 4,
                    delay: pulse.delay,
                    repeat: Infinity,
                    repeatDelay: 6,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </svg>
          </div>

          {/* Enhanced grid pattern with circuit board effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(174,151,239,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Additional light glass effect layers */}
          <div className="absolute inset-0 bg-indigo-50/50"></div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
          <div className="text-center">
            {/* Main Title with Enhanced Animation */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{
                scale: 1.05,
                textShadow: "0px 0px 8px rgba(59, 130, 246, 0.5)"
              }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                DevInquire
              </motion.span>
            </motion.h1>

            {/* Animated Subtitle */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <div className="text-2xl md:text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
                <span className="text-gray-900 font-medium">
                  Building Tomorrow's Digital Solutions
                </span>
                <br />
                <span className="text-gray-500">Full-Stack Development • Mobile Apps • Cloud Solutions</span>
              </div>
            </motion.div>

            {/* Professional Description */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We specialize in creating scalable, high-performance applications using cutting-edge technologies.
                From concept to deployment, we deliver exceptional digital experiences that drive business growth.
              </p>
            </motion.div>

            {/* Professional CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16 px-4 sm:px-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              <Link
                to="/services"
                className="group relative bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl overflow-hidden border border-[#4F46E5]/30 w-full sm:w-auto min-w-0 flex-shrink-0"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="truncate">View Our Services</span>
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-[#4338CA] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/contact"
                className="group relative border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 overflow-hidden backdrop-blur-sm w-full sm:w-auto min-w-0 flex-shrink-0"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="truncate">Start Your Project</span>
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gray-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </motion.div>

            {/* Professional Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.3 }}
            >
              {[
                { number: "100+", label: "Projects Delivered", icon: Rocket },
                { number: "50+", label: "Happy Clients", icon: Smile },
                { number: "6+", label: "Years Experience", icon: Settings },
                { number: "100%", label: "Client Satisfaction", icon: Star }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 hover:bg-white transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-md">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="w-10 h-10 mx-auto text-[#4F46E5] group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 group-hover:text-[#4F46E5] transition-colors duration-300">{stat.number}</div>
                    <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
        {/* Floating tech stack with animations */}
        <div className="absolute top-1/4 right-10 hidden lg:block">
          <div className="space-y-4">
            {[
              { icon: Code, name: "React", color: "#4F46E5" },
              { icon: Zap, name: "Next.js", color: "#4F46E5" },
              { icon: Settings, name: "Node.js", color: "#4F46E5" },
              { icon: Palette, name: "Tailwind", color: "#4F46E5" },
              { icon: Smartphone, name: "Mobile", color: "#4F46E5" },
              { icon: Globe, name: "Web3", color: "#4F46E5" }
            ].map((tech, index) => (
              <motion.div
                key={index}
                className="group w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-[#4F46E5] opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                />
                <div className="group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <tech.icon className="w-6 h-6 text-gray-600 group-hover:text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
                  {tech.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Animated code editor mockup */}
        <div className="absolute bottom-20 left-10 hidden xl:block">
          <motion.div
            className="w-80 bg-white/80 backdrop-blur-md rounded-lg border border-gray-100 shadow-xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-100">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xs text-gray-400 ml-2">main.js</div>
            </div>
            <div className="p-4 font-mono text-sm">
              <div className="text-green-400">
                const app = new App();
              </div>
              <div className="text-indigo-400">app.initialize();</div>
              <div className="text-yellow-400">
                app.deploy();
              </div>
              <div className="text-gray-400 flex items-center gap-2">
                // Success!
                <Rocket className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Preview - Enhanced */}
      <section className="py-20 bg-gray-50 relative overflow-hidden" aria-labelledby="services-heading">
        {/* Background decoration */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-20 right-20 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-16">
            <motion.h2
              id="services-heading"
              className="text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Our Services
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Comprehensive solutions for your digital needs
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12" role="list">
            {[
              {
                image: webDevImg,
                title: "Web Development",
                description: "Modern, responsive websites and web applications built with the latest technologies.",
                features: ["React/Next.js", "Node.js", "Database Design", "API Integration"],
              },
              {
                image: mobileDevImg,
                title: "Mobile Development",
                description: "Native and cross-platform mobile applications for iOS and Android.",
                features: ["React Native", "iOS/Android", "App Store", "Performance"],
              },
              {
                image: uiUxImg,
                title: "UI/UX Design",
                description: "User-centric design that provides beautiful and intuitive experiences.",
                features: ["Wireframing", "Prototyping", "User Testing", "Design Systems"],
              },

            ].map((service, index) => (
              <motion.article
                key={index}
                className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col group hover:shadow-xl transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                role="listitem"
                aria-labelledby={`service-${index}-title`}
              >
                <div className="overflow-hidden h-48 bg-gray-100 border-b border-gray-100/50">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-8 pt-6 flex-grow flex flex-col">
                  <h3 id={`service-${index}-title`} className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-gray-600 mb-8 flex-grow">
                    {service.description}
                  </p>

                <ul className="space-y-3" aria-label={`${service.title} features`}>
                  {service.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-500"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Link
              to="/services"
              className="group inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-lg transition-all duration-300"
            >
              View All Services
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Top Products Section */}
      <section className="py-20 bg-white relative overflow-hidden" aria-labelledby="products-heading">
        {/* Background decoration */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-16">
            <motion.h2
              id="products-heading"
              className="text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Top Products
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Market-leading solutions designed to accelerate your growth
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12" role="list">
            {[
              {
                image: aiBotImg,
                title: "AI Business Assistant",
                description: "Intelligent conversational bots that automate customer support and boost engagement.",
                features: ["NLP Capabilities", "24/7 Support", "Seamless Integration"],
              },
              {
                image: analyticsImg,
                title: "Data Analytics Suite",
                description: "Comprehensive analytics platform to track performance, behavior, and market trends.",
                features: ["Real-time Data", "Custom Dashboards", "Predictive Analytics"],
              },
              {
                image: ecommerceProductImg,
                title: "Next-Gen E-Commerce",
                description: "A complete toolkit for building highly converting, scalable online storefronts.",
                features: ["Inventory Management", "Secure Payments", "Mobile Optimized"],
              },

            ].map((product, index) => (
              <motion.article
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-50 flex flex-col group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                role="listitem"
                aria-labelledby={`product-${index}-title`}
              >
                {/* Decorative background element on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Full-width edge-to-edge image container */}
                <div className="relative z-10 overflow-hidden h-56 bg-gray-50 border-b border-gray-100/50">
                  <motion.img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="relative z-10 p-8 pt-6 flex-grow flex flex-col">
                  <h3 id={`product-${index}-title`} className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                    {product.title}
                  </h3>

                  <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
                    {product.description}
                  </p>

                  <ul className="space-y-3 mb-6" aria-label={`${product.title} features`}>
                    {product.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm font-medium text-gray-500"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <Link to="/products" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Learn more
                      <svg className="ml-1.5 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Link
              to="/products"
              className="group inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-lg transition-all duration-300"
            >
              Explore All Products
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>


      {/* Stats Section - Enhanced */}
      <section className="py-20 bg-indigo-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "100+", label: "Projects Completed", icon: Target },
              { number: "50+", label: "Happy Clients", icon: Smile },
              { number: "6+", label: "Years Experience", icon: Star },
              { number: "24/7", label: "Support Available", icon: Shield }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-500 transform hover:scale-105 border border-indigo-100">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">
                    <stat.icon className="w-12 h-12 mx-auto text-indigo-600 group-hover:text-indigo-500 transition-colors duration-300" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">{stat.number}</div>
                  <div className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced Interactive Carousel */}
      <section className="py-20 bg-gray-50 relative overflow-hidden" aria-labelledby="testimonials-heading">
        {/* Animated Background decoration */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.header
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 id="testimonials-heading" className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-xl text-gray-600">Don't just take our word for it</p>
          </motion.header>

          {/* Continuous Scrolling Marquee */}
        </div>

        <div className="relative w-full overflow-hidden mt-8 pb-12 [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused] gap-8 px-4">
            {[1, 2].flatMap(() => [
              {
                name: "Sankalp",
                role: "CEO, DCIT",
                content: "DevInquire transformed our outdated website into a modern, high-performing platform that increased our conversions by 300%.",
                avatar: "SJ",
                rating: 5,
              },
              {
                name: "Shivraj",
                role: "Founder, DCIT",
                content: "The team at DevInquire delivered our mobile app on time and exceeded our expectations. Highly recommended!",
                avatar: "MC",
                rating: 5,
              },
              {
                name: "Sunil",
                role: "Marketing Director, Kinspire Biz",
                content: "Their SEO services helped us climb to the top of search results. Our organic traffic has never been better.",
                avatar: "ER",
                rating: 5,
              },
              {
                name: "Satya",
                role: "Founder, GetFitWithSatya",
                content: "DevInquire built an incredible custom fitness console that perfectly manages our member data and workout plans. The user experience is flawless.",
                avatar: "SA",
                rating: 5,
              },
              {
                name: "Biswajit",
                role: "Director, City Hospital",
                content: "The OPD console they developed for our hospital streamlined our entire patient management process. It's secure, fast, and incredibly reliable.",
                avatar: "BI",
                rating: 5,
              }
            ]).map((testimonial, index) => (
              <article
                key={index}
                className="w-[350px] md:w-[400px] flex-shrink-0 whitespace-normal bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between group cursor-grab active:cursor-grabbing"
                aria-label={`Testimonial from ${testimonial.name}, ${testimonial.role}`}
              >
                {/* Minimal Quote Icon */}
                <div className="absolute top-8 right-8 text-indigo-100 opacity-50 group-hover:text-indigo-200 transition-colors duration-300">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.017 21L16.411 14.5C14.017 14.5 14.017 10.5 14.017 10.5V3H21V10.5C21 16.5 17.5 21 17.5 21H14.017ZM3 21L5.394 14.5C3 14.5 3 10.5 3 10.5V3H10V10.5C10 16.5 6.5 21 6.5 21H3Z" />
                  </svg>
                </div>

                {/* Rating */}
                <div className="flex space-x-1 mb-6 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-8 leading-relaxed text-lg relative z-10 flex-grow font-medium">
                  "{testimonial.content}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 mt-auto relative z-10 border-t border-gray-100/50 pt-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ModernCTA 
        title="Ready to Start Your Project?"
        subtitle="Let's discuss how we can help bring your vision to life with cutting-edge technology and exceptional design."
        primaryText="Get Started Today"
        primaryLink="/contact"
        secondaryText="View Our Services"
        secondaryLink="/services"
      />
    </div>
  );
}