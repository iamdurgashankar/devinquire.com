/**
 * Data Migration Script: SQLite to Firestore
 * Migrates existing data from SQLite database to Firestore
 */

const admin = require("firebase-admin");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = require("../firebase/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com",
});

const db = admin.firestore();

// Connect to SQLite database
const sqliteDbPath = path.join(__dirname, "../backend/data/dashboard.db");
const sqliteDb = new sqlite3.Database(sqliteDbPath);

/**
 * Migrate users from SQLite to Firestore
 */
async function migrateUsers() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM users", async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        console.log(`Migrating ${rows.length} users...`);

        for (const row of rows) {
          // Transform user data to match Firestore schema
          const userData = {
            uid: `sqlite_${row.id}`, // Create a temporary UID
            email: row.email,
            name: row.name,
            role: row.role || "user",
            status: row.status || "active",
            provider: row.provider || "email",
            verified: false, // Will need to be verified separately
            permissions: [],
            preferences: {
              theme: "system",
              language: "en",
              notifications: {
                email: true,
                push: true,
                marketing: false,
              },
            },
            metadata: {
              createdAt: row.created_at
                ? new Date(row.created_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: row.updated_at
                ? new Date(row.updated_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              lastLoginAt: null,
              loginCount: 0,
              emailVerifiedAt: null,
            },
          };

          // Create user in Firestore
          await db.collection("users").doc(userData.uid).set(userData);
          console.log(`Migrated user: ${row.email}`);
        }

        console.log("User migration completed successfully");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Migrate posts from SQLite to Firestore
 */
async function migratePosts() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM posts", async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        console.log(`Migrating ${rows.length} posts...`);

        for (const row of rows) {
          // Transform post data to match Firestore schema
          const postData = {
            title: row.title,
            slug: row.slug,
            content: row.content || "",
            excerpt: row.excerpt || "",
            status: row.status || "draft",
            type: "post",
            authorId: row.author_id ? `sqlite_${row.author_id}` : "unknown",
            authorName: "", // Will be populated later
            authorAvatar: null,
            category: "",
            tags: [],
            featuredImage: row.featured_image || "",
            images: [],
            metadata: {
              createdAt: row.created_at
                ? new Date(row.created_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: row.updated_at
                ? new Date(row.updated_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              publishedAt:
                row.status === "published"
                  ? row.updated_at
                    ? new Date(row.updated_at)
                    : admin.firestore.FieldValue.serverTimestamp()
                  : null,
              deletedAt: null,
            },
            seo: {
              metaTitle: row.meta_title || row.title || "",
              metaDescription: row.meta_description || "",
              canonicalUrl: "",
              noIndex: false,
              noFollow: false,
            },
            analytics: {
              views: 0,
              likes: 0,
              shares: 0,
              comments: 0,
              readTime: 0,
            },
            settings: {
              allowComments: true,
              allowSharing: true,
              isPinned: false,
              isFeatured: false,
              requireAuth: false,
            },
          };

          // Create post in Firestore
          const docRef = await db.collection("posts").add(postData);
          console.log(`Migrated post: ${row.title} (ID: ${docRef.id})`);
        }

        console.log("Post migration completed successfully");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Migrate pages from SQLite to Firestore
 */
async function migratePages() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM pages", async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        console.log(`Migrating ${rows.length} pages...`);

        for (const row of rows) {
          // Transform page data to match Firestore schema
          const pageData = {
            title: row.title,
            slug: row.slug || "",
            content: row.content || "",
            template: row.template || "default",
            status: row.status || "draft",
            authorId: "system", // Pages don't have authors in the current schema
            parentId: null,
            order: 0,
            layout: {
              type: "default",
              components: [],
              styles: {},
              scripts: [],
            },
            metadata: {
              createdAt: row.created_at
                ? new Date(row.created_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: row.updated_at
                ? new Date(row.updated_at)
                : admin.firestore.FieldValue.serverTimestamp(),
              publishedAt:
                row.status === "published"
                  ? row.updated_at
                    ? new Date(row.updated_at)
                    : admin.firestore.FieldValue.serverTimestamp()
                  : null,
            },
            seo: {
              metaTitle: row.meta_title || row.title || "",
              metaDescription: row.meta_description || "",
              canonicalUrl: "",
              ogImage: "",
            },
            permissions: {
              visibility: "public",
              allowedRoles: [],
              allowedUsers: [],
            },
          };

          // Create page in Firestore
          const docRef = await db.collection("pages").add(pageData);
          console.log(`Migrated page: ${row.title} (ID: ${docRef.id})`);
        }

        console.log("Page migration completed successfully");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Migrate sessions from SQLite to Firestore
 */
async function migrateSessions() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM sessions", async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        console.log(`Migrating ${rows.length} sessions...`);

        for (const row of rows) {
          // Transform session data to match Firestore schema
          const sessionData = {
            sessionId: row.id,
            userId: row.user_id ? `sqlite_${row.user_id}` : null,
            data: row.data || "",
            expiresAt: row.expires_at
              ? new Date(row.expires_at)
              : admin.firestore.FieldValue.serverTimestamp(),
            createdAt: row.created_at
              ? new Date(row.created_at)
              : admin.firestore.FieldValue.serverTimestamp(),
          };

          // Create session in Firestore
          await db.collection("sessions").doc(row.id).set(sessionData);
          console.log(`Migrated session: ${row.id}`);
        }

        console.log("Session migration completed successfully");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Main migration function
 */
async function migrateAllData() {
  try {
    console.log("Starting data migration from SQLite to Firestore...");

    // Migrate users
    await migrateUsers();

    // Migrate posts
    await migratePosts();

    // Migrate pages
    await migratePages();

    // Migrate sessions
    await migrateSessions();

    console.log("All data migration completed successfully!");

    // Close SQLite database connection
    sqliteDb.close();

    // Exit process
    process.exit(0);
  } catch (error) {
    console.error("Data migration failed:", error);

    // Close SQLite database connection
    sqliteDb.close();

    // Exit with error
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateAllData();
}

module.exports = {
  migrateUsers,
  migratePosts,
  migratePages,
  migrateSessions,
  migrateAllData,
};
