import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CreditCard,
  Send,
} from "lucide-react";
import { PAYMENT_PLANS, createStripeCheckout } from "../services/paymentService";

export default function StripeCheckoutModal({
  isOpen,
  onClose,
  initialPlan = "consultation",
  inquiryData = null,
  onOptOutSubmit = null,
  isSubmittingQuery = false,
}) {
  const [planType, setPlanType] = useState(
    PAYMENT_PLANS[initialPlan] ? initialPlan : "consultation"
  );
  const [optedOut, setOptedOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const validPlan = PAYMENT_PLANS[initialPlan] ? initialPlan : "consultation";
      setPlanType(validPlan);
      setOptedOut(false);
      setErrorMessage("");
      setIsRedirecting(false);
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  const activePlan = PAYMENT_PLANS[planType] || PAYMENT_PLANS.consultation;
  const busy = isRedirecting || isSubmittingQuery;

  const resolvedService =
    inquiryData?.service?.trim() ||
    inquiryData?.subject?.trim() ||
    (activePlan.id === "consultation"
      ? "1:1 Technical Consultation"
      : "Custom Engineering Service");

  const handleProceedStripe = async () => {
    setErrorMessage("");
    setIsRedirecting(true);

    const payload = {
      planType: activePlan.id,
      name: (inquiryData?.name || "").trim(),
      email: (inquiryData?.email || "").trim(),
      phone: (inquiryData?.phone || "").trim(),
      company: (inquiryData?.company || "").trim(),
      service: resolvedService,
      message: [
        inquiryData?.timeline ? `Timeline: ${inquiryData.timeline}` : null,
        inquiryData?.subject ? `Subject: ${inquiryData.subject}` : null,
        (inquiryData?.message || "").trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    };

    try {
      try {
        sessionStorage.setItem(
          "devinquire_pending_inquiry",
          JSON.stringify({
            planType: activePlan.id,
            inquiryData: {
              ...inquiryData,
              service: resolvedService,
            },
          })
        );
      } catch {
        // ignore storage restrictions
      }

      const checkout = await createStripeCheckout(payload);
      window.location.assign(checkout.url);
    } catch (err) {
      setErrorMessage(
        err.message || "Unable to connect to Stripe Checkout. Please try again."
      );
      setIsRedirecting(false);
    }
  };

  const handleSubmitFreeQuery = async () => {
    if (!onOptOutSubmit) {
      onClose();
      return;
    }
    setErrorMessage("");
    try {
      await onOptOutSubmit();
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to submit your query. Please try again."
      );
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prebooking-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.22 }}
          className="apple-glass rounded-[26px] max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--apple-border)] flex items-center justify-between sticky top-0 z-10 apple-glass">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] flex items-center justify-center shadow-sm shrink-0">
                <CreditCard className="w-4 h-4 text-white badge-white" />
              </div>
              <div>
                <h3
                  id="prebooking-modal-title"
                  className="text-[17px] font-bold text-[var(--apple-text-primary)] leading-tight"
                >
                  Priority Pre-Booking Option
                </h3>
                <p className="text-[12px] text-[var(--apple-text-tertiary)]">
                  Confirm priority pre-booking or opt out to submit a free query
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Back to form"
              className="w-8 h-8 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Captured Form Summary */}
            {inquiryData && (
              <div className="p-3.5 rounded-[16px] apple-subcard flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--apple-text-primary)]">
                    {inquiryData.name}
                  </span>
                  <span className="text-[var(--apple-text-tertiary)] mx-1.5">·</span>
                  <span className="text-[var(--apple-text-secondary)]">
                    {inquiryData.email}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4e45e1]/10 text-[var(--apple-blue)] text-[11px] font-semibold truncate max-w-full">
                  {resolvedService}
                </span>
              </div>
            )}

            {/* Pre-Booking Plan Selector */}
            <div
              className={`transition-opacity duration-200 ${
                optedOut ? "opacity-45" : "opacity-100"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-2">
                Select Priority Pre-Booking Tier
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PAYMENT_PLANS).map((plan) => {
                  const selected = !optedOut && plan.id === activePlan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setOptedOut(false);
                        setPlanType(plan.id);
                        setErrorMessage("");
                      }}
                      className={`text-left p-4 rounded-[18px] border transition-all ${
                        selected
                          ? "border-[#4e45e1] bg-[#4e45e1]/[0.08] dark:bg-[#6B63F2]/[0.16] shadow-sm"
                          : "border-[var(--apple-border)] apple-subcard hover:border-[#4e45e1]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apple-blue)]">
                          {plan.shortLabel}
                        </span>
                        <span className="text-[18px] font-extrabold tracking-tight text-[var(--apple-text-primary)]">
                          {plan.displayPrice}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--apple-text-primary)]">
                        {plan.label}
                      </div>
                      <p className="text-[11.5px] text-[var(--apple-text-secondary)] mt-1 leading-snug">
                        {plan.id === "consultation"
                          ? "45-min 1:1 strategy & architecture call"
                          : "Confirm service & lock priority slot"}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!optedOut && (
                <div className="mt-3 p-3.5 rounded-[16px] apple-subcard space-y-1.5">
                  <div className="text-[12px] font-semibold text-[var(--apple-text-primary)] mb-1">
                    Included with {activePlan.label}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activePlan.highlights.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-[11.5px] text-[var(--apple-text-secondary)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#28CD41] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Explicit Opt-Out Checkbox Option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-[18px] border cursor-pointer transition-all select-none ${
                optedOut
                  ? "border-[#007AFF] bg-[#007AFF]/[0.08] shadow-sm"
                  : "border-[var(--apple-border)] apple-subcard hover:border-[var(--apple-blue)]/40"
              }`}
            >
              <input
                type="checkbox"
                checked={optedOut}
                onChange={(e) => {
                  setOptedOut(e.target.checked);
                  setErrorMessage("");
                }}
                disabled={busy}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4e45e1] focus:ring-[#4e45e1]"
              />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-[var(--apple-text-primary)]">
                  Opt out of pre-booking — submit standard query only (Free)
                </div>
                <p className="text-[12px] text-[var(--apple-text-secondary)] mt-0.5 leading-relaxed">
                  Skip Stripe pre-booking payment and send your message directly as a general inquiry.
                </p>
              </div>
            </label>

            {errorMessage && (
              <div className="p-3.5 rounded-[14px] bg-[#FF3B30]/12 border border-[#FF3B30]/30 text-[#D70015] dark:text-[#FF453A] text-[13px] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Payable / Summary Bar */}
            {!optedOut && (
              <div className="p-4 rounded-[16px] border border-[var(--apple-border)] apple-subcard flex items-center justify-between gap-4">
                <div>
                  <div className="text-[12px] font-semibold text-[var(--apple-text-primary)]">
                    Pre-Booking Amount
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--apple-text-tertiary)] mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#28CD41]" />
                    <span>Secured by Stripe · Cards, UPI &amp; Wallets</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold tracking-tight text-[var(--apple-text-primary)]">
                    {activePlan.displayPrice}
                  </div>
                  <div className="text-[10.5px] text-[var(--apple-text-tertiary)]">
                    One-time INR payment
                  </div>
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            {optedOut ? (
              <div className="apple-btn-pair flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="px-5 py-3 apple-secondary-btn rounded-full text-[13px] font-semibold"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFreeQuery}
                  disabled={busy}
                  className="flex-1 py-3 px-6 apple-pill-btn rounded-full text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4 badge-white" />
                  <span className="badge-white">
                    {isSubmittingQuery ? "Submitting Query…" : "Submit Query Only"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="apple-btn-pair flex flex-col sm:flex-row gap-3 pt-1">
                {onOptOutSubmit ? (
                  <button
                    type="button"
                    onClick={handleSubmitFreeQuery}
                    disabled={busy}
                    className="px-5 py-3 apple-secondary-btn rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {isSubmittingQuery
                        ? "Submitting…"
                        : "Opt Out & Submit Query"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="px-5 py-3 apple-secondary-btn rounded-full text-[13px] font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleProceedStripe}
                  disabled={busy}
                  className="flex-1 py-3 px-6 apple-pill-btn rounded-full text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5 badge-white" />
                  <span className="badge-white">
                    {isRedirecting
                      ? "Redirecting to Stripe…"
                      : `Pre-Book · Pay ${activePlan.displayPrice}`}
                  </span>
                  {!isRedirecting && (
                    <ArrowRight className="w-4 h-4 badge-white" />
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
