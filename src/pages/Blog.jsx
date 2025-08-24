import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import apiService from "../services/api";
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import { responsiveTypography, responsiveSpacing, responsiveContainers } from '../utils/responsive';
import '../components/NewsletterShadowComponent';

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



  return (
    <>
      <SEO 
        title="Blog - Latest Web Development & Tech Insights"
        description="Stay updated with DevInquire's blog featuring the latest trends, insights, and best practices in web development, mobile apps, and digital innovation. Expert articles and tutorials."
        keywords="web development blog, tech insights, programming tutorials, mobile app development, digital innovation, coding best practices, technology trends"
        canonical="https://devinquire.com/blog"
        ogTitle="DevInquire Blog - Web Development Insights & Tech Trends"
        ogDescription="Expert insights on web development, mobile apps, and digital innovation. Stay updated with the latest trends and best practices."
        ogUrl="https://devinquire.com/blog"
      />
      <PageLayout
        title="Our Blog"
        subtitle="Insights, tutorials, and industry updates from our team of experts. Stay ahead of the curve with the latest in web development and digital innovation."
      >

      {/* Categories */}
      <section className={`${responsiveSpacing.sectionPaddingSmall} bg-white border-b border-gray-200 relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-blue-100/50 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-10 w-20 h-20 bg-purple-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className={`relative ${responsiveContainers.standard}`}>
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
                  <div className="absolute -inset-1 bg-[#0077b6] rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
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
                    alt={`Featured image for blog post: ${featuredPost.title}`}
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
                      <div className="w-10 h-10 bg-[#0077b6] rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                        {featuredPost.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{featuredPost.author}</div>
                        <div className="text-sm text-gray-500">{featuredPost.date}</div>
                      </div>
                    </div>
                    <Link
                      to={`/blog/${featuredPost.id}`}
                      className="group/link bg-[#0077b6] hover:bg-[#005a8a] text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
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
      <section className={`${responsiveSpacing.sectionPadding} relative`}>
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className={`relative ${responsiveContainers.standard}`}>
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
                      alt={`Blog post thumbnail for: ${post.title}`}
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
                    <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300`}>
                      {post.title}
                    </h3>
                    <p className={`${responsiveTypography.bodyBase} text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300`}>{post.excerpt}</p>
                    
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
                        <div className="w-8 h-8 bg-[#0077b6] rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors duration-300">{post.author}</div>
                          <div className="text-xs text-gray-500">{post.date}</div>
                        </div>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="text-[var(--primary)] hover:text-[var(--secondary)] font-medium text-sm group-hover:translate-x-1 transition-transform duration-300"
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

        {/* Newsletter Signup - Shadow DOM Component */}
        <section className={`${responsiveSpacing.sectionPadding}`}>
          <newsletter-shadow></newsletter-shadow>
        </section>
      </PageLayout>
    </>
  );
}