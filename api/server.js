const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const isProd = process.env.NODE_ENV === "production";

/* =============================================================
 *  ENV FAIL-FAST VALIDATION
 * ============================================================= */
const REQUIRED_ENV = isProd
  ? ["JWT_SECRET", "SYNC_WEBHOOK_SECRET", "ALLOWED_ORIGINS"]
  : [];
const SECRET_ENV = ["JWT_SECRET", "SYNC_WEBHOOK_SECRET", "API_SECRET_KEY"];

for (const k of REQUIRED_ENV) {
  if (
    !process.env[k] ||
    (typeof process.env[k] === "string" && process.env[k].length < 16)
  ) {
    console.error(
      `[FATAL] Missing or insecure required env: ${k}. Set in devinquire.com/.env`,
    );
    process.exit(1);
  }
}
for (const k of SECRET_ENV) {
  const val = process.env[k];
  if (isProd && val && val.length < 24) {
    console.error(
      `[FATAL] Production secret ${k} must be >= 24 characters. Generate:`,
    );
    console.error(
      `        node -e "console.log(crypto.randomBytes(48).toString('hex'))"`,
    );
    process.exit(1);
  }
  if (val && val.includes("secret-token-") && isProd) {
    console.error(
      `[FATAL] ${k} uses weak hardcoded placeholder in production. Rotate immediately.`,
    );
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

if (isProd) {
  app.set("trust proxy", parseInt(process.env.TRUST_PROXY_HOPS || "1", 10));
}

/* =============================================================
 *  Helmet security headers
 * ============================================================= */
if (isProd) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          "img-src": ["'self'", "data:", "https:", "http:"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          "connect-src": [
            "'self'",
            "https://devinquire.com",
            "https://dashboard.devinquire.com",
            "https://mcyngpjwkcxodglewdwd.supabase.co",
          ],
          "frame-ancestors": [
            "'self'",
            "https://devinquire.com",
            "https://dashboard.devinquire.com",
          ],
          "upgrade-insecure-requests": [],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginEmbedderPolicy: false,
    }),
  );
} else {
  app.use(helmet({ contentSecurityPolicy: false, hsts: false }));
}

/* =============================================================
 *  Request ID + structured logging
 * ============================================================= */
app.use((req, res, next) => {
  req.id = crypto.randomUUID().slice(0, 13);
  res.setHeader("X-Request-ID", req.id);
  next();
});
const logFormat = isProd
  ? '{"ts":":date[iso]","rid":":req[x-request-id]","ip":":remote-addr","method":":method","path":":url","status":":status","ms":":response-time","ua":":user-agent"}'
  : "[:date[iso]] :method :url :status :response-time ms - :res[content-length]";
app.use(
  morgan(logFormat, {
    skip: (req, res) => isProd && req.url.startsWith("/api/health"),
  }),
);

// Body parser middlewares (with payload limits)
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

/* =============================================================
 *  CORS whitelist — NO localhost bypass in PRODUCTION
 * ============================================================= */
const DEFAULT_ORIGINS_DEV = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://devinquire.com",
  "https://www.devinquire.com",
  "https://dashboard.devinquire.com",
];
const DEFAULT_ORIGINS_PROD = [
  "https://devinquire.com",
  "https://www.devinquire.com",
  "https://dashboard.devinquire.com",
];
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : isProd
      ? DEFAULT_ORIGINS_PROD
      : DEFAULT_ORIGINS_DEV
)
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        if (isProd)
          return callback(
            new Error("CORS: Origin header required in production"),
            false,
          );
        return callback(null, true); // curl / health / monitor OK in dev
      }
      if (allowedOrigins.includes("*")) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // dev-only localhost/127.0.0.1 wildcard
      if (
        !isProd &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:"))
      ) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy blocked request from origin: ${origin}`),
        false,
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-API-Key",
      "X-Request-ID",
      "X-CSRF-Token",
    ],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 600,
  }),
);
/* app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      (!isProd &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:"))))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && !isProd) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-API-Key, X-Request-ID, X-CSRF-Token",
  );
  res.setHeader("Access-Control-Max-Age", "600");
  res.sendStatus(204);
});
*/
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  const origin = req.headers.origin;
  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      (!isProd &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:"))))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && !isProd) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-API-Key, X-Request-ID, X-CSRF-Token",
  );
  res.setHeader("Access-Control-Max-Age", "600");
  return res.status(204).end();
});

/* =============================================================
 *  Rate limiting
 * ============================================================= */
const createLimiter = (windowMs, max, name) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: `Too many ${name} requests. Try again later.`,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    keyGenerator: (req) => {
      const ip = (
        (req.headers["x-forwarded-for"] || "").toString().split(",")[0] ||
        req.socket.remoteAddress ||
        ""
      ).trim();
      const u = (req.headers["authorization"] || "").slice(0, 20);
      return `${name}:${u || ip}`;
    },
  });
const contactLimiter = createLimiter(60 * 60 * 1000, 30, "contact");
const syncLimiter = createLimiter(10 * 60 * 1000, 20, "sync");
const blogAdminLimiter = createLimiter(10 * 60 * 1000, 60, "blog-admin");
const globalLimiter = createLimiter(60 * 1000, 300, "global"); // 300 req/min

app.use((req, res, next) => {
  const p = req.originalUrl.split("?")[0];
  if (
    p === "/contact" ||
    p === "/api/contact" ||
    p === "/api/contacts" ||
    p === "/contact.php" ||
    p === "/api/contact.php"
  ) {
    return contactLimiter(req, res, next);
  }
  if (
    p === "/sync-posts" ||
    p === "/sync-posts.php" ||
    p === "/api/sync-posts" ||
    p === "/api/sync-posts.php"
  ) {
    return syncLimiter(req, res, next);
  }
  if (
    p === "/blog-admin" ||
    p === "/api/blog-admin" ||
    p === "/blog-admin.php" ||
    p === "/api/blog-admin.php"
  ) {
    return blogAdminLimiter(req, res, next);
  }
  if (p.startsWith("/api/")) {
    return globalLimiter(req, res, next);
  }
  next();
});

// Import route handlers
const db = require("./db");
const contactRouter = require("./contact");
const newsletterRouter = require("./newsletter");
const blogRouter = require("./blog");
const blogAdminRouter = require("./blog-admin");
const syncPostsRouter = require("./sync-posts");

// Register API Routes with compatibility mappings for PHP extension requests

// Contact submissions
for (const p of [
  "/contact",
  "/contact.php",
  "/api/contact",
  "/api/contact.php",
]) {
  app.use(p, contactRouter);
}

// Newsletter subscriptions
for (const p of [
  "/newsletter",
  "/newsletter.php",
  "/api/newsletter",
  "/api/newsletter.php",
]) {
  app.use(p, newsletterRouter);
}

// Newsletter confirmations (URL rewrite mapping newsletter-confirm.php to /newsletter.php/confirm)
const handleNewsletterConfirm = (req, res, next) => {
  const queryIndex = req.url.indexOf("?");
  const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
  req.url = "/confirm" + queryString;
  newsletterRouter(req, res, next);
};
for (const p of [
  "/newsletter-confirm",
  "/newsletter-confirm.php",
  "/api/newsletter-confirm",
  "/api/newsletter-confirm.php",
]) {
  app.get(p, handleNewsletterConfirm);
}

// Public Blog endpoints
for (const p of ["/blog", "/blog.php", "/api/blog", "/api/blog.php"]) {
  app.use(p, blogRouter);
}

// Admin Blog endpoints
for (const p of [
  "/blog-admin",
  "/blog-admin.php",
  "/api/blog-admin",
  "/api/blog-admin.php",
]) {
  app.use(p, blogAdminRouter);
}

// Sync Posts webhook
for (const p of [
  "/sync-posts",
  "/sync-posts.php",
  "/api/sync-posts",
  "/api/sync-posts.php",
]) {
  app.use(p, syncPostsRouter);
}

// Base API route check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    success: true,
    ts: new Date().toISOString(),
    rid: req.id,
    env: isProd ? "production" : "development",
  });
});

// Production asset hosting
const buildPath = path.join(__dirname, "../build");
const fs = require("fs");
if (fs.existsSync(buildPath)) {
  app.use(
    express.static(buildPath, {
      maxAge: isProd ? "1d" : 0,
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store");
        } else if (
          filePath.match(
            /\.(js|css|woff2|woff|ttf|eot|otf|png|jpg|jpeg|svg|webp|gif)$/,
          )
        ) {
          res.setHeader(
            "Cache-Control",
            isProd ? "public, max-age=31536000, immutable" : "no-cache",
          );
        }
      },
    }),
  );

  // Fallback all non-matching routes to frontend React app for client-side routing
  app.get(
    /^\/(?!api\/|contact|blog|newsletter|sync-posts).*/,
    (req, res, next) => {
      if (
        req.path.startsWith("/api/") ||
        req.path.startsWith("/contact") ||
        req.path.startsWith("/blog") ||
        req.path.startsWith("/newsletter") ||
        req.path.startsWith("/sync-posts")
      ) {
        return next();
      }
      res.sendFile(path.join(buildPath, "index.html"), (err) => {
        if (err) {
          console.error(
            "[SPA-FALLBACK][ERROR]",
            err && err.message,
            "path=",
            req.path,
          );
          res
            .status(404)
            .json({ success: false, message: "Not Found", rid: req.id });
        }
      });
    },
  );
}

// Global 404 for /api/*
app.use(/^\/api\/(?:.|[\n\r])*$/, (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    rid: req.id,
  });
});

/* =============================================================
 *  Global error handler — GENERIC error in prod, detailed in dev
 * ============================================================= */
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const rid = req.id || crypto.randomUUID().slice(0, 13);

  let clientMessage = "Internal Server Error.";
  if (!isProd) clientMessage = err.message || clientMessage;
  if (status === 429)
    clientMessage =
      (err.message && err.message.message) || err.message || clientMessage;
  if (status >= 400 && status < 500)
    clientMessage = err.message || clientMessage;

  const logObj = {
    rid,
    status,
    method: req.method,
    path: req.originalUrl,
    error: err && err.message,
    stack: err && err.stack,
    ip: (
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0] ||
      req.socket.remoteAddress ||
      ""
    ).trim(),
  };
  console.error("[ERROR]", JSON.stringify(logObj));

  res.status(status).json({
    success: false,
    status: "error",
    message: clientMessage,
    rid,
  });
});

// Start listening — wait for DB schema bootstrap to guarantee all tables exist
(async () => {
  try {
    await db.bootstrapReady();
  } catch (e) {
    console.warn(
      "[BOOT] Schema bootstrap did not complete cleanly:",
      e && e.message,
    );
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 DevInquire Main Site API Server on port ${PORT}`);
    console.log(
      `Environment: ${isProd ? "PRODUCTION (hardened)" : "DEVELOPMENT"}`,
    );
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(
      `CORS origins (${allowedOrigins.length}): ${allowedOrigins.join(", ")}`,
    );
    console.log(`SPA build present: ${fs.existsSync(buildPath)}\n`);
  });
})();
