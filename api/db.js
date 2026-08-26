const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const POOL_DB_NAME =
  process.env.DB_NAME || process.env.DB_DATABASE || "devinquire";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  database: POOL_DB_NAME,
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  port: parseInt(process.env.DB_PORT || 3306, 10),
  charset: process.env.DB_CHARSET || "utf8mb4",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || 20, 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || 0, 10),
  namedPlaceholders: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  multipleStatements: false,
});

const IDENT_SQL = [
  `CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    company VARCHAR(200) DEFAULT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    timeline VARCHAR(100) DEFAULT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status ENUM('new','read','replied','archived') DEFAULT 'new',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    assigned_to VARCHAR(100) DEFAULT NULL,
    response_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cs_email (email),
    INDEX idx_cs_status (status),
    INDEX idx_cs_priority (priority),
    INDEX idx_cs_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS rate_limiting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rl_identifier (identifier),
    INDEX idx_rl_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_al_ip (ip_address),
    INDEX idx_al_success (success),
    INDEX idx_al_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(16) DEFAULT 'info',
    source VARCHAR(100) DEFAULT NULL,
    message TEXT,
    context JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sl_level (level),
    INDEX idx_sl_source (source),
    INDEX idx_sl_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    status ENUM('pending','active','unsubscribed','bounced') DEFAULT 'pending',
    subscription_source VARCHAR(50) DEFAULT 'website',
    confirmation_token VARCHAR(64) DEFAULT NULL,
    unsubscribe_token VARCHAR(64) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    subscription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
    last_email_sent TIMESTAMP NULL DEFAULT NULL,
    bounce_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bs_email (email),
    INDEX idx_bs_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    status ENUM('pending','confirmed','unsubscribed','bounced') DEFAULT 'pending',
    frequency ENUM('daily','weekly','monthly') DEFAULT 'weekly',
    confirmation_token VARCHAR(64) DEFAULT NULL,
    unsubscribe_token VARCHAR(64) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
    last_newsletter_sent TIMESTAMP NULL DEFAULT NULL,
    bounce_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ns_email (email),
    INDEX idx_ns_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bc_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bt_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firestore_id VARCHAR(255) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    category_id INT,
    author_name VARCHAR(100) DEFAULT 'Admin User',
    author_email VARCHAR(255),
    author_avatar VARCHAR(500),
    status ENUM('draft','published','archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    read_time INT DEFAULT 5,
    views INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bp_slug (slug),
    INDEX idx_bp_status (status),
    INDEX idx_bp_published_at (published_at),
    INDEX idx_bp_category_id (category_id),
    INDEX idx_bp_is_featured (is_featured),
    INDEX idx_bp_firestore_id (firestore_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_post_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    UNIQUE KEY unique_post_tag (post_id, tag_id),
    INDEX idx_bpt_post_id (post_id),
    INDEX idx_bpt_tag_id (tag_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT NULL,
    role ENUM('admin','editor','viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

const ALTER_SQL = [
  {
    table: "blog_posts",
    column: "firestore_id",
    ddl: `ALTER TABLE blog_posts ADD COLUMN firestore_id VARCHAR(255) DEFAULT NULL`,
  },
  {
    table: "blog_posts",
    column: "title",
    ddl: `ALTER TABLE blog_posts ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled'`,
  },
  {
    table: "blog_posts",
    column: "slug",
    ddl: `ALTER TABLE blog_posts ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT ''`,
  },
  {
    table: "blog_posts",
    column: "excerpt",
    ddl: `ALTER TABLE blog_posts ADD COLUMN excerpt TEXT`,
  },
  {
    table: "blog_posts",
    column: "content",
    ddl: `ALTER TABLE blog_posts ADD COLUMN content LONGTEXT NOT NULL`,
  },
  {
    table: "blog_posts",
    column: "featured_image",
    ddl: `ALTER TABLE blog_posts ADD COLUMN featured_image VARCHAR(500)`,
  },
  {
    table: "blog_posts",
    column: "category_id",
    ddl: `ALTER TABLE blog_posts ADD COLUMN category_id INT DEFAULT NULL`,
  },
  {
    table: "blog_posts",
    column: "author_name",
    ddl: `ALTER TABLE blog_posts ADD COLUMN author_name VARCHAR(100) DEFAULT 'Admin User'`,
  },
  {
    table: "blog_posts",
    column: "author_email",
    ddl: `ALTER TABLE blog_posts ADD COLUMN author_email VARCHAR(255)`,
  },
  {
    table: "blog_posts",
    column: "author_avatar",
    ddl: `ALTER TABLE blog_posts ADD COLUMN author_avatar VARCHAR(500)`,
  },
  {
    table: "blog_posts",
    column: "status",
    ddl: `ALTER TABLE blog_posts ADD COLUMN status ENUM('draft','published','archived') DEFAULT 'draft'`,
  },
  {
    table: "blog_posts",
    column: "is_featured",
    ddl: `ALTER TABLE blog_posts ADD COLUMN is_featured BOOLEAN DEFAULT FALSE`,
  },
  {
    table: "blog_posts",
    column: "read_time",
    ddl: `ALTER TABLE blog_posts ADD COLUMN read_time INT DEFAULT 5`,
  },
  {
    table: "blog_posts",
    column: "views",
    ddl: `ALTER TABLE blog_posts ADD COLUMN views INT DEFAULT 0`,
  },
  {
    table: "blog_posts",
    column: "meta_title",
    ddl: `ALTER TABLE blog_posts ADD COLUMN meta_title VARCHAR(255) DEFAULT NULL`,
  },
  {
    table: "blog_posts",
    column: "meta_description",
    ddl: `ALTER TABLE blog_posts ADD COLUMN meta_description TEXT`,
  },
  {
    table: "blog_posts",
    column: "published_at",
    ddl: `ALTER TABLE blog_posts ADD COLUMN published_at TIMESTAMP NULL DEFAULT NULL`,
  },
  {
    table: "blog_posts",
    column: "created_at",
    ddl: `ALTER TABLE blog_posts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
  },
  {
    table: "blog_posts",
    column: "updated_at",
    ddl: `ALTER TABLE blog_posts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  },
];

const SEED_SQL = [
  `INSERT IGNORE INTO blog_categories (name, slug, description, color) VALUES
    ('Technology','technology','Latest trends and insights in technology','#3B82F6'),
    ('Web Development','web-development','Web development tutorials and best practices','#10B981'),
    ('AI & Machine Learning','ai-machine-learning','Artificial Intelligence and ML insights','#8B5CF6'),
    ('Business','business','Business strategies and entrepreneurship','#F59E0B'),
    ('Design','design','UI/UX design and creative insights','#EF4444')`,
  `INSERT IGNORE INTO blog_tags (name, slug) VALUES
    ('React','react'),('JavaScript','javascript'),('PHP','php'),('MySQL','mysql'),
    ('API','api'),('Frontend','frontend'),('Backend','backend'),('Tutorial','tutorial'),
    ('Tips','tips'),('Best Practices','best-practices')`,
];

const MODIFY_SQL = [
  {
    table: "blog_posts",
    column: "author_id",
    ddl: `ALTER TABLE blog_posts MODIFY COLUMN author_id INT NULL DEFAULT NULL`,
  },
  {
    table: "blog_posts",
    column: "category",
    ddl: `ALTER TABLE blog_posts MODIFY COLUMN category VARCHAR(100) NULL DEFAULT NULL`,
  },
];

async function dropAllForeignKeysOn(tableName) {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME <> 'PRIMARY'
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [POOL_DB_NAME, tableName],
    );
    let dropped = 0;
    for (const r of rows || []) {
      const name = r && r.CONSTRAINT_NAME;
      if (!name) continue;
      try {
        await pool.execute(`ALTER TABLE ${tableName} DROP FOREIGN KEY ${name}`);
        dropped += 1;
      } catch (e) {
        // ignore individual drop failures
      }
    }
    return dropped;
  } catch (e) {
    return 0;
  }
}

async function dropForeignKeyIfExists(tableName, constraintName) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [POOL_DB_NAME, tableName, constraintName],
    );
    if ((rows && rows[0] && rows[0].c) > 0) {
      await pool.execute(
        `ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraintName}`,
      );
      return true;
    }
  } catch (e) {
    // ignore — best-effort cleanup
  }
  return false;
}

async function columnExists(tableName, columnName) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [POOL_DB_NAME, tableName, columnName],
    );
    return (rows && rows[0] && rows[0].c) > 0;
  } catch (e) {
    return false;
  }
}

const _bootstrapPromise = (async () => {
  let applied = 0,
    skipped = 0,
    warnings = 0;
  try {
    // Best-effort: drop ANY foreign keys on blog_posts (legacy author_id -> users.id etc.)
    // to avoid sync/insert failures when related users rows don't exist or column is nullable.
    const dropped = await dropAllForeignKeysOn("blog_posts");
    applied += dropped;
    if (dropped === 0) skipped += 1;

    for (const sql of IDENT_SQL) {
      try {
        await pool.execute(sql);
        applied += 1;
      } catch (err) {
        const m = String(err.message || "");
        if (
          m.includes("already exists") ||
          m.includes("Duplicate entry") ||
          m.includes("ER_DUP_ENTRY")
        ) {
          skipped += 1;
        } else {
          console.warn(
            "[DB][BOOTSTRAP] Table DDL warn:",
            err && err.code,
            m.slice(0, 140),
          );
          warnings += 1;
        }
      }
    }

    for (const alt of ALTER_SQL) {
      const exists = await columnExists(alt.table, alt.column);
      if (exists) {
        skipped += 1;
        continue;
      }
      try {
        await pool.execute(alt.ddl);
        applied += 1;
      } catch (err) {
        const m = String(err.message || "");
        if (m.includes("Duplicate column") || m.includes("already exists")) {
          skipped += 1;
        } else {
          console.warn(
            `[DB][BOOTSTRAP] ALTER ${alt.table}.${alt.column}:`,
            err && err.code,
            m.slice(0, 140),
          );
          warnings += 1;
        }
      }
    }

    for (const mod of MODIFY_SQL) {
      const exists = await columnExists(mod.table, mod.column);
      if (!exists) {
        skipped += 1;
        continue;
      }
      try {
        await pool.execute(mod.ddl);
        applied += 1;
      } catch (err) {
        const m = String(err.message || "");
        console.warn(
          `[DB][BOOTSTRAP] MODIFY ${mod.table}.${mod.column}:`,
          err && err.code,
          m.slice(0, 140),
        );
        warnings += 1;
      }
    }

    for (const sql of SEED_SQL) {
      try {
        await pool.execute(sql);
        applied += 1;
      } catch (err) {
        const m = String(err.message || "");
        if (m.includes("Duplicate entry") || m.includes("ER_DUP_ENTRY")) {
          skipped += 1;
        } else {
          console.warn(
            "[DB][BOOTSTRAP] Seed warn:",
            err && err.code,
            m.slice(0, 140),
          );
          warnings += 1;
        }
      }
    }

    console.log(
      `[DB][BOOTSTRAP] Schema ready — applied ${applied}, skipped ${skipped}, warnings ${warnings}.`,
    );
  } catch (err) {
    console.error(
      "[DB][BOOTSTRAP] FAILED:",
      err && err.message,
      err && err.stack,
    );
  }
})();

pool.bootstrapReady = () => _bootstrapPromise;

module.exports = pool;
