import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import apiService from "../services/api";

const categories = [
  "All",
  "Web Development",
  "React",
  "SEO",
  "UI/UX",
  "Performance",
  "Backend",
  "Mobile"
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const [error, setError] = useState(null);

  // Load published posts from API
  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPosts(1, 100, selectedCategory === 'All' ? null : selectedCategory, 'published');
      if (response.success) {
        // Transform API data to match blog format
        const transformedPosts = response.data.posts.map(post => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          author: post.author_name || 'Admin User',
          date: new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          category: post.category,
          readTime: post.readTime || '5 min read',
          image: post.featured_image || `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80`,
          tags: Array.isArray(post.tags) ? post.tags : []
        }));
        setBlogPosts(transformedPosts);
      } else {
        setError(response.message || 'Failed to load posts');
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message || 'Failed to load posts. Please try again later.');
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter posts based on selected category
  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  // Get featured post (first post from filtered results)
  const featuredPost = filteredPosts[0];
  
  // Get remaining posts for the grid (excluding featured post)
  const gridPosts = filteredPosts.length > 1 
    ? filteredPosts.slice(1) 
    : [];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubStatus(null);
    setSubLoading(true);
    try {
      const response = await fetch("/api/subscribe.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSubStatus("success");
        setSubscriberEmail("");
      } else {
        setSubStatus(result.message || "error");
      }
    } catch (error) {
      setSubStatus("Failed to subscribe. Please try again later.");
    } finally {
      setSubLoading(false);
      setTimeout(() => setSubStatus(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Our Blog</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Insights, tutorials, and industry updates from our team of experts. 
            Stay ahead of the curve with the latest in web development and digital innovation.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-gray-200 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-blue-100/50 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-10 w-20 h-20 bg-purple-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`group relative px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="py-16 bg-white relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </section>
      )}

      {/* Featured Post */}
      {!loading && featuredPost && (
        <section className="py-16 bg-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 animate-fade-in-up">
              {selectedCategory === "All" ? "Featured Post" : `${selectedCategory} Posts`}
            </h2>
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
              <div className="md:flex">
                <div className="md:w-1/2 relative overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium group-hover:bg-blue-200 transition-colors duration-300">
                      {featuredPost.category}
                    </span>
                    <span className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors duration-300">{featuredPost.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-300">{featuredPost.excerpt}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(featuredPost.tags || []).slice(0, 4).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                        {featuredPost.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{featuredPost.author}</div>
                        <div className="text-sm text-gray-500">{featuredPost.date}</div>
                      </div>
                    </div>
                    <Link
                      to={`/blog/${featuredPost.id}`}
                      className="group/link bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 relative">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 animate-fade-in-up">
            {selectedCategory === "All" ? "Latest Posts" : `More ${selectedCategory} Posts`}
          </h2>
          {gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => (
                <article key={post.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium group-hover:bg-blue-200 transition-colors duration-300">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors duration-300">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">{post.excerpt}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(post.tags || []).slice(0, 3).map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors duration-300">{post.author}</div>
                          <div className="text-xs text-gray-500">{post.date}</div>
                        </div>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">
                {selectedCategory === "All" 
                  ? "No published posts available yet." 
                  : `No published posts in the ${selectedCategory} category.`
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 animate-fade-in-up">Stay Updated</h2>
          <p className="text-xl text-gray-300 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Get the latest insights and tutorials delivered to your inbox.
          </p>
          {subStatus === 'success' && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200 text-center">
              ✅ Thank you for subscribing!
            </div>
          )}
          {subStatus && subStatus !== 'success' && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 text-center">
              ❌ {subStatus}
            </div>
          )}
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 transition-transform duration-300"
              value={subscriberEmail}
              onChange={e => setSubscriberEmail(e.target.value)}
              required
              disabled={subLoading}
            />
            <button
              type="submit"
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={subLoading}
            >
              <span className="relative z-10">{subLoading ? 'Subscribing...' : 'Subscribe'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
} 