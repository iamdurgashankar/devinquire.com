import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  BarChart3,
  ShoppingCart,
  Bot,
  Smartphone,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import SEO from "../components/SEO";
import ModernCTA from "../components/ModernCTA";
import { responsiveSpacing, responsiveContainers } from "../utils/responsive";

// Product Real Stock Images
import cmsImg from "../images/stock/headless-cms-platform.jpg";
import analyticsImg from "../images/stock/data-analytics-suite.jpg";
import ecommerceImg from "../images/stock/ecommerce-suite-platform.jpg";
import aiBotImg from "../images/stock/ai-chatbot-assistant.jpg";
import mobileImg from "../images/stock/mobile-app-framework.jpg";
import securityImg from "../images/stock/cybersecurity-shield-platform.jpg";

const products = [
  {
    image: cmsImg,
    icon: Globe,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "DevInquire CMS",
    description:
      "A high-velocity headless content management system built for modern digital publishing.",
    features: [
      "Visual Block Editor",
      "Automated SEO Metadata",
      "Multi-Locale Publishing",
      "Edge Webhook Sync",
      "Editorial Analytics",
      "REST & GraphQL API",
    ],
    category: "Software",
    status: "Available",
    technologies: ["React", "Node.js", "PostgreSQL", "AWS"],
  },
  {
    image: analyticsImg,
    icon: BarChart3,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Analytics Pro",
    description:
      "Privacy-first telemetry platform for tracking real-time web performance and conversion funnels.",
    features: [
      "Real-time Event Stream",
      "Custom Executive Reports",
      "User Journey Attribution",
      "A/B Experimentation",
      "Funnel Optimization",
      "One-Click CSV/JSON Export",
    ],
    category: "Analytics",
    status: "Available",
    technologies: ["React", "Python", "PostgreSQL", "Redis"],
  },
  {
    image: ecommerceImg,
    icon: ShoppingCart,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "E-Commerce Suite",
    description:
      "Complete digital commerce engine with global payment processing and live inventory control.",
    features: [
      "Dynamic Product Catalog",
      "Stripe & Apple Pay Ready",
      "Multi-Warehouse Inventory",
      "Real-Time Order Tracking",
      "Customer Loyalty Portal",
      "Mobile Storefront",
    ],
    category: "E-Commerce",
    status: "Available",
    technologies: ["React", "Stripe", "Node.js", "PostgreSQL"],
  },
  {
    image: aiBotImg,
    icon: Bot,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "AI Chatbot Builder",
    description:
      "Intelligent conversational AI platform for 24/7 customer support and automated lead intake.",
    features: [
      "Gemini & LLM Grounding",
      "Omnichannel Deployment",
      "Custom Knowledge Base",
      "Sentiment Telemetry",
      "Webhook Integrations",
      "24/7 Autonomous Triage",
    ],
    category: "AI/ML",
    status: "Available",
    technologies: ["Node.js", "Gemini AI", "React", "WebSockets"],
  },
  {
    image: mobileImg,
    icon: Smartphone,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Mobile App Framework",
    description:
      "Cross-platform mobile starter kit engineered with native gestures and offline-first storage.",
    features: [
      "iOS & Android Parity",
      "60fps Native Animations",
      "Apple HIG Component Kit",
      "Push Notification Hub",
      "Offline SQLite Sync",
      "App Store Fast-Track",
    ],
    category: "Mobile",
    status: "Beta",
    technologies: ["React Native", "Swift", "TypeScript", "AWS"],
  },
  {
    image: securityImg,
    icon: Shield,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Security Shield",
    description:
      "Zero-trust security and rate-limiting suite for enterprise web applications and APIs.",
    features: [
      "Anomaly Threat Detection",
      "Automated TLS/SSL",
      "Role-Based Access Guard",
      "Immutable Audit Logs",
      "SOC2 Readiness Reports",
      "Real-Time Alerting",
    ],
    category: "Security",
    status: "Coming Soon",
    technologies: ["Node.js", "Redis", "Docker", "Cloudflare"],
  },
];

const categories = [
  "All",
  "Software",
  "Analytics",
  "E-Commerce",
  "AI/ML",
  "Mobile",
  "Security",
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const getStatusBadgeStyle = (status) => {
    if (status === "Available") {
      return "bg-[#1E8E3E]/95 text-white border border-white/25 shadow-sm";
    }
    if (status === "Beta") {
      return "bg-[#D97706]/95 text-white border border-white/25 shadow-sm";
    }
    return "bg-[#1D1D1F]/85 text-white border border-white/20 shadow-sm";
  };

  return (
    <>
      <SEO
        title="Our Products - Innovative Software Solutions"
        description="Discover DevInquire's innovative software products including CMS, analytics platforms, e-commerce suites, AI chatbots, and mobile frameworks. Accelerate your business growth with our tools."
        keywords="DevInquire CMS, analytics platform, e-commerce suite, AI chatbot, mobile app framework, security solutions, software products, business tools"
        canonical="https://devinquire.com/products"
        ogTitle="DevInquire Products - Innovative Software Solutions for Business Growth"
        ogDescription="Innovative software solutions from CMS to AI-powered tools. Accelerate your business growth with our comprehensive product suite."
        ogUrl="https://devinquire.com/products"
      />
      <PageLayout
        badge="Product Suite"
        title="Our Products"
        subtitle="Turnkey software platforms engineered to accelerate your business velocity—from headless CMS to autonomous AI agents."
      >
        {/* Apple Segmented Filter Bar */}
        <section className="py-3 sticky top-[68px] z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-start">
            <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-2xl apple-glass">
              {categories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-[var(--apple-blue)] text-white shadow-sm badge-white"
                        : "text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Products Bento Grid */}
        <section className="pt-4 pb-16 md:pb-20 relative">
          <div className={`relative ${responsiveContainers.standard}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="apple-card apple-card-interactive overflow-hidden flex flex-col group"
                >
                  <div className="h-48 overflow-hidden relative border-b border-[var(--apple-border)] bg-[var(--apple-surface-subcard)]">
                    <img
                      src={product.image}
                      alt={`${product.title} - ${product.description}`}
                      title={`${product.title} by DevInquire`}
                      width="900"
                      height="600"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className={`absolute top-4 left-4 w-10 h-10 rounded-[12px] bg-gradient-to-b ${product.tint} flex items-center justify-center shadow-md`}
                    >
                      <product.icon className="w-5 h-5 text-white badge-white" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${getStatusBadgeStyle(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-blue)] mb-1">
                      {product.category}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--apple-text-primary)] mb-2">
                      {product.title}
                    </h3>
                    <p className="text-[14px] text-[var(--apple-text-secondary)] mb-6 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mb-6 flex-1">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-3">
                        Key Capabilities
                      </h4>
                      <ul className="space-y-2">
                        {product.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center text-[13px] text-[var(--apple-text-secondary)]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#28CD41] mr-2.5 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-1.5">
                      {product.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2.5 py-1 apple-subcard text-[var(--apple-text-secondary)] text-[11px] font-medium rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[var(--apple-border)]">
                      <Link
                        to="/contact"
                        className="w-full apple-pill-btn py-2.5 px-5 rounded-full font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 group/btn"
                      >
                        <span className="badge-white">Request Demo</span>
                        <ArrowRight className="w-3.5 h-3.5 badge-white group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <ModernCTA
          title="Ready to Transform Your Workflow?"
          subtitle="Deploy our turnkey platforms or customize them for your enterprise infrastructure."
          primaryText="Contact Product Sales"
          primaryLink="/contact"
          secondaryText="View Engineering Services"
          secondaryLink="/services"
        />
      </PageLayout>
    </>
  );
}
