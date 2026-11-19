import React from "react";
import { motion } from "framer-motion";
import { Rocket, ArrowRight, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const ModernCTA = ({
  title = "Ready to Start Your Project?",
  subtitle = "Let's discuss how we can help bring your vision to life with Apple-grade craftsmanship and modern cloud architecture.",
  primaryText = "Get Started Today",
  primaryLink = "/contact",
  secondaryText = "Learn More",
  secondaryLink = "/services",
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] apple-card p-8 sm:p-14 md:p-20"
      >
        {/* Ambient Apple Gradient Glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#4e45e1]/15 dark:bg-[#6B63F2]/25 rounded-full blur-[90px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#AF52DE]/15 dark:bg-[#BF5AF2]/25 rounded-full blur-[90px]" />
          <div className="absolute inset-0 cyber-grid opacity-35" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Apple Squircle Icon */}
          <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_-4px_rgba(78,69,225,0.45)] flex items-center justify-center">
            <Rocket className="w-7 h-7 text-white badge-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full apple-subcard text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-blue)] mb-4">
            <span>Next-Gen Engineering</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-[var(--apple-text-primary)] mb-5 leading-tight">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-[var(--apple-text-secondary)] mb-10 max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="apple-btn-pair flex flex-col sm:flex-row gap-3.5 justify-center w-full sm:w-auto">
            <Link
              to={primaryLink}
              className="group apple-pill-btn px-7 py-3.5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            >
              <span className="badge-white">{primaryText}</span>
              <ArrowRight className="w-4 h-4 badge-white group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to={secondaryLink}
              className="apple-secondary-btn px-7 py-3.5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            >
              <span>{secondaryText}</span>
              <Globe className="w-4 h-4 text-[var(--apple-blue)]" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernCTA;
