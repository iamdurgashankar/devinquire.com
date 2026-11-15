import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ArrowUpRight,
  Copy,
  Check,
  Compass,
  Layers,
  Cpu,
  BookOpen,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { responsiveContainers } from "../utils/responsive";

const PAGE_UX_META = {
  "/about": {
    index: "01",
    icon: Compass,
    accent: "#007AFF",
    statLabel: "Studio Track Record",
    statValue: "100+ Products Shipped",
    ctaLabel: "Partner With Us",
    ctaTo: "/contact",
  },
  "/services": {
    index: "02",
    icon: Layers,
    accent: "#5E5CE6",
    statLabel: "Architecture & Delivery",
    statValue: "9 Core Disciplines",
    ctaLabel: "Scope a Project",
    ctaTo: "/contact",
  },
  "/products": {
    index: "03",
    icon: Cpu,
    accent: "#34C759",
    statLabel: "Turnkey Platforms",
    statValue: "6 Production Suites",
    ctaLabel: "Request Live Demo",
    ctaTo: "/contact",
  },
  "/blog": {
    index: "04",
    icon: BookOpen,
    accent: "#FF9F0A",
    statLabel: "Engineering Journal",
    statValue: "Architecture & AI Notes",
    ctaLabel: "Contribute / Inquire",
    ctaTo: "/contact",
  },
  "/contact": {
    index: "05",
    icon: MessageSquare,
    accent: "#30D158",
    statLabel: "Direct Engineering SLA",
    statValue: "< 24h Response Time",
    copyEmail: "contact@devinquire.com",
  },
};

const PageLayout = ({
  title,
  subtitle,
  badge = "DevInquire",
  children,
}) => {
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const meta = PAGE_UX_META[location.pathname] || {
    index: "DI",
    icon: ShieldCheck,
    accent: "#007AFF",
    statLabel: "System Documentation",
    statValue: "Updated & Verified",
    ctaLabel: "Contact Support",
    ctaTo: "/contact",
  };

  const IconComponent = meta.icon;

  const handleCopyEmail = () => {
    if (!meta.copyEmail) return;
    navigator.clipboard?.writeText(meta.copyEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Minimal Apple System Page Header */}
      <header className="relative pt-4 pb-6 md:pt-6 md:pb-8">
        <div className={responsiveContainers.standard}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pb-6 border-b border-[var(--apple-border)]"
          >
            {/* Top Micro-Breadcrumb & Index Row */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <nav
                aria-label="Breadcrumb"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--apple-text-tertiary)]"
              >
                <Link
                  to="/"
                  className="hover:text-[var(--apple-text-primary)] transition-colors"
                >
                  DevInquire
                </Link>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full apple-subcard text-[var(--apple-text-primary)] font-semibold">
                  <IconComponent
                    className="w-3 h-3"
                    style={{ color: meta.accent }}
                  />
                  <span>{badge}</span>
                </span>
              </nav>

              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase text-[var(--apple-text-tertiary)]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: meta.accent }}
                />
                SYS // {meta.index}
              </span>
            </div>

            {/* Minimal Split Title + Unique Interactive UX Capsule */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div className="min-w-0 max-w-2xl">
                <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[var(--apple-text-primary)] leading-[1.1]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[14px] sm:text-[15px] text-[var(--apple-text-secondary)] leading-relaxed mt-2">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Contextual Interactive UX Pill */}
              <div className="apple-subcard rounded-2xl p-2 pl-3.5 flex items-center justify-between sm:justify-start gap-3.5 shrink-0 self-start lg:self-end">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: meta.accent }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: meta.accent }}
                    />
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--apple-text-tertiary)] leading-none">
                      {meta.statLabel}
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--apple-text-primary)] leading-tight mt-0.5">
                      {meta.statValue}
                    </div>
                  </div>
                </div>

                {meta.copyEmail ? (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="apple-secondary-btn px-3 py-1.5 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1.5"
                    title="Copy direct engineering email"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#30D158]" />
                        <span className="text-[#30D158]">Copied Email</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[var(--apple-text-secondary)]" />
                        <span>{meta.copyEmail}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={meta.ctaTo}
                    className="apple-pill-btn px-3.5 py-1.5 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1"
                  >
                    <span className="badge-white">{meta.ctaLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 badge-white" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default PageLayout;
