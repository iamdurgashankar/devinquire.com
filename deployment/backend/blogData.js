// In-memory blog data storage
// TODO: Replace with database in production

export const blogPosts = [
  {
    id: 1,
    title: "Welcome to Devinquire",
    content:
      "Welcome to our development agency blog! We're excited to share insights about web development, design, and technology.",
    image: null,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: 2,
    title: "Getting Started with React",
    content:
      "React is a powerful JavaScript library for building user interfaces. In this post, we'll cover the basics of getting started with React development.",
    image: null,
    createdAt: "2024-01-16T14:30:00.000Z",
    updatedAt: "2024-01-16T14:30:00.000Z",
  },
];

// Helper functions for data management
export const addBlogPost = (post) => {
  const newPost = {
    id: Date.now(),
    ...post,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  blogPosts.unshift(newPost);
  return newPost;
};

export const updateBlogPost = (id, updates) => {
  const index = blogPosts.findIndex((post) => post.id === id);
  if (index !== -1) {
    blogPosts[index] = {
      ...blogPosts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return blogPosts[index];
  }
  return null;
};

export const deleteBlogPost = (id) => {
  const index = blogPosts.findIndex((post) => post.id === id);
  if (index !== -1) {
    return blogPosts.splice(index, 1)[0];
  }
  return null;
};

export const getBlogPost = (id) => {
  return blogPosts.find((post) => post.id === id);
};

export const getAllBlogPosts = () => {
  return [...blogPosts];
};
