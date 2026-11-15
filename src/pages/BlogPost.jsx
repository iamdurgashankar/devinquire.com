import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Calendar, Tag, RefreshCw, BookOpen } from "lucide-react";
import SEO from '../components/SEO';
import ModernCTA from '../components/ModernCTA';
import blogApiService from '../services/blogApiService';

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const postData = await blogApiService.getPost(id);
      
      if (postData) {
        let formattedDate = 'Recently published';
        try {
          const d = new Date(postData.published_at || postData.created_at);
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

        setPost({
          id: postData.id,
          title: postData.title,
          excerpt: postData.excerpt,
          content: postData.content,
          author_name: postData.author_name || postData.author || 'DevInquire Team',
          created_at: formattedDate,
          updated_at: postData.updated_at,
          category: postData.category_name || postData.category || 'Uncategorized',
          featured_image: postData.featured_image || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80',
          tags: Array.isArray(postData.tags) ? postData.tags : [],
          readTime: postData.read_time ? `${postData.read_time} min read` : '5 min read',
          slug: postData.slug || postData.id
        });
      } else {
        setError('Post not found');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setError(error.message || 'Failed to load post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#007AFF] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[14px] text-[var(--text-secondary)]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="apple-card p-10 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {error ? 'Unable to Load Article' : 'Article Not Found'}
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6">
            {error || 'The blog post you are looking for does not exist or has been archived.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {error && (
              <button
                onClick={() => loadPost()}
                className="apple-pill-btn px-5 py-2.5 text-[14px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            <Link
              to="/blog"
              className="apple-secondary-btn px-5 py-2.5 text-[14px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${post.title} - DevInquire Blog`}
        description={post.excerpt || `Read ${post.title} on DevInquire blog. Expert insights on web development, mobile apps, and digital innovation.`}
        keywords={`${post.category}, ${post.title}, web development, programming, tech blog, ${Array.isArray(post.tags) ? post.tags.join(', ') : ''}`}
        canonical={`https://devinquire.com/blog/${post.slug || post.id}`}
        ogTitle={post.title}
        ogDescription={post.excerpt || `Read ${post.title} on DevInquire blog.`}
        ogUrl={`https://devinquire.com/blog/${post.slug || post.id}`}
        ogImage={post.featured_image}
        schemaType="BlogPosting"
        author={post.author_name || 'DevInquire Team'}
        datePublished={post.created_at}
        dateModified={post.updated_at || post.created_at}
        articleSection={post.category}
      />
      <div className="min-h-screen pt-28 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--text-secondary)] hover:text-[#007AFF] dark:hover:text-[#0A84FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Editorial Feed</span>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF]">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)]">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime || '5 min read'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)]">
                <Calendar className="w-3.5 h-3.5" />
                {post.created_at}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-[var(--text-primary)] leading-[1.12] mb-5">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3.5 pt-4 border-t border-[var(--border-subtle)]">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] flex items-center justify-center text-white font-bold text-[14px]">
                {(post.author_name || 'DevInquire Team').split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {post.author_name || 'DevInquire Team'}
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)]">
                  Engineering Editorial • DevInquire
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-10 rounded-[24px] overflow-hidden apple-card p-2">
              <img
                src={post.featured_image}
                alt={`Featured visual for article: ${post.title}`}
                className="w-full h-64 md:h-[420px] object-cover rounded-[18px]"
              />
            </div>
          )}

          {/* Reader Content Card */}
          <div className="apple-card p-8 md:p-12 mb-10">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed text-[16px]">
                {post.content}
              </div>
            </div>

            {/* Tags */}
            {(post.tags || []).length > 0 && (
              <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)] mb-3">
                  <Tag className="w-4 h-4 text-[#007AFF]" />
                  <span>Topics</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(post.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="apple-subcard px-3 py-1 text-[13px] font-medium text-[var(--text-secondary)] rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <ModernCTA
          title="Enjoyed This Engineering Breakdown?"
          subtitle="Explore more technical articles or speak directly with our systems architects."
          primaryText="Browse All Articles"
          primaryLink="/blog"
          secondaryText="Start a Project"
          secondaryLink="/contact"
        />
      </div>
    </>
  );
}
