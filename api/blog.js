const express = require('express');
const router = express.Router();
const db = require('./db');
const { checkRateLimit } = require('./auth');

// Helper to slugify text (matching PHP generateSlug)
function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to link tags to a post (matching PHP addTagsToPost)
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

// RESTful Endpoints
router.get('/categories', checkRateLimit, async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM blog_categories ORDER BY name');
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Blog categories error:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/posts', checkRateLimit, async (req, res) => {
  try {
    const category = req.query.category || '';
    const status = req.query.status || 'published';
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             GROUP_CONCAT(t.name) as tags
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
      LEFT JOIN blog_tags t ON pt.tag_id = t.id
      WHERE 1=1
    `;
    const params = {};

    if (status && status !== 'all') {
      sql += ` AND p.status = :status`;
      params.status = status;
    }

    if (category && category !== 'All' && category !== 'all') {
      sql += ` AND (c.slug = :category OR LOWER(c.name) = LOWER(:category))`;
      params.category = category.toLowerCase().replace(/\s+/g, '-');
    }

    sql += ` GROUP BY p.id ORDER BY p.published_at DESC, p.created_at DESC LIMIT :limit OFFSET :offset`;
    params.limit = limit;
    params.offset = offset;

    const [posts] = await db.query(sql, params);
    posts.forEach(post => {
      post.tags = post.tags ? post.tags.split(',') : [];
      post.is_featured = !!post.is_featured;
    });

    return res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Blog posts error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/posts/:identifier', checkRateLimit, async (req, res) => {
  const { identifier } = req.params;
  try {
    const isNumeric = /^\d+$/.test(identifier);
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             GROUP_CONCAT(t.name) as tags
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
      LEFT JOIN blog_tags t ON pt.tag_id = t.id
      WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
      GROUP BY p.id
    `;

    const [posts] = await db.query(sql, [identifier]);
    if (posts.length > 0) {
      const post = posts[0];
      post.tags = post.tags ? post.tags.split(',') : [];
      post.is_featured = !!post.is_featured;

      // Increment view count
      await db.query(`UPDATE blog_posts SET views = views + 1 WHERE ${isNumeric ? 'id' : 'slug'} = ?`, [identifier]);

      return res.json({ success: true, data: post });
    } else {
      return res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('Blog post detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch post detail' });
  }
});

/**
 * Handle GET requests (mimicking PHP handleGet)
 */
router.get('/', checkRateLimit, async (req, res) => {
  const action = req.query.action || 'posts';
  const id = req.query.id ? parseInt(req.query.id, 10) : null;
  const slug = req.query.slug || null;

  try {
    switch (action) {
      case 'categories': {
        const [categories] = await db.query('SELECT * FROM blog_categories ORDER BY name');
        return res.json({ success: true, data: categories });
      }
      
      case 'tags': {
        const [tags] = await db.query('SELECT * FROM blog_tags ORDER BY name');
        return res.json({ success: true, data: tags });
      }
      
      case 'featured': {
        const sql = `
          SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                 GROUP_CONCAT(t.name) as tags
          FROM blog_posts p
          LEFT JOIN blog_categories c ON p.category_id = c.id
          LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
          LEFT JOIN blog_tags t ON pt.tag_id = t.id
          WHERE p.is_featured = 1 AND p.status = 'published'
          GROUP BY p.id
          ORDER BY p.published_at DESC
          LIMIT 3
        `;
        const [posts] = await db.query(sql);
        posts.forEach(post => {
          post.tags = post.tags ? post.tags.split(',') : [];
          // convert tinyint to boolean for is_featured
          post.is_featured = !!post.is_featured;
        });
        return res.json({ success: true, data: posts });
      }

      case 'posts':
      default: {
        if (id) {
          // Get post by ID
          const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
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
            post.is_featured = !!post.is_featured;
            
            // Increment view count
            await db.query('UPDATE blog_posts SET views = views + 1 WHERE id = ?', [id]);
            
            return res.json({ success: true, data: post });
          } else {
            return res.status(404).json({ error: 'Post not found' });
          }
        } else if (slug) {
          // Get post by Slug
          const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.slug = ? AND p.status = 'published'
            GROUP BY p.id
          `;
          const [posts] = await db.query(sql, [slug]);
          if (posts.length > 0) {
            const post = posts[0];
            post.tags = post.tags ? post.tags.split(',') : [];
            post.is_featured = !!post.is_featured;

            // Increment view count
            await db.query('UPDATE blog_posts SET views = views + 1 WHERE slug = ?', [slug]);

            return res.json({ success: true, data: post });
          } else {
            return res.status(404).json({ error: 'Post not found' });
          }
        } else {
          // Get all posts
          const category = req.query.category || '';
          const status = req.query.status || 'published';
          const limit = parseInt(req.query.limit || '20', 10);
          const offset = parseInt(req.query.offset || '0', 10);
          
          let sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE 1=1
          `;
          
          const params = {};
          if (status && status !== 'all') {
            sql += ` AND p.status = :status`;
            params.status = status;
          }
          
          if (category && category !== 'All' && category !== 'all') {
            sql += ` AND (c.slug = :category OR LOWER(c.name) = LOWER(:category))`;
            params.category = category.toLowerCase().replace(/\s+/g, '-');
          }
          
          // Append pagination and order
          sql += ` GROUP BY p.id ORDER BY p.published_at DESC, p.created_at DESC LIMIT :limit OFFSET :offset`;
          params.limit = limit;
          params.offset = offset;
          
          const [posts] = await db.query(sql, params);
          posts.forEach(post => {
            post.tags = post.tags ? post.tags.split(',') : [];
            post.is_featured = !!post.is_featured;
          });
          
          return res.json({ success: true, data: posts });
        }
      }
    }
  } catch (error) {
    console.error('Blog GET error:', error);
    return res.status(500).json({ error: 'Failed to fetch blog data' });
  }
});

/**
 * Handle POST requests (mimicking PHP handlePost)
 */
router.post('/', checkRateLimit, async (req, res) => {
  const action = req.query.action || '';
  const data = req.body || {};

  try {
    switch (action) {
      case 'posts': {
        if (!data.title || !data.content) {
          return res.status(400).json({ error: 'Title and content are required' });
        }

        let slug = data.slug || generateSlug(data.title);
        // Check if slug exists
        const [existing] = await db.query('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
        if (existing.length > 0) {
          slug += '-' + Date.now();
        }

        const published_at = data.status === 'published' ? new Date() : null;

        const [result] = await db.query(
          `INSERT INTO blog_posts 
           (title, slug, excerpt, content, featured_image, category_id, 
            author_name, author_email, author_avatar, status, is_featured, 
            read_time, meta_title, meta_description, published_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
            data.read_time || 5,
            data.meta_title || null,
            data.meta_description || null,
            published_at
          ]
        );

        const postId = result.insertId;

        if (data.tags && Array.isArray(data.tags)) {
          await addTagsToPost(postId, data.tags);
        }

        return res.json({ success: true, data: { id: postId, slug } });
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
          return res.json({ success: true, data: { id: result.insertId, slug } });
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
          return res.json({ success: true, data: { id: result.insertId, slug } });
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Tag name or slug already exists' });
          }
          throw err;
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Blog POST error:', error);
    return res.status(500).json({ error: 'Failed to create blog item' });
  }
});

/**
 * Handle PUT requests (mimicking PHP handlePut)
 */
router.put('/', checkRateLimit, async (req, res) => {
  const action = req.query.action || '';
  const id = req.query.id ? parseInt(req.query.id, 10) : null;
  const data = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'ID required for update' });
  }

  try {
    switch (action) {
      case 'posts': {
        const published_at = data.status === 'published' ? new Date() : null;

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
            data.read_time || 5,
            data.meta_title || null,
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
        await db.query(
          'UPDATE blog_categories SET name = ?, description = ?, color = ? WHERE id = ?',
          [data.name, data.description || null, data.color || '#3B82F6', id]
        );
        return res.json({ success: true, message: 'Category updated successfully' });
      }

      case 'tags': {
        await db.query(
          'UPDATE blog_tags SET name = ? WHERE id = ?',
          [data.name, id]
        );
        return res.json({ success: true, message: 'Tag updated successfully' });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Blog PUT error:', error);
    return res.status(500).json({ error: 'Failed to update blog item' });
  }
});

/**
 * Handle DELETE requests (mimicking PHP handleDelete)
 */
router.delete('/', checkRateLimit, async (req, res) => {
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
    console.error('Blog DELETE error:', error);
    return res.status(500).json({ error: 'Failed to delete blog item' });
  }
});

module.exports = router;
