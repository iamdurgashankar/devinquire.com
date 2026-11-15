import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Clock, BookOpen, RefreshCw } from "lucide-react";
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import { responsiveSpacing, responsiveContainers } from '../utils/responsive';
import ModernCTA from '../components/ModernCTA';
import blogApiService from '../services/blogApiService';
import '../components/NewsletterShadowComponent';

const defaultCategories = [
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
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
    loadPosts();
  }, [selectedCategory]);
  
  const loadCategories = async () => {
    try {
      const categoriesData = await blogApiService.getCategories();
      const categoryNames = categoriesData
        .map(cat => typeof cat === 'string' ? cat : (cat.name || cat.category_name))
        .filter(Boolean);
      const uniqueNames = Array.from(new Set(categoryNames));
      setCategories(['All', ...uniqueNames]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options = {
        status: 'published',
        limit: 20,
        category: selectedCategory !== 'All' ? selectedCategory : undefined
      };
      
      const postsData = await blogApiService.getPosts(options);
      
      const transformedPosts = postsData.map(post => {
        let formattedDate = 'Recently published';
        try {
          const d = new Date(post.published_at || post.created_at);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
        } catch {
          // fallback
        }

        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          author: post.author_name || post.author || 'DevInquire Team',
          date: formattedDate,
          category: post.category_name || post.category || 'Uncategorized',
          readTime: post.read_time ? `${post.read_time} min read` : '5 min read',
          image: post.featured_image || `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80`,
          tags: Array.isArray(post.tags) ? post.tags : [],
          slug: post.slug || post.id
        };
      });
      setBlogPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message || 'Failed to load posts. Please try again later.');
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

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
        badge="Editorial"
        title="Insights & Tutorials"
        subtitle="Deep technical dives, architectural patterns, and product design notes from our engineering team."
      >
        {/* Sticky Apple Segmented Category Bar */}
        <section className="sticky top-[68px] z-30 py-3">
          <div className={responsiveContainers.standard}>
            <div className="apple-glass rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-fit">
              {categories.map((category, index) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      active
                        ? "bg-[#007AFF] text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <section className="py-16">
            <div className="max-w-lg mx-auto px-4">
              <div className="apple-card p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Unable to Load Editorial Feed</h3>
                <p className="text-[14px] text-[var(--text-secondary)] mb-6">{error}</p>
                <button
                  onClick={() => loadPosts()}
                  className="apple-pill-btn px-6 py-2.5 text-[14px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#007AFF] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[14px] text-[var(--text-secondary)]">Loading editorial articles...</p>
            </div>
          </section>
        )}

        {/* Featured Post */}
        {!loading && !error && featuredPost && (
          <section className="py-10">
            <div className={responsiveContainers.standard}>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                  {selectedCategory === "All" ? "Featured Story" : `${selectedCategory} Spotlight`}
                </h2>
              </div>

              <div className="group apple-card apple-card-interactive overflow-hidden">
                <div className="grid lg:grid-cols-12">
                  <div className="lg:col-span-6 relative overflow-hidden min-h-[280px] lg:min-h-[380px]">
                    <img
                      src={featuredPost.image}
                      alt={`Featured image for blog post: ${featuredPost.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="lg:col-span-6 p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF]">
                          {featuredPost.category}
                        </span>
                        <span className="flex items-center gap-1 text-[13px] text-[var(--text-tertiary)]">
                          <Clock className="w-3.5 h-3.5" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-[-0.025em] text-[var(--text-primary)] mb-4 group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-6">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {(featuredPost.tags || []).slice(0, 4).map((tag, tagIndex) => (
                          <span key={tagIndex} className="apple-subcard px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)] rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] flex items-center justify-center text-white text-[13px] font-bold">
                          {featuredPost.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-[var(--text-primary)]">{featuredPost.author}</div>
                          <div className="text-[12px] text-[var(--text-tertiary)]">{featuredPost.date}</div>
                        </div>
                      </div>
                      <Link
                        to={`/blog/${featuredPost.slug || featuredPost.id}`}
                        className="apple-pill-btn px-5 py-2.5 text-[13px]"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && (
          <section className={responsiveSpacing.sectionPadding}>
            <div className={responsiveContainers.standard}>
              {gridPosts.length > 0 && (
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-[var(--text-primary)] mb-8">
                  {selectedCategory === "All" ? "Latest Articles" : `More in ${selectedCategory}`}
                </h2>
              )}

              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((post) => (
                    <article key={post.id} className="group apple-card apple-card-interactive overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={post.image}
                            alt={`Blog post thumbnail for: ${post.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF]">
                              {post.category}
                            </span>
                            <span className="text-[12px] text-[var(--text-tertiary)]">{post.readTime}</span>
                          </div>
                          <h3 className="text-[18px] font-bold tracking-[-0.015em] text-[var(--text-primary)] mb-2.5 line-clamp-2 group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-[14px] text-[var(--text-secondary)] mb-4 line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {(post.tags || []).slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="apple-subcard px-2 py-0.5 text-[11px] text-[var(--text-secondary)] rounded-md">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] flex items-center justify-center text-white text-[11px] font-bold">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[var(--text-primary)]">{post.author}</div>
                            <div className="text-[11px] text-[var(--text-tertiary)]">{post.date}</div>
                          </div>
                        </div>
                        <Link
                          to={`/blog/${post.slug || post.id}`}
                          className="text-[#007AFF] dark:text-[#0A84FF] font-semibold text-[13px] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : !featuredPost && (
                <div className="apple-card p-12 text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Articles Found</h3>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    {selectedCategory === "All" 
                      ? "No published posts available yet." 
                      : `No published posts in the ${selectedCategory} category.`
                    }
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <ModernCTA 
          title="Stay Updated with Our Latest Insights"
          subtitle="Get engineering deep-dives, architecture notes, and product updates delivered straight to your inbox."
          primaryText="Subscribe Now"
          primaryLink="/contact"
          secondaryText="Explore Services"
          secondaryLink="/services"
        />
      </PageLayout>
    </>
  );
}
