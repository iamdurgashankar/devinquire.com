import { API_BASE } from "../config";

export const PAYMENT_PLANS = {
  consultation: {
    id: "consultation",
    label: "1:1 Project Clarity Call",
    shortLabel: "1:1 Consultation",
    amountRupees: 399,
    displayPrice: "₹399/-",
    badge: "45-Min Expert Roadmap Session",
    stripeProductId: "prod_VhmaGgjRVd1kRB",
    stripePriceId: "price_1UgN1eR5aQe9VdOgXcXY9ZbD",
    paymentLink: "https://buy.stripe.com/test_cNi9AVevOcRjb704N06Vq00",
    description:
      "Map out your idea, right tech stack, timeline & honest budget live with a senior engineer.",
    highlights: [
      "45-Min 1:1 Video Strategy Chat",
      "Clear Roadmap & Tech Blueprint",
      "Honest Timeline & Budget Plan",
    ],
  },
  service_confirmation: {
    id: "service_confirmation",
    label: "Priority Kickoff Pass",
    shortLabel: "Service Confirmation",
    amountRupees: 99,
    displayPrice: "₹99/-",
    badge: "Instant Slot Reservation",
    stripeProductId: "prod_VhmaMHWYKlHO9e",
    stripePriceId: "price_1UgN1kR5aQe9VdOgrtvdFj37",
    paymentLink: "https://buy.stripe.com/test_6oUeVffzS4kNgrk1AO6Vq01",
    description:
      "Confirm your chosen service & lock a priority onboarding spot today—100% credited to your final bill.",
    highlights: [
      "Instant Priority Project Slot",
      "Dedicated Project Lead Assigned",
      "100% Credited to Final Invoice",
    ],
  },
};

function getCandidateBases() {
  const bases = [];
  if (API_BASE) {
    bases.push(API_BASE.replace(/\/api\/?$/, "").replace(/\/+$/, ""));
  }
  bases.push("");
  return Array.from(new Set(bases));
}

async function fetchJsonWithFallback(subpath, options = {}) {
  let lastError = null;

  for (const base of getCandidateBases()) {
    const url = `${base}/api/payment${subpath}`;
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        return { ok: true, status: res.status, data };
      }
      if (data && data.message) {
        lastError = new Error(data.message);
        lastError.code = data.code;
        lastError.status = res.status;
        if (res.status >= 400 && res.status < 600 && res.status !== 404) {
          throw lastError;
        }
      }
    } catch (err) {
      lastError = err;
      if (err.status && err.status !== 404) {
        throw err;
      }
    }
  }

  throw (
    lastError ||
    new Error("Unable to connect to the payment server. Please try again.")
  );
}

export async function createStripeCheckout(payload) {
  try {
    const { data } = await fetchJsonWithFallback("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (data?.success && data?.url) {
      return data;
    }
  } catch (err) {
    // Only surface client validation errors (400); if backend is offline, fall back to direct Stripe Payment Link
    if (err.status === 400) {
      throw err;
    }
  }

  const plan = PAYMENT_PLANS[payload?.planType] || PAYMENT_PLANS.consultation;
  const fallbackUrl = new URL(plan.paymentLink);
  if (payload?.email) {
    fallbackUrl.searchParams.set("prefilled_email", payload.email.trim());
  }
  return {
    success: true,
    url: fallbackUrl.toString(),
    mode: "payment_link_fallback",
  };
}

export async function verifyStripeSession(sessionId, planType = "consultation") {
  const { data } = await fetchJsonWithFallback(
    `/verify-session?session_id=${encodeURIComponent(
      sessionId
    )}&plan=${encodeURIComponent(planType)}`
  );
  if (!data?.success || !data?.data) {
    throw new Error(data?.message || "Unable to verify payment session.");
  }
  return data.data;
}

export async function getPaymentPlans() {
  const { data } = await fetchJsonWithFallback("/plans");
  return data;
}
