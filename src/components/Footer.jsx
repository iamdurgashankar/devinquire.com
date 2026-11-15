import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import useTypingEffect from "../hooks/useTypingEffect";

export default function Footer() {
  const { displayText, showCursor } = useTypingEffect("DevInquire", 150, 2000);

  return (
    <footer className="apple-glass border-t border-[var(--apple-border)] text-[var(--apple-text-primary)] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[var(--apple-border)]">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_rgba(78,69,225,0.35)]">
                <div className="flex items-center justify-center text-white font-bold text-xs badge-white">
                  <span className="text-white/80 mr-0.5 badge-white">&#123;</span>
                  <span className="text-white font-bold badge-white">DI</span>
                  <span className="text-white/80 ml-0.5 badge-white">&#125;</span>
                </div>
              </div>
              <span className="relative inline-flex items-center font-bold text-xl tracking-tight text-[var(--apple-text-primary)]">
                <span className="invisible select-none" aria-hidden="true">
                  DevInquire|
                </span>
                <span className="absolute inset-0 flex items-center">
                  <span>{displayText}</span>
                  <span
                    className={`ml-0.5 text-[var(--apple-blue)] ${
                      showCursor ? "opacity-100" : "opacity-0"
                    } transition-opacity duration-100`}
                  >
                    |
                  </span>
                </span>
              </span>
            </Link>

            <p className="text-[14px] text-[var(--apple-text-secondary)] mb-6 max-w-md leading-relaxed">
              Building tomorrow&apos;s digital solutions with Apple-grade craftsmanship and modern cloud architecture. Full-stack development, mobile apps, and intelligent enterprise systems.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full apple-subcard text-[12px] font-medium text-[var(--apple-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[#28CD41] shadow-[0_0_8px_#28CD41]" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-4">
              Directory
            </h3>
            <ul className="space-y-2.5 text-[14px]">
              {[
                ["Home", "/"],
                ["About Us", "/about"],
                ["Services", "/services"],
                ["Products", "/products"],
                ["Editorial Blog", "/blog"],
                ["Contact", "/contact"],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="text-[var(--apple-text-secondary)] hover:text-[var(--apple-blue)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://dashboard.devinquire.com"
                  className="inline-flex items-center gap-1 text-[var(--apple-blue)] font-medium hover:underline"
                >
                  <span>Command Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-4">
              Direct Contact
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:contact@devinquire.com"
                className="flex items-center gap-3 p-3 rounded-[14px] apple-subcard group"
              >
                <div className="w-8 h-8 rounded-[10px] bg-[#4e45e1]/12 text-[var(--apple-blue)] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--apple-text-tertiary)]">
                    Email
                  </div>
                  <div className="text-[13px] font-medium text-[var(--apple-text-primary)] truncate">
                    contact@devinquire.com
                  </div>
                </div>
              </a>

              <a
                href="tel:+918763155488"
                className="flex items-center gap-3 p-3 rounded-[14px] apple-subcard group"
              >
                <div className="w-8 h-8 rounded-[10px] bg-[#28CD41]/12 text-[#28CD41] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--apple-text-tertiary)]">
                    Phone
                  </div>
                  <div className="text-[13px] font-medium text-[var(--apple-text-primary)] truncate">
                    +91 8763155488
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-[14px] apple-subcard">
                <div className="w-8 h-8 rounded-[10px] bg-[#AF52DE]/12 text-[var(--apple-purple)] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--apple-text-tertiary)]">
                    Studio Location
                  </div>
                  <div className="text-[13px] font-medium text-[var(--apple-text-primary)] truncate">
                    Bengaluru, Karnataka, India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px] text-[var(--apple-text-tertiary)]">
          <p>
            Copyright &copy; {new Date().getFullYear()} DevInquire Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy-policy"
              className="hover:text-[var(--apple-text-primary)] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-[var(--apple-text-primary)] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookie-policy"
              className="hover:text-[var(--apple-text-primary)] transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
