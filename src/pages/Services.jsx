import { motion } from "framer-motion";
import {
  Monitor,
  Rocket,
  RefreshCw,
  Layout,
  ShieldCheck,
  Cpu,
  Zap,
  Layers,
  Puzzle,
  Smartphone,
  Search,
  Palette,
  ShoppingCart,
  X,
  Mail,
  User,
  MessageSquare,
  Phone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import PageLayout from "../components/PageLayout";
import SEO from "../components/SEO";
import ModernCTA from "../components/ModernCTA";
import {
  responsiveTypography,
  responsiveSpacing,
  responsiveContainers,
} from "../utils/responsive";
import { submitContactForm } from "../services/emailService";

// Service Real Stock Images
import migrationImg from "../images/stock/website-migration-redesign.jpg";
import landingPageImg from "../images/stock/landing-page-development.jpg";
import maintenanceImg from "../images/stock/web-maintenance-support.jpg";
import devImg from "../images/stock/custom-website-development.jpg";
import webAppImg from "../images/stock/web-application-development.jpg";
import mobileAppImg from "../images/stock/mobile-app-development.jpg";
import seoImg from "../images/stock/seo-growth-engineering.jpg";
import brandingImg from "../images/stock/brand-interface-design.jpg";
import ecommerceImg from "../images/stock/ecommerce-engineering.jpg";

const services = [
  {
    image: migrationImg,
    icon: RefreshCw,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Website Migration & Redesign",
    description:
      "Seamless architecture migration and modern Apple-grade UI rebuilds for legacy websites.",
    features: [
      "Zero-Downtime Migration",
      "Modern UI Redesign",
      "Custom Design Systems",
      "SEO & Core Web Vitals Boost",
    ],
    technologies: ["React", "Next.js", "WordPress", "PHP", "Performance Audit"],
  },
  {
    image: landingPageImg,
    icon: Layout,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Landing Page Development",
    description:
      "High-conversion, ultra-fast landing systems tailored for product launches and growth campaigns.",
    features: [
      "Interactive Launch Pages",
      "Lead Conversion Architecture",
      "Mobile-First Precision",
      "A/B Telemetry Ready",
    ],
    technologies: ["React", "Tailwind CSS", "Framer Motion", "Analytics"],
  },
  {
    image: maintenanceImg,
    icon: ShieldCheck,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Web Maintenance Plans",
    description:
      "Proactive monthly engineering support to keep your digital infrastructure secure and fast.",
    features: [
      "Zero-Day Security Patching",
      "Speed & Database Tuning",
      "Automated Cloud Backups",
      "Priority Feature Updates",
    ],
    technologies: ["Security Suite", "Cloud Monitoring", "AWS", "Backups"],
  },
  {
    image: devImg,
    icon: Monitor,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Custom Website Development",
    description:
      "Bespoke websites engineered with modern frameworks, fluid animations, and responsive layouts.",
    features: [
      "Responsive Bento Layouts",
      "Technical SEO Built-in",
      "Sub-Second Page Loads",
      "Headless CMS Integration",
    ],
    technologies: ["React", "Next.js", "Node.js", "PostgreSQL", "AWS", "Vercel"],
  },
  {
    image: webAppImg,
    icon: Rocket,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Web Application Development",
    description:
      "Full-stack SaaS and enterprise web applications with real-time collaboration and scalability.",
    features: [
      "Distributed Cloud Backend",
      "Relational & NoSQL Schemas",
      "REST & GraphQL APIs",
      "Role-Based Access Control",
    ],
    technologies: ["React", "Express.js", "PostgreSQL", "Supabase", "Docker"],
  },
  {
    image: mobileAppImg,
    icon: Smartphone,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Mobile Application Development",
    description:
      "Native-grade iOS and Android applications built for fluid touch interactions and offline resilience.",
    features: [
      "iOS & Android Native Feel",
      "Cross-Platform Velocity",
      "Push Notification Engine",
      "App Store & Play Store Launch",
    ],
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Supabase"],
  },
  {
    image: seoImg,
    icon: Search,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "SEO & Growth Engineering",
    description:
      "Data-driven search engine optimization and technical schema engineering to dominate rankings.",
    features: [
      "Technical SEO Audits",
      "Core Web Vitals Optimization",
      "Structured JSON-LD Schema",
      "Organic Authority Strategy",
    ],
    technologies: ["Search Console", "Core Web Vitals", "Schema.org", "Analytics"],
  },
  {
    image: brandingImg,
    icon: Palette,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "Brand & Interface Design",
    description:
      "Cohesive visual identity systems, iconography, and human interface guidelines for modern brands.",
    features: [
      "Design Token Libraries",
      "Brand Identity & Guidelines",
      "Interactive Figma Systems",
      "Motion & Micro-Interactions",
    ],
    technologies: ["Figma", "Design Systems", "Illustrator", "Motion Design"],
  },
  {
    image: ecommerceImg,
    icon: ShoppingCart,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "E-Commerce Engineering",
    description:
      "Scalable digital storefronts with frictionless checkout, global payments, and live inventory.",
    features: [
      "Custom Storefront UI",
      "Stripe & Global Payments",
      "Real-Time Inventory Sync",
      "Customer Analytics Portal",
    ],
    technologies: ["Next.js Commerce", "Stripe", "Shopify", "Node.js"],
  },
];

const ecosystemItems = [
  {
    icon: Cpu,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "AI-Powered Tools",
    subtitle: "Accelerate your workflow",
    description:
      "Including ATS Resume Checker, Resume Builder, and automated SEO Meta Generators.",
    badge: "Phase 2",
  },
  {
    icon: Layers,
    tint: "from-[#6B63F2] to-[#4139BF]",
    title: "CMS Extensions",
    subtitle: "Extend your platform",
    description:
      "Custom page builder modules, conversion CTAs, and instant communication integrations.",
    badge: "Phase 3",
  },
  {
    icon: Zap,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Browser Extensions",
    subtitle: "Productivity first",
    description:
      "UI Inspectors (PixelPerfecter) and contextual AI explainers (QuickExplain).",
    badge: "New",
  },
  {
    icon: Puzzle,
    tint: "from-[#6B63F2] to-[#4e45e1]",
    title: "Apple UI Kits",
    subtitle: "Jumpstart development",
    description:
      "Production-ready React dashboards, portfolios, and liquid-glass component kits.",
    badge: "Scaling",
  },
];

export default function Services() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const payload = {
        ...formData,
        subject: formData.service
          ? `Service Inquiry: ${formData.service}`
          : "General Service Inquiry",
        message:
          formData.message.trim() ||
          `Inquiry regarding ${formData.service || "your services"}.`,
      };

      const response = await submitContactForm(payload);

      if (response.success) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", service: "", message: "" });
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitStatus("");
        }, 2200);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Service inquiry submission error:", error);
      setSubmitStatus("error");
    }

    setIsSubmitting(false);
  };

  const openModal = (serviceName) => {
    setFormData((prev) => ({ ...prev, service: serviceName }));
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
        badge="Capabilities"
        title="Our Services"
        subtitle="End-to-end digital engineering from human interface design to distributed cloud deployment."
      >
        {/* Services Bento Grid */}
        <section className="pt-4 pb-16 md:pb-20 relative">
          <div className={`relative ${responsiveContainers.standard}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
                  className="apple-card apple-card-interactive overflow-hidden flex flex-col group"
                >
                  <div className="h-48 overflow-hidden relative border-b border-[var(--apple-border)] bg-[var(--apple-surface-subcard)]">
                    <img
                      src={service.image}
                      alt={`${service.title} - ${service.description}`}
                      title={`${service.title} by DevInquire`}
                      width="900"
                      height="600"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className={`absolute top-4 left-4 w-10 h-10 rounded-[12px] bg-gradient-to-b ${service.tint} flex items-center justify-center shadow-md`}
                    >
                      <service.icon className="w-5 h-5 text-white badge-white" />
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[var(--apple-text-primary)] mb-2">
                      {service.title}
                    </h3>
                    <p className="text-[14px] text-[var(--apple-text-secondary)] mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="mb-6 flex-1">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-3">
                        Included Deliverables
                      </h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, featureIndex) => (
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

                    <div className="mb-6">
                      <div className="flex flex-wrap gap-1.5">
                        {service.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2.5 py-1 apple-subcard text-[var(--apple-text-secondary)] text-[11px] font-medium rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--apple-border)]">
                      <button
                        onClick={() => openModal(service.title)}
                        className="w-full apple-pill-btn py-2.5 px-5 rounded-full font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 group/btn"
                      >
                        <span className="badge-white">Configure Project</span>
                        <ArrowRight className="w-3.5 h-3.5 badge-white group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section
          className={`${responsiveSpacing.sectionPadding} border-t border-[var(--apple-border)] relative`}
        >
          <div className={`relative ${responsiveContainers.standard}`}>
            <div className={`text-center ${responsiveSpacing.marginBottomLarge}`}>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-blue)]">
                Execution Methodology
              </span>
              <h2
                className={`${responsiveTypography.sectionTitle} tracking-[-0.025em] text-[var(--apple-text-primary)] mt-1 mb-3`}
              >
                How We Ship
              </h2>
              <p className="text-[16px] text-[var(--apple-text-secondary)] max-w-2xl mx-auto">
                A transparent, four-stage engineering lifecycle designed for predictable delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Discovery",
                  description:
                    "Deep-dive into your product goals, user personas, and technical requirements.",
                },
                {
                  step: "02",
                  title: "Architecture",
                  description:
                    "Interactive wireframes, Apple HIG design tokens, and database schema blueprints.",
                },
                {
                  step: "03",
                  title: "Engineering",
                  description:
                    "Agile sprint execution with automated testing, CI/CD, and live staging previews.",
                },
                {
                  step: "04",
                  title: "Launch & Scale",
                  description:
                    "Global edge deployment, telemetry monitoring, and continuous optimization.",
                },
              ].map((process, index) => (
                <div
                  key={index}
                  className="apple-card p-7 flex flex-col justify-between"
                >
                  <div className="w-11 h-11 rounded-[12px] bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] text-white font-bold text-sm flex items-center justify-center shadow-sm mb-6 badge-white">
                    {process.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--apple-text-primary)] mb-2">
                      {process.title}
                    </h3>
                    <p className="text-[13px] text-[var(--apple-text-secondary)] leading-relaxed">
                      {process.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Ecosystem Section */}
        <section
          className={`${responsiveSpacing.sectionPadding} border-t border-[var(--apple-border)] relative`}
        >
          <div className={`relative ${responsiveContainers.standard}`}>
            <div className={`text-center ${responsiveSpacing.marginBottomLarge}`}>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-purple)]">
                R&amp;D Labs
              </span>
              <h2
                className={`${responsiveTypography.sectionTitle} tracking-[-0.025em] text-[var(--apple-text-primary)] mt-1 mb-3`}
              >
                Innovative Product Ecosystem
              </h2>
              <p className="text-[16px] text-[var(--apple-text-secondary)] max-w-2xl mx-auto">
                Beyond client engineering, we build internal accelerators and developer tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecosystemItems.map((item, index) => (
                <div
                  key={index}
                  className="apple-card apple-card-interactive p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className={`w-10 h-10 rounded-[12px] bg-gradient-to-b ${item.tint} flex items-center justify-center shadow-sm`}
                    >
                      <item.icon className="w-5 h-5 text-white badge-white" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 apple-subcard text-[var(--apple-text-secondary)] rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[var(--apple-text-primary)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-[var(--apple-blue)] font-medium mb-2.5">
                    {item.subtitle}
                  </p>
                  <p className="text-[13px] text-[var(--apple-text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ModernCTA
          title="Ready to Start Your Project?"
          subtitle="Transform your vision into reality with our engineering studio."
          primaryText="Schedule Consultation"
          primaryLink="/contact"
          secondaryText="Explore Products"
          secondaryLink="/products"
        />

        {/* Apple System Sheet Modal for Service Inquiry */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="apple-glass rounded-[24px] max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-[var(--apple-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-[17px] font-semibold text-[var(--apple-text-primary)]">
                    Configure Project Inquiry
                  </h3>
                  <p className="text-[12px] text-[var(--apple-text-tertiary)]">
                    {formData.service || "Custom Engineering Service"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {submitStatus === "success" && (
                  <div className="mb-4 p-3.5 rounded-[14px] bg-[#28CD41]/15 border border-[#28CD41]/30 text-[#28CD41] text-[13px] font-medium">
                    Thank you! Your inquiry has been synced with our team. We&apos;ll respond within 24 hours.
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="mb-4 p-3.5 rounded-[14px] bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-[#FF3B30] text-[13px] font-medium">
                    Something went wrong. Please try again.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        <User className="w-3.5 h-3.5 inline mr-1.5" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                        placeholder="Jane Appleseed"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                        placeholder="jane@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                        Selected Capability
                      </label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 apple-input text-[13px]"
                      >
                        <option value="">Select a service</option>
                        {services.map((s, idx) => (
                          <option key={idx} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[var(--apple-text-secondary)] mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                      Project Brief *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-3.5 py-2.5 apple-input text-[13px] resize-none"
                      placeholder="Share your goals, timeline, and key requirements…"
                    />
                  </div>

                  <div className="apple-btn-pair flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 apple-secondary-btn rounded-full text-[13px] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 apple-pill-btn rounded-full text-[13px] font-semibold disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting…" : "Send Inquiry"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </PageLayout>
    </>
  );
}
