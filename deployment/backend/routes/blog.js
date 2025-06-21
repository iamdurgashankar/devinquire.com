import express from "express";
import multer from "multer";
import path from "path";
import { blogPosts } from "../blogData.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Get all blog posts
router.get("/", (req, res) => {
  try {
    res.json({
      success: true,
      data: blogPosts,
      count: blogPosts.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Get a single blog post
router.get("/:id", (req, res) => {
  try {
    const post = blogPosts.find((p) => p.id === Number(req.params.id));
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Create a new blog post
router.post("/", upload.single("image"), (req, res) => {
  try {
    const { title, content } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      image: req.file ? req.file.filename : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    blogPosts.unshift(newPost);

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: newPost,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Update a blog post
router.put("/:id", (req, res) => {
  try {
    const idx = blogPosts.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const { title, content } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    blogPosts[idx] = {
      ...blogPosts[idx],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: "Blog post updated successfully",
      data: blogPosts[idx],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// Delete a blog post
router.delete("/:id", (req, res) => {
  try {
    const idx = blogPosts.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const deletedPost = blogPosts.splice(idx, 1)[0];

    res.json({
      success: true,
      message: "Blog post deleted successfully",
      data: deletedPost,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

export default router;
