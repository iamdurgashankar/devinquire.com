# Blog API Setup for Shared Hosting (Hostinger)

Since you're using Hostinger shared hosting, we'll set up a simple Node.js server that can run on any Node.js hosting service (Railway, Render, Heroku, etc.) and connect to your Firebase Firestore.

## Option 1: Deploy Node.js Server (Recommended)

### Step 1: Choose a Node.js Hosting Service

You can use any of these free/cheap services:
- **Railway** (railway.app) - Free tier available
- **Render** (render.com) - Free tier available  
- **Heroku** - Free tier available
- **Fly.io** - Free tier available
- **Vercel** - Free tier available
- **Any VPS** - DigitalOcean, Linode, etc.

### Step 2: Prepare Your Server

I've created a simple Express server file: `dashboard/server-blog-api.js`

### Step 3: Deploy to Railway (Easiest)

1. **Create account** at [railway.app](https://railway.app)

2. **Create new project** → "Deploy from GitHub repo"

3. **Add environment variables**:
   ```
   PORT=3000
   BLOG_API_KEY=2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271
   FIREBASE_SERVICE_ACCOUNT=<your-firebase-service-account-json>
   ```

4. **Update package.json** to add start script:
   ```json
   {
     "scripts": {
       "start": "node server-blog-api.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5",
       "firebase-admin": "^11.0.0"
     }
   }
   ```

5. **Deploy** - Railway will automatically detect and deploy

6. **Get your URL**: Railway will give you a URL like `https://your-app.railway.app`

### Step 4: Update devinquire.com Config

Update `devinquire.com/src/config.js`:

```javascript
const BLOG_API_CONFIG = {
  baseUrl: 'https://your-app.railway.app/blogmanager',
  apiKey: '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271'
};
```

### Step 5: Get Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Convert to environment variable string (or upload to your hosting service)

**To convert JSON to environment variable:**
```bash
# On Mac/Linux
cat serviceAccountKey.json | jq -c

# Or manually copy the JSON content and minify it
```

## Option 2: Deploy to Render

1. **Create account** at [render.com](https://render.com)

2. **Create new Web Service**

3. **Connect your GitHub repo**

4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `node server-blog-api.js`
   - Environment Variables: Same as Railway

5. **Deploy**

## Option 3: Use Your Own VPS

If you have SSH access to a VPS:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone <your-repo>
cd devinquire/dashboard

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Create .env file
nano .env
# Add:
# PORT=3007
# BLOG_API_KEY=2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Start with PM2
pm2 start server-blog-api.js --name blog-api
pm2 save
pm2 startup
```

## Option 4: PHP Sync Script (Alternative)

If you prefer to keep everything on Hostinger, create a PHP script that syncs Firebase posts to MySQL:

### Create `dashboard/sync-firebase-to-mysql.php`:

```php
<?php
/**
 * Sync Firebase Firestore posts to MySQL database
 * Run this via cron job every 5-10 minutes
 */

require_once __DIR__ . '/../devinquire.com/api/config/database.php';

// Firebase Admin SDK (you'll need to install via Composer)
use Google\Cloud\Firestore\FirestoreClient;

$db = new Database();
$pdo = $db->getConnection();

try {
    // Initialize Firestore
    $firestore = new FirestoreClient([
        'keyFilePath' => __DIR__ . '/firebase/serviceAccountKey.json'
    ]);
    
    // Get all published posts from Firestore
    $postsRef = $firestore->collection('posts');
    $query = $postsRef->where('status', '=', 'published')
                      ->where('isPublic', '=', true);
    $posts = $query->documents();
    
    foreach ($posts as $doc) {
        $data = $doc->data();
        $firestoreId = $doc->id();
        
        // Check if post exists in MySQL
        $stmt = $pdo->prepare("SELECT id FROM blog_posts WHERE firestore_id = ?");
        $stmt->execute([$firestoreId]);
        $existing = $stmt->fetch();
        
        // Get category ID
        $categoryStmt = $pdo->prepare("SELECT id FROM blog_categories WHERE slug = ?");
        $categorySlug = strtolower(str_replace(' ', '-', $data['category']));
        $categoryStmt->execute([$categorySlug]);
        $category = $categoryStmt->fetch();
        
        if (!$category) {
            // Create category if it doesn't exist
            $insertCategory = $pdo->prepare("INSERT INTO blog_categories (name, slug) VALUES (?, ?)");
            $insertCategory->execute([$data['category'], $categorySlug]);
            $categoryId = $pdo->lastInsertId();
        } else {
            $categoryId = $category['id'];
        }
        
        // Prepare post data
        $postData = [
            'firestore_id' => $firestoreId,
            'title' => $data['title'],
            'slug' => $data['slug'],
            'content' => $data['content'],
            'excerpt' => $data['excerpt'] ?? '',
            'category_id' => $categoryId,
            'status' => 'published',
            'author_name' => $data['author']['name'] ?? $data['author_name'] ?? 'Admin',
            'featured_image' => $data['featuredImage'] ?? $data['featured_image'] ?? null,
            'published_at' => $data['publishedAt'] ? date('Y-m-d H:i:s', $data['publishedAt']->getTimestamp()) : date('Y-m-d H:i:s'),
            'updated_at' => $data['updatedAt'] ? date('Y-m-d H:i:s', $data['updatedAt']->getTimestamp()) : date('Y-m-d H:i:s')
        ];
        
        if ($existing) {
            // Update existing post
            $update = $pdo->prepare("
                UPDATE blog_posts SET 
                    title = ?, slug = ?, content = ?, excerpt = ?, 
                    category_id = ?, featured_image = ?, 
                    published_at = ?, updated_at = ?
                WHERE firestore_id = ?
            ");
            $update->execute([
                $postData['title'], $postData['slug'], $postData['content'],
                $postData['excerpt'], $postData['category_id'], 
                $postData['featured_image'], $postData['published_at'],
                $postData['updated_at'], $firestoreId
            ]);
        } else {
            // Insert new post
            $insert = $pdo->prepare("
                INSERT INTO blog_posts 
                (firestore_id, title, slug, content, excerpt, category_id, 
                 status, author_name, featured_image, published_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            ");
            $insert->execute([
                $postData['firestore_id'], $postData['title'], $postData['slug'],
                $postData['content'], $postData['excerpt'], $postData['category_id'],
                $postData['status'], $postData['author_name'], 
                $postData['featured_image'], $postData['published_at'],
                $postData['updated_at']
            ]);
        }
        
        // Sync tags
        if (!empty($data['tags'])) {
            $pdo->prepare("DELETE FROM blog_post_tags WHERE post_id = ?")
                ->execute([$existing ? $existing['id'] : $pdo->lastInsertId()]);
            
            foreach ($data['tags'] as $tagName) {
                // Get or create tag
                $tagStmt = $pdo->prepare("SELECT id FROM blog_tags WHERE name = ?");
                $tagStmt->execute([$tagName]);
                $tag = $tagStmt->fetch();
                
                if (!$tag) {
                    $insertTag = $pdo->prepare("INSERT INTO blog_tags (name, slug) VALUES (?, ?)");
                    $tagSlug = strtolower(str_replace(' ', '-', $tagName));
                    $insertTag->execute([$tagName, $tagSlug]);
                    $tagId = $pdo->lastInsertId();
                } else {
                    $tagId = $tag['id'];
                }
                
                // Link tag to post
                $linkTag = $pdo->prepare("INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)");
                $linkTag->execute([$existing ? $existing['id'] : $pdo->lastInsertId(), $tagId]);
            }
        }
    }
    
    echo "✅ Sync completed: " . count($posts) . " posts synced\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
```

Then set up a cron job on Hostinger:
```bash
# Run every 5 minutes
*/5 * * * * /usr/bin/php /path/to/sync-firebase-to-mysql.php
```

## Recommended Approach

**I recommend Option 1 (Railway/Render)** because:
- ✅ Free tier available
- ✅ Easy to set up (5 minutes)
- ✅ Automatic deployments
- ✅ No server management needed
- ✅ Direct connection to Firebase (no sync delay)

## Testing

Once deployed, test your API:

```bash
# Test posts endpoint
curl "https://your-app.railway.app/blogmanager/api/blog/posts?status=published&limit=10" \
  -H "X-API-Key: 2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271"

# Test categories endpoint
curl "https://your-app.railway.app/blogmanager/api/blog/categories" \
  -H "X-API-Key: 2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271"

# Test category filter
curl "https://your-app.railway.app/blogmanager/api/blog/posts?category=Web%20Development&status=published" \
  -H "X-API-Key: 2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271"
```

## Troubleshooting

### Firebase Connection Issues
- Make sure `FIREBASE_SERVICE_ACCOUNT` environment variable is set correctly
- JSON should be minified (no line breaks)
- Check Firebase project permissions

### API Key Issues
- Verify API key matches in both server and client config
- Check headers are being sent correctly

### CORS Issues
- Update CORS origin in `server-blog-api.js` to your actual domain
- Or keep `origin: '*'` for development

Need help with any specific step? Let me know!



