import { Link } from "react-router-dom";
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
import cloudImg from '../images/services/cloud.png';
import performanceImg from '../images/services/performance.png';
import customImg from '../images/services/custom.png';

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
        className="fixed w-6 h-6 bg-indigo-500/30 rounded-full pointer-events-none z-50 mix-blend-difference hidden lg:block"
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
              className="group w-14 h-14 bg-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white hover:scale-110 border border-white/20 backdrop-blur-sm"
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
        className="relative bg-[#0a0a0c] text-white overflow-hidden min-h-screen flex items-center"
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
                  fill="#6366f1"
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
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(174,151,239,0.1) 1px, transparent 1px),
                linear-gradient(rgba(174,151,239,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Additional dark glass effect layers */}
          <div className="absolute inset-0 bg-slate-800/20"></div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
          <div className="text-center">
            {/* Enhanced Professional Badge */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                Professional Development Solutions
                <span className="ml-3 text-xs text-slate-300">✨</span>
              </span>
            </motion.div>

            {/* Main Title with Enhanced Animation */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight"
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
              <div className="text-2xl md:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                <span className="text-white font-medium">
                  Building Tomorrow's Digital Solutions
                </span>
                <br />
                <span className="text-slate-400">Full-Stack Development • Mobile Apps • Cloud Solutions</span>
              </div>
            </motion.div>

            {/* Professional Description */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
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
                className="group relative bg-indigo-600 hover:bg-indigo-500 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)] overflow-hidden border border-indigo-500/30 w-full sm:w-auto min-w-0 flex-shrink-0"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="truncate">View Our Services</span>
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/contact"
                className="group relative border-2 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 overflow-hidden backdrop-blur-sm w-full sm:w-auto min-w-0 flex-shrink-0"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="truncate">Start Your Project</span>
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-slate-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
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
                  <div className="premium-card backdrop-blur-xl bg-white/5 p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 shadow-lg">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="w-10 h-10 mx-auto text-indigo-500 group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <div className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors duration-300">{stat.number}</div>
                    <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Professional Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
            <motion.div
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.div>
          </div>
        </motion.div>

        {/* Floating tech stack with animations */}
        <div className="absolute top-1/4 right-10 hidden lg:block">
          <div className="space-y-4">
            {[
              { icon: Code, name: "React", color: "#0077b6" },
              { icon: Zap, name: "Next.js", color: "#0077b6" },
              { icon: Settings, name: "Node.js", color: "#0077b6" },
              { icon: Palette, name: "Tailwind", color: "#0077b6" },
              { icon: Smartphone, name: "Mobile", color: "#0077b6" },
              { icon: Globe, name: "Web3", color: "#0077b6" }
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
                  className="absolute inset-0 bg-[#0077b6] opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                />
                <div className="group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <tech.icon className="w-6 h-6 text-white" />
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
            className="w-80 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-600/50 overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="flex items-center space-x-2 p-3 bg-slate-700/50 border-b border-slate-600/50">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-xs text-slate-400 ml-2">main.js</div>
            </div>
            <div className="p-4 font-mono text-sm">
              <div className="text-green-400">
                const app = new App();
              </div>
              <div className="text-blue-400">app.initialize();</div>
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
      <section className="py-24 bg-[#0a0a0c] relative overflow-hidden" aria-labelledby="services-heading">
        {/* Background decoration */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-20 right-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-16">
            <motion.h2
              id="services-heading"
              className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Our Expertise
            </motion.h2>
            <motion.p
              className="text-xl text-slate-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Building next-generation digital products with precision and passion.
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
            {[
              {
                image: webDevImg,
                title: "Web Development",
                description: "Modern, responsive websites and web applications",
                features: ["React/Next.js", "Node.js", "Database Design", "API Integration"],
                gradient: "#0077b6",
                bgGradient: "bg-blue-50"
              },
              {
                image: mobileDevImg,
                title: "Mobile Development",
                description: "Native and cross-platform mobile applications",
                features: ["React Native", "iOS/Android", "App Store", "Performance"],
                gradient: "#0077b6",
                bgGradient: "bg-[#0077b6]/10"
              },
              {
                image: uiUxImg,
                title: "UI/UX Design",
                description: "Beautiful and intuitive user interfaces",
                features: ["Wireframing", "Prototyping", "User Testing", "Design Systems"],
                gradient: "#0077b6",
                bgGradient: "bg-green-50"
              },
              {
                image: cloudImg,
                title: "Cloud Solutions",
                description: "Scalable cloud infrastructure and deployment",
                features: ["AWS/Azure", "Docker", "CI/CD", "Monitoring"],
                gradient: "#0077b6",
                bgGradient: "bg-orange-50"
              },
              {
                image: performanceImg,
                title: "Performance",
                description: "Optimization and maintenance to keep your applications fast",
                features: ["Speed Optimization", "Caching", "CDN", "Monitoring"],
                gradient: "#0077b6",
                bgGradient: "bg-indigo-50"
              },
              {
                image: customImg,
                title: "Custom Solutions",
                description: "Tailored development solutions for your specific requirements",
                features: ["API Development", "Database Design", "Cloud Solutions", "Integration"],
                gradient: "#0077b6",
                bgGradient: "bg-teal-50"
              }
            ].map((service, index) => (
              <motion.article
                key={index}
                className="premium-card relative overflow-hidden group transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                role="listitem"
                aria-labelledby={`service-${index}-title`}
              >
                {/* Service Image Header */}
                <div className="h-48 overflow-hidden relative">
                  <motion.img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-60"></div>
                </div>

                <div className="p-8 relative z-10 -mt-6">
                  <h3 id={`service-${index}-title`} className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors duration-300">
                    {service.title}
                  </h3>

                  <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  {/* Enhanced Features list */}
                  <ul className="space-y-3" aria-label={`${service.title} features`}>
                    {service.features.map((feature, featureIndex) => (
                      <motion.li
                        key={featureIndex}
                        className="flex items-center text-sm text-slate-500"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.1) + (featureIndex * 0.05) }}
                      >
                        <motion.div
                          className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: featureIndex * 0.2
                          }}
                          aria-hidden="true"
                        ></motion.div>
                        <span className="font-medium group-hover:text-slate-300 transition-colors duration-300">{feature}</span>
                      </motion.li>
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
              className="group inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg transition-all duration-300"
            >
              View All Services
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-24 bg-indigo-600 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
                <div className="premium-glass backdrop-blur-xl bg-white/10 rounded-2xl p-8 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 border border-white/20">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">
                    <stat.icon className="w-12 h-12 mx-auto text-white group-hover:text-indigo-200 transition-colors duration-300" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold group-hover:text-indigo-100 transition-colors duration-300">{stat.number}</div>
                  <div className="text-indigo-100 group-hover:text-white transition-colors duration-300">{stat.label}</div>
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
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
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

          {/* Interactive Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto" role="region" aria-labelledby="testimonials-heading" aria-live="polite">
            <div className="overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                {[
                  {
                    name: "Sankalp",
                    role: "CEO, DCIT",
                    content: "DevInquire transformed our outdated website into a modern, high-performing platform that increased our conversions by 300%.",
                    avatar: "SJ",
                    rating: 5,
                    gradient: "#0077b6"
                  },
                  {
                    name: "Shivraj",
                    role: "Founder, DCIT",
                    content: "The team at DevInquire delivered our mobile app on time and exceeded our expectations. Highly recommended!",
                    avatar: "MC",
                    rating: 5,
                    gradient: "#0077b6"
                  },
                  {
                    name: "Sunil",
                    role: "Marketing Director, Kinspire Biz",
                    content: "Their SEO services helped us climb to the top of search results. Our organic traffic has never been better.",
                    avatar: "ER",
                    rating: 5,
                    gradient: "#0077b6"
                  }
                ].map((testimonial, index) => (
                  currentTestimonial === index && (
                    <motion.article
                      key={index}
                      initial={{ opacity: 0, x: 100, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.8 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden"
                      aria-label={`Testimonial from ${testimonial.name}, ${testimonial.role}`}
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-[#0077b6] opacity-5" aria-hidden="true"></div>

                      <div className="relative z-10 text-center">
                        {/* Large Quote Icon */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="text-6xl text-gray-200 mb-6"
                          aria-hidden="true"
                        >
                          "
                        </motion.div>

                        {/* Avatar */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="w-20 h-20 bg-[#0077b6] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6"
                          role="img"
                          aria-label={`Avatar for ${testimonial.name}`}
                        >
                          {testimonial.avatar}
                        </motion.div>

                        {/* Content */}
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="text-lg text-gray-700 mb-6 italic leading-relaxed"
                        >
                          {testimonial.content}
                        </motion.p>

                        {/* Name and Role */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="mb-4"
                        >
                          <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                          <p className="text-gray-600">{testimonial.role}</p>
                        </motion.div>

                        {/* Rating */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          className="flex justify-center space-x-1"
                        >
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, rotate: -180 }}
                              animate={{ opacity: 1, rotate: 0 }}
                              transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
                              className="text-yellow-400"
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.article>
                  )
                ))}
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => setCurrentTestimonial(prev => prev === 0 ? 2 : prev - 1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentTestimonial(prev => prev === 0 ? 2 : prev - 1);
                  }
                }}
                className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Previous testimonial"
                tabIndex={0}
              >
                <motion.div
                  whileHover={{ x: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                </motion.div>
              </button>
              <button
                onClick={() => setCurrentTestimonial(prev => prev === 2 ? 0 : prev + 1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentTestimonial(prev => prev === 2 ? 0 : prev + 1);
                  }
                }}
                className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Next testimonial"
                tabIndex={0}
              >
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </motion.div>
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2" role="tablist" aria-label="Testimonial navigation">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentTestimonial(index);
                    }
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${currentTestimonial === index
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  role="tab"
                  aria-selected={currentTestimonial === index}
                  aria-label={`Go to testimonial ${index + 1}`}
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section - Professional Banner Style */}
      <section className="py-16 bg-gray-50 flex items-center justify-center" aria-labelledby="cta-heading">
        <div className="w-full max-w-[1140px] h-[400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full h-full bg-[#0077b6] rounded-3xl shadow-2xl overflow-hidden" role="banner">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0" aria-hidden="true">
              {/* Geometric Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="200" height="200" fill="url(#grid)" />
                </svg>
              </div>

              {/* Floating Code Icons */}
              <div className="absolute top-8 left-8 text-white/20" aria-hidden="true">
                <Code className="w-12 h-12" />
              </div>
              <div className="absolute bottom-8 right-8 text-white/20" aria-hidden="true">
                <Rocket className="w-10 h-10" />
              </div>
              <div className="absolute top-1/2 left-12 text-white/15" aria-hidden="true">
                <Zap className="w-8 h-8" />
              </div>

              {/* Animated Gradient Orbs */}
              <motion.div
                className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.6, 0.3, 0.6]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
              {/* Icon Badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mb-6 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <Rocket className="w-8 h-8 text-white" />
              </motion.div>

              {/* Main Heading */}
              <motion.h2
                id="cta-heading"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              >
                Ready to Start Your Project?
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg lg:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed"
              >
                Let's discuss how we can help bring your vision to life with cutting-edge technology and exceptional design.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
                role="group"
                aria-label="Call to action buttons"
              >
                <Link
                  to="/services"
                  className="group relative bg-white text-[var(--primary)] hover:bg-gray-50 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started Today
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Rocket className="w-5 h-5" />
                    </motion.div>
                  </span>
                </Link>
                <Link
                  to="/blog"
                  className="group relative border-2 border-white/50 backdrop-blur-sm text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:border-white"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Learn More
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Globe className="w-5 h-5" />
                    </motion.div>
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Bottom Decorative Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
          </div>
        </div>
      </section>
    </div>
  );
}