import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Printer,
  ShieldCheck,
  CreditCard,
  Send,
} from "lucide-react";
import SEO from "../components/SEO";
import StripeCheckoutModal from "../components/StripeCheckoutModal";
import { PAYMENT_PLANS, verifyStripeSession } from "../services/paymentService";
import { submitContactForm, confirmInquiryPayment } from "../services/emailService";

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const sessionId = searchParams.get("session_id") || "";
  const planParam = searchParams.get("plan") || "consultation";

  const [loading, setLoading] = useState(
    status === "success" && Boolean(sessionId)
  );
  const [receipt, setReceipt] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [pendingInquiry, setPendingInquiry] = useState(null);
  const [submittingFree, setSubmittingFree] = useState(false);
  const [freeQuerySent, setFreeQuerySent] = useState(false);

  const fallbackPlan =
    PAYMENT_PLANS[planParam] || PAYMENT_PLANS.consultation;

  useEffect(() => {
    let savedInquiry = null;
    let savedInquiryId = null;
    try {
      const saved = sessionStorage.getItem("devinquire_pending_inquiry");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.inquiryData) {
          savedInquiry = {
            ...parsed.inquiryData,
            inquiryId: parsed.inquiryId || parsed.inquiryData.inquiryId || null,
          };
          savedInquiryId = savedInquiry.inquiryId;
          setPendingInquiry(savedInquiry);
        }
      }
    } catch {
      // ignore storage errors
    }

    if (status === "cancelled" && savedInquiry) {
      confirmInquiryPayment({
        inquiry_id: savedInquiryId,
        email: savedInquiry.email,
        name: savedInquiry.name,
        phone: savedInquiry.phone,
        company: savedInquiry.company,
        service: savedInquiry.service,
        timeline: savedInquiry.timeline,
        subject: savedInquiry.subject,
        message: savedInquiry.message,
        form_source: savedInquiry.formSource || savedInquiry.form_source || "Contact Form",
        payment_status: "cancelled",
        payment_plan: planParam,
        payment_amount: fallbackPlan.amountRupees,
        payment_currency: "INR",
      }).catch(() => {});
    }
  }, [status, planParam, fallbackPlan.amountRupees]);

  useEffect(() => {
    let active = true;
    if (status !== "success") {
      setLoading(false);
      return undefined;
    }

    (async () => {
      let stored = null;
      try {
        const raw = sessionStorage.getItem("devinquire_pending_inquiry");
        if (raw) stored = JSON.parse(raw);
      } catch {
        // ignore
      }
      const inq = stored?.inquiryData || null;
      const inqId = stored?.inquiryId || inq?.inquiryId || null;

      try {
        setLoading(Boolean(sessionId));
        let verified = null;
        if (sessionId && sessionId.startsWith("cs_")) {
          verified = await verifyStripeSession(sessionId, planParam);
        }

        const resolvedPlanId = verified?.planType || stored?.planType || planParam;
        const resolvedPlan =
          PAYMENT_PLANS[resolvedPlanId] || PAYMENT_PLANS.consultation;
        const resolvedAmount =
          verified?.amountRupees || stored?.planAmount || resolvedPlan.amountRupees;
        const resolvedRef = verified?.transactionId || sessionId || `stripe-${Date.now()}`;

        await confirmInquiryPayment({
          inquiry_id: verified?.inquiryId || inqId || undefined,
          name: verified?.customerName || inq?.name || "Client",
          email: verified?.customerEmail || inq?.email || "",
          phone: verified?.customerPhone || inq?.phone || "",
          company: verified?.company || inq?.company || "",
          service: verified?.serviceName || inq?.service || resolvedPlan.label,
          timeline: verified?.timeline || inq?.timeline || "",
          subject: inq?.subject || `${resolvedPlan.label} (${resolvedPlan.displayPrice})`,
          message: inq?.message || "",
          form_source: inq?.formSource || inq?.form_source || "Stripe Pre-Booking",
          payment_status: "paid",
          payment_plan: resolvedPlan.id,
          payment_amount: resolvedAmount,
          payment_currency: verified?.currency || "INR",
          payment_reference: resolvedRef,
          paid_at: verified?.paidAt || new Date().toISOString(),
        });

        if (active) {
          setReceipt(
            verified || {
              sessionId: resolvedRef,
              paymentStatus: "paid",
              isPaid: true,
              planType: resolvedPlan.id,
              planLabel: resolvedPlan.label,
              serviceName: inq?.service || null,
              amountRupees: resolvedAmount,
              currency: "INR",
              customerName: inq?.name || null,
              customerEmail: inq?.email || null,
              customerPhone: inq?.phone || null,
              company: inq?.company || null,
              timeline: inq?.timeline || null,
              message: inq?.message || null,
              transactionId: resolvedRef,
              paidAt: new Date().toISOString(),
            }
          );
          setVerifyError("");
          try {
            sessionStorage.removeItem("devinquire_pending_inquiry");
          } catch {
            // ignore
          }
        }
      } catch (err) {
        if (inq) {
          await confirmInquiryPayment({
            inquiry_id: inqId || undefined,
            name: inq.name || "Client",
            email: inq.email || "",
            phone: inq.phone || "",
            company: inq.company || "",
            service: inq.service || fallbackPlan.label,
            timeline: inq.timeline || "",
            subject: inq.subject || fallbackPlan.label,
            message: inq.message || "",
            form_source: inq.formSource || inq.form_source || "Stripe Pre-Booking",
            payment_status: "paid",
            payment_plan: fallbackPlan.id,
            payment_amount: fallbackPlan.amountRupees,
            payment_currency: "INR",
            payment_reference: sessionId || `stripe-${Date.now()}`,
            paid_at: new Date().toISOString(),
          }).catch(() => {});
        }
        if (active) {
          setVerifyError(
            err.message ||
              "Your payment is being confirmed by Stripe. Keep your session reference handy."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [status, sessionId, planParam, fallbackPlan]);

  const handleCancelledOptOutSubmit = async () => {
    if (!pendingInquiry) return;
    setSubmittingFree(true);
    try {
      const result = await submitContactForm({
        ...pendingInquiry,
        inquiry_id: pendingInquiry.inquiryId || undefined,
        payment_status: "opt_out",
        form_source: pendingInquiry.formSource || pendingInquiry.form_source || "Contact Form",
        subject:
          pendingInquiry.subject ||
          (pendingInquiry.service
            ? `Service Inquiry: ${pendingInquiry.service}`
            : "DevInquire Website Inquiry"),
      });
      if (result.success) {
        setFreeQuerySent(true);
        setRetryModalOpen(false);
        try {
          sessionStorage.removeItem("devinquire_pending_inquiry");
        } catch {
          // ignore
        }
      }
    } finally {
      setSubmittingFree(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] pt-28 pb-16 flex items-center justify-center px-4">
        <div className="apple-card p-10 max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#4e45e1] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--apple-text-primary)] mb-1.5">
            Verifying Your Payment…
          </h1>
          <p className="text-[13.5px] text-[var(--apple-text-secondary)]">
            Confirming your transaction directly with Stripe.
          </p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <>
        <SEO
          title={
            freeQuerySent
              ? "Query Submitted | DevInquire"
              : "Pre-Booking Cancelled | DevInquire"
          }
          description="Manage your DevInquire pre-booking or submit your standard query."
        />
        <div className="min-h-[75vh] pt-28 pb-16 flex items-center justify-center px-4">
          <div className="apple-card p-8 sm:p-10 max-w-lg w-full text-center">
            {freeQuerySent ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#28CD41]/15 text-[#28CD41] flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--apple-text-primary)] mb-2">
                  Query Submitted Successfully
                </h1>
                <p className="text-[14px] text-[var(--apple-text-secondary)] leading-relaxed mb-7">
                  You opted out of pre-booking and your query has been sent to our engineering team. We&apos;ll get back to you within 24 hours.
                </p>
                <Link
                  to="/"
                  className="px-6 py-3 rounded-full apple-pill-btn text-[14px] font-semibold inline-flex items-center justify-center gap-2"
                >
                  <span className="badge-white">Return to Home</span>
                </Link>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center mx-auto mb-5">
                  <XCircle className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--apple-text-primary)] mb-2">
                  Pre-Booking Payment Cancelled
                </h1>
                <p className="text-[14px] text-[var(--apple-text-secondary)] leading-relaxed mb-7">
                  No payment was charged. You can retry your{" "}
                  <strong className="text-[var(--apple-text-primary)]">
                    {fallbackPlan.label} ({fallbackPlan.displayPrice})
                  </strong>{" "}
                  pre-booking or opt out to submit your query for free.
                </p>

                <div className="apple-btn-pair flex flex-col sm:flex-row gap-3 justify-center">
                  {pendingInquiry ? (
                    <button
                      type="button"
                      disabled={submittingFree}
                      onClick={handleCancelledOptOutSubmit}
                      className="px-5 py-3 rounded-full apple-secondary-btn text-[13.5px] font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {submittingFree
                          ? "Submitting Query…"
                          : "Opt Out & Submit Query"}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to="/contact"
                      className="px-5 py-3 rounded-full apple-secondary-btn text-[13.5px] font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Form</span>
                    </Link>
                  )}

                  {pendingInquiry && (
                    <button
                      type="button"
                      onClick={() => setRetryModalOpen(true)}
                      className="px-6 py-3 rounded-full apple-pill-btn text-[13.5px] font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4 badge-white" />
                      <span className="badge-white">
                        Retry {fallbackPlan.displayPrice} Pre-Booking
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {pendingInquiry && (
          <StripeCheckoutModal
            isOpen={retryModalOpen}
            onClose={() => setRetryModalOpen(false)}
            initialPlan={fallbackPlan.id}
            inquiryData={pendingInquiry}
            onOptOutSubmit={handleCancelledOptOutSubmit}
            isSubmittingQuery={submittingFree}
          />
        )}
      </>
    );
  }

  const amountDisplay = receipt
    ? `₹${receipt.amountRupees}/-`
    : fallbackPlan.displayPrice;
  const planTitle = receipt?.planLabel || fallbackPlan.label;

  return (
    <>
      <SEO
        title="Pre-Booking Confirmed | DevInquire"
        description="Your priority pre-booking with DevInquire has been confirmed via Stripe."
      />
      <div className="min-h-[80vh] pt-28 pb-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="apple-card p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#28CD41]/15 text-[#28CD41] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28CD41]/12 text-[#248A3D] dark:text-[#30D158] text-[11px] font-semibold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stripe Pre-Booking Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--apple-text-primary)]">
                Thank You! Pre-Booking Confirmed
              </h1>
              <p className="text-[14px] text-[var(--apple-text-secondary)] mt-1.5">
                Your inquiry and priority pre-booking have been logged with our engineering team.
              </p>
            </div>

            {verifyError && (
              <div className="mb-6 p-3.5 rounded-2xl apple-subcard text-[12.5px] text-[var(--apple-text-secondary)]">
                {verifyError}
              </div>
            )}

            {/* Receipt Details */}
            <div className="p-5 rounded-2xl apple-subcard space-y-3 text-[13.5px] mb-8">
              <div className="flex justify-between gap-4 pb-3 border-b border-[var(--apple-border)]">
                <span className="text-[var(--apple-text-secondary)]">Amount Paid</span>
                <span className="text-lg font-extrabold text-[var(--apple-text-primary)]">
                  {amountDisplay}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[var(--apple-text-secondary)]">Pre-Booking Type</span>
                <span className="font-semibold text-[var(--apple-text-primary)] text-right">
                  {planTitle}
                </span>
              </div>

              {receipt?.serviceName && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--apple-text-secondary)]">Topic / Service</span>
                  <span className="font-semibold text-[var(--apple-text-primary)] text-right">
                    {receipt.serviceName}
                  </span>
                </div>
              )}

              {receipt?.customerName && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--apple-text-secondary)]">Client</span>
                  <span className="font-medium text-[var(--apple-text-primary)] text-right">
                    {receipt.customerName}
                  </span>
                </div>
              )}

              {receipt?.customerEmail && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--apple-text-secondary)]">Receipt Email</span>
                  <span className="font-medium text-[var(--apple-text-primary)] text-right break-all">
                    {receipt.customerEmail}
                  </span>
                </div>
              )}

              {(receipt?.customerPhone || pendingInquiry?.phone) && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--apple-text-secondary)]">Phone</span>
                  <span className="font-medium text-[var(--apple-text-primary)] text-right">
                    {receipt?.customerPhone || pendingInquiry?.phone}
                  </span>
                </div>
              )}

              {(receipt?.company || pendingInquiry?.company) && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--apple-text-secondary)]">Company</span>
                  <span className="font-medium text-[var(--apple-text-primary)] text-right">
                    {receipt?.company || pendingInquiry?.company}
                  </span>
                </div>
              )}

              {(receipt?.transactionId || sessionId) && (
                <div className="flex justify-between gap-4 pt-2 border-t border-[var(--apple-border)]">
                  <span className="text-[var(--apple-text-secondary)]">Reference ID</span>
                  <span className="font-mono text-[12px] text-[var(--apple-text-tertiary)] text-right break-all">
                    {receipt?.transactionId || sessionId}
                  </span>
                </div>
              )}
            </div>

            <div className="apple-btn-pair flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 px-5 rounded-full apple-secondary-btn text-[13.5px] font-semibold inline-flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Receipt</span>
              </button>
              <Link
                to="/"
                className="flex-1 py-3 px-5 rounded-full apple-pill-btn text-[13.5px] font-semibold inline-flex items-center justify-center gap-2"
              >
                <span className="badge-white">Return to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
