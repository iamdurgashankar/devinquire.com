import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  BarChart3,
  ShoppingCart,
  Bot,
  Smartphone,
  Shield,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  X,
  User,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import SEO from "../components/SEO";
import ModernCTA from "../components/ModernCTA";
import { responsiveContainers } from "../utils/responsive";
import { submitContactForm } from "../services/emailService";

// Product Real Stock Images
import cmsImg from "../images/stock/headless-cms-platform.jpg";
import analyticsImg from "../images/stock/data-analytics-suite.jpg";
import ecommerceImg from "../images/stock/ecommerce-suite-platform.jpg";
import aiBotImg from "../images/stock/ai-chatbot-assistant.jpg";
import mobileImg from "../images/stock/mobile-app-framework.jpg";
import securityImg from "../images/stock/cybersecurity-shield-platform.jpg";

const products = [
  {
    id: "asknova-ai",
    image: aiBotImg,
    icon: Bot,
    tint: "from-[#6B63F2] to-[#4139BF]",
    name: "AskNova AI",
    tagline: "Your 24/7 Smart Customer Concierge",
    description:
      "Train an AI teammate on your website and docs in minutes—so visitors get instant answers, warm lead capture, and booked calls even while you sleep.",
    bestFor: "Service businesses, SaaS & busy support teams",
    setupTime: "Live in 48 hours",
    features: [
      "Answers in Your Brand Voice",
      "WhatsApp, Web & Email Ready",
      "Instant Lead Qualification",
      "One-Click Human Hand-Off",
      "Learns From Your Docs & FAQs",
      "24/7 Zero-Wait Replies",
    ],
    category: "AI & Automation",
    status: "Ready to Launch",
    highlights: ["24/7 Lead Capture", "No-Code Training", "Omnichannel"],
  },
  {
    id: "cartflow",
    image: ecommerceImg,
    icon: ShoppingCart,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    name: "CartFlow",
    tagline: "1-Click Storefront & Instant Checkout",
    description:
      "Open a lightning-fast online store built to convert browsers into buyers—with smooth UPI, card & wallet payments and automatic stock alerts.",
    bestFor: "D2C brands, retail stores & digital creators",
    setupTime: "Launch in 5–7 days",
    features: [
      "Frictionless 1-Page Checkout",
      "UPI, Cards & Apple Pay Ready",
      "Live Stock & Order Tracking",
      "Promo Codes & Repeat-Buyer Perks",
      "Mobile-First Shopping Speed",
      "Automated GST/Order Receipts",
    ],
    category: "Online Store",
    status: "Ready to Launch",
    highlights: ["UPI + Cards", "Sub-Second Pages", "Auto Inventory"],
  },
  {
    id: "pulsestudio",
    image: cmsImg,
    icon: Globe,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    name: "Pulse Studio",
    tagline: "Publish Pages & Blogs in Minutes",
    description:
      "Edit headlines, launch campaign landing pages, and publish Google-friendly articles visually—without waiting on a developer for every small tweak.",
    bestFor: "Founders, marketing teams & growing agencies",
    setupTime: "Live in 3 days",
    features: [
      "Drag-and-Drop Visual Blocks",
      "Built-In Google SEO Assistant",
      "Instant Live Page Previews",
      "Multi-Author Team Roles",
      "Auto Image Optimization",
      "Connects to Any Website",
    ],
    category: "Content & Web",
    status: "Ready to Launch",
    highlights: ["Zero Coding", "SEO Built-In", "Instant Edits"],
  },
  {
    id: "sightline",
    image: analyticsImg,
    icon: BarChart3,
    tint: "from-[#6B63F2] to-[#4139BF]",
    name: "SightLine",
    tagline: "Live Visitor & Sales Radar",
    description:
      "Skip confusing spreadsheets. See which channels bring real buyers, where visitors drop off, and what grows your revenue on one clean dashboard.",
    bestFor: "Founders, marketers & product leads",
    setupTime: "5-minute snippet",
    features: [
      "Live Visitor Stream",
      "Clear Conversion Funnels",
      "Ad & Channel ROI Tracking",
      "Cookie-Free Privacy Mode",
      "Weekly Growth Digest",
      "1-Click CSV & PDF Reports",
    ],
    category: "Growth & Insights",
    status: "Ready to Launch",
    highlights: ["Privacy-First", "Clear Funnels", "Real-Time ROI"],
  },
  {
    id: "pocketlaunch",
    image: mobileImg,
    icon: Smartphone,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    name: "PocketLaunch",
    tagline: "iOS & Android App Fast-Track",
    description:
      "Go from idea to the App Store and Google Play in half the time—complete with smooth native screens, login, push notifications, and offline mode.",
    bestFor: "Startups & businesses going mobile-first",
    setupTime: "2x faster launch",
    features: [
      "One Codebase for iOS & Android",
      "Silky 60fps Native Feel",
      "Ready-Made Login & Profiles",
      "Targeted Push Notifications",
      "Works Smoothly Offline",
      "App Store Submission Support",
    ],
    category: "Mobile Apps",
    status: "Early Access",
    highlights: ["iOS + Android", "Push Alerts", "Offline Ready"],
  },
  {
    id: "shieldguard",
    image: securityImg,
    icon: Shield,
    tint: "from-[#6B63F2] to-[#4139BF]",
    name: "ShieldGuard",
    tagline: "24/7 App & Customer Data Bodyguard",
    description:
      "Keep bots, spam floods, and intruders away from your website and APIs automatically—with instant WhatsApp/email alerts if anything looks unusual.",
    bestFor: "Platforms handling payments or customer data",
    setupTime: "Same-day shield",
    features: [
      "Smart Bot & Spam Blocking",
      "Auto SSL & Security Headers",
      "Team Role & Login Protection",
      "Tamper-Proof Activity Logs",
      "Compliance-Ready Checklists",
      "Instant Threat Alerts",
    ],
    category: "Security",
    status: "Coming Soon",
    highlights: ["Bot Blocker", "Instant Alerts", "Zero Slowdown"],
  },
];

const categories = [
  "All Tools",
  "AI & Automation",
  "Online Store",
  "Content & Web",
  "Growth & Insights",
  "Mobile Apps",
  "Security",
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All Tools");
  const [activeProduct, setActiveProduct] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const filteredProducts =
    selectedCategory === "All Tools"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const getStatusBadgeStyle = (status) => {
    if (status === "Ready to Launch") {
      return "bg-[#1E8E3E]/95 text-white border border-white/25 shadow-sm";
    }
    if (status === "Early Access") {
      return "bg-[#D97706]/95 text-white border border-white/25 shadow-sm";
    }
    return "bg-[#1D1D1F]/85 text-white border border-white/20 shadow-sm";
  };

  const openProductModal = (product) => {
    setActiveProduct(product);
    setSubmitStatus("");
    setIsDemoModalOpen(true);
  };

  const handleDemoFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");
    try {
      const productLabel = activeProduct
        ? `${activeProduct.name} (${activeProduct.tagline})`
        : "DevInquire Product Suite";
      const response = await submitContactForm({
        ...demoForm,
        product: activeProduct?.name || "Product Suite",
        service: productLabel,
        timeline: activeProduct?.setupTime || "",
        form_source: "Product Demo",
        payment_status: "none",
        subject: `Product Demo Request: ${productLabel}`,
        message:
          demoForm.message.trim() ||
          `Interested in a demo account and product link for ${productLabel}.`,
        form_payload: {
          product_id: activeProduct?.id || "",
          product_name: activeProduct?.name || "",
          product_category: activeProduct?.category || "",
          product_status: activeProduct?.status || "",
          setup_time: activeProduct?.setupTime || "",
        },
      });

      if (response.success) {
        setSubmitStatus("success");
        setDemoForm({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => {
          setIsDemoModalOpen(false);
          setSubmitStatus("");
        }, 3200);
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Product Suite — Ready-to-Launch Tools for Growing Businesses"
        description="Explore DevInquire's ready-to-launch products: AskNova AI, CartFlow, Pulse Studio, SightLine, PocketLaunch, and ShieldGuard—built to help you sell, automate, and scale faster."
        keywords="AskNova AI, CartFlow e-commerce, Pulse Studio CMS, SightLine analytics, PocketLaunch mobile app, ShieldGuard security, DevInquire products"
        canonical="https://devinquire.com/products"
        ogTitle="DevInquire Product Suite — Launch Faster, Grow Smarter"
        ogDescription="Plug-and-play software tools for AI customer support, 1-click online stores, visual content publishing, and live growth insights."
        ogUrl="https://devinquire.com/products"
      />
      <PageLayout
        badge="Product Suite"
        title="Plug-and-Play Tools Built for Growth"
        subtitle="Skip months of custom setup. Pick a ready-made product, tailor it to your brand, and go live in days."
      >
        {/* Interactive Use-Case Filter Bar */}
        <section className="py-3 sticky top-[68px] z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-start">
            <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-2xl apple-glass">
              {categories.map((category) => {
                const active = selectedCategory === category;
                const count =
                  category === "All Tools"
                    ? products.length
                    : products.filter((p) => p.category === category).length;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                      active
                        ? "bg-[var(--apple-blue)] text-white shadow-sm badge-white"
                        : "text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
                    }`}
                  >
                    <span className={active ? "badge-white" : ""}>{category}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? "bg-white/20 text-white badge-white"
                          : "bg-black/5 dark:bg-white/10 text-[var(--apple-text-tertiary)]"
                      }`}
                    >
                      {count}
                    </span>
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
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  onClick={() => openProductModal(product)}
                  className="apple-card apple-card-interactive overflow-hidden flex flex-col group cursor-pointer"
                >
                  <div className="h-48 overflow-hidden relative border-b border-[var(--apple-border)] bg-[var(--apple-surface-subcard)]">
                    <img
                      src={product.image}
                      alt={`${product.name} — ${product.tagline}`}
                      title={`${product.name} by DevInquire`}
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
                    <div className="absolute bottom-3 left-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-medium">
                        <Clock className="w-3 h-3 text-[#28CD41]" />
                        {product.setupTime}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-blue)] mb-1">
                      {product.category}
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-[var(--apple-text-primary)]">
                      {product.name}
                    </h3>
                    <p className="text-[13.5px] font-semibold text-[#4e45e1] dark:text-[#8E87FF] mt-0.5 mb-3">
                      {product.tagline}
                    </p>
                    <p className="text-[14px] text-[var(--apple-text-secondary)] mb-5 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Best For Pill */}
                    <div className="mb-5 p-3 rounded-2xl apple-subcard flex items-start gap-2.5 text-[12px]">
                      <Users className="w-4 h-4 text-[var(--apple-blue)] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[var(--apple-text-primary)]">
                          Best for:{" "}
                        </span>
                        <span className="text-[var(--apple-text-secondary)]">
                          {product.bestFor}
                        </span>
                      </div>
                    </div>

                    <div className="mb-5 flex-1">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-2.5">
                        What You Get
                      </h4>
                      <ul className="space-y-2">
                        {product.features.slice(0, 4).map((feature, featureIndex) => (
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

                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {product.highlights.map((pill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 apple-subcard text-[var(--apple-text-secondary)] text-[11px] font-medium rounded-full"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[var(--apple-border)]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProductModal(product);
                        }}
                        className="w-full apple-pill-btn py-2.5 px-5 rounded-full font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 group/btn"
                      >
                        <span className="badge-white">
                          {product.status === "Coming Soon"
                            ? `Join ${product.name} Waitlist`
                            : `Try ${product.name} Demo`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 badge-white group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <ModernCTA
          title="Not Sure Which Tool Fits Best?"
          subtitle="Tell us where your business is stuck—we'll recommend the right product or tailor it around your exact workflow."
          primaryText="Talk to a Product Specialist"
          primaryLink="/contact"
          secondaryText="Explore Custom Services"
          secondaryLink="/services"
        />

        {/* Interactive Product Walkthrough & Demo Modal */}
        <AnimatePresence>
          {isDemoModalOpen && activeProduct && (
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
              onClick={() => setIsDemoModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className="apple-glass rounded-[26px] max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="px-6 py-4 border-b border-[var(--apple-border)] flex items-center justify-between sticky top-0 z-10 apple-glass">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-[12px] bg-gradient-to-b ${activeProduct.tint} flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <activeProduct.icon className="w-5 h-5 text-white badge-white" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-[var(--apple-text-primary)] leading-tight">
                        {activeProduct.name}
                      </h3>
                      <p className="text-[12px] text-[var(--apple-text-secondary)]">
                        {activeProduct.tagline} · {activeProduct.setupTime}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDemoModalOpen(false)}
                    className="w-8 h-8 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Full Feature Checklist */}
                  <div className="p-4 rounded-2xl apple-subcard">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-2.5">
                      Everything Included in {activeProduct.name}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeProduct.features.map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-[12.5px] text-[var(--apple-text-secondary)]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#28CD41] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {submitStatus === "success" && (
                    <div className="p-3.5 rounded-[14px] bg-[#28CD41]/15 border border-[#28CD41]/30 text-[#248A3D] dark:text-[#30D158] text-[13px] font-medium">
                      Thank you! Your {activeProduct.name} request has been submitted—our team will contact you shortly with your demo account and product link.
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="p-3.5 rounded-[14px] bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-[#FF3B30] text-[13px] font-medium">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <form onSubmit={handleDemoFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                          <User className="w-3.5 h-3.5 inline mr-1.5" />
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={demoForm.name}
                          onChange={(e) =>
                            setDemoForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Aarav Mehta"
                          className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                          <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={demoForm.email}
                          onChange={(e) =>
                            setDemoForm((p) => ({ ...p, email: e.target.value }))
                          }
                          placeholder="aarav@company.com"
                          className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={demoForm.phone}
                        onChange={(e) =>
                          setDemoForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                        How would you like to use {activeProduct.name}? *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={demoForm.message}
                        onChange={(e) =>
                          setDemoForm((p) => ({ ...p, message: e.target.value }))
                        }
                        placeholder={`e.g. Set up ${activeProduct.name} for our website and customize it with our brand…`}
                        className="w-full px-3.5 py-2.5 apple-input text-[13px] resize-none"
                      />
                    </div>

                    <div className="apple-btn-pair flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsDemoModalOpen(false)}
                        className="flex-1 py-2.5 apple-secondary-btn rounded-full text-[13px] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 apple-pill-btn rounded-full text-[13px] font-semibold"
                      >
                        <span className="badge-white">
                          {isSubmitting ? "Submitting…" : "Request Demo Access"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageLayout>
    </>
  );
}
