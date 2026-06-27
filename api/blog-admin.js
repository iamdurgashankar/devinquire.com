const express = require('express');
const router = express.Router();
const db = require('./db');
const { validateAPIKey, checkRateLimit } = require('./auth');

// Apply Auth and Rate Limit middlewares to all admin routes
router.use(validateAPIKey);
router.use(checkRateLimit);

// Helper to slugify text
function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to calculate read time
function calculateReadTime(content) {
  if (!content) return 1;
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  return Math.max(1, readTime);
}

// Helper to link tags to a post
async function addTagsToPost(postId, tags) {
  for (const tagName of tags) {
    if (!tagName) continue;
    const tagSlug = generateSlug(tagName);

    // Find or create tag
    let tagId;
    const [existing] = await db.query('SELECT id FROM blog_tags WHERE slug = ?', [tagSlug]);
    
    if (existing.length === 0) {
      const [insertResult] = await db.query(
        'INSERT INTO blog_tags (name, slug) VALUES (?, ?)',
        [tagName, tagSlug]
      );
      tagId = insertResult.insertId;
    } else {
      tagId = existing[0].id;
    }

    // Link tag to post
    await db.query(
      'INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
      [postId, tagId]
    );
  }
}

/**
 * GET requests
 */
router.get('/', async (req, res) => {
  const action = req.query.action || 'posts';
  const id = req.query.id ? parseInt(req.query.id, 10) : null;

  try {
    switch (action) {
      case 'dashboard-stats': {
        // Post counts by status
        const [postsByStatus] = await db.query(
          'SELECT status, COUNT(*) as count FROM blog_posts GROUP BY status'
        );
        const postStats = {};
        postsByStatus.forEach(row => {
          postStats[row.status] = row.count;
        });

        // Total views
        const [viewsResult] = await db.query('SELECT SUM(views) as total FROM blog_posts');
        const totalViews = viewsResult[0]?.total || 0;

        // Category count
        const [catResult] = await db.query('SELECT COUNT(*) as count FROM blog_categories');
        const categoryCount = catResult[0]?.count || 0;

        // Tag count
        const [tagResult] = await db.query('SELECT COUNT(*) as count FROM blog_tags');
        const tagCount = tagResult[0]?.count || 0;

        // Recent posts
        const [recentPosts] = await db.query(
          'SELECT id, title, status, created_at, views FROM blog_posts ORDER BY created_at DESC LIMIT 5'
        );

        // Popular posts
        const [popularPosts] = await db.query(
          "SELECT id, title, views, published_at FROM blog_posts WHERE status = 'published' ORDER BY views DESC LIMIT 5"
        );

        return res.json({
          success: true,
          data: {
            post_stats: postStats,
            total_views: parseInt(totalViews, 10),
            category_count: parseInt(categoryCount, 10),
            tag_count: parseInt(tagCount, 10),
            recent_posts: recentPosts,
            popular_posts: popularPosts
          }
        });
      }

      case 'categories': {
        const sql = `
          SELECT c.*, COUNT(p.id) as post_count 
          FROM blog_categories c 
          LEFT JOIN blog_posts p ON c.id = p.category_id 
          GROUP BY c.id 
          ORDER BY c.name
        `;
        const [categories] = await db.query(sql);
        return res.json({ success: true, data: categories });
      }

      case 'tags': {
        const sql = `
          SELECT t.*, COUNT(pt.post_id) as post_count 
          FROM blog_tags t 
          LEFT JOIN blog_post_tags pt ON t.id = pt.tag_id 
          GROUP BY t.id 
          ORDER BY t.name
        `;
        const [tags] = await db.query(sql);
        return res.json({ success: true, data: tags });
      }

      case 'posts':
      default: {
        if (id) {
          // Get specific post details
          const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(DISTINCT t.name) as tags,
                   GROUP_CONCAT(DISTINCT t.id) as tag_ids
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.id = ?
            GROUP BY p.id
          `;
          const [posts] = await db.query(sql, [id]);
          if (posts.length > 0) {
            const post = posts[0];
            post.tags = post.tags ? post.tags.split(',') : [];
            post.tag_ids = post.tag_ids ? post.tag_ids.split(',').map(Number) : [];
            post.is_featured = !!post.is_featured;
            return res.json({ success: true, data: post });
          } else {
            return res.status(404).json({ error: 'Post not found' });
          }
        } else {
          // Get admin posts list
          const status = req.query.status || 'all';
          const category = req.query.category || '';
          const search = req.query.search || '';
          const limit = parseInt(req.query.limit || '20', 10);
          const offset = parseInt(req.query.offset || '0', 10);
          const orderBy = req.query.order_by || 'created_at';
          const orderDir = req.query.order_dir === 'ASC' ? 'ASC' : 'DESC';

          let sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags,
                   COUNT(*) OVER() as total_count
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE 1=1
          `;

          const params = {};

          if (status !== 'all') {
            sql += ` AND p.status = :status`;
            params.status = status;
          }

          if (category) {
            sql += ` AND c.slug = :category`;
            params.category = category;
          }

          if (search) {
            sql += ` AND (p.title LIKE :search OR p.content LIKE :search OR p.excerpt LIKE :search)`;
            params.search = `%${search}%`;
          }

          // Whitelist sorting columns
          const allowedSort = ['title', 'created_at', 'updated_at', 'published_at', 'views', 'status'];
          const sortField = allowedSort.includes(orderBy) ? orderBy : 'created_at';

          sql += ` GROUP BY p.id ORDER BY p.${sortField} ${orderDir} LIMIT :limit OFFSET :offset`;
          params.limit = limit;
          params.offset = offset;

          const [posts] = await db.query(sql, params);
          const totalCount = posts[0]?.total_count || 0;

          posts.forEach(post => {
            post.tags = post.tags ? post.tags.split(',') : [];
            post.is_featured = !!post.is_featured;
            delete post.total_count;
          });

          return res.json({
            success: true,
            data: posts,
            pagination: {
              total: parseInt(totalCount, 10),
              limit: limit,
              offset: offset,
              pages: Math.ceil(totalCount / limit)
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Admin GET error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin data' });
  }
});

/**
 * POST requests
 */
router.post('/', async (req, res) => {
  const action = req.query.action || 'posts';
  const data = req.body || {};

  try {
    switch (action) {
      case 'posts': {
        if (!data.title || !data.content) {
          return res.status(400).json({ error: 'Title and content are required' });
        }

        let slug = data.slug || generateSlug(data.title);
        const [existing] = await db.query('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
        if (existing.length > 0) {
          slug += '-' + Date.now();
        }

        const published_at = data.status === 'published' ? new Date() : null;
        const readTime = data.read_time || calculateReadTime(data.content);

        const [result] = await db.query(
          `INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, category_id, 
                                author_name, author_email, author_avatar, status, is_featured, 
                                read_time, meta_title, meta_description, published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.title,
            slug,
            data.excerpt || null,
            data.content,
            data.featured_image || null,
            data.category_id || null,
            data.author_name || 'Admin User',
            data.author_email || null,
            data.author_avatar || null,
            data.status || 'draft',
            data.is_featured ? 1 : 0,
            readTime,
            data.meta_title || data.title,
            data.meta_description || null,
            published_at
          ]
        );

        const postId = result.insertId;

        if (data.tags && Array.isArray(data.tags)) {
          await addTagsToPost(postId, data.tags);
        }

        return res.json({
          success: true,
          data: {
            id: postId,
            slug: slug,
            message: 'Post created successfully'
          }
        });
      }

      case 'categories': {
        if (!data.name) {
          return res.status(400).json({ error: 'Category name is required' });
        }
        const slug = data.slug || generateSlug(data.name);

        try {
          const [result] = await db.query(
            'INSERT INTO blog_categories (name, slug, description, color) VALUES (?, ?, ?, ?)',
            [data.name, slug, data.description || null, data.color || '#3B82F6']
          );
          return res.json({
            success: true,
            data: {
              id: result.insertId,
              slug,
              message: 'Category created successfully'
            }
          });
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Category name or slug already exists' });
          }
          throw err;
        }
      }

      case 'tags': {
        if (!data.name) {
          return res.status(400).json({ error: 'Tag name is required' });
        }
        const slug = data.slug || generateSlug(data.name);

        try {
          const [result] = await db.query(
            'INSERT INTO blog_tags (name, slug) VALUES (?, ?)',
            [data.name, slug]
          );
          return res.json({
            success: true,
            data: {
              id: result.insertId,
              slug,
              message: 'Tag created successfully'
            }
          });
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Tag name or slug already exists' });
          }
          throw err;
        }
      }

      case 'bulk-action': {
        return handleBulkAction(data, res);
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return res.status(500).json({ error: 'Failed to perform admin creation' });
  }
});

/**
 * PUT requests
 */
router.put('/', async (req, res) => {
  const action = req.query.action || '';
  const id = req.query.id ? parseInt(req.query.id, 10) : null;
  const data = req.body || {};

  if (!id && action !== 'bulk-update') {
    return res.status(400).json({ error: 'ID required for update' });
  }

  try {
    switch (action) {
      case 'posts': {
        const [existing] = await db.query('SELECT id FROM blog_posts WHERE id = ?', [id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Post not found' });
        }

        const published_at = data.status === 'published' ? new Date() : null;
        const readTime = data.read_time || calculateReadTime(data.content);

        await db.query(
          `UPDATE blog_posts SET 
             title = ?, excerpt = ?, content = ?, featured_image = ?, 
             category_id = ?, author_name = ?, author_email = ?, 
             author_avatar = ?, status = ?, is_featured = ?, 
             read_time = ?, meta_title = ?, meta_description = ?, 
             published_at = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            data.title,
            data.excerpt || null,
            data.content,
            data.featured_image || null,
            data.category_id || null,
            data.author_name || 'Admin User',
            data.author_email || null,
            data.author_avatar || null,
            data.status || 'draft',
            data.is_featured ? 1 : 0,
            readTime,
            data.meta_title || data.title,
            data.meta_description || null,
            published_at,
            id
          ]
        );

        if (data.tags && Array.isArray(data.tags)) {
          // Remove existing post-tags links
          await db.query('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);
          // Add new post-tags links
          await addTagsToPost(id, data.tags);
        }

        return res.json({ success: true, message: 'Post updated successfully' });
      }

      case 'categories': {
        const [result] = await db.query(
          'UPDATE blog_categories SET name = ?, description = ?, color = ? WHERE id = ?',
          [data.name, data.description || null, data.color || '#3B82F6', id]
        );
        if (result.affectedRows > 0) {
          return res.json({ success: true, message: 'Category updated successfully' });
        }
        return res.status(404).json({ error: 'Category not found' });
      }

      case 'tags': {
        const [result] = await db.query(
          'UPDATE blog_tags SET name = ? WHERE id = ?',
          [data.name, id]
        );
        if (result.affectedRows > 0) {
          return res.json({ success: true, message: 'Tag updated successfully' });
        }
        return res.status(404).json({ error: 'Tag not found' });
      }

      case 'bulk-update': {
        return handleBulkAction(data, res);
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin PUT error:', error);
    return res.status(500).json({ error: 'Failed to update admin data' });
  }
});

/**
 * DELETE requests
 */
router.delete('/', async (req, res) => {
  const action = req.query.action || '';
  const id = req.query.id ? parseInt(req.query.id, 10) : null;

  if (!id) {
    return res.status(400).json({ error: 'ID required for deletion' });
  }

  try {
    switch (action) {
      case 'posts': {
        const [result] = await db.query('DELETE FROM blog_posts WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
          return res.json({ success: true, message: 'Post deleted successfully' });
        }
        return res.status(404).json({ error: 'Post not found' });
      }

      case 'categories': {
        // Check if category has posts first
        const [countResult] = await db.query(
          'SELECT COUNT(*) as count FROM blog_posts WHERE category_id = ?',
          [id]
        );
        const postCount = countResult[0]?.count || 0;
        if (postCount > 0) {
          return res.status(409).json({
            error: `Cannot delete category with ${postCount} posts. Move posts to another category first.`
          });
        }

        const [result] = await db.query('DELETE FROM blog_categories WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
          return res.json({ success: true, message: 'Category deleted successfully' });
        }
        return res.status(404).json({ error: 'Category not found' });
      }

      case 'tags': {
        const [result] = await db.query('DELETE FROM blog_tags WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
          return res.json({ success: true, message: 'Tag deleted successfully' });
        }
        return res.status(404).json({ error: 'Tag not found' });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin DELETE error:', error);
    return res.status(500).json({ error: 'Failed to delete admin item' });
  }
});

// Helper for bulk actions
async function handleBulkAction(data, res) {
  const action = data.action || '';
  const postIds = data.post_ids || [];

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ error: 'Post IDs are required' });
  }

  try {
    let sql = '';
    const params = [...postIds];

    switch (action) {
      case 'publish':
        sql = `UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE id IN (${postIds.map(() => '?').join(',')})`;
        break;
      case 'draft':
        sql = `UPDATE blog_posts SET status = 'draft', published_at = NULL WHERE id IN (${postIds.map(() => '?').join(',')})`;
        break;
      case 'archive':
        sql = `UPDATE blog_posts SET status = 'archived' WHERE id IN (${postIds.map(() => '?').join(',')})`;
        break;
      case 'delete':
        sql = `DELETE FROM blog_posts WHERE id IN (${postIds.map(() => '?').join(',')})`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid bulk action' });
    }

    const [result] = await db.query(sql, params);
    
    return res.json({
      success: true,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} action completed for ${result.affectedRows} posts`
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    throw error;
  }
}

module.exports = router;
