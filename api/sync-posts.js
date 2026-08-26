const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("./db");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const isProd = process.env.NODE_ENV === "production";
const WEBHOOK_SECRET = process.env.SYNC_WEBHOOK_SECRET;
const DASHBOARD_API_URL = isProd
  ? process.env.DASHBOARD_API_URL ||
    "https://dashboard.devinquire.com/api/public"
  : process.env.DASHBOARD_API_URL || "http://localhost:8001/api/public";

if (!WEBHOOK_SECRET) {
  console.error(
    "[FATAL] SYNC_WEBHOOK_SECRET env var missing. Set in devinquire.com/.env. Generate:\n  node -e \"console.log(crypto.randomBytes(48).toString('hex'))\"",
  );
  process.exit(1);
}
if (isProd && WEBHOOK_SECRET.length < 24) {
  console.error(
    "[FATAL] SYNC_WEBHOOK_SECRET must be >= 24 chars in production.",
  );
  process.exit(1);
}
if (WEBHOOK_SECRET === "devinquire-secret-token-123" && isProd) {
  console.error(
    "[FATAL] SYNC_WEBHOOK_SECRET is using weak placeholder. ROTATE immediately.",
  );
  process.exit(1);
}
if (
  isProd &&
  (!process.env.DASHBOARD_API_URL ||
    process.env.DASHBOARD_API_URL.includes("localhost"))
) {
  console.warn(
    "[WARN] DASHBOARD_API_URL is localhost or unset in production. Sync posts may fail. Set to https://dashboard.devinquire.com/api/public",
  );
}

// Helper to generate a slug (matching PHP sync script)
function generateSlug(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to format ISO date string to MySQL datetime string
function formatMySQLDate(dateString) {
  if (!dateString)
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 19).replace("T", " ");
    }
    return d.toISOString().slice(0, 19).replace("T", " ");
  } catch (err) {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }
}

async function ensureTablesExist() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          slug VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
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
          status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
          is_featured BOOLEAN DEFAULT FALSE,
          read_time INT DEFAULT 5,
          views INT DEFAULT 0,
          meta_title VARCHAR(255),
          meta_description TEXT,
          published_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL,
          INDEX idx_slug (slug),
          INDEX idx_status (status),
          INDEX idx_firestore_id (firestore_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_post_tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          tag_id INT NOT NULL,
          FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE,
          UNIQUE KEY unique_post_tag (post_id, tag_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.warn("[Sync] Non-critical schema setup warning:", err.message);
  }
}

/**
 * Sync a single post to MySQL (matching PHP syncPostToMySQL)
 */
async function syncPostToMySQL(postData) {
  await ensureTablesExist();
  const dashboardId = postData.id;
  const title = postData.title || "";

  let slug = generateSlug(title);
  if (!slug) slug = "post-" + dashboardId;

  const content = postData.content || "";
  const excerpt = postData.excerpt || "";
  const category = postData.category || "Uncategorized";
  const authorName = postData.author_name || "Admin";
  const status = "published";
  const publishedAt = formatMySQLDate(postData.created_at);
  const tags = postData.tags || [];

  // Get or create category
  const categorySlug = generateSlug(category);
  let categoryId;
  const [cats] = await db.query(
    "SELECT id FROM blog_categories WHERE slug = ?",
    [categorySlug],
  );

  if (cats.length === 0) {
    const [catInsert] = await db.query(
      "INSERT INTO blog_categories (name, slug) VALUES (?, ?)",
      [category, categorySlug],
    );
    categoryId = catInsert.insertId;
  } else {
    categoryId = cats[0].id;
  }

  // Check if post exists (reusing firestore_id column as external dashboard_id)
  const [existing] = await db.query(
    "SELECT id FROM blog_posts WHERE firestore_id = ?",
    [String(dashboardId)],
  );

  let postId;
  if (existing.length > 0) {
    // Update existing post
    postId = existing[0].id;
    await db.query(
      `UPDATE blog_posts SET 
         title = ?, slug = ?, content = ?, excerpt = ?, 
         category_id = ?, status = ?, author_name = ?, 
         published_at = ?, updated_at = NOW()
       WHERE firestore_id = ?`,
      [
        title,
        slug,
        content,
        excerpt,
        categoryId,
        status,
        authorName,
        publishedAt,
        String(dashboardId),
      ],
    );
  } else {
    // Insert new post — author_id FK dropped at bootstrap; nullable legacy column
    const [postInsert] = await db.query(
      `INSERT INTO blog_posts 
       (firestore_id, title, slug, content, excerpt, category_id, 
        status, author_name, published_at, created_at, updated_at, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)`,
      [
        String(dashboardId),
        title,
        slug,
        content,
        excerpt,
        categoryId,
        status,
        authorName,
        publishedAt,
      ],
    );
    postId = postInsert.insertId;
  }

  // Sync tags
  if (Array.isArray(tags) && tags.length > 0) {
    // Delete existing tags linking for this post
    await db.query("DELETE FROM blog_post_tags WHERE post_id = ?", [postId]);

    for (const tagName of tags) {
      if (!tagName) continue;
      const tagSlug = generateSlug(tagName);

      // Find or create tag
      let tagId;
      const [exTags] = await db.query(
        "SELECT id FROM blog_tags WHERE name = ?",
        [tagName],
      );
      if (exTags.length === 0) {
        const [tagInsert] = await db.query(
          "INSERT INTO blog_tags (name, slug) VALUES (?, ?)",
          [tagName, tagSlug],
        );
        tagId = tagInsert.insertId;
      } else {
        tagId = exTags[0].id;
      }

      // Link tag to post
      await db.query(
        "INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)",
        [postId, tagId],
      );
    }
  }

  return true;
}

/**
 * Handle Webhook Sync Route
 */
router.all("/", async (req, res) => {
  const providedToken = req.query.token || req.body?.token || "";

  if (providedToken !== WEBHOOK_SECRET) {
    return res.status(403).json({ error: "Unauthorized access to webhook." });
  }

  console.log("Starting Dashboard posts sync...");
  let synced = 0;
  let skipped = 0;

  try {
    const baseUrl = DASHBOARD_API_URL.replace(/\/$/, "");
    let listResponse = await fetch(`${baseUrl}/blog_list.php`).catch(
      () => null,
    );
    if (!listResponse || !listResponse.ok) {
      listResponse = await fetch(`${baseUrl}/blog_list`).catch(() => null);
    }

    if (!listResponse || !listResponse.ok) {
      throw new Error(`Failed to fetch blog list from dashboard`);
    }

    const listData = await listResponse.json();
    if (listData.status !== "success" || !Array.isArray(listData.data)) {
      throw new Error("Invalid response layout from dashboard posts list");
    }

    const postsList = listData.data;
    console.log(`Fetched ${postsList.length} posts overview from dashboard`);

    for (const postOverview of postsList) {
      try {
        let detailResponse = await fetch(
          `${baseUrl}/blog_detail.php?id=${encodeURIComponent(postOverview.id)}`,
        ).catch(() => null);
        if (!detailResponse || !detailResponse.ok) {
          detailResponse = await fetch(
            `${baseUrl}/blog_detail?id=${encodeURIComponent(postOverview.id)}`,
          ).catch(() => null);
        }

        if (!detailResponse || !detailResponse.ok) {
          console.warn(
            `Skipping post ID ${postOverview.id} details fetch failed`,
          );
          skipped++;
          continue;
        }

        const detailData = await detailResponse.json();
        if (detailData.status === "success" && detailData.data) {
          await syncPostToMySQL(detailData.data);
          synced++;
        } else {
          skipped++;
        }
      } catch (postError) {
        console.error(
          `Error syncing post ID ${postOverview.id}:`,
          postError.message,
        );
        skipped++;
      }
    }

    const message = `Sync completed: ${synced} posts synced, ${skipped} skipped`;
    console.log(`✅ ${message}`);
    return res.json({ success: true, message, synced, skipped });
  } catch (error) {
    console.error("❌ Sync error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
exportSyncLogic = { syncPostToMySQL }; // export for command line testing or manual execution if needed
