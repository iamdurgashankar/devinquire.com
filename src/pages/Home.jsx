import { Link } from "react-router-dom";
import ModernCTA from "../components/ModernCTA";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Palette,
  Rocket,
  Settings,
  Target,
  Smile,
  Star,
  Shield,
  Code,
  Zap,
  Globe,
  ArrowUp,
  ArrowRight,
  CheckCircle2,
  Bot,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import SEO from "../components/SEO";

// Service Real Stock Images
import webDevImg from "../images/stock/custom-website-development.jpg";
import mobileDevImg from "../images/stock/mobile-app-development.jpg";
import uiUxImg from "../images/stock/brand-interface-design.jpg";

// Product Real Stock Images
import aiBotImg from "../images/stock/ai-chatbot-assistant.jpg";
import analyticsImg from "../images/stock/data-analytics-suite.jpg";
import ecommerceProductImg from "../images/stock/ecommerce-suite-platform.jpg";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    {
      image: webDevImg,
      icon: Monitor,
      tint: "from-[#6B63F2] to-[#4e45e1]",
      title: "Web Engineering",
      description:
        "High-performance, responsive web platforms engineered with modern React, Next.js, and cloud-native backends.",
      features: ["React & Next.js", "Node.js Microservices", "Database Architecture", "API Ecosystems"],
    },
    {
      image: mobileDevImg,
      icon: Smartphone,
      tint: "from-[#6B63F2] to-[#4139BF]",
      title: "Mobile Experiences",
      description:
        "Fluid native and cross-platform iOS and Android applications designed with human interface precision.",
      features: ["React Native & Swift", "60fps Animations", "App Store Launch", "Offline-First Sync"],
    },
    {
      image: uiUxImg,
      icon: Palette,
      tint: "from-[#6B63F2] to-[#4e45e1]",
      title: "Human Interface Design",
      description:
        "Apple-inspired design systems, spatial clarity, and intuitive user journeys that elevate your brand.",
      features: ["Design Systems", "Interactive Prototypes", "Usability Research", "Brand Identity"],
    },
  ];

  const products = [
    {
      image: aiBotImg,
      icon: Bot,
      tint: "from-[#6B63F2] to-[#4139BF]",
      badge: "Apple Intelligence Ready",
      title: "AI Business Assistant",
      description:
        "Context-aware conversational AI agents that automate customer support, lead qualification, and workflows.",
      features: ["Multi-Modal NLP", "24/7 Autonomous Support", "Instant CRM Sync"],
    },
    {
      image: analyticsImg,
      icon: BarChart3,
      tint: "from-[#6B63F2] to-[#4139BF]",
      badge: "Real-Time Telemetry",
      title: "Data Analytics Suite",
      description:
        "Unified telemetry and executive dashboards to track conversion velocity, user retention, and revenue.",
      features: ["Live Event Streams", "Custom Bento Dashboards", "Predictive Insights"],
    },
    {
      image: ecommerceProductImg,
      icon: ShoppingCart,
      tint: "from-[#6B63F2] to-[#4139BF]",
      badge: "High Conversion",
      title: "Next-Gen E-Commerce",
      description:
        "A complete commerce engine for building ultra-fast, high-converting digital storefronts at scale.",
      features: ["Inventory Automation", "One-Tap Checkout", "Global Edge CDN"],
    },
  ];

  const testimonials = [
    {
      name: "Sankalp",
      role: "CEO, DCIT",
      content:
        "DevInquire transformed our outdated website into a modern, high-performing platform that increased our conversions by 300%.",
      avatar: "SJ",
      rating: 5,
    },
    {
      name: "Shivraj",
      role: "Founder, DCIT",
      content:
        "The team at DevInquire delivered our mobile app on time and exceeded our expectations. Highly recommended!",
      avatar: "SR",
      rating: 5,
    },
    {
      name: "Sunil",
      role: "Marketing Director, Kinspire Biz",
      content:
        "Their SEO services helped us climb to the top of search results. Our organic traffic has never been better.",
      avatar: "SK",
      rating: 5,
    },
    {
      name: "Satya",
      role: "Founder, GetFitWithSatya",
      content:
        "DevInquire built an incredible custom fitness console that perfectly manages our member data and workout plans. The user experience is flawless.",
      avatar: "SA",
      rating: 5,
    },
    {
      name: "Biswajit",
      role: "Director, City Hospital",
      content:
        "The OPD console they developed for our hospital streamlined our entire patient management process. It's secure, fast, and incredibly reliable.",
      avatar: "BI",
      rating: 5,
    },
  ];

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

      {/* Back to Top Pill */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="fixed bottom-20 right-6 z-40"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-11 h-11 rounded-full apple-glass flex items-center justify-center text-[var(--apple-text-primary)] hover:text-[var(--apple-blue)] transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
       * Apple Flagship Hero Section with Connecting Dots Network
       * ========================================================= */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden border-b border-[var(--apple-border)]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gradient-to-tr from-[#4e45e1]/15 via-[#6B63F2]/10 to-[#AF52DE]/15 rounded-full blur-[110px]" />

          {/* Subtle 40x40 Circuit Grid */}
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(107,99,242,0.12) 1px, transparent 1px),
                linear-gradient(rgba(107,99,242,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Connecting Dots / Spider Web Circuit Animation */}
          <div className="absolute inset-0 pointer-events-none z-[1] opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Static Base Web Lines for Continuous Constellation Visibility */}
              {[
                { x1: 100, y1: 150, x2: 300, y2: 100 },
                { x1: 300, y1: 100, x2: 500, y2: 200 },
                { x1: 500, y1: 200, x2: 700, y2: 120 },
                { x1: 700, y1: 120, x2: 900, y2: 180 },
                { x1: 900, y1: 180, x2: 1100, y2: 140 },
                { x1: 200, y1: 350, x2: 100, y2: 150 },
                { x1: 400, y1: 400, x2: 300, y2: 100 },
                { x1: 600, y1: 320, x2: 500, y2: 200 },
                { x1: 800, y1: 380, x2: 700, y2: 120 },
                { x1: 1000, y1: 340, x2: 900, y2: 180 },
                { x1: 150, y1: 550, x2: 200, y2: 350 },
                { x1: 350, y1: 600, x2: 400, y2: 400 },
                { x1: 550, y1: 520, x2: 600, y2: 320 },
                { x1: 750, y1: 580, x2: 800, y2: 380 },
                { x1: 950, y1: 540, x2: 1000, y2: 340 },
                { x1: 100, y1: 150, x2: 400, y2: 400 },
                { x1: 300, y1: 100, x2: 600, y2: 320 },
                { x1: 500, y1: 200, x2: 800, y2: 380 },
                { x1: 700, y1: 120, x2: 950, y2: 540 },
                { x1: 200, y1: 350, x2: 550, y2: 520 },
                { x1: 400, y1: 400, x2: 750, y2: 580 },
              ].map((line, i) => (
                <line
                  key={`base-line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--apple-blue)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity={0.18}
                />
              ))}

              {/* Animated Connecting Lines - Spider Web Pattern */}
              {[
                // Horizontal connections
                { x1: 100, y1: 150, x2: 300, y2: 100, delay: 0.2 },
                { x1: 300, y1: 100, x2: 500, y2: 200, delay: 0.6 },
                { x1: 500, y1: 200, x2: 700, y2: 120, delay: 1.0 },
                { x1: 700, y1: 120, x2: 900, y2: 180, delay: 1.4 },
                { x1: 900, y1: 180, x2: 1100, y2: 140, delay: 1.8 },

                // Vertical connections
                { x1: 200, y1: 350, x2: 100, y2: 150, delay: 2.2 },
                { x1: 400, y1: 400, x2: 300, y2: 100, delay: 2.6 },
                { x1: 600, y1: 320, x2: 500, y2: 200, delay: 3.0 },
                { x1: 800, y1: 380, x2: 700, y2: 120, delay: 3.4 },
                { x1: 1000, y1: 340, x2: 900, y2: 180, delay: 3.8 },

                // Cross connections
                { x1: 150, y1: 550, x2: 200, y2: 350, delay: 4.2 },
                { x1: 350, y1: 600, x2: 400, y2: 400, delay: 4.6 },
                { x1: 550, y1: 520, x2: 600, y2: 320, delay: 5.0 },
                { x1: 750, y1: 580, x2: 800, y2: 380, delay: 5.4 },
                { x1: 950, y1: 540, x2: 1000, y2: 340, delay: 5.8 },

                // Diagonal web connections
                { x1: 100, y1: 150, x2: 400, y2: 400, delay: 6.2 },
                { x1: 300, y1: 100, x2: 600, y2: 320, delay: 6.6 },
                { x1: 500, y1: 200, x2: 800, y2: 380, delay: 7.0 },
                { x1: 700, y1: 120, x2: 950, y2: 540, delay: 7.4 },
                { x1: 200, y1: 350, x2: 550, y2: 520, delay: 7.8 },
                { x1: 400, y1: 400, x2: 750, y2: 580, delay: 8.2 },
              ].map((line, i) => (
                <motion.line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--apple-blue)"
                  strokeWidth="1.5"
                  opacity={0.45}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.65, 0],
                  }}
                  transition={{
                    duration: 3.2,
                    delay: line.delay,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Circuit Nodes (Connecting Dots) */}
              {[
                { x: 100, y: 150, size: 7, delay: 0 },
                { x: 300, y: 100, size: 5.5, delay: 0.3 },
                { x: 500, y: 200, size: 8.5, delay: 0.6 },
                { x: 700, y: 120, size: 6.5, delay: 0.9 },
                { x: 900, y: 180, size: 8, delay: 1.2 },
                { x: 1100, y: 140, size: 5.5, delay: 1.5 },
                { x: 200, y: 350, size: 7, delay: 1.8 },
                { x: 400, y: 400, size: 6.5, delay: 2.1 },
                { x: 600, y: 320, size: 8, delay: 2.4 },
                { x: 800, y: 380, size: 7, delay: 2.7 },
                { x: 1000, y: 340, size: 5.5, delay: 3.0 },
                { x: 150, y: 550, size: 6.5, delay: 3.3 },
                { x: 350, y: 600, size: 7, delay: 3.6 },
                { x: 550, y: 520, size: 8.5, delay: 3.9 },
                { x: 750, y: 580, size: 6.5, delay: 4.2 },
                { x: 950, y: 540, size: 8, delay: 4.5 },
              ].map((node, i) => (
                <g key={`node-group-${i}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 1.8}
                    fill="var(--apple-blue)"
                    opacity={0.12}
                  />
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill="var(--apple-blue)"
                    opacity={0.65}
                    initial={{ scale: 0.6, opacity: 0.3 }}
                    animate={{
                      scale: [0.85, 1.25, 0.95],
                      opacity: [0.35, 0.85, 0.5],
                    }}
                    transition={{
                      duration: 2.4,
                      delay: node.delay,
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 2,
                    }}
                  />
                </g>
              ))}

              {/* Data Pulse Animation */}
              {[
                { startX: 100, startY: 150, endX: 500, endY: 200, delay: 1 },
                { startX: 500, startY: 200, endX: 900, endY: 180, delay: 2.5 },
                { startX: 200, startY: 350, endX: 600, endY: 320, delay: 4 },
                { startX: 600, startY: 320, endX: 1000, endY: 340, delay: 5.5 },
                { startX: 150, startY: 550, endX: 550, endY: 520, delay: 7 },
              ].map((pulse, i) => (
                <motion.circle
                  key={`pulse-${i}`}
                  r="3.5"
                  fill="var(--apple-purple)"
                  opacity={0.85}
                  initial={{
                    cx: pulse.startX,
                    cy: pulse.startY,
                    scale: 0,
                  }}
                  animate={{
                    cx: [pulse.startX, pulse.endX, pulse.startX],
                    cy: [pulse.startY, pulse.endY, pulse.startY],
                    scale: [0, 1.2, 0],
                  }}
                  transition={{
                    duration: 4,
                    delay: pulse.delay,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Apple Release Eyebrow Pill */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full apple-subcard mb-7"
            >
              <span className="w-2 h-2 rounded-full bg-[#28CD41] shadow-[0_0_8px_#28CD41]" />
              <span className="text-[12px] font-semibold tracking-tight text-[var(--apple-text-secondary)]">
                DevInquire · Custom Software &amp; AI Engineering
              </span>
            </motion.div>

            {/* Display Headline */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.035em] text-[var(--apple-text-primary)] mb-6 leading-[1.05]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              Building Tomorrow&apos;s{" "}
              <span className="bg-gradient-to-r from-[#4e45e1] via-[#6B63F2] to-[#AF52DE] bg-clip-text text-transparent">
                Digital Products.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-[var(--apple-text-secondary)] max-w-3xl mx-auto leading-relaxed font-normal mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
            >
              Full-stack web platforms, native mobile experiences, and intelligent cloud infrastructure crafted with precision, speed, and clarity.
            </motion.p>

            {/* Primary & Secondary Apple Pill CTAs */}
            <motion.div
              className="apple-btn-pair flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
            >
              <Link
                to="/services"
                className="w-full sm:w-auto apple-pill-btn px-8 py-3.5 rounded-full font-semibold text-[15px] inline-flex items-center justify-center gap-2 group"
              >
                <span className="badge-white">Explore Our Services</span>
                <ArrowRight className="w-4 h-4 badge-white group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/contact"
                className="w-full sm:w-auto apple-secondary-btn px-8 py-3.5 rounded-full font-semibold text-[15px] inline-flex items-center justify-center gap-2"
              >
                <span>Start Your Project</span>
              </Link>
            </motion.div>
          </div>

          {/* macOS Studio Showcase Window + Bento Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left: macOS Architecture Window */}
            <div className="lg:col-span-7 apple-card overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-3.5 border-b border-[var(--apple-border)] flex items-center justify-between apple-subcard">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <span className="text-[12px] font-mono text-[var(--apple-text-tertiary)]">
                  devinquire-cloud-runtime.ts
                </span>
                <span className="text-[11px] font-semibold text-[#28CD41] px-2.5 py-0.5 rounded-full bg-[#28CD41]/10">
                  99.98% Uptime
                </span>
              </div>

              <div className="p-6 sm:p-8 font-mono text-[13px] sm:text-[14px] space-y-2.5 text-left">
                <div className="text-[var(--apple-text-tertiary)]">
                  // Production deployment pipeline
                </div>
                <div>
                  <span className="text-[#AF52DE]">import</span>{" "}
                  <span className="text-[var(--apple-text-primary)]">
                    &#123; DevInquireCloud, AI Engine &#125;
                  </span>{" "}
                  <span className="text-[#AF52DE]">from</span>{" "}
                  <span className="text-[#28CD41]">&apos;@devinquire/core&apos;</span>;
                </div>
                <div className="pt-1">
                  <span className="text-[var(--apple-blue)]">const</span>{" "}
                  <span className="text-[var(--apple-text-primary)]">platform</span> ={" "}
                  <span className="text-[#AF52DE]">await</span>{" "}
                  <span className="text-[var(--apple-text-primary)]">
                    DevInquireCloud.launch(&#123;
                  </span>
                </div>
                <div className="pl-5 text-[var(--apple-text-secondary)]">
                  designSystem:{" "}
                  <span className="text-[#28CD41]">&apos;Apple Human Interface&apos;</span>,
                </div>
                <div className="pl-5 text-[var(--apple-text-secondary)]">
                  architecture:{" "}
                  <span className="text-[#28CD41]">&apos;Edge-First Microservices&apos;</span>,
                </div>
                <div className="pl-5 text-[var(--apple-text-secondary)]">
                  performanceScore: <span className="text-[#FF9500]">100</span>,
                </div>
                <div className="text-[var(--apple-text-primary)]">&#125;);</div>
              </div>

              {/* Tech Stack Pills */}
              <div className="px-6 py-4 border-t border-[var(--apple-border)] flex flex-wrap items-center gap-2">
                {[
                  { icon: Code, name: "React 18" },
                  { icon: Zap, name: "Next.js" },
                  { icon: Settings, name: "Node.js" },
                  { icon: Palette, name: "Apple HIG" },
                  { icon: Smartphone, name: "iOS / Android" },
                  { icon: Globe, name: "Cloud Native" },
                ].map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full apple-subcard text-[12px] font-medium text-[var(--apple-text-secondary)]"
                  >
                    <tech.icon className="w-3.5 h-3.5 text-[var(--apple-blue)]" />
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: 2x2 Apple Bento Metric Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                {
                  number: "100+",
                  label: "Projects Delivered",
                  sub: "Global deployments",
                  icon: Rocket,
                  tint: "from-[#6B63F2] to-[#4e45e1]",
                },
                {
                  number: "50+",
                  label: "Happy Clients",
                  sub: "Enterprise & startups",
                  icon: Smile,
                  tint: "from-[#6B63F2] to-[#4139BF]",
                },
                {
                  number: "6+ Yrs",
                  label: "Engineering Excellence",
                  sub: "Full-stack mastery",
                  icon: Settings,
                  tint: "from-[#6B63F2] to-[#4e45e1]",
                },
                {
                  number: "100%",
                  label: "Client Satisfaction",
                  sub: "24/7 SLA support",
                  icon: Star,
                  tint: "from-[#6B63F2] to-[#4e45e1]",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="apple-card apple-card-interactive p-6 flex flex-col justify-between"
                >
                  <div
                    className={`w-10 h-10 rounded-[12px] bg-gradient-to-b ${stat.tint} flex items-center justify-center shadow-sm mb-4`}
                  >
                    <stat.icon className="w-5 h-5 text-white badge-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-[var(--apple-text-primary)]">
                      {stat.number}
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--apple-text-secondary)] mt-0.5">
                      {stat.label}
                    </div>
                    <div className="text-[11px] text-[var(--apple-text-tertiary)] mt-0.5">
                      {stat.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
       * Services Bento Grid Section
       * ========================================================= */}
      <section className="py-20 md:py-24 relative" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-blue)]">
                Capabilities
              </span>
              <h2
                id="services-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-[var(--apple-text-primary)] mt-1"
              >
                Engineered for Scale.
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--apple-blue)] hover:underline group"
            >
              <span>View All 9 Services</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7" role="list">
            {services.map((service, index) => (
              <motion.article
                key={index}
                className="apple-card apple-card-interactive overflow-hidden flex flex-col group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                role="listitem"
              >
                <div className="relative h-48 overflow-hidden border-b border-[var(--apple-border)] bg-[var(--apple-surface-subcard)]">
                  <img
                    src={service.image}
                    alt={`${service.title} - ${service.description}`}
                    title={`${service.title} by DevInquire`}
                    width="900"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div
                    className={`absolute top-4 left-4 w-10 h-10 rounded-[12px] bg-gradient-to-b ${service.tint} flex items-center justify-center shadow-md`}
                  >
                    <service.icon className="w-5 h-5 text-white badge-white" />
                  </div>
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[var(--apple-text-primary)] mb-2.5">
                    {service.title}
                  </h3>
                  <p className="text-[14px] text-[var(--apple-text-secondary)] leading-relaxed mb-6 flex-1">
                    {service.description}
                  </p>

                  <ul className="space-y-2 pt-4 border-t border-[var(--apple-border)]">
                    {service.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-[13px] font-medium text-[var(--apple-text-secondary)]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#28CD41] mr-2.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
       * Flagship Products Bento Section
       * ========================================================= */}
      <section
        className="py-20 md:py-24 border-t border-[var(--apple-border)] relative"
        aria-labelledby="products-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-purple)]">
                Product Ecosystem
              </span>
              <h2
                id="products-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-[var(--apple-text-primary)] mt-1"
              >
                Turnkey Software Platforms.
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--apple-blue)] hover:underline group"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7" role="list">
            {products.map((product, index) => (
              <motion.article
                key={index}
                className="apple-card apple-card-interactive overflow-hidden flex flex-col group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                role="listitem"
              >
                <div className="relative h-52 overflow-hidden border-b border-[var(--apple-border)] bg-[var(--apple-surface-subcard)]">
                  <img
                    src={product.image}
                    alt={`${product.title} - ${product.description}`}
                    title={`${product.title} by DevInquire`}
                    width="900"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full apple-glass text-[11px] font-semibold text-[var(--apple-text-primary)]">
                    {product.badge}
                  </div>
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-[10px] bg-gradient-to-b ${product.tint} flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <product.icon className="w-4 h-4 text-white badge-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--apple-text-primary)]">
                      {product.title}
                    </h3>
                  </div>

                  <p className="text-[14px] text-[var(--apple-text-secondary)] leading-relaxed mb-6 flex-1">
                    {product.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-[13px] font-medium text-[var(--apple-text-secondary)]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--apple-blue)] mr-2.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-[var(--apple-border)]">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--apple-blue)] group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Learn more</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
       * Apple Glass Testimonials Marquee
       * ========================================================= */}
      <section
        className="py-20 md:py-24 border-t border-[var(--apple-border)] relative overflow-hidden"
        aria-labelledby="testimonials-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-blue)]">
            Client Stories
          </span>
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-[var(--apple-text-primary)] mt-1 mb-3"
          >
            Trusted by Visionary Teams.
          </h2>
          <p className="text-[16px] text-[var(--apple-text-secondary)]">
            Real outcomes from leaders who partnered with DevInquire.
          </p>
        </div>

        <div className="relative w-full overflow-hidden pb-6 [mask-image:_linear-gradient(to_right,transparent_0,_black_96px,_black_calc(100%-96px),transparent_100%)]">
          <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused] gap-6 px-4">
            {[1, 2]
              .flatMap(() => testimonials)
              .map((testimonial, index) => (
                <article
                  key={index}
                  className="w-[340px] md:w-[390px] flex-shrink-0 whitespace-normal apple-card p-7 flex flex-col justify-between"
                  aria-label={`Testimonial from ${testimonial.name}, ${testimonial.role}`}
                >
                  <div>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-[#FF9500] text-[#FF9500]"
                        />
                      ))}
                    </div>
                    <p className="text-[14px] text-[var(--apple-text-primary)] leading-relaxed mb-6">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[var(--apple-border)]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] flex items-center justify-center text-white font-bold text-xs badge-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--apple-text-primary)]">
                        {testimonial.name}
                      </div>
                      <div className="text-[12px] text-[var(--apple-text-tertiary)]">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>

      <ModernCTA />
    </div>
  );
}
