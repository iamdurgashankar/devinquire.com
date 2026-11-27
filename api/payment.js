const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const db = require("./db");
const emailSender = require("./email");
const { getClientIP } = require("./auth");

const router = express.Router();

const PAYMENT_PLANS = {
  consultation: {
    id: "consultation",
    label: "1:1 Technical Consultation",
    shortLabel: "Consultation",
    amountRupees: 399,
    amountPaise: 39900,
    currency: "inr",
    displayPrice: "₹399/-",
    defaultProductId: "prod_VhmaGgjRVd1kRB",
    defaultPriceId: "price_1UgN1eR5aQe9VdOgXcXY9ZbD",
    defaultPaymentLink: "https://buy.stripe.com/test_cNi9AVevOcRjb704N06Vq00",
    priceEnvKey: "STRIPE_CONSULTATION_PRICE_ID",
    linkEnvKey: "STRIPE_CONSULTATION_PAYMENT_LINK",
    description:
      "Dedicated 45-minute 1-on-1 architecture review, tech-stack roadmap, and strategy consultation with DevInquire senior engineers.",
  },
  service_confirmation: {
    id: "service_confirmation",
    label: "Service Booking Confirmation",
    shortLabel: "Service Confirmation",
    amountRupees: 99,
    amountPaise: 9900,
    currency: "inr",
    displayPrice: "₹99/-",
    defaultProductId: "prod_VhmaMHWYKlHO9e",
    defaultPriceId: "price_1UgN1kR5aQe9VdOgrtvdFj37",
    defaultPaymentLink: "https://buy.stripe.com/test_6oUeVffzS4kNgrk1AO6Vq01",
    priceEnvKey: "STRIPE_SERVICE_CONFIRMATION_PRICE_ID",
    linkEnvKey: "STRIPE_SERVICE_CONFIRMATION_PAYMENT_LINK",
    description:
      "Priority service slot confirmation and immediate onboarding initiation with the DevInquire engineering studio.",
  },
};

const ENV_PATHS = [
  path.join(__dirname, ".env"),
  path.join(__dirname, "../.env"),
];

const DASHBOARD_STORE_PATH = path.join(
  __dirname,
  "../../devinquire-dashboard/server/data/local-db.json"
);

function isPlaceholder(val) {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  return (
    trimmed.includes("REPLACE_WITH") ||
    trimmed === "sk_test_..." ||
    trimmed === "whsec_..."
  );
}

/**
 * Live-reads an env variable from process.env or directly from .env files
 * so newly added keys take effect immediately without requiring a server restart.
 */
function getLiveSecret(key) {
  const current = process.env[key];
  if (!isPlaceholder(current)) {
    return current.trim();
  }

  for (const envPath of ENV_PATHS) {
    try {
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));
        if (parsed[key] && !isPlaceholder(parsed[key])) {
          process.env[key] = parsed[key].trim();
          return process.env[key];
        }
      }
    } catch {
      // ignore read errors
    }
  }

  try {
    if (fs.existsSync(DASHBOARD_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DASHBOARD_STORE_PATH, "utf8"));
      const stripeCfg = parsed?.settings?.stripe_config || {};
      if (key === "STRIPE_SECRET_KEY" && !isPlaceholder(stripeCfg.secretKey)) {
        return stripeCfg.secretKey.trim();
      }
      if (
        key === "STRIPE_WEBHOOK_SECRET" &&
        !isPlaceholder(stripeCfg.webhookSecret)
      ) {
        return stripeCfg.webhookSecret.trim();
      }
    }
  } catch {
    // ignore dashboard store read errors
  }

  return "";
}

function getStripeClient() {
  const secretKey = getLiveSecret("STRIPE_SECRET_KEY");
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function getPlanPriceId(plan) {
  return getLiveSecret(plan.priceEnvKey) || plan.defaultPriceId;
}

function getPlanPaymentLink(plan) {
  return getLiveSecret(plan.linkEnvKey) || plan.defaultPaymentLink;
}

function resolveFrontendOrigin(req) {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = (
    process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "https://devinquire.com",
          "https://www.devinquire.com",
        ]
  )
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const reqOrigin = (req.headers.origin || "").trim().replace(/\/+$/, "");
  if (reqOrigin) {
    if (allowed.includes(reqOrigin)) return reqOrigin;
    if (
      !isProd &&
      (reqOrigin.startsWith("http://localhost:") ||
        reqOrigin.startsWith("http://127.0.0.1:"))
    ) {
      return reqOrigin;
    }
  }

  if (!isProd) {
    return "http://localhost:3001";
  }

  return (process.env.APP_URL || "https://devinquire.com").replace(/\/+$/, "");
}

function validateCheckoutInput(body) {
  const errors = [];
  const planType = String(body?.planType || "").trim();

  if (!PAYMENT_PLANS[planType]) {
    errors.push(
      "Invalid payment option. Choose 'consultation' (₹399/-) or 'service_confirmation' (₹99/-)."
    );
  }

  const name = String(body?.name || "").trim();
  if (name.length < 2 || name.length > 100) {
    errors.push("Full name must be between 2 and 100 characters.");
  }

  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email || !emailRegex.test(email) || email.length > 255) {
    errors.push("Please provide a valid email address.");
  }

  const phone = body?.phone ? String(body.phone).trim() : "";
  if (phone) {
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 7 || digits.length > 15) {
      errors.push("Please enter a valid phone number (7–15 digits).");
    }
  }

  const service = body?.service ? String(body.service).trim() : "";
  if (planType === "service_confirmation" && !service) {
    errors.push("Please select the service you want to confirm.");
  }
  if (service.length > 200) {
    errors.push("Service name must be under 200 characters.");
  }

  const company = body?.company ? String(body.company).trim() : "";
  if (company.length > 200) {
    errors.push("Company name must be under 200 characters.");
  }

  const notes =
    body?.message || body?.notes
      ? String(body.message || body.notes).trim()
      : "";
  if (notes.length > 5000) {
    errors.push("Project notes must be under 5000 characters.");
  }

  return {
    valid: errors.length === 0,
    message: errors.join(" "),
    sanitized: {
      planType,
      inquiryId: body?.inquiryId ? String(body.inquiryId).trim() : null,
      name,
      email,
      phone: phone || null,
      company: company || null,
      service: service || null,
      timeline: body?.timeline ? String(body.timeline).trim().slice(0, 100) : null,
      subject: body?.subject ? String(body.subject).trim().slice(0, 200) : null,
      formSource: body?.formSource ? String(body.formSource).trim().slice(0, 100) : "Contact Form",
      notes: notes || null,
    },
  };
}

/**
 * Dispatches inquiry + email notifications once for a confirmed payment row.
 */
async function notifyConfirmedOrder(effectiveRecord, plan) {
  const amountLabel = `₹${Math.round(
    (Number(effectiveRecord.amount) || plan.amountPaise) / 100
  )}/-`;
  const subjectLine =
    plan.id === "consultation"
      ? `[PAID ${amountLabel}] 1:1 Technical Consultation`
      : `[PAID ${amountLabel}] Service Confirmation: ${
          effectiveRecord.service_name || "Selected Service"
        }`;
  const fullMessage = [
    `Stripe Payment Confirmed: ${amountLabel} (${plan.label})`,
    effectiveRecord.service_name
      ? `Service: ${effectiveRecord.service_name}`
      : null,
    effectiveRecord.stripe_payment_intent_id
      ? `Payment Intent: ${effectiveRecord.stripe_payment_intent_id}`
      : null,
    effectiveRecord.stripe_session_id
      ? `Checkout Session: ${effectiveRecord.stripe_session_id}`
      : null,
    effectiveRecord.notes
      ? `\nProject Brief / Notes:\n${effectiveRecord.notes}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await db.query(
      `INSERT INTO contact_submissions
       (name, email, phone, company, service, subject, message, status, priority, response_sent)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'high', 0)`,
      [
        effectiveRecord.customer_name,
        effectiveRecord.customer_email,
        effectiveRecord.customer_phone,
        effectiveRecord.company,
        effectiveRecord.service_name || plan.label,
        subjectLine,
        fullMessage,
      ]
    );
  } catch (csErr) {
    console.warn("[Payment] contact_submissions log warning:", csErr.message);
  }

  try {
    const dashBase = (
      process.env.DASHBOARD_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://dashboard.devinquire.com/api/public"
        : "http://localhost:8001/api/public")
    ).replace(/\/$/, "");
    let parsedPayload = {};
    if (effectiveRecord.form_payload) {
      try {
        parsedPayload =
          typeof effectiveRecord.form_payload === "string"
            ? JSON.parse(effectiveRecord.form_payload)
            : effectiveRecord.form_payload;
      } catch {
        parsedPayload = {};
      }
    }
    await fetch(`${dashBase}/payment_confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: effectiveRecord.inquiry_id || parsedPayload.inquiryId || undefined,
        name: effectiveRecord.customer_name,
        email: effectiveRecord.customer_email,
        phone: effectiveRecord.customer_phone,
        company: effectiveRecord.company,
        service: effectiveRecord.service_name || plan.label,
        timeline: parsedPayload.timeline || "",
        subject: subjectLine,
        message: fullMessage,
        form_source: parsedPayload.formSource || "Stripe Pre-Booking",
        payment_status: "paid",
        payment_plan: plan.id,
        payment_amount: Math.round(
          (Number(effectiveRecord.amount) || plan.amountPaise) / 100
        ),
        payment_currency: String(effectiveRecord.currency || "INR").toUpperCase(),
        payment_reference:
          effectiveRecord.stripe_payment_intent_id ||
          effectiveRecord.stripe_session_id ||
          "",
        paid_at: effectiveRecord.paid_at
          ? new Date(effectiveRecord.paid_at).toISOString()
          : new Date().toISOString(),
        form_payload: parsedPayload,
      }),
    });
  } catch {
    // non-fatal if dashboard server is offline
  }

  emailSender.sendPaymentNotification(effectiveRecord).catch((err) => {
    console.warn("[Payment] Notification email warning:", err.message);
  });
}

/**
 * Idempotently marks a Stripe Checkout Session as paid and dispatches notifications once.
 */
async function fulfillPaidSession(session) {
  if (!session || !session.id) return null;

  const sessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const meta = session.metadata || {};
  const refId = session.client_reference_id
    ? parseInt(session.client_reference_id, 10)
    : meta.payment_db_id
      ? parseInt(meta.payment_db_id, 10)
      : null;

  const planType = PAYMENT_PLANS[meta.plan_type]
    ? meta.plan_type
    : Number(session.amount_total) === 9900
      ? "service_confirmation"
      : "consultation";
  const plan = PAYMENT_PLANS[planType];

  let paymentRow = null;
  let shouldNotify = false;

  try {
    const [existingRows] = await db.query(
      refId
        ? "SELECT * FROM payments WHERE stripe_session_id = ? OR id = ? ORDER BY (stripe_session_id = ?) DESC LIMIT 1"
        : "SELECT * FROM payments WHERE stripe_session_id = ? LIMIT 1",
      refId ? [sessionId, refId, sessionId] : [sessionId]
    );

    if (existingRows.length > 0) {
      paymentRow = existingRows[0];
      await db.query(
        `UPDATE payments
         SET payment_status = 'paid',
             stripe_session_id = COALESCE(stripe_session_id, ?),
             stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
             paid_at = COALESCE(paid_at, NOW())
         WHERE id = ?`,
        [sessionId, paymentIntentId, paymentRow.id]
      );

      const [claimResult] = await db.query(
        "UPDATE payments SET notified = 1 WHERE id = ? AND notified = 0",
        [paymentRow.id]
      );
      shouldNotify = claimResult && claimResult.affectedRows === 1;

      const [updatedRows] = await db.query(
        "SELECT * FROM payments WHERE id = ? LIMIT 1",
        [paymentRow.id]
      );
      if (updatedRows.length > 0) paymentRow = updatedRows[0];
    } else {
      const [insertRes] = await db.query(
        `INSERT INTO payments
         (plan_type, service_name, customer_name, customer_email, customer_phone, company, notes,
          amount, currency, stripe_session_id, stripe_payment_intent_id, payment_status, notified, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 1, NOW())`,
        [
          planType,
          meta.service_name || null,
          meta.customer_name || session.customer_details?.name || "Client",
          session.customer_details?.email || session.customer_email || "",
          meta.customer_phone || session.customer_details?.phone || null,
          meta.company || null,
          meta.notes || null,
          session.amount_total || plan.amountPaise,
          (session.currency || plan.currency).toLowerCase(),
          sessionId,
          paymentIntentId,
        ]
      );
      shouldNotify = true;
      const [insertedRows] = await db.query(
        "SELECT * FROM payments WHERE id = ? LIMIT 1",
        [insertRes.insertId]
      );
      paymentRow = insertedRows[0] || null;
    }
  } catch (dbErr) {
    console.warn("[Payment] DB fulfillment warning:", dbErr.message);
  }

  const effectiveRecord = paymentRow || {
    id: refId || null,
    plan_type: planType,
    service_name: meta.service_name || null,
    customer_name:
      meta.customer_name || session.customer_details?.name || "Client",
    customer_email:
      session.customer_details?.email || session.customer_email || "",
    customer_phone:
      meta.customer_phone || session.customer_details?.phone || null,
    company: meta.company || null,
    notes: meta.notes || null,
    amount: session.amount_total || plan.amountPaise,
    currency: (session.currency || plan.currency).toLowerCase(),
    stripe_session_id: sessionId,
    stripe_payment_intent_id: paymentIntentId,
    payment_status: "paid",
    paid_at: new Date().toISOString(),
  };

  if (shouldNotify) {
    await notifyConfirmedOrder(effectiveRecord, plan);
  }

  return effectiveRecord;
}

/**
 * GET /api/payment/plans
 */
router.get("/plans", (req, res) => {
  const hasSecretKey = Boolean(getLiveSecret("STRIPE_SECRET_KEY"));
  const plans = Object.values(PAYMENT_PLANS).map((p) => ({
    id: p.id,
    label: p.label,
    shortLabel: p.shortLabel,
    amountRupees: p.amountRupees,
    amountPaise: p.amountPaise,
    currency: p.currency,
    displayPrice: p.displayPrice,
    description: p.description,
    productId: p.defaultProductId,
    priceId: getPlanPriceId(p),
    paymentLink: getPlanPaymentLink(p),
  }));

  res.json({
    success: true,
    stripeConfigured: true,
    mode: hasSecretKey ? "checkout_session" : "payment_link",
    currency: "INR",
    plans,
  });
});

/**
 * POST /api/payment/create-checkout-session
 */
router.post("/create-checkout-session", async (req, res) => {
  const ip = getClientIP(req);
  const validation = validateCheckoutInput(req.body || {});
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const { sanitized } = validation;
  const plan = PAYMENT_PLANS[sanitized.planType];
  const stripe = getStripeClient();

  let paymentDbId = null;
  const formPayloadStr = JSON.stringify({
    inquiryId: sanitized.inquiryId,
    name: sanitized.name,
    email: sanitized.email,
    phone: sanitized.phone,
    company: sanitized.company,
    service: sanitized.service,
    timeline: sanitized.timeline,
    subject: sanitized.subject,
    formSource: sanitized.formSource,
    notes: sanitized.notes,
  });
  try {
    const [result] = await db.query(
      `INSERT INTO payments
       (plan_type, service_name, customer_name, customer_email, customer_phone, company, notes, amount, currency, payment_status, ip_address, inquiry_id, form_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        plan.id,
        sanitized.service,
        sanitized.name,
        sanitized.email,
        sanitized.phone,
        sanitized.company,
        sanitized.notes,
        plan.amountPaise,
        plan.currency,
        ip,
        sanitized.inquiryId,
        formPayloadStr,
      ]
    );
    paymentDbId = result?.insertId || null;
  } catch (dbErr) {
    console.warn("[Payment] Initial DB insert warning:", dbErr.message);
  }

  // If STRIPE_SECRET_KEY is not present locally, seamlessly redirect via the provisioned Stripe Payment Link
  if (!stripe) {
    const paymentLink = getPlanPaymentLink(plan);
    if (paymentLink) {
      const urlObj = new URL(paymentLink);
      urlObj.searchParams.set("prefilled_email", sanitized.email);
      if (paymentDbId) {
        urlObj.searchParams.set("client_reference_id", String(paymentDbId));
      }
      return res.json({
        success: true,
        url: urlObj.toString(),
        paymentId: paymentDbId,
        mode: "payment_link",
      });
    }

    return res.status(503).json({
      success: false,
      code: "STRIPE_NOT_CONFIGURED",
      message:
        "Stripe payment gateway is not configured yet. Please set STRIPE_SECRET_KEY in devinquire.com/.env.",
    });
  }

  const origin = resolveFrontendOrigin(req);
  const priceId = getPlanPriceId(plan);

  try {
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.amountPaise,
            product_data: {
              name:
                plan.id === "service_confirmation" && sanitized.service
                  ? `${plan.label} — ${sanitized.service}`
                  : plan.label,
              description: plan.description,
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: sanitized.email,
      client_reference_id: paymentDbId ? String(paymentDbId) : undefined,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      line_items: [lineItem],
      metadata: {
        payment_db_id: paymentDbId ? String(paymentDbId) : "",
        inquiry_id: sanitized.inquiryId ? String(sanitized.inquiryId) : "",
        plan_type: plan.id,
        service_name: (sanitized.service || "").slice(0, 200),
        customer_name: sanitized.name.slice(0, 100),
        customer_phone: (sanitized.phone || "").slice(0, 30),
        company: (sanitized.company || "").slice(0, 200),
        timeline: (sanitized.timeline || "").slice(0, 100),
        form_source: (sanitized.formSource || "Contact Form").slice(0, 100),
        notes: (sanitized.notes || "").slice(0, 450),
      },
      success_url: `${origin}/payment/status?status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(
        plan.id
      )}`,
      cancel_url: `${origin}/payment/status?status=cancelled&plan=${encodeURIComponent(
        plan.id
      )}`,
    });

    if (paymentDbId) {
      await db
        .query("UPDATE payments SET stripe_session_id = ? WHERE id = ?", [
          session.id,
          paymentDbId,
        ])
        .catch(() => {});
    }

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      mode: "checkout_session",
    });
  } catch (stripeErr) {
    console.error("[Payment] Stripe checkout creation error:", stripeErr.message);
    if (paymentDbId) {
      await db
        .query("UPDATE payments SET payment_status = 'failed' WHERE id = ?", [
          paymentDbId,
        ])
        .catch(() => {});
    }
    return res.status(502).json({
      success: false,
      message:
        stripeErr.message ||
        "Unable to initialize Stripe Checkout session. Please try again.",
    });
  }
});

/**
 * GET /api/payment/verify-session?session_id=cs_...&plan=...
 */
router.get("/verify-session", async (req, res) => {
  const sessionId = String(req.query.session_id || "").trim();
  const planHint = String(req.query.plan || "consultation").trim();
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return res.status(400).json({
      success: false,
      message: "Valid Stripe session_id is required.",
    });
  }

  const stripe = getStripeClient();

  // When STRIPE_SECRET_KEY is not present locally (Payment Link redirect flow),
  // reconcile the completed Stripe redirect against the pending local payment record.
  if (!stripe) {
    const plan = PAYMENT_PLANS[planHint] || PAYMENT_PLANS.consultation;
    let record = null;
    let shouldNotify = false;

    try {
      const [bySession] = await db.query(
        "SELECT * FROM payments WHERE stripe_session_id = ? LIMIT 1",
        [sessionId]
      );
      if (bySession.length > 0) {
        record = bySession[0];
      } else {
        const [recentPending] = await db.query(
          `SELECT * FROM payments
           WHERE plan_type = ? AND payment_status = 'pending' AND stripe_session_id IS NULL
           ORDER BY created_at DESC LIMIT 1`,
          [plan.id]
        );
        if (recentPending.length > 0) {
          record = recentPending[0];
          await db.query(
            `UPDATE payments
             SET stripe_session_id = ?, payment_status = 'paid', paid_at = COALESCE(paid_at, NOW())
             WHERE id = ?`,
            [sessionId, record.id]
          );
          const [claim] = await db.query(
            "UPDATE payments SET notified = 1 WHERE id = ? AND notified = 0",
            [record.id]
          );
          shouldNotify = claim && claim.affectedRows === 1;
          const [fresh] = await db.query(
            "SELECT * FROM payments WHERE id = ? LIMIT 1",
            [record.id]
          );
          if (fresh.length > 0) record = fresh[0];
        }
      }
    } catch (dbErr) {
      console.warn("[Payment] Payment Link reconciliation warning:", dbErr.message);
    }

    if (shouldNotify && record) {
      await notifyConfirmedOrder(record, plan);
    }

    return res.json({
      success: true,
      data: {
        sessionId,
        inquiryId: record?.inquiry_id || null,
        paymentStatus: "paid",
        isPaid: true,
        planType: plan.id,
        planLabel: plan.label,
        serviceName: record?.service_name || null,
        amountRupees: plan.amountRupees,
        currency: plan.currency.toUpperCase(),
        customerName: record?.customer_name || null,
        customerEmail: record?.customer_email || null,
        customerPhone: record?.customer_phone || null,
        company: record?.company || null,
        transactionId: sessionId,
        paidAt: record?.paid_at || new Date().toISOString(),
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const isPaid = session.payment_status === "paid";
    let record = null;

    if (isPaid) {
      record = await fulfillPaidSession(session);
    } else {
      const [rows] = await db
        .query("SELECT * FROM payments WHERE stripe_session_id = ? LIMIT 1", [
          sessionId,
        ])
        .catch(() => [[]]);
      record = rows[0] || null;
    }

    const planType =
      record?.plan_type ||
      session.metadata?.plan_type ||
      (Number(session.amount_total) === 9900
        ? "service_confirmation"
        : "consultation");
    const plan = PAYMENT_PLANS[planType] || PAYMENT_PLANS.consultation;

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        isPaid,
        planType: plan.id,
        planLabel: plan.label,
        serviceName:
          record?.service_name || session.metadata?.service_name || null,
        amountRupees: Math.round(
          (Number(session.amount_total) || plan.amountPaise) / 100
        ),
        currency: (session.currency || plan.currency).toUpperCase(),
        customerName:
          record?.customer_name ||
          session.metadata?.customer_name ||
          session.customer_details?.name ||
          "Client",
        customerEmail:
          record?.customer_email ||
          session.customer_details?.email ||
          session.customer_email ||
          "",
        transactionId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || session.id,
        paidAt: record?.paid_at || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Payment] Session verification error:", err.message);
    return res.status(400).json({
      success: false,
      message: "Could not verify payment session.",
    });
  }
});

/**
 * Raw body webhook handler for Stripe events: POST /api/payment/webhook
 */
async function handleWebhook(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res
      .status(503)
      .json({ success: false, message: "Stripe not configured" });
  }

  const webhookSecret = getLiveSecret("STRIPE_WEBHOOK_SECRET");
  const isProd = process.env.NODE_ENV === "production";
  let event;

  try {
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res
          .status(400)
          .json({ success: false, message: "Missing Stripe-Signature header" });
      }
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (!isProd) {
      const payloadStr = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : JSON.stringify(req.body || {});
      event = JSON.parse(payloadStr);
    } else {
      return res.status(500).json({
        success: false,
        message: "STRIPE_WEBHOOK_SECRET is required in production.",
      });
    }
  } catch (err) {
    console.error("[Payment][Webhook] Signature error:", err.message);
    return res
      .status(400)
      .json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (
          session.payment_status === "paid" ||
          event.type === "checkout.session.async_payment_succeeded"
        ) {
          await fulfillPaidSession(session);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        await db
          .query(
            "UPDATE payments SET payment_status = 'failed' WHERE stripe_session_id = ?",
            [session.id]
          )
          .catch(() => {});
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        await db
          .query(
            "UPDATE payments SET payment_status = 'expired' WHERE stripe_session_id = ? AND payment_status = 'pending'",
            [session.id]
          )
          .catch(() => {});
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("[Payment][Webhook] Handler error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Webhook processing failed" });
  }
}

router.handleWebhook = handleWebhook;
router.PAYMENT_PLANS = PAYMENT_PLANS;

module.exports = router;
